import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Post } from '@/lib/models/Post';
import { Comment } from '@/lib/models/Comment';
import { Notification } from '@/lib/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/posts/[id]/comments - Buscar comentários do post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    const comments = await Comment.find({ post: params.id })
      .populate('author', 'name username profilePicture')
      .populate('likes', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Comment.countDocuments({ post: params.id });
    
    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/posts/[id]/comments - Criar comentário
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
    
    const { content } = await request.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Conteúdo do comentário é obrigatório' },
        { status: 400 }
      );
    }
    
    const comment = new Comment({
      content: content.trim(),
      author: session.user.id,
      post: params.id
    });
    
    await comment.save();
    
    // Adicionar comentário ao post
    post.comments.push(comment._id);
    post.commentsCount = post.commentsCount + 1;
    await post.save();
    
    // Criar notificação se não for o próprio autor
    if (post.author.toString() !== session.user.id) {
      const notification = new Notification({
        type: 'comment',
        sender: session.user.id,
        recipient: post.author,
        post: post._id,
        comment: comment._id,
        message: 'comentou em seu post'
      });
      await notification.save();
    }
    
    // Popular dados do autor para retornar
    await comment.populate('author', 'name username profilePicture');
    
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
