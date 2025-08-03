import { useState } from "react";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Plus, Loader2, AlertCircle, DollarSign } from "lucide-react";

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  recordedBy: number;
}

export default function StaffExpensesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "",
  });

  // Fetch expenses for the staff's canteen
  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/staff/expenses"],
    enabled: !!user?.canteenId,
  });

  // Add new expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      await apiRequest("POST", "/api/staff/expenses", {
        ...expenseData,
        canteenId: user?.canteenId,
        recordedBy: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/expenses"] });
      setIsAddDialogOpen(false);
      setNewExpense({ description: "", amount: "", category: "" });
      toast({
        title: "Expense added",
        description: "New expense has been recorded successfully.",
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

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.category) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    addExpenseMutation.mutate({
      description: newExpense.description,
      amount: parseInt(newExpense.amount),
      category: newExpense.category,
      date: new Date().toISOString(),
    });
  };

  const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

  const expenseCategories = [
    "Utilities",
    "Maintenance", 
    "Supplies",
    "Equipment",
    "Cleaning",
    "Other"
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header cartItemsCount={0} />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-poppins font-semibold">Expense Tracking</h2>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter expense description"
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newExpense.category} onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleAddExpense}
                  disabled={addExpenseMutation.isPending}
                  className="w-full"
                >
                  {addExpenseMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Expense"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Total Expenses</p>
                <p className="text-3xl font-bold text-primary">₹{totalExpenses}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : expenses && expenses.length > 0 ? (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <Card key={expense.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{expense.description}</h3>
                    <Badge variant="outline">{expense.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-500">
                      {format(new Date(expense.date), "PPP")}
                    </p>
                    <p className="text-lg font-semibold text-primary">₹{expense.amount}</p>
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
            <h3 className="text-lg font-medium mb-2">No expenses recorded</h3>
            <p className="text-neutral-400">Start tracking your canteen expenses by adding the first entry.</p>
          </div>
        )}
      </main>
      
      <MobileNav activeView="expenses" cartItemsCount={0} staffMode={true} />
    </div>
  );
} 