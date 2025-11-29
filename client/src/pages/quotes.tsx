import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus, Trash2, Download, Repeat2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertQuoteSchema,
  type InsertQuote,
  type Quote,
} from "@shared/schema";
import { createQuoteHTML, generateQuotePDF } from "@/lib/invoice-pdf";
import { Skeleton } from "@/components/ui/skeleton";

const REQUIRED_STATEMENT =
  "Quote includes all the work shown on the worksheet attached with this quote.";

export default function Quotes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [deletingQuote, setDeletingQuote] = useState<Quote | null>(null);
  const { toast } = useToast();

  const { data: quotes, isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const form = useForm<InsertQuote>({
    resolver: zodResolver(insertQuoteSchema),
    defaultValues: {
      quoteNumber: "",
      date: new Date().toISOString().split("T")[0],
      billToName: "",
      billToAddress: "",
      workDescription: "",
      totalAmount: 0,
      paymentTerms: "Total amount will be paid equally in quarterly payments.",
      requiredStatement: REQUIRED_STATEMENT,
      includeRequiredStatement: true,
      signatureImage: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: InsertQuote) => apiRequest("POST", "/api/quotes", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ description: "Quote created successfully" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to create quote",
      });
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

  const convertMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/quotes/${id}/convert`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ description: "Quote converted to invoice" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to convert quote",
      });
    },
  });

  const filteredQuotes = useMemo(() => {
    const normalized = searchTerm.toLowerCase();
    const list = (quotes || []).filter(
      (quote) =>
        quote.billToName.toLowerCase().includes(normalized) ||
        quote.workDescription.toLowerCase().includes(normalized)
    );

    return list.sort((a, b) => {
      if (sortBy === "total") return (b.totalAmount || 0) - (a.totalAmount || 0);
      if (sortBy === "quoteNumber") return a.quoteNumber.localeCompare(b.quoteNumber);
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [quotes, searchTerm, sortBy]);

  const handleDownload = async (quote: Quote) => {
    const container = document.createElement("div");
    container.id = `quote-content-${quote.id}`;
    container.innerHTML = createQuoteHTML(quote);
    container.style.position = "absolute";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    await generateQuotePDF(quote, `Quote-${quote.quoteNumber}`);
    document.body.removeChild(container);
    toast({ description: "Quote PDF generated" });
  };

  const handleSubmit = (values: InsertQuote) => {
    createMutation.mutate(values);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      form.setValue("signatureImage", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = () => {
    if (deletingQuote) {
      deleteMutation.mutate(deletingQuote.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quotes</h1>
          <p className="text-sm text-muted-foreground">
            Build quotes that mirror invoices with FerdAir branding
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Quote
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search by customer or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Newest</SelectItem>
                <SelectItem value="quoteNumber">Quote #</SelectItem>
                <SelectItem value="total">Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Bill To</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.length ? (
                  filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium">{quote.billToName}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {quote.workDescription}
                        </div>
                      </TableCell>
                      <TableCell>{quote.date}</TableCell>
                      <TableCell className="font-semibold">${quote.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        {quote.convertedInvoiceId ? (
                          <Badge variant="secondary">Converted</Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(quote)}
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => convertMutation.mutate(quote.id)}
                            disabled={!!quote.convertedInvoiceId || convertMutation.isPending}
                            title="Convert to Invoice"
                          >
                            <Repeat2 className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingQuote(quote)}
                            title="Delete"
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
                      No quotes yet. Create your first quote to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Quote</DialogTitle>
            <DialogDescription>
              Quotes mirror invoices but include required statements and payment terms.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quoteNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote Number (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Auto-generated" />
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
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="billToName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill To Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Customer or business" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billToAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill To Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Street, City, State" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope of Work / Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the work being proposed"
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[80px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <FormField
                  control={form.control}
                  name="includeRequiredStatement"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 mb-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div>
                        <FormLabel className="mb-1">Include Required Statement</FormLabel>
                        <p className="text-xs text-muted-foreground">Automatically adds the FerdAir quote notice.</p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="requiredStatement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Statement</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[80px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="signatureImage"
                render={() => (
                  <FormItem>
                    <FormLabel>Signature Image (optional)</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" onChange={handleFileUpload} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save Quote"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingQuote} onOpenChange={(open) => !open && setDeletingQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this quote? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingQuote(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
