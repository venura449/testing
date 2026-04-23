import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiDelete, apiGet, apiSend } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = {
  name: "",
  type: "LECTURE_HALL",
  capacity: "",
  location: "",
  floor: "",
  amenities: "",
  status: "ACTIVE",
};

const typeLabel = {
  LECTURE_HALL: "Lecture Hall",
  LAB: "Laboratory",
  MEETING_ROOM: "Meeting Room",
  EQUIPMENT: "Equipment",
};

const typeIcon = {
  LECTURE_HALL: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ),
  LAB: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 3v2m6-2v2M9 19h6m-6.5-6a.5.5 0 010-1h7a.5.5 0 010 1H8.5zm-2 4A2 2 0 008 19h8a2 2 0 001.732-3L15 9H9l-2.268 7z"
      />
    </svg>
  ),
  MEETING_ROOM: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  EQUIPMENT: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
};

// Inline capacity bar chart
function CapacityBar({ capacity }) {
  if (!capacity) return null;
  const max = 200;
  const pct = Math.min(100, Math.round((capacity / max) * 100));
  const color =
    pct < 40 ? "bg-emerald-400" : pct < 75 ? "bg-amber-400" : "bg-red-400";
  return (
    <div title={`${capacity} seats`}>
      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
        <span>Capacity</span>
        <span className="font-semibold text-slate-600">{capacity}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div
          className={`h-1.5 rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function validateCapacity(value) {
  const raw = String(value ?? "").trim();
  if (raw === "") return null;

  const capacity = Number(raw);
  if (!Number.isFinite(capacity) || !Number.isInteger(capacity)) {
    return "Capacity must be a whole number.";
  }
  if (capacity < 0 || capacity > 5000) {
    return "Capacity must be between 0 and 5000.";
  }
  return null;
}

function hasAdminRole(user) {
  return String(user?.role ?? "")
    .toUpperCase()
    .replace(/^ROLE_/, "") === "ADMIN";
}

function ResourceFormModal({
  editingId,
  form,
  setForm,
  capacityError,
  onClose,
  onSubmit,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          ✕
        </button>
        <h3 className="text-base font-semibold text-slate-900">
          {editingId ? "Edit facility" : "Add facility"}
        </h3>

        <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              required
              className="input"
              placeholder="e.g. Lab A204"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Type
            </label>
            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="LECTURE_HALL">Lecture Hall</option>
              <option value="LAB">Laboratory</option>
              <option value="MEETING_ROOM">Meeting Room</option>
              <option value="EQUIPMENT">Equipment</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Capacity
            </label>
            <input
              type="number"
              min="0"
              max="5000"
              step="1"
              inputMode="numeric"
              aria-describedby="capacity-help"
              className="input"
              placeholder="e.g. 60"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
            <p
              id="capacity-help"
              className={`mt-1 text-xs ${
                capacityError ? "text-red-500" : "text-slate-400"
              }`}
            >
              {capacityError || "Enter a capacity between 0 and 5000."}
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Location
            </label>
            <input
              className="input"
              placeholder="e.g. Block A, Floor 2"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Floor / Map ref
            </label>
            <input
              className="input"
              placeholder="e.g. Level 3, Wing C"
              value={form.floor}
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Amenities{" "}
              <span className="font-normal text-slate-400">
                (comma-separated)
              </span>
            </label>
            <input
              className="input"
              placeholder="e.g. Projector, AC, Whiteboard"
              value={form.amenities}
              onChange={(e) => setForm({ ...form, amenities: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="ACTIVE">Active</option>
              <option value="OUT_OF_SERVICE">Out of service</option>
            </select>
          </div>

          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              className="btn-primary"
              disabled={!!capacityError}
            >
              {editingId ? "Save changes" : "Create facility"}
            </button>
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function ResourcesPage() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showFormModal, setShowFormModal] = useState(false);

  const canManageFacilities = hasAdminRole(user);
  const pageSize = 25;
  const capacityError = validateCapacity(form.capacity);

  async function load() {
    setError(null);
    setIsLoading(true);
    try {
      const data = await apiGet("/resources");
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (capacityError) {
      setError(capacityError);
      return;
    }
    const amenitiesList = form.amenities
      ? form.amenities
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const capacity =
      form.capacity.trim() === "" ? null : Number.parseInt(form.capacity, 10);
    const body = {
      name: form.name,
      type: form.type,
      capacity,
      location: form.location || null,
      floor: form.floor || null,
      amenities: amenitiesList,
      status: form.status,
    };
    try {
      if (editingId) {
        await apiSend("/resources/" + editingId, "PUT", body);
      } else {
        await apiSend("/resources", "POST", body);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowFormModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(r) {
    setEditingId(r.id);
    setForm({
      name: r.name,
      type: r.type,
      capacity: r.capacity == null ? "" : String(r.capacity),
      location: r.location ?? "",
      floor: r.floor ?? "",
      amenities: (r.amenities ?? []).join(", "),
      status: r.status,
    });
    setShowFormModal(true);
  }

  async function remove(id) {
    if (!confirm("Delete this resource?")) return;
    try {
      await apiDelete("/resources/" + id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  const filtered = list.filter((r) => {
    if (typeFilter !== "ALL" && r.type !== typeFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Facilities</h2>
          <p className="mt-1 text-sm text-slate-500">
            Lecture halls, labs, meeting rooms and equipment.
          </p>
        </div>
        {canManageFacilities && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setShowFormModal(true);
            }}
          >
            Add facility
          </button>
        )}
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

      {/* Search + type filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            className="input pl-9"
            placeholder="Search facilities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 flex-shrink-0">
          {["ALL", "LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT"].map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={
                  "rounded-lg px-3 py-1 text-xs font-semibold transition " +
                  (typeFilter === t
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700")
                }
              >
                {t === "ALL" ? "All" : (typeLabel[t] ?? t)}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">
              Loading facilities...
            </p>
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <svg
              className="h-10 w-10 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
              />
            </svg>
            <p className="text-sm font-medium text-slate-500">
              No facilities match your search.
            </p>
          </div>
        )}
        {!isLoading && filtered.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50/90 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Facility
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Capacity
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Location
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Floor
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    {canManageFacilities && (
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <motion.tr
                      key={r.id}
                      layout
                      className="border-t border-slate-100/90 hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-primary">
                            {typeIcon[r.type] ?? typeIcon.EQUIPMENT}
                          </span>
                          <span className="font-medium text-slate-900">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">
                        {typeLabel[r.type] ?? r.type}
                      </td>
                      <td className="px-4 py-3.5 text-sm tabular-nums text-slate-700">
                        {r.capacity ?? "-"}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">
                        {r.location || "-"}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">
                        {r.floor || "-"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={
                            "badge ring-1 " +
                            (r.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                              : "bg-amber-100 text-amber-700 ring-amber-200")
                          }
                        >
                          {r.status === "ACTIVE" ? "Active" : "Out of service"}
                        </span>
                      </td>
                      {canManageFacilities && (
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="text-sm font-medium text-primary hover:text-primary-dark hover:underline"
                              onClick={() => startEdit(r)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-sm font-medium text-red-500 hover:text-red-700 hover:underline"
                              onClick={() => remove(r.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-500">
                Showing {filtered.length === 0 ? 0 : start + 1}-
                {Math.min(start + pageSize, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={
                      "rounded-md px-2.5 py-1.5 text-xs font-semibold transition " +
                      (page === p
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100")
                    }
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {showFormModal && (
          <ResourceFormModal
            editingId={editingId}
            form={form}
            setForm={setForm}
            capacityError={capacityError}
            onSubmit={submit}
            onClose={() => {
              setShowFormModal(false);
              setEditingId(null);
              setForm(emptyForm);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
