import { useState } from "react";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import { useQuery } from "@tanstack/react-query";
import { MenuItem } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Pencil, Trash } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertMenuItemSchema } from "@shared/schema";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getFoodImage } from "@/lib/food-images";

const menuItemFormSchema = insertMenuItemSchema.extend({
  id: z.number().optional(),
});

type MenuItemFormData = z.infer<typeof menuItemFormSchema>;

export default function AdminMenuPage() {
  const { isAdmin } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      category: "veg",
      isAvailable: true,
    },
  });

  // Fetch menu items
  const { 
    data: menuItems,
    isLoading 
  } = useQuery<MenuItem[]>({
    queryKey: ["/api/admin/menu-items"],
    enabled: isAdmin,
  });

  // Mutation to create menu item
  const createMenuItemMutation = useMutation({
    mutationFn: async (data: MenuItemFormData) => {
      const res = await apiRequest("POST", "/api/admin/menu-items", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu-items"] });
      toast({
        title: "Menu item created",
        description: "The menu item has been successfully created.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to update menu item
  const updateMenuItemMutation = useMutation({
    mutationFn: async (data: MenuItemFormData) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PATCH", `/api/admin/menu-items/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu-items"] });
      toast({
        title: "Menu item updated",
        description: "The menu item has been successfully updated.",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete menu item
  const deleteMenuItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/menu-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu-items"] });
      toast({
        title: "Menu item deleted",
        description: "The menu item has been successfully deleted.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedMenuItem(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to toggle availability
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: number, isAvailable: boolean }) => {
      await apiRequest("PATCH", `/api/admin/menu-items/${id}`, { isAvailable });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu-items"] });
      toast({
        title: "Availability updated",
        description: "The menu item availability has been updated.",
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

  const filteredMenuItems = menuItems
    ? menuItems.filter(item => {
        const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
        const matchesSearch = !searchQuery || 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
          
        return matchesCategory && matchesSearch;
      })
    : [];

  const handleEditMenuItem = (item: MenuItem) => {
    setSelectedMenuItem(item);
    form.reset({
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: item.price,
      imageUrl: item.imageUrl || "",
      category: item.category,
      isAvailable: item.isAvailable,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteMenuItem = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleAddNewItem = () => {
    form.reset({
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      category: "veg",
      isAvailable: true,
    });
    setIsAddDialogOpen(true);
  };

  const onAddSubmit = (data: MenuItemFormData) => {
    createMenuItemMutation.mutate(data);
  };

  const onEditSubmit = (data: MenuItemFormData) => {
    updateMenuItemMutation.mutate(data);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch(category) {
      case 'veg':
        return 'bg-accent bg-opacity-10 text-accent';
      case 'nonveg':
        return 'bg-red-500 bg-opacity-10 text-red-500';
      case 'snacks':
        return 'bg-yellow-500 bg-opacity-10 text-yellow-500';
      case 'beverages':
        return 'bg-blue-500 bg-opacity-10 text-blue-500';
      default:
        return 'bg-neutral-200 text-neutral-500';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-poppins font-semibold">Menu Management</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              className="py-2 px-4 text-sm font-medium rounded-md"
              onClick={() => window.location.href = "/admin/orders"}
            >
              Orders
            </Button>
            <Button 
              variant="secondary"
              className="py-2 px-4 text-sm font-medium rounded-md"
            >
              Menu Items
            </Button>
          </div>
        </div>
        
        {/* Menu Controls */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="menuCategory" className="block text-sm font-medium text-neutral-400 mb-1">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="veg">Veg</SelectItem>
                  <SelectItem value="nonveg">Non-Veg</SelectItem>
                  <SelectItem value="snacks">Snacks</SelectItem>
                  <SelectItem value="beverages">Beverages</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="searchMenu" className="block text-sm font-medium text-neutral-400 mb-1">Search Menu</Label>
              <Input 
                type="text" 
                id="searchMenu" 
                placeholder="Item name" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <Button 
                className="bg-accent text-white hover:bg-green-600"
                onClick={handleAddNewItem}
              >
                <i className="ri-add-line mr-1"></i> Add New Item
              </Button>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-neutral-200">
                  <th className="p-4 font-medium text-neutral-500">Image</th>
                  <th className="p-4 font-medium text-neutral-500">Name</th>
                  <th className="p-4 font-medium text-neutral-500">Category</th>
                  <th className="p-4 font-medium text-neutral-500">Price</th>
                  <th className="p-4 font-medium text-neutral-500">Status</th>
                  <th className="p-4 font-medium text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMenuItems.length > 0 ? (
                  filteredMenuItems.map(item => (
                    <tr key={item.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                      <td className="p-4">
                        <div className="w-12 h-12 bg-neutral-200 rounded-md overflow-hidden">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <i className="ri-image-line text-xl"></i>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-neutral-400">{item.description}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getCategoryBadgeColor(item.category)}>
                          {item.category === 'veg' ? 'Veg' :
                           item.category === 'nonveg' ? 'Non-Veg' :
                           item.category === 'snacks' ? 'Snack' :
                           'Beverage'}
                        </Badge>
                      </td>
                      <td className="p-4">₹{item.price}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={item.isAvailable}
                            onCheckedChange={(checked) => 
                              toggleAvailabilityMutation.mutate({ id: item.id, isAvailable: checked })
                            }
                            disabled={toggleAvailabilityMutation.isPending}
                          />
                          <span className="text-xs">
                            {item.isAvailable ? 'Available' : 'Out of stock'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditMenuItem(item)}
                            className="text-secondary hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMenuItem(item)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-neutral-400">
                      No menu items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      
      {/* Add Menu Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Menu Item</DialogTitle>
            <DialogDescription>
              Add a new food item to your canteen menu.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. Cheese Pizza" 
                {...form.register("name")} 
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter item description" 
                className="resize-none" 
                {...form.register("description")} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input 
                id="price" 
                type="number" 
                placeholder="0" 
                {...form.register("price", { valueAsNumber: true })} 
              />
              {form.formState.errors.price && (
                <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <div className="flex gap-2">
                <Input 
                  id="imageUrl" 
                  placeholder="https://example.com/image.jpg" 
                  {...form.register("imageUrl")} 
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const name = form.getValues("name");
                    const category = form.getValues("category");
                    if (name || category) {
                      form.setValue("imageUrl", getFoodImage(name, category));
                    }
                  }}
                  className="whitespace-nowrap"
                >
                  Suggest
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                onValueChange={(value) => form.setValue("category", value as any)} 
                defaultValue={form.getValues("category")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="veg">Veg</SelectItem>
                  <SelectItem value="nonveg">Non-Veg</SelectItem>
                  <SelectItem value="snacks">Snacks</SelectItem>
                  <SelectItem value="beverages">Beverages</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="isAvailable" 
                checked={form.watch("isAvailable")} 
                onCheckedChange={(checked) => form.setValue("isAvailable", checked)} 
              />
              <Label htmlFor="isAvailable">Available for ordering</Label>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-accent text-white hover:bg-green-600"
                disabled={createMenuItemMutation.isPending}
              >
                {createMenuItemMutation.isPending ? "Adding..." : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Menu Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Update the details of this food item.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. Cheese Pizza" 
                {...form.register("name")} 
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter item description" 
                className="resize-none" 
                {...form.register("description")} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input 
                id="price" 
                type="number" 
                placeholder="0" 
                {...form.register("price", { valueAsNumber: true })} 
              />
              {form.formState.errors.price && (
                <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <div className="flex gap-2">
                <Input 
                  id="imageUrl" 
                  placeholder="https://example.com/image.jpg" 
                  {...form.register("imageUrl")} 
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const name = form.getValues("name");
                    const category = form.getValues("category");
                    if (name || category) {
                      form.setValue("imageUrl", getFoodImage(name, category));
                    }
                  }}
                  className="whitespace-nowrap"
                >
                  Suggest
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                onValueChange={(value) => form.setValue("category", value as any)} 
                defaultValue={form.getValues("category")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="veg">Veg</SelectItem>
                  <SelectItem value="nonveg">Non-Veg</SelectItem>
                  <SelectItem value="snacks">Snacks</SelectItem>
                  <SelectItem value="beverages">Beverages</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="isAvailable" 
                checked={form.watch("isAvailable")} 
                onCheckedChange={(checked) => form.setValue("isAvailable", checked)} 
              />
              <Label htmlFor="isAvailable">Available for ordering</Label>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-accent text-white hover:bg-green-600"
                disabled={updateMenuItemMutation.isPending}
              >
                {updateMenuItemMutation.isPending ? "Updating..." : "Update Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedMenuItem?.name} from your menu.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={() => selectedMenuItem && deleteMenuItemMutation.mutate(selectedMenuItem.id)}
              disabled={deleteMenuItemMutation.isPending}
            >
              {deleteMenuItemMutation.isPending ? "Deleting..." : "Delete Item"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <MobileNav adminMode={true} activeView="admin-menu" />
    </div>
  );
}
