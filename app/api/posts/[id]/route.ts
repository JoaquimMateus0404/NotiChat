import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Post } from '@/lib/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/posts/[id] - Buscar post por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const post = await Post.findById(params.id)
      .populate('author', 'name username profilePicture')
      .populate('likes', 'name username')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name username profilePicture'
        }
      });
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('Erro ao buscar post:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - Atualizar post
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
    
    const post = await Post.findById(params.id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário é o autor do post
    if (post.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a editar este post' },
        { status: 403 }
      );
    }
    
    const { content, images, visibility } = await request.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Conteúdo do post é obrigatório' },
        { status: 400 }
      );
    }
    
    post.content = content.trim();
    if (images !== undefined) post.images = images;
    if (visibility !== undefined) post.visibility = visibility;
    post.updatedAt = new Date();
    
    await post.save();
    await post.populate('author', 'name username profilePicture');
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('Erro ao atualizar post:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Deletar post
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
    
    const post = await Post.findById(params.id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário é o autor do post
    if (post.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado a deletar este post' },
        { status: 403 }
      );
    }
    
    await Post.findByIdAndDelete(params.id);
    
    return NextResponse.json(
      { message: 'Post deletado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao deletar post:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
