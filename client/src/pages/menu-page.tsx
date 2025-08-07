import { useState, useEffect, useCallback } from "react";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import CategoryFilter from "@/components/category-filter";
import MenuCard from "@/components/menu-card";
import CartPanel from "@/components/cart-panel";
import { useQuery } from "@tanstack/react-query";
import { MenuItem, Canteen } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useCart } from "@/contexts/cart-context";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
};

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCanteenId, setSelectedCanteenId] = useState<string>("1"); // Default to first canteen
  const { toast } = useToast();
  
  // Use global cart context
  const { cartItems, addToCart, updateQuantity, removeFromCart, clearCart, getCartItemsCount } = useCart();

  // Fetch all canteens
  const { data: canteens, isLoading: canteensLoading } = useQuery<Canteen[]>({
    queryKey: ["/api/canteens"],
  });

  // Fetch menu items for the selected canteen
  const { data: menuItems, isLoading: menuItemsLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/canteens", selectedCanteenId, "menu-items"],
    queryFn: async () => {
      const res = await fetch(`/api/menu-items?canteenId=${selectedCanteenId}`);
      if (!res.ok) throw new Error("Failed to fetch menu items");
      return res.json();
    },
    enabled: !!selectedCanteenId,
  });
  
  // Get selected canteen details
  const selectedCanteen = canteens?.find(c => c.id === parseInt(selectedCanteenId));

  // Enhanced addToCart function with validation and toast notifications
  const handleAddToCart = useCallback((item: MenuItem) => {
    // Validate item before adding to cart
    if (!item || !item.id || !item.name || !item.price) {
      toast({
        title: "Error",
        description: "Invalid item. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Check if item is available
    if (!item.isAvailable) {
      toast({
        title: "Item unavailable",
        description: `${item.name} is currently out of stock.`,
        variant: "destructive",
      });
      return;
    }

    // Add to cart using global context
    addToCart(item);
    
    // Show success message
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    });
  }, [addToCart, toast]);



  const filterMenuItems = (items: MenuItem[] | undefined, category: string) => {
    if (!items) return [];
    
    if (category === "all") {
      return items;
    }
    
    return items.filter((item) => item.category === category);
  };

  // Separate popular items (could be based on tags, ratings, etc.)
  const popularItems = menuItems?.slice(0, 3) || [];
  const filteredItems = filterMenuItems(menuItems, activeCategory);

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        cartItemsCount={getCartItemsCount()} 
        onCartClick={() => setIsCartOpen(true)} 
      />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        {/* Canteen Selector */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold">Select Canteen</h1>
              <p className="text-muted-foreground">Choose a canteen to view its menu</p>
            </div>
            
            <div className="w-full md:w-64">
              {canteensLoading ? (
                <div className="h-10 bg-muted animate-pulse rounded"></div>
              ) : (
                <Select
                  value={selectedCanteenId}
                  onValueChange={setSelectedCanteenId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a canteen" />
                  </SelectTrigger>
                  <SelectContent>
                    {canteens?.map((canteen) => (
                      <SelectItem key={canteen.id} value={canteen.id.toString()}>
                        {canteen.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          
          {selectedCanteen && (
            <div className="bg-card rounded-lg p-4 mb-6 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                {selectedCanteen.imageUrl && (
                  <div className="w-full md:w-48">
                    <img 
                      src={selectedCanteen.imageUrl} 
                      alt={selectedCanteen.name}
                      className="w-full h-32 md:h-full object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedCanteen.name}</h2>
                  <div className="flex items-center text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{selectedCanteen.location}</span>
                  </div>
                  {selectedCanteen.description && (
                    <p className="text-sm text-muted-foreground">{selectedCanteen.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Categories Filter */}
        <CategoryFilter 
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory} 
        />
        

        
        {canteensLoading || menuItemsLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Popular Items Section */}
            <section className="mb-8">
              <h2 className="text-xl font-poppins font-semibold mb-4">Popular Items</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularItems.map((item) => (
                  <MenuCard 
                    key={item.id}
                    item={item}
                    onAddToCart={() => handleAddToCart(item)}
                  />
                ))}
              </div>
            </section>
            
            {/* All Menu Items */}
            <section>
              <h2 className="text-xl font-poppins font-semibold mb-4">Menu Items</h2>
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredItems.map((item) => (
                    <MenuCard 
                      key={item.id}
                      item={item}
                      onAddToCart={() => handleAddToCart(item)}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-400">No items found in this category.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
      
      <MobileNav activeView="menu" cartItemsCount={getCartItemsCount()} onCartClick={() => setIsCartOpen(true)} />
      
      <CartPanel 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
      />
    </div>
  );
}
