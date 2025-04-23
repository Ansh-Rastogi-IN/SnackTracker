import { Link, useLocation } from "wouter";
import { ShoppingCart, ClipboardList, User, AlertCircle } from "lucide-react";

interface MobileNavProps {
  activeView: string;
  cartItemsCount?: number;
  onCartClick?: () => void;
  adminMode?: boolean;
}

export default function MobileNav({ 
  activeView, 
  cartItemsCount = 0, 
  onCartClick,
  adminMode = false
}: MobileNavProps) {
  const [location, setLocation] = useLocation();
  
  const handleNavClick = (path: string) => {
    if (path === "cart" && onCartClick) {
      onCartClick();
    } else {
      setLocation(path);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 z-10">
      {!adminMode ? (
        <div className="grid grid-cols-4 h-16">
          <button 
            onClick={() => handleNavClick("/menu")} 
            className={`flex flex-col items-center justify-center ${
              activeView === "menu" ? "text-primary" : "text-neutral-400"
            }`}
          >
            <i className="ri-restaurant-line text-xl"></i>
            <span className="text-xs mt-1">Menu</span>
          </button>
          
          <button 
            onClick={() => handleNavClick("/orders")} 
            className={`flex flex-col items-center justify-center ${
              activeView === "orders" ? "text-primary" : "text-neutral-400"
            }`}
          >
            <ClipboardList className="h-5 w-5" />
            <span className="text-xs mt-1">Orders</span>
          </button>
          
          <button 
            onClick={() => handleNavClick("cart")} 
            className="flex flex-col items-center justify-center relative text-neutral-400"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemsCount > 0 && (
              <span className="absolute top-0 right-6 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
            <span className="text-xs mt-1">Cart</span>
          </button>
          
          <button 
            onClick={() => handleNavClick("account")} 
            className="flex flex-col items-center justify-center text-neutral-400"
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Account</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 h-16">
          <button 
            onClick={() => handleNavClick("/admin/orders")} 
            className={`flex flex-col items-center justify-center ${
              activeView === "admin-orders" ? "text-secondary" : "text-neutral-400"
            }`}
          >
            <ClipboardList className="h-5 w-5" />
            <span className="text-xs mt-1">Orders</span>
          </button>
          
          <button 
            onClick={() => handleNavClick("/admin/menu")} 
            className={`flex flex-col items-center justify-center ${
              activeView === "admin-menu" ? "text-secondary" : "text-neutral-400"
            }`}
          >
            <i className="ri-restaurant-line text-xl"></i>
            <span className="text-xs mt-1">Menu</span>
          </button>
          
          <button 
            onClick={() => handleNavClick("account")} 
            className="flex flex-col items-center justify-center text-neutral-400"
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Account</span>
          </button>
        </div>
      )}
    </div>
  );
}
