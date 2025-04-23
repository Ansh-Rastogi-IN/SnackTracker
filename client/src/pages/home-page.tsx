import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to appropriate page based on user role
    if (user) {
      if (isAdmin) {
        setLocation("/admin/orders");
      } else {
        setLocation("/menu");
      }
    }
  }, [user, isAdmin, setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  );
}
