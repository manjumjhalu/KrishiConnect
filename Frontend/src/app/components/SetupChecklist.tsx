import { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Clock, ExternalLink } from "lucide-react";

interface Step {
  id: number;
  title: string;
  time: string;
  description: string;
  tags: { label: string; color: string }[];
  substeps: string[];
  codeBlock?: string;
}

interface Phase {
  id: number;
  title: string;
  hours: string;
  color: string;
  steps: Step[];
}

const PHASES: Phase[] = [
  {
    id: 1, title: "Setup & Credentials", hours: "0–2 hrs", color: "#10b981",
    steps: [
      {
        id: 1, title: "Create MongoDB Atlas free cluster", time: "10 min",
        description: "Go to mongodb.com/atlas → Sign up free → Create cluster → Choose M0 (free tier) → Select AWS Mumbai region → Create database user → Copy the connection string.",
        tags: [{ label: "free", color: "#10b981" }, { label: "no credit card", color: "#6366f1" }],
        substeps: ["Sign up at mongodb.com/atlas", "Click 'Create' → choose M0 free tier", "Set username + password", "Under 'Network Access' → Add IP → Allow from anywhere (0.0.0.0/0)", "Click Connect → Drivers → copy the URI"],
        codeBlock: "mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/krishiconnect",
      },
      {
        id: 2, title: "Get Twilio trial account + phone number", time: "10 min",
        description: "Go to twilio.com → Sign up free → Verify your phone number. Get a free US number from the console. This is what farmers will call.",
        tags: [{ label: "free trial credits", color: "#10b981" }, { label: "verify your number first", color: "#f59e0b" }],
        substeps: ["Sign up at twilio.com", "Verify your phone number in Twilio (trial can only SMS verified numbers)", "Get a free phone number from console", "Note: Account SID, Auth Token, Phone Number"],
        codeBlock: "Account SID:  ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nAuth Token:   your_auth_token\nPhone Number: +1XXXXXXXXXX",
      },
      {
        id: 3, title: "Get data.gov.in API key", time: "5 min",
        description: "Go to data.gov.in → Register → instant API key. This gives you access to the Agmarknet mandi price dataset — 3000+ markets across India, updated daily.",
        tags: [{ label: "free", color: "#10b981" }, { label: "instant", color: "#6366f1" }],
        substeps: ["Go to data.gov.in/user/register", "Fill name + email → verify", "Your API key appears on dashboard", "Note the key — add it to .env later"],
        codeBlock: "API key: 579b464db66ec23d318f0000  (or your own key)",
      },
      {
        id: 4, title: "Clone backend + install dependencies", time: "5 min",
        description: "Extract the backend zip we built. Install all Python packages.",
        tags: [{ label: "Python 3.11+ needed", color: "#f59e0b" }],
        substeps: ["Extract krishiconnect_backend.zip", "Open terminal in that folder", "Run pip install -r requirements.txt", "Wait ~2 min for all packages to install"],
        codeBlock: "cd krishiconnect_backend\npip install -r requirements.txt",
      },
      {
        id: 5, title: "Create .env file with your credentials", time: "3 min",
        description: "Copy .env.example to .env and fill in your real values from the steps above.",
        tags: [{ label: "never commit .env to git", color: "#ef4444" }],
        substeps: ["Copy .env.example to .env", "Paste MongoDB URI", "Paste Twilio SID, token, number", "Paste data.gov.in API key"],
        codeBlock: "cp .env.example .env\n# Then open .env and fill:\nMONGO_URI=mongodb+srv://...\nTWILIO_ACCOUNT_SID=AC...\nTWILIO_AUTH_TOKEN=...\nTWILIO_PHONE_NUMBER=+1...\nDATA_GOV_API_KEY=...",
      },
    ],
  },
  {
    id: 2, title: "Backend & SMS Pipeline", hours: "2–10 hrs", color: "#6366f1",
    steps: [
      {
        id: 6, title: "Seed demo data into MongoDB", time: "2 min",
        description: "Run seed.py once to populate the DB with 5 farmers, 10 crop prices, 5 buyers, and all government schemes. Makes the demo work immediately.",
        tags: [{ label: "run once", color: "#6366f1" }],
        substeps: ["Make sure .env is filled", "Run: python seed.py", "You should see ✅ for each collection", "Data is now in MongoDB Atlas"],
        codeBlock: "python seed.py\n# Expected output:\n# ✅ Hobli offices seeded\n# ✅ 5 farmers seeded\n# ✅ 10 crop prices seeded\n# ✅ 5 buyers seeded\n# ✅ 6 government schemes seeded",
      },
      {
        id: 7, title: "Start the FastAPI server", time: "1 min",
        description: "Launch uvicorn. The server starts on port 8000 and auto-reloads on code changes.",
        tags: [{ label: "auto-reload enabled", color: "#10b981" }],
        substeps: ["Run: uvicorn main:app --reload", "Open http://localhost:8000/docs", "You should see all API routes", "Scheduler starts fetching live prices"],
        codeBlock: "uvicorn main:app --reload\n# Visit: http://localhost:8000/docs",
      },
      {
        id: 8, title: "Test the SMS pipeline with /trigger-sms", time: "5 min",
        description: "Test the full missed-call → SMS flow without a real phone. Use the demo farmer phone number from seed.py.",
        tags: [{ label: "no phone needed", color: "#10b981" }],
        substeps: ["Server must be running", "Run the curl command below", "Check response for sms_sent: true", "If Twilio creds are set, SMS arrives on your phone"],
        codeBlock: 'curl -X POST http://localhost:8000/api/trigger-sms \\\n  -H "Content-Type: application/json" \\\n  -d \'{"phone": "9876543210"}\'',
      },
      {
        id: 9, title: "Test farmer OTP login", time: "3 min",
        description: "Verify the OTP flow works end-to-end. The seeded farmer is Rajesh Kumar on 9876543210.",
        tags: [{ label: "demo farmer", color: "#6366f1" }],
        substeps: ["POST /api/farmers/send-otp with phone 9876543210", "Check terminal logs for the OTP", "POST /api/farmers/verify-otp with that OTP", "GET /api/farmers/9876543210/profile"],
        codeBlock: 'curl -X POST http://localhost:8000/api/farmers/send-otp \\\n  -H "Content-Type: application/json" \\\n  -d \'{"phone":"9876543210"}\'\n\ncurl -X POST http://localhost:8000/api/farmers/verify-otp \\\n  -H "Content-Type: application/json" \\\n  -d \'{"phone":"9876543210","otp":"<OTP from logs>"}\'',
      },
      {
        id: 10, title: "Test Hobli Admin login", time: "2 min",
        description: "Log into the admin panel using seeded credentials. Try registering a farmer.",
        tags: [{ label: "demo creds", color: "#6366f1" }],
        substeps: ["POST /api/hobli/login with admin123 / password123", "Try GET /api/hobli/farmers?hobli_id=ramanagara_001", "Test registering a new farmer via POST /api/hobli/register-farmer"],
        codeBlock: 'curl -X POST http://localhost:8000/api/hobli/login \\\n  -H "Content-Type: application/json" \\\n  -d \'{"unique_id":"admin123","password":"password123"}\'',
      },
    ],
  },
  {
    id: 3, title: "Connect React Frontend", hours: "10–16 hrs", color: "#f59e0b",
    steps: [
      {
        id: 11, title: "Install frontend deps + start dev server", time: "3 min",
        description: "Install npm packages and start the Vite dev server. It should connect to the backend automatically.",
        tags: [{ label: "Vite + React", color: "#6366f1" }],
        substeps: ["cd Frontend", "pnpm install (or npm install)", "pnpm dev", "Open http://localhost:5173"],
        codeBlock: "cd Frontend\npnpm install\npnpm dev\n# Open http://localhost:5173",
      },
      {
        id: 12, title: "API service is already wired", time: "done",
        description: "src/app/services/api.ts is already created with all typed API functions mapped to every FastAPI route.",
        tags: [{ label: "already done ✓", color: "#10b981" }],
        substeps: ["File: src/app/services/api.ts", "Functions: sendOtp, verifyOtp, hobliLogin, registerFarmer, listFarmers, updateCrop, getPrices, getSchemes, triggerSms", "Types exported for FarmerProfile, CropEntry, CropPrice, Scheme"],
        codeBlock: "import { sendOtp, verifyOtp, hobliLogin } from '../services/api';",
      },
      {
        id: 13, title: "Wire FarmerPortal to real API", time: "30 min",
        description: "Replace mock handleSendOtp / handleVerifyOtp / handleUpdateCrop with real API calls. Profile and history load from DB.",
        tags: [{ label: "FarmerPortal.tsx", color: "#f59e0b" }],
        substeps: ["Import sendOtp, verifyOtp, getFarmerProfile, getCropHistory, updateCrop from services/api", "Replace handleSendOtp → await sendOtp(phoneNumber)", "Replace handleVerifyOtp → await verifyOtp(phoneNumber, otp)", "Load real profile on auth success", "Replace handleUpdateCrop → await updateCrop({...})"],
        codeBlock: "const handleSendOtp = async () => {\n  try {\n    await sendOtp(phoneNumber);\n    setOtpSent(true);\n    toast.success('OTP sent!');\n  } catch (e) {\n    toast.error(e.message);\n  }\n};",
      },
      {
        id: 14, title: "Wire HobliAdmin to real API", time: "30 min",
        description: "Replace mock login / add-farmer with real API calls. Farmer list loads from MongoDB.",
        tags: [{ label: "HobliAdmin.tsx", color: "#f59e0b" }],
        substeps: ["Import hobliLogin, registerFarmer, listFarmers, editFarmer from services/api", "Replace handleLogin → await hobliLogin(uniqueId, password)", "Store hobli_id from login response", "Load farmers via listFarmers(hobli_id) on login", "Replace handleAddOrUpdateFarmer → await registerFarmer({...})"],
        codeBlock: "const handleLogin = async () => {\n  try {\n    const admin = await hobliLogin(uniqueId, password);\n    setHobliId(admin.hobli_id);\n    setIsAuthenticated(true);\n    toast.success('Login successful!');\n  } catch (e) {\n    toast.error(e.message);\n  }\n};",
      },
    ],
  },
  {
    id: 4, title: "Deploy to Production", hours: "16–22 hrs", color: "#ef4444",
    steps: [
      {
        id: 15, title: "Deploy backend to Render", time: "10 min",
        description: "Push to GitHub → connect Render → set env vars → deploy. Free tier works fine for hackathon.",
        tags: [{ label: "free tier", color: "#10b981" }],
        substeps: ["Push backend folder to GitHub", "Go to render.com → New Web Service", "Connect GitHub repo → set Root Directory to backend/", "Set Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT", "Add all .env variables in Render dashboard", "Wait ~3 min for first deploy"],
        codeBlock: "# Start Command for Render:\nuvicorn main:app --host 0.0.0.0 --port $PORT",
      },
      {
        id: 16, title: "Deploy frontend to Vercel", time: "5 min",
        description: "Push frontend to GitHub → import in Vercel → set VITE_API_URL → deploy.",
        tags: [{ label: "free tier", color: "#10b981" }],
        substeps: ["Push Frontend folder to GitHub", "Go to vercel.com → New Project", "Import the repo → set Root Directory to Frontend/", "Add env var: VITE_API_URL=https://your-app.onrender.com", "Deploy — takes ~2 min"],
        codeBlock: "# Vercel env var:\nVITE_API_URL=https://krishiconnect-backend.onrender.com",
      },
      {
        id: 17, title: "Point Twilio webhook to Render URL", time: "5 min",
        description: "Tell Twilio to POST to your live backend when someone calls your number.",
        tags: [{ label: "critical for demo", color: "#ef4444" }],
        substeps: ["Go to twilio.com/console → Phone Numbers", "Click your number → Voice section", "Set 'A call comes in' → Webhook", "URL: https://your-app.onrender.com/api/sms-webhook", "Method: HTTP POST → Save"],
        codeBlock: "Webhook URL:\nhttps://krishiconnect-backend.onrender.com/api/sms-webhook",
      },
    ],
  },
  {
    id: 5, title: "Demo Prep", hours: "22–24 hrs", color: "#8b5cf6",
    steps: [
      {
        id: 18, title: "Run the 3-minute demo script", time: "practice",
        description: "The punchline is the missed-call SMS moment. Judge holds phone, you call Twilio number and drop it. SMS arrives in Kannada in ~8 seconds.",
        tags: [{ label: "the punchline", color: "#8b5cf6" }],
        substeps: [
          "0:00 — Open HobliAdmin, show farmer Rajesh Kumar registered with crop data",
          "0:45 — Open FarmerPortal, OTP login as 9876543210, show current crop + history",
          "1:30 — Say: 'A farmer in the field has no smartphone. He just misses a call.'",
          "1:45 — Call the Twilio number from judge's phone and hang up immediately",
          "1:53 — SMS arrives in Kannada: crop price, mandi, buyer contact, top scheme",
          "2:00 — Show /docs to prove it's a real backend hitting real govt APIs",
          "2:30 — Close with: '3000+ mandis, 6 languages, works on any phone, no data needed'",
        ],
        codeBlock: "# SMS arrives in ~8 seconds:\nನಮಸ್ಕಾರ ರಾಜೇಶ್! ನಿಮ್ಮ ಟೊಮ್ಯಾಟೊ ಇಂದಿನ ಬೆಲೆ:\n₹2840/ಕ್ವಿಂಟಲ್ (ರಾಮನಗರ APMC)\nಖರೀದಿದಾರ: ರಮೇಶ್ ಟ್ರೇಡರ್ಸ್ 9900123456\nಯೋಜನೆ: PM-KISAN ₹6000/ವರ್ಷ",
      },
      {
        id: 19, title: "Verify live demo works end-to-end", time: "15 min",
        description: "Do a full dry run: missed call → SMS → show admin panel → show farmer portal. Time it.",
        tags: [{ label: "dry run", color: "#8b5cf6" }],
        substeps: ["Call Twilio number from your own phone and hang up", "SMS arrives within 10 seconds?", "Log into HobliAdmin — farmers show from MongoDB", "Log into FarmerPortal — OTP arrives on real phone", "All API calls hit live Render backend"],
        codeBlock: "# Quick health check:\ncurl https://your-app.onrender.com/health\n# Expected: {\"status\": \"healthy\"}",
      },
    ],
  },
];

export default function SetupChecklist() {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [expandedPhase, setExpandedPhase] = useState<number>(1);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  const totalSteps = PHASES.reduce((acc, p) => acc + p.steps.length, 0);
  const doneCount = completedSteps.size;
  const progressPct = Math.round((doneCount / totalSteps) * 100);

  const toggleStep = (id: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const phaseComplete = (phase: Phase) =>
    phase.steps.every(s => completedSteps.has(s.id));

  const phaseProgress = (phase: Phase) =>
    phase.steps.filter(s => completedSteps.has(s.id)).length;

  const currentPhase = PHASES.find(p => !phaseComplete(p)) ?? PHASES[PHASES.length - 1];

  return (
    <div className="min-h-screen bg-[#0f1117] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="border-b border-white/10 bg-[#141721] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">KrishiConnect Setup</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {doneCount} of {totalSteps} steps done · {currentPhase.hours}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #10b981, #6366f1)" }}
              />
            </div>
            <span className="text-sm font-semibold text-emerald-400">{progressPct}%</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        {PHASES.map(phase => {
          const isOpen = expandedPhase === phase.id;
          const done = phaseProgress(phase);
          const total = phase.steps.length;
          const allDone = done === total;

          return (
            <div
              key={phase.id}
              className="rounded-xl border overflow-hidden transition-all"
              style={{ borderColor: isOpen ? phase.color + "40" : "rgba(255,255,255,0.08)" }}
            >
              {/* Phase header */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
                onClick={() => setExpandedPhase(isOpen ? 0 : phase.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: allDone ? "#10b981" : phase.color + "22", color: allDone ? "#fff" : phase.color }}
                  >
                    {allDone ? "✓" : phase.id}
                  </div>
                  <div>
                    <span className="font-semibold text-sm">{phase.title}</span>
                    <span className="text-xs text-gray-400 ml-2">· {phase.hours}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: phase.color }}>{done}/{total}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Steps */}
              {isOpen && (
                <div className="divide-y divide-white/5">
                  {phase.steps.map(step => {
                    const isDone = completedSteps.has(step.id);
                    const isStepOpen = expandedStep === step.id;

                    return (
                      <div key={step.id} className={`transition-colors ${isDone ? "bg-emerald-950/20" : "bg-transparent"}`}>
                        {/* Step row */}
                        <div className="flex items-start gap-3 px-5 py-3">
                          <button
                            onClick={() => toggleStep(step.id)}
                            className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
                          >
                            {isDone
                              ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              : <Circle className="w-5 h-5 text-gray-600" />
                            }
                          </button>
                          <div className="flex-1 min-w-0">
                            <button
                              className="flex items-center justify-between w-full text-left gap-2"
                              onClick={() => setExpandedStep(isStepOpen ? null : step.id)}
                            >
                              <span className={`text-sm font-medium ${isDone ? "line-through text-gray-500" : "text-white"}`}>
                                {step.title}
                              </span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{step.time}
                                </span>
                                {isStepOpen ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                              </div>
                            </button>

                            {/* Tags */}
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                              {step.tags.map(tag => (
                                <span
                                  key={tag.label}
                                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: tag.color + "22", color: tag.color }}
                                >
                                  {tag.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Expanded step content */}
                        {isStepOpen && (
                          <div className="px-13 pb-4 ml-8 mr-5 space-y-4">
                            <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>

                            {step.codeBlock && (
                              <div className="bg-[#0a0c12] rounded-lg p-4 border border-white/10">
                                <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap overflow-x-auto">
                                  {step.codeBlock}
                                </pre>
                              </div>
                            )}

                            <div className="space-y-2">
                              {step.substeps.map((sub, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                  <span>{sub}</span>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={() => toggleStep(step.id)}
                              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all mt-2"
                              style={{
                                background: isDone ? "rgba(255,255,255,0.05)" : phase.color + "22",
                                color: isDone ? "#9ca3af" : phase.color,
                                border: `1px solid ${isDone ? "rgba(255,255,255,0.1)" : phase.color + "44"}`,
                              }}
                            >
                              {isDone ? "✓ Marked as done — click to undo" : "✓ Mark step as done"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {doneCount === totalSteps && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-6 text-center space-y-2">
            <div className="text-4xl">🎉</div>
            <h2 className="text-xl font-bold text-emerald-400">All steps complete!</h2>
            <p className="text-gray-400 text-sm">KrishiConnect is live and ready to demo. Good luck! 🌾</p>
          </div>
        )}

        <div className="text-center text-xs text-gray-600 pb-8 pt-2">
          This is your full interactive checklist — click through all 5 phases and mark each step done as you go.
        </div>
      </div>
    </div>
  );
}
