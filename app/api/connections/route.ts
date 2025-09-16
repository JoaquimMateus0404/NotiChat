import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ConnectionRequest from '@/lib/models/ConnectionRequest';
import User from '@/lib/models/User';
import Notification from '@/lib/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    const status = searchParams.get('status') || 'accepted';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    const userId = session.user.id;
    
    let query;
    if (status === 'pending') {
      // Solicitações pendentes recebidas
      query = { recipient: userId, status: 'pending' };
    } else if (status === 'sent') {
      // Solicitações enviadas
      query = { sender: userId, status: 'pending' };
    } else {
      // Conexões aceitas
      query = {
        $or: [
          { sender: userId, status: 'accepted' },
          { recipient: userId, status: 'accepted' }
        ]
      };
    }
    
    const connections = await ConnectionRequest.find(query)
      .populate('sender', 'name username profilePicture bio')
      .populate('recipient', 'name username profilePicture bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await ConnectionRequest.countDocuments(query);
    
    // Mapear para retornar apenas os dados do "outro" usuário
    const mappedConnections = connections.map(conn => {
      const otherUser = conn.sender._id.toString() === userId 
        ? conn.recipient 
        : conn.sender;
      
      return {
        _id: conn._id,
        user: otherUser,
        status: conn.status,
        createdAt: conn.createdAt
      };
    });
    
    return NextResponse.json({
      connections: mappedConnections,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
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
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId }
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
      sender: senderId,
      recipient: recipientId
    });
    
    await connectionRequest.save();
    
    // Criar notificação
    const notification = new Notification({
      type: 'connection_request',
      sender: senderId,
      recipient: recipientId,
      message: 'enviou uma solicitação de conexão'
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
