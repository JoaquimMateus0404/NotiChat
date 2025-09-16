import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ConnectionRequest, User, Notification } from '@/lib/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Força a rota a ser dinâmica
export const dynamic = 'force-dynamic';

// GET /api/connections - Buscar conexões do usuário
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
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    
    const userId = session.user.id;
    
    // Buscar conexões aceitas
    const acceptedQuery = {
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    };
    
    const acceptedConnections = await ConnectionRequest.find(acceptedQuery)
      .populate('requester', 'name username profilePicture bio title connectionCount')
      .populate('recipient', 'name username profilePicture bio title connectionCount')
      .sort({ createdAt: -1 });
    
    // Buscar solicitações pendentes recebidas
    const pendingQuery = { recipient: userId, status: 'pending' };
    const pendingRequests = await ConnectionRequest.find(pendingQuery)
      .populate('requester', 'name username profilePicture bio title')
      .sort({ createdAt: -1 });
    
    // Mapear conexões aceitas
    const mappedConnections = acceptedConnections.map(conn => {
      const otherUser = conn.requester._id.toString() === userId 
        ? conn.recipient 
        : conn.requester;
      
      return {
        _id: otherUser._id,
        ...otherUser.toObject()
      };
    });
    
    // Mapear solicitações pendentes
    const mappedRequests = pendingRequests.map(request => ({
      _id: request._id,
      requester: request.requester,
      status: request.status,
      createdAt: request.createdAt
    }));
    
    return NextResponse.json({
      connections: mappedConnections,
      requests: mappedRequests
    });
  } catch (error) {
    console.error('Erro ao buscar conexões:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/connections - Enviar solicitação de conexão
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { recipientId } = await request.json();
    const senderId = session.user.id;
    
    if (!recipientId) {
      return NextResponse.json(
        { error: 'ID do destinatário é obrigatório' },
        { status: 400 }
      );
    }
    
    if (senderId === recipientId) {
      return NextResponse.json(
        { error: 'Não é possível conectar consigo mesmo' },
        { status: 400 }
      );
    }
    
    // Verificar se o usuário destinatário existe
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se já existe uma conexão ou solicitação
    const existingConnection = await ConnectionRequest.findOne({
      $or: [
        { requester: senderId, recipient: recipientId },
        { requester: recipientId, recipient: senderId }
      ]
    });
    
    if (existingConnection) {
      if (existingConnection.status === 'accepted') {
        return NextResponse.json(
          { error: 'Vocês já são amigos' },
          { status: 400 }
        );
      } else if (existingConnection.status === 'pending') {
        return NextResponse.json(
          { error: 'Solicitação de conexão já enviada' },
          { status: 400 }
        );
      }
    }
    
    // Criar nova solicitação de conexão
    const connectionRequest = new ConnectionRequest({
      requester: senderId,
      recipient: recipientId
    });
    
    await connectionRequest.save();
    
    // Criar notificação
    const notification = new Notification({
      type: 'connection_request',
      title: 'Nova solicitação de conexão',
      sender: senderId,
      recipient: recipientId,
      message: 'enviou uma solicitação de conexão',
      data: {
        connectionRequestId: connectionRequest._id.toString()
      }
    });
    await notification.save();
    
    await connectionRequest.populate('recipient', 'name username profilePicture');
    
    return NextResponse.json(connectionRequest, { status: 201 });
  } catch (error) {
    console.error('Erro ao enviar solicitação de conexão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
