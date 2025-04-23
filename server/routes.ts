import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertMenuItemSchema, 
  insertOrderSchema, 
  insertOrderItemSchema, 
  OrderWithItems 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up auth routes
  setupAuth(app);

  // ======== User API Routes ========
  
  // Get menu items
  app.get("/api/menu-items", async (req, res, next) => {
    try {
      const menuItems = await storage.getAllMenuItems();
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

  const httpServer = createServer(app);

  return httpServer;
}
