import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/posts/[id]/report - Denunciar post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { reason, description } = await request.json();
    
    if (!reason) {
      return NextResponse.json(
        { error: 'Motivo da denúncia é obrigatório' },
        { status: 400 }
      );
    }
    
    // Por enquanto, apenas logamos a denúncia
    // Em uma implementação real, você salvaria isso no banco de dados
    console.log('Denúncia recebida:', {
      postId: params.id,
      reportedBy: session.user.id,
      reason,
      description,
      reportedAt: new Date()
    });
    
    return NextResponse.json(
      { message: 'Denúncia enviada com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao processar denúncia:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
