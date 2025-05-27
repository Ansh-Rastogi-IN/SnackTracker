import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      if (user.isAdmin || user.role === 'admin') {
        setLocation("/admin/orders");
      } else {
        setLocation("/menu");
      }
    }
  }, [user, setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  );
}
