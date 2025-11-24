import { z } from "zod";

// Customer Schema
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
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
  description: z.string(),
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
});

export const insertInventoryItemSchema = inventoryItemSchema.omit({ id: true });

export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;

// Dashboard Stats
export interface DashboardStats {
  totalCustomers: number;
  upcomingAppointments: number;
  lowStockItems: InventoryItem[];
}
