import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Comment from '@/lib/models/Comment';
import Notification from '@/lib/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/comments/[id]/like - Curtir/descurtir comentário
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
    
    const comment = await Comment.findById(params.id);
    if (!comment) {
      return NextResponse.json(
        { error: 'Comentário não encontrado' },
        { status: 404 }
      );
    }
    
    const userId = session.user.id;
    const isLiked = comment.likes.includes(userId);
    
    if (isLiked) {
      // Remover like
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
      comment.likesCount = Math.max(0, comment.likesCount - 1);
    } else {
      // Adicionar like
      comment.likes.push(userId);
      comment.likesCount = comment.likesCount + 1;
      
      // Criar notificação se não for o próprio autor
      if (comment.author.toString() !== userId) {
        const notification = new Notification({
          type: 'like',
          sender: userId,
          recipient: comment.author,
          comment: comment._id,
          message: 'curtiu seu comentário'
        });
        await notification.save();
      }
    }
    
    await comment.save();
    
    return NextResponse.json({
      liked: !isLiked,
      likesCount: comment.likesCount
    });
  } catch (error) {
    console.error('Erro ao curtir/descurtir comentário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
