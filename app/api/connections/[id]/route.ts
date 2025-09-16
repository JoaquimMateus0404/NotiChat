import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ConnectionRequest, User, Notification } from '@/lib/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT /api/connections/[id] - Aceitar/rejeitar solicitação de conexão
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
    
    const { action } = await request.json(); // 'accept' ou 'reject'
    
    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida. Use "accept" ou "reject"' },
        { status: 400 }
      );
    }
    
    const connectionRequest = await ConnectionRequest.findById(params.id);
    if (!connectionRequest) {
      return NextResponse.json(
        { error: 'Solicitação de conexão não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário é o destinatário da solicitação
    if (connectionRequest.recipient.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a responder esta solicitação' },
        { status: 403 }
      );
    }
    
    if (connectionRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Esta solicitação já foi respondida' },
        { status: 400 }
      );
    }
    
    if (action === 'accept') {
      connectionRequest.status = 'accepted';
      
      // Adicionar cada usuário à lista de amigos do outro
      await User.findByIdAndUpdate(connectionRequest.sender, {
        $addToSet: { friends: connectionRequest.recipient }
      });
      
      await User.findByIdAndUpdate(connectionRequest.recipient, {
        $addToSet: { friends: connectionRequest.sender }
      });
      
      // Criar notificação de aceitação
      const notification = new Notification({
        type: 'connection_accepted',
        sender: session.user.id,
        recipient: connectionRequest.sender,
        message: 'aceitou sua solicitação de conexão'
      });
      await notification.save();
    } else {
      connectionRequest.status = 'rejected';
    }
    
    await connectionRequest.save();
    
    return NextResponse.json({
      message: action === 'accept' 
        ? 'Solicitação aceita com sucesso' 
        : 'Solicitação rejeitada',
      status: connectionRequest.status
    });
  } catch (error) {
    console.error('Erro ao responder solicitação de conexão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/connections/[id] - Remover conexão
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
    
    const connectionRequest = await ConnectionRequest.findById(params.id);
    if (!connectionRequest) {
      return NextResponse.json(
        { error: 'Conexão não encontrada' },
        { status: 404 }
      );
    }
    
    const userId = session.user.id;
    
    // Verificar se o usuário faz parte desta conexão
    if (
      connectionRequest.sender.toString() !== userId &&
      connectionRequest.recipient.toString() !== userId
    ) {
      return NextResponse.json(
        { error: 'Não autorizado a remover esta conexão' },
        { status: 403 }
      );
    }
    
    // Remover conexão entre os usuários
    const otherUserId = connectionRequest.sender.toString() === userId 
      ? connectionRequest.recipient 
      : connectionRequest.sender;
    
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: otherUserId }
    });
    
    await User.findByIdAndUpdate(otherUserId, {
      $pull: { friends: userId }
    });
    
    // Deletar o registro de conexão
    await ConnectionRequest.findByIdAndDelete(params.id);
    
    return NextResponse.json(
      { message: 'Conexão removida com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao remover conexão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
