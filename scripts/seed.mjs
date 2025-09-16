import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

// Conectar ao MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Definir schemas diretamente no script
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: String,
  coverPhoto: String,
  bio: String,
  location: String,
  website: String,
  joinedAt: { type: Date, default: Date.now },
  friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isVerified: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

UserSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const PostSchema = new Schema({
  content: { type: String, required: true, maxlength: 2000 },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  images: [String],
  visibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  shares: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 }
}, { timestamps: true });

const CommentSchema = new Schema({
  content: { type: String, required: true, maxlength: 500 },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  likesCount: { type: Number, default: 0 }
}, { timestamps: true });

const ConnectionRequestSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  message: String
}, { timestamps: true });

// Criar modelos
const User = mongoose.models.User || model('User', UserSchema);
const Post = mongoose.models.Post || model('Post', PostSchema);
const Comment = mongoose.models.Comment || model('Comment', CommentSchema);
const ConnectionRequest = mongoose.models.ConnectionRequest || model('ConnectionRequest', ConnectionRequestSchema);

// Dados de exemplo
const sampleUsers = [
  {
    name: 'Ana Silva',
    email: 'ana@example.com',
    username: 'anasilva',
    password: '123456',
    bio: 'Desenvolvedora Full Stack apaixonada por tecnologia',
    location: 'São Paulo, SP',
    profilePicture: '/professional-woman-smiling.png'
  },
  {
    name: 'Carlos Santos',
    email: 'carlos@example.com',
    username: 'carlossantos',
    password: '123456',
    bio: 'Designer UX/UI criando experiências incríveis',
    location: 'Rio de Janeiro, RJ',
    profilePicture: '/professional-man-smiling.png'
  },
  {
    name: 'Mariana Costa',
    email: 'mariana@example.com',
    username: 'marianacosta',
    password: '123456',
    bio: 'Product Manager focada em inovação',
    location: 'Belo Horizonte, MG',
    profilePicture: '/smiling-professional-woman.png'
  },
  {
    name: 'João Oliveira',
    email: 'joao@example.com',
    username: 'joaooliveira',
    password: '123456',
    bio: 'Engenheiro de Software e mentor',
    location: 'Porto Alegre, RS',
    profilePicture: '/professional-headshot.png'
  },
  {
    name: 'Fernanda Lima',
    email: 'fernanda@example.com',
    username: 'fernandalima',
    password: '123456',
    bio: 'Data Scientist explorando insights',
    location: 'Brasília, DF'
  }
];

const samplePosts = [
  {
    content: 'Acabei de lançar meu novo projeto! Um dashboard para análise de dados em tempo real. O que acham? 🚀',
    visibility: 'public'
  },
  {
    content: 'Participei de uma conferência incrível sobre IA hoje. As possibilidades são infinitas! #IA #TechConf',
    visibility: 'public'
  },
  {
    content: 'Dica do dia: sempre teste seu código antes de fazer deploy. Aprendi isso da forma mais difícil 😅',
    visibility: 'public'
  },
  {
    content: 'Trabalhando em um novo design system. A consistência visual é fundamental para uma boa UX!',
    visibility: 'public'
  },
  {
    content: 'Reflexão do final de semana: equilibrar vida pessoal e profissional é uma arte que ainda estou aprendendo.',
    visibility: 'friends'
  }
];

const sampleComments = [
  'Parabéns! Projeto incrível! 👏',
  'Muito interessante, quando vai estar disponível?',
  'Adorei o design, muito clean!',
  'Excelente trabalho, continue assim!',
  'Que demais! Vou compartilhar com minha equipe.',
  'Inspirador! Mal posso esperar para testar.',
  'Concordo totalmente, testing é essencial!',
  'Essa dica salvou minha carreira algumas vezes 😄',
  'Design systems são o futuro!',
  'Verdade, work-life balance é super importante.'
];

async function seedDatabase() {
  try {
    console.log('🔗 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Limpar banco de dados
    console.log('🗑️  Limpando banco de dados...');
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await ConnectionRequest.deleteMany({});
    console.log('✅ Banco de dados limpo');

    // Criar usuários
    console.log('👥 Criando usuários...');
    const users = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
      console.log(`✅ Usuário criado: ${user.name} (@${user.username})`);
    }

    // Criar conexões entre usuários
    console.log('🤝 Criando conexões entre usuários...');
    const connections = [
      { sender: users[0]._id, recipient: users[1]._id, status: 'accepted' },
      { sender: users[0]._id, recipient: users[2]._id, status: 'accepted' },
      { sender: users[1]._id, recipient: users[2]._id, status: 'accepted' },
      { sender: users[1]._id, recipient: users[3]._id, status: 'accepted' },
      { sender: users[2]._id, recipient: users[4]._id, status: 'pending' },
      { sender: users[3]._id, recipient: users[4]._id, status: 'pending' }
    ];

    for (const connData of connections) {
      const connection = new ConnectionRequest(connData);
      await connection.save();
      
      // Se conexão aceita, adicionar aos amigos
      if (connData.status === 'accepted') {
        await User.findByIdAndUpdate(connData.sender, {
          $addToSet: { friends: connData.recipient }
        });
        await User.findByIdAndUpdate(connData.recipient, {
          $addToSet: { friends: connData.sender }
        });
      }
    }
    console.log('✅ Conexões criadas');

    // Criar posts
    console.log('📝 Criando posts...');
    const posts = [];
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = {
        ...samplePosts[i],
        author: users[i % users.length]._id
      };
      
      const post = new Post(postData);
      await post.save();
      posts.push(post);
      console.log(`✅ Post criado por ${users[i % users.length].name}`);
    }

    // Criar curtidas nos posts
    console.log('❤️  Adicionando curtidas aos posts...');
    for (const post of posts) {
      const likersCount = Math.floor(Math.random() * 4) + 1; // 1-4 curtidas
      const likers = users
        .filter(user => user._id.toString() !== post.author.toString())
        .sort(() => 0.5 - Math.random())
        .slice(0, likersCount);
      
      post.likes = likers.map(user => user._id);
      post.likesCount = likers.length;
      await post.save();
    }

    // Criar comentários
    console.log('💬 Criando comentários...');
    for (const post of posts) {
      const commentsCount = Math.floor(Math.random() * 3) + 1; // 1-3 comentários
      
      for (let i = 0; i < commentsCount; i++) {
        const commentAuthor = users[Math.floor(Math.random() * users.length)];
        const commentContent = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        
        const comment = new Comment({
          content: commentContent,
          author: commentAuthor._id,
          post: post._id
        });
        
        await comment.save();
        
        // Adicionar comentário ao post
        post.comments.push(comment._id);
        post.commentsCount++;
        
        // Algumas curtidas nos comentários
        if (Math.random() > 0.5) {
          const likers = users
            .filter(user => user._id.toString() !== commentAuthor._id.toString())
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.floor(Math.random() * 2) + 1);
          
          comment.likes = likers.map(user => user._id);
          comment.likesCount = likers.length;
          await comment.save();
        }
      }
      
      await post.save();
    }

    console.log('🎉 Seed concluído com sucesso!');
    console.log(`📊 Resumo:`);
    console.log(`   👥 ${users.length} usuários criados`);
    console.log(`   📝 ${posts.length} posts criados`);
    console.log(`   🤝 ${connections.length} conexões criadas`);
    console.log(`   💬 Comentários e curtidas adicionados`);
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexão fechada');
  }
}

seedDatabase();
