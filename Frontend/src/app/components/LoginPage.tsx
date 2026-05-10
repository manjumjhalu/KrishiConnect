import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Sprout, Users, Building2 } from "lucide-react";
import { LoginVideoBackdrop } from "./LoginVideoBackdrop";

interface LoginPageProps {
  onSelectRole: (role: 'admin' | 'farmer' | 'trader') => void;
}

export default function LoginPage({ onSelectRole }: LoginPageProps) {
  return (
    <LoginVideoBackdrop>
      <div className="mx-auto w-full max-w-5xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-[0_18px_45px_-16px_rgba(16,185,129,0.9)] border border-white/35">
              <Sprout className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl text-white font-semibold drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]">KrishiConnect</h1>
          </div>
          <p className="text-lg text-white/95 drop-shadow-lg max-w-2xl mx-auto">
            Empowering farmers with real-time crop prices and market access
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 px-4 [perspective:1200px]">
          <Card className="glass-panel depth-card cursor-pointer rounded-3xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_20px_40px_-18px_rgba(59,130,246,0.95)]">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Hobli Admin</CardTitle>
              <CardDescription className="text-white/80">Manage farmers and crop data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg shadow-blue-900/30"
                onClick={() => onSelectRole('admin')}
              >
                Login as Admin
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel depth-card cursor-pointer rounded-3xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-[0_20px_40px_-18px_rgba(16,185,129,0.95)]">
                <Sprout className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Farmer Portal</CardTitle>
              <CardDescription className="text-white/80">Check prices and update crops</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-lg shadow-emerald-900/30"
                onClick={() => onSelectRole('farmer')}
              >
                Login as Farmer
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel depth-card cursor-pointer rounded-3xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-[0_20px_40px_-18px_rgba(249,115,22,0.95)]">
                <Users className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">APMC Trader</CardTitle>
              <CardDescription className="text-white/80">View farmer crop details</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white shadow-lg shadow-orange-900/30"
                onClick={() => onSelectRole('trader')}
              >
                Login as Trader
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/90 drop-shadow-lg">
            Eliminating middlemen • Ensuring price transparency • Connecting farmers to buyers
          </p>
        </div>
      </div>
    </LoginVideoBackdrop>
  );
}
