import { z } from "zod";

// Customer Schema
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string(),
  address: z.string().optional(),
});

export const insertCustomerSchema = customerSchema.omit({ id: true });

export type Customer = z.infer<typeof customerSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

// Appointment Schema
export const appointmentSchema = z.object({
  id: z.number(),
  customerId: z.number(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  date: z.string(),
  time: z.string(),
  serviceType: z.string().optional(),
  technician: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "scheduled", "in-progress", "completed", "cancelled"]).optional(),
});

export const insertAppointmentSchema = appointmentSchema.omit({
  id: true,
  customerName: true,
  customerPhone: true,
  customerAddress: true,
});

export type Appointment = z.infer<typeof appointmentSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// Inventory Schema
export const inventoryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  quantity: z.number(),
  category: z.string().optional(),
  price: z.number().optional(),
  unit: z.string().optional(),
});

export const insertInventoryItemSchema = inventoryItemSchema.omit({ id: true });

export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;

// Invoice Schema
export const invoiceSchema = z.object({
  id: z.number(),
  customerId: z.number(),
  customerName: z.string().optional(),
  invoiceNumber: z.string().optional(),
  date: z.string(),
  technician: z.string().optional(),
  workPerformed: z.string().optional(),
  descriptionOfWorkPerformed: z.string().optional(),
  labor_cost: z.number(),
  materials_cost: z.number().optional(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number().optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "sent", "paid"]).optional(),
  customer_signature: z.string().optional(),
  signature_date: z.string().optional(),
  authorization_status: z.string().optional(),
  paid_date: z.string().optional(),
  payment_method: z.string().optional(),
});

export const insertInvoiceSchema = invoiceSchema.omit({ id: true, customerName: true });

export type Invoice = z.infer<typeof invoiceSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// Quote Schema
export const quoteSchema = z.object({
  id: z.number(),
  customerId: z.number(),
  customerName: z.string().optional(),
  customerAddress: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  total: z.number().optional(),
  status: z.string().optional(),
  createdAt: z.string(),
  quoteNumber: z.string().optional(),
  customer_signature: z.string().optional(),
  signature_date: z.string().optional(),
});

export const insertQuoteSchema = z.object({
  customerId: z.number().min(1, "Customer is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  total: z.number().min(0, "Total must be positive"),
  status: z.string().optional(),
});

export type Quote = z.infer<typeof quoteSchema>;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

// Dashboard Stats
export interface DashboardStats {
  totalCustomers: number;
  upcomingAppointments: number;
  lowStockItems: InventoryItem[];
  unpaidTotal: number;
  unpaidCount: number;
}
