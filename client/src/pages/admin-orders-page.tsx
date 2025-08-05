import { useState, useEffect } from "react";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import { useQuery } from "@tanstack/react-query";
import { Order, OrderWithItems } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function AdminOrdersPage() {
  const { isAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [lastOrderCount, setLastOrderCount] = useState<number>(0);
  const { toast } = useToast();

  // Fetch active orders with real-time updates
  const { 
    data: activeOrders,
    isLoading: isLoadingActive
  } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/admin/orders/active"],
    enabled: isAdmin,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
    refetchIntervalInBackground: true,
  });

  // Fetch order history
  const { 
    data: orderHistory,
    isLoading: isLoadingHistory
  } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/admin/orders/history"],
    enabled: isAdmin,
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchIntervalInBackground: true,
  });

  // Mutation to update order status
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: string }) => {
      await apiRequest("POST", `/api/admin/orders/${orderId}/status`, { status });
    },
    onSuccess: (_, { status }) => {
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders/history"] });
      
      // Invalidate customer queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/orders/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/history"] });
      
      toast({
        title: "Status updated",
        description: `Order status has been updated to "${status}". Customer will be notified.`,
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

  // Check for new orders and show notifications
  useEffect(() => {
    if (activeOrders && activeOrders.length > lastOrderCount && lastOrderCount > 0) {
      const newOrdersCount = activeOrders.length - lastOrderCount;
      toast({
        title: "New Order(s) Received!",
        description: `${newOrdersCount} new order(s) have been placed and are waiting for your attention.`,
      });
    }
    setLastOrderCount(activeOrders?.length || 0);
  }, [activeOrders, lastOrderCount, toast]);

  const filteredActiveOrders = activeOrders
    ? activeOrders.filter(order => {
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        const matchesSearch = !searchQuery || 
          order.id.toString().includes(searchQuery) || 
          order.userId.toString().includes(searchQuery);
        const matchesDate = !dateFilter || 
          format(new Date(order.createdAt), "yyyy-MM-dd") === dateFilter;
          
        return matchesStatus && matchesSearch && matchesDate;
      })
    : [];

  const filteredOrderHistory = orderHistory
    ? orderHistory.filter(order => {
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        const matchesSearch = !searchQuery || 
          order.id.toString().includes(searchQuery) || 
          order.userId.toString().includes(searchQuery);
        const matchesDate = !dateFilter || 
          format(new Date(order.createdAt), "yyyy-MM-dd") === dateFilter;
          
        return matchesStatus && matchesSearch && matchesDate;
      })
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-poppins font-semibold">Order Management</h2>
          <div className="flex space-x-2">
            <Button 
              variant="secondary"
              className="py-2 px-4 text-sm font-medium rounded-md"
            >
              Orders
            </Button>
            <Button 
              variant="outline"
              className="py-2 px-4 text-sm font-medium rounded-md"
              onClick={() => window.location.href = "/admin/menu"}
            >
              Menu Items
            </Button>
            <Button 
              variant="outline"
              className="py-2 px-4 text-sm font-medium rounded-md"
              onClick={() => window.location.href = "/test"}
            >
              Test Dashboard
            </Button>
            <Button 
              variant="outline"
              className="py-2 px-4 text-sm font-medium rounded-md"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/admin/orders/active"] });
                queryClient.invalidateQueries({ queryKey: ["/api/admin/orders/history"] });
                toast({
                  title: "Refreshed",
                  description: "Orders have been refreshed.",
                });
              }}
            >
              <i className="ri-refresh-line mr-2"></i>
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Order Summary Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <i className="ri-file-list-3-line text-blue-600 text-xl"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-500">Total Active</p>
                <p className="text-2xl font-bold text-neutral-700">{activeOrders?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <i className="ri-time-line text-yellow-600 text-xl"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-500">Received</p>
                <p className="text-2xl font-bold text-neutral-700">
                  {activeOrders?.filter(order => order.status === 'received').length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <i className="ri-fire-line text-orange-600 text-xl"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-500">Preparing</p>
                <p className="text-2xl font-bold text-neutral-700">
                  {activeOrders?.filter(order => order.status === 'preparing').length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="ri-check-line text-green-600 text-xl"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-500">Ready</p>
                <p className="text-2xl font-bold text-neutral-700">
                  {activeOrders?.filter(order => order.status === 'ready').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Order Filters */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="orderStatus" className="block text-sm font-medium text-neutral-400 mb-1">Order Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Orders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready for Pickup</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="orderDate" className="block text-sm font-medium text-neutral-400 mb-1">Date</Label>
              <Input 
                type="date" 
                id="orderDate" 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="searchOrder" className="block text-sm font-medium text-neutral-400 mb-1">Search Order</Label>
              <Input 
                type="text" 
                id="searchOrder" 
                placeholder="Order ID or Customer ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          </div>
        ) : (
          <>
            {/* Active Orders */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Active Orders</h3>
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-lg shadow-md">
                  <thead>
                    <tr className="text-left border-b border-neutral-200">
                      <th className="p-4 font-medium text-neutral-500">Order ID</th>
                      <th className="p-4 font-medium text-neutral-500">Customer ID</th>
                      <th className="p-4 font-medium text-neutral-500">Items</th>
                      <th className="p-4 font-medium text-neutral-500">Total</th>
                      <th className="p-4 font-medium text-neutral-500">Status</th>
                      <th className="p-4 font-medium text-neutral-500">Time</th>
                      <th className="p-4 font-medium text-neutral-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActiveOrders.length > 0 ? (
                      filteredActiveOrders.map(order => (
                        <tr key={order.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                          <td className="p-4">#{order.id}</td>
                          <td className="p-4">{order.userId}</td>
                          <td className="p-4">
                            {order.items.map(item => `${item.quantity}x ${item.menuItem.name}`).join(", ")}
                          </td>
                          <td className="p-4">₹{order.totalAmount}</td>
                          <td className="p-4">
                            <Badge className={`
                              ${order.status === 'received' ? 'bg-status-received' : 
                                order.status === 'preparing' ? 'bg-status-preparing' : 
                                'bg-status-ready'}
                            `}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="p-4">{format(new Date(order.createdAt), "p")}</td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              {order.status === 'received' && (
                                <Button 
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => updateOrderStatusMutation.mutate({ 
                                    orderId: order.id, 
                                    status: 'preparing' 
                                  })}
                                  disabled={updateOrderStatusMutation.isPending}
                                >
                                  Prepare
                                </Button>
                              )}
                              
                              {order.status === 'preparing' && (
                                <Button 
                                  className="bg-accent text-white"
                                  size="sm"
                                  onClick={() => updateOrderStatusMutation.mutate({ 
                                    orderId: order.id, 
                                    status: 'ready' 
                                  })}
                                  disabled={updateOrderStatusMutation.isPending}
                                >
                                  Ready
                                </Button>
                              )}
                              
                              {order.status === 'ready' && (
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateOrderStatusMutation.mutate({ 
                                    orderId: order.id, 
                                    status: 'completed' 
                                  })}
                                  disabled={updateOrderStatusMutation.isPending}
                                >
                                  Complete
                                </Button>
                              )}
                              
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-neutral-400">
                          No active orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Order History */}
            <div>
              <h3 className="text-lg font-medium mb-4">Order History</h3>
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-lg shadow-md">
                  <thead>
                    <tr className="text-left border-b border-neutral-200">
                      <th className="p-4 font-medium text-neutral-500">Order ID</th>
                      <th className="p-4 font-medium text-neutral-500">Customer ID</th>
                      <th className="p-4 font-medium text-neutral-500">Items</th>
                      <th className="p-4 font-medium text-neutral-500">Total</th>
                      <th className="p-4 font-medium text-neutral-500">Status</th>
                      <th className="p-4 font-medium text-neutral-500">Date & Time</th>
                      <th className="p-4 font-medium text-neutral-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrderHistory.length > 0 ? (
                      filteredOrderHistory.map(order => (
                        <tr key={order.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                          <td className="p-4">#{order.id}</td>
                          <td className="p-4">{order.userId}</td>
                          <td className="p-4">
                            {order.items.map(item => `${item.quantity}x ${item.menuItem.name}`).join(", ")}
                          </td>
                          <td className="p-4">₹{order.totalAmount}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="bg-neutral-200 text-neutral-500">
                              {order.status}
                            </Badge>
                          </td>
                          <td className="p-4">{format(new Date(order.createdAt), "PPP 'at' p")}</td>
                          <td className="p-4">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-neutral-400">
                          No order history found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
      
      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              {selectedOrder && format(new Date(selectedOrder.createdAt), "PPP 'at' p")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Customer</h4>
                <p>ID: {selectedOrder.userId}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <span className="font-medium">{item.quantity}x</span> {item.menuItem.name}
                      </div>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>₹{selectedOrder.totalAmount}</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Order Status</h4>
                <Badge className={`
                  ${selectedOrder.status === 'received' ? 'bg-status-received' : 
                    selectedOrder.status === 'preparing' ? 'bg-status-preparing' : 
                    selectedOrder.status === 'ready' ? 'bg-status-ready' :
                    'bg-neutral-200 text-neutral-500'}
                `}>
                  {selectedOrder.status}
                </Badge>
              </div>
              
              {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                <div className="flex justify-end space-x-2 pt-4">
                  {selectedOrder.status === 'received' && (
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        updateOrderStatusMutation.mutate({ 
                          orderId: selectedOrder.id, 
                          status: 'preparing' 
                        });
                        setSelectedOrder(null);
                      }}
                      disabled={updateOrderStatusMutation.isPending}
                    >
                      Mark as Preparing
                    </Button>
                  )}
                  
                  {selectedOrder.status === 'preparing' && (
                    <Button 
                      className="bg-accent text-white"
                      onClick={() => {
                        updateOrderStatusMutation.mutate({ 
                          orderId: selectedOrder.id, 
                          status: 'ready' 
                        });
                        setSelectedOrder(null);
                      }}
                      disabled={updateOrderStatusMutation.isPending}
                    >
                      Mark as Ready
                    </Button>
                  )}
                  
                  {selectedOrder.status === 'ready' && (
                    <Button 
                      variant="default"
                      onClick={() => {
                        updateOrderStatusMutation.mutate({ 
                          orderId: selectedOrder.id, 
                          status: 'completed' 
                        });
                        setSelectedOrder(null);
                      }}
                      disabled={updateOrderStatusMutation.isPending}
                    >
                      Mark as Completed
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <MobileNav adminMode={true} activeView="admin-orders" />
    </div>
  );
}
