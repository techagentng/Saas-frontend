import type { NextConfig } from "next";

/**
 * The backend serves uploaded service images from the same origin as the API
 * itself (`internal/config.MediaPublicBaseURL` defaults to
 * `http://{HOST}:{PORT}/media`, and production deployments point
 * `MEDIA_PUBLIC_BASE_URL` at that same API host too — see
 * `internal/media/local_storage.go`). Rather than a second, driftable env var
 * naming the media host, this derives the remote pattern(s) `next/image` needs
 * directly from `NEXT_PUBLIC_API_URL`, which the app already requires
 * (`lib/api/config.ts`). Never a wildcard hostname: only the exact origin the
 * backend actually serves images from is ever allow-listed.
 *
 * Local dev is the one place this expands: the backend's own HOST defaults to
 * `127.0.0.1` while `NEXT_PUBLIC_API_URL` here is spelled `localhost` (or vice
 * versa) — the same loopback interface, two names. So when the API host is
 * loopback, BOTH spellings are allow-listed and `dangerouslyAllowLocalIP` is
 * enabled (Next 16 otherwise blocks image optimization for private-network
 * addresses). A real deployment host gets neither.
 */
const LOOPBACK_HOSTNAMES = ["localhost", "127.0.0.1", "::1", "[::1]"];

function apiOrigin(): URL | null {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    return new URL(apiUrl);
  } catch {
    return null;
  }
}

function isLoopback(url: URL): boolean {
  return LOOPBACK_HOSTNAMES.includes(url.hostname);
}

function mediaRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const url = apiOrigin();
  if (!url) return [];

  const protocol = url.protocol.replace(":", "") as "http" | "https";
  const hostnames = isLoopback(url) ? ["localhost", "127.0.0.1"] : [url.hostname];

  return hostnames.map((hostname) => ({
    protocol,
    hostname,
    port: url.port,
    pathname: "/media/**",
  }));
}

const apiUrl = apiOrigin();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: mediaRemotePatterns(),
    dangerouslyAllowLocalIP: apiUrl ? isLoopback(apiUrl) : false,
  },
};

export default nextConfig;
