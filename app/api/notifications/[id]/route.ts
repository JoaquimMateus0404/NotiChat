import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT /api/notifications/[id] - Marcar notificação como lida
export async function PUT(
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
    
    const notification = await Notification.findById(params.id);
    if (!notification) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se a notificação pertence ao usuário
    if (notification.recipient.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a marcar esta notificação' },
        { status: 403 }
      );
    }
    
    notification.read = true;
    await notification.save();
    
    return NextResponse.json({
      message: 'Notificação marcada como lida'
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Deletar notificação
export async function DELETE(
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
    
    const notification = await Notification.findById(params.id);
    if (!notification) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se a notificação pertence ao usuário
    if (notification.recipient.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a deletar esta notificação' },
        { status: 403 }
      );
    }
    
    await Notification.findByIdAndDelete(params.id);
    
    return NextResponse.json(
      { message: 'Notificação deletada com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
