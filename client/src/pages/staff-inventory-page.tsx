import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, AlertTriangle } from "lucide-react";
import type { InventoryItem } from "@shared/schema";

// Form schema for inventory item
const inventoryFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  quantity: z.coerce.number().min(0, { message: "Quantity must be 0 or greater." }),
  unit: z.string().min(1, { message: "Unit is required." }),
  costPerUnit: z.coerce.number().min(0.01, { message: "Cost must be greater than 0." }),
  reorderLevel: z.coerce.number().min(1, { message: "Reorder level must be 1 or greater." }),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

export default function StaffInventoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Get all inventory items for the staff's canteen
  const {
    data: inventoryItems,
    isLoading: isLoadingInventory,
    refetch: refetchInventory,
  } = useQuery<InventoryItem[], Error>({
    queryKey: ["/api/staff/inventory"],
    enabled: !!user,
  });

  // Get low stock items for the staff's canteen
  const {
    data: lowStockItems,
    isLoading: isLoadingLowStock,
    refetch: refetchLowStock,
  } = useQuery<InventoryItem[], Error>({
    queryKey: ["/api/staff/inventory/low"],
    enabled: activeTab === "low" && !!user,
  });

  // Add inventory item mutation
  const addItemMutation = useMutation({
    mutationFn: async (data: InventoryFormValues) => {
      const res = await apiRequest("POST", "/api/staff/inventory", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Inventory item added",
        description: "The item has been successfully added to inventory.",
      });
      setIsAddDialogOpen(false);
      refetchInventory();
      refetchLowStock();
      queryClient.invalidateQueries({ queryKey: ["/api/staff/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/inventory/low"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update inventory item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (data: InventoryFormValues & { id: number }) => {
      const { id, ...itemData } = data;
      const res = await apiRequest("PATCH", `/api/staff/inventory/${id}`, itemData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Inventory item updated",
        description: "The item has been successfully updated.",
      });
      setIsUpdateDialogOpen(false);
      refetchInventory();
      refetchLowStock();
      queryClient.invalidateQueries({ queryKey: ["/api/staff/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/inventory/low"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form for adding new inventory item
  const addForm = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: "",
      quantity: 0,
      unit: "",
      costPerUnit: 0,
      reorderLevel: 10,
    },
  });

  // Form for updating existing inventory item
  const updateForm = useForm<InventoryFormValues & { id: number }>({
    resolver: zodResolver(inventoryFormSchema.extend({ id: z.number() })),
    defaultValues: {
      id: 0,
      name: "",
      quantity: 0,
      unit: "",
      costPerUnit: 0,
      reorderLevel: 10,
    },
  });

  // Open update dialog with selected item data
  const handleUpdateItem = (item: InventoryItem) => {
    setSelectedItem(item);
    updateForm.reset({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
      reorderLevel: item.reorderLevel,
    });
    setIsUpdateDialogOpen(true);
  };

  // Handle form submission for adding item
  const onAddSubmit = (data: InventoryFormValues) => {
    addItemMutation.mutate(data);
  };

  // Handle form submission for updating item
  const onUpdateSubmit = (data: InventoryFormValues & { id: number }) => {
    updateItemMutation.mutate(data);
  };

  // Filter inventory items by search term
  const filterItems = (items: InventoryItem[] | undefined) => {
    if (!items) return [];
    
    if (!searchTerm) return items;
    
    const searchTermLower = searchTerm.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTermLower) ||
      item.unit.toLowerCase().includes(searchTermLower)
    );
  };

  const filteredInventoryItems = filterItems(inventoryItems);
  const filteredLowStockItems = filterItems(lowStockItems);

  // Render loading state
  if ((isLoadingInventory && activeTab === "all") || (isLoadingLowStock && activeTab === "low")) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex flex-grow items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        {isMobile && <MobileNav activeView="staff-inventory" staffMode={true} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Items</TabsTrigger>
                <TabsTrigger value="low" className="relative">
                  Low Stock
                  {lowStockItems?.length ? (
                    <Badge variant="destructive" className="ml-2">
                      {lowStockItems.length}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search inventory..."
                className="pl-8 h-9 w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border">
            <TabsContent value="all" className="mt-0">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <Table>
                  <TableCaption>Inventory items for your canteen</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Cost/Unit</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventoryItems?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          No inventory items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventoryItems?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="relative">
                            {item.quantity < item.reorderLevel && (
                              <AlertTriangle className="h-4 w-4 text-destructive absolute -left-1 top-1/2 -translate-y-1/2" />
                            )}
                            <span className={item.quantity < item.reorderLevel ? "pl-4 text-destructive font-medium" : ""}>
                              {item.quantity}
                            </span>
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>${item.costPerUnit.toFixed(2)}</TableCell>
                          <TableCell>{item.reorderLevel}</TableCell>
                          <TableCell>
                            {new Date(item.lastUpdated).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" onClick={() => handleUpdateItem(item)}>
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="low" className="mt-0">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <Table>
                  <TableCaption>Items below reorder level</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Cost/Unit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLowStockItems?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No items below reorder level. Good job!
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLowStockItems?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-destructive font-medium">{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.reorderLevel}</TableCell>
                          <TableCell>${item.costPerUnit.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" onClick={() => handleUpdateItem(item)}>
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </div>
        </div>
      </main>
      
      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., kg, liters, pcs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="costPerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost per Unit ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="reorderLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Level</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={addItemMutation.isPending}>
                  {addItemMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Item
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Update Item Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Inventory Item</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
                <FormField
                  control={updateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter item name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={updateForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={updateForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., kg, liters, pcs" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={updateForm.control}
                    name="costPerUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost per Unit ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={updateForm.control}
                    name="reorderLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reorder Level</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit" disabled={updateItemMutation.isPending}>
                    {updateItemMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Item
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      
              {isMobile && <MobileNav activeView="staff-inventory" staffMode={true} />}
    </div>
  );
}