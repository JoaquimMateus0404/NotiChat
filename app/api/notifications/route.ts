import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Notification } from '@/lib/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/notifications - Buscar notificações do usuário
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    
    const skip = (page - 1) * limit;
    
    let query = { recipient: session.user.id };
    if (unreadOnly) {
      query = { ...query, read: false };
    }
    
    const notifications = await Notification.find(query)
      .populate('sender', 'name username profilePicture')
      .populate('post', 'content')
      .populate('comment', 'content')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: session.user.id,
      read: false
    });
    
    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Marcar todas como lidas
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    await Notification.updateMany(
      { recipient: session.user.id, read: false },
      { read: true }
    );
    
    return NextResponse.json({
      message: 'Todas as notificações foram marcadas como lidas'
    });
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
