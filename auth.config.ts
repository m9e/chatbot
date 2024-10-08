import type { NextAuthConfig } from 'next-auth'
import { v4 as uuidv4 } from 'uuid'

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLoginPage = nextUrl.pathname.startsWith('/login')
      const isOnSignupPage = false //nextUrl.pathname.startsWith('/signup')
      const allowAnonymous = process.env.ALLOW_ANONYMOUS === 'true'

      if (isLoggedIn) {
        if (isOnLoginPage || isOnSignupPage) {
          return Response.redirect(new URL('/', nextUrl))
        }
      } else if (!allowAnonymous && !isOnLoginPage && !isOnSignupPage) {
        return Response.redirect(new URL('/login', nextUrl))
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token = { ...token, id: user.id, isAnonymous: false }
      } else if (!token.sub) {
        // Create an anonymous token if it doesn't exist
        token = { ...token, id: uuidv4(), isAnonymous: true }
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        isAnonymous: token.isAnonymous as boolean
      }
      return session
    }
  },
  providers: []
} satisfies NextAuthConfig
