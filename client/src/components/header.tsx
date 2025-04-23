import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, Search, ShoppingCart, User } from "lucide-react";

interface HeaderProps {
  cartItemsCount?: number;
  onCartClick?: () => void;
}

export default function Header({ cartItemsCount = 0, onCartClick }: HeaderProps) {
  const [location] = useLocation();
  const { user, isAdmin, logoutMutation, switchToAdmin, switchToUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <a className="flex items-center">
                <div className="h-10 w-10 mr-2 bg-primary rounded-full flex items-center justify-center text-white">
                  <i className="ri-restaurant-line text-xl"></i>
                </div>
                <h1 className="text-xl font-poppins font-bold text-primary">SnackTrack</h1>
              </a>
            </Link>
          </div>
          
          {/* Search Bar - Desktop */}
          <form 
            onSubmit={handleSearch}
            className="hidden md:block flex-1 max-w-md mx-6"
          >
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Search for food items..." 
                className="w-full py-2 pl-10 pr-4 border border-neutral-300 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400" />
              </div>
            </div>
          </form>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <Link href="/auth">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  Login / Register
                </Button>
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                {!isAdmin && (
                  <Button 
                    variant="ghost"
                    className="p-2 text-neutral-500 hover:text-primary relative"
                    onClick={onCartClick}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItemsCount}
                      </span>
                    )}
                  </Button>
                )}
                
                {!isAdmin && (
                  <Link href="/orders">
                    <Button 
                      variant="ghost" 
                      className={`p-2 ${location === '/orders' ? 'text-primary' : 'text-neutral-500 hover:text-primary'}`}
                    >
                      <i className="ri-file-list-3-line text-xl"></i>
                    </Button>
                  </Link>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-neutral-300 flex items-center justify-center text-neutral-500">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{user.firstName || user.username}</span>
                      <i className="ri-arrow-down-s-line"></i>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-500 focus:text-red-500"
                      onClick={() => logoutMutation.mutate()}
                    >
                      Logout
                    </DropdownMenuItem>
                    
                    {user.isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        {isAdmin ? (
                          <DropdownMenuItem onClick={switchToUser}>
                            Switch to User Mode
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={switchToAdmin}>
                            Switch to Admin Mode
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost"
            className="md:hidden text-neutral-500 hover:text-neutral-700"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Search Bar - Mobile */}
        <form 
          onSubmit={handleSearch}
          className="mt-3 md:hidden"
        >
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Search for food items..." 
              className="w-full py-2 pl-10 pr-4 border border-neutral-300 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
        </form>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-2">
            <nav className="flex flex-col space-y-3">
              {!user ? (
                <Link href="/auth">
                  <Button className="w-full py-2 px-4 bg-primary text-white">
                    Login / Register
                  </Button>
                </Link>
              ) : (
                <div className="space-y-3">
                  {!isAdmin && (
                    <>
                      <Link href="/menu">
                        <Button 
                          variant={location === '/menu' ? "secondary" : "ghost"}
                          className="flex items-center w-full justify-start py-2 px-3"
                        >
                          <i className="ri-restaurant-line mr-3"></i>
                          Menu
                        </Button>
                      </Link>
                      
                      <Link href="/orders">
                        <Button 
                          variant={location === '/orders' ? "secondary" : "ghost"}
                          className="flex items-center w-full justify-start py-2 px-3"
                        >
                          <i className="ri-file-list-3-line mr-3"></i>
                          Order History
                        </Button>
                      </Link>
                      
                      <Button 
                        variant="ghost"
                        className="flex items-center w-full justify-start py-2 px-3"
                        onClick={() => {
                          onCartClick && onCartClick();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <i className="ri-shopping-cart-2-line mr-3"></i>
                        Cart
                        {cartItemsCount > 0 && (
                          <span className="ml-auto bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {cartItemsCount}
                          </span>
                        )}
                      </Button>
                    </>
                  )}
                  
                  {isAdmin && (
                    <>
                      <Link href="/admin/orders">
                        <Button 
                          variant={location === '/admin/orders' ? "secondary" : "ghost"}
                          className="flex items-center w-full justify-start py-2 px-3"
                        >
                          <i className="ri-file-list-3-line mr-3"></i>
                          Orders
                        </Button>
                      </Link>
                      
                      <Link href="/admin/menu">
                        <Button 
                          variant={location === '/admin/menu' ? "secondary" : "ghost"}
                          className="flex items-center w-full justify-start py-2 px-3"
                        >
                          <i className="ri-restaurant-line mr-3"></i>
                          Menu Items
                        </Button>
                      </Link>
                    </>
                  )}
                  
                  <div className="border-t border-neutral-300 my-1 px-3"></div>
                  
                  {user.isAdmin && (
                    <Button 
                      variant="ghost"
                      className="flex items-center w-full justify-start py-2 px-3"
                      onClick={isAdmin ? switchToUser : switchToAdmin}
                    >
                      <i className="ri-switch-line mr-3"></i>
                      <span>{isAdmin ? 'Switch to User Mode' : 'Switch to Admin Mode'}</span>
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost"
                    className="flex items-center w-full justify-start py-2 px-3 text-red-500"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <i className="ri-logout-box-line mr-3"></i>
                    Logout
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
