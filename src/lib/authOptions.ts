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
          console.log("❌ No credentials provided");
          return null;
        }

        console.log("🔍 Login attempt for:", credentials.email);

        try {
          // ✅ DIRECT CHECK - Query profiles table (NO Supabase Auth)
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", credentials.email)
            .single();

          if (error) {
            console.log("❌ Database error:", error.message);
            return null;
          }

          if (!profile) {
            console.log("❌ User not found in profiles:", credentials.email);
            return null;
          }

          console.log("✅ User found:", profile.email);
          console.log("🔑 Password in DB:", profile.password);
          console.log("👤 Role:", profile.role);

          // ✅ Check if password matches (plain text comparison)
          if (!profile.password) {
            console.log("❌ No password stored for user");
            return null;
          }

          if (profile.password !== credentials.password) {
            console.log("❌ Password mismatch!");
            console.log("   Provided:", credentials.password);
            console.log("   Stored:", profile.password);
            return null;
          }

          console.log("✅ Password verified successfully!");
          console.log("✅ Login successful for:", credentials.email);

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
  },
  secret: process.env.NEXTAUTH_SECRET,
};