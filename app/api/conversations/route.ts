import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Conversation } from '@/lib/models/Conversation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/conversations - Buscar conversas do usuário
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
    
    const conversations = await Conversation.find({
      participants: session.user.id
    })
    .populate('participants', 'name username profilePicture')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });
    
    // Mapear conversas para incluir informações úteis
    const mappedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== session.user.id
      );
      
      return {
        _id: conv._id,
        participant: otherParticipant,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount?.get(session.user.id) ?? 0,
        updatedAt: conv.updatedAt
      };
    });
    
    return NextResponse.json(mappedConversations);
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Criar nova conversa
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
    
    const { participantId } = await request.json();
    
    if (!participantId) {
      return NextResponse.json(
        { error: 'ID do participante é obrigatório' },
        { status: 400 }
      );
    }
    
    if (participantId === session.user.id) {
      return NextResponse.json(
        { error: 'Não é possível criar conversa consigo mesmo' },
        { status: 400 }
      );
    }
    
    // Verificar se já existe uma conversa entre esses usuários
    const existingConversation = await Conversation.findOne({
      participants: { $all: [session.user.id, participantId] },
      isGroup: false
    });
    
    if (existingConversation) {
      await existingConversation.populate('participants', 'name username profilePicture');
      return NextResponse.json(existingConversation);
    }
    
    // Criar nova conversa
    const conversation = new Conversation({
      participants: [session.user.id, participantId],
      isGroup: false
    });
    
    await conversation.save();
    await conversation.populate('participants', 'name username profilePicture');
    
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
