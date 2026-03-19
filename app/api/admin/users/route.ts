/**
 * app/api/admin/users/route.ts
 * ─────────────────────────────────────────────────────────────────
 * Admin-only user management API. Uses service_role key directly.
 * NEVER import createClient from @/lib/supabase/server here —
 * we need the admin Supabase client with service_role key.
 *
 * GET     → list all auth users
 * DELETE  ?id=xxx  → remove user by ID
 *
 * Used by: components/Settings/UserManager.tsx
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(): Promise<NextResponse> {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin.auth.admin.listUsers();

    if (error) {
      console.error('[Admin Users GET] Error:', error.message);
      return NextResponse.json({ users: [] });
    }

    const users = data.users.map((u) => ({
      id: u.id,
      email: u.email ?? '',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
    }));

    return NextResponse.json({ users });
  } catch (err) {
    console.error('[Admin Users GET] Error:', err);
    return NextResponse.json({ users: [] });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = request.nextUrl.searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'id query param required.' }, { status: 400 });
    }

    const admin = getAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('[Admin Users DELETE] Error:', error.message);
      return NextResponse.json({ error: 'Failed to remove user.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Admin Users DELETE] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
