import argon2 from "argon2";
import { supabaseRequest } from "../config/supabase.js";
import { parseManualUsers } from "../utils/session.js";

export async function findDatabaseUser(field, value) {
  const result = await supabaseRequest("GET", `/rest/v1/kb_users?select=*&${field}=eq.${encodeURIComponent(value)}&limit=1`);
  if (!result.ok) return null;
  return result.data?.[0] || null;
}

export async function authenticateDatabaseUser(identity, password) {
  const user = await findDatabaseUser("username", identity.toLowerCase());
  if (!user?.is_active || !password) return false;
  try {
    if (!(await argon2.verify(user.password_hash, password))) return false;
    return { id: user.id, provider: "database", email: user.username, name: user.full_name, role: user.role, version: user.session_version };
  } catch {
    return false;
  }
}

export async function validateDatabaseSession(session) {
  if (session?.provider !== "database") return session;
  const user = await findDatabaseUser("id", session.sub);
  if (!user?.is_active || user.session_version !== session.v) return null;
  if (parseManualUsers(process.env.MANUAL_USERS || "").some((entry) => entry.username.toLowerCase() === user.username)) return null;
  return { ...session, e: user.username, n: user.full_name, r: user.role };
}

export async function hashPassword(password) {
  return argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 });
}
