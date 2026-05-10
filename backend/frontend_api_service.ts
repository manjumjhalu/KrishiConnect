/**
 * api.ts — KrishiConnect frontend API service
 * Place this at: src/app/services/api.ts
 *
 * Connects all React components to the FastAPI backend.
 * Change BASE_URL to your Render.com URL when deployed.
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
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth / OTP ────────────────────────────────────────────────────────────────

export const sendOtp = (phone: string) =>
  request("POST", "/api/farmers/send-otp", { phone });

export const verifyOtp = (phone: string, otp: string) =>
  request("POST", "/api/farmers/verify-otp", { phone, otp });

// ── Farmer ────────────────────────────────────────────────────────────────────

export const getFarmerProfile = (phone: string) =>
  request("GET", `/api/farmers/${phone}/profile`);

export const getCropHistory = (phone: string) =>
  request("GET", `/api/farmers/${phone}/history`);

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
}) => request("PUT", "/api/farmers/update-crop", data);

// ── Hobli Admin ───────────────────────────────────────────────────────────────

export const hobliLogin = (unique_id: string, password: string) =>
  request("POST", "/api/hobli/login", { unique_id, password });

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
}) => request("POST", "/api/hobli/register-farmer", data);

export const editFarmer = (phone: string, data: object) =>
  request("PUT", `/api/hobli/edit-farmer/${phone}`, data);

export const listFarmers = (hobli_id: string, search = "") =>
  request(
    "GET",
    `/api/hobli/farmers?hobli_id=${hobli_id}&search=${encodeURIComponent(search)}`
  );

// ── Prices ────────────────────────────────────────────────────────────────────

export const getPriceSummary = () =>
  request("GET", "/api/prices/summary");

export const getPrices = (crop = "", district = "") =>
  request(
    "GET",
    `/api/prices/?crop=${encodeURIComponent(crop)}&district=${encodeURIComponent(district)}`
  );

// ── Schemes ───────────────────────────────────────────────────────────────────

export const getSchemes = (language = "en") =>
  request("GET", `/api/schemes/?language=${language}`);

// ── Demo: trigger SMS manually ────────────────────────────────────────────────

export const triggerSms = (phone: string) =>
  request("POST", "/api/trigger-sms", { phone });
