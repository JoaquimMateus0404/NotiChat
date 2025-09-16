"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePosts, useComments } from "@/hooks/use-posts"
import { useConnections } from "@/hooks/use-connections"
import { useSession } from "next-auth/react"

export function NewsFeed() {
  const { data: session } = useSession()
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set())
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostTags, setNewPostTags] = useState("")
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [showComments, setShowComments] = useState<Set<string>>(new Set())
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({})
  const [selectedPostForComments, setSelectedPostForComments] = useState<string | null>(null)
  
  const { posts, loading: postsLoading, createPost, toggleLike } = usePosts()
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
    if (newPostContent.trim() && session?.user) {
      const tags = newPostTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
      
      const success = await createPost(newPostContent, undefined, tags.length > 0 ? tags : undefined)
      
      if (success) {
        setNewPostContent("")
        setNewPostTags("")
        setIsCreatePostOpen(false)
      }
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
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" disabled>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Foto
                          </Button>
                          <Button variant="ghost" size="sm" disabled>
                            <Video className="h-4 w-4 mr-2" />
                            Vídeo
                          </Button>
                          <Button variant="ghost" size="sm" disabled>
                            <FileText className="h-4 w-4 mr-2" />
                            Documento
                          </Button>
                        </div>
                        <Button 
                          onClick={handleCreatePost} 
                          disabled={!newPostContent.trim()}
                        >
                          Publicar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

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
              .filter((post) => post.author && post.author._id) // Filtrar posts sem author
              .map((post) => {
              const isLiked = post.likes?.includes(session?.user?.id || '') || false
              const isOwn = post.author._id === session?.user?.id
              
              return (
                <Card key={post._id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
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
                            <h4 className="font-semibold text-foreground">{post.author.name}</h4>
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
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-foreground leading-relaxed whitespace-pre-line">{post.content}</p>

                    {post.image && (
                      <div className="rounded-lg overflow-hidden">
                        <img
                          src={post.image}
                          alt="Post content"
                          className="w-full h-64 object-cover"
                        />
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
