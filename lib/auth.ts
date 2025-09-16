import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import LinkedInProvider from 'next-auth/providers/linkedin'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import bcrypt from 'bcryptjs'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        await connectDB()

        const user = await User.findOne({ 
          email: credentials.email.toLowerCase() 
        }).select('+password')

        if (!user) {
          throw new Error('User not found')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        // Update last seen
        await User.findByIdAndUpdate(user._id, {
          isOnline: true,
          lastSeen: new Date()
        })

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          verified: user.verified,
          title: user.title,
          company: user.company
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          avatar: profile.picture,
          username: profile.email.split('@')[0]
        }
      }
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.localizedFirstName + ' ' + profile.localizedLastName,
          email: profile.emailAddress,
          avatar: profile.profilePicture?.displayImage,
          username: profile.localizedFirstName?.toLowerCase() + profile.localizedLastName?.toLowerCase()
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      await connectDB()

      if (account?.provider === 'google' || account?.provider === 'linkedin') {
        try {
          const existingUser = await User.findOne({ email: user.email })

          if (!existingUser) {
            // Create new user for OAuth
            const newUser = new User({
              email: user.email,
              name: user.name,
              username: user.username || user.email?.split('@')[0],
              avatar: user.avatar,
              title: 'Professional', // Default title
              password: Math.random().toString(36), // Random password for OAuth users
              verified: account.provider === 'linkedin' // Auto-verify LinkedIn users
            })

            await newUser.save()
          } else {
            // Update existing user
            await User.findByIdAndUpdate(existingUser._id, {
              isOnline: true,
              lastSeen: new Date()
            })
          }
        } catch (error) {
          console.error('Error in signIn callback:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        await connectDB()
        const dbUser = await User.findOne({ email: user.email })
        
        if (dbUser) {
          token.id = dbUser._id.toString()
          token.username = dbUser.username
          token.avatar = dbUser.avatar
          token.verified = dbUser.verified
          token.title = dbUser.title
          token.company = dbUser.company
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.avatar = token.avatar as string
        session.user.verified = token.verified as boolean
        session.user.title = token.title as string
        session.user.company = token.company as string
      }
      return session
    }
  },
  events: {
    async signOut({ token }) {
      if (token?.id) {
        await connectDB()
        await User.findByIdAndUpdate(token.id, {
          isOnline: false,
          lastSeen: new Date()
        })
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET
}

export default NextAuth(authOptions)
