import { useAuth } from "@/hooks/use-auth";
import { Route, Redirect } from "wouter";
import { ComponentType } from "react";

interface ProtectedRouteProps {
  component: ComponentType<any>;
  path?: string;
  roles?: string[];
}

export function ProtectedRoute({ 
  component: Component,
  path,
  roles = []
}: ProtectedRouteProps) {
  const { user, isLoading, hasRole } = useAuth();

  return (
    <Route
      path={path}
      component={(props: any) => {
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

        // Check authentication
        if (!user) {
          return <Redirect to="/auth" />;
        }

        // Check role requirements
        if (roles.length > 0 && !hasRole(roles)) {
          return <Redirect to="/menu" />;
        }

        // Render component if all checks pass
        return <Component {...props} />;
      }}
    />
  );
}
