import axios from "axios";

function normalizeBackendBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
}

const backendBaseUrl = normalizeBackendBaseUrl(
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000"
);

export const api = axios.create({
  baseURL: backendBaseUrl
});
