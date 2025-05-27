
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user, isAdmin, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      // Single redirect based on user role
      if (isAdmin || user.isAdmin) {
        setLocation("/admin/orders");
      } else {
        setLocation("/menu");
      }
    }
  }, [user, isAdmin, isLoading, setLocation]);

  // Show loading while determining redirect
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

  // Show welcome message for unauthenticated users
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-4xl font-bold text-primary mb-4">Welcome to SnackTrack</h1>
          <p className="text-gray-600 mb-8">Your smart digital canteen management system</p>
          <a 
            href="/auth" 
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Get Started
          </a>
        </div>
      </div>
    );
  }

  // This shouldn't render due to the useEffect redirect, but just in case
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
