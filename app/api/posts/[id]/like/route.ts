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
    } else {
      // Adicionar like
      post.likes.push(userId);
      
      // Criar notificação se não for o próprio autor
      if (post.author.toString() !== userId) {
        const notification = new Notification({
          type: 'like',
          title: 'Nova curtida',
          sender: userId,
          recipient: post.author,
          message: 'curtiu seu post',
          data: {
            postId: post._id.toString()
          }
        });
        await notification.save();
      }
    }

    await post.save();
    
    // Retornar o post completo com populate do author
    const updatedPost = await Post.findById(params.id)
      .populate('author', 'name username profilePicture verified title');

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Erro ao curtir/descurtir post:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
