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
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ No credentials provided");
          return null;
        }

        console.log("🔍 Login attempt for:", credentials.email);

        try {
          const { data: profile, error } = await db
            .from("profiles")
            .select("*")
            .eq("email", credentials.email)
            .maybeSingle();

          if (error) {
            console.log("❌ Database error:", error.message);
            return null;
          }

          if (!profile) {
            console.log("❌ User not found in profiles:", credentials.email);
            return null;
          }

          if (!profile.password) {
            console.log("❌ No password stored for user");
            return null;
          }

          if (profile.password !== credentials.password) {
            console.log("❌ Password mismatch!");
            return null;
          }

          return {
            id: profile.id,
            name: `${profile.name} ${profile.surname}`,
            email: profile.email,
            role: profile.role || "employee",
          };
        } catch (err) {
          console.error("❌ Auth error:", err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
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
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };