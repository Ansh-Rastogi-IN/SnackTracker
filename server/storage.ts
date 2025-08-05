import session, { Store as SessionStore } from 'express-session';
import createMemoryStore from 'memorystore';
import { config } from 'dotenv';

config();

const MemoryStore = createMemoryStore(session);

export const sessionStore = new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
});

export const sessionConfig = session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
});

import { eq, and, desc, asc } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { 
  users,
  canteens,
  menuItems, 
  orders, 
  orderItems,
  inventoryItems,
  expenses,
  salesReports,
  orderRatings,
  User, 
  InsertUser,
  Canteen,
  InsertCanteen,
  MenuItem, 
  InsertMenuItem, 
  Order, 
  InsertOrder, 
  OrderItem, 
  InsertOrderItem, 
  OrderWithItems,
  InventoryItem,
  InsertInventoryItem,
  Expense,
  InsertExpense,
  SalesReport,
  InsertSalesReport,
  OrderRating,
  InsertOrderRating
} from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export type SessionData = {
    userId?: string;
    isAuthenticated?: boolean;
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByCanteen(canteenId: number): Promise<User[]>;

  // Canteen operations
  getAllCanteens(): Promise<Canteen[]>;
  getCanteen(id: number): Promise<Canteen | undefined>;
  createCanteen(canteen: InsertCanteen): Promise<Canteen>;
  updateCanteen(id: number, data: Partial<InsertCanteen>): Promise<Canteen>;
  deleteCanteen(id: number): Promise<void>;

  // Menu item operations
  getAllMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCanteen(canteenId: number): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem>;
  deleteMenuItem(id: number): Promise<void>;

  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrderWithItems(id: number): Promise<OrderWithItems | null>;
  getActiveOrderForUser(userId: number): Promise<OrderWithItems | null>;
  getOrderHistoryForUser(userId: number): Promise<OrderWithItems[]>;
  getActiveOrders(): Promise<OrderWithItems[]>;
  getActiveOrdersByCanteen(canteenId: number): Promise<OrderWithItems[]>;
  getOrderHistory(): Promise<OrderWithItems[]>;
  getOrderHistoryByCanteen(canteenId: number): Promise<OrderWithItems[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;

  // Order item operations
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Inventory operations
  getAllInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemsByCanteen(canteenId: number): Promise<InventoryItem[]>;
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, data: Partial<InsertInventoryItem>): Promise<InventoryItem>;
  deleteInventoryItem(id: number): Promise<void>;
  getLowStockItems(canteenId: number): Promise<InventoryItem[]>;

  // Expense operations
  getAllExpenses(): Promise<Expense[]>;
  getExpensesByCanteen(canteenId: number): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  // Sales report operations
  getAllSalesReports(): Promise<SalesReport[]>;
  getSalesReportsByCanteen(canteenId: number): Promise<SalesReport[]>;
  getSalesReport(id: number): Promise<SalesReport | undefined>;
  createSalesReport(report: InsertSalesReport): Promise<SalesReport>;
  updateSalesReport(id: number, data: Partial<InsertSalesReport>): Promise<SalesReport>;
  deleteSalesReport(id: number): Promise<void>;

  // Order rating operations
  getOrderRating(orderId: number): Promise<OrderRating | undefined>;
  createOrderRating(rating: InsertOrderRating): Promise<OrderRating>;
  updateOrderRating(id: number, data: Partial<InsertOrderRating>): Promise<OrderRating>;
  deleteOrderRating(id: number): Promise<void>;

  // Session store
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private canteens: Map<number, Canteen>;
  private menuItems: Map<number, MenuItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private inventoryItems: Map<number, InventoryItem>;
  private expenses: Map<number, Expense>;
  private salesReports: Map<number, SalesReport>;
  private orderRatings: Map<number, OrderRating>;

  // Auto incrementing IDs
  private userIdCounter: number;
  private canteenIdCounter: number;
  private menuItemIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  private inventoryIdCounter: number;
  private expenseIdCounter: number;
  private salesReportIdCounter: number;
  private orderRatingIdCounter: number;

  public sessionStore: SessionStore;

  constructor() {
    this.users = new Map();
    this.canteens = new Map();
    this.menuItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.inventoryItems = new Map();
    this.expenses = new Map();
    this.salesReports = new Map();
    this.orderRatings = new Map();

    this.userIdCounter = 1;
    this.canteenIdCounter = 1;
    this.menuItemIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    this.inventoryIdCounter = 1;
    this.expenseIdCounter = 1;
    this.salesReportIdCounter = 1;
    this.orderRatingIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });

    // Initialize default data
    this.initializeDefaultCanteens();

    // Initialize default users with properly hashed passwords
    this.initializeDefaultUsers();
    // this.initializeDefaultMenuItems(); // Disabled to prevent default items from being re-added
  }

  // ======== User Methods ========

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      id, 
      ...userData,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      role: userData.role || "customer",
      isAdmin: userData.isAdmin || false,
      canteenId: userData.canteenId || null,
      profileImage: userData.profileImage || null,
      contactNumber: userData.contactNumber || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser: User = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === role);
  }

  async getUsersByCanteen(canteenId: number): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.canteenId === canteenId);
  }

  // ======== Canteen Methods ========

  async getAllCanteens(): Promise<Canteen[]> {
    return Array.from(this.canteens.values());
  }

  async getCanteen(id: number): Promise<Canteen | undefined> {
    return this.canteens.get(id);
  }

  async createCanteen(canteenData: InsertCanteen): Promise<Canteen> {
    const id = this.canteenIdCounter++;
    const canteen: Canteen = { 
      id, 
      ...canteenData,
      description: canteenData.description || null,
      imageUrl: canteenData.imageUrl || null,
      isActive: canteenData.isActive ?? true 
    };
    this.canteens.set(id, canteen);
    return canteen;
  }

  async updateCanteen(id: number, data: Partial<InsertCanteen>): Promise<Canteen> {
    const canteen = this.canteens.get(id);
    if (!canteen) {
      throw new Error("Canteen not found");
    }

    const updatedCanteen: Canteen = { ...canteen, ...data };
    this.canteens.set(id, updatedCanteen);
    return updatedCanteen;
  }

  async deleteCanteen(id: number): Promise<void> {
    this.canteens.delete(id);
  }

  // ======== Menu Item Methods ========

  async getAllMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }

  async getMenuItemsByCanteen(canteenId: number): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values())
      .filter(item => item.canteenId === canteenId);
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(menuItemData: InsertMenuItem): Promise<MenuItem> {
    const id = this.menuItemIdCounter++;
    const menuItem: MenuItem = { 
      id, 
      ...menuItemData,
      description: menuItemData.description || null,
      imageUrl: menuItemData.imageUrl || null,
      isAvailable: menuItemData.isAvailable ?? true,
      canteenId: menuItemData.canteenId || 1 // Default to first canteen if not specified
    };
    this.menuItems.set(id, menuItem);
    return menuItem;
  }

  async updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem> {
    const menuItem = this.menuItems.get(id);
    if (!menuItem) {
      throw new Error("Menu item not found");
    }

    const updatedMenuItem: MenuItem = { ...menuItem, ...data };
    this.menuItems.set(id, updatedMenuItem);
    return updatedMenuItem;
  }

  async deleteMenuItem(id: number): Promise<void> {
    this.menuItems.delete(id);
  }

  async deleteAllMenuItems(): Promise<void> {
    this.menuItems.clear();
  }

  // ======== Order Methods ========

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderWithItems(id: number): Promise<OrderWithItems | null> {
    const order = this.orders.get(id);
    if (!order) return null;

    const orderItemsList = Array.from(this.orderItems.values())
      .filter(item => item.orderId === id);

    const items = await Promise.all(orderItemsList.map(async item => {
      const menuItem = await this.getMenuItem(item.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item with id ${item.menuItemId} not found`);
      }
      return { ...item, menuItem };
    }));

    // Get rating for this order
    const rating = await this.getOrderRating(id);

    return { ...order, items, rating };
  }

  async getActiveOrderForUser(userId: number): Promise<OrderWithItems | null> {
    // Find the active order (received, preparing, or ready) for a user
    const activeOrder = Array.from(this.orders.values())
      .find(o => o.userId === userId && ["received", "preparing", "ready"].includes(o.status));

    if (!activeOrder) return null;

    return this.getOrderWithItems(activeOrder.id);
  }

  async getOrderHistoryForUser(userId: number): Promise<OrderWithItems[]> {
    // Get completed orders for a user
    const userOrders = Array.from(this.orders.values())
      .filter(o => o.userId === userId && o.status === "completed")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return Promise.all(userOrders.map(order => this.getOrderWithItems(order.id)))
      .then(orders => orders.filter(Boolean) as OrderWithItems[]);
  }

  async getActiveOrders(): Promise<OrderWithItems[]> {
    // Get all active orders (for admin)
    const activeOrders = Array.from(this.orders.values())
      .filter(o => ["received", "preparing", "ready"].includes(o.status))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return Promise.all(activeOrders.map(order => this.getOrderWithItems(order.id)))
      .then(orders => orders.filter(Boolean) as OrderWithItems[]);
  }

  async getActiveOrdersByCanteen(canteenId: number): Promise<OrderWithItems[]> {
    // First get all active orders
    const allActiveOrders = await this.getActiveOrders();

    // Filter orders for menu items belonging to this canteen
    return allActiveOrders.filter(order => {
      return order.items.some(item => item.menuItem.canteenId === canteenId);
    });
  }

  async getOrderHistory(): Promise<OrderWithItems[]> {
    // Get all completed orders (for admin)
    const completedOrders = Array.from(this.orders.values())
      .filter(o => o.status === "completed")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return Promise.all(completedOrders.map(order => this.getOrderWithItems(order.id)))
      .then(orders => orders.filter(Boolean) as OrderWithItems[]);
  }

  async getOrderHistoryByCanteen(canteenId: number): Promise<OrderWithItems[]> {
    // First get all completed orders
    const allCompletedOrders = await this.getOrderHistory();

    // Filter orders for menu items belonging to this canteen
    return allCompletedOrders.filter(order => {
      return order.items.some(item => item.menuItem.canteenId === canteenId);
    });
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const createdAt = new Date();
    const order: Order = { 
      id, 
      ...orderData, 
      status: orderData.status || "received",
      createdAt 
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: number, statusValue: string): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error("Order not found");
    }

    // Validate that status is one of the allowed values
    if (!["received", "preparing", "ready", "completed", "cancelled"].includes(statusValue)) {
      throw new Error("Invalid order status");
    }

    const status = statusValue as "received" | "preparing" | "ready" | "completed" | "cancelled";
    const updatedOrder: Order = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // ======== Order Item Methods ========

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
  }

  async createOrderItem(orderItemData: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemIdCounter++;
    const orderItem: OrderItem = { id, ...orderItemData };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  // ======== Inventory Methods ========

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }

  async getInventoryItemsByCanteen(canteenId: number): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values())
      .filter(item => item.canteenId === canteenId);
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async createInventoryItem(itemData: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.inventoryIdCounter++;
    const lastUpdated = new Date();
    const item: InventoryItem = {
      id,
      ...itemData,
      quantity: itemData.quantity ?? 0,
      reorderLevel: itemData.reorderLevel ?? 10,
      lastUpdated
    };
    this.inventoryItems.set(id, item);
    return item;
  }

  async updateInventoryItem(id: number, data: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const item = this.inventoryItems.get(id);
    if (!item) {
      throw new Error("Inventory item not found");
    }

    const lastUpdated = new Date();
    const updatedItem: InventoryItem = { ...item, ...data, lastUpdated };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    this.inventoryItems.delete(id);
  }

  async getLowStockItems(canteenId: number): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values())
      .filter(item => item.canteenId === canteenId && item.quantity <= item.reorderLevel);
  }

  // ======== Expense Methods ========

  async getAllExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }

  async getExpensesByCanteen(canteenId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.canteenId === canteenId);
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(expenseData: InsertExpense): Promise<Expense> {
    const id = this.expenseIdCounter++;
    const date = expenseData.date || new Date();
    const expense: Expense = {
      id,
      ...expenseData,
      date
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense> {
    const expense = this.expenses.get(id);
    if (!expense) {
      throw new Error("Expense not found");
    }

    const updatedExpense: Expense = { ...expense, ...data };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<void> {
    this.expenses.delete(id);
  }

  // ======== Sales Report Methods ========

  async getAllSalesReports(): Promise<SalesReport[]> {
    return Array.from(this.salesReports.values());
  }

  async getSalesReportsByCanteen(canteenId: number): Promise<SalesReport[]> {
    return Array.from(this.salesReports.values())
      .filter(report => report.canteenId === canteenId);
  }

  async getSalesReport(id: number): Promise<SalesReport | undefined> {
    return this.salesReports.get(id);
  }

  async createSalesReport(reportData: InsertSalesReport): Promise<SalesReport> {
    const id = this.salesReportIdCounter++;
    const date = reportData.date || new Date();
    const report: SalesReport = {
      id,
      ...reportData,
      date,
      cashSales: reportData.cashSales ?? 0,
      onlineSales: reportData.onlineSales ?? 0
    };
    this.salesReports.set(id, report);
    return report;
  }

  async updateSalesReport(id: number, data: Partial<InsertSalesReport>): Promise<SalesReport> {
    const report = this.salesReports.get(id);
    if (!report) {
      throw new Error("Sales report not found");
    }

    const updatedReport: SalesReport = { ...report, ...data };
    this.salesReports.set(id, updatedReport);
    return updatedReport;
  }

  async deleteSalesReport(id: number): Promise<void> {
    this.salesReports.delete(id);
  }

  // ======== Initialization Methods ========

  private async initializeDefaultUsers() {
    try {
      // Add initial admin user
      await this.createUser({
        username: "ansh@gmail.com",
        password: await hashPassword("ansh"),
        firstName: "Ansh",
        lastName: "Admin",
        role: "admin",
        isAdmin: true,
      });

      // Add canteen staff user
      await this.createUser({
        username: "test@gmail.com",
        password: await hashPassword("test"),
        firstName: "Test",
        lastName: "Staff",
        role: "staff",
        canteenId: 1,
      });

      // Add staff users for other canteens
      await this.createUser({
        username: "kuteera@gmail.com",
        password: await hashPassword("kuteera"),
        firstName: "Kuteera",
        lastName: "Staff",
        role: "staff",
        canteenId: 2,
      });

      await this.createUser({
        username: "wake@gmail.com",
        password: await hashPassword("wake"),
        firstName: "Wake",
        lastName: "Bite",
        role: "staff",
        canteenId: 3,
      });
    } catch (error) {
      console.error("Error initializing default users:", error);
    }
  }

  private async initializeDefaultCanteens() {
    // Create the three college canteens
    const foodCourtCanteen = await this.createCanteen({
      name: "Food Court",
      location: "LAB BLOCK 1st Floor",
      description: "The main food court serving a variety of north and south Indian dishes",
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isActive: true,
    });

    const kuteeraCanteen = await this.createCanteen({
      name: "KUTEERA",
      location: "Kuteera Building",
      description: "Quick bites and meals at Kuteera building",
      imageUrl: "https://images.unsplash.com/photo-1559305616-3f99cd43e353?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isActive: true,
    });

    const wakeNBiteCanteen = await this.createCanteen({
      name: "Wake n Bite",
      location: "Campus Center",
      description: "Bakery and pastry items, coffee, snacks and refreshments",
      imageUrl: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isActive: true,
    });

    // ===== FOOD COURT MENU =====
    // 🥗 Veg Snacks
    await this.createMenuItem({
      name: "Veg Sandwich",
      description: "Fresh vegetable sandwich with cucumber, tomato, and lettuce",
      price: 40,
      imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Paneer Puff",
      description: "Flaky puff pastry filled with spiced paneer",
      price: 35,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Cheese Maggi",
      description: "Instant noodles with cheese and vegetables",
      price: 45,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Aloo Samosa",
      description: "Crispy samosa with spiced potato filling (2 pieces)",
      price: 30,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Veg Burger",
      description: "Vegetable patty burger with fresh vegetables",
      price: 50,
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    // 🍗 Non-Veg Snacks
    await this.createMenuItem({
      name: "Chicken Puff",
      description: "Flaky puff pastry filled with spiced chicken",
      price: 40,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Egg Roll",
      description: "Scrambled egg wrapped in paratha with vegetables",
      price: 55,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Chicken Burger",
      description: "Grilled chicken patty burger with lettuce and mayo",
      price: 70,
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Grilled Chicken Sandwich",
      description: "Grilled chicken breast sandwich with fresh vegetables",
      price: 65,
      imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Chicken Maggi",
      description: "Instant noodles with chicken and vegetables",
      price: 55,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    // 🍽️ Quick Meals
    await this.createMenuItem({
      name: "Veg Fried Rice",
      description: "Stir-fried rice with mixed vegetables and soy sauce",
      price: 70,
      imageUrl: "https://images.unsplash.com/photo-1645607173795-8b0e5fadaa68?w=400&h=300&fit=crop",
      category: "veg",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Chicken Fried Rice",
      description: "Stir-fried rice with chicken and vegetables",
      price: 90,
      imageUrl: "https://images.unsplash.com/photo-1645607173795-8b0e5fadaa68?w=400&h=300&fit=crop",
      category: "nonveg",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Paneer Wrap",
      description: "Paneer tikka wrapped in soft tortilla with chutney",
      price: 65,
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
      category: "veg",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Chicken Wrap",
      description: "Grilled chicken wrapped in soft tortilla with sauce",
      price: 75,
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
      category: "nonveg",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Veg Thali",
      description: "Complete meal with rice, dal, curry, salad, and roti",
      price: 100,
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
      category: "veg",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    // 🥤 Beverages
    await this.createMenuItem({
      name: "Masala Chai",
      description: "Spiced Indian tea with milk and ginger",
      price: 15,
      imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Cold Coffee",
      description: "Iced coffee with milk and sugar",
      price: 40,
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Fresh Lime Soda",
      description: "Refreshing lime soda with mint and salt",
      price: 35,
      imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Soft Drink",
      description: "Coke, Sprite, or Pepsi (300ml)",
      price: 25,
      imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Mineral Water",
      description: "500ml bottled mineral water",
      price: 20,
      imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    // Snacks
    await this.createMenuItem({
      name: "Samosa",
      description: "Crispy pastry with spiced potatoes and peas",
      price: 25,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Pakora",
      description: "Crispy fritters with mixed vegetables",
      price: 30,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    // Beverages
    await this.createMenuItem({
      name: "Masala Chai",
      description: "Spiced Indian tea with milk",
      price: 20,
      imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    await this.createMenuItem({
      name: "Lassi",
      description: "Sweet yogurt-based drink",
      price: 40,
      imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: foodCourtCanteen.id,
    });

    // ===== KUTEERA MENU =====
    // Quick Meals
    await this.createMenuItem({
      name: "Veg Fried Rice",
      description: "Stir-fried rice with mixed vegetables",
      price: 100,
      imageUrl: "https://images.unsplash.com/photo-1645607173795-8b0e5fadaa68?w=400&h=300&fit=crop",
      category: "veg",
      isAvailable: true,
      canteenId: kuteeraCanteen.id,
    });

    await this.createMenuItem({
      name: "Chicken Fried Rice",
      description: "Stir-fried rice with chicken and vegetables",
      price: 130,
      imageUrl: "https://images.unsplash.com/photo-1645607173795-8b0e5fadaa68?w=400&h=300&fit=crop",
      category: "nonveg",
      isAvailable: true,
      canteenId: kuteeraCanteen.id,
    });

    await this.createMenuItem({
      name: "Veg Noodles",
      description: "Stir-fried noodles with vegetables",
      price: 90,
      imageUrl: "https://images.unsplash.com/photo-1645607173795-8b0e5fadaa68?w=400&h=300&fit=crop",
      category: "veg",
      isAvailable: true,
      canteenId: kuteeraCanteen.id,
    });

    await this.createMenuItem({
      name: "Chicken Noodles",
      description: "Stir-fried noodles with chicken",
      price: 120,
      imageUrl: "https://images.unsplash.com/photo-1645607173795-8b0e5fadaa68?w=400&h=300&fit=crop",
      category: "nonveg",
      isAvailable: true,
      canteenId: kuteeraCanteen.id,
    });

    await this.createMenuItem({
      name: "Vada Pav",
      description: "Mumbai's favorite street food - potato fritter in bread",
      price: 35,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: kuteeraCanteen.id,
    });

    await this.createMenuItem({
      name: "Poha",
      description: "Flattened rice with onions and spices",
      price: 45,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: kuteeraCanteen.id,
    });

    await this.createMenuItem({
      name: "Upma",
      description: "Semolina breakfast with vegetables",
      price: 40,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: kuteeraCanteen.id,
    });

    // Beverages
    await this.createMenuItem({
      name: "Masala Chai",
      description: "Spiced Indian tea",
      price: 20,
      imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: kuteeraCanteen.id,
    });

    await this.createMenuItem({
      name: "Coffee",
      description: "Hot filter coffee",
      price: 25,
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: kuteeraCanteen.id,
    });

    await this.createMenuItem({
      name: "Juice",
      description: "Fresh fruit juice",
      price: 50,
      imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: kuteeraCanteen.id,
    });

    // ===== WAKE N BITE MENU =====
    // Pastries and Cakes
    await this.createMenuItem({
      name: "Chocolate Pastry",
      description: "Rich chocolate pastry with cream filling",
      price: 60,
      imageUrl: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: wakeNBiteCanteen.id,
    });

    await this.createMenuItem({
      name: "Vanilla Pastry",
      description: "Light vanilla pastry with fresh cream",
      price: 55,
      imageUrl: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: wakeNBiteCanteen.id,
    });

    await this.createMenuItem({
      name: "Chocolate Cake",
      description: "Moist chocolate cake with chocolate ganache",
      price: 80,
      imageUrl: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: wakeNBiteCanteen.id,
    });

    await this.createMenuItem({
      name: "Red Velvet Cake",
      description: "Classic red velvet cake with cream cheese frosting",
      price: 90,
      imageUrl: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: wakeNBiteCanteen.id,
    });

    // Breads and Croissants
    await this.createMenuItem({
      name: "Butter Croissant",
      description: "Flaky French butter croissant, freshly baked",
      price: 50,
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: wakeNBiteCanteen.id,
    });

    await this.createMenuItem({
      name: "Chocolate Croissant",
      description: "Buttery croissant filled with chocolate",
      price: 65,
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: wakeNBiteCanteen.id,
    });

    await this.createMenuItem({
      name: "Garlic Bread",
      description: "Toasted bread with garlic butter and herbs",
      price: 45,
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop",
      category: "snacks",
      isAvailable: true,
      canteenId: wakeNBiteCanteen.id,
    });

    // Hot Beverages
    await this.createMenuItem({
      name: "Cappuccino",
      description: "Espresso with steamed milk and foam",
      price: 70,
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: wakeNBiteCanteen.id,
    });

    await this.createMenuItem({
      name: "Latte",
      description: "Espresso with steamed milk",
      price: 75,
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: wakeNBiteCanteen.id,
    });

    await this.createMenuItem({
      name: "Hot Chocolate",
      description: "Rich hot chocolate with whipped cream",
      price: 60,
      imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: wakeNBiteCanteen.id,
    });

    // Cold Beverages
    await this.createMenuItem({
      name: "Iced Coffee",
      description: "Chilled coffee with milk and ice",
      price: 65,
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: wakeNBiteCanteen.id,
    });

    await this.createMenuItem({
      name: "Cold Coffee",
      description: "Blended coffee with ice cream",
      price: 80,
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: wakeNBiteCanteen.id,
    });

    await this.createMenuItem({
      name: "Soda",
      description: "Refreshing carbonated drink",
      price: 30,
      imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: wakeNBiteCanteen.id,
    });

    await this.createMenuItem({
      name: "Water",
      description: "Mineral water",
      price: 20,
      imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
      category: "beverages",
      isAvailable: true,
      canteenId: wakeNBiteCanteen.id,
    });
  }

  // ======== Order Rating Methods ========

  async getOrderRating(orderId: number): Promise<OrderRating | undefined> {
    return Array.from(this.orderRatings.values()).find(
      (rating) => rating.orderId === orderId
    );
  }

  async createOrderRating(ratingData: InsertOrderRating): Promise<OrderRating> {
    const id = this.orderRatingIdCounter++;
    const rating: OrderRating = {
      id,
      ...ratingData,
      comment: ratingData.comment || null,
      createdAt: new Date(),
    };
    this.orderRatings.set(id, rating);
    return rating;
  }

  async updateOrderRating(id: number, data: Partial<InsertOrderRating>): Promise<OrderRating> {
    const rating = this.orderRatings.get(id);
    if (!rating) {
      throw new Error("Order rating not found");
    }

    const updatedRating: OrderRating = { ...rating, ...data };
    this.orderRatings.set(id, updatedRating);
    return updatedRating;
  }

  async deleteOrderRating(id: number): Promise<void> {
    if (!this.orderRatings.has(id)) {
      throw new Error("Order rating not found");
    }
    this.orderRatings.delete(id);
  }
}

export const storage = new MemStorage();