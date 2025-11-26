import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Download, Mail } from "lucide-react";
import { insertInvoiceSchema, type Invoice, type InsertInvoice, type Customer } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateInvoicePDF, createInvoiceHTML } from "@/lib/invoice-pdf";

export default function Invoices() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [sendingEmailInvoice, setSendingEmailInvoice] = useState<Invoice | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const form = useForm<InsertInvoice>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      customerId: 0,
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertInvoice) => {
      // Generate invoice number based on timestamp
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Transform data to match backend expectations
      const backendData = {
        customer_id: data.customerId,
        invoice_number: invoiceNumber,
        date: data.date,
        technician: "Admin", // Default technician
        work_performed: data.description || "Service performed",
        labor_cost: data.amount,
      };
      
      return apiRequest("POST", "/api/invoices", backendData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ description: "Invoice created successfully" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to create invoice",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setDeletingInvoice(null);
      toast({ description: "Invoice deleted successfully" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data: { invoiceId: number; email: string }) =>
      apiRequest("POST", `/api/invoices/${data.invoiceId}/send-email`, { email: data.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setSendingEmailInvoice(null);
      setEmailAddress("");
      toast({ description: "Invoice sent successfully!" });
    },
  });

  const handleOpenAddDialog = () => {
    form.reset();
    setIsAddDialogOpen(true);
  };

  const handleSubmit = (data: InsertInvoice) => {
    createMutation.mutate(data);
  };

  const handleDelete = () => {
    if (deletingInvoice) {
      deleteMutation.mutate(deletingInvoice.id);
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const customer = customers?.find((c) => c.id === invoice.customerId);
      
      // Create a temporary container for PDF generation
      const container = document.createElement("div");
      container.id = `invoice-content-${invoice.id}`;
      container.innerHTML = createInvoiceHTML(invoice, customer);
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      await generateInvoicePDF(
        invoice,
        customer,
        `Invoice-${invoice.id}-${invoice.customerName}`
      );

      document.body.removeChild(container);
      toast({ description: "Invoice downloaded successfully" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = () => {
    if (sendingEmailInvoice && emailAddress) {
      sendEmailMutation.mutate({
        invoiceId: sendingEmailInvoice.id,
        email: emailAddress,
      });
    }
  };

  const filteredInvoices = invoices?.filter((invoice) =>
    invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "sent":
        return "secondary";
      case "draft":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">Create and manage customer invoices</p>
        </div>
        <Button onClick={handleOpenAddDialog} data-testid="button-add-invoice">
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <Input
            placeholder="Search by customer or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
            data-testid="input-search-invoices"
          />
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices && filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-medium" data-testid={`text-customer-${invoice.id}`}>
                        {invoice.customerName}
                      </TableCell>
                      <TableCell data-testid={`text-date-${invoice.id}`}>{invoice.date}</TableCell>
                      <TableCell data-testid={`text-amount-${invoice.id}`}>
                        ${invoice.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" data-testid={`text-description-${invoice.id}`}>
                        {invoice.description}
                      </TableCell>
                      <TableCell>
                        {invoice.status && (
                          <Badge
                            variant={getStatusVariant(invoice.status)}
                            data-testid={`badge-status-${invoice.id}`}
                          >
                            {invoice.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(invoice)}
                            data-testid={`button-download-${invoice.id}`}
                            title="Download as PDF"
                          >
                            <Download className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSendingEmailInvoice(invoice);
                              setEmailAddress(customers?.find((c) => c.id === invoice.customerId)?.email || "");
                            }}
                            data-testid={`button-email-${invoice.id}`}
                            title="Send via email"
                          >
                            <Mail className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingInvoice(invoice)}
                            data-testid={`button-delete-${invoice.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No invoices yet. Create your first invoice to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          form.reset();
        }
      }}>
        <DialogContent data-testid="dialog-invoice-form">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Create an invoice for a customer
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-customer-invoice">
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers && customers.length > 0 ? (
                          customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="0" disabled>
                            No customers available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-invoice-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-invoice-amount"
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Invoice description..."
                        {...field}
                        data-testid="input-invoice-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-submit-invoice"
                >
                  {createMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={!!sendingEmailInvoice} onOpenChange={(open) => {
        if (!open) {
          setSendingEmailInvoice(null);
          setEmailAddress("");
        }
      }}>
        <DialogContent data-testid="dialog-send-email">
          <DialogHeader>
            <DialogTitle>Send Invoice via Email</DialogTitle>
            <DialogDescription>
              Enter the email address to send this invoice to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="customer@example.com"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              data-testid="input-email-address"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSendingEmailInvoice(null);
                setEmailAddress("");
              }}
              data-testid="button-cancel-email"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={!emailAddress || sendEmailMutation.isPending}
              data-testid="button-confirm-email"
            >
              {sendEmailMutation.isPending ? "Sending..." : "Send Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingInvoice} onOpenChange={(open) => {
        if (!open) setDeletingInvoice(null);
      }}>
        <DialogContent data-testid="dialog-delete-invoice">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingInvoice(null)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
