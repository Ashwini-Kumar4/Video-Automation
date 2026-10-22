import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { appMiddlewareArcjet } from "@/lib/arcjet";
import { NextResponse } from "next/server";

// Only authenticated users can access the dashboard route
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Allow Inngest webhook calls to bypass Arcjet bot detection
  if (!req.nextUrl.pathname.startsWith("/api/inngest")) {
    try {
      const decision = await appMiddlewareArcjet.protect(req);
      if (decision.isDenied()) {
        if (req.nextUrl.pathname.startsWith("/api")) {
          return NextResponse.json(
            { error: "Access Denied: Blocked by Arcjet Security Policy" },
            { status: 403 }
          );
        }
        return new NextResponse("Access Denied: Blocked by Arcjet Security Policy", {
          status: 403,
        });
      }
    } catch (e) {
      // In development or if key not configured, continue gracefully
      console.warn("[Middleware:Arcjet] Notice:", e);
    }
  }

  if (isProtectedRoute(req)) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
