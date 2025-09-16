"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRouter } from "next/navigation"
import {
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  Users,
  TrendingUp,
  ImageIcon,
  Video,
  FileText,
  Send,
  UserPlus,
  Check,
  X,
  Globe,
  Lock,
  UserCheck,
  Edit,
  Trash2,
  Flag,
  Copy,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePosts, useComments } from "@/hooks/use-posts"
import { useConnections } from "@/hooks/use-connections"
import { useSession } from "next-auth/react"

export function NewsFeed() {
  const { data: session } = useSession()
  const router = useRouter()
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set())
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostTags, setNewPostTags] = useState("")
  const [postVisibility, setPostVisibility] = useState<'public' | 'connections' | 'private'>('public')
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [showComments, setShowComments] = useState<Set<string>>(new Set())
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({})
  const [selectedPostForComments, setSelectedPostForComments] = useState<string | null>(null)
  
  // Estados para edição de post
  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [editPostContent, setEditPostContent] = useState("")
  const [editPostVisibility, setEditPostVisibility] = useState<'public' | 'connections' | 'private'>('public')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  // Estados para upload
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    url: string
    type: string
    name: string
  }>>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  
  // Refs para inputs de arquivo
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  
  const { posts, loading: postsLoading, createPost, editPost, deletePost, toggleLike } = usePosts()
  const { comments, addComment } = useComments(selectedPostForComments ?? '')
  const { 
    suggestedUsers, 
    connectionRequests, 
    sendConnectionRequest, 
    respondToRequest,
    loading: connectionsLoading 
  } = useConnections()

  const toggleBookmark = (postId: string) => {
    setBookmarkedPosts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  const handleCreatePost = async () => {
    if ((!newPostContent.trim() && uploadedFiles.length === 0) || !session?.user) {
      return
    }
    
    setIsCreatingPost(true)
    
    try {
      const tags = newPostTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
      
      const images = uploadedFiles
        .filter(file => file.type.startsWith('image/'))
        .map(file => file.url)
      
      const video = uploadedFiles.find(file => file.type.startsWith('video/'))?.url
      const document = uploadedFiles.find(file => 
        file.type.includes('pdf') || 
        file.type.includes('document') || 
        file.type.includes('text')
      )?.url
      
      const success = await createPost(
        newPostContent || '',
        images.length > 0 ? images : undefined,
        tags.length > 0 ? tags : undefined,
        video,
        document,
        postVisibility
      )
      
      if (success) {
        setNewPostContent("")
        setNewPostTags("")
        setPostVisibility('public')
        setUploadedFiles([])
        setIsCreatePostOpen(false)
      }
    } catch (error) {
      console.error('Erro ao criar post:', error)
    } finally {
      setIsCreatingPost(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const xhr = new XMLHttpRequest()
      
      return new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100
            setUploadProgress(progress)
          }
        })
        
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)
            setUploadedFiles(prev => [...prev, response])
            resolve()
          } else {
            reject(new Error('Erro no upload'))
          }
        })
        
        xhr.addEventListener('error', () => {
          reject(new Error('Erro no upload'))
        })
        
        xhr.open('POST', '/api/upload')
        xhr.send(formData)
      })
    } catch (error) {
      console.error('Erro no upload:', error)
      alert('Erro ao fazer upload do arquivo')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = (type: 'image' | 'video' | 'document') => {
    const input = type === 'image' ? imageInputRef.current :
                 type === 'video' ? videoInputRef.current :
                 documentInputRef.current
    
    if (input) {
      input.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFileUpload(file)
    }
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const navigateToProfile = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  const handleEditPost = (postId: string) => {
    const post = posts.find(p => p._id === postId)
    if (post && post.author._id === session?.user?.id) {
      setEditingPost(postId)
      setEditPostContent(post.content)
      setEditPostVisibility(post.visibility || 'public')
      setIsEditDialogOpen(true)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingPost || !editPostContent.trim()) return
    
    const success = await editPost(editingPost, editPostContent, undefined, editPostVisibility)
    if (success) {
      setIsEditDialogOpen(false)
      setEditingPost(null)
      setEditPostContent("")
      setEditPostVisibility('public')
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (confirm('Tem certeza que deseja excluir este post?')) {
      const success = await deletePost(postId)
      if (success) {
        alert('Post excluído com sucesso!')
      }
    }
  }

  const handleReportPost = async (postId: string) => {
    const reason = prompt('Motivo da denúncia:')
    if (reason && reason.trim()) {
      try {
        const response = await fetch(`/api/posts/${postId}/report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: reason.trim() }),
        })
        
        if (response.ok) {
          alert('Denúncia enviada com sucesso!')
        } else {
          alert('Erro ao enviar denúncia')
        }
      } catch (error) {
        console.error('Erro ao denunciar post:', error)
        alert('Erro ao enviar denúncia')
      }
    }
  }

  const handleCopyLink = (postId: string) => {
    const url = `${window.location.origin}/posts/${postId}`
    navigator.clipboard.writeText(url)
    alert('Link copiado!')
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-3 w-3" />
      case 'connections':
        return <UserCheck className="h-3 w-3" />
      case 'private':
        return <Lock className="h-3 w-3" />
      default:
        return <Globe className="h-3 w-3" />
    }
  }

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'Público'
      case 'connections':
        return 'Conexões'
      case 'private':
        return 'Privado'
      default:
        return 'Público'
    }
  }

  const toggleComments = (postId: string) => {
    setShowComments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
        setSelectedPostForComments(null)
      } else {
        newSet.add(postId)
        setSelectedPostForComments(postId)
      }
      return newSet
    })
  }

  const handleAddComment = async (postId: string) => {
    const commentText = newComment[postId]
    if (commentText?.trim() && selectedPostForComments === postId) {
      const success = await addComment(commentText)
      
      if (success) {
        setNewComment((prev) => ({
          ...prev,
          [postId]: "",
        }))
      }
    }
  }

  const handleShare = (postId: string) => {
    // Compartilhar post copiando o link
    navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`)
    alert("Link do post copiado!")
  }

  const handleConnect = async (userId: string) => {
    await sendConnectionRequest(userId)
  }

  const handleConnectionResponse = async (requestId: string, action: 'accept' | 'reject') => {
    await respondToRequest(requestId, action)
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardContent className="p-6">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Faça login para ver o feed</h3>
            <p className="text-muted-foreground">
              Você precisa estar logado para ver e criar posts.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="hidden lg:block">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Solicitações de Conexão
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {connectionRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente</p>
              ) : (
                connectionRequests
                  .filter((request) => request.requester && request.requester.name) // Filtrar requests sem requester
                  .slice(0, 3)
                  .map((request) => (
                  <div key={request._id} className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={request.requester?.profilePicture ?? "/placeholder.svg"} />
                        <AvatarFallback>
                          {request.requester?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-xs">{request.requester?.name ?? 'Nome não disponível'}</p>
                        <p className="text-xs text-muted-foreground">{request.requester?.title ?? 'Sem título'}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() => handleConnectionResponse(request._id, 'accept')}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() => handleConnectionResponse(request._id, 'reject')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar>
                  <AvatarImage src={session.user?.profilePicture ?? "/placeholder.svg"} />
                  <AvatarFallback>
                    {session.user?.name?.split(" ").map(n => n[0]).join("") ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start text-muted-foreground bg-transparent">
                      Compartilhe suas ideias profissionais...
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Criar post</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={session.user?.profilePicture ?? "/placeholder.svg"} />
                          <AvatarFallback>
                            {session.user?.name?.split(" ").map(n => n[0]).join("") ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{session.user?.name}</p>
                          <p className="text-sm text-muted-foreground">@{session.user?.email?.split('@')[0]}</p>
                        </div>
                      </div>
                      <Textarea
                        placeholder="Sobre o que você quer falar?"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="min-h-[120px] resize-none"
                      />
                      <Input
                        placeholder="Tags (separadas por vírgula): tech, innovation, startup"
                        value={newPostTags}
                        onChange={(e) => setNewPostTags(e.target.value)}
                      />
                      
                      {/* Seletor de visibilidade */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Visibilidade</label>
                        <Select value={postVisibility} onValueChange={(value: 'public' | 'connections' | 'private') => setPostVisibility(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">
                              <div className="flex items-center space-x-2">
                                <Globe className="h-4 w-4" />
                                <span>Público - Todos podem ver</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="connections">
                              <div className="flex items-center space-x-2">
                                <UserCheck className="h-4 w-4" />
                                <span>Conexões - Apenas suas conexões</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="private">
                              <div className="flex items-center space-x-2">
                                <Lock className="h-4 w-4" />
                                <span>Privado - Apenas você</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Arquivos carregados */}
                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Arquivos anexados:</p>
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                              <div className="flex items-center space-x-2">
                                {file.type.startsWith('image/') && (
                                  <img src={file.url} alt={file.name} className="w-10 h-10 object-cover rounded" />
                                )}
                                {file.type.startsWith('video/') && (
                                  <Video className="h-5 w-5" />
                                )}
                                {(!file.type.startsWith('image/') && !file.type.startsWith('video/')) && (
                                  <FileText className="h-5 w-5" />
                                )}
                                <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Progress bar para upload */}
                      {isUploading && (
                        <div className="space-y-2">
                          <p className="text-sm">Fazendo upload...</p>
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      )}
                      
                      {/* Progress bar para criar post */}
                      {isCreatingPost && (
                        <div className="space-y-2">
                          <p className="text-sm">Publicando post...</p>
                          <Progress value={100} className="h-2" />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleFileSelect('image')}
                            disabled={isUploading || isCreatingPost}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Foto
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleFileSelect('video')}
                            disabled={isUploading || isCreatingPost}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Vídeo
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleFileSelect('document')}
                            disabled={isUploading || isCreatingPost}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Documento
                          </Button>
                        </div>
                        <Button 
                          onClick={handleCreatePost} 
                          disabled={
                            (!newPostContent.trim() && uploadedFiles.length === 0) || 
                            isUploading || 
                            isCreatingPost
                          }
                        >
                          {isCreatingPost ? 'Publicando...' : 'Publicar'}
                        </Button>
                      </div>
                      
                      {/* Inputs de arquivo ocultos */}
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <input
                        ref={documentInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Dialog de Edição de Post */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Editar post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={session.user?.profilePicture ?? "/placeholder.svg"} />
                    <AvatarFallback>
                      {session.user?.name?.split(" ").map(n => n[0]).join("") ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{session.user?.name}</p>
                    <p className="text-sm text-muted-foreground">@{session.user?.email?.split('@')[0]}</p>
                  </div>
                </div>
                <Textarea
                  placeholder="Sobre o que você quer falar?"
                  value={editPostContent}
                  onChange={(e) => setEditPostContent(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                
                {/* Seletor de visibilidade */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visibilidade</label>
                  <Select value={editPostVisibility} onValueChange={(value: 'public' | 'connections' | 'private') => setEditPostVisibility(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4" />
                          <span>Público - Todos podem ver</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="connections">
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-4 w-4" />
                          <span>Conexões - Apenas suas conexões</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center space-x-2">
                          <Lock className="h-4 w-4" />
                          <span>Privado - Apenas você</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-end space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveEdit} 
                    disabled={!editPostContent.trim()}
                  >
                    Salvar alterações
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Posts */}
          {(() => {
            if (postsLoading) {
              return (
                <Card>
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 animate-spin" />
                    <p className="text-muted-foreground">Carregando posts...</p>
                  </CardContent>
                </Card>
              )
            }
            
            if (posts.length === 0) {
              return (
                <Card>
                  <CardContent className="p-6 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum post ainda</h3>
                    <p className="text-muted-foreground">
                      Seja o primeiro a compartilhar algo interessante!
                    </p>
                  </CardContent>
                </Card>
              )
            }
            
            return posts
              .filter((post) => {
                // Filtrar posts sem author
                if (!post.author || !post.author._id) return false
                
                // Filtrar por visibilidade
                const userId = session?.user?.id
                const isOwn = post.author._id === userId
                
                switch (post.visibility) {
                  case 'private':
                    return isOwn // Apenas o próprio autor vê posts privados
                  case 'connections':
                    // TODO: Implementar verificação de conexão
                    // Por enquanto, vamos mostrar todos os posts de conexões
                    return isOwn || true // Temporário: mostra para todos
                  case 'public':
                  default:
                    return true // Posts públicos são visíveis para todos
                }
              })
              .map((post) => {
              const isLiked = post.likes?.includes(session?.user?.id || '') || false
              const isOwn = post.author._id === session?.user?.id
              
              return (
                <Card key={post._id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar 
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigateToProfile(post.author._id)}
                        >
                          <AvatarImage src={post.author.profilePicture ?? "/placeholder.svg"} />
                          <AvatarFallback>
                            {post.author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 
                              className="font-semibold text-foreground cursor-pointer hover:underline"
                              onClick={() => navigateToProfile(post.author._id)}
                            >
                              {post.author.name}
                            </h4>
                            {post.author.verified && (
                              <Badge variant="secondary" className="text-xs">
                                Verificado
                              </Badge>
                            )}
                            {isOwn && (
                              <Badge variant="outline" className="text-xs">
                                Você
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">@{post.author.username}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>
                              {new Date(post.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              {getVisibilityIcon(post.visibility || 'public')}
                              <span>{getVisibilityText(post.visibility || 'public')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48" align="end">
                          <div className="space-y-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => handleCopyLink(post._id)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar link
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => window.open(`/posts/${post._id}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Abrir em nova aba
                            </Button>
                            {isOwn ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => handleEditPost(post._id)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar post
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-destructive hover:text-destructive"
                                  onClick={() => handleDeletePost(post._id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir post
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-destructive hover:text-destructive"
                                onClick={() => handleReportPost(post._id)}
                              >
                                <Flag className="h-4 w-4 mr-2" />
                                Denunciar post
                              </Button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-foreground leading-relaxed whitespace-pre-line">{post.content}</p>

                    {/* Imagens */}
                    {post.images && post.images.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-lg overflow-hidden">
                        {post.images.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-64 object-cover"
                          />
                        ))}
                      </div>
                    )}

                    {/* Imagem única (compatibilidade) */}
                    {post.image && (!post.images || post.images.length === 0) && (
                      <div className="rounded-lg overflow-hidden">
                        <img
                          src={post.image}
                          alt="Post content"
                          className="w-full h-64 object-cover"
                        />
                      </div>
                    )}

                    {/* Vídeo */}
                    {post.video && (
                      <div className="rounded-lg overflow-hidden">
                        <video
                          controls
                          className="w-full h-64 object-cover"
                          preload="metadata"
                        >
                          <source src={post.video} type="video/mp4" />
                          Seu navegador não suporta o elemento de vídeo.
                        </video>
                      </div>
                    )}

                    {/* Documento */}
                    {post.document && (
                      <div className="border rounded-lg p-4 bg-muted">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Documento anexado</p>
                            <a 
                              href={post.document} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Clique para visualizar
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <Badge key={`${post._id}-${tag}`} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLike(post._id)}
                          className={cn("flex items-center space-x-2", isLiked && "text-accent")}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span>{post.likes?.length || 0}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-2"
                          onClick={() => toggleComments(post._id)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments?.length || 0}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-2"
                          onClick={() => handleShare(post._id)}
                        >
                          <Share2 className="h-4 w-4" />
                          <span>{post.shares?.length || 0}</span>
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBookmark(post._id)}
                        className={cn(bookmarkedPosts.has(post._id) && "text-accent")}
                      >
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>

                    {showComments.has(post._id) && (
                      <div className="space-y-4 pt-4 border-t border-border">
                        {comments.map((comment) => (
                          <div key={comment._id} className="flex space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.author.profilePicture ?? "/placeholder.svg"} />
                              <AvatarFallback>
                                {comment.author.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-muted rounded-lg p-3">
                                <p className="font-medium text-sm">{comment.author.name}</p>
                                <p className="text-sm text-foreground">{comment.content}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(comment.createdAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        ))}

                        <div className="flex space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={session.user?.profilePicture ?? "/placeholder.svg"} />
                            <AvatarFallback>
                              {session.user?.name?.split(" ").map(n => n[0]).join("") ?? "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex space-x-2">
                            <Input
                              placeholder="Escrever um comentário..."
                              value={newComment[post._id] || ""}
                              onChange={(e) =>
                                setNewComment((prev) => ({
                                  ...prev,
                                  [post._id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAddComment(post._id)
                                }
                              }}
                            />
                            <Button 
                              size="sm" 
                              onClick={() => handleAddComment(post._id)} 
                              disabled={!newComment[post._id]?.trim()}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          })()}
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Conexões Sugeridas
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                if (connectionsLoading) {
                  return (
                    <div className="text-center py-4">
                      <Users className="h-6 w-6 mx-auto mb-2 animate-pulse" />
                      <p className="text-sm text-muted-foreground">Carregando...</p>
                    </div>
                  )
                }
                
                if (suggestedUsers.length === 0) {
                  return (
                    <div className="text-center py-4">
                      <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">Nenhuma sugestão no momento</p>
                    </div>
                  )
                }
                
                return suggestedUsers
                  .filter((user) => user && user._id && user.name) // Filtrar usuários inválidos
                  .slice(0, 5)
                  .map((user) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profilePicture ?? "/placeholder.svg"} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                        {user.title && (
                          <p className="text-xs text-muted-foreground">{user.title}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {user.connectionCount} conexões
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleConnect(user._id)}
                    >
                      Conectar
                    </Button>
                  </div>
                ))
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
