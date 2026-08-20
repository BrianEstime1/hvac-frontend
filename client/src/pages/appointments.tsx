import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, CheckCircle, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { type Appointment, type Customer } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const TECHNICIANS = ["Ferde", "James", "Other"];

const NEW_CUSTOMER_VALUE = "new";

const appointmentFormSchema = z
  .object({
    customerId: z.string(),
    newCustomerName: z.string().optional(),
    newCustomerPhone: z.string().optional(),
    newCustomerAddress: z.string().optional(),
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    serviceType: z.string().optional(),
    technician: z.string().optional(),
    description: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.customerId === NEW_CUSTOMER_VALUE) {
      if (!data.newCustomerName?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["newCustomerName"], message: "Name is required" });
      }
      const digits = (data.newCustomerPhone || "").replace(/\D/g, "");
      if (digits.length !== 10) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["newCustomerPhone"], message: "Phone must be 10 digits" });
      }
    } else if (!data.customerId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["customerId"], message: "Select a customer" });
    }
  });

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

// ---- Date helpers (string-based to avoid timezone shifts) ----

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayStr() {
  const now = new Date();
  return toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDayLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Accepts "14:30" or "2:30 PM"; returns minutes since midnight (or null)
function timeToMinutes(time?: string): number | null {
  if (!time) return null;
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatTime(time?: string) {
  const mins = timeToMinutes(time);
  if (mins === null) return time || "";
  const hours24 = Math.floor(mins / 60);
  const minutes = mins % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${meridiem}`;
}

const DAY_START_HOUR = 6; // 6 AM
const DAY_END_HOUR = 20; // 8 PM

const statusColors: Record<string, string> = {
  pending: "#f59e0b",
  scheduled: "#3b82f6",
  "in-progress": "#8b5cf6",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const color = statusColors[status] ?? "#64748b";
  return (
    <Badge
      variant="outline"
      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {status === "pending" ? "⚠ Pending" : status}
    </Badge>
  );
}

export default function Appointments() {
  const today = todayStr();
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const { toast } = useToast();

  const { data: appointments, isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      customerId: "",
      newCustomerName: "",
      newCustomerPhone: "",
      newCustomerAddress: "",
      date: selectedDate,
      time: "",
      serviceType: "",
      technician: "",
      description: "",
    },
  });

  const isNewCustomer = form.watch("customerId") === NEW_CUSTOMER_VALUE;

  // Appointments grouped by date for calendar dots
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const apt of appointments ?? []) {
      if (apt.status === "cancelled") continue;
      const list = map.get(apt.date) ?? [];
      list.push(apt);
      map.set(apt.date, list);
    }
    return map;
  }, [appointments]);

  const dayAppointments = useMemo(() => {
    const list = (appointments ?? []).filter((a) => a.date === selectedDate);
    return list.sort((a, b) => (timeToMinutes(a.time) ?? 0) - (timeToMinutes(b.time) ?? 0));
  }, [appointments, selectedDate]);

  const invalidateAppointments = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: AppointmentFormValues) => {
      let customerId: number;
      if (data.customerId === NEW_CUSTOMER_VALUE) {
        const result: any = await apiRequest("POST", "/api/customers", {
          name: data.newCustomerName?.trim(),
          phone: data.newCustomerPhone?.trim(),
          address: data.newCustomerAddress?.trim() || "",
        });
        customerId = result.id;
      } else {
        customerId = parseInt(data.customerId);
      }
      return apiRequest("POST", "/api/appointments", {
        customer_id: customerId,
        appointment_date: data.date,
        appointment_time: data.time,
        service_type: data.serviceType || data.description || "Service Call",
        technician: data.technician || "",
        notes: data.description || "",
      });
    },
    onSuccess: (_result, variables) => {
      invalidateAppointments();
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsAddDialogOpen(false);
      setSelectedDate(variables.date);
      const [y, m] = variables.date.split("-").map(Number);
      setViewMonth({ year: y, month: m - 1 });
      form.reset();
      toast({ description: "Appointment created successfully" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to create appointment",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/appointments/${id}`),
    onSuccess: () => {
      invalidateAppointments();
      setDeletingAppointment(null);
      toast({ description: "Appointment deleted successfully" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PUT", `/api/appointments/${id}/status`, { status }),
    onSuccess: (_result, variables) => {
      invalidateAppointments();
      toast({
        description:
          variables.status === "completed"
            ? "Marked as done ✓"
            : variables.status === "scheduled"
            ? "Appointment confirmed!"
            : "Status updated",
      });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", description: error.message || "Failed to update status" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ appointment, technician }: { appointment: Appointment; technician: string }) =>
      apiRequest("PUT", `/api/appointments/${appointment.id}`, {
        appointment_date: appointment.date,
        appointment_time: appointment.time,
        service_type: appointment.serviceType || "Service Call",
        technician,
        notes: appointment.description || "",
      }),
    onSuccess: (_result, variables) => {
      invalidateAppointments();
      setViewingAppointment((prev) =>
        prev && prev.id === variables.appointment.id
          ? { ...prev, technician: variables.technician }
          : prev
      );
      toast({
        description: variables.technician
          ? `Assigned to ${variables.technician}`
          : "Technician unassigned",
      });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", description: error.message || "Failed to assign technician" });
    },
  });

  const toggleDone = (apt: Appointment) => {
    statusMutation.mutate({
      id: apt.id,
      status: apt.status === "completed" ? "scheduled" : "completed",
    });
  };

  const handleOpenAddDialog = (time?: string) => {
    form.reset({
      customerId: "",
      newCustomerName: "",
      newCustomerPhone: "",
      newCustomerAddress: "",
      date: selectedDate,
      time: time ?? "",
      serviceType: "",
      technician: "",
      description: "",
    });
    setIsAddDialogOpen(true);
  };

  // ---- Calendar grid ----
  const { year, month } = viewMonth;
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const goToMonth = (offset: number) => {
    setViewMonth(({ year, month }) => {
      const d = new Date(year, month + offset, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goToToday = () => {
    const now = new Date();
    setViewMonth({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDate(today);
  };

  // ---- Day schedule (time blocks) ----
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);
  const aptsByHour = new Map<number, Appointment[]>();
  const outsideHours: Appointment[] = [];
  for (const apt of dayAppointments) {
    const mins = timeToMinutes(apt.time);
    if (mins === null) {
      outsideHours.push(apt);
      continue;
    }
    const hour = Math.floor(mins / 60);
    if (hour < DAY_START_HOUR || hour > DAY_END_HOUR) {
      outsideHours.push(apt);
    } else {
      const list = aptsByHour.get(hour) ?? [];
      list.push(apt);
      aptsByHour.set(hour, list);
    }
  }

  const hourLabel = (hour: number) => {
    const meridiem = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 === 0 ? 12 : hour % 12;
    return `${h} ${meridiem}`;
  };

  const renderAppointmentCard = (apt: Appointment) => {
    const color = statusColors[apt.status ?? "scheduled"] ?? "#3b82f6";
    const isDone = apt.status === "completed";
    return (
      <div
        key={apt.id}
        className="flex items-center gap-3 rounded-lg p-2.5 cursor-pointer hover:opacity-90 transition-opacity"
        style={{ background: `${color}12`, borderLeft: `3px solid ${color}` }}
        onClick={() => setViewingAppointment(apt)}
        data-testid={`card-appointment-${apt.id}`}
      >
        <div onClick={(e) => e.stopPropagation()} className="flex items-center">
          <Checkbox
            checked={isDone}
            onCheckedChange={() => toggleDone(apt)}
            disabled={statusMutation.isPending}
            aria-label="Mark service done"
            data-testid={`checkbox-done-${apt.id}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={`text-sm font-semibold truncate ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}
          >
            {apt.customerName || "Unknown Customer"}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {formatTime(apt.time)}
            {apt.serviceType ? ` · ${apt.serviceType}` : ""}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {apt.technician ? (
            <Badge variant="secondary" className="text-xs">
              {apt.technician}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground italic">Unassigned</span>
          )}
          {apt.status === "pending" && <StatusBadge status="pending" />}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-sm text-muted-foreground">
            Calendar of service calls — check them off when done
          </p>
        </div>
        <Button onClick={() => handleOpenAddDialog()} data-testid="button-add-appointment">
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Month calendar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" onClick={() => goToMonth(-1)} data-testid="button-prev-month">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{monthLabel}</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={goToToday} data-testid="button-today">
                Today
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={() => goToMonth(1)} data-testid="button-next-month">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs text-muted-foreground font-medium mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateStr = toDateStr(year, month, day);
              const dayApts = appointmentsByDate.get(dateStr) ?? [];
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === today;
              const allDone = dayApts.length > 0 && dayApts.every((a) => a.status === "completed");
              const hasPending = dayApts.some((a) => a.status === "pending");
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative flex flex-col items-center justify-start rounded-lg py-1.5 min-h-12 text-sm transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold"
                      : isToday
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted text-foreground"
                  }`}
                  data-testid={`day-${dateStr}`}
                >
                  <span>{day}</span>
                  {dayApts.length > 0 && (
                    <span
                      className="mt-0.5 text-[10px] font-bold rounded-full px-1.5 leading-4"
                      style={{
                        background: isSelected
                          ? "rgba(255,255,255,0.25)"
                          : allDone
                          ? "#22c55e25"
                          : hasPending
                          ? "#f59e0b25"
                          : "#3b82f625",
                        color: isSelected ? "inherit" : allDone ? "#22c55e" : hasPending ? "#f59e0b" : "#3b82f6",
                      }}
                    >
                      {dayApts.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day schedule with time blocks */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold text-foreground">{formatDayLabel(selectedDate)}</div>
              <div className="text-xs text-muted-foreground">
                {dayAppointments.length === 0
                  ? "No appointments"
                  : `${dayAppointments.length} appointment${dayAppointments.length > 1 ? "s" : ""} · ${
                      dayAppointments.filter((a) => a.status === "completed").length
                    } done`}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleOpenAddDialog()} data-testid="button-add-for-day">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>

          {appointmentsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div>
              {outsideHours.length > 0 && (
                <div className="mb-2 space-y-1.5">{outsideHours.map(renderAppointmentCard)}</div>
              )}
              {hours.map((hour) => {
                const slotApts = aptsByHour.get(hour) ?? [];
                return (
                  <div key={hour} className="flex gap-2 border-t border-border/60">
                    <div className="w-14 shrink-0 text-xs text-muted-foreground pt-1.5 text-right pr-1">
                      {hourLabel(hour)}
                    </div>
                    <div className="flex-1 py-1 min-h-9">
                      {slotApts.length > 0 ? (
                        <div className="space-y-1.5">{slotApts.map(renderAppointmentCard)}</div>
                      ) : (
                        <button
                          className="w-full h-7 rounded-md text-xs text-transparent hover:text-muted-foreground hover:bg-muted/50 transition-colors text-left px-2"
                          onClick={() => handleOpenAddDialog(`${String(hour).padStart(2, "0")}:00`)}
                          data-testid={`slot-${hour}`}
                        >
                          + Add at {hourLabel(hour)}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            form.reset();
          }
        }}
      >
        <DialogContent data-testid="dialog-appointment-form" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
            <DialogDescription>
              Book a service call — pick an existing customer or add a new one
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-customer">
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NEW_CUSTOMER_VALUE}>
                          <span className="flex items-center gap-2 font-medium text-primary">
                            <UserPlus className="w-4 h-4" /> Add new customer
                          </span>
                        </SelectItem>
                        {customersLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading customers...
                          </SelectItem>
                        ) : (
                          customers?.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isNewCustomer && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> New Customer
                  </div>
                  <FormField
                    control={form.control}
                    name="newCustomerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Customer name" data-testid="input-new-customer-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newCustomerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            inputMode="tel"
                            placeholder="5551234567"
                            data-testid="input-new-customer-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newCustomerAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Street address" data-testid="input-new-customer-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" data-testid="input-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="technician"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Technician</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-technician">
                          <SelectValue placeholder="Assign later" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TECHNICIANS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="AC Repair, Maintenance, Installation..."
                        data-testid="input-service-type"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Details from the phone call..."
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="sticky bottom-0 bg-background pt-4 mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                  className="min-h-11 text-base"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-submit"
                  className="min-h-11 text-base"
                >
                  {createMutation.isPending ? "Creating..." : "Create Appointment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Modal */}
      {viewingAppointment && (
        <Dialog open={!!viewingAppointment} onOpenChange={() => setViewingAppointment(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#2563eb20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#2563eb",
                    flexShrink: 0,
                  }}
                >
                  {(viewingAppointment.customerName || "?")
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {viewingAppointment.customerName || "Unknown"}
                  </div>
                  {viewingAppointment.customerPhone && (
                    <a
                      href={`tel:${viewingAppointment.customerPhone}`}
                      className="text-sm text-blue-400 hover:underline"
                    >
                      {viewingAppointment.customerPhone}
                    </a>
                  )}
                </div>
              </div>

              {viewingAppointment.customerAddress && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Address: </span>
                  <span className="text-foreground">{viewingAppointment.customerAddress}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-xs text-muted-foreground mb-1">Date</div>
                  <div className="text-sm font-medium">{viewingAppointment.date}</div>
                </div>
                <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-xs text-muted-foreground mb-1">Time</div>
                  <div className="text-sm font-medium">{formatTime(viewingAppointment.time)}</div>
                </div>
              </div>

              {viewingAppointment.serviceType && (
                <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-xs text-muted-foreground mb-1">Service Type</div>
                  <div className="text-sm font-medium">{viewingAppointment.serviceType}</div>
                </div>
              )}

              {viewingAppointment.description && (
                <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-xs text-muted-foreground mb-1">Notes</div>
                  <div className="text-sm" style={{ whiteSpace: "pre-wrap" }}>
                    {viewingAppointment.description}
                  </div>
                </div>
              )}

              <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="text-xs text-muted-foreground mb-2">Assigned Technician</div>
                <Select
                  value={viewingAppointment.technician || ""}
                  onValueChange={(technician) =>
                    assignMutation.mutate({ appointment: viewingAppointment, technician })
                  }
                  disabled={assignMutation.isPending}
                >
                  <SelectTrigger data-testid="select-assign-technician">
                    <SelectValue placeholder="Not assigned yet" />
                  </SelectTrigger>
                  <SelectContent>
                    {TECHNICIANS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <StatusBadge status={viewingAppointment.status} />
              </div>
            </div>
            <DialogFooter className="gap-2 flex-col sm:flex-row">
              {viewingAppointment.status === "pending" && (
                <Button
                  variant="outline"
                  style={{ color: "#22c55e", borderColor: "#22c55e40" }}
                  onClick={() => {
                    statusMutation.mutate({ id: viewingAppointment.id, status: "scheduled" });
                    setViewingAppointment(null);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Confirm
                </Button>
              )}
              <Button
                variant={viewingAppointment.status === "completed" ? "outline" : "default"}
                onClick={() => {
                  toggleDone(viewingAppointment);
                  setViewingAppointment(null);
                }}
                disabled={statusMutation.isPending}
                data-testid="button-toggle-done"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {viewingAppointment.status === "completed" ? "Mark Not Done" : "Mark Done"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDeletingAppointment(viewingAppointment);
                  setViewingAppointment(null);
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
              <Button variant="ghost" onClick={() => setViewingAppointment(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingAppointment} onOpenChange={(open) => !open && setDeletingAppointment(null)}>
        <DialogContent data-testid="dialog-delete-confirm" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delete Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sticky bottom-0 bg-background pt-4 mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeletingAppointment(null)}
              data-testid="button-cancel-delete"
              className="min-h-11 text-base"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingAppointment && deleteMutation.mutate(deletingAppointment.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
              className="min-h-11 text-base"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
