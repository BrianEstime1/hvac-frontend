import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { insertCustomerSchema, type Customer, type InsertCustomer, type Invoice } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type CustomerPhoto = {
  id: number;
  photo_data: string;
  caption?: string | null;
  invoiceId?: number | null;
  invoiceNumber?: string | null;
};

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<CustomerPhoto | null>(null);
  const { toast } = useToast();

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: customerPhotos = [], isLoading: photosLoading } = useQuery<
    CustomerPhoto[]
  >({
    queryKey: ["customer-photos", selectedCustomer?.id],
    enabled: !!selectedCustomer,
    queryFn: async () => {
      if (!selectedCustomer) return [];
      return apiRequest("GET", `/api/customers/${selectedCustomer.id}/photos`);
    },
  });

  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCustomer) => apiRequest("POST", "/api/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ description: "Customer created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: InsertCustomer }) =>
      apiRequest("PUT", `/api/customers/${id}`, data),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setEditingCustomer(null);
      setSelectedCustomer((current) =>
        current?.id === id ? { ...current, ...data } : current
      );
      form.reset();
      toast({ description: "Customer updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDeletingCustomer(null);
      toast({ description: "Customer deleted successfully" });
    },
  });

  const normalized = searchTerm.toLowerCase();
  const formatCurrency = (value: number) =>
    Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 });

  const filteredCustomers = (customers ?? []).filter((customer) => {
    const name = customer.name?.toLowerCase() ?? "";
    const email = customer.email?.toLowerCase() ?? "";
    const phone = customer.phone?.toLowerCase() ?? "";
    const address = customer.address?.toLowerCase() ?? "";

    return (
      name.includes(normalized) ||
      email.includes(normalized) ||
      phone.includes(normalized) ||
      address.includes(normalized)
    );
  });

  const customerInvoices = selectedCustomer
    ? invoices.filter((invoice) => invoice.customerId === selectedCustomer.id)
    : [];

  const handleOpenAddDialog = () => {
    form.reset();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (customer: Customer) => {
    form.reset({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });
    setEditingCustomer(customer);
  };

  const handleSubmit = (data: InsertCustomer) => {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (deletingCustomer) {
      deleteMutation.mutate(deletingCustomer.id);
    }
  };

  if (selectedCustomer) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCustomer(null)}
              className="px-0 text-muted-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Button>
            <h1 className="text-2xl font-bold text-foreground">{selectedCustomer.name}</h1>
            <p className="text-sm text-muted-foreground">
              Customer detail view
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenEditDialog(selectedCustomer)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Customer
            </Button>
          </div>
        </div>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Contact information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm text-foreground">{selectedCustomer.email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm text-foreground">{selectedCustomer.phone || "—"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-sm text-foreground">{selectedCustomer.address || "—"}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {customerInvoices.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoiceNumber
                              ? `#${invoice.invoiceNumber}`
                              : `#${invoice.id}`}
                          </TableCell>
                          <TableCell>{invoice.date}</TableCell>
                          <TableCell>
                            {invoice.status ? (
                              <Badge variant="outline">{invoice.status}</Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {typeof invoice.total === "number"
                              ? `$${formatCurrency(invoice.total)}`
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                    No invoices for this customer yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
              </CardHeader>
              <CardContent>
                {photosLoading ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} className="h-48 w-full" />
                    ))}
                  </div>
                ) : customerPhotos.length ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {customerPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="overflow-hidden rounded-lg border bg-card shadow-sm"
                        >
                          <button
                            type="button"
                            className="block w-full"
                            onClick={() => setSelectedPhoto(photo)}
                            aria-label={
                              photo.caption ? `View ${photo.caption}` : "View photo"
                            }
                          >
                            <img
                              src={photo.photo_data}
                              alt={photo.caption || "Customer photo"}
                              className="h-36 w-full object-cover sm:h-40"
                              loading="lazy"
                            />
                          </button>
                          <div className="space-y-2 p-3">
                            <p className="text-xs text-muted-foreground">
                              {photo.caption || "No caption"}
                            </p>
                            <p className="text-xs font-medium text-foreground">
                              Invoice{" "}
                              {photo.invoiceNumber
                                ? `#${photo.invoiceNumber}`
                                : photo.invoiceId
                                  ? `#${photo.invoiceId}`
                                  : "—"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Dialog
                      open={!!selectedPhoto}
                      onOpenChange={(open) => {
                        if (!open) setSelectedPhoto(null);
                      }}
                    >
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>
                            {selectedPhoto?.caption || "Customer photo"}
                          </DialogTitle>
                        </DialogHeader>
                        {selectedPhoto && (
                          <div className="flex justify-center">
                            <img
                              src={selectedPhoto.photo_data}
                              alt={selectedPhoto.caption || "Customer photo"}
                              className="max-h-[70vh] w-full rounded-md object-contain"
                            />
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                    No photos yet. Add photos from the Invoices page.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage your customer database</p>
        </div>
        <Button onClick={handleOpenAddDialog} data-testid="button-add-customer">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-customers"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers && filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      data-testid={`row-customer-${customer.id}`}
                      className="cursor-pointer"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.address}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenEditDialog(customer);
                            }}
                            data-testid={`button-edit-${customer.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeletingCustomer(customer);
                            }}
                            data-testid={`button-delete-${customer.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No customers found matching your search." : "No customers yet. Add your first customer to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || !!editingCustomer} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingCustomer(null);
          form.reset();
        }
      }}>
        <DialogContent
          data-testid="dialog-customer-form"
          className="max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? "Update customer information" : "Enter customer details to add them to your database"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe" data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="john@example.com" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(555) 123-4567" data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123 Main St, City, State" data-testid="input-address" />
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
                    setEditingCustomer(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                  className="min-h-11 text-base"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                  className="min-h-11 text-base"
                >
                  {editingCustomer ? "Update" : "Add"} Customer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <DialogContent
          data-testid="dialog-delete-confirm"
          className="max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingCustomer?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sticky bottom-0 bg-background pt-4 mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeletingCustomer(null)}
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
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
