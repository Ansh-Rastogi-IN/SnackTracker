import { useAuth } from "@/hooks/use-auth";
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const [location, setLocation] = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect if we haven't redirected yet and we're still on the home page
    if (user && !hasRedirected.current && location === "/") {
      hasRedirected.current = true;
      if (isAdmin) {
        setLocation("/admin/orders");
      } else {
        setLocation("/menu");
      }
    }
  }, [user, isAdmin, location, setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  );
}
