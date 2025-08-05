import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { OrderWithItems } from "@shared/schema";

export default function TestDashboard() {
  const { user, isAdmin, switchToAdmin, switchToUser } = useAuth();
  const [activeView, setActiveView] = useState<'customer' | 'admin'>('customer');

  // Fetch orders for both views
  const { data: customerOrders } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders/active"],
    enabled: activeView === 'customer',
  });

  const { data: adminOrders } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/admin/orders/active"],
    enabled: activeView === 'admin',
  });

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This test dashboard is only available for admin users.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">Test Dashboard</h1>
          <p className="text-neutral-600">Test both customer and admin functionality side by side</p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeView === 'customer' ? 'default' : 'outline'}
            onClick={() => setActiveView('customer')}
            className="flex-1"
          >
            <i className="ri-user-line mr-2"></i>
            Customer View
          </Button>
          <Button
            variant={activeView === 'admin' ? 'default' : 'outline'}
            onClick={() => setActiveView('admin')}
            className="flex-1"
          >
            <i className="ri-admin-line mr-2"></i>
            Admin View
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open('/menu', '_blank')}
              >
                <i className="ri-restaurant-line mr-2"></i>
                Open Menu (New Tab)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open('/admin/orders', '_blank')}
              >
                <i className="ri-file-list-3-line mr-2"></i>
                Open Admin Orders (New Tab)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open('/orders', '_blank')}
              >
                <i className="ri-time-line mr-2"></i>
                Open Customer Orders (New Tab)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-neutral-500">Username:</span>
                  <p className="font-medium">{user.username}</p>
                </div>
                <div>
                  <span className="text-sm text-neutral-500">Role:</span>
                  <Badge variant="outline" className="ml-2">
                    {user.isAdmin ? 'Admin' : 'Customer'}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-neutral-500">Current View:</span>
                  <Badge className="ml-2 bg-primary">
                    {activeView === 'admin' ? 'Admin' : 'Customer'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Customer Orders:</span>
                  <Badge variant="outline">{customerOrders?.length || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Admin Orders:</span>
                  <Badge variant="outline">{adminOrders?.length || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Active:</span>
                  <Badge className="bg-primary">
                    {(customerOrders?.length || 0) + (adminOrders?.length || 0)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="ri-user-line mr-2"></i>
                Customer Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerOrders && customerOrders.length > 0 ? (
                <div className="space-y-3">
                  {customerOrders.map(order => (
                    <div key={order.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">Order #{order.id}</span>
                        <Badge className={`
                          ${order.status === 'received' ? 'bg-yellow-100 text-yellow-800' : 
                            order.status === 'preparing' ? 'bg-orange-100 text-orange-800' : 
                            'bg-green-100 text-green-800'}
                        `}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-neutral-600">
                        {order.items.map(item => `${item.quantity}x ${item.menuItem.name}`).join(', ')}
                      </div>
                      <div className="text-sm font-medium mt-1">
                        Total: ₹{order.totalAmount}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-4">No customer orders found</p>
              )}
            </CardContent>
          </Card>

          {/* Admin Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="ri-admin-line mr-2"></i>
                Admin Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {adminOrders && adminOrders.length > 0 ? (
                <div className="space-y-3">
                  {adminOrders.map(order => (
                    <div key={order.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">Order #{order.id}</span>
                        <Badge className={`
                          ${order.status === 'received' ? 'bg-yellow-100 text-yellow-800' : 
                            order.status === 'preparing' ? 'bg-orange-100 text-orange-800' : 
                            'bg-green-100 text-green-800'}
                        `}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-neutral-600">
                        Customer ID: {order.userId}
                      </div>
                      <div className="text-sm text-neutral-600">
                        {order.items.map(item => `${item.quantity}x ${item.menuItem.name}`).join(', ')}
                      </div>
                      <div className="text-sm font-medium mt-1">
                        Total: ₹{order.totalAmount}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-4">No admin orders found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium mb-1">1. Test Order Placement:</h4>
                <p className="text-neutral-600">Open the menu in a new tab, add items to cart, and place an order. Watch it appear in both customer and admin views.</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">2. Test Order Status Updates:</h4>
                <p className="text-neutral-600">Open admin orders in a new tab, update order status, and watch the changes reflect in customer orders.</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">3. Real-time Updates:</h4>
                <p className="text-neutral-600">Both views automatically refresh every few seconds to show real-time updates.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 