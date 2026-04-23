import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

const roleOptions = ["ADMIN", "USER", "TECHNICIAN"];

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [roleDraft, setRoleDraft] = useState({});

  const isSelf = (id) => id === user?.id;

  const canEdit = useMemo(() => user?.role === "ADMIN", [user?.role]);

  async function load() {
    setError(null);
    try {
      const data = await apiGet("/admin/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateRole(id) {
    if (!canEdit) return;
    const nextRole = roleDraft[id];
    if (!nextRole) return;

    setError(null);
    setUpdatingId(id);
    try {
      await apiSend(`/admin/users/${id}/role`, "PUT", { role: nextRole });
      setRoleDraft((d) => ({ ...d, [id]: "" }));
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Admin · Users</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage user roles (USER / TECHNICIAN / ADMIN).
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {error}
        </div>
      )}

      <div className="card p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className={`h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent`} />
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <div className="grid grid-cols-12 gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
              <div className="col-span-3">User</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-4">Change role</div>
              <div className="col-span-3 text-right">Action</div>
            </div>

            <div className="divide-y divide-slate-100">
              {users.length === 0 && (
                <div className="px-4 py-12 text-center text-sm text-slate-500">
                  No users found.
                </div>
              )}

              {users.map((u) => {
                const currentRole = u.role ?? "USER";
                const draft = roleDraft[u.id] || "";
                const selectValue = draft || "";
                const disabled =
                  !canEdit || isSelf(u.id) || updatingId === u.id;

                return (
                  <div
                    key={u.id}
                    className="grid grid-cols-12 items-center gap-3 px-4 py-4"
                  >
                    <div className="col-span-3 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {u.name || u.email}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {u.email}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="badge ring-1 bg-blue-50 text-blue-700 ring-blue-100">
                        {currentRole}
                      </span>
                    </div>
                    <div className="col-span-4">
                      <select
                        disabled={disabled}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                        value={selectValue}
                        onChange={(e) =>
                          setRoleDraft((d) => ({
                            ...d,
                            [u.id]: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select…</option>
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3 text-right">
                      <button
                        type="button"
                        disabled={disabled || !selectValue}
                        className="btn-primary rounded-lg px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => updateRole(u.id)}
                      >
                        {updatingId === u.id ? "Saving…" : "Update"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// refactored: 2026-04-02T11:20:23

// refactored: 2026-04-23T19:33:09
