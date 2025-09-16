"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Calendar, Link as LinkIcon, Users, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserProfile {
  _id: string
  name: string
  username: string
  email: string
  profilePicture?: string
  bio?: string
  title?: string
  location?: string
  website?: string
  verified?: boolean
  connectionCount: number
  createdAt: string
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const userId = params.id as string

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`)
        if (!response.ok) throw new Error('Usuário não encontrado')
        
        const userData = await response.json()
        setUser(userData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar perfil')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUser()
    }
  }, [userId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Carregando perfil...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar perfil</h3>
            <p className="text-muted-foreground mb-4">{error || 'Usuário não encontrado'}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.profilePicture ?? "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">
                {user.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                {user.verified && (
                  <Badge variant="secondary">Verificado</Badge>
                )}
              </div>
              
              <p className="text-muted-foreground">@{user.username}</p>
              
              {user.title && (
                <p className="text-lg text-foreground">{user.title}</p>
              )}
              
              {user.bio && (
                <p className="text-muted-foreground">{user.bio}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {user.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{user.location}</span>
                  </div>
                )}
                
                {user.website && (
                  <div className="flex items-center space-x-1">
                    <LinkIcon className="h-4 w-4" />
                    <a 
                      href={user.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Entrou em {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{user.connectionCount}</span>
                  <span className="text-muted-foreground">conexões</span>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-2">
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Conectar
                </Button>
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Mensagem
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Posts recentes</h3>
            <p className="text-muted-foreground text-center py-8">
              Os posts deste usuário aparecerão aqui em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
