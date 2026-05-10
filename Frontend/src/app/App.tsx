import { useState } from "react";
import LoginPage from "./components/LoginPage";
import HobliAdmin from "./components/HobliAdmin";
import FarmerPortal from "./components/FarmerPortal";
import TraderPortal from "./components/TraderPortal";
import SetupChecklist from "./components/SetupChecklist";
import { Toaster } from "./components/ui/sonner";

type Role = 'admin' | 'farmer' | 'trader' | 'checklist' | null;

export default function App() {
  const [currentRole, setCurrentRole] = useState<Role>(null);

  const handleLogout = () => {
    setCurrentRole(null);
  };

  return (
    <>
      {currentRole === null && (
        <div className="relative">
          <LoginPage onSelectRole={setCurrentRole} />
          <button
            onClick={() => setCurrentRole('checklist')}
            className="fixed bottom-6 right-6 z-50 rounded-full border border-white/50 bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-[0_20px_40px_-20px_rgba(5,150,105,0.9)] transition-all hover:-translate-y-0.5 hover:from-emerald-500 hover:to-teal-600"
          >
            📋 Setup Checklist
          </button>
        </div>
      )}
      {currentRole === 'admin' && (
        <HobliAdmin onLogout={handleLogout} onBackToHome={() => setCurrentRole(null)} />
      )}
      {currentRole === 'farmer' && (
        <FarmerPortal onLogout={handleLogout} onBackToHome={() => setCurrentRole(null)} />
      )}
      {currentRole === 'trader' && <TraderPortal onBackToHome={() => setCurrentRole(null)} />}
      {currentRole === 'checklist' && (
        <div className="relative">
          <SetupChecklist />
          <button
            onClick={handleLogout}
            className="fixed right-6 top-4 z-50 rounded-lg border border-white/30 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/45"
          >
            ← Back to App
          </button>
        </div>
      )}
      <Toaster />
    </>
  );
}