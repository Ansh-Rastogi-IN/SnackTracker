import { 
  users,
  canteens,
  menuItems, 
  orders, 
  orderItems,
  inventoryItems,
  expenses,
  salesReports,
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
  InsertSalesReport
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Type for SessionStore since it's not exported from express-session
type SessionStore = ReturnType<typeof createMemoryStore>;

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
  
  // Auto incrementing IDs
  private userIdCounter: number;
  private canteenIdCounter: number;
  private menuItemIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  private inventoryIdCounter: number;
  private expenseIdCounter: number;
  private salesReportIdCounter: number;
  
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
    
    this.userIdCounter = 1;
    this.canteenIdCounter = 1;
    this.menuItemIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    this.inventoryIdCounter = 1;
    this.expenseIdCounter = 1;
    this.salesReportIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Initialize default data
    this.initializeDefaultCanteens();
    
    // Add initial admin user
    this.createUser({
      username: "admin@gmail.com",
      password: "812b2cbbffd29586500e3685427b0da34702b94229216b162da0ffa7c066e55e75cf28298422d0a7e1858321e1d530078197b06fbed16392ac1502dad14beeef.e77ba4ffe8c10951f4c2901b8aaed94f", // "123456"
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isAdmin: true,
    }).then();
    
    // Add a staff user for each canteen
    this.createUser({
      username: "staff_main@gmail.com",
      password: "812b2cbbffd29586500e3685427b0da34702b94229216b162da0ffa7c066e55e75cf28298422d0a7e1858321e1d530078197b06fbed16392ac1502dad14beeef.e77ba4ffe8c10951f4c2901b8aaed94f", // "123456"
      firstName: "Staff",
      lastName: "Main",
      role: "staff",
      canteenId: 1,
    }).then();
    
    this.createUser({
      username: "staff_engg@gmail.com",
      password: "812b2cbbffd29586500e3685427b0da34702b94229216b162da0ffa7c066e55e75cf28298422d0a7e1858321e1d530078197b06fbed16392ac1502dad14beeef.e77ba4ffe8c10951f4c2901b8aaed94f", // "123456"
      firstName: "Staff",
      lastName: "Engineering",
      role: "staff",
      canteenId: 2,
    }).then();
    
    this.createUser({
      username: "staff_science@gmail.com",
      password: "812b2cbbffd29586500e3685427b0da34702b94229216b162da0ffa7c066e55e75cf28298422d0a7e1858321e1d530078197b06fbed16392ac1502dad14beeef.e77ba4ffe8c10951f4c2901b8aaed94f", // "123456"
      firstName: "Staff",
      lastName: "Science",
      role: "staff",
      canteenId: 3,
    }).then();
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
      isAdmin: userData.isAdmin || false 
    };
    this.users.set(id, user);
    return user;
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

    return { ...order, items };
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

  async getOrderHistory(): Promise<OrderWithItems[]> {
    // Get all completed orders (for admin)
    const completedOrders = Array.from(this.orders.values())
      .filter(o => o.status === "completed")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return Promise.all(completedOrders.map(order => this.getOrderWithItems(order.id)))
      .then(orders => orders.filter(Boolean) as OrderWithItems[]);
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
  
  // ======== Initialization Methods ========
  
  private async initializeDefaultCanteens() {
    // Create the three college canteens
    const mainCanteen = await this.createCanteen({
      name: "Main Canteen",
      location: "Main Building",
      description: "The main canteen serving a variety of dishes",
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isActive: true,
    });
    
    const engineeringCanteen = await this.createCanteen({
      name: "Engineering Block Canteen",
      location: "Engineering Block",
      description: "Quick bites and meals for engineering students",
      imageUrl: "https://images.unsplash.com/photo-1559305616-3f99cd43e353?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isActive: true,
    });
    
    const scienceCanteen = await this.createCanteen({
      name: "Science Block Café",
      location: "Science Block",
      description: "Coffee, snacks and light meals",
      imageUrl: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isActive: true,
    });
    
    // Add menu items for Main Canteen
    await this.createMenuItem({
      name: "Cheese Pizza",
      description: "Classic cheese pizza with fresh basil",
      price: 120,
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      category: "veg",
      isAvailable: true,
      canteenId: mainCanteen.id,
    });
    
    await this.createMenuItem({
      name: "Classic Burger",
      description: "Juicy beef patty with fresh veggies",
      price: 150,
      imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      category: "nonveg",
      isAvailable: true,
      canteenId: mainCanteen.id,
    });
    
    // Add menu items for Engineering Canteen
    await this.createMenuItem({
      name: "Masala Dosa",
      description: "Crispy dosa with potato filling",
      price: 80,
      imageUrl: "https://images.unsplash.com/photo-1623238913327-121b8a7e7b93?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      category: "veg",
      isAvailable: true,
      canteenId: engineeringCanteen.id,
    });
    
    await this.createMenuItem({
      name: "Samosa",
      description: "Crispy pastry with spiced potatoes",
      price: 25,
      imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      category: "snacks",
      isAvailable: true,
      canteenId: engineeringCanteen.id,
    });
    
    // Add menu items for Science Canteen
    await this.createMenuItem({
      name: "Masala Chai",
      description: "Spiced Indian tea",
      price: 20,
      imageUrl: "https://images.unsplash.com/photo-1593722152148-1a8cc62ac2b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      category: "beverages",
      isAvailable: true,
      canteenId: scienceCanteen.id,
    });
    
    await this.createMenuItem({
      name: "Chicken Biryani",
      description: "Fragrant rice with chicken",
      price: 180,
      imageUrl: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      category: "nonveg",
      isAvailable: true,
      canteenId: scienceCanteen.id,
    });
  }
}

export const storage = new MemStorage();
