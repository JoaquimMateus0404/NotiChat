import mongoose from 'mongoose';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

async function resetDatabase() {
  try {
    console.log('🔗 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    console.log('🗑️  Limpando banco de dados...');
    
    // Obter todas as coleções
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Deletar todas as coleções
    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
      console.log(`✅ Coleção ${collection.name} removida`);
    }
    
    console.log('🎉 Banco de dados resetado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o reset:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexão fechada');
  }
}

resetDatabase();
