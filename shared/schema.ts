import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User role enum
export const userRoleEnum = pgEnum("user_role", ["customer", "staff", "admin"]);

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: userRoleEnum("role").default("customer").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(), // Keep for backwards compatibility
  canteenId: integer("canteen_id"), // For staff members, associated canteen
  profileImage: text("profile_image"),
  contactNumber: text("contact_number"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
  isAdmin: true,
  canteenId: true,
  profileImage: true,
  contactNumber: true,
});

// Canteen schema
export const canteens = pgTable("canteens", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertCanteenSchema = createInsertSchema(canteens).pick({
  name: true,
  location: true,
  description: true,
  imageUrl: true,
  isActive: true,
});

// Category enum
export const categoryEnum = pgEnum("category", ["veg", "nonveg", "snacks", "beverages"]);

// Menu item schema
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  imageUrl: text("image_url"),
  category: categoryEnum("category").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  canteenId: integer("canteen_id").default(1).notNull(), // Default to first canteen
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  name: true,
  description: true,
  price: true,
  imageUrl: true,
  category: true,
  isAvailable: true,
  canteenId: true,
});

// Order status enum
export const orderStatusEnum = pgEnum("order_status", ["received", "preparing", "ready", "completed", "cancelled"]);

// Order schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: orderStatusEnum("status").default("received").notNull(),
  totalAmount: integer("total_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  status: true,
  totalAmount: true,
});

// Order item schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  menuItemId: true,
  quantity: true,
  price: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Canteen = typeof canteens.$inferSelect;
export type InsertCanteen = z.infer<typeof insertCanteenSchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// For the cart functionality
export type CartItem = {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
};

// Inventory item schema
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(0),
  unit: text("unit").notNull(), // e.g., kg, liters, pieces
  costPerUnit: integer("cost_per_unit").notNull(),
  canteenId: integer("canteen_id").notNull(),
  reorderLevel: integer("reorder_level").default(10).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  updatedBy: integer("updated_by").notNull(), // staff member who last updated
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).pick({
  name: true,
  quantity: true,
  unit: true,
  costPerUnit: true,
  canteenId: true,
  reorderLevel: true,
  updatedBy: true,
});

// Expense tracking
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  canteenId: integer("canteen_id").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  category: text("category").notNull(), // e.g., utilities, maintenance, supplies
  recordedBy: integer("recorded_by").notNull(),
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  description: true,
  amount: true,
  canteenId: true,
  date: true,
  category: true,
  recordedBy: true,
});

// Daily sales report
export const salesReports = pgTable("sales_reports", {
  id: serial("id").primaryKey(),
  canteenId: integer("canteen_id").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  totalSales: integer("total_sales").notNull(),
  totalOrders: integer("total_orders").notNull(),
  cashSales: integer("cash_sales").notNull().default(0),
  onlineSales: integer("online_sales").notNull().default(0),
  generatedBy: integer("generated_by").notNull(),
});

export const insertSalesReportSchema = createInsertSchema(salesReports).pick({
  canteenId: true,
  date: true,
  totalSales: true,
  totalOrders: true,
  cashSales: true,
  onlineSales: true,
  generatedBy: true,
});

// Additional types
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type SalesReport = typeof salesReports.$inferSelect;
export type InsertSalesReport = z.infer<typeof insertSalesReportSchema>;

// Order ratings schema
export const orderRatings = pgTable("order_ratings", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderRatingSchema = createInsertSchema(orderRatings).pick({
  orderId: true,
  userId: true,
  rating: true,
  comment: true,
});

// Type definitions
export type OrderRating = typeof orderRatings.$inferSelect;
export type InsertOrderRating = z.infer<typeof insertOrderRatingSchema>;

// For the complete order view
export type OrderWithItems = Order & {
  items: (OrderItem & { menuItem: MenuItem })[];
  rating?: OrderRating;
};
