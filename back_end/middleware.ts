import { verifyToken } from "@/app/lib/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const allowedOrigins = [
  "http://develop.i-keeper.synology.me",
  "http://i-keeper.synology.me",
  "http://front_end:17076",
  "http://localhost:17076",
];

const publicPrefixes = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/send-verification-code",
  "/api/auth/verify-code",
  "/api/files",
];

export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  const isAllowedOrigin = origin === "" || allowedOrigins.includes(origin);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin || allowedOrigins[0],
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  if (publicPrefixes.some((p) => (pathname.startsWith(p) && !pathname.endsWith("upload") && request.method.toString() !== "DELETE")) || 
  (pathname.startsWith("/api/posts") && (search.startsWith("?categoryId=1") || search.startsWith("?category=notice"))) || 
  (pathname.startsWith("/api/posts/") && request.method.toString() === "GET") ||
  (pathname.startsWith("/api/events") && request.method.toString() === "GET") ||
  (pathname.startsWith("/api/books") && request.method.toString() === "GET") ||
  (pathname.startsWith("/api/fees") && request.method.toString() === "GET")) {
    console.log("Middleware allowing public API request:", pathname, " ", request.method);
    const res = NextResponse.next();
    if (isAllowedOrigin) {
      res.headers.set(
        "Access-Control-Allow-Origin",
        origin || allowedOrigins[0]
      );
      res.headers.set("Access-Control-Allow-Credentials", "true");
      res.headers.set("Access-Control-Allow--Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    }
    return res;
  }

  if (pathname.startsWith("/api/")) {
    console.log("Middleware checking auth for API request:", pathname);
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: `Authentication required ${token}` },
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Origin": origin || allowedOrigins[0],
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow--Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          },
        }
      );
    }

    try {
      const payload = await verifyToken(token);

      const newHeaders = new Headers(request.headers);
      newHeaders.set("x-user-id", payload.userId.toString());
      newHeaders.set("x-user-role", payload.roleId.toString());

      const res = NextResponse.next({
        request: { headers: newHeaders },
      });

      if (isAllowedOrigin) {
        res.headers.set(
          "Access-Control-Allow-Origin",
          origin || allowedOrigins[0]
        );
        res.headers.set("Access-Control-Allow-Credentials", "true");
        res.headers.set("Access-Control-Allow--Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
      }

      return res;
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
  }

  const res = NextResponse.next();
  if (isAllowedOrigin) {
    res.headers.set("Access-Control-Allow-Origin", origin || allowedOrigins[0]);
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
