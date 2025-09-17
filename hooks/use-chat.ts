import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    profilePicture?: string;
  };
  conversation: string;
  type: 'text' | 'image' | 'file';
  attachments?: Array<{
    type: 'image' | 'video' | 'audio' | 'file'
    url: string
    fileName?: string
    fileSize?: number
    thumbnail?: string
  }>;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participant: {
    _id: string;
    name: string;
    username: string;
    profilePicture?: string;
  };
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export function useConversations() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (participantId: string) => {
    if (!session?.user) return null;
    
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId }),
      });
      
      if (response.ok) {
        const conversation = await response.json();
        setConversations(prev => [conversation, ...prev]);
        return conversation;
      }
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
    }
    
    return null;
  };

  useEffect(() => {
    fetchConversations();
  }, [session]);

  return {
    conversations,
    loading,
    refetch: fetchConversations,
    createConversation
  };
}

export function useMessages(conversationId: string | null) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    if (!conversationId || !session?.user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, type: string = 'text', attachments: string[] = []) => {
    if (!conversationId || !session?.user) return null;
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          type,
          attachments,
        }),
      });
      
      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        return message;
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
    
    return null;
  };

  useEffect(() => {
    fetchMessages();
  }, [conversationId, session]);

  return {
    messages,
    loading,
    sendMessage,
    refetch: fetchMessages
  };
}
