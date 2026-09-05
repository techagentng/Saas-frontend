import type { NextConfig } from "next";

/**
 * The backend serves uploaded service images from the same origin as the API
 * itself (`internal/config.MediaPublicBaseURL` defaults to
 * `http://{HOST}:{PORT}/media`, and production deployments point
 * `MEDIA_PUBLIC_BASE_URL` at that same API host too — see
 * `internal/media/local_storage.go`). Rather than a second, driftable env var
 * naming the media host, this derives the one remote pattern `next/image`
 * needs directly from `NEXT_PUBLIC_API_URL`, which the app already requires
 * (`lib/api/config.ts`). Never a wildcard hostname: only the exact origin the
 * backend actually serves images from is ever allow-listed.
 */
function mediaRemotePattern(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return [];

  try {
    const { protocol, hostname, port } = new URL(apiUrl);
    return [
      {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        port,
        pathname: "/media/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: mediaRemotePattern(),
  },
};

export default nextConfig;
