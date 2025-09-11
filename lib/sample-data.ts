// Centralized sample data for the professional social network

export interface User {
  id: number | string
  name: string
  title: string
  company?: string
  avatar: string
  verified?: boolean
  online?: boolean
  location?: string
  bio?: string
  connections?: number
  followers?: number
  following?: number
}

export interface Post {
  id: number
  author: User
  content: string
  timestamp: string
  likes: number
  comments: number
  shares: number
  image?: string
  tags?: string[]
}

export interface ChatUser extends User {
  lastMessage: string
  unread: number
}

export interface Message {
  id: number
  senderId: number | string
  senderName: string
  content: string
  timestamp: string
  isOwn: boolean
}

export interface Experience {
  id: number
  title: string
  company: string
  location: string
  duration: string
  description: string
  logo?: string
}

export interface Education {
  id: number
  degree: string
  school: string
  duration: string
  description: string
  logo?: string
}

export interface Certification {
  name: string
  issuer: string
  date: string
  logo?: string
}

// Sample users data
export const sampleUsers: User[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    title: "Senior Product Manager",
    company: "TechCorp",
    avatar: "/professional-woman-smiling.png",
    verified: true,
    online: true,
    location: "San Francisco, CA",
    bio: "Product leader with 10+ years building user-centric solutions",
    connections: 1847,
    followers: 2341,
    following: 892,
  },
  {
    id: 2,
    name: "Marcus Chen",
    title: "Lead Developer",
    company: "StartupXYZ",
    avatar: "/professional-man-smiling.png",
    verified: false,
    online: true,
    location: "Remote",
    bio: "Full-stack developer passionate about clean code and scalable architecture",
    connections: 956,
    followers: 1203,
    following: 445,
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    title: "UX Designer",
    company: "DesignStudio",
    avatar: "/smiling-professional-woman.png",
    verified: true,
    online: false,
    location: "New York, NY",
    bio: "Design thinking advocate focused on creating inclusive user experiences",
    connections: 1234,
    followers: 1876,
    following: 567,
  },
  {
    id: 4,
    name: "David Park",
    title: "Marketing Director",
    company: "GrowthCo",
    avatar: "/professional-headshot.png",
    verified: false,
    online: false,
    location: "Austin, TX",
    bio: "Growth marketing expert helping B2B companies scale efficiently",
    connections: 2103,
    followers: 3456,
    following: 1234,
  },
  {
    id: 5,
    name: "Lisa Wang",
    title: "Data Scientist",
    company: "AI Innovations",
    avatar: "/professional-woman-smiling.png",
    verified: true,
    online: true,
    location: "Seattle, WA",
    bio: "ML engineer turning data into actionable business insights",
    connections: 876,
    followers: 1432,
    following: 321,
  },
]

// Sample posts data
export const samplePosts: Post[] = [
  {
    id: 1,
    author: sampleUsers[0],
    content:
      "Excited to share that our team just launched a new AI-powered feature that's already showing 40% improvement in user engagement! The key was focusing on user feedback and iterating quickly. What strategies have worked best for your product launches?",
    timestamp: "2h",
    likes: 127,
    comments: 23,
    shares: 8,
    image: "/product-launch-celebration.jpg",
    tags: ["ProductManagement", "AI", "UserEngagement"],
  },
  {
    id: 2,
    author: sampleUsers[1],
    content:
      "Just finished implementing a microservices architecture that reduced our API response time by 60%. Here are the key lessons learned:\n\n1. Start small and scale gradually\n2. Invest in proper monitoring from day one\n3. Documentation is crucial for team collaboration\n\nHappy to discuss the technical details in the comments!",
    timestamp: "4h",
    likes: 89,
    comments: 15,
    shares: 12,
    tags: ["Development", "Microservices", "Performance"],
  },
  {
    id: 3,
    author: sampleUsers[2],
    content:
      "Reminder: Good design is not just about making things look pretty. It's about solving real problems for real people. Today I spent 3 hours with users testing our new onboarding flow, and the insights were invaluable. User research should never be an afterthought.",
    timestamp: "6h",
    likes: 156,
    comments: 31,
    shares: 19,
    tags: ["UXDesign", "UserResearch", "Design"],
  },
  {
    id: 4,
    author: sampleUsers[3],
    content:
      "Our latest campaign achieved a 300% ROI by focusing on authentic storytelling rather than traditional sales pitches. The lesson? People connect with stories, not statistics. What's your experience with narrative-driven marketing?",
    timestamp: "8h",
    likes: 203,
    comments: 42,
    shares: 27,
    tags: ["Marketing", "Storytelling", "ROI"],
  },
  {
    id: 5,
    author: sampleUsers[4],
    content:
      "Machine learning model deployment doesn't end at 'it works on my machine.' Production ML requires monitoring, versioning, and robust data pipelines. Here's what I've learned about MLOps in the past year...",
    timestamp: "12h",
    likes: 94,
    comments: 18,
    shares: 15,
    tags: ["MachineLearning", "MLOps", "DataScience"],
  },
]

// Sample chat users
export const chatUsers: ChatUser[] = [
  {
    ...sampleUsers[0],
    lastMessage: "Thanks for the feedback on the new feature!",
    timestamp: "2m",
    unread: 2,
  },
  {
    ...sampleUsers[1],
    lastMessage: "The API integration is ready for testing",
    timestamp: "15m",
    unread: 0,
  },
  {
    ...sampleUsers[2],
    lastMessage: "I've updated the wireframes based on our discussion",
    timestamp: "1h",
    unread: 1,
  },
  {
    ...sampleUsers[3],
    lastMessage: "Great work on the campaign launch!",
    timestamp: "2h",
    unread: 0,
  },
  {
    ...sampleUsers[4],
    lastMessage: "The analytics report is ready for review",
    timestamp: "3h",
    unread: 0,
  },
]

// Sample messages
export const sampleMessages: Message[] = [
  {
    id: 1,
    senderId: 1,
    senderName: "Sarah Johnson",
    content: "Hi! I wanted to follow up on our discussion about the new product features.",
    timestamp: "10:30 AM",
    isOwn: false,
  },
  {
    id: 2,
    senderId: "me",
    senderName: "You",
    content: "I think the user feedback integration is a great idea. When do you think we can start implementing it?",
    timestamp: "10:32 AM",
    isOwn: true,
  },
  {
    id: 3,
    senderId: 1,
    senderName: "Sarah Johnson",
    content: "I was thinking we could start next sprint. I'll need to coordinate with the development team first.",
    timestamp: "10:35 AM",
    isOwn: false,
  },
  {
    id: 4,
    senderId: "me",
    senderName: "You",
    content: "That sounds perfect. Should we schedule a meeting with Marcus and the dev team?",
    timestamp: "10:37 AM",
    isOwn: true,
  },
  {
    id: 5,
    senderId: 1,
    senderName: "Sarah Johnson",
    content:
      "Yes, let's do that. I'll send out a calendar invite for tomorrow afternoon. Thanks for the feedback on the new feature!",
    timestamp: "10:40 AM",
    isOwn: false,
  },
]

// Trending topics
export const trendingTopics = [
  { name: "AI in Business", posts: "2.3k posts" },
  { name: "Remote Work", posts: "1.8k posts" },
  { name: "Startup Funding", posts: "1.2k posts" },
  { name: "Product Management", posts: "956 posts" },
  { name: "UX Design", posts: "743 posts" },
]

// Suggested connections
export const suggestedConnections = [
  {
    name: "Alex Thompson",
    title: "Software Engineer at Meta",
    avatar: "/professional-headshot.png",
    mutualConnections: 12,
  },
  {
    name: "Lisa Wang",
    title: "Data Scientist at Google",
    avatar: "/professional-woman-smiling.png",
    mutualConnections: 8,
  },
  {
    name: "James Miller",
    title: "VP of Sales at SalesForce",
    avatar: "/professional-man-smiling.png",
    mutualConnections: 15,
  },
]

// Profile data
export const currentUserProfile = {
  name: "John Doe",
  title: "Senior Software Engineer",
  company: "TechCorp Inc.",
  location: "San Francisco, CA",
  joinDate: "March 2020",
  email: "john.doe@techcorp.com",
  phone: "+1 (555) 123-4567",
  website: "johndoe.dev",
  bio: "Passionate software engineer with 8+ years of experience building scalable web applications. I specialize in React, Node.js, and cloud architecture. Always eager to learn new technologies and mentor junior developers.",
  avatar: "/professional-headshot.png",
  coverImage: "/professional-cover-bg.jpg",
  connections: 1247,
  followers: 892,
  following: 456,
}

// Experience data
export const experiences: Experience[] = [
  {
    id: 1,
    title: "Senior Software Engineer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    duration: "Jan 2022 - Present",
    description:
      "Lead development of microservices architecture serving 10M+ users. Mentored 5 junior developers and improved system performance by 40%.",
    logo: "/company-logo-techcorp.png",
  },
  {
    id: 2,
    title: "Software Engineer",
    company: "StartupXYZ",
    location: "Remote",
    duration: "Mar 2020 - Dec 2021",
    description:
      "Built full-stack web applications using React and Node.js. Implemented CI/CD pipelines and reduced deployment time by 60%.",
    logo: "/company-logo-startup.png",
  },
  {
    id: 3,
    title: "Junior Developer",
    company: "WebSolutions Ltd",
    location: "New York, NY",
    duration: "Jun 2018 - Feb 2020",
    description:
      "Developed responsive websites and web applications. Collaborated with design team to implement pixel-perfect UI components.",
    logo: "/company-logo-websolutions.png",
  },
]

// Education data
export const education: Education[] = [
  {
    id: 1,
    degree: "Master of Science in Computer Science",
    school: "Stanford University",
    duration: "2016 - 2018",
    description: "Specialized in Machine Learning and Distributed Systems. GPA: 3.8/4.0",
    logo: "/stanford-logo.png",
  },
  {
    id: 2,
    degree: "Bachelor of Science in Software Engineering",
    school: "UC Berkeley",
    duration: "2012 - 2016",
    description: "Graduated Magna Cum Laude. President of Computer Science Club.",
    logo: "/berkeley-logo.png",
  },
]

// Skills data
export const skills = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "AWS",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
]

// Certifications data
export const certifications: Certification[] = [
  {
    name: "AWS Solutions Architect",
    issuer: "Amazon Web Services",
    date: "2023",
    logo: "/aws-logo.png",
  },
  {
    name: "Certified Kubernetes Administrator",
    issuer: "Cloud Native Computing Foundation",
    date: "2022",
    logo: "/kubernetes-logo.png",
  },
]

// Recent posts for profile
export const recentUserPosts = [
  {
    id: 1,
    content:
      "Just finished implementing a new microservices architecture that improved our API response time by 40%. The key was proper service decomposition and implementing circuit breakers.",
    timestamp: "2 days ago",
    likes: 89,
    comments: 12,
  },
  {
    id: 2,
    content:
      "Excited to share that I'll be speaking at TechConf 2024 about 'Building Resilient Distributed Systems'. Looking forward to sharing our learnings!",
    timestamp: "1 week ago",
    likes: 156,
    comments: 23,
  },
]
