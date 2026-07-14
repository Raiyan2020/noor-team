// Production builds may use the baked-in production default; any non-production
// build throws when the value is missing instead of silently targeting production.
function resolveApiUrl(value: string | undefined, productionDefault: string, name: string): string {
  if (value) return value;
  if (import.meta.env.PROD) return productionDefault;
  throw new Error(
    `[config] ${name} is not set. Define it in your .env (e.g. ${name}=http://localhost:8000/api). ` +
      'Refusing to fall back to the production API in a non-production build.'
  );
}

export const API_BASE_URL = resolveApiUrl(import.meta.env.VITE_API_BASE_URL, 'https://maison-de-noor.com/api/v1', 'VITE_API_BASE_URL');
export const DASHBOARD_API_BASE_URL = resolveApiUrl(import.meta.env.VITE_DASHBOARD_API_BASE_URL, 'https://maison-de-noor.com/api', 'VITE_DASHBOARD_API_BASE_URL');

export const API_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  USER_PROFILE: '/user/profile',
  COUPONS: '/coupons',
};
