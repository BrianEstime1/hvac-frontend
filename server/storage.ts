import type { Customer, InsertCustomer, Appointment, InsertAppointment, InventoryItem, Invoice, InsertInvoice, DashboardStats } from "@shared/schema";

export interface IStorage {
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: InsertCustomer): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Appointments
  getAppointments(): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Inventory
  getInventoryItems(): Promise<InventoryItem[]>;
  
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private customers: Map<number, Customer>;
  private appointments: Map<number, Appointment>;
  private invoices: Map<number, Invoice>;
  private inventoryItems: Map<number, InventoryItem>;
  private nextCustomerId: number;
  private nextAppointmentId: number;
  private nextInvoiceId: number;

  constructor() {
    this.customers = new Map();
    this.appointments = new Map();
    this.invoices = new Map();
    this.inventoryItems = new Map();
    this.nextCustomerId = 1;
    this.nextAppointmentId = 1;
    this.nextInvoiceId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample customers
    const sampleCustomers: Omit<Customer, "id">[] = [
      {
        name: "John Smith",
        email: "john.smith@email.com",
        phone: "(555) 123-4567",
        address: "123 Oak Street, Springfield, IL 62701",
      },
      {
        name: "Sarah Johnson",
        email: "sarah.j@email.com",
        phone: "(555) 234-5678",
        address: "456 Maple Ave, Chicago, IL 60601",
      },
      {
        name: "Mike Williams",
        email: "mike.w@email.com",
        phone: "(555) 345-6789",
        address: "789 Pine Road, Aurora, IL 60505",
      },
      {
        name: "Emily Davis",
        email: "emily.davis@email.com",
        phone: "(555) 456-7890",
        address: "321 Elm Street, Naperville, IL 60540",
      },
    ];

    sampleCustomers.forEach((customer) => {
      const id = this.nextCustomerId++;
      this.customers.set(id, { id, ...customer });
    });

    // Sample appointments
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const sampleAppointments: Omit<Appointment, "id">[] = [
      {
        customerId: 1,
        customerName: "John Smith",
        date: tomorrow.toISOString().split('T')[0],
        time: "09:00",
        description: "Annual AC maintenance and filter replacement",
        status: "scheduled",
      },
      {
        customerId: 2,
        customerName: "Sarah Johnson",
        date: tomorrow.toISOString().split('T')[0],
        time: "14:00",
        description: "Furnace repair - not heating properly",
        status: "scheduled",
      },
      {
        customerId: 3,
        customerName: "Mike Williams",
        date: nextWeek.toISOString().split('T')[0],
        time: "10:30",
        description: "Duct cleaning and inspection",
        status: "scheduled",
      },
    ];

    sampleAppointments.forEach((appointment) => {
      const id = this.nextAppointmentId++;
      this.appointments.set(id, { id, ...appointment });
    });

    // Sample inventory items
    const sampleInventory: InventoryItem[] = [
      { id: 1, name: "Air Filter (16x20x1)", quantity: 45, category: "Filters", price: 8.99 },
      { id: 2, name: "Air Filter (20x25x1)", quantity: 32, category: "Filters", price: 10.99 },
      { id: 3, name: "Refrigerant R-410A (25lb)", quantity: 8, category: "Refrigerants", price: 189.99 },
      { id: 4, name: "Thermostat - Digital", quantity: 15, category: "Controls", price: 45.00 },
      { id: 5, name: "Condensate Pump", quantity: 6, category: "Pumps", price: 78.50 },
      { id: 6, name: "Capacitor (45/5 MFD)", quantity: 22, category: "Electrical", price: 12.99 },
      { id: 7, name: "Contactor (30A)", quantity: 18, category: "Electrical", price: 18.75 },
      { id: 8, name: "Blower Motor (1/3 HP)", quantity: 4, category: "Motors", price: 245.00 },
      { id: 9, name: "Evaporator Coil Cleaner", quantity: 28, category: "Chemicals", price: 15.99 },
      { id: 10, name: "Duct Tape (Professional)", quantity: 52, category: "Supplies", price: 7.50 },
      { id: 11, name: "Refrigerant R-22 (30lb)", quantity: 3, category: "Refrigerants", price: 425.00 },
      { id: 12, name: "Drain Line Treatment", quantity: 9, category: "Chemicals", price: 12.50 },
    ];

    sampleInventory.forEach((item) => {
      this.inventoryItems.set(item.id, item);
    });

    // Sample invoices
    const sampleInvoices: Omit<Invoice, "id">[] = [
      {
        customerId: 1,
        customerName: "John Smith",
        date: new Date().toISOString().split('T')[0],
        amount: 450.00,
        description: "AC maintenance and filter replacement",
        status: "paid",
      },
      {
        customerId: 2,
        customerName: "Sarah Johnson",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 275.50,
        description: "Furnace repair",
        status: "sent",
      },
      {
        customerId: 3,
        customerName: "Mike Williams",
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 325.00,
        description: "Duct cleaning and inspection",
        status: "draft",
      },
    ];

    sampleInvoices.forEach((invoice) => {
      const id = this.nextInvoiceId++;
      this.invoices.set(id, { id, ...invoice });
    });
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = this.nextCustomerId++;
    const newCustomer: Customer = { id, ...customer };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: number, customer: InsertCustomer): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;
    
    const updated: Customer = { id, ...customer };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.nextAppointmentId++;
    const customer = this.customers.get(appointment.customerId);
    const newAppointment: Appointment = {
      id,
      ...appointment,
      customerName: customer?.name,
      status: "scheduled",
    };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.nextInvoiceId++;
    const customer = this.customers.get(invoice.customerId);
    const newInvoice: Invoice = {
      id,
      ...invoice,
      customerName: customer?.name,
      status: "draft",
    };
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoices.delete(id);
  }

  // Inventory
  async getInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const totalCustomers = this.customers.size;
    const upcomingAppointments = Array.from(this.appointments.values()).filter(
      (apt) => apt.status === "scheduled"
    ).length;
    const lowStockItems = Array.from(this.inventoryItems.values()).filter(
      (item) => item.quantity < 10
    );

    return {
      totalCustomers,
      upcomingAppointments,
      lowStockItems,
    };
  }
}

export const storage = new MemStorage();
