# KrishiConnect

## 1. Project Overview
**KrishiConnect** is an integrated platform aimed at empowering farmers with real-time crop prices, market access, and localized agricultural insights. It eliminates middlemen, ensures price transparency, and directly connects farmers with buyers (APMC traders). 

## 2. Problem Statement
Farmers often face exploitation due to a lack of direct access to real-time market prices, forcing them to sell crops at lower rates to local middlemen. Additionally, registering crops and updating data via the traditional Hobli office system is slow, and internet access in rural areas can be inconsistent.

## 3. Our Solution
KrishiConnect offers a comprehensive ecosystem that bridges this gap:
- **Missed-Call SMS Service**: Farmers without smartphones or internet can give a missed call to a Twilio-powered number and instantly receive an SMS in their regional language with the latest APMC mandi prices for their registered crops.
- **Farmer Portal**: A web interface for farmers to log in via OTP, view localized prices, track their crop history, and update their current sowing data.
- **Hobli Admin Dashboard**: Enables local Hobli office admins to register farmers, update their details, and push verified farmer data directly to APMC traders.
- **Trader Portal**: APMC traders can log in to view crop availability directly from registered farmers, bypassing intermediaries.
- **Real-Time Data**: Integrates with `data.gov.in` and `Agmarknet` to fetch the latest mandi prices dynamically.

## 4. Technical Architecture
### Frontend (Client-Side)
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS & Shadcn UI
- **Language**: TypeScript
- **Features**: Responsive design, dynamic charts, multi-portal routing.

### Backend (Server-Side)
- **Framework**: FastAPI (Python)
- **Database**: MongoDB Atlas (NoSQL)
- **Messaging**: Twilio API for SMS and Webhooks
- **Background Tasks**: APScheduler for daily scheme/price refreshes

### Data Flow
1. **Admin Registration**: Hobli Admin registers a farmer's crop data into MongoDB.
2. **Trader Access**: Trader logs in and views the registered farmer data securely fetched via the FastAPI backend.
3. **SMS Trigger**: Farmer makes a missed call -> Twilio hits the FastAPI Webhook -> Backend fetches data from MongoDB & live API -> Twilio sends SMS back to the farmer.

## 5. Key Features & Portals
- **Farmer Portal**: Crop management, Price Dashboard, Government Scheme details.
- **Hobli Admin Portal**: Search, Add, Edit, and Push Farmer data.
- **Trader Portal**: Verified buyers can see exact crop yields, sowing dates, and contact farmers directly.
- **Government Schemes**: Automated scraping and listing of active PM-KISAN, PMFBY, and eNAM schemes.

## 6. Core API Endpoints
- `POST /api/farmers/send-otp` : Secure login for farmers.
- `GET /api/prices/` : Real-time Agmarknet mandi prices.
- `POST /api/sms-webhook` : Triggered by Twilio on missed calls.
- `GET /api/schemes/` : Lists current government schemes.
- `POST /api/hobli/register-farmer` : Hobli admin farmer enrollment.

## 7. Future Scope
- Integration with WhatsApp Business API for richer data sharing.
- Multilingual voice-bot for farmers with low literacy.
- AI-based crop yield prediction based on weather data.
