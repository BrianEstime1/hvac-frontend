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
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { insertCustomerSchema, type Customer, type InsertCustomer } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setEditingCustomer(null);
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
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.address}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(customer)}
                            data-testid={`button-edit-${customer.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingCustomer(customer)}
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
        <DialogContent data-testid="dialog-customer-form">
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
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingCustomer(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
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
        <DialogContent data-testid="dialog-delete-confirm">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingCustomer?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCustomer(null)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
