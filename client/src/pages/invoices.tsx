import { useState, type ChangeEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Download, Image as ImageIcon, Upload, Send, CreditCard, ExternalLink } from "lucide-react";
import { insertInvoiceSchema, type Invoice, type InsertInvoice, type Customer } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateInvoicePDF, createInvoiceHTML } from "@/lib/invoice-pdf";
import { SignaturePad } from "@/components/SignaturePad";
import { PhotoGallery, type InvoicePhoto } from "@/components/PhotoGallery";

const avatarColors = ["#0EA5E9", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function StatusPill({ status }: { status?: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    paid:    { bg: "#10B98115", color: "#10B981", label: "Paid" },
    sent:    { bg: "#F59E0B15", color: "#F59E0B", label: "Sent" },
    draft:   { bg: "#64748B15", color: "#64748B", label: "Draft" },
    overdue: { bg: "#EF444415", color: "#EF4444", label: "Overdue" },
  };
  const s = map[status ?? "draft"] ?? map.draft;
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

export default function Invoices() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [authorizationInvoice, setAuthorizationInvoice] = useState<Invoice | null>(null);
  const [photoInvoice, setPhotoInvoice] = useState<Invoice | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [stripeLoading, setStripeLoading] = useState<number | null>(null);
  const { toast } = useToast();

  const formatCurrency = (value: number) =>
    Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const photosQueryKey = photoInvoice
    ? [`/api/invoices/${photoInvoice.id}/photos`]
    : ["invoice-photos"];

  const { data: invoicePhotos = [], isLoading: photosLoading } = useQuery<InvoicePhoto[]>({
    queryKey: photosQueryKey,
    enabled: !!photoInvoice,
  });

  const form = useForm<InsertInvoice>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      customerId: 0,
      date: new Date().toISOString().split("T")[0],
      invoiceNumber: "",
      technician: "",
      workPerformed: "",
      labor_cost: 0,
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertInvoice) => {
      const invoiceNumber = data.invoiceNumber || `INV-${Date.now()}`;
      return apiRequest("POST", "/api/invoices", {
        customer_id: data.customerId,
        invoice_number: invoiceNumber,
        date: data.date,
        technician: data.technician || "Admin",
        work_performed: data.workPerformed || "Service performed",
        labor_cost: data.labor_cost,
        description: data.description || "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ description: "Invoice created successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", description: error.message || "Failed to create invoice" });
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
      apiRequest("POST", `/api/invoices/${invoiceId}/signature`, { signature }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setAuthorizationInvoice(null);
      toast({ description: "Signature saved successfully" });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: ({ invoiceId, photoData, caption }: { invoiceId: number; photoData: string; caption?: string }) =>
      apiRequest("POST", `/api/invoices/${invoiceId}/photos`, { photo_data: photoData, caption }),
    onSuccess: () => {
      if (photoInvoice) queryClient.invalidateQueries({ queryKey: [`/api/invoices/${photoInvoice.id}/photos`] });
      setSelectedPhotoFile(null);
      setPhotoCaption("");
      toast({ description: "Photo uploaded successfully." });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: ({ invoiceId, photoId }: { invoiceId: number; photoId: number }) =>
      apiRequest("DELETE", `/api/invoices/${invoiceId}/photos/${photoId}`),
    onSuccess: () => {
      if (photoInvoice) queryClient.invalidateQueries({ queryKey: [`/api/invoices/${photoInvoice.id}/photos`] });
      toast({ description: "Photo deleted successfully." });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ invoiceId, status, payment_method }: { invoiceId: number; status: string; payment_method?: string }) =>
      apiRequest("PATCH", `/api/invoices/${invoiceId}/status`, { status, payment_method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setPaymentInvoice(null);
      toast({ description: "Invoice marked as paid." });
    },
  });

  // Stripe: create payment link and open it / send to customer
  const handleSendStripeLink = async (invoice: Invoice) => {
    setStripeLoading(invoice.id);
    try {
      const result: any = await apiRequest("POST", `/api/invoices/${invoice.id}/stripe-link`, {});
      if (result.url) {
        // Copy link to clipboard and show toast with the link
        await navigator.clipboard.writeText(result.url).catch(() => {});
        toast({
          description: (
            <div className="flex flex-col gap-2">
              <span>Payment link created!</span>
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="underline text-primary text-sm">
                Open link ↗
              </a>
              <span className="text-xs text-muted-foreground">Link copied to clipboard</span>
            </div>
          ) as any,
        });
      }
    } catch (err: any) {
      toast({ variant: "destructive", description: err.message || "Failed to create payment link" });
    } finally {
      setStripeLoading(null);
    }
  };

  const handlePaymentMethodSelect = (method: string) => {
    if (!paymentInvoice) return;
    updateStatusMutation.mutate({
      invoiceId: paymentInvoice.id,
      status: "paid",
      payment_method: method,
    });
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const response = await apiRequest("GET", `/api/invoices/${invoice.id}`);
      const freshInvoice = response as any;
      const invoiceWithSignature = { ...invoice, customer_signature: freshInvoice.customer_signature || invoice.customer_signature };
      const customer = customers?.find((c) => c.id === invoice.customerId);
      const container = document.createElement("div");
      container.id = `invoice-content-${invoice.id}`;
      container.innerHTML = createInvoiceHTML(invoiceWithSignature, customer);
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);
      await generateInvoicePDF(invoiceWithSignature, customer, `Invoice-${invoice.id}-${invoice.customerName}`);
      document.body.removeChild(container);
      toast({ description: "Invoice downloaded successfully" });
    } catch {
      toast({ description: "Failed to download invoice", variant: "destructive" });
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoInvoice || !selectedPhotoFile) return;
    const reader = new FileReader();
    reader.onload = () => {
      uploadPhotoMutation.mutate({ invoiceId: photoInvoice.id, photoData: reader.result as string, caption: photoCaption.trim() || undefined });
    };
    reader.readAsDataURL(selectedPhotoFile);
  };

  const filteredInvoices = invoices?.filter((inv) => {
    const matchesSearch =
      inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) ?? [];

  const filters = ["all", "draft", "sent", "paid"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">Create and manage customer invoices</p>
        </div>
        <Button onClick={() => { form.reset(); setIsAddDialogOpen(true); }} data-testid="button-add-invoice" size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          New
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by customer or description..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        data-testid="input-search-invoices"
      />

      {/* Filter pills */}
      <div className="mobile-filter-row">
        {filters.map((f) => (
          <button
            key={f}
            className={`mobile-filter-pill${statusFilter === f ? " active" : ""}`}
            onClick={() => setStatusFilter(f)}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Invoice cards */}
      {invoicesLoading ? (
        <div className="mobile-card-list">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-3">🎉</div>
          <div className="font-medium">
            {statusFilter === "paid" ? "All paid up!" : "No invoices found"}
          </div>
        </div>
      ) : (
        <div className="mobile-card-list">
          {filteredInvoices.map((invoice) => {
            const color = getAvatarColor(invoice.customerName || "");
            return (
              <div key={invoice.id} className="mobile-card" data-testid={`row-invoice-${invoice.id}`}>
                <div className="mobile-card-top">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="mobile-avatar"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
                    >
                      {getInitials(invoice.customerName || "?")}
                    </div>
                    <div className="min-w-0">
                      <div className="mobile-card-title truncate" data-testid={`text-customer-${invoice.id}`}>
                        {invoice.customerName}
                      </div>
                      <div className="mobile-card-meta">
                        <span className="mobile-card-date" data-testid={`text-date-${invoice.id}`}>{invoice.date}</span>
                        <StatusPill status={invoice.status} />
                      </div>
                    </div>
                  </div>
                  <div className="mobile-card-amount" data-testid={`text-amount-${invoice.id}`}>
                    ${formatCurrency(invoice.labor_cost)}
                  </div>
                </div>

                {invoice.description && (
                  <div className="mobile-card-desc" data-testid={`text-description-${invoice.id}`}>
                    {invoice.description}
                  </div>
                )}

                {invoice.status === "paid" && invoice.payment_method && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Paid via {invoice.payment_method}
                  </div>
                )}

                {/* Actions */}
                <div className="mobile-card-actions flex-wrap gap-2 mt-3">
                  {invoice.status !== "paid" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setPaymentInvoice(invoice)}
                      data-testid={`button-mark-paid-${invoice.id}`}
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                      Mark Paid
                    </Button>
                  )}
                  {invoice.status !== "paid" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleSendStripeLink(invoice)}
                      disabled={stripeLoading === invoice.id}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      {stripeLoading === invoice.id ? "..." : "Pay Link"}
                    </Button>
                  )}
                  {invoice.status === "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ invoiceId: invoice.id, status: "sent" })}
                      data-testid={`button-mark-sent-${invoice.id}`}
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Mark Sent
                    </Button>
                  )}
                </div>

                {/* Secondary actions */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => { setPhotoInvoice(invoice); setSelectedPhotoFile(null); setPhotoCaption(""); }}
                    data-testid={`button-photos-${invoice.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    <ImageIcon className="w-3.5 h-3.5 mr-1" /> Photos
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => setAuthorizationInvoice(invoice)}
                    data-testid={`button-authorize-${invoice.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    ✍️ Sign
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => handleDownloadPDF(invoice)}
                    data-testid={`button-download-${invoice.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> PDF
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => setDeletingInvoice(invoice)}
                    data-testid={`button-delete-${invoice.id}`}
                    className="ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Invoice Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(o) => { if (!o) { setIsAddDialogOpen(false); form.reset(); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" data-testid="dialog-invoice-form">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>Create an invoice for a customer</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="customerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger data-testid="select-customer-invoice"><SelectValue placeholder="Select a customer" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number (Optional)</FormLabel>
                  <FormControl><Input {...field} placeholder="Auto-generated if blank" data-testid="input-invoice-number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-invoice-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="technician" render={({ field }) => (
                <FormItem>
                  <FormLabel>Technician</FormLabel>
                  <FormControl><Input {...field} placeholder="Technician name" data-testid="input-technician" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="workPerformed" render={({ field }) => (
                <FormItem>
                  <FormLabel>Work to be Performed</FormLabel>
                  <FormControl><Textarea placeholder="AC repair, maintenance..." {...field} data-testid="input-work-performed" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Detailed description..." {...field} data-testid="input-invoice-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="labor_cost" render={({ field }) => (
                <FormItem>
                  <FormLabel>Labor/Materials ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      data-testid="input-invoice-labor-cost" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-invoice" className="w-full min-h-11">
                  {createMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingInvoice} onOpenChange={(o) => { if (!o) setDeletingInvoice(null); }}>
        <DialogContent data-testid="dialog-delete-invoice">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2">
            <Button variant="destructive" onClick={() => deletingInvoice && deleteMutation.mutate(deletingInvoice.id)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete" className="min-h-11">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
            <Button variant="outline" onClick={() => setDeletingInvoice(null)} data-testid="button-cancel-delete" className="min-h-11">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={!!authorizationInvoice} onOpenChange={(o) => { if (!o) setAuthorizationInvoice(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Authorization</DialogTitle>
            <DialogDescription>Obtain customer signature to authorize work.</DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-2">
            {authorizationInvoice ? `Invoice #${authorizationInvoice.invoiceNumber || authorizationInvoice.id}` : ""}
          </div>
          <SignaturePad
            onSave={(sig) => authorizationInvoice && signatureMutation.mutate({ invoiceId: authorizationInvoice.id, signature: sig })}
            isSaving={signatureMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Photos Dialog */}
      <Dialog open={!!photoInvoice} onOpenChange={(o) => { if (!o) { setPhotoInvoice(null); setSelectedPhotoFile(null); setPhotoCaption(""); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice Photos</DialogTitle>
            <DialogDescription>Upload and manage photos for invoice #{photoInvoice?.invoiceNumber || photoInvoice?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Photo file</label>
                  <Input type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setSelectedPhotoFile(e.target.files?.[0] ?? null)} className="min-h-11" />
                  {selectedPhotoFile && <p className="text-xs text-muted-foreground">Selected: {selectedPhotoFile.name}</p>}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Caption</label>
                  <Input placeholder="Add a caption" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} className="min-h-11" />
                </div>
                <Button onClick={handleUploadPhoto} disabled={!selectedPhotoFile || uploadPhotoMutation.isPending} className="min-h-11">
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadPhotoMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
            {photosLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : (
              <PhotoGallery
                photos={invoicePhotos}
                deletingPhotoId={deletePhotoMutation.variables?.photoId}
                onDelete={(photo) => {
                  if (!photoInvoice) return;
                  deletePhotoMutation.mutate({ invoiceId: photoInvoice.id, photoId: photo.id });
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog open={!!paymentInvoice} onOpenChange={(o) => { if (!o) setPaymentInvoice(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>How was it paid?</DialogTitle>
            <DialogDescription>
              Invoice #{paymentInvoice?.invoiceNumber || paymentInvoice?.id} · ${formatCurrency(paymentInvoice?.labor_cost ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {["Cash", "Zelle", "Check", "Credit Card", "Cash App", "Other"].map((method) => (
              <Button
                key={method}
                variant="outline"
                className="h-14 text-sm font-semibold"
                onClick={() => handlePaymentMethodSelect(method)}
                disabled={updateStatusMutation.isPending}
                data-testid={`button-payment-${method.toLowerCase().replace(" ", "-")}`}
              >
                {method}
              </Button>
            ))}
          </div>
          <Button variant="ghost" onClick={() => setPaymentInvoice(null)} className="w-full">Cancel</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
