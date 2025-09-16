"use client"

import { useState } from "react"
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
} from "lucide-react"
import { currentUserProfile, experiences, education, skills, certifications, recentUserPosts } from "@/lib/sample-data"
import { useCurrentUser, useConnections } from "@/lib/app-context"

export function ProfilePage() {
  const [isFollowing, setIsFollowing] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedProfile, setEditedProfile] = useState({
    bio: "",
    location: "",
    website: "",
  })
  
  const currentUser = useCurrentUser()
  const { connections } = useConnections()
  
  // Use current user data if available, fallback to sample data
  const profileData = currentUser || currentUserProfile

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                  <AvatarImage src={profileData.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl">
                    {profileData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Name and Title */}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{profileData.name}</h1>
                  {(profileData as any).verified && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Verificado
                    </Badge>
                  )}
                </div>
                <p className="text-lg text-muted-foreground">{profileData.title}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Building className="h-4 w-4" />
                  {profileData.company}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profileData.location}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                {currentUser ? (
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
                          <Button onClick={() => setIsEditingProfile(false)}>
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  // Other's profile - show follow/message buttons
                  <>
                    <Button onClick={() => setIsFollowing(!isFollowing)} variant={isFollowing ? "outline" : "default"}>
                      {isFollowing ? "Seguindo" : "Seguir"}
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
                <p className="font-semibold text-foreground">{profileData.connections}</p>
                <p className="text-sm text-muted-foreground">Conexões</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">{profileData.followers}</p>
                <p className="text-sm text-muted-foreground">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">{profileData.following}</p>
                <p className="text-sm text-muted-foreground">Seguindo</p>
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
              <p className="text-sm text-muted-foreground leading-relaxed">{currentUserProfile.bio}</p>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-foreground">Contact Info</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{currentUserProfile.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{currentUserProfile.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-accent">{currentUserProfile.website}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Joined {currentUserProfile.joinDate}</span>
              </div>
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
              {recentUserPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={currentUserProfile.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {currentUserProfile.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-sm text-foreground">{currentUserProfile.name}</h4>
                          <span className="text-xs text-muted-foreground">{post.timestamp}</span>
                        </div>
                        <p className="text-sm text-foreground mt-2 leading-relaxed">{post.content}</p>
                        <div className="flex items-center space-x-4 mt-3">
                          <Button variant="ghost" size="sm" className="text-xs">
                            👍 {post.likes}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs">
                            💬 {post.comments}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs">
                            <Share2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
