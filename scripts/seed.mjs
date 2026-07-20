// One-time helper to create your first ADMIN account.
// Usage:
//   1. Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your shell or a .env file
//      (find both in Supabase Dashboard → Project Settings → API — the service role key
//      is secret, never expose it in the browser or commit it to git).
//   2. Run: node scripts/seed.mjs you@example.com "a-strong-password" "Your Name"
//
// This uses the Supabase Admin API to create a confirmed user and then upgrades
// their profile role to 'admin' (new sign-ups default to 'volunteer').

import { createClient } from "@supabase/supabase-js";

const [, , email, password, fullName] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/seed.mjs you@example.com "password" "Your Name"');
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoConfirm: true, persistSession: false },
});

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || email.split("@")[0], role: "admin" },
  });

  if (error) {
    console.error("Failed to create user:", error.message);
    process.exit(1);
  }

  const userId = data.user.id;

  // The on_auth_user_created trigger already inserted a profiles row using the
  // role from user_metadata, but we upgrade explicitly here in case the trigger
  // ran before this metadata was fully committed.
  const { error: profileError } = await supabase.from("profiles").update({ role: "admin" }).eq("id", userId);

  if (profileError) {
    console.error("User created, but failed to set admin role:", profileError.message);
    process.exit(1);
  }

  console.log(`✅ Admin account created for ${email}. You can now sign in at /login.`);
}

main();
