
import { useAuth } from "@/hooks/use-auth";
import { ReactNode } from "react";
import { Redirect } from "wouter";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireRole?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requireAdmin = false, 
  requireRole 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    return <Redirect to="/auth" />;
  }

  // Check admin requirement
  if (requireAdmin && (!user || !user.isAdmin)) {
    return <Redirect to="/menu" />;
  }

  // Check specific role requirement
  if (requireRole && (!user || user.role !== requireRole)) {
    return <Redirect to="/menu" />;
  }

  return <>{children}</>;
}
