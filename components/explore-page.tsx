"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  MapPin,
  Users,
  Building,
  TrendingUp,
  BookOpen,
  Briefcase,
  Star,
  MessageCircle,
  UserPlus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { suggestedConnections, samplePosts, chatUsers } from "@/lib/sample-data"
import { useConnections, useCurrentUser } from "@/lib/app-context"

const companies = [
  { name: "Google", logo: "/placeholder.svg", employees: "150k+", industry: "Technology" },
  { name: "Microsoft", logo: "/placeholder.svg", employees: "220k+", industry: "Technology" },
  { name: "Apple", logo: "/placeholder.svg", employees: "154k+", industry: "Technology" },
  { name: "Amazon", logo: "/placeholder.svg", employees: "1.5M+", industry: "E-commerce" },
  { name: "Meta", logo: "/placeholder.svg", employees: "87k+", industry: "Social Media" },
  { name: "Netflix", logo: "/placeholder.svg", employees: "12k+", industry: "Entertainment" },
]

const jobs = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp",
    location: "São Paulo, SP",
    type: "Presencial",
    salary: "R$ 12.000 - R$ 18.000",
    posted: "2 dias atrás",
    applicants: 45,
    description: "Buscamos um desenvolvedor frontend sênior com experiência em React e TypeScript."
  },
  {
    id: 2,
    title: "Product Manager",
    company: "StartupX",
    location: "Remote",
    type: "Remoto",
    salary: "R$ 15.000 - R$ 25.000",
    posted: "1 semana atrás",
    applicants: 32,
    description: "Procuramos um gerente de produto para liderar nossos projetos inovadores."
  },
  {
    id: 3,
    title: "UX/UI Designer",
    company: "Design Studio",
    location: "Rio de Janeiro, RJ",
    type: "Híbrido",
    salary: "R$ 8.000 - R$ 12.000",
    posted: "3 dias atrás",
    applicants: 28,
    description: "Designer experiente para criar interfaces incríveis para nossos produtos."
  }
]

const courses = [
  {
    id: 1,
    title: "React Avançado com TypeScript",
    instructor: "João Silva",
    rating: 4.8,
    students: 1250,
    price: "R$ 149",
    duration: "8 horas",
    level: "Avançado"
  },
  {
    id: 2,
    title: "Product Management Essentials",
    instructor: "Ana Costa",
    rating: 4.9,
    students: 890,
    price: "R$ 199",
    duration: "12 horas",
    level: "Intermediário"
  },
  {
    id: 3,
    title: "UX Research e Design Thinking",
    instructor: "Carlos Mendes",
    rating: 4.7,
    students: 650,
    price: "R$ 179",
    duration: "10 horas",
    level: "Iniciante"
  }
]

export function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilters, setSelectedFilters] = useState({
    location: "",
    industry: "",
    experience: "",
    jobType: ""
  })
  
  const { connections, addConnection } = useConnections()
  const currentUser = useCurrentUser()

  const filteredPeople = suggestedConnections.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (person.company && person.company.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConnect = (person: any) => {
    addConnection(person)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Search Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar pessoas, empresas, vagas, cursos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="people" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="people" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Pessoas
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Empresas
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Vagas
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Cursos
          </TabsTrigger>
        </TabsList>

        {/* People Tab */}
        <TabsContent value="people" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPeople.map((person, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-16 w-16 mb-4">
                      <AvatarImage src={person.avatar} />
                      <AvatarFallback>
                        {person.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg mb-1">{person.name}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{person.title}</p>
                    {person.company && (
                      <p className="text-muted-foreground text-xs mb-3 flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {person.company}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mb-4">
                      {person.mutualConnections} conexões em comum
                    </p>
                    <div className="flex gap-2 w-full">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleConnect(person)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Conectar
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{company.name}</h3>
                      <p className="text-muted-foreground text-sm mb-2">{company.industry}</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        {company.employees} funcionários
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        Seguir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-6">
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </span>
                        <Badge variant="secondary">{job.type}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{job.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium text-green-600">{job.salary}</span>
                        <span className="text-muted-foreground">{job.posted}</span>
                        <span className="text-muted-foreground">{job.applicants} candidatos</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm">
                        Candidatar-se
                      </Button>
                      <Button size="sm" variant="outline">
                        Salvar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="aspect-video bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Por {course.instructor}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {course.rating}
                        </div>
                        <span>{course.students} alunos</span>
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold">{course.price}</span>
                          <Badge variant="outline" className="ml-2">
                            {course.level}
                          </Badge>
                        </div>
                        <Button size="sm">
                          Inscrever-se
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
