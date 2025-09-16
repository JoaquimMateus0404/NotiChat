import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import Post from '@/lib/models/Post';
import ConnectionRequest from '@/lib/models/ConnectionRequest';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/users/[id] - Buscar perfil do usuário
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const user = await User.findById(params.id)
      .select('-password -email')
      .populate('friends', 'name username profilePicture');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Contar posts do usuário
    const postsCount = await Post.countDocuments({ author: params.id });
    
    // Se houver usuário logado, verificar status de conexão
    let connectionStatus = null;
    const session = await getServerSession(authOptions);
    
    if (session?.user?.id && session.user.id !== params.id) {
      const connection = await ConnectionRequest.findOne({
        $or: [
          { sender: session.user.id, recipient: params.id },
          { sender: params.id, recipient: session.user.id }
        ]
      });
      
      if (connection) {
        if (connection.status === 'accepted') {
          connectionStatus = 'friends';
        } else if (connection.sender.toString() === session.user.id) {
          connectionStatus = 'sent';
        } else {
          connectionStatus = 'received';
        }
      } else {
        connectionStatus = 'none';
      }
    }
    
    return NextResponse.json({
      user: {
        ...user.toObject(),
        postsCount,
        friendsCount: user.friends.length
      },
      connectionStatus
    });
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Atualizar perfil do usuário
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
    
    // Verificar se o usuário está tentando editar seu próprio perfil
    if (session.user.id !== params.id) {
      return NextResponse.json(
        { error: 'Não autorizado a editar este perfil' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    const { name, bio, location, website, profilePicture, coverPhoto } = await request.json();
    
    // Validações
    if (name && name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome deve ter pelo menos 2 caracteres' },
        { status: 400 }
      );
    }
    
    if (bio && bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio não pode ter mais que 500 caracteres' },
        { status: 400 }
      );
    }
    
    // Atualizar campos
    if (name !== undefined) user.name = name.trim();
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (coverPhoto !== undefined) user.coverPhoto = coverPhoto;
    
    user.updatedAt = new Date();
    
    await user.save();
    
    // Retornar usuário sem dados sensíveis
    const updatedUser = await User.findById(params.id).select('-password -email');
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
