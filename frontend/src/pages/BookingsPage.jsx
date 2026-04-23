import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiDelete, apiGet, apiSend } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

const statusConfig = {
  PENDING: {
    label: "Pending",
    cls: "bg-amber-100 text-amber-700 ring-amber-200",
  },
  APPROVED: {
    label: "Approved",
    cls: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  },
  REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-700 ring-red-200" },
  CANCELLED: {
    label: "Cancelled",
    cls: "bg-slate-100 text-slate-600 ring-slate-200",
  },
};

function toDateTimeLocalValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function parseDateTimeLocal(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function validateBookingTimes(form, now) {
  const start = parseDateTimeLocal(form.start);
  const end = parseDateTimeLocal(form.end);

  const startError =
    form.start && start && start.getTime() < now.getTime()
      ? "Start time cannot be in the past."
      : null;

  const endError =
    form.end && end && start && end.getTime() <= start.getTime()
      ? "End time must be after the start time."
      : null;

  return { startError, endError };
}

function findApprovedBookingConflict(form, bookings) {
  const start = parseDateTimeLocal(form.start);
  const end = parseDateTimeLocal(form.end);
  if (!form.resourceId || !start || !end || end.getTime() <= start.getTime()) {
    return null;
  }

  return bookings.find((booking) => {
    if (booking.resourceId !== form.resourceId || booking.status !== "APPROVED") {
      return false;
    }
    const existingStart = new Date(booking.startTime);
    const existingEnd = new Date(booking.endTime);
    return existingStart.getTime() < end.getTime() && existingEnd.getTime() > start.getTime();
  });
}

function formatConflictMessage(booking) {
  if (!booking) return null;
  return (
    `${booking.resourceName} is already booked from ` +
    `${new Date(booking.startTime).toLocaleString()} to ` +
    `${new Date(booking.endTime).toLocaleString()}.`
  );
}

function BookingsLoadingScreen() {
  return (
    <div className="card flex min-h-[360px] flex-col items-center justify-center gap-4 text-center">
      <div className="h-11 w-11 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      <div>
        <p className="text-sm font-semibold text-slate-900">Loading bookings</p>
        <p className="mt-1 text-sm text-slate-500">
          Checking reservations and available facilities.
        </p>
      </div>
    </div>
  );
}

function BookingFormModal({
  form,
  resources,
  startError,
  endError,
  conflictError,
  startMin,
  endMin,
  onClose,
  onSubmit,
  onChange,
  submitting,
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
        className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          ✕
        </button>
        <h3 className="text-base font-semibold text-slate-900">New booking request</h3>
        <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Resource
            </label>
            <select
              required
              className="input"
              value={form.resourceId}
              onChange={(e) => onChange({ ...form, resourceId: e.target.value })}
            >
              <option value="">Select a resource…</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Start
            </label>
            <input
              required
              type="datetime-local"
              min={startMin}
              className="input"
              value={form.start}
              onChange={(e) => onChange({ ...form, start: e.target.value })}
            />
            <p
              className={`mt-1 text-xs ${
                startError ? "text-red-500" : "text-slate-400"
              }`}
            >
              {startError || "Choose a start time today or later."}
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              End
            </label>
            <input
              required
              type="datetime-local"
              min={endMin}
              className="input"
              value={form.end}
              onChange={(e) => onChange({ ...form, end: e.target.value })}
            />
            <p
              className={`mt-1 text-xs ${
                endError || conflictError ? "text-red-500" : "text-slate-400"
              }`}
            >
              {endError || conflictError || "Choose an end time after the start time."}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Purpose <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              className="input"
              placeholder="e.g. Lecture, Workshop, Meeting..."
              value={form.purpose}
              onChange={(e) => onChange({ ...form, purpose: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !!startError || !!endError || !!conflictError}
            >
              {submitting ? "Submitting..." : "Submit request"}
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    resourceId: "",
    start: "",
    end: "",
    purpose: "",
  });
  const [decisionReasons, setDecisionReasons] = useState({});
  const [mineOnly, setMineOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sendingQrId, setSendingQrId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(() => Date.now());

  const isAdmin =
    String(user?.role ?? "")
      .toUpperCase()
      .replace(/^ROLE_/, "") === "ADMIN";
  const pageSize = 25;
  const currentLocalMin = toDateTimeLocalValue(new Date(now));
  const { startError, endError } = validateBookingTimes(form, new Date(now));
  const conflict = findApprovedBookingConflict(form, bookings);
  const conflictError = formatConflictMessage(conflict);
  const bookingError = startError || endError || conflictError;

  async function load() {
    setError(null);
    setLoadingBookings(true);
    try {
      const q = isAdmin ? "?all=true" : "";
      const [b, r] = await Promise.all([
        apiGet("/bookings" + q),
        apiGet("/resources"),
      ]);
      setBookings(Array.isArray(b) ? b : []);
      setResources(
        Array.isArray(r) ? r.filter((x) => x.status === "ACTIVE") : [],
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingBookings(false);
    }
  }

  useEffect(() => {
    load();
  }, [isAdmin]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  async function createBooking(e) {
    e.preventDefault();
    setError(null);
    if (bookingError) {
      setError(bookingError);
      return;
    }
    setSubmittingBooking(true);
    try {
      await apiSend("/bookings", "POST", {
        resourceId: String(form.resourceId),
        startTime: new Date(form.start).toISOString(),
        endTime: new Date(form.end).toISOString(),
        purpose: form.purpose || null,
      });
      setForm({ resourceId: "", start: "", end: "", purpose: "" });
      setShowFormModal(false);
      load();
    } catch (err) {
      setError(
        err.status === 409
          ? "This resource is already booked during the selected time. Choose a time outside the occupied booking."
          : err.message,
      );
    } finally {
      setSubmittingBooking(false);
    }
  }

  async function setStatus(id, status, reason) {
    try {
      await apiSend("/bookings/" + id + "/status", "PUT", {
        status,
        reason: reason || null,
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function cancelBooking(id) {
    try {
      await apiSend("/bookings/" + id + "/cancel", "POST");
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteBooking(id) {
    if (!confirm("Delete this booking permanently?")) return;
    try {
      await apiDelete("/bookings/" + id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function sendQrEmail(id) {
    setError(null);
    setSuccessMessage("");
    setSendingQrId(id);
    try {
      const response = await apiSend(`/bookings/${id}/send-qr`, "POST");
      setSuccessMessage(response?.message || "QR code sent to your email.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSendingQrId(null);
    }
  }

  // Filter logic
  const filtered = bookings.filter((b) => {
    if (mineOnly && b.userEmail !== user?.email) return false;
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [mineOnly, statusFilter, isAdmin]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function downloadPdf() {
    const rows = filtered;
    const esc = (s) =>
      String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    const rowsHtml = rows
      .map(
        (b) =>
          "<tr>" +
          `<td>${esc(b.resourceName)}</td>` +
          `<td>${esc(new Date(b.startTime).toLocaleString())}</td>` +
          `<td>${esc(new Date(b.endTime).toLocaleString())}</td>` +
          `<td>${esc(b.userEmail)}</td>` +
          `<td>${esc(b.purpose || "-")}</td>` +
          `<td>${esc(b.status)}</td>` +
          "</tr>",
      )
      .join("");
    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bookings Export</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 32px; color: #0f172a; }
    h1 { font-size: 18px; margin: 0 0 6px; }
    p { margin: 0 0 16px; font-size: 12px; color: #475569; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 12px; vertical-align: top; }
    th { background: #f8fafc; text-align: left; }
    .muted { color: #64748b; font-size: 11px; }
  </style>
</head>
<body>
  <h1>Bookings</h1>
  <p class="muted">Exported ${new Date().toLocaleString()} · Rows: ${rows.length}</p>
  <table>
    <thead>
      <tr>
        <th>Resource</th>
        <th>Start</th>
        <th>End</th>
        <th>User</th>
        <th>Purpose</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
  <script>
    window.onload = () => { window.print(); };
  </script>
</body>
</html>
    `.trim();

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Bookings</h2>
            <p className="mt-1 text-sm text-slate-500">
              Request and manage resource reservations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={downloadPdf} className="btn-ghost">
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setSuccessMessage("");
                setShowFormModal(true);
              }}
              className="btn-primary"
            >
              Add booking
            </button>
          </div>
        </div>
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
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
          {successMessage}
        </div>
      )}

      {loadingBookings ? (
        <BookingsLoadingScreen />
      ) : (
        <>
      {/* Filters bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={
                "rounded-lg px-3 py-1 text-xs font-semibold transition " +
                (statusFilter === s
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700")
              }
            >
              {s === "ALL" ? "All" : (statusConfig[s]?.label ?? s)}
            </button>
          ))}
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setMineOnly((v) => !v)}
            className={
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition " +
              (mineOnly
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")
            }
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            My bookings only
          </button>
        )}
      </div>

      {/* Bookings table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 && (
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm font-medium text-slate-500">
              No bookings match the current filter.
            </p>
          </div>
        )}
        {filtered.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50/90 text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Start
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    End
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    User
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Purpose
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((b) => {
                  const s = statusConfig[b.status] ?? statusConfig.PENDING;
                  return (
                    <motion.tr
                      key={b.id}
                      layout
                      className="border-t border-slate-100/90 align-top hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-900">
                        {b.resourceName}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">
                        {new Date(b.startTime).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">
                        {new Date(b.endTime).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">
                        {b.userEmail}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">
                        {b.purpose || "-"}
                        {b.decisionReason && (
                          <p className="mt-1 text-xs text-slate-500">
                            Decision: {b.decisionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge ring-1 ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {b.status === "APPROVED" && (
                            <button
                              type="button"
                              title="Send check-in QR code to my email"
                              onClick={() => sendQrEmail(b.id)}
                              disabled={sendingQrId === b.id}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                            >
                              {sendingQrId === b.id ? "Sending..." : "Send QR"}
                            </button>
                          )}
                          {isAdmin && b.status === "PENDING" && (
                            <>
                              <input
                                className="input h-8 min-w-[180px] px-2.5 py-1 text-xs"
                                placeholder="Reason (required to reject)"
                                value={decisionReasons[b.id] || ""}
                                onChange={(e) =>
                                  setDecisionReasons((d) => ({
                                    ...d,
                                    [b.id]: e.target.value,
                                  }))
                                }
                              />
                              <button
                                type="button"
                                className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
                                onClick={() =>
                                  setStatus(
                                    b.id,
                                    "APPROVED",
                                    (decisionReasons[b.id] || "").trim() || null,
                                  )
                                }
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
                                onClick={() => {
                                  const reason = (decisionReasons[b.id] || "").trim();
                                  if (!reason) {
                                    setError(
                                      "Decision reason is required when rejecting a booking",
                                    );
                                    return;
                                  }
                                  setStatus(b.id, "REJECTED", reason);
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {(b.status === "PENDING" || b.status === "APPROVED") && (
                            <button
                              type="button"
                              className="btn-ghost px-2.5 py-1.5 text-xs"
                              onClick={() => cancelBooking(b.id)}
                            >
                              Cancel
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 hover:text-red-700"
                              onClick={() => deleteBooking(b.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
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
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showFormModal && (
          <BookingFormModal
            form={form}
            resources={resources}
            startError={startError}
            endError={endError}
            conflictError={conflictError}
            startMin={currentLocalMin}
            endMin={form.start || currentLocalMin}
            onChange={setForm}
            onSubmit={createBooking}
            onClose={() => setShowFormModal(false)}
            submitting={submittingBooking}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
