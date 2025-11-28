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
  date: z.string(),
  time: z.string(),
  serviceType: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
});

export const insertAppointmentSchema = appointmentSchema.omit({ id: true, customerName: true });

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
  labor_cost: z.number(),
  materials_cost: z.number().optional(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number().optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "sent", "paid"]).optional(),
});

export const insertInvoiceSchema = invoiceSchema.omit({ id: true, customerName: true });

export type Invoice = z.infer<typeof invoiceSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// Dashboard Stats
export interface DashboardStats {
  totalCustomers: number;
  upcomingAppointments: number;
  lowStockItems: InventoryItem[];
}
