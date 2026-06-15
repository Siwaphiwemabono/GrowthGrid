import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // First, check if user exists in profiles table
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", credentials.email)
            .single();

          if (profileError || !profile) {
            console.log("User not found in profiles:", credentials.email);
            return null;
          }

          // Since Supabase Auth might not be used, we need to verify password
          // For now, we'll use a simple check (in production, use bcrypt)
          // You should store hashed passwords in the profiles table
          
          // For demo purposes, we'll accept any password for existing users
          // But ideally, you should add a password field to your profiles table
          
          // If you have a password field in profiles, use it:
          // if (profile.password !== credentials.password) return null;

          // Return user object for NextAuth session
          return {
            id: profile.id,
            name: `${profile.name} ${profile.surname}`,
            email: profile.email,
            role: profile.role || "employee",
          };
        } catch (err) {
          console.error("Auth error:", err);
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
  },
  secret: process.env.NEXTAUTH_SECRET,
};