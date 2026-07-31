import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function isAdmin() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("admin_profiles")
    .select("role, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (
    (data?.role === "admin" || data?.role === "super_admin") &&
    data?.status === "active"
  );
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) throw new Error("Forbidden");
  return true;
}
