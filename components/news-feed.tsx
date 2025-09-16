"use client"

import { useState, useEffect } from "react"
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
  Heart,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { samplePosts, trendingTopics, suggestedConnections } from "@/lib/sample-data"
import { usePosts, useCurrentUser, useNotifications } from "@/lib/app-context"

export function NewsFeed() {
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set())
  const [newPostContent, setNewPostContent] = useState("")
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [comments, setComments] = useState<{
    [key: number]: Array<{ id: number; author: string; content: string; time: string }>
  }>({})
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({})
  const [showComments, setShowComments] = useState<Set<number>>(new Set())
  
  const { posts, addPost, toggleLike: togglePostLike, addComment: addPostComment } = usePosts()
  const currentUser = useCurrentUser()
  const { addNotification } = useNotifications()
  const [allPosts, setAllPosts] = useState(samplePosts)

  // Combine sample posts with user posts
  useEffect(() => {
    setAllPosts([...posts, ...samplePosts])
  }, [posts])

  const toggleLike = (postId: number) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
        // Add notification
        addNotification({
          type: 'like',
          message: `Você curtiu um post`,
          time: 'Agora',
          read: false
        })
      }
      return newSet
    })
    
    // Also update global state
    togglePostLike(postId)
  }

  const toggleBookmark = (postId: number) => {
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

  const handleCreatePost = () => {
    if (newPostContent.trim() && currentUser) {
      addPost(newPostContent)
      setNewPostContent("")
      setIsCreatePostOpen(false)
      
      // Add notification
      addNotification({
        type: 'like',
        message: `Novo post criado com sucesso!`,
        time: 'Agora',
        read: false
      })
    }
  }

  const toggleComments = (postId: number) => {
    setShowComments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
        // Initialize comments for this post if not exists
        if (!comments[postId]) {
          setComments((prev) => ({
            ...prev,
            [postId]: [
              {
                id: 1,
                author: "Sarah Johnson",
                content: "Great insights! Thanks for sharing this.",
                time: "2 hours ago",
              },
              {
                id: 2,
                author: "Mike Chen",
                content: "I completely agree with your perspective on this topic.",
                time: "1 hour ago",
              },
            ],
          }))
        }
      }
      return newSet
    })
  }

  const addComment = (postId: number) => {
    const commentText = newComment[postId]
    if (commentText?.trim() && currentUser) {
      const newCommentObj = {
        id: Date.now(),
        author: currentUser.name,
        content: commentText,
        time: "Agora",
      }

      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newCommentObj],
      }))

      setNewComment((prev) => ({
        ...prev,
        [postId]: "",
      }))
      
      // Update global state
      addPostComment(postId, commentText)
      
      // Add notification
      addNotification({
        type: 'comment',
        message: `Você comentou em um post`,
        time: 'Agora',
        read: false
      })
    }
  }

  const handleShare = (postId: number) => {
    console.log("[v0] Sharing post:", postId)
    // Here you would implement actual sharing functionality
    alert("Post shared successfully!")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="hidden lg:block">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending Topics
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {trendingTopics.map((topic, index) => (
                <div key={index} className="flex flex-col">
                  <span className="font-medium text-sm text-foreground">{topic.name}</span>
                  <span className="text-xs text-muted-foreground">{topic.posts}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar>
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback>
                    {currentUser?.name?.split(" ").map(n => n[0]).join("") ?? "U"}
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
                          <AvatarImage src={currentUser?.avatar} />
                          <AvatarFallback>
                            {currentUser?.name?.split(" ").map(n => n[0]).join("") ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{currentUser?.name}</p>
                          <p className="text-sm text-muted-foreground">{currentUser?.title}</p>
                        </div>
                      </div>
                      <Textarea
                        placeholder="Sobre o que você quer falar?"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="min-h-[120px] resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Photo
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Video className="h-4 w-4 mr-2" />
                            Video
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Document
                          </Button>
                        </div>
                        <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                          Post
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Posts */}
          {allPosts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
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
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{post.author.title}</p>
                      <p className="text-xs text-muted-foreground">{post.timestamp}</p>
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
                      src={post.image || "/placeholder.svg"}
                      alt="Post content"
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}

                {post.tags && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
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
                      onClick={() => toggleLike(post.id)}
                      className={cn("flex items-center space-x-2", likedPosts.has(post.id) && "text-accent")}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{post.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2"
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments + (comments[post.id]?.length || 0)}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2"
                      onClick={() => handleShare(post.id)}
                    >
                      <Share2 className="h-4 w-4" />
                      <span>{post.shares}</span>
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleBookmark(post.id)}
                    className={cn(bookmarkedPosts.has(post.id) && "text-accent")}
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>

                {showComments.has(post.id) && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    {comments[post.id]?.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {comment.author
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted rounded-lg p-3">
                            <p className="font-medium text-sm">{comment.author}</p>
                            <p className="text-sm text-foreground">{comment.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{comment.time}</p>
                        </div>
                      </div>
                    ))}

                    <div className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/professional-headshot.png" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex space-x-2">
                        <Input
                          placeholder="Write a comment..."
                          value={newComment[post.id] || ""}
                          onChange={(e) =>
                            setNewComment((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              addComment(post.id)
                            }
                          }}
                        />
                        <Button size="sm" onClick={() => addComment(post.id)} disabled={!newComment[post.id]?.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Suggested Connections
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestedConnections.map((connection, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={connection.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {connection.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-foreground">{connection.name}</p>
                      <p className="text-xs text-muted-foreground">{connection.title}</p>
                      <p className="text-xs text-muted-foreground">{connection.mutualConnections} mutual connections</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Connect
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
