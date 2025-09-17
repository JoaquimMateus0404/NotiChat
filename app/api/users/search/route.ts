import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Força a rota a ser dinâmica
export const dynamic = 'force-dynamic';

// GET /api/users/search - Buscar usuários
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        users: [],
        message: 'Query muito curta'
      });
    }

    // Buscar usuários por nome ou username (case insensitive)
    const users = await User.find({
      $and: [
        { _id: { $ne: session.user.id } }, // Excluir o próprio usuário
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name username email profilePicture verified title')
    .limit(20)
    .sort({ name: 1 });

    return NextResponse.json({
      users,
      total: users.length
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
