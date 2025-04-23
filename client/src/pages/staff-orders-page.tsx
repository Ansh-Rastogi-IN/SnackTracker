import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import OrderStatus from "@/components/order-status";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";
import type { OrderWithItems } from "@shared/schema";

export default function StaffOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeView, setActiveView] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Get active orders for the staff's canteen
  const {
    data: activeOrders,
    isLoading: isLoadingActive,
    refetch: refetchActiveOrders,
  } = useQuery<OrderWithItems[], Error>({
    queryKey: ["/api/staff/orders/active"],
    enabled: !!user,
  });

  // Get order history for the staff's canteen
  const {
    data: orderHistory,
    isLoading: isLoadingHistory,
    refetch: refetchOrderHistory,
  } = useQuery<OrderWithItems[], Error>({
    queryKey: ["/api/staff/orders/history"],
    enabled: activeView === "history" && !!user,
  });

  // Automatically refetch orders every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (activeView === "active") {
        refetchActiveOrders();
      } else {
        refetchOrderHistory();
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [activeView, refetchActiveOrders, refetchOrderHistory]);

  // Function to update order status
  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await apiRequest("POST", `/api/staff/orders/${orderId}/status`, { status });
      
      toast({
        title: "Order updated",
        description: `Order #${orderId} status updated to ${status}`,
      });
      
      // Refetch orders to update the UI
      refetchActiveOrders();
      refetchOrderHistory();
    } catch (error) {
      toast({
        title: "Failed to update order",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Filter orders by search term or status
  const filterOrders = (orders: OrderWithItems[] | undefined) => {
    if (!orders) return [];
    
    return orders.filter(order => {
      // Filter by status if selected
      if (selectedStatus && order.status !== selectedStatus) {
        return false;
      }
      
      // Filter by search term (order ID or customer name)
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        const orderIdMatch = order.id.toString().includes(searchTermLower);
        const customerNameMatch = order.items.some(item => 
          item.menuItem.name.toLowerCase().includes(searchTermLower)
        );
        
        return orderIdMatch || customerNameMatch;
      }
      
      return true;
    });
  };

  const filteredActiveOrders = filterOrders(activeOrders);
  const filteredOrderHistory = filterOrders(orderHistory);

  // Render loading state
  if ((isLoadingActive && activeView === "active") || (isLoadingHistory && activeView === "history")) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex flex-grow items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        {isMobile && <MobileNav activeView="staff-orders" />}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold mb-6">Staff Order Management</h1>
          
          <Tabs defaultValue="active" onValueChange={setActiveView}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="active">Active Orders</TabsTrigger>
                <TabsTrigger value="history">Order History</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    className="pl-8 h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <TabsContent value="active">
              <ScrollArea className="h-[calc(100vh-220px)]">
                {filteredActiveOrders.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No active orders found.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredActiveOrders.map((order) => (
                      <Card key={order.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle>Order #{order.id}</CardTitle>
                            <OrderStatus status={order.status} />
                          </div>
                          <CardDescription>
                            Ordered at {new Date(order.createdAt).toLocaleTimeString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between">
                                <span>
                                  {item.quantity}x {item.menuItem.name}
                                </span>
                                <span className="font-medium">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                            <div className="pt-2 border-t flex justify-between font-bold">
                              <span>Total</span>
                              <span>${order.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-2 flex-wrap">
                          {order.status === "received" && (
                            <Button 
                              onClick={() => updateOrderStatus(order.id, "preparing")}
                              className="flex-1"
                            >
                              Start Preparing
                            </Button>
                          )}
                          {order.status === "preparing" && (
                            <Button 
                              onClick={() => updateOrderStatus(order.id, "ready")}
                              className="flex-1"
                            >
                              Mark as Ready
                            </Button>
                          )}
                          {order.status === "ready" && (
                            <Button 
                              onClick={() => updateOrderStatus(order.id, "completed")}
                              className="flex-1"
                            >
                              Complete Order
                            </Button>
                          )}
                          {(order.status === "received" || order.status === "preparing") && (
                            <Button 
                              variant="outline" 
                              onClick={() => updateOrderStatus(order.id, "cancelled")}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="history">
              <ScrollArea className="h-[calc(100vh-220px)]">
                {filteredOrderHistory.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No order history found.
                    </CardContent>
                  </Card>
                ) : (
                  <Table>
                    <TableCaption>Order history for your canteen</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrderHistory.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>
                            {new Date(order.createdAt).toLocaleDateString()}
                            <div className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {order.items.map((item) => (
                              <div key={item.id} className="text-sm">
                                {item.quantity}x {item.menuItem.name}
                              </div>
                            ))}
                          </TableCell>
                          <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                          <TableCell>
                            <OrderStatus status={order.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {isMobile && <MobileNav activeView="staff-orders" adminMode={false} />}
    </div>
  );
}