/**
 * components/Settings/UserManager.tsx
 * ─────────────────────────────────────────────────────────────────
 * User management panel. Fetches auth users from /api/admin/users.
 * Shows email + created date + last sign in.
 * "Remove" button with confirmation — only for users that are NOT you.
 *
 * How to change: Edit this file only.
 * Used by: app/(app)/settings/users/page.tsx
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Trash2, Loader2, Shield } from 'lucide-react';

type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
};

export default function UserManager(): React.ReactElement {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    // Get current user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);

    // Fetch admin user list
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const data = (await res.json()) as { users: AdminUser[] };
      setUsers(data.users);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (userId: string): Promise<void> => {
    setDeleting(userId);
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch { /* graceful */ }
    setDeleting(null);
    setConfirmDelete(null);
  };

  if (loading) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 md:p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Users size={14} style={{ color: 'var(--text-muted)' }} />
        <span className="font-sans text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {users.length} User{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      {users.length === 0 ? (
        <p className="font-sans text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
          No users found
        </p>
      ) : (
        <div className="space-y-1.5">
          {users.map((user) => {
            const isYou = user.id === currentUserId;

            return (
              <div
                key={user.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-sans text-sm font-bold"
                    style={{
                      backgroundColor: isYou ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: isYou ? 'var(--bg-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {user.email[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-sans text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {user.email}
                      </p>
                      {isYou && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-sans text-[10px] font-semibold"
                          style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}
                        >
                          <Shield size={8} /> You
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-xs" style={{ color: 'var(--text-muted)' }}>
                      Joined {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {user.last_sign_in_at && (
                        <> • Last active {new Date(user.last_sign_in_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</>
                      )}
                    </p>
                  </div>
                </div>

                {!isYou && (
                  <div className="flex-shrink-0 ml-2">
                    {confirmDelete === user.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deleting === user.id}
                          className="px-2 py-1 rounded font-sans text-xs font-medium"
                          style={{ backgroundColor: 'var(--error)', color: '#fff' }}
                        >
                          {deleting === user.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            'Confirm'
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 rounded font-sans text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(user.id)}
                        className="w-7 h-7 rounded flex items-center justify-center transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        title="Remove user"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
