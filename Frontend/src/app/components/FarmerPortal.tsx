import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Sprout, LogOut, Phone, Edit, History, Bell, ArrowLeft } from "lucide-react";
import { LoginVideoBackdrop } from "./LoginVideoBackdrop";
import { toast } from "sonner";
import { sendOtp, verifyOtp, getFarmerProfile, getCropHistory, updateCrop, getSchemes, getPrices } from "../services/api";
import type { FarmerProfile, CropEntry, Scheme, CropPrice } from "../services/api";

interface FarmerPortalProps {
  onLogout: () => void;
  onBackToHome: () => void;
}

interface CropHistory {
  id: number;
  cropName: string;
  village: string;
  surveyNumber: string;
  surnoc: string;
  hissaNo: string;
  sowingDate: string;
  harvestDate: string;
  status: "Harvested" | "Growing";
}

export default function FarmerPortal({ onLogout, onBackToHome }: FarmerPortalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newCropName, setNewCropName] = useState("");
  const [newVillage, setNewVillage] = useState("");
  const [newSurveyNumber, setNewSurveyNumber] = useState("");
  const [newSurnoc, setNewSurnoc] = useState("");
  const [newHissaNo, setNewHissaNo] = useState("");
  const [newSowingDate, setNewSowingDate] = useState("");

  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [cropHistory, setCropHistory] = useState<CropEntry[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [prices, setPrices] = useState<CropPrice[]>([]);

  useEffect(() => {
    if (isAuthenticated && phoneNumber) {
      getFarmerProfile(phoneNumber).then(setProfile).catch(() => {});
      getCropHistory(phoneNumber).then(setCropHistory).catch(() => {});
      getSchemes("en").then(setSchemes).catch(() => {});
    }
  }, [isAuthenticated, phoneNumber]);

  useEffect(() => {
    if (isAuthenticated && profile?.current_crop?.crop_name) {
      getPrices(profile.current_crop.crop_name, profile.district).then(setPrices).catch(() => {});
    }
  }, [isAuthenticated, profile]);

  const currentCrop = profile?.current_crop;

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) { toast.error("Please enter a valid 10-digit phone number"); return; }
    setLoading(true);
    try {
      await sendOtp(phoneNumber);
      setOtpSent(true);
      toast.success("OTP sent to your phone number");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send OTP");
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await verifyOtp(phoneNumber, otp);
      setIsAuthenticated(true);
      toast.success("Login successful!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Invalid OTP");
    } finally { setLoading(false); }
  };

  const handleUpdateCrop = async () => {
    if (!newCropName || !newVillage || !newSurveyNumber || !newSurnoc || !newHissaNo || !newSowingDate) {
      toast.error("Please fill all fields"); return;
    }
    setLoading(true);
    try {
      await updateCrop({ phone: phoneNumber, crop_name: newCropName, village: newVillage,
        survey_number: newSurveyNumber, surnoc: newSurnoc, hissa_no: newHissaNo, sowing_date: newSowingDate });
      toast.success("Crop updated successfully!");
      const updated = await getFarmerProfile(phoneNumber);
      setProfile(updated);
      setNewCropName(""); setNewVillage(""); setNewSurveyNumber("");
      setNewSurnoc(""); setNewHissaNo(""); setNewSowingDate("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update crop");
    } finally { setLoading(false); }
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
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-[0_22px_40px_-16px_rgba(16,185,129,0.8)]">
                <Sprout className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-slate-900">Farmer Login</CardTitle>
              <CardDescription className="text-slate-600">Enter your phone number to receive OTP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={otpSent}
                  className="input-modern"
                />
              </div>
              {!otpSent ? (
                <Button onClick={handleSendOtp} className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-lg shadow-emerald-900/25">
                  <Phone className="w-4 h-4 mr-2" />
                  Send OTP
                </Button>
              ) : (
                <>
                  <div>
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="input-modern"
                    />
                  </div>
                  <Button onClick={handleVerifyOtp} className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-lg shadow-emerald-900/25">
                    Verify OTP
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className="w-full"
                  >
                    Change Phone Number
                  </Button>
                </>
              )}
              <p className="text-xs text-center text-gray-500">Enter OTP received on your phone</p>
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
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 shadow-md shadow-emerald-900/30">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl text-slate-900">Farmer Dashboard</h1>
          </div>
          <Button variant="outline" className="border-slate-300 bg-white/70 text-slate-700 hover:bg-white" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <Card className="glass-panel depth-card rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-green-600" />
              Current Crop
            </CardTitle>
            <CardDescription>Your currently growing crop details</CardDescription>
          </CardHeader>
          <CardContent>
            {currentCrop ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl border border-emerald-200/70 bg-emerald-50/70">
              <div>
                <p className="text-sm text-gray-600">Crop Name</p>
                <p className="font-semibold">{currentCrop.crop_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Village</p>
                <p className="font-semibold">{currentCrop.village}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Survey Number</p>
                <p className="font-semibold">{currentCrop.survey_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Surnoc</p>
                <p className="font-semibold">{currentCrop.surnoc}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hissa No</p>
                <p className="font-semibold">{currentCrop.hissa_no}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sowing Date</p>
                <p className="font-semibold">{new Date(currentCrop.sowing_date).toLocaleDateString()}</p>
              </div>
            </div>
            ) : <p className="text-gray-400 text-sm">No crop registered yet.</p>}
          </CardContent>
        </Card>

        <Card className="glass-panel depth-card rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Update Crop
            </CardTitle>
            <CardDescription>Add or update your current crop information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newCropName">Crop Name</Label>
                <Input
                  id="newCropName"
                  placeholder="Enter crop name"
                  value={newCropName}
                  onChange={(e) => setNewCropName(e.target.value)}
                  className="input-modern"
                />
              </div>
              <div>
                <Label htmlFor="newVillage">Village</Label>
                <Input
                  id="newVillage"
                  placeholder="Enter village name"
                  value={newVillage}
                  onChange={(e) => setNewVillage(e.target.value)}
                  className="input-modern"
                />
              </div>
              <div>
                <Label htmlFor="newSurveyNumber">Survey Number</Label>
                <Input
                  id="newSurveyNumber"
                  placeholder="Enter survey number"
                  value={newSurveyNumber}
                  onChange={(e) => setNewSurveyNumber(e.target.value)}
                  className="input-modern"
                />
              </div>
              <div>
                <Label htmlFor="newSurnoc">Surnoc</Label>
                <Input
                  id="newSurnoc"
                  placeholder="Enter surnoc"
                  value={newSurnoc}
                  onChange={(e) => setNewSurnoc(e.target.value)}
                  className="input-modern"
                />
              </div>
              <div>
                <Label htmlFor="newHissaNo">Hissa No</Label>
                <Input
                  id="newHissaNo"
                  placeholder="Enter hissa number"
                  value={newHissaNo}
                  onChange={(e) => setNewHissaNo(e.target.value)}
                  className="input-modern"
                />
              </div>
              <div>
                <Label htmlFor="newSowingDate">Sowing Date</Label>
                <Input
                  id="newSowingDate"
                  type="date"
                  value={newSowingDate}
                  onChange={(e) => setNewSowingDate(e.target.value)}
                  className="input-modern"
                />
              </div>
            </div>
            <Button onClick={handleUpdateCrop} className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg shadow-blue-900/25">
              Update Crop
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-panel depth-card rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Crop History
            </CardTitle>
            <CardDescription>Details of all your previous crops</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="surface-table overflow-x-auto p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crop Name</TableHead>
                    <TableHead>Village</TableHead>
                    <TableHead>Survey No</TableHead>
                    <TableHead>Surnoc</TableHead>
                    <TableHead>Hissa No</TableHead>
                    <TableHead>Sowing Date</TableHead>
                    <TableHead>Harvest Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cropHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-400">No history yet.</TableCell>
                    </TableRow>
                  ) : cropHistory.map((crop, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{crop.crop_name}</TableCell>
                      <TableCell>{crop.village}</TableCell>
                      <TableCell>{crop.survey_number}</TableCell>
                      <TableCell>{crop.surnoc}</TableCell>
                      <TableCell>{crop.hissa_no}</TableCell>
                      <TableCell>{new Date(crop.sowing_date).toLocaleDateString()}</TableCell>
                      <TableCell>{crop.harvest_date ? new Date(crop.harvest_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={crop.status === "Harvested" ? "default" : "secondary"}>
                          {crop.status ?? "Growing"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel depth-card rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Government Schemes
            </CardTitle>
            <CardDescription>Current and ongoing schemes for farmers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schemes.length === 0 ? (
                <p className="text-gray-400 text-sm">Loading schemes...</p>
              ) : schemes.map((scheme, index) => (
                <div key={index} className="rounded-xl border border-slate-200/70 bg-white/75 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{scheme.name}</h3>
                    <Badge className="bg-green-600">{scheme.active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="text-gray-700 mb-2">{scheme.description}</p>
                  {scheme.benefit && <p className="text-sm text-gray-600"><strong>Benefit:</strong> {scheme.benefit}</p>}
                  {scheme.portal_url && (
                    <a href={scheme.portal_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">Apply online</a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {profile && (
          <Card className="glass-panel depth-card rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-green-600" />
                Market Prices for {currentCrop?.crop_name || profile.crop || "Crop"}
              </CardTitle>
              <CardDescription>
                Current APMC prices for your active crop. When live data is not available, a reference row for Hasana is
                shown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="surface-table overflow-x-auto p-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Crop</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Language</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!currentCrop?.crop_name && !profile.crop ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-400">
                          Add a crop to see market prices.
                        </TableCell>
                      </TableRow>
                    ) : prices.length > 0 ? (
                      prices.map((p, i) => (
                        <TableRow key={`${p.mandi}-${p.fetched_at}-${i}`}>
                          <TableCell className="font-medium">{p.crop}</TableCell>
                          <TableCell>
                            {[p.mandi, p.district].filter(Boolean).join(" · ") || "Hasana"}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ₹{p.price_modal.toLocaleString("en-IN")} / {p.unit}
                          </TableCell>
                          <TableCell>{profile.language || "—"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="font-medium">
                          {currentCrop?.crop_name || profile.crop || "—"}
                        </TableCell>
                        <TableCell>Hasana</TableCell>
                        <TableCell className="font-semibold text-green-600">₹2100</TableCell>
                        <TableCell>{profile.language || "—"}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {!!currentCrop?.crop_name && prices.length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  No APMC price rows matched &quot;{currentCrop.crop_name}&quot; in {profile.district} yet. Showing
                  reference price for Hasana until live data is available.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
