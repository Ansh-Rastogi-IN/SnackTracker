import { createContext, ReactNode, useContext, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  switchToAdmin: () => void;
  switchToUser: () => void;
  hasRole: (role: string | string[]) => boolean;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        return res.json();
      } catch (error: any) {
        // Parse the error response
        if (error.message.includes('401')) {
          throw new Error('Invalid username or password');
        }
        throw error;
      }
    },
    onSuccess: (userData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Redirect based on user role
      if (userData.isAdmin) {
        setLocation("/admin/orders");
      } else {
        setLocation("/menu");
      }
    },
    onError: (error: any) => {
      console.error("Login failed:", error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      setLocation("/menu");
      toast({
        title: "Registration successful",
        description: `Welcome to SnackTrack, ${user.firstName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      setIsAdmin(false);
      setLocation("/auth");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const switchToAdmin = () => {
    if (user?.isAdmin) {
      setIsAdmin(true);
      setLocation("/admin/orders");
    }
  };

  const switchToUser = () => {
    setIsAdmin(false);
    setLocation("/menu");
  };

  // Function to check if user has a specific role or any of the roles provided in an array
  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;

    // Always grant access to admin users
    if (user.isAdmin || user.role === 'admin') return true;

    const userRole = user.role || "customer";

    if (Array.isArray(role)) {
      return role.includes(userRole);
    }

    return userRole === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        isAdmin,
        loginMutation,
        logoutMutation,
        registerMutation,
        switchToAdmin,
        switchToUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}