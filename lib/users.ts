import bcrypt from "bcryptjs";

/**
 * The MVP's approved user list (section 7 of the brief: "a few approved
 * users" — no role-based access, no user-management panel). Defined in the
 * APP_USERS environment variable as a JSON array so no database write access
 * — and no Users table — is needed at all:
 *
 *   APP_USERS=[{"email":"friend@asirihealth.com","passwordHash":"$2a$10$...","name":"Friend Name"}]
 *
 * Generate a passwordHash with: node scripts/hash-password.js "the password"
 */
export interface AppUser {
  email: string;
  passwordHash: string;
  name: string;
}

function loadUsers(): AppUser[] {
  const raw = process.env.APP_USERS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export async function verifyCredentials(email: string, password: string): Promise<AppUser | null> {
  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}
