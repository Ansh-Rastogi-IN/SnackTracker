import { useState } from "react";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Loader2, AlertCircle, TrendingUp, DollarSign, ShoppingCart, BarChart3 } from "lucide-react";

interface SalesReport {
  id: number;
  date: string;
  totalSales: number;
  totalOrders: number;
  cashSales: number;
  onlineSales: number;
  generatedBy: number;
}

export default function StaffSalesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  // Fetch sales reports for the staff's canteen
  const { data: salesReports, isLoading } = useQuery<SalesReport[]>({
    queryKey: ["/api/staff/sales"],
    enabled: !!user?.canteenId,
  });

  // Generate new sales report mutation
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/staff/sales", {
        canteenId: user?.canteenId,
        date: new Date().toISOString(),
        totalSales: Math.floor(Math.random() * 5000) + 1000, // Mock data for prototype
        totalOrders: Math.floor(Math.random() * 50) + 10,
        cashSales: Math.floor(Math.random() * 3000) + 500,
        onlineSales: Math.floor(Math.random() * 2000) + 500,
        generatedBy: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/sales"] });
      toast({
        title: "Report generated",
        description: "Daily sales report has been generated successfully.",
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

  // Calculate summary statistics
  const todayReports = salesReports?.filter(report => 
    format(new Date(report.date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  ) || [];

  const totalTodaySales = todayReports.reduce((sum, report) => sum + report.totalSales, 0);
  const totalTodayOrders = todayReports.reduce((sum, report) => sum + report.totalOrders, 0);
  const totalTodayCash = todayReports.reduce((sum, report) => sum + report.cashSales, 0);
  const totalTodayOnline = todayReports.reduce((sum, report) => sum + report.onlineSales, 0);

  const periodOptions = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header cartItemsCount={0} />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-poppins font-semibold">Sales Reporting</h2>
          <Button 
            onClick={() => generateReportMutation.mutate()}
            disabled={generateReportMutation.isPending}
            className="bg-primary hover:bg-orange-600"
          >
            {generateReportMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>

        {/* Period Filter */}
        <div className="mb-6">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Total Sales</p>
                  <p className="text-2xl font-bold text-primary">₹{totalTodaySales}</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Total Orders</p>
                  <p className="text-2xl font-bold text-green-600">{totalTodayOrders}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Cash Sales</p>
                  <p className="text-2xl font-bold text-blue-600">₹{totalTodayCash}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Online Sales</p>
                  <p className="text-2xl font-bold text-purple-600">₹{totalTodayOnline}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Reports List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : salesReports && salesReports.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-4">Recent Reports</h3>
            {salesReports.slice(0, 10).map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">Daily Sales Report</h4>
                      <p className="text-sm text-neutral-500">
                        {format(new Date(report.date), "PPP")}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Generated
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-500">Total Sales</p>
                      <p className="font-semibold">₹{report.totalSales}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Orders</p>
                      <p className="font-semibold">{report.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Cash</p>
                      <p className="font-semibold">₹{report.cashSales}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Online</p>
                      <p className="font-semibold">₹{report.onlineSales}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-neutral-200 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No sales reports yet</h3>
            <p className="text-neutral-400 mb-6">Generate your first sales report to start tracking performance.</p>
            <Button 
              onClick={() => generateReportMutation.mutate()}
              disabled={generateReportMutation.isPending}
              className="bg-primary hover:bg-orange-600"
            >
              Generate First Report
            </Button>
          </div>
        )}
      </main>
      
      <MobileNav activeView="sales" cartItemsCount={0} staffMode={true} />
    </div>
  );
} 