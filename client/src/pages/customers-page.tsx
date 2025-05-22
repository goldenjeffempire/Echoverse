// client/src/pages/customers-page.tsx

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  lastPurchase: string;
  totalSpent: number;
  avatar?: string;
  orders: number;
}

const initialCustomers: Customer[] = [
  {
    id: 1,
    name: "Sarah Wilson",
    email: "sarah@example.com",
    phone: "+1 234 567 8901",
    status: "active",
    lastPurchase: "2024-02-15",
    totalSpent: 1249.99,
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    orders: 5
  },
  // You can add more customers here for real use
];

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers] = useState<Customer[]>(initialCustomers);

  // Memoized filtered customers by name or email, case-insensitive
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query)
    );
  }, [searchQuery, customers]);

  return (
    <DashboardLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Customers</h1>
          <Button>
            <Users className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>

        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search customers by name or email"
              autoComplete="off"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No customers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={customer.avatar} />
                            <AvatarFallback>
                              {customer.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">{customer.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{customer.orders}</TableCell>
                      <TableCell>${customer.totalSpent.toFixed(2)}</TableCell>
                      <TableCell>
                        <Link href={`/customers/${customer.id}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
