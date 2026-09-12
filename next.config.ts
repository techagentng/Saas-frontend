import type { NextConfig } from "next";

/**
 * The backend's "local" media driver serves uploaded service images from the
 * same origin as the API itself (`internal/config.MediaPublicBaseURL`
 * defaults to `http://{HOST}:{PORT}/media` — see
 * `internal/media/local_storage.go`). For that driver, this derives the
 * remote pattern(s) `next/image` needs directly from `NEXT_PUBLIC_API_URL`,
 * which the app already requires (`lib/api/config.ts`), rather than a second,
 * driftable env var naming the media host.
 *
 * Local dev is the one place this expands: the backend's own HOST defaults to
 * `127.0.0.1` while `NEXT_PUBLIC_API_URL` here is spelled `localhost` (or vice
 * versa) — the same loopback interface, two names. So when the API host is
 * loopback, BOTH spellings are allow-listed and `dangerouslyAllowLocalIP` is
 * enabled (Next 16 otherwise blocks image optimization for private-network
 * addresses). A real deployment host gets neither.
 *
 * A driver like Cloudflare R2 serves images from a wholly different origin
 * than the API (the backend's own `MEDIA_PUBLIC_BASE_URL`, e.g.
 * `https://media.iweapps.com`, unrelated to `NEXT_PUBLIC_API_URL`) — that
 * origin cannot be derived from the API URL at all, so it needs its own
 * `NEXT_PUBLIC_MEDIA_BASE_URL`, mirroring the backend's setting exactly.
 * Never a wildcard hostname: only the exact origin the backend actually
 * serves images from is ever allow-listed.
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

function mediaBaseOrigin(): URL | null {
  const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  if (!mediaUrl) return null;
  try {
    return new URL(mediaUrl);
  } catch {
    return null;
  }
}

function isLoopback(url: URL): boolean {
  return LOOPBACK_HOSTNAMES.includes(url.hostname);
}

function mediaRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

  const url = apiOrigin();
  if (url) {
    const protocol = url.protocol.replace(":", "") as "http" | "https";
    const hostnames = isLoopback(url) ? ["localhost", "127.0.0.1"] : [url.hostname];
    patterns.push(
      ...hostnames.map((hostname) => ({
        protocol,
        hostname,
        port: url.port,
        pathname: "/media/**" as const,
      }))
    );
  }

  const mediaUrl = mediaBaseOrigin();
  if (mediaUrl) {
    patterns.push({
      protocol: mediaUrl.protocol.replace(":", "") as "http" | "https",
      hostname: mediaUrl.hostname,
      port: mediaUrl.port,
      pathname: "/**",
    });
  }

  return patterns;
}

const apiUrl = apiOrigin();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: mediaRemotePatterns(),
    dangerouslyAllowLocalIP: apiUrl ? isLoopback(apiUrl) : false,
  },
};

export default nextConfig;
