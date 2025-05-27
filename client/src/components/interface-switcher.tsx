import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SwitchIcon, UserIcon, ChefHatIcon, ShieldIcon } from "lucide-react";

export function InterfaceSwitcher() {
  const { user, hasRole, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const getInterfaceName = () => {
    if (user.role === "admin" || isAdmin) return "Admin";
    if (user.role === "staff") return "Staff";
    return "Customer";
  };

  const handleSwitchToAdmin = () => {
    if (hasRole("admin")) {
      navigate("/admin/orders");
      setOpen(false);
    }
  };

  const handleSwitchToStaff = () => {
    if (hasRole("staff")) {
      navigate("/staff/orders");
      setOpen(false);
    }
  };

  const handleSwitchToCustomer = () => {
    navigate("/menu");
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <SwitchIcon className="h-4 w-4" />
          <span>{getInterfaceName()} Interface</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Switch Interface</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {hasRole("admin") && (
          <DropdownMenuItem 
            className="cursor-pointer flex items-center gap-2" 
            onClick={handleSwitchToAdmin}
          >
            <ShieldIcon className="h-4 w-4" />
            Admin Dashboard
          </DropdownMenuItem>
        )}
        
        {hasRole("staff") && (
          <DropdownMenuItem 
            className="cursor-pointer flex items-center gap-2" 
            onClick={handleSwitchToStaff}
          >
            <ChefHatIcon className="h-4 w-4" />
            Staff Dashboard
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem 
          className="cursor-pointer flex items-center gap-2" 
          onClick={handleSwitchToCustomer}
        >
          <UserIcon className="h-4 w-4" />
          Customer View
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}