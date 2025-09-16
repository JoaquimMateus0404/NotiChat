import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Conversation } from '@/lib/models/Conversation';
import { Message } from '@/lib/models/Message';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Força a rota a ser dinâmica
export const dynamic = 'force-dynamic';

// GET /api/conversations/[id]/messages - Buscar mensagens da conversa
export async function GET(
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
    
    // Verificar se o usuário participa da conversa
    const conversation = await Conversation.findById(params.id);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }
    
    if (!conversation.participants.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'Não autorizado a acessar esta conversa' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    const messages = await Message.find({ conversation: params.id })
      .populate('sender', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Message.countDocuments({ conversation: params.id });
    
    // Marcar mensagens como lidas
    await Message.updateMany(
      {
        conversation: params.id,
        sender: { $ne: session.user.id },
        readBy: { $ne: session.user.id }
      },
      {
        $addToSet: { readBy: session.user.id }
      }
    );
    
    // Resetar contador de não lidas para este usuário
    const unreadCount = conversation.unreadCount || new Map();
    unreadCount.set(session.user.id, 0);
    conversation.unreadCount = unreadCount;
    await conversation.save();
    
    return NextResponse.json({
      messages: messages.reverse(), // Inverter para ordem cronológica
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Enviar mensagem
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
    
    // Verificar se o usuário participa da conversa
    const conversation = await Conversation.findById(params.id);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }
    
    if (!conversation.participants.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'Não autorizado a enviar mensagem nesta conversa' },
        { status: 403 }
      );
    }
    
    const { content, type = 'text', attachments = [] } = await request.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Conteúdo da mensagem é obrigatório' },
        { status: 400 }
      );
    }
    
    // Criar mensagem
    const message = new Message({
      content: content.trim(),
      sender: session.user.id,
      conversation: params.id,
      type,
      attachments,
      readBy: [session.user.id] // Marcar como lida pelo remetente
    });
    
    await message.save();
    
    // Atualizar conversa
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    
    // Incrementar contador de não lidas para outros participantes
    const unreadCount = conversation.unreadCount || new Map();
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== session.user.id) {
        const current = unreadCount.get(participantId.toString()) || 0;
        unreadCount.set(participantId.toString(), current + 1);
      }
    });
    conversation.unreadCount = unreadCount;
    
    await conversation.save();
    
    // Popular dados do remetente
    await message.populate('sender', 'name username profilePicture');
    
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
