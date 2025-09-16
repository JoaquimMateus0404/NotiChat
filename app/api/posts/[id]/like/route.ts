import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Post, Notification } from '@/lib/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/posts/[id]/like - Curtir/descurtir post
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
    
    const post = await Post.findById(params.id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      );
    }
    
    const userId = session.user.id;
    const isLiked = post.likes.includes(userId);
    
    if (isLiked) {
      // Remover like
      post.likes = post.likes.filter(id => id.toString() !== userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      // Adicionar like
      post.likes.push(userId);
      post.likesCount = post.likesCount + 1;
      
      // Criar notificação se não for o próprio autor
      if (post.author.toString() !== userId) {
        const notification = new Notification({
          type: 'like',
          sender: userId,
          recipient: post.author,
          post: post._id,
          message: 'curtiu seu post'
        });
        await notification.save();
      }
    }
    
    await post.save();
    
    return NextResponse.json({
      liked: !isLiked,
      likesCount: post.likesCount
    });
  } catch (error) {
    console.error('Erro ao curtir/descurtir post:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
