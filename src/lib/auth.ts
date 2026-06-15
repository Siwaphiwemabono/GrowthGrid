import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const getSession = async () => {
  return getServerSession(authOptions);
};

// Helper function to get the current user on the server
export const getCurrentUser = async () => {
  const session = await getSession();
  return session?.user;
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const session = await getSession();
  return !!session;
};

// Helper function to check user role
export const getUserRole = async () => {
  const session = await getSession();
  return session?.user?.role;
};