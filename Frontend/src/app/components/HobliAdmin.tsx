import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Building2, Send, LogOut, UserPlus, Edit, Search, ArrowLeft } from "lucide-react";
import { LoginVideoBackdrop } from "./LoginVideoBackdrop";
import { toast } from "sonner";
import { hobliLogin, registerFarmer, listFarmers, editFarmer } from "../services/api";
import type { FarmerListItem, HobliAdmin as HobliAdminInfo } from "../services/api";

interface HobliAdminProps {
  onLogout: () => void;
  onBackToHome: () => void;
}

interface Farmer {
  id: number;
  name: string;
  phone: string;
  crop: string;
  village: string;
  surveyNumber: string;
  surnoc: string;
  hissaNo: string;
  sowingDate: string;
}

export default function HobliAdmin({ onLogout, onBackToHome }: HobliAdminProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [uniqueId, setUniqueId] = useState("");
  const [password, setPassword] = useState("");
  const [adminInfo, setAdminInfo] = useState<HobliAdminInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const [farmerName, setFarmerName] = useState("");
  const [cropName, setCropName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [village, setVillage] = useState("");
  const [surveyNumber, setSurveyNumber] = useState("");
  const [surnoc, setSurnoc] = useState("");
  const [hissaNo, setHissaNo] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [farmers, setFarmers] = useState<FarmerListItem[]>([]);

  useEffect(() => {
    if (isAuthenticated && adminInfo?.hobli_id) {
      listFarmers(adminInfo.hobli_id).then(setFarmers).catch(() => {});
    }
  }, [isAuthenticated, adminInfo]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const info = await hobliLogin(uniqueId, password);
      setAdminInfo(info);
      setIsAuthenticated(true);
      toast.success("Login successful!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Invalid credentials");
    } finally { setLoading(false); }
  };

  const handleAddOrUpdateFarmer = async () => {
    if (!farmerName || !cropName || !phoneNumber || !village || !surveyNumber || !surnoc || !hissaNo || !sowingDate) {
      toast.error("Please fill all fields"); return;
    }
    setLoading(true);
    try {
      if (editingId !== null) {
        await editFarmer(phoneNumber, {
          name: farmerName,
          phone: phoneNumber,
          hobli_id: adminInfo!.hobli_id,
          district: adminInfo!.district,
          crop_name: cropName,
          village,
          survey_number: surveyNumber,
          surnoc,
          hissa_no: hissaNo,
          sowing_date: sowingDate,
        });
        toast.success("Farmer details updated successfully");
        setEditingId(null);
      } else {
        await registerFarmer({
          name: farmerName, phone: phoneNumber, hobli_id: adminInfo!.hobli_id,
          district: adminInfo!.district, crop_name: cropName, village,
          survey_number: surveyNumber, surnoc, hissa_no: hissaNo, sowing_date: sowingDate,
        });
        toast.success("Farmer added successfully");
      }
      const updated = await listFarmers(adminInfo!.hobli_id);
      setFarmers(updated);
      setFarmerName(""); setCropName(""); setPhoneNumber(""); setVillage("");
      setSurveyNumber(""); setSurnoc(""); setHissaNo(""); setSowingDate("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Operation failed");
    } finally { setLoading(false); }
  };

  const handleEditFarmer = (farmer: FarmerListItem) => {
    setEditingId(1); // flag edit mode
    setFarmerName(farmer.name);
    setCropName(farmer.current_crop?.crop_name ?? "");
    setPhoneNumber(farmer.phone);
    setVillage(farmer.current_crop?.village ?? "");
    setSurveyNumber(farmer.current_crop?.survey_number ?? "");
    setSurnoc(farmer.current_crop?.surnoc ?? "");
    setHissaNo(farmer.current_crop?.hissa_no ?? "");
    setSowingDate(farmer.current_crop?.sowing_date ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFarmerName("");
    setCropName("");
    setPhoneNumber("");
    setVillage("");
    setSurveyNumber("");
    setSurnoc("");
    setHissaNo("");
    setSowingDate("");
  };

  const filteredFarmers = Array.isArray(farmers) ? farmers.filter(
    (farmer) =>
      farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmer.phone.includes(searchQuery)
  ) : [];

  const handleSendToTrader = (farmer: FarmerListItem) => {
    toast.success(`Farmer ${farmer.name} details sent to APMC traders`);
  };

  if (!isAuthenticated) {
    return (
      <LoginVideoBackdrop>
        <Button
          type="button"
          variant="outline"
          onClick={onBackToHome}
          className="fixed left-4 top-4 z-30 border-white/50 bg-white/15 text-white shadow-lg backdrop-blur-md hover:bg-white/25"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="mx-auto w-full max-w-md">
          <Card className="glass-panel-strong depth-card w-full rounded-3xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_22px_40px_-16px_rgba(59,130,246,0.8)]">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-slate-900">Hobli Admin Login</CardTitle>
              <CardDescription className="text-slate-600">Enter your credentials to access the admin dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="uniqueId">Unique ID</Label>
                <Input
                  id="uniqueId"
                  placeholder="Enter your unique ID"
                  value={uniqueId}
                  onChange={(e) => setUniqueId(e.target.value)}
                  className="input-modern"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-modern"
                />
              </div>
              <Button onClick={handleLogin} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg shadow-blue-900/25">
                Login
              </Button>
              <p className="text-xs text-center text-gray-500">
                Demo: ID: admin123, Password: password123
              </p>
            </CardContent>
          </Card>
        </div>
      </LoginVideoBackdrop>
    );
  }

  return (
    <div className="modern-bg min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/55 p-4 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-md shadow-blue-900/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl text-slate-900">{adminInfo?.hobli_name || "Hobli Admin Dashboard"}</h1>
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white border-none shadow-md shadow-red-900/25" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <Card className="glass-panel depth-card rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Farmer
            </CardTitle>
            <CardDescription>Search for a specific farmer by name or phone number</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 input-modern"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel depth-card rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingId ? <Edit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {editingId ? "Update Farmer Details" : "Add New Farmer"}
            </CardTitle>
            <CardDescription>
              {editingId ? "Update farmer information" : "Enter farmer details to register"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="farmerName">Farmer Name</Label>
                <Input
                  id="farmerName"
                  placeholder="Enter farmer name"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  className="input-modern"
                />
              </div>
              <div>
                <Label htmlFor="cropName">Crop Name</Label>
                <Input
                  id="cropName"
                  placeholder="Enter crop name"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="input-modern"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Enter 10-digit number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="input-modern"
                />
              </div>
              <div>
                <Label htmlFor="village">Village</Label>
                <Input
                  id="village"
                  placeholder="Enter village name"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="input-modern"
                />
              </div>
              <div>
                <Label htmlFor="surveyNumber">Survey Number</Label>
                <Input
                  id="surveyNumber"
                  placeholder="Enter survey number"
                  value={surveyNumber}
                  onChange={(e) => setSurveyNumber(e.target.value)}
                  className="input-modern"
                />
              </div>
              <div>
                <Label htmlFor="surnoc">Surnoc</Label>
                <Input
                  id="surnoc"
                  placeholder="Enter surnoc"
                  value={surnoc}
                  onChange={(e) => setSurnoc(e.target.value)}
                  className="input-modern"
                />
              </div>
              <div>
                <Label htmlFor="hissaNo">Hissa No</Label>
                <Input
                  id="hissaNo"
                  placeholder="Enter hissa number"
                  value={hissaNo}
                  onChange={(e) => setHissaNo(e.target.value)}
                  className="input-modern"
                />
              </div>
              <div>
                <Label htmlFor="sowingDate">Date of Sowing</Label>
                <Input
                  id="sowingDate"
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="input-modern"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddOrUpdateFarmer} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg shadow-blue-900/25">
                {editingId ? "Update Farmer" : "Add Farmer"}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel depth-card rounded-3xl">
          <CardHeader>
            <CardTitle>Registered Farmers</CardTitle>
            <CardDescription>
              View, update, or send farmer details to APMC traders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="surface-table overflow-x-auto p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Crop</TableHead>
                    <TableHead>Village</TableHead>
                    <TableHead>Survey No</TableHead>
                    <TableHead>Surnoc</TableHead>
                    <TableHead>Hissa No</TableHead>
                    <TableHead>Sowing Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFarmers.length > 0 ? (
                    filteredFarmers.map((farmer, i) => (
                      <TableRow key={i}>
                        <TableCell>{farmer.name}</TableCell>
                        <TableCell>{farmer.phone}</TableCell>
                        <TableCell>{farmer.current_crop?.crop_name ?? "—"}</TableCell>
                        <TableCell>{farmer.current_crop?.village ?? "—"}</TableCell>
                        <TableCell>{farmer.current_crop?.survey_number ?? "—"}</TableCell>
                        <TableCell>{farmer.current_crop?.surnoc ?? "—"}</TableCell>
                        <TableCell>{farmer.current_crop?.hissa_no ?? "—"}</TableCell>
                        <TableCell>
                          {farmer.current_crop?.sowing_date
                            ? new Date(farmer.current_crop.sowing_date).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditFarmer(farmer)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Update
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendToTrader(farmer)}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Send
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-gray-500">
                        No farmers found matching your search
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
