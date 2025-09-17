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

    // Verificar se já existe uma reação deste usuário com este emoji
    const existingReactionIndex = message.reactions.findIndex(
      (reaction: any) => reaction.user.toString() === session.user.id && reaction.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      // Remover reação existente
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Adicionar nova reação
      message.reactions.push({
        emoji,
        user: session.user.id,
        createdAt: new Date()
      });
    }

    await message.save();
    
    // Popular dados do usuário
    await message.populate('reactions.user', 'name username profilePicture');

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
      .populate('reactions.user', 'name username profilePicture')
      .select('reactions');

    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem não encontrada' },
        { status: 404 }
      );
    }

    // Agrupar reações por emoji
    const groupedReactions = message.reactions.reduce((acc: any, reaction: any) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          hasUserReacted: false
        };
      }
      
      acc[reaction.emoji].count += 1;
      acc[reaction.emoji].users.push({
        _id: reaction.user._id,
        name: reaction.user.name,
        username: reaction.user.username,
        profilePicture: reaction.user.profilePicture
      });
      
      if (reaction.user._id.toString() === session.user.id) {
        acc[reaction.emoji].hasUserReacted = true;
      }
      
      return acc;
    }, {});

    return NextResponse.json({
      messageId: message._id,
      reactions: Object.values(groupedReactions)
    });
  } catch (error) {
    console.error('Erro ao buscar reações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
