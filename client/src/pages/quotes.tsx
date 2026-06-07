import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Download, Link2, PenLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { createQuoteHTML, generateQuotePDF, invalidateOwnerSignatureCache } from "@/lib/invoice-pdf";
import { SignaturePad } from "@/components/SignaturePad";
import { insertQuoteSchema, type Customer, type InsertQuote, type Quote } from "@shared/schema";

const STATUS_OPTIONS = ["draft", "sent", "accepted", "rejected"];
const formatStatusLabel = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

export default function Quotes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<Quote | null>(null);
  const [authorizationQuote, setAuthorizationQuote] = useState<Quote | null>(null);
  const [ownerSigDialogOpen, setOwnerSigDialogOpen] = useState(false);
  const [signLinkDialog, setSignLinkDialog] = useState<{ url: string; customerName: string } | null>(null);
  const [sigLinkLoading, setSigLinkLoading] = useState<number | null>(null);
  const { toast } = useToast();

  const quotesQuery = useQuery<Quote[]>({ queryKey: ["/api/quotes"] });
  const { data: quotes, isLoading, isError, refetch } = quotesQuery;

  const { data: customers } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  const form = useForm<InsertQuote>({
    resolver: zodResolver(insertQuoteSchema),
    defaultValues: {
      customerId: 0,
      title: "",
      description: "",
      total: 0,
      status: "draft",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: InsertQuote) => {
      const payload = {
        customer_id: data.customerId,
        title: data.title,
        description: data.description || "",
        total: data.total,
        status: data.status || "draft",
      };
      if (editingQuote) {
        return apiRequest("PUT", `/api/quotes/${editingQuote.id}`, payload);
      }
      return apiRequest("POST", "/api/quotes", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setIsDialogOpen(false);
      setEditingQuote(null);
      form.reset({ customerId: 0, title: "", description: "", total: 0, status: "draft" });
      toast({ description: "Quote saved successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", description: error?.message || "Failed to save quote" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/quotes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setDeletingQuote(null);
      toast({ description: "Quote deleted" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PUT", `/api/quotes/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", description: error?.message || "Failed to update status" });
    },
  });

  const signatureMutation = useMutation({
    mutationFn: ({ quoteId, signature }: { quoteId: number; signature: string }) =>
      apiRequest("POST", `/api/quotes/${quoteId}/signature`, { signature }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setAuthorizationQuote(null);
      toast({ description: "Signature saved successfully" });
    },
  });

  const ownerSignatureMutation = useMutation({
    mutationFn: (signature: string) =>
      apiRequest("POST", "/api/settings/owner-signature", { signature }),
    onSuccess: () => {
      invalidateOwnerSignatureCache();
      setOwnerSigDialogOpen(false);
      toast({ description: "Your signature has been saved. It will now appear automatically on all invoices and quotes." });
    },
    onError: () => {
      toast({ variant: "destructive", description: "Failed to save signature" });
    },
  });

  const handleCopySignLink = async (quote: Quote) => {
    setSigLinkLoading(quote.id);
    try {
      const result: any = await apiRequest("POST", `/api/quotes/${quote.id}/signing-token`, {});
      const url: string = result.url;
      let copied = false;
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch {
        // clipboard unavailable — show dialog so user can copy manually
      }
      setSignLinkDialog({ url, customerName: quote.customerName || "customer" });
      if (copied) {
        toast({ description: "Link copied to clipboard!" });
      }
    } catch {
      toast({ variant: "destructive", description: "Failed to generate signing link" });
    } finally {
      setSigLinkLoading(null);
    }
  };

  const normalizedTerm = searchTerm.toLowerCase();
  const filteredQuotes = useMemo(() => {
    const filtered = (quotes ?? []).filter((q) => {
      const name = q.customerName?.toLowerCase() ?? "";
      const title = q.title?.toLowerCase() ?? "";
      const status = q.status?.toLowerCase() ?? "";
      return (
        name.includes(normalizedTerm) ||
        title.includes(normalizedTerm) ||
        status.includes(normalizedTerm)
      );
    });
    return filtered.sort((a, b) => {
      const dateB = new Date(b.createdAt || "").getTime() || 0;
      const dateA = new Date(a.createdAt || "").getTime() || 0;
      return dateB - dateA;
    });
  }, [quotes, normalizedTerm]);

  const handleOpenNew = () => {
    setEditingQuote(null);
    form.reset({ customerId: 0, title: "", description: "", total: 0, status: "draft" });
    setIsDialogOpen(true);
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    form.reset({
      customerId: quote.customerId,
      title: quote.title || "",
      description: quote.description || "",
      total: Number(quote.total || 0),
      status: (quote.status || "draft").toLowerCase(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (deletingQuote) deleteMutation.mutate(deletingQuote.id);
  };

  const handleSubmit = (values: InsertQuote) => saveMutation.mutate(values);

  const handleDownload = async (quote: Quote) => {
    const matchedCustomer = customers?.find((c) => c.id === quote.customerId);
    const quoteForPdf: Quote = {
      ...quote,
      customerName: quote.customerName || matchedCustomer?.name || `Customer #${quote.customerId}`,
      customerAddress: quote.customerAddress || matchedCustomer?.address || "",
    };
    const container = document.createElement("div");
    container.id = `quote-content-${quoteForPdf.id}`;
    container.innerHTML = createQuoteHTML(quoteForPdf);
    container.style.position = "absolute";
    container.style.left = "-9999px";
    document.body.appendChild(container);
    await generateQuotePDF(quoteForPdf, `Quote-${quoteForPdf.quoteNumber || quoteForPdf.id}`);
    document.body.removeChild(container);
    toast({ description: "Quote PDF generated" });
  };

  const getCustomerLabel = (quote: Quote) => quote.customerName || `Customer #${quote.customerId}`;

  const formatCurrency = (value: number | undefined) =>
    `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const renderErrorState = () => (
    <Card>
      <CardContent className="py-12 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Unable to load quotes right now.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quotes</h1>
          <p className="text-sm text-muted-foreground">Create, track, and export customer quotes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOwnerSigDialogOpen(true)} title="Set your automatic signature">
            <PenLine className="w-4 h-4 mr-1.5" />
            My Signature
          </Button>
          <Button onClick={handleOpenNew} data-testid="button-add-quote">
            <Plus className="w-4 h-4 mr-2" />
            New Quote
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>Quotes</CardTitle>
          <Input
            placeholder="Search by customer, title, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:w-80"
          />
        </CardHeader>
        <CardContent>
          {isError ? (
            renderErrorState()
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.length ? (
                  filteredQuotes.map((quote) => {
                    const statusLabel = (quote.status || "draft").toLowerCase();
                    return (
                      <TableRow key={quote.id}>
                        <TableCell className="font-medium">
                          {quote.quoteNumber || `Q-${quote.id}`}
                        </TableCell>
                        <TableCell>{getCustomerLabel(quote)}</TableCell>
                        <TableCell className="max-w-xs truncate" title={quote.title || ""}>
                          {quote.title || "Untitled"}
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(quote.total)}</TableCell>
                        <TableCell>
                          <Select
                            value={statusLabel}
                            onValueChange={(value) => statusMutation.mutate({ id: quote.id, status: value })}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>{formatStatusLabel(option)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => handleDownload(quote)}
                              title="Export PDF"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => setAuthorizationQuote(quote)}
                              title="Sign (in person)"
                            >
                              <PenLine className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => handleCopySignLink(quote)}
                              disabled={sigLinkLoading === quote.id}
                              title="Copy signing link to send to customer"
                            >
                              <Link2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => handleEdit(quote)}
                              title="Edit Quote"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => setDeletingQuote(quote)}
                              title="Delete Quote"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No quotes found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingQuote ? "Edit Quote" : "New Quote"}</DialogTitle>
            <DialogDescription>
              Add the quote details, then save to keep it in sync with your customers.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="customerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                    <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
                    <SelectContent>
                      {(customers ?? []).map((customer) => (
                        <SelectItem key={customer.id} value={String(customer.id)}>{customer.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} placeholder="Maintenance quote" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Summarize the proposed work" className="min-h-[120px]" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="total" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>{formatStatusLabel(option)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save Quote"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingQuote} onOpenChange={(open) => !open && setDeletingQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quote</DialogTitle>
            <DialogDescription>This will permanently remove the quote. Are you sure?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingQuote(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog (in-person) */}
      <Dialog open={!!authorizationQuote} onOpenChange={(o) => { if (!o) setAuthorizationQuote(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Authorization</DialogTitle>
            <DialogDescription>Obtain customer signature to accept this quote.</DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-2">
            {authorizationQuote ? `Quote ${authorizationQuote.quoteNumber || `#${authorizationQuote.id}`}` : ""}
          </div>
          <SignaturePad
            onSave={(sig) => authorizationQuote && signatureMutation.mutate({ quoteId: authorizationQuote.id, signature: sig })}
            isSaving={signatureMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Owner Signature Dialog */}
      <Dialog open={ownerSigDialogOpen} onOpenChange={setOwnerSigDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set Your Automatic Signature</DialogTitle>
            <DialogDescription>
              Draw your signature once and it will automatically appear on every invoice and quote PDF.
            </DialogDescription>
          </DialogHeader>
          <SignaturePad
            onSave={(sig) => ownerSignatureMutation.mutate(sig)}
            isSaving={ownerSignatureMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Sign Link Dialog */}
      <Dialog open={!!signLinkDialog} onOpenChange={(o) => { if (!o) setSignLinkDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Signing Link for {signLinkDialog?.customerName}</DialogTitle>
            <DialogDescription>
              Copy this link and send it to your customer so they can accept the quote from their phone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-2">
            <Input
              readOnly
              value={signLinkDialog?.url || ""}
              className="text-xs"
              onFocus={(e) => e.target.select()}
            />
            <Button
              size="sm"
              className="shrink-0"
              onClick={() => {
                if (!signLinkDialog?.url) return;
                navigator.clipboard.writeText(signLinkDialog.url).catch(() => {});
                toast({ description: "Link copied!" });
              }}
            >
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tap the link above to select it, then copy &amp; paste it into a text message.
          </p>
          <Button variant="ghost" onClick={() => setSignLinkDialog(null)} className="w-full mt-2">Close</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
