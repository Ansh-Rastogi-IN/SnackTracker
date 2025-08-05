import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import MenuPage from "@/pages/menu-page";
import OrdersPage from "@/pages/orders-page";
import AdminOrdersPage from "@/pages/admin-orders-page";
import AdminMenuPage from "@/pages/admin-menu-page";
import StaffOrdersPage from "@/pages/staff-orders-page";
import StaffInventoryPage from "@/pages/staff-inventory-page";
import StaffMenuPage from "@/pages/staff-menu-page";
import StaffExpensesPage from "@/pages/staff-expenses-page";
import StaffSalesPage from "@/pages/staff-sales-page";
import TestDashboard from "@/pages/test-dashboard";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { CartProvider } from "./contexts/cart-context";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Customer routes */}
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/menu" component={MenuPage} roles={["customer", "staff", "admin"]} />
      <ProtectedRoute path="/orders" component={OrdersPage} roles={["customer", "staff", "admin"]} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin/orders" component={AdminOrdersPage} roles={["admin"]} />
      <ProtectedRoute path="/admin/menu" component={AdminMenuPage} roles={["admin"]} />
      <ProtectedRoute path="/test" component={TestDashboard} roles={["admin"]} />
      
      {/* Staff routes */}
      <ProtectedRoute path="/staff/orders" component={StaffOrdersPage} roles={["staff"]} />
      <ProtectedRoute path="/staff/inventory" component={StaffInventoryPage} roles={["staff"]} />
      <ProtectedRoute path="/staff/menu" component={StaffMenuPage} roles={["staff"]} />
      <ProtectedRoute path="/staff/expenses" component={StaffExpensesPage} roles={["staff"]} />
      <ProtectedRoute path="/staff/sales" component={StaffSalesPage} roles={["staff"]} />
      
      {/* 404 route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
