const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

// Import models
const { User } = require('../lib/models/User')
const { Post } = require('../lib/models/Post')
const { Comment } = require('../lib/models/Comment')

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

const sampleUsers = [
  {
    name: 'Ana Silva',
    email: 'ana@example.com',
    username: 'anasilva',
    password: 'Password123',
    title: 'UX/UI Designer',
    company: 'Design Studio',
    location: 'São Paulo, SP',
    bio: 'Designer apaixonada por criar experiências incríveis para usuários.',
    verified: true
  },
  {
    name: 'Carlos Santos',
    email: 'carlos@example.com',
    username: 'carlossantos',
    password: 'Password123',
    title: 'Product Manager',
    company: 'TechCorp',
    location: 'Rio de Janeiro, RJ',
    bio: 'Gerente de produto com foco em inovação e crescimento.',
    verified: false
  },
  {
    name: 'Maria Oliveira',
    email: 'maria@example.com',
    username: 'mariaoliveira',
    password: 'Password123',
    title: 'Backend Developer',
    company: 'StartupX',
    location: 'Belo Horizonte, MG',
    bio: 'Desenvolvedora backend especializada em Node.js e Python.',
    verified: true
  },
  {
    name: 'João Costa',
    email: 'joao@example.com',
    username: 'joaocosta',
    password: 'Password123',
    title: 'Data Scientist',
    company: 'DataLab',
    location: 'Porto Alegre, RS',
    bio: 'Cientista de dados apaixonado por machine learning e IA.',
    verified: false
  }
]

const samplePosts = [
  {
    content: '🚀 Acabei de lançar meu novo projeto! Uma plataforma de design colaborativo que vai revolucionar a forma como equipes trabalham juntas. #design #inovacao #startup',
    tags: ['design', 'inovacao', 'startup']
  },
  {
    content: 'Reflexão do dia: A tecnologia deve servir às pessoas, não o contrário. Como podemos garantir que nossos produtos sejam verdadeiramente úteis? 🤔 #tech #produto #ux',
    tags: ['tech', 'produto', 'ux']
  },
  {
    content: 'Compartilhando minha experiência implementando microserviços em Node.js. Os desafios foram grandes, mas os resultados compensaram! 💻 #nodejs #microservices #backend',
    tags: ['nodejs', 'microservices', 'backend']
  },
  {
    content: 'Análise interessante sobre o futuro do trabalho remoto baseada em dados reais. O que vocês acham? Remote work is here to stay! 📊 #datascience #remotework #futuro',
    tags: ['datascience', 'remotework', 'futuro']
  }
]

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error)
    process.exit(1)
  }
}

async function clearDatabase() {
  try {
    await User.deleteMany({})
    await Post.deleteMany({})
    await Comment.deleteMany({})
    console.log('🗑️  Database cleared')
  } catch (error) {
    console.error('❌ Error clearing database:', error)
  }
}

async function createUsers() {
  try {
    console.log('👥 Creating users...')
    
    const users = []
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      const user = new User({
        ...userData,
        password: hashedPassword
      })
      await user.save()
      users.push(user)
      console.log(`✅ Created user: ${user.name}`)
    }
    
    return users
  } catch (error) {
    console.error('❌ Error creating users:', error)
    return []
  }
}

async function createPosts(users) {
  try {
    console.log('📝 Creating posts...')
    
    const posts = []
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = samplePosts[i]
      const author = users[i % users.length]
      
      const post = new Post({
        author: author._id,
        content: postData.content,
        tags: postData.tags,
        visibility: 'public'
      })
      
      await post.save()
      posts.push(post)
      console.log(`✅ Created post by ${author.name}`)
    }
    
    return posts
  } catch (error) {
    console.error('❌ Error creating posts:', error)
    return []
  }
}

async function createConnections(users) {
  try {
    console.log('🤝 Creating connections...')
    
    // Make some users follow each other
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const connectionsToMake = users.filter((_, index) => index !== i).slice(0, 2)
      
      for (const connection of connectionsToMake) {
        if (!user.connections.includes(connection._id)) {
          user.connections.push(connection._id)
          user.following.push(connection._id)
          
          connection.connections.push(user._id)
          connection.followers.push(user._id)
        }
      }
      
      await user.save()
    }
    
    // Save all users
    for (const user of users) {
      await user.save()
    }
    
    console.log('✅ Created connections between users')
  } catch (error) {
    console.error('❌ Error creating connections:', error)
  }
}

async function addInteractionsToPosts(posts, users) {
  try {
    console.log('❤️ Adding likes and comments to posts...')
    
    for (const post of posts) {
      // Add random likes
      const likeCount = Math.floor(Math.random() * users.length)
      const usersToLike = users.slice(0, likeCount)
      
      for (const user of usersToLike) {
        if (!post.likes.includes(user._id)) {
          post.likes.push(user._id)
        }
      }
      
      // Add some comments
      const commentCount = Math.floor(Math.random() * 3) + 1
      for (let i = 0; i < commentCount; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)]
        const commentTexts = [
          'Excelente post! Muito interessante.',
          'Concordo totalmente com sua visão.',
          'Obrigado por compartilhar essa experiência!',
          'Inspirador! Parabéns pelo trabalho.',
          'Ótima reflexão, me fez pensar muito.'
        ]
        const randomComment = commentTexts[Math.floor(Math.random() * commentTexts.length)]
        
        const comment = new Comment({
          author: randomUser._id,
          post: post._id,
          content: randomComment
        })
        
        await comment.save()
        post.comments.push(comment._id)
      }
      
      await post.save()
      console.log(`✅ Added interactions to post by ${post.author}`)
    }
  } catch (error) {
    console.error('❌ Error adding interactions:', error)
  }
}

async function seedDatabase() {
  try {
    await connectDB()
    
    console.log('🌱 Starting database seeding...')
    
    // Clear existing data
    await clearDatabase()
    
    // Create sample data
    const users = await createUsers()
    const posts = await createPosts(users)
    await createConnections(users)
    await addInteractionsToPosts(posts, users)
    
    console.log('🎉 Database seeding completed successfully!')
    console.log(`📊 Created:`)
    console.log(`   - ${users.length} users`)
    console.log(`   - ${posts.length} posts`)
    console.log(`   - Random connections and interactions`)
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  }
}

if (require.main === module) {
  seedDatabase()
}

module.exports = { seedDatabase }
