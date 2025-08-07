import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireRole, isAuthenticated } from "./auth";
import { 
  insertMenuItemSchema, 
  insertOrderSchema, 
  insertOrderItemSchema,
  insertCanteenSchema,
  OrderWithItems 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up auth routes
  setupAuth(app);

  // ======== User API Routes ========
  
  // Get all canteens
  app.get("/api/canteens", async (req, res, next) => {
    try {
      const canteens = await storage.getAllCanteens();
      res.json(canteens);
    } catch (err) {
      next(err);
    }
  });
  
  // Get specific canteen
  app.get("/api/canteens/:id", async (req, res, next) => {
    try {
      const canteenId = parseInt(req.params.id);
      const canteen = await storage.getCanteen(canteenId);
      
      if (!canteen) {
        return res.status(404).json({ message: "Canteen not found" });
      }
      
      res.json(canteen);
    } catch (err) {
      next(err);
    }
  });
  
  // Get menu items for a specific canteen
  app.get("/api/canteens/:id/menu-items", async (req, res, next) => {
    try {
      const canteenId = parseInt(req.params.id);
      const canteen = await storage.getCanteen(canteenId);
      
      if (!canteen) {
        return res.status(404).json({ message: "Canteen not found" });
      }
      
      const menuItems = await storage.getMenuItemsByCanteen(canteenId);
      res.json(menuItems);
    } catch (err) {
      next(err);
    }
  });
  
  // Get menu items
  app.get("/api/menu-items", async (req, res, next) => {
    try {
      const canteenId = req.query.canteenId ? parseInt(req.query.canteenId as string) : undefined;
      let menuItems;
      if (canteenId) {
        menuItems = await storage.getMenuItemsByCanteen(canteenId);
      } else {
        menuItems = await storage.getAllMenuItems();
      }
      res.json(menuItems);
    } catch (err) {
      next(err);
    }
  });

  // Place an order
  app.post("/api/orders", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to place an order" });
      }

      const orderData = {
        userId: req.user.id,
        status: "received",
        totalAmount: req.body.totalAmount,
      };

      // Create the order
      const order = await storage.createOrder(orderData);

      // Add order items
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          await storage.createOrderItem({
            orderId: order.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
          });
        }
      }

      // Get the full order with items
      const fullOrder = await storage.getOrderWithItems(order.id);
      res.status(201).json(fullOrder);
    } catch (err) {
      next(err);
    }
  });

  // Get active order
  app.get("/api/orders/active", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view orders" });
      }

      const activeOrder = await storage.getActiveOrderForUser(req.user.id);
      res.json(activeOrder);
    } catch (err) {
      next(err);
    }
  });

  // Get order history
  app.get("/api/orders/history", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view order history" });
      }

      const orderHistory = await storage.getOrderHistoryForUser(req.user.id);
      res.json(orderHistory);
    } catch (err) {
      next(err);
    }
  });

  // Complete an order (mark as picked up)
  app.post("/api/orders/:id/complete", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to update orders" });
      }

      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own orders" });
      }

      const updatedOrder = await storage.updateOrderStatus(orderId, "completed");
      res.json(updatedOrder);
    } catch (err) {
      next(err);
    }
  });

  // Reorder from previous order
  app.post("/api/orders/:id/reorder", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to reorder" });
      }

      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only reorder your own orders" });
      }

      // Get the items from the original order
      const originalOrderWithItems = await storage.getOrderWithItems(orderId);
      
      // Create a new order
      const newOrder = await storage.createOrder({
        userId: req.user.id,
        status: "received",
        totalAmount: order.totalAmount,
      });

      // Add the items from the original order
      for (const item of originalOrderWithItems.items) {
        await storage.createOrderItem({
          orderId: newOrder.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
        });
      }

      // Get the full new order with items
      const fullOrder = await storage.getOrderWithItems(newOrder.id);
      res.status(201).json(fullOrder);
    } catch (err) {
      next(err);
    }
  });

  // Cancel an order
  app.post("/api/orders/:id/cancel", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to cancel orders" });
      }

      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only cancel your own orders" });
      }

      // Only allow cancellation if order is still in received or preparing status
      if (order.status === "ready" || order.status === "completed" || order.status === "cancelled") {
        return res.status(400).json({ 
          message: `Cannot cancel order that is ${order.status}. Only orders that are received or preparing can be cancelled.` 
        });
      }

      const updatedOrder = await storage.updateOrderStatus(orderId, "cancelled");
      res.json(updatedOrder);
    } catch (err) {
      next(err);
    }
  });

  // Rate an order
  app.post("/api/orders/:id/rate", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to rate orders" });
      }

      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only rate your own orders" });
      }

      // Only allow rating completed orders
      if (order.status !== "completed") {
        return res.status(400).json({ 
          message: "You can only rate completed orders" 
        });
      }

      const { rating, comment } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ 
          message: "Rating must be between 1 and 5" 
        });
      }

      const ratingData = {
        orderId,
        userId: req.user.id,
        rating,
        comment: comment || null,
      };

      const orderRating = await storage.createOrderRating(ratingData);
      res.status(201).json(orderRating);
    } catch (err) {
      next(err);
    }
  });

  // ======== Admin API Routes ========
  
  // Admin middleware to check if user is admin
  const isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in" });
    }
    
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  };
  
  // Get all canteens (admin)
  app.get("/api/admin/canteens", isAdmin, async (req, res, next) => {
    try {
      const canteens = await storage.getAllCanteens();
      res.json(canteens);
    } catch (err) {
      next(err);
    }
  });
  
  // Create canteen (admin)
  app.post("/api/admin/canteens", isAdmin, async (req, res, next) => {
    try {
      const canteenData = insertCanteenSchema.parse(req.body);
      const canteen = await storage.createCanteen(canteenData);
      res.status(201).json(canteen);
    } catch (err) {
      next(err);
    }
  });
  
  // Update canteen (admin)
  app.patch("/api/admin/canteens/:id", isAdmin, async (req, res, next) => {
    try {
      const canteenId = parseInt(req.params.id);
      const canteen = await storage.getCanteen(canteenId);
      
      if (!canteen) {
        return res.status(404).json({ message: "Canteen not found" });
      }
      
      const updatedData = req.body;
      const updatedCanteen = await storage.updateCanteen(canteenId, updatedData);
      res.json(updatedCanteen);
    } catch (err) {
      next(err);
    }
  });
  
  // Delete canteen (admin)
  app.delete("/api/admin/canteens/:id", isAdmin, async (req, res, next) => {
    try {
      const canteenId = parseInt(req.params.id);
      const canteen = await storage.getCanteen(canteenId);
      
      if (!canteen) {
        return res.status(404).json({ message: "Canteen not found" });
      }
      
      await storage.deleteCanteen(canteenId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // Get all menu items (admin)
  app.get("/api/admin/menu-items", isAdmin, async (req, res, next) => {
    try {
      const menuItems = await storage.getAllMenuItems();
      res.json(menuItems);
    } catch (err) {
      next(err);
    }
  });

  // Create menu item (admin)
  app.post("/api/admin/menu-items", isAdmin, async (req, res, next) => {
    try {
      const menuItemData = insertMenuItemSchema.parse(req.body);
      const menuItem = await storage.createMenuItem(menuItemData);
      res.status(201).json(menuItem);
    } catch (err) {
      next(err);
    }
  });

  // Update menu item (admin)
  app.patch("/api/admin/menu-items/:id", isAdmin, async (req, res, next) => {
    try {
      const menuItemId = parseInt(req.params.id);
      const menuItem = await storage.getMenuItem(menuItemId);

      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      const updatedData = req.body;
      const updatedMenuItem = await storage.updateMenuItem(menuItemId, updatedData);
      res.json(updatedMenuItem);
    } catch (err) {
      next(err);
    }
  });

  // Delete menu item (admin)
  app.delete("/api/admin/menu-items/:id", isAdmin, async (req, res, next) => {
    try {
      const menuItemId = parseInt(req.params.id);
      const menuItem = await storage.getMenuItem(menuItemId);

      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      await storage.deleteMenuItem(menuItemId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // Delete all menu items (admin)
  app.delete("/api/admin/menu-items", isAdmin, async (req, res, next) => {
    try {
      await storage.deleteAllMenuItems();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // Get active orders (admin)
  app.get("/api/admin/orders/active", isAdmin, async (req, res, next) => {
    try {
      const activeOrders = await storage.getActiveOrders();
      res.json(activeOrders);
    } catch (err) {
      next(err);
    }
  });

  // Get order history (admin)
  app.get("/api/admin/orders/history", isAdmin, async (req, res, next) => {
    try {
      const orderHistory = await storage.getOrderHistory();
      res.json(orderHistory);
    } catch (err) {
      next(err);
    }
  });



  // Update order status (admin)
  app.post("/api/admin/orders/:id/status", isAdmin, async (req, res, next) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const { status } = req.body;
      if (!["received", "preparing", "ready", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      res.json(updatedOrder);
    } catch (err) {
      next(err);
    }
  });

  // ======== Staff API Routes ========
  
  // Get staff profile info
  app.get("/api/staff/profile", requireRole("staff"), async (req, res, next) => {
    try {
      const staffId = req.user.id;
      const staff = await storage.getUser(staffId);
      
      if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
      }
      
      // Don't include password
      const { password, ...safeStaff } = staff;
      res.json(safeStaff);
    } catch (err) {
      next(err);
    }
  });
  
  // Get canteen for staff
  app.get("/api/staff/canteen", requireRole("staff"), async (req, res, next) => {
    try {
      const canteenId = req.user.canteenId;
      if (!canteenId) {
        return res.status(400).json({ message: "Staff not assigned to a canteen" });
      }
      
      const canteen = await storage.getCanteen(canteenId);
      if (!canteen) {
        return res.status(404).json({ message: "Canteen not found" });
      }
      
      res.json(canteen);
    } catch (err) {
      next(err);
    }
  });
  
  // Get menu items for staff's canteen
  app.get("/api/staff/menu-items", requireRole("staff"), async (req, res, next) => {
    try {
      const canteenId = req.user.canteenId;
      if (!canteenId) {
        return res.status(400).json({ message: "Staff not assigned to a canteen" });
      }
      
      const menuItems = await storage.getMenuItemsByCanteen(canteenId);
      res.json(menuItems);
    } catch (err) {
      next(err);
    }
  });
  
  // Create menu item for staff's canteen
  app.post("/api/staff/menu-items", requireRole("staff"), async (req, res, next) => {
    try {
      const canteenId = req.user.canteenId;
      if (!canteenId) {
        return res.status(400).json({ message: "Staff not assigned to a canteen" });
      }
      
      const menuItemData = insertMenuItemSchema.parse({
        ...req.body,
        canteenId
      });
      
      const menuItem = await storage.createMenuItem(menuItemData);
      res.status(201).json(menuItem);
    } catch (err) {
      next(err);
    }
  });
  
  // Get active orders for staff's canteen
  app.get("/api/staff/orders/active", requireRole("staff"), async (req, res, next) => {
    try {
      const canteenId = req.user.canteenId;
      if (!canteenId) {
        return res.status(400).json({ message: "Staff not assigned to a canteen" });
      }
      
      const orders = await storage.getActiveOrdersByCanteen(canteenId);
      res.json(orders);
    } catch (err) {
      next(err);
    }
  });
  
  // Get order history for staff's canteen
  app.get("/api/staff/orders/history", requireRole("staff"), async (req, res, next) => {
    try {
      const canteenId = req.user.canteenId;
      if (!canteenId) {
        return res.status(400).json({ message: "Staff not assigned to a canteen" });
      }
      
      const orders = await storage.getOrderHistoryByCanteen(canteenId);
      res.json(orders);
    } catch (err) {
      next(err);
    }
  });
  
  // Update order status for staff's canteen
  app.post("/api/staff/orders/:id/status", requireRole("staff"), async (req, res, next) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrderWithItems(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const canteenId = req.user.canteenId;
      if (!canteenId) {
        return res.status(400).json({ message: "Staff not assigned to a canteen" });
      }
      
      // Check if any items in the order are from this canteen
      const hasCanteenItems = order.items.some(item => 
        item.menuItem.canteenId === canteenId
      );
      
      if (!hasCanteenItems) {
        return res.status(403).json({ message: "Cannot update orders for other canteens" });
      }
      
      const { status } = req.body;
      if (!["received", "preparing", "ready", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      res.json(updatedOrder);
    } catch (err) {
      next(err);
    }
  });
  
  // ======== Inventory Management Routes (Staff) ========
  
  // Get inventory items for staff's canteen
  app.get("/api/staff/inventory", requireRole("staff"), async (req, res, next) => {
    try {
      const canteenId = req.user.canteenId;
      if (!canteenId) {
        return res.status(400).json({ message: "Staff not assigned to a canteen" });
      }
      
      const inventoryItems = await storage.getInventoryItemsByCanteen(canteenId);
      res.json(inventoryItems);
    } catch (err) {
      next(err);
    }
  });
  
  // Get low stock items for staff's canteen
  app.get("/api/staff/inventory/low", requireRole("staff"), async (req, res, next) => {
    try {
      const canteenId = req.user.canteenId;
      if (!canteenId) {
        return res.status(400).json({ message: "Staff not assigned to a canteen" });
      }
      
      const lowStockItems = await storage.getLowStockItems(canteenId);
      res.json(lowStockItems);
    } catch (err) {
      next(err);
    }
  });
  
  // Add inventory item for staff's canteen
  app.post("/api/staff/inventory", requireRole("staff"), async (req, res, next) => {
    try {
      const canteenId = req.user.canteenId;
      if (!canteenId) {
        return res.status(400).json({ message: "Staff not assigned to a canteen" });
      }
      
      const itemData = {
        ...req.body,
        canteenId,
        updatedBy: req.user.id
      };
      
      const inventoryItem = await storage.createInventoryItem(itemData);
      res.status(201).json(inventoryItem);
    } catch (err) {
      next(err);
    }
  });
  
  // Update inventory item for staff's canteen
  app.patch("/api/staff/inventory/:id", requireRole("staff"), async (req, res, next) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getInventoryItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      const canteenId = req.user.canteenId;
      if (!canteenId) {
        return res.status(400).json({ message: "Staff not assigned to a canteen" });
      }
      
      if (item.canteenId !== canteenId) {
        return res.status(403).json({ message: "Cannot update inventory for other canteens" });
      }
      
      const updateData = {
        ...req.body,
        updatedBy: req.user.id
      };
      
      const updatedItem = await storage.updateInventoryItem(itemId, updateData);
      res.json(updatedItem);
    } catch (err) {
      next(err);
    }
  });
  
  // ======== Expense Management Routes (Staff) ========
  
  // Get expenses for staff's canteen
  app.get("/api/staff/expenses", requireRole("staff"), async (req, res, next) => {
    try {
      const canteenId = req.user.canteenId;
      if (!canteenId) {
        return res.status(400).json({ message: "Staff not assigned to a canteen" });
      }
      
      const expenses = await storage.getExpensesByCanteen(canteenId);
      res.json(expenses);
    } catch (err) {
      next(err);
    }
  });
  
  // Add expense for staff's canteen
  app.post("/api/staff/expenses", requireRole("staff"), async (req, res, next) => {
    try {
      const canteenId = req.user.canteenId;
      if (!canteenId) {
        return res.status(400).json({ message: "Staff not assigned to a canteen" });
      }
      
      const expenseData = {
        ...req.body,
        canteenId,
        recordedBy: req.user.id
      };
      
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (err) {
      next(err);
    }
  });
  
  // ======== Sales Report Routes (Staff) ========
  
  // Get sales reports for staff's canteen
  app.get("/api/staff/sales", requireRole("staff"), async (req, res, next) => {
    try {
      const canteenId = req.user.canteenId;
      if (!canteenId) {
        return res.status(400).json({ message: "Staff not assigned to a canteen" });
      }
      
      const salesReports = await storage.getSalesReportsByCanteen(canteenId);
      res.json(salesReports);
    } catch (err) {
      next(err);
    }
  });
  
  // Create sales report for staff's canteen
  app.post("/api/staff/sales", requireRole("staff"), async (req, res, next) => {
    try {
      const canteenId = req.user.canteenId;
      if (!canteenId) {
        return res.status(400).json({ message: "Staff not assigned to a canteen" });
      }
      
      const reportData = {
        ...req.body,
        canteenId,
        generatedBy: req.user.id
      };
      
      const salesReport = await storage.createSalesReport(reportData);
      res.status(201).json(salesReport);
    } catch (err) {
      next(err);
    }
  });

  // Create menu item for a specific canteen
  app.post("/api/canteens/:id/menu-items", async (req, res, next) => {
    try {
      const canteenId = parseInt(req.params.id);
      const canteen = await storage.getCanteen(canteenId);
      if (!canteen) {
        return res.status(404).json({ message: "Canteen not found" });
      }
      const menuItemData = { ...req.body, canteenId };
      const menuItem = await storage.createMenuItem(menuItemData);
      res.status(201).json(menuItem);
    } catch (err) {
      next(err);
    }
  });

  // Update menu item for a specific canteen
  app.patch("/api/canteens/:id/menu-items/:itemId", async (req, res, next) => {
    try {
      const canteenId = parseInt(req.params.id);
      const itemId = parseInt(req.params.itemId);
      const canteen = await storage.getCanteen(canteenId);
      if (!canteen) {
        return res.status(404).json({ message: "Canteen not found" });
      }
      const menuItem = await storage.getMenuItem(itemId);
      if (!menuItem || menuItem.canteenId !== canteenId) {
        return res.status(404).json({ message: "Menu item not found for this canteen" });
      }
      const updatedMenuItem = await storage.updateMenuItem(itemId, req.body);
      res.json(updatedMenuItem);
    } catch (err) {
      next(err);
    }
  });

  // Delete menu item for a specific canteen
  app.delete("/api/canteens/:id/menu-items/:itemId", async (req, res, next) => {
    try {
      const canteenId = parseInt(req.params.id);
      const itemId = parseInt(req.params.itemId);
      const canteen = await storage.getCanteen(canteenId);
      if (!canteen) {
        return res.status(404).json({ message: "Canteen not found" });
      }
      const menuItem = await storage.getMenuItem(itemId);
      if (!menuItem || menuItem.canteenId !== canteenId) {
        return res.status(404).json({ message: "Menu item not found for this canteen" });
      }
      await storage.deleteMenuItem(itemId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
