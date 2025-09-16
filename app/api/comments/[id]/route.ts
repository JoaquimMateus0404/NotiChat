import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Comment } from '@/lib/models/Comment';
import { Post } from '@/lib/models/Post';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT /api/comments/[id] - Atualizar comentário
export async function PUT(
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
    
    // Verificar se o usuário é o autor do comentário
    if (comment.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a editar este comentário' },
        { status: 403 }
      );
    }
    
    const { content } = await request.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Conteúdo do comentário é obrigatório' },
        { status: 400 }
      );
    }
    
    comment.content = content.trim();
    comment.updatedAt = new Date();
    
    await comment.save();
    await comment.populate('author', 'name username profilePicture');
    
    return NextResponse.json(comment);
  } catch (error) {
    console.error('Erro ao atualizar comentário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - Deletar comentário
export async function DELETE(
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
    
    // Verificar se o usuário é o autor do comentário
    if (comment.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a deletar este comentário' },
        { status: 403 }
      );
    }
    
    // Remover comentário do post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id },
      $inc: { commentsCount: -1 }
    });
    
    await Comment.findByIdAndDelete(params.id);
    
    return NextResponse.json(
      { message: 'Comentário deletado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
