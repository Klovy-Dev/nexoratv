import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "nexoratv_session";
const PROTECTED = ["/profil", "/admin"];

/**
 * Chemins toujours accessibles pendant le mode maintenance : la connexion
 * (pour que l'admin puisse se connecter), la page de maintenance elle-même,
 * et les routes techniques utilisées par les boîtiers/apps déjà installées
 * chez les clients (mise à jour de l'appli, playlists IPTV, webhooks, cron).
 */
const MAINTENANCE_ALLOW = [
  "/connexion",
  "/maintenance",
  "/api",
  "/apk",
  "/latest.apk",
  "/tv.apk",
];

async function currentRole(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !process.env.AUTH_SECRET) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.AUTH_SECRET),
    );
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = await currentRole(req);

  /* ---------- Mode maintenance (site fermé sauf admin) ---------- */
  if (process.env.MAINTENANCE_MODE === "true" && role !== "admin") {
    const allowed = MAINTENANCE_ALLOW.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    );
    if (!allowed) {
      const url = req.nextUrl.clone();
      url.pathname = "/maintenance";
      url.search = "";
      return NextResponse.rewrite(url);
    }
  }

  /* ---------- Zones protégées (auth) ---------- */
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  if (!role) {
    const dest = pathname + req.nextUrl.search;
    const url = req.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    url.searchParams.set("next", dest);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
