# KrishiConnect Backend

FastAPI + MongoDB Atlas + Twilio SMS + data.gov.in live prices

## Quickstart (10 minutes)

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI, Twilio credentials, data.gov.in API key
```

### 3. Seed the database (demo data)
```bash
python seed.py
```

### 4. Run the server
```bash
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

## Deploy to Render.com (free)

1. Push this folder to GitHub
2. Go to render.com → New Web Service → connect repo
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port 10000`
4. Add environment variables from `.env.example`
5. Deploy (takes ~3 min)
6. Copy the Render URL → set in Twilio Voice webhook

---

## API Endpoints

### Farmers
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/farmers/send-otp` | Send OTP to farmer's phone |
| POST | `/api/farmers/verify-otp` | Verify OTP, return profile |
| PUT  | `/api/farmers/update-crop` | Update current crop |
| GET  | `/api/farmers/{phone}/profile` | Get full farmer profile |
| GET  | `/api/farmers/{phone}/history` | Get crop history |

### Hobli Admin
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/hobli/login` | Admin login |
| POST | `/api/hobli/register-farmer` | Register new farmer |
| PUT  | `/api/hobli/edit-farmer/{phone}` | Edit farmer details |
| GET  | `/api/hobli/farmers?hobli_id=xxx` | List all farmers |
| POST | `/api/hobli/broadcast-sms` | Broadcast SMS to all farmers |

### SMS / Missed Call
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/sms-webhook` | Twilio webhook (auto-called on missed call) |
| POST | `/api/trigger-sms` | Demo: manually trigger SMS pipeline |

### Prices
| Method | URL | Description |
|--------|-----|-------------|
| GET  | `/api/prices/` | Get crop prices (filterable) |
| GET  | `/api/prices/summary` | One price per crop (dashboard ticker) |
| POST | `/api/prices/refresh` | Manually trigger price refresh |

### Schemes
| Method | URL | Description |
|--------|-----|-------------|
| GET  | `/api/schemes/` | List active govt schemes |
| POST | `/api/schemes/refresh` | Re-seed schemes |

---

## Data Sources

| Source | What we fetch | How |
|--------|--------------|-----|
| data.gov.in | Agmarknet mandi prices (3000+ markets) | REST API (free key) |
| Agmarknet.gov.in | Fallback price scrape | BeautifulSoup POST |
| pmkisan.gov.in | PM-KISAN scheme details | Static (daily refresh) |
| pmfby.gov.in | Crop insurance scheme | Static (daily refresh) |
| enam.gov.in | eNAM market listing | Static (daily refresh) |

---

## Twilio Setup for Missed Call

1. Get a Twilio number (trial is free)
2. In Twilio Console → Phone Numbers → Your number → Voice Configuration
3. Set "A call comes in" webhook to: `https://YOUR_RENDER_URL/api/sms-webhook`
4. Method: HTTP POST
5. Any Indian farmer calling this number gets a free missed-call + SMS in ~8 seconds
