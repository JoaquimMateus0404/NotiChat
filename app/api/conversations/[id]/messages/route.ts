import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Conversation, Message } from '@/lib/models';
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'desc'; // desc = mais recentes primeiro
    const skip = (page - 1) * limit;
    
    // Contar total de mensagens
    const totalCount = await Message.countDocuments({ conversation: params.id });
    
    // Buscar mensagens com paginação
    const sortOrder = sort === 'asc' ? 1 : -1;
    const messages = await Message.find({ conversation: params.id })
      .populate('sender', 'name username profilePicture')
      .populate('reactions.users', 'name username')
      .populate('readBy.user', 'name username')
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const hasMore = skip + messages.length < totalCount;
    
    // Marcar mensagens como lidas
    const messagesToMarkAsRead = await Message.find({
      conversation: params.id,
      sender: { $ne: session.user.id },
      'readBy.user': { $ne: session.user.id }
    });

    for (const message of messagesToMarkAsRead) {
      message.readBy.push({
        user: session.user.id,
        readAt: new Date()
      });
      await message.save();
    }
    
    return NextResponse.json({
      messages,
      hasMore,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
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
      messageType: type,
      attachments,
      readBy: [{ user: session.user.id, readAt: new Date() }] // Marcar como lida pelo remetente
    });
    
    await message.save();
    
    // Atualizar conversa
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    
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
