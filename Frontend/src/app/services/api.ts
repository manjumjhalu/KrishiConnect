/**
 * api.ts — KrishiConnect frontend API service
 * Connects all React components to the FastAPI backend.
 * Change VITE_API_URL env var to your Render.com URL when deployed.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(
  method: string,
  path: string,
  body?: object
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth / OTP ────────────────────────────────────────────────────────────────

export const sendOtp = (phone: string) =>
  request<{ message: string }>("POST", "/api/farmers/send-otp", { phone });

export const verifyOtp = async (phone: string, otp: string) => {
  const data = await request<{ success: boolean; farmer?: FarmerProfile; is_new: boolean }>(
    "POST", "/api/farmers/verify-otp", { phone, otp }
  );
  return data;
};

// ── Farmer ────────────────────────────────────────────────────────────────────

export interface CropEntry {
  crop_name: string;
  village: string;
  survey_number: string;
  surnoc: string;
  hissa_no: string;
  sowing_date: string;
  harvest_month?: string;
  harvest_date?: string;
  status?: string;
}

export interface FarmerProfile {
  name: string;
  phone: string;
  hobli_id: string;
  district: string;
  language: string;
  acres?: number;
  current_crop?: CropEntry;
  registered_at?: string;
  updated_at?: string;
  /** Present on some records (e.g. SMS / admin seed); not set by default registration. */
  pani_no?: string;
  /** Legacy / SMS snapshot price string; live APMC rows come from getPrices(). */
  price?: string;
  location_kn?: string;
  /** Legacy root crop label; prefer current_crop.crop_name. */
  crop?: string;
}

export const getFarmerProfile = (phone: string) =>
  request<FarmerProfile>("GET", `/api/farmers/${phone}/profile`);

export const getCropHistory = async (phone: string) => {
  const data = await request<{ history: CropEntry[] }>("GET", `/api/farmers/${phone}/history`);
  return data.history;
};

export const updateCrop = (data: {
  phone: string;
  crop_name: string;
  village: string;
  survey_number: string;
  surnoc: string;
  hissa_no: string;
  sowing_date: string;
  harvest_month?: string;
  language?: string;
}) => request<{ message: string }>("PUT", "/api/farmers/update-crop", data);

// ── Hobli Admin ───────────────────────────────────────────────────────────────

export interface HobliAdmin {
  hobli_id: string;
  district: string;
  staff_name: string;
  hobli_name: string;
}

export const hobliLogin = (unique_id: string, password: string) =>
  request<HobliAdmin>("POST", "/api/hobli/login", { unique_id, password });

export const registerFarmer = (data: {
  name: string;
  phone: string;
  hobli_id: string;
  district: string;
  crop_name: string;
  village: string;
  survey_number: string;
  surnoc: string;
  hissa_no: string;
  sowing_date: string;
  harvest_month?: string;
  acres?: number;
  language?: string;
}) => request<{ message: string; phone: string }>("POST", "/api/hobli/register-farmer", data);

export const editFarmer = (phone: string, data: {
  name: string;
  phone: string;
  hobli_id: string;
  district: string;
  crop_name: string;
  village: string;
  survey_number: string;
  surnoc: string;
  hissa_no: string;
  sowing_date: string;
  harvest_month?: string;
  acres?: number;
  language?: string;
}) => request<{ message: string }>("PUT", `/api/hobli/edit-farmer/${phone}`, data);

export interface FarmerListItem {
  name: string;
  phone: string;
  district: string;
  language: string;
  acres?: number;
  current_crop?: CropEntry;
  registered_at?: string;
}

export const listFarmers = async (hobli_id: string, search = "") => {
  const data = await request<{ farmers: FarmerListItem[]; count: number }>(
    "GET",
    `/api/hobli/farmers?hobli_id=${hobli_id}&search=${encodeURIComponent(search)}`
  );
  return data.farmers;
};

export const broadcastSms = (hobli_id: string, message: string) =>
  request<{ sent: number }>("POST", "/api/hobli/broadcast-sms", { hobli_id, message });

// ── Prices ────────────────────────────────────────────────────────────────────

export interface CropPrice {
  crop: string;
  state: string;
  district: string;
  mandi: string;
  price_min: number;
  price_max: number;
  price_modal: number;
  unit: string;
  fetched_at: string;
  source: string;
}

export const getPriceSummary = async () => {
  const data = await request<{ summary: CropPrice[] }>("GET", "/api/prices/summary");
  return data.summary;
};

export const getPrices = async (crop = "", district = "") => {
  const data = await request<{ prices: CropPrice[]; count: number }>(
    "GET",
    `/api/prices/?crop=${encodeURIComponent(crop)}&district=${encodeURIComponent(district)}`
  );
  return data.prices;
};

// ── Schemes ───────────────────────────────────────────────────────────────────

export interface Scheme {
  name: string;
  description: string;
  eligibility?: string;
  benefit?: string;
  portal_url?: string;
  active: boolean;
}

export const getSchemes = async (language = "en") => {
  const data = await request<{ schemes: Scheme[] }>("GET", `/api/schemes/?language=${language}`);
  return data.schemes;
};

// ── Demo: trigger SMS manually ────────────────────────────────────────────────

export const triggerSms = (phone: string) =>
  request<{ status: string; sms_sent: boolean; message?: string }>("POST", "/api/trigger-sms", { phone });
