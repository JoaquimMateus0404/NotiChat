"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  MapPin,
  Calendar,
  LinkIcon,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Award,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Edit3,
  Users,
  Eye,
  ArrowLeft,
} from "lucide-react"
import { currentUserProfile, experiences, education, skills, certifications } from "@/lib/sample-data"
import { useSession } from "next-auth/react"
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
  company?: string
  phone?: string
  verified?: boolean
  friendsCount: number
  createdAt: string
}

interface Post {
  _id: string
  content: string
  author: {
    _id: string
    name: string
    username: string
    profilePicture?: string
  }
  images?: string[]
  video?: string
  document?: string
  tags?: string[]
  likes: string[]
  comments: string[]
  createdAt: string
}

interface ProfilePageProps {
  userId?: string // Se não fornecido, mostra o perfil do usuário logado
}

export function ProfilePage({ userId }: ProfilePageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedProfile, setEditedProfile] = useState({
    bio: "",
    location: "",
    website: "",
  })
  
  // Estados para buscar dados do usuário
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  
  // Determinar se é o próprio perfil
  const isOwnProfile = !userId || userId === session?.user?.id
  
  // ID do usuário a ser carregado
  const targetUserId = userId || session?.user?.id

  const fetchUserData = async () => {
    if (!targetUserId) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${targetUserId}`)
      if (!response.ok) throw new Error('Usuário não encontrado')
      
      const userData = await response.json()
      setUser(userData.user)
      
      // Inicializar dados de edição com os dados atuais
      setEditedProfile({
        bio: userData.user.bio || "",
        location: userData.user.location || "",
        website: userData.user.website || "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPosts = async () => {
    if (!targetUserId) return
    
    try {
      setPostsLoading(true)
      const response = await fetch(`/api/posts?userId=${targetUserId}`)
      if (!response.ok) throw new Error('Erro ao carregar posts')
      
      const data = await response.json()
      setUserPosts(data.posts || [])
    } catch (err) {
      console.error('Erro ao carregar posts:', err)
    } finally {
      setPostsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!isOwnProfile || !user) return
    
    try {
      setIsUpdatingProfile(true)
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile),
      })
      
      if (!response.ok) throw new Error('Erro ao atualizar perfil')
      
      const updatedUser = await response.json()
      setUser(updatedUser)
      setIsEditingProfile(false)
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      alert('Erro ao salvar as alterações')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  useEffect(() => {
    // Aguarda a sessão carregar antes de buscar dados
    if (userId) {
      // Se tem userId específico, busca imediatamente
      fetchUserData()
    } else if (session?.user?.id) {
      // Se é perfil próprio, busca quando sessão estiver disponível
      fetchUserData()
    } else if (session === null) {
      // Se sessão carregou mas não está logado
      setError('Você precisa estar logado para ver seu perfil')
      setLoading(false)
    }
  }, [userId, session])

  useEffect(() => {
    if (user) {
      fetchUserPosts()
    }
  }, [user])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Carregando perfil...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar perfil</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Se não tem sessão e está tentando ver o próprio perfil (sem userId)
  if (!userId && !session?.user?.id && session !== undefined) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Acesso negado</h3>
            <p className="text-muted-foreground mb-4">Você precisa estar logado para ver seu perfil</p>
            <Button onClick={() => router.push('/auth/signin')}>
              Fazer login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user || !user.name) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Perfil não encontrado</h3>
            <p className="text-muted-foreground mb-4">Não foi possível carregar os dados do perfil</p>
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Botão de voltar - só aparece quando há um userId específico (não é o próprio perfil) */}
      {userId && (
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      )}

      {/* Cover Photo and Profile Header */}
      <Card className="mb-6">
        <div className="relative">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-accent/20 to-primary/20 rounded-t-lg"></div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6">
              {/* Avatar */}
              <div className="relative -mt-16 mb-4 sm:mb-0">
                <Avatar className="h-32 w-32 border-4 border-background">
                  <AvatarImage src={user.profilePicture || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Name and Title */}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                  {user.verified && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Verificado
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">@{user.username}</p>
                <p className="text-lg text-muted-foreground">{user.title || "Título não informado"}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Building className="h-4 w-4" />
                  {user.company || "Empresa não informada"}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {user.location || "Localização não informada"}
                </p>
              </div>

              {/* Action Buttons - baseado no controle de acesso */}
              <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                {isOwnProfile ? (
                  // Own profile - show edit button
                  <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Editar Perfil
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                      <DialogHeader>
                        <DialogTitle>Editar Perfil</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Bio</label>
                          <Textarea
                            value={editedProfile.bio}
                            onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                            placeholder="Conte sobre você..."
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Localização</label>
                          <Input
                            value={editedProfile.location}
                            onChange={(e) => setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Sua localização"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Website</label>
                          <Input
                            value={editedProfile.website}
                            onChange={(e) => setEditedProfile(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="Seu website"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleSaveProfile} 
                            disabled={isUpdatingProfile}
                          >
                            {isUpdatingProfile ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  // Other's profile - show follow/message buttons
                  <>
                    <Button onClick={() => setIsFollowing(!isFollowing)} variant={isFollowing ? "outline" : "default"}>
                      <Users className="h-4 w-4 mr-2" />
                      {isFollowing ? "Seguindo" : "Conectar"}
                    </Button>
                    <Button variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Mensagem
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <p className="font-semibold text-foreground">{user.friendsCount || 0}</p>
                <p className="text-sm text-muted-foreground">Conexões</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">{userPosts.length}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">1.2k</p>
                <p className="text-sm text-muted-foreground">Visualizações do perfil</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-foreground">About</h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {user.bio || "Nenhuma bio informada ainda."}
              </p>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-foreground">Contact Info</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Email só aparece no próprio perfil */}
              {isOwnProfile && user.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{user.email}</span>
                </div>
              )}
              {user.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{user.phone}</span>
                </div>
              )}
              {user.website && (
                <div className="flex items-center space-x-3">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {user.website}
                  </a>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Entrou em {new Date(user.createdAt).toLocaleDateString('pt-BR', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              
              {/* Se não há informações de contato */}
              {!user.email && !user.phone && !user.website && !isOwnProfile && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma informação de contato pública disponível.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-foreground">Skills</h3>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="activity" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4">
              {postsLoading ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">Carregando posts...</p>
                  </CardContent>
                </Card>
              ) : userPosts.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      {isOwnProfile ? 'Você ainda não fez nenhum post.' : 'Este usuário ainda não fez nenhum post.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                userPosts.map((post) => (
                  <Card key={post._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.author.profilePicture || "/placeholder.svg"} />
                          <AvatarFallback>
                            {post.author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-sm text-foreground">{post.author.name}</h4>
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground mt-2 leading-relaxed">{post.content}</p>
                          
                          {/* Tags */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {post.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Images */}
                          {post.images && post.images.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 rounded-lg overflow-hidden">
                              {post.images.map((img, index) => (
                                <img
                                  key={index}
                                  src={img}
                                  alt={`Post image ${index + 1}`}
                                  className="w-full h-32 object-cover"
                                />
                              ))}
                            </div>
                          )}

                          {/* Video */}
                          {post.video && (
                            <div className="mt-3 rounded-lg overflow-hidden">
                              <video
                                controls
                                className="w-full h-48 object-cover"
                                preload="metadata"
                              >
                                <source src={post.video} type="video/mp4" />
                                Seu navegador não suporta o elemento de vídeo.
                              </video>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 mt-3">
                            <Button variant="ghost" size="sm" className="text-xs">
                              👍 {post.likes.length}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs">
                              💬 {post.comments.length}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs">
                              <Share2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="experience" className="space-y-4">
              {experiences.map((exp) => (
                <Card key={exp.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                        <Building className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{exp.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {exp.company} • {exp.location}
                        </p>
                        <p className="text-xs text-muted-foreground">{exp.duration}</p>
                        <p className="text-sm text-foreground mt-2 leading-relaxed">{exp.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="education" className="space-y-4">
              {education.map((edu) => (
                <Card key={edu.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{edu.degree}</h4>
                        <p className="text-sm text-muted-foreground">{edu.school}</p>
                        <p className="text-xs text-muted-foreground">{edu.duration}</p>
                        <p className="text-sm text-foreground mt-2 leading-relaxed">{edu.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="certifications" className="space-y-4">
              {certifications.map((cert, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                        <Award className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{cert.name}</h4>
                        <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                        <p className="text-xs text-muted-foreground">Issued {cert.date}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
