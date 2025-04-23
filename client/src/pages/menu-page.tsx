import { useState } from "react";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import CategoryFilter from "@/components/category-filter";
import MenuCard from "@/components/menu-card";
import CartPanel from "@/components/cart-panel";
import { useQuery } from "@tanstack/react-query";
import { MenuItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  const addToCart = (item: MenuItem) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((cartItem) => cartItem.id === item.id);
      
      if (existingItem) {
        // Increase quantity if item already exists
        return prevItems.map((cartItem) => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 } 
            : cartItem
        );
      } else {
        // Add new item with quantity 1
        return [...prevItems, { 
          id: item.id, 
          name: item.name, 
          price: item.price, 
          quantity: 1, 
          category: item.category 
        }];
      }
    });
    
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems((prevItems) => 
      prevItems.map((item) => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id: number) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

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
        cartItemsCount={cartItems.length} 
        onCartClick={() => setIsCartOpen(true)} 
      />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        {/* Categories Filter */}
        <CategoryFilter 
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory} 
        />
        
        {isLoading ? (
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
                    onAddToCart={() => addToCart(item)}
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
                      onAddToCart={() => addToCart(item)}
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
      
      <MobileNav activeView="menu" cartItemsCount={cartItems.length} onCartClick={() => setIsCartOpen(true)} />
      
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
