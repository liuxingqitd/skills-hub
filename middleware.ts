import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const WRITE_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

function isLocalHost(host: string): boolean {
  return (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]")
  );
}

/** Base response with security headers applied. */
const SECURE_RESPONSE = (() => {
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
})();

export function middleware(request: NextRequest) {
  const { method, nextUrl } = request;

  if (!nextUrl.pathname.startsWith("/api")) {
    return SECURE_RESPONSE;
  }
  if (!WRITE_METHODS.has(method)) {
    return SECURE_RESPONSE;
  }

  const host = request.headers.get("host") ?? "";

  if (!isLocalHost(host)) {
    return new NextResponse(
      JSON.stringify({ error: "Forbidden: write endpoints are only accessible from localhost" }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "no-referrer",
        },
      }
    );
  }

  return SECURE_RESPONSE;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
