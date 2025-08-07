import { sqliteTable, text, integer, boolean } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User role enum - using text with check constraint for SQLite
export const userRoleEnum = text("role", { enum: ["customer", "staff", "admin"] });

// User schema
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: userRoleEnum.default("customer").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false).notNull(), // Keep for backwards compatibility
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
export const canteens = sqliteTable("canteens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
});

export const insertCanteenSchema = createInsertSchema(canteens).pick({
  name: true,
  location: true,
  description: true,
  imageUrl: true,
  isActive: true,
});

// Category enum - using text with check constraint for SQLite
export const categoryEnum = text("category", { enum: ["veg", "nonveg", "snacks", "beverages"] });

// Menu item schema
export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  imageUrl: text("image_url"),
  category: categoryEnum.notNull(),
  isAvailable: integer("is_available", { mode: "boolean" }).default(true).notNull(),
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

// Order status enum - using text with check constraint for SQLite
export const orderStatusEnum = text("status", { enum: ["received", "preparing", "ready", "completed", "cancelled"] });

// Order schema
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  status: orderStatusEnum.default("received").notNull(),
  totalAmount: integer("total_amount").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  status: true,
  totalAmount: true,
});

// Order item schema
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
export const inventoryItems = sqliteTable("inventory_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(0),
  unit: text("unit").notNull(), // e.g., kg, liters, pieces
  costPerUnit: integer("cost_per_unit").notNull(),
  canteenId: integer("canteen_id").notNull(),
  reorderLevel: integer("reorder_level").default(10).notNull(),
  lastUpdated: integer("last_updated", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
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
export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  canteenId: integer("canteen_id").notNull(),
  date: integer("date", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
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
export const salesReports = sqliteTable("sales_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  canteenId: integer("canteen_id").notNull(),
  date: integer("date", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
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
export const orderRatings = sqliteTable("order_ratings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
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
