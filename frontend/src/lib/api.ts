/**
 * Axios client + transparent refresh-token rotation.
 *
 * • All requests carry credentials so the httpOnly auth cookie travels.
 * • A single in-flight refresh promise prevents the "thundering-herd"
 *   problem where parallel 401s would each fire their own /auth/refresh.
 * • Auth endpoints are *not* eligible for retry — letting /login or
 *   /refresh self-recover would deadlock.
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!BASE) {
  // Surface misconfiguration at first import rather than first request.
  console.warn('[api] NEXT_PUBLIC_BACKEND_URL is not set');
}

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE ?? ''}/api`,
  withCredentials: true,
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshInFlight: Promise<unknown> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    const status = error.response?.status;
    const url = original?.url ?? '';
    const isAuthRoute = url.startsWith('/auth/');

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        if (!refreshInFlight) {
          refreshInFlight = api.post('/auth/refresh').finally(() => {
            refreshInFlight = null;
          });
        }
        await refreshInFlight;
        return api(original);
      } catch {
        // Refresh failed — fall through to surface the original 401.
      }
    }
    throw error;
  },
);
