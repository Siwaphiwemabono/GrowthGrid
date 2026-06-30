// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Log the attempt
        console.log("🔍 [AUTH] Login attempt for:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ [AUTH] No credentials provided");
          return null;
        }

        try {
          // Check if db is available
          if (!db) {
            console.error("❌ [AUTH] Database client is not available");
            return null;
          }

          console.log("🔍 [AUTH] Querying profiles for:", credentials.email);

          // Find user in profiles table
          const { data: profile, error } = await db
            .from("profiles")
            .select("*")
            .eq("email", credentials.email)
            .maybeSingle();

          if (error) {
            console.error("❌ [AUTH] Database error:", error);
            return null;
          }

          if (!profile) {
            console.log("❌ [AUTH] User not found:", credentials.email);
            return null;
          }

          console.log("✅ [AUTH] User found:", {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            hasPassword: !!profile.password,
            passwordLength: profile.password?.length || 0
          });

          // Check if password exists
          if (!profile.password) {
            console.log("❌ [AUTH] No password stored for user");
            return null;
          }

          // Check password
          console.log("🔑 [AUTH] Comparing passwords...");
          if (profile.password !== credentials.password) {
            console.log("❌ [AUTH] Password mismatch");
            return null;
          }

          console.log("✅ [AUTH] Password matched for:", credentials.email);

          // Return user object
          return {
            id: profile.id,
            name: `${profile.name || ''} ${profile.surname || ''}`.trim() || profile.email,
            email: profile.email,
            role: profile.role || "employee",
          };
        } catch (err) {
          console.error("❌ [AUTH] Error:", err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };