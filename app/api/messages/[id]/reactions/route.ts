import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Message } from '@/lib/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/messages/[id]/reactions - Adicionar reação
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

    const { emoji } = await request.json();
    
    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji é obrigatório' },
        { status: 400 }
      );
    }

    const message = await Message.findById(params.id);
    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se já existe uma reação com este emoji
    const emojiReactionIndex = message.reactions.findIndex(
      (reaction: any) => reaction.emoji === emoji
    );

    if (emojiReactionIndex > -1) {
      // Verificar se o usuário já reagiu com este emoji
      const userIndex = message.reactions[emojiReactionIndex].users.findIndex(
        (userId: any) => userId.toString() === session.user.id
      );

      if (userIndex > -1) {
        // Remover reação do usuário
        message.reactions[emojiReactionIndex].users.splice(userIndex, 1);
        
        // Se não há mais usuários com esta reação, remover a reação inteira
        if (message.reactions[emojiReactionIndex].users.length === 0) {
          message.reactions.splice(emojiReactionIndex, 1);
        }
      } else {
        // Adicionar usuário à reação existente
        message.reactions[emojiReactionIndex].users.push(session.user.id);
      }
    } else {
      // Criar nova reação
      message.reactions.push({
        emoji,
        users: [session.user.id]
      });
    }

    await message.save();
    
    // Popular dados do usuário
    await message.populate('reactions.users', 'name username profilePicture');

    return NextResponse.json({
      messageId: message._id,
      reactions: message.reactions
    });
  } catch (error) {
    console.error('Erro ao processar reação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/messages/[id]/reactions - Buscar reações da mensagem
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

    const message = await Message.findById(params.id)
      .populate('reactions.users', 'name username profilePicture')
      .select('reactions');

    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem não encontrada' },
        { status: 404 }
      );
    }

    // Formatar reações
    const formattedReactions = message.reactions.map((reaction: any) => ({
      emoji: reaction.emoji,
      count: reaction.users.length,
      users: reaction.users.map((user: any) => ({
        _id: user._id,
        name: user.name,
        username: user.username,
        profilePicture: user.profilePicture
      })),
      hasUserReacted: reaction.users.some((user: any) => user._id.toString() === session.user.id)
    }));

    return NextResponse.json({
      messageId: message._id,
      reactions: formattedReactions
    });
  } catch (error) {
    console.error('Erro ao buscar reações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
