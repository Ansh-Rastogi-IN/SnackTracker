import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

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
  const [location] = useLocation();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // Redirect to login if not authenticated
        if (!user) {
          if (location !== "/auth") {
            return <Redirect to="/auth" />;
          }
          return null;
        }

        // Check role-based access if roles are specified
        if (roles && roles.length > 0) {
          const hasAccess = roles.includes(user.role || "customer");
          
          // Always allow admin to access any route
          const isAdmin = user.role === 'admin' || user.isAdmin;
          
          if (!hasAccess && !isAdmin) {
            if (location !== "/") {
              return <Redirect to="/" />;
            }
            return null;
          }
        }

        return <Component />;
      }}
    </Route>
  );
}
