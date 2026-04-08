import { createClient } from "jsr:@supabase/supabase-js@2";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://www.pso-aurora.com",
  "https://pso-aurora.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

const configuredAllowedOrigins = (
  Deno.env.get("AURORA_FUNCTION_ALLOWED_ORIGINS") ||
  Deno.env.get("SUPABASE_FUNCTION_ALLOWED_ORIGINS") ||
  ""
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const normalizedAllowedOrigins = new Set(
  (configuredAllowedOrigins.length > 0
    ? configuredAllowedOrigins
    : DEFAULT_ALLOWED_ORIGINS
  ).map((value) => value.replace(/\/+$/, "")),
);

const getRequestOrigin = (request: Request) =>
  (request.headers.get("Origin") || request.headers.get("origin") || "")
    .trim()
    .replace(/\/+$/, "");

const isAllowedOrigin = (origin: string) => {
  if (!origin) return true;
  return normalizedAllowedOrigins.has(origin);
};

export const getCorsHeaders = (request: Request) => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  };

  const origin = getRequestOrigin(request);
  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }

  return headers;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("AURORA_SUPABASE_SECRET_KEY") ||
  "";
const publishableKey =
  Deno.env.get("AURORA_SUPABASE_PUBLISHABLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY") ||
  serviceRoleKey;

export const getSupabaseUrl = () => supabaseUrl.replace(/\/+$/, "");

export const assertSupabaseConfig = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase function secrets are not configured.");
  }
};

export const createAdminClient = () => {
  assertSupabaseConfig();
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
};

const createCallerClient = (request: Request) => {
  assertSupabaseConfig();
  return createClient(supabaseUrl, publishableKey, {
    global: {
      headers: {
        Authorization: request.headers.get("Authorization") || "",
      },
    },
    auth: { persistSession: false },
  });
};

export const json = (
  request: Request,
  status: number,
  body: Record<string, unknown>,
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(request),
      "Content-Type": "application/json",
    },
  });

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export const getHttpStatus = (error: unknown, fallback = 500) =>
  error instanceof HttpError ? error.status : fallback;

export const assertAllowedOrigin = (request: Request) => {
  const origin = getRequestOrigin(request);
  if (!isAllowedOrigin(origin)) {
    throw new HttpError(403, "Origin not allowed.");
  }
};

export const handleCorsPreflight = (request: Request) => {
  const origin = getRequestOrigin(request);
  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed." }), {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return new Response("ok", {
    headers: getCorsHeaders(request),
  });
};

export const requireAuthenticatedUser = async (request: Request) => {
  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader) {
    throw new HttpError(401, "Missing authorization header.");
  }

  const callerClient = createCallerClient(request);
  const { data, error } = await callerClient.auth.getUser();
  if (error || !data.user) {
    throw new HttpError(
      401,
      error?.message || "Unable to verify caller session.",
    );
  }

  return data.user;
};

export const requireSuperAdmin = async (
  request: Request,
  adminClient = createAdminClient(),
) => {
  const user = await requireAuthenticatedUser(request);
  const { data: profile, error } = await adminClient
    .from("staff_users")
    .select("roles")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new HttpError(500, error.message || "Unable to load caller profile.");
  }

  const roles = Array.isArray(profile?.roles)
    ? profile.roles.map((value: unknown) => String(value))
    : [];

  if (!roles.includes("Super Admin")) {
    throw new HttpError(
      403,
      "Only Super Admin accounts can perform this action.",
    );
  }

  return user;
};
