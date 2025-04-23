import { useState } from "react";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import OrderStatus from "@/components/order-status";
import { useQuery } from "@tanstack/react-query";
import { Order, OrderWithItems } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AlertCircle, Loader2 } from "lucide-react";

export default function OrdersPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const { toast } = useToast();

  // Fetch active order if exists
  const { 
    data: activeOrder,
    isLoading: isLoadingActive
  } = useQuery<OrderWithItems | null>({
    queryKey: ["/api/orders/active"],
  });

  // Fetch order history
  const { 
    data: orderHistory,
    isLoading: isLoadingHistory
  } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders/history"],
  });

  // Mutation to mark an order as completed
  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      await apiRequest("POST", `/api/orders/${orderId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/history"] });
      toast({
        title: "Order completed",
        description: "Your order has been marked as picked up.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to reorder
  const reorderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      await apiRequest("POST", `/api/orders/${orderId}/reorder`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/history"] });
      toast({
        title: "Order placed",
        description: "Your reorder has been placed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingActive || isLoadingHistory;

  return (
    <div className="min-h-screen flex flex-col">
      <Header cartItemsCount={cartItems.length} />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <h2 className="text-2xl font-poppins font-semibold mb-6">Your Orders</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Active Order Section */}
            {activeOrder && (
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Active Order</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-neutral-400">Order #{activeOrder.id}</p>
                        <p className="text-sm text-neutral-400">
                          Placed at {format(new Date(activeOrder.createdAt), "hh:mm a")}
                        </p>
                      </div>
                      <Badge 
                        className={`
                          ${activeOrder.status === 'received' ? 'bg-status-received' : 
                            activeOrder.status === 'preparing' ? 'bg-status-preparing' : 
                            'bg-status-ready'}
                        `}
                      >
                        {activeOrder.status === 'received' ? 'Order Received' : 
                         activeOrder.status === 'preparing' ? 'Preparing' : 
                         'Ready for Pickup'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {activeOrder.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.menuItem.name}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    
                    <OrderStatus status={activeOrder.status} />
                    
                    <div className="flex justify-between items-center border-t border-neutral-200 pt-4 mt-4">
                      <p className="font-medium">Total: ₹{activeOrder.totalAmount}</p>
                      {activeOrder.status === 'ready' && (
                        <Button 
                          onClick={() => completeOrderMutation.mutate(activeOrder.id)}
                          disabled={completeOrderMutation.isPending}
                          className="text-sm bg-accent hover:bg-green-600"
                        >
                          {completeOrderMutation.isPending ? "Processing..." : "Picked Up"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Past Orders */}
            {orderHistory && orderHistory.length > 0 ? (
              <div>
                <h3 className="text-lg font-medium mb-4">Past Orders</h3>
                <div className="space-y-4">
                  {orderHistory.map(order => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm text-neutral-400">Order #{order.id}</p>
                            <p className="text-sm text-neutral-400">
                              {format(new Date(order.createdAt), "PPP 'at' p")}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-neutral-300 text-neutral-500">
                            Completed
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          {order.items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.menuItem.name}</span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-neutral-200 pt-4">
                          <p className="font-medium">Total: ₹{order.totalAmount}</p>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => reorderMutation.mutate(order.id)}
                              disabled={reorderMutation.isPending}
                              className="text-sm bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                            >
                              Reorder
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-sm border border-primary text-primary hover:bg-primary hover:bg-opacity-10"
                            >
                              Rate Order
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-neutral-200 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-neutral-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                <p className="text-neutral-400 mb-6">You haven't placed any orders yet.</p>
                <Button 
                  onClick={() => window.location.href = "/menu"}
                  className="bg-primary hover:bg-orange-600"
                >
                  Browse Menu
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      
      <MobileNav activeView="orders" cartItemsCount={cartItems.length} />
    </div>
  );
}
