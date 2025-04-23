import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type ProtectedRouteProps = {
  path: string;
  component: () => React.JSX.Element;
  roles?: string[]; // Array of roles allowed to access this route
};

export function ProtectedRoute({
  path,
  component: Component,
  roles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check role-based access if roles are specified
  if (roles && roles.length > 0) {
    const hasAccess = roles.includes(user.role);
    
    // Always allow admin to access any route
    const isAdmin = user.role === 'admin' || user.isAdmin;
    
    if (!hasAccess && !isAdmin) {
      return (
        <Route path={path}>
          <Redirect to="/" />
        </Route>
      );
    }
  }

  return <Route path={path} component={Component} />;
}
