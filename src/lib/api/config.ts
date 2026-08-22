/** Backend API origin, e.g. `http://localhost:8000/api`. No trailing slash. */
export function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local and point it at the backend API."
    );
  }

  return baseUrl.replace(/\/$/, "");
}
