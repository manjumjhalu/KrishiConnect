import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Users, Phone, MapPin, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface TraderPortalProps {
  onBackToHome: () => void;
}

export default function TraderPortal({ onBackToHome }: TraderPortalProps) {
  const farmerContacts = [
    {
      id: 1,
      name: "Rajesh Kumar",
      phone: "9876543210",
      crop: "Wheat",
      quantity: "50 quintals",
      location: "Zone A, Hobli 1",
      harvestDate: "May 15, 2026",
    },
    {
      id: 2,
      name: "Suresh Patil",
      phone: "9876543211",
      crop: "Rice",
      quantity: "80 quintals",
      location: "Zone B, Hobli 2",
      harvestDate: "May 20, 2026",
    },
    {
      id: 3,
      name: "Vijay Singh",
      phone: "9876543212",
      crop: "Cotton",
      quantity: "30 quintals",
      location: "Zone A, Hobli 1",
      harvestDate: "June 5, 2026",
    },
    {
      id: 4,
      name: "Ramesh Reddy",
      phone: "9876543213",
      crop: "Wheat",
      quantity: "65 quintals",
      location: "Zone C, Hobli 3",
      harvestDate: "May 18, 2026",
    },
  ];

  const handleContact = (farmer: typeof farmerContacts[0]) => {
    toast.success(`Contacting ${farmer.name} at ${farmer.phone}`);
  };

  return (
    <div className="modern-bg min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/55 p-4 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 p-2.5 shadow-md shadow-orange-900/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl text-slate-900">APMC Trader Portal</h1>
          </div>
          <Button variant="outline" className="border-slate-300 bg-white/70 text-slate-700 hover:bg-white" onClick={onBackToHome}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <Card className="glass-panel depth-card rounded-3xl">
          <CardHeader>
            <CardTitle>Available Farmers & Crops</CardTitle>
            <CardDescription>
              Farmer details shared by Hobli admins based on your crop trading interests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="surface-table overflow-x-auto p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farmer Name</TableHead>
                    <TableHead>Crop</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Harvest Date</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {farmerContacts.map((farmer) => (
                    <TableRow key={farmer.id}>
                      <TableCell className="font-medium">{farmer.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{farmer.crop}</Badge>
                      </TableCell>
                      <TableCell>{farmer.quantity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-4 h-4" />
                          {farmer.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{farmer.harvestDate}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-orange-200 bg-white/85 hover:bg-orange-50"
                          onClick={() => handleContact(farmer)}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          {farmer.phone}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="glass-panel depth-card rounded-3xl">
            <CardHeader>
              <CardTitle>Total Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-orange-600">{farmerContacts.length}</p>
              <p className="text-sm text-gray-500">Active farmer contacts</p>
            </CardContent>
          </Card>

          <Card className="glass-panel depth-card rounded-3xl">
            <CardHeader>
              <CardTitle>Crops Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-orange-600">4</p>
              <p className="text-sm text-gray-500">Different crop types</p>
            </CardContent>
          </Card>

          <Card className="glass-panel depth-card rounded-3xl">
            <CardHeader>
              <CardTitle>Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-orange-600">3</p>
              <p className="text-sm text-gray-500">Hobli zones covered</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
