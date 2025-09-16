import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import User from '@/lib/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/posts - Buscar posts
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');
    
    const skip = (page - 1) * limit;
    
    let query = {};
    if (userId) {
      query = { author: userId };
    }
    
    const posts = await Post.find(query)
      .populate('author', 'name username profilePicture')
      .populate('likes', 'name username')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name username profilePicture'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Post.countDocuments(query);
    
    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Criar novo post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { content, images, visibility = 'public' } = await request.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Conteúdo do post é obrigatório' },
        { status: 400 }
      );
    }
    
    const post = new Post({
      content: content.trim(),
      author: session.user.id,
      images: images || [],
      visibility
    });
    
    await post.save();
    
    // Popular os dados do autor para retornar
    await post.populate('author', 'name username profilePicture');
    
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar post:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
