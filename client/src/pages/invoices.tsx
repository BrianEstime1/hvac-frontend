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
import { Plus, Trash2, Download } from "lucide-react";
import { insertInvoiceSchema, type Invoice, type InsertInvoice, type Customer } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateInvoicePDF, createInvoiceHTML } from "@/lib/invoice-pdf";
import { SignaturePad } from "@/components/SignaturePad";

export default function Invoices() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [authorizationInvoice, setAuthorizationInvoice] = useState<Invoice | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const formatCurrency = (value: number) =>
    Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 });

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
      invoiceNumber: "",
      technician: "",
      workPerformed: "",
      labor_cost: 0,
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertInvoice) => {
      // Auto-generate invoice number if not provided
      const invoiceNumber = data.invoiceNumber || `INV-${Date.now()}`;
      
      // Transform data to match backend expectations
      const backendData = {
        customer_id: data.customerId,
        invoice_number: invoiceNumber,
        date: data.date,
        technician: data.technician || "Admin",
        work_performed: data.workPerformed || "Service performed",
        labor_cost: data.labor_cost,
        description: data.description || "",
        description_of_work_performed: data.description || "",
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

  const signatureMutation = useMutation({
    mutationFn: ({ invoiceId, signature }: { invoiceId: number; signature: string }) =>
      apiRequest("POST", `/api/invoices/${invoiceId}/signature`, {
        signature: signature,
      })
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setAuthorizationInvoice(null);
      toast({ description: "Signature saved successfully" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to save signature",
      });
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

  const handleSaveSignature = (signature: string) => {
    if (!authorizationInvoice) return;

    signatureMutation.mutate({
      invoiceId: authorizationInvoice.id,
      signature,
    });
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
                    <TableHead>Labor/Materials</TableHead>
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
                        ${formatCurrency(invoice.labor_cost)}
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
                            variant="secondary"
                            size="sm"
                            onClick={() => setAuthorizationInvoice(invoice)}
                            data-testid={`button-authorize-${invoice.id}`}
                          >
                            Get Customer Authorization
                          </Button>
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
        <DialogContent
          data-testid="dialog-invoice-form"
          className="max-h-[90vh] overflow-y-auto"
        >
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
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Auto-generated if left blank"
                        data-testid="input-invoice-number" 
                      />
                    </FormControl>
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
                name="technician"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technician</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Technician name"
                        data-testid="input-technician" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workPerformed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work to be Performed</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="AC repair, maintenance, installation..."
                        {...field}
                        data-testid="input-work-performed"
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
                    <FormLabel>Description of Work Performed</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed description of the completed work..."
                        {...field}
                        data-testid="input-invoice-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="labor_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Labor/Materials</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-invoice-labor-cost"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="sticky bottom-0 bg-background pt-4 mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-submit-invoice"
                  className="min-h-11 text-base"
                >
                  {createMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingInvoice} onOpenChange={(open) => {
        if (!open) setDeletingInvoice(null);
      }}>
        <DialogContent
          data-testid="dialog-delete-invoice"
          className="max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sticky bottom-0 bg-background pt-4 mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeletingInvoice(null)}
              data-testid="button-cancel-delete"
              className="min-h-11 text-base"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
              className="min-h-11 text-base"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Authorization Dialog */}
      <Dialog
        open={!!authorizationInvoice}
        onOpenChange={(open) => {
          if (!open) setAuthorizationInvoice(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Authorization</DialogTitle>
            <DialogDescription>
              Obtain a customer signature to authorize work on this invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {authorizationInvoice
                ? `Invoice #${authorizationInvoice.invoiceNumber || authorizationInvoice.id}`
                : "Select an invoice to capture a signature."}
            </div>
            <SignaturePad
              onSave={handleSaveSignature}
              isSaving={signatureMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
