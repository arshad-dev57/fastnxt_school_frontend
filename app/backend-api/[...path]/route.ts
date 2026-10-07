import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FORWARDED_REQUEST_HEADERS = ["accept", "accept-language", "authorization", "content-type", "cookie"];

function upstreamBase(): string {
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(
    /\/+$/,
    ""
  );
}

/**
 * Bind the session cookie to whatever host the user actually opened
 * (localhost, a LAN address, or the deployed site). Drop Domain so it is not
 * stuck on the API host, and drop Secure on plain HTTP so local dev can store it.
 */
function rewriteSetCookie(cookie: string, secure: boolean): string {
  const parts = cookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  const [nameValue, ...attrs] = parts;
  const kept = attrs.filter((attr) => {
    const key = attr.split("=")[0]?.trim().toLowerCase();
    return key !== "domain" && key !== "secure" && key !== "samesite";
  });
  kept.push("SameSite=Lax");
  if (secure) kept.push("Secure");
  return [nameValue, ...kept].join("; ");
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (path.some((segment) => segment === "" || segment === "." || segment === ".." || segment.includes("\\"))) {
    return Response.json({ success: false, message: "Invalid API path.", code: "BAD_REQUEST" }, { status: 400 });
  }

  const target = `${upstreamBase()}/${path.map((segment) => encodeURIComponent(segment)).join("/")}${request.nextUrl.search}`;
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: "manual",
      cache: "no-store",
      duplex: "half",
    } as RequestInit);
  } catch {
    return Response.json(
      {
        success: false,
        message: "Cannot reach the API. Please make sure the backend is running.",
        code: "NETWORK_ERROR",
      },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower === "set-cookie" ||
      lower === "content-encoding" ||
      lower === "content-length" ||
      lower === "transfer-encoding" ||
      lower.startsWith("access-control-")
    ) {
      return;
    }
    responseHeaders.append(key, value);
  });

  const secure = request.nextUrl.protocol === "https:";
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", rewriteSetCookie(cookie, secure));
  }

  const status = upstream.status;
  const body = status === 204 || status === 205 || status === 304 ? null : upstream.body;
  return new Response(body, { status, statusText: upstream.statusText, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
