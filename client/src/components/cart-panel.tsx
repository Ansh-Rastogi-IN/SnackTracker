import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/pages/menu-page";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { X } from "lucide-react";

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart: () => void;
}

export default function CartPanel({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate total
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async (cartItems: CartItem[]) => {
      const orderData = {
        items: cartItems.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: subtotal
      };
      
      const res = await apiRequest("POST", "/api/orders", orderData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/active"] });
      onClose();
      onClearCart();
      setLocation("/orders");
      toast({
        title: "Order placed",
        description: "Your order has been successfully placed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!isMounted) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden transition-opacity duration-300">
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" 
              onClick={onClose}
            />
            
            <div className="absolute inset-y-0 right-0 max-w-full flex">
              <div className="relative w-screen max-w-md transform transition ease-in-out duration-300 translate-x-0">
                <div className="h-full flex flex-col bg-white shadow-xl">
                  <div className="px-4 py-6 bg-primary text-white sm:px-6">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-medium">Your Cart</h2>
                      <button onClick={onClose} className="text-white hover:text-gray-200">
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                    {items.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-4 bg-neutral-200 rounded-full flex items-center justify-center">
                          <i className="ri-shopping-cart-line text-3xl text-neutral-400"></i>
                        </div>
                        <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
                        <p className="text-neutral-400 mb-6">Looks like you haven't added any items to your cart yet.</p>
                        <Button 
                          onClick={() => {
                            onClose();
                            setLocation("/menu");
                          }}
                          className="bg-primary hover:bg-orange-600"
                        >
                          Browse Menu
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {items.map(item => (
                          <div key={item.id} className="flex py-4 border-b border-neutral-200">
                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                              {item.category === 'veg' && (
                                <div className="text-accent text-3xl">
                                  <i className="ri-plant-line"></i>
                                </div>
                              )}
                              {item.category === 'nonveg' && (
                                <div className="text-red-500 text-3xl">
                                  <i className="ri-restaurant-line"></i>
                                </div>
                              )}
                              {item.category === 'beverages' && (
                                <div className="text-blue-500 text-3xl">
                                  <i className="ri-cup-line"></i>
                                </div>
                              )}
                              {item.category === 'snacks' && (
                                <div className="text-yellow-500 text-3xl">
                                  <i className="ri-cake-line"></i>
                                </div>
                              )}
                            </div>
                            
                            <div className="ml-4 flex flex-1 flex-col">
                              <div>
                                <div className="flex justify-between text-base font-medium text-neutral-500">
                                  <h3>{item.name}</h3>
                                  <p className="ml-4">₹{item.price}</p>
                                </div>
                                <p className="mt-1 text-sm text-neutral-400 capitalize">{item.category}</p>
                              </div>
                              <div className="flex flex-1 items-end justify-between">
                                <div className="flex items-center">
                                  <button 
                                    className="p-1 text-neutral-400 hover:text-neutral-500"
                                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                  >
                                    <i className="ri-subtract-line"></i>
                                  </button>
                                  <span className="mx-2 text-neutral-500">{item.quantity}</span>
                                  <button 
                                    className="p-1 text-neutral-400 hover:text-neutral-500"
                                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                  >
                                    <i className="ri-add-line"></i>
                                  </button>
                                </div>
                                <button 
                                  className="text-primary hover:text-orange-600 text-sm"
                                  onClick={() => onRemoveItem(item.id)}
                                >
                                  <i className="ri-delete-bin-line"></i> Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {items.length > 0 && (
                    <div className="border-t border-neutral-200 p-6">
                      <div className="flex justify-between text-base font-medium text-neutral-500 mb-4">
                        <p>Subtotal</p>
                        <p>₹{subtotal}</p>
                      </div>
                      <p className="text-sm text-neutral-400 mb-6">Taxes and delivery fees calculated at checkout.</p>
                      <Button 
                        onClick={() => checkoutMutation.mutate(items)}
                        disabled={checkoutMutation.isPending}
                        className="w-full bg-primary hover:bg-orange-600"
                      >
                        {checkoutMutation.isPending ? "Processing..." : "Checkout"}
                      </Button>
                      <div className="mt-3 flex justify-center text-center text-sm text-neutral-400">
                        <p>
                          or 
                          <button 
                            onClick={onClose}
                            className="ml-1 text-primary hover:text-orange-600 font-medium"
                          >
                            Continue Shopping
                          </button>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
