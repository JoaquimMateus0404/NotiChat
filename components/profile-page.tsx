"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"
import { currentUserProfile, experiences, education, skills, certifications, recentUserPosts } from "@/lib/sample-data"

export function ProfilePage() {
  const [isFollowing, setIsFollowing] = useState(false)

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
                  <AvatarImage src={currentUserProfile.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl">
                    {currentUserProfile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Name and Title */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">{currentUserProfile.name}</h1>
                <p className="text-lg text-muted-foreground">{currentUserProfile.title}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Building className="h-4 w-4" />
                  {currentUserProfile.company}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {currentUserProfile.location}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                <Button onClick={() => setIsFollowing(!isFollowing)} variant={isFollowing ? "outline" : "default"}>
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <p className="font-semibold text-foreground">{currentUserProfile.connections}</p>
                <p className="text-sm text-muted-foreground">Connections</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">{currentUserProfile.followers}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">{currentUserProfile.following}</p>
                <p className="text-sm text-muted-foreground">Following</p>
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
