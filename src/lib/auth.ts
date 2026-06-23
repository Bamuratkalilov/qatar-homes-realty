import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Demo fallback when database is not connected
        const DEMO_EMAIL = "agent@qatarhomes.com"
        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email as string },
          })
          if (user) {
            return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role }
          }
          // Allow demo login with known email even if user not in DB yet
          if (credentials.email === DEMO_EMAIL) {
            return { id: "demo-agent", email: DEMO_EMAIL, name: "Ahmad Al-Mansoori", role: "AGENT" }
          }
          return null
        } catch {
          // DB not connected — allow demo login
          if (credentials.email === DEMO_EMAIL) {
            return { id: "demo-agent", email: DEMO_EMAIL, name: "Ahmad Al-Mansoori", role: "AGENT" }
          }
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})
