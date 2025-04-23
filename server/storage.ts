import { 
  users, 
  menuItems, 
  orders, 
  orderItems, 
  User, 
  InsertUser, 
  MenuItem, 
  InsertMenuItem, 
  Order, 
  InsertOrder, 
  OrderItem, 
  InsertOrderItem, 
  OrderWithItems 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Menu item operations
  getAllMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem>;
  deleteMenuItem(id: number): Promise<void>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrderWithItems(id: number): Promise<OrderWithItems | undefined>;
  getActiveOrderForUser(userId: number): Promise<OrderWithItems | null>;
  getOrderHistoryForUser(userId: number): Promise<OrderWithItems[]>;
  getActiveOrders(): Promise<OrderWithItems[]>;
  getOrderHistory(): Promise<OrderWithItems[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  
  // Order item operations
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private menuItems: Map<number, MenuItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  
  // Auto incrementing IDs
  private userIdCounter: number;
  private menuItemIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  
  public sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.menuItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    
    this.userIdCounter = 1;
    this.menuItemIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Add initial admin user
    this.createUser({
      username: "admin@snacktrack.com",
      password: "$2b$10$dJGWxnTqzY5dOKM1S7VUXOrOVRtVFUAGGYGsZHCMUSgLe.lByjBzK", // "admin123"
      firstName: "Admin",
      lastName: "User",
      isAdmin: true,
    }).then();
    
    // Add some default menu items
    this.createMenuItem({
      name: "Cheese Pizza",
      description: "Classic cheese pizza with fresh basil",
      price: 120,
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      category: "veg",
      isAvailable: true,
    }).then();
    
    this.createMenuItem({
      name: "Classic Burger",
      description: "Juicy beef patty with fresh veggies",
      price: 150,
      imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      category: "nonveg",
      isAvailable: true,
    }).then();
    
    this.createMenuItem({
      name: "Masala Dosa",
      description: "Crispy dosa with potato filling",
      price: 80,
      imageUrl: "https://images.unsplash.com/photo-1623238913327-121b8a7e7b93?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      category: "veg",
      isAvailable: true,
    }).then();
    
    this.createMenuItem({
      name: "Samosa",
      description: "Crispy pastry with spiced potatoes",
      price: 25,
      imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      category: "snacks",
      isAvailable: true,
    }).then();
    
    this.createMenuItem({
      name: "Masala Chai",
      description: "Spiced Indian tea",
      price: 20,
      imageUrl: "https://images.unsplash.com/photo-1593722152148-1a8cc62ac2b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      category: "beverages",
      isAvailable: true,
    }).then();
    
    this.createMenuItem({
      name: "Chicken Biryani",
      description: "Fragrant rice with chicken",
      price: 180,
      imageUrl: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      category: "nonveg",
      isAvailable: true,
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
    const createdAt = new Date();
    const user: User = { id, ...userData };
    this.users.set(id, user);
    return user;
  }

  // ======== Menu Item Methods ========
  
  async getAllMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(menuItemData: InsertMenuItem): Promise<MenuItem> {
    const id = this.menuItemIdCounter++;
    const menuItem: MenuItem = { id, ...menuItemData };
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

  async getOrderWithItems(id: number): Promise<OrderWithItems | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const orderItemsList = Array.from(this.orderItems.values())
      .filter(item => item.orderId === id);

    const items = await Promise.all(orderItemsList.map(async item => {
      const menuItem = await this.getMenuItem(item.menuItemId);
      return { ...item, menuItem: menuItem! };
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
      createdAt 
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error("Order not found");
    }

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
}

export const storage = new MemStorage();
