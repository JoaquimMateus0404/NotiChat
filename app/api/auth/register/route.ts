import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  username: z.string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username pode conter apenas letras, números e underscore'),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra minúscula, maiúscula e um número'),
  title: z.string().min(2, 'Título profissional é obrigatório'),
  company: z.string().optional(),
  location: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    
    await connectDB()
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: validatedData.email.toLowerCase() },
        { username: validatedData.username.toLowerCase() }
      ]
    })
    
    if (existingUser) {
      return NextResponse.json(
        { 
          error: existingUser.email === validatedData.email.toLowerCase() 
            ? 'Email já está em uso' 
            : 'Username já está em uso' 
        },
        { status: 400 }
      )
    }
    
    // Create new user
    const newUser = new User({
      name: validatedData.name.trim(),
      email: validatedData.email.toLowerCase(),
      username: validatedData.username.toLowerCase(),
      password: validatedData.password,
      title: validatedData.title.trim(),
      company: validatedData.company?.trim(),
      location: validatedData.location?.trim()
    })
    
    await newUser.save()
    
    // Remove password from response
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      username: newUser.username,
      title: newUser.title,
      company: newUser.company,
      location: newUser.location,
      avatar: newUser.avatar,
      verified: newUser.verified
    }
    
    return NextResponse.json(
      { 
        message: 'Usuário criado com sucesso!',
        user: userResponse
      },
      { status: 201 }
    )
    
  } catch (error) {
    console.error('Register error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return NextResponse.json(
        { error: `${field === 'email' ? 'Email' : 'Username'} já está em uso` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
