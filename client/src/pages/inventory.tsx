import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { InventoryItem } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: items, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const filteredItems = items?.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockBadgeVariant = (quantity: number) => {
    if (quantity < 10) return "destructive";
    if (quantity < 20) return "secondary";
    return "default";
  };

  const getStockLabel = (quantity: number) => {
    if (quantity < 10) return "Low Stock";
    if (quantity < 20) return "Medium";
    return "In Stock";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground">Track parts and supplies</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-inventory"
            />
          </div>

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
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems && filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      data-testid={`row-inventory-${item.id}`}
                      className={item.quantity < 10 ? "bg-destructive/5" : ""}
                    >
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category || "—"}</TableCell>
                      <TableCell>
                        <span
                          className={item.quantity < 10 ? "font-bold text-destructive" : ""}
                          data-testid={`text-quantity-${item.id}`}
                        >
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.price ? `$${item.price.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStockBadgeVariant(item.quantity)}
                          data-testid={`badge-status-${item.id}`}
                        >
                          {getStockLabel(item.quantity)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No items found matching your search." : "No inventory items available."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
