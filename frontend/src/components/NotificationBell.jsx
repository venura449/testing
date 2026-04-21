import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiDelete, apiGet, apiSend } from "../api/client";

const TYPE_TABS = [
  { key: "ALL", label: "All" },
  { key: "BOOKING", label: "Bookings" },
  { key: "TICKET", label: "Tickets" },
  { key: "COMMENT", label: "Comments" },
];

function guessType(message = "") {
  const m = message.toLowerCase();
  if (
    m.includes("booking") ||
    m.includes("approved") ||
    m.includes("rejected") ||
    m.includes("cancel")
  )
    return "BOOKING";
  if (
    m.includes("ticket") ||
    m.includes("resolved") ||
    m.includes("closed") ||
    m.includes("assigned")
  )
    return "TICKET";
  if (m.includes("comment")) return "COMMENT";
  return "OTHER";
}

// Small confirm popover for "Clear all"
function ClearAllButton({ onConfirm }) {
  const [confirming, setConfirming] = useState(true);

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500">Sure?</span>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
          className="text-xs font-semibold text-red-600 hover:underline"
        >
          Yes, clear
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-red-500"
      title="Delete all notifications"
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
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      Clear all
    </button>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [count, setCount] = useState(5);
  const [items, setItems] = useState([]);
  const [tab, setTab] = React.useState("ALL");
  const panelRef = useRef(null);

  async function load() {
    try {
      const [c, list] = await Promise.all([
        apiGet("/notifications/unread-count"),
        apiGet("/notifications"),
      ]);
      setCount(c.count ?? 0);
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setCount(0);
    }
  }

  React.useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onDoc(e) {
      if (panelRef.current && !panelRef.current.contains(e.target))
        setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function markRead(id) {
    await apiSend("/notifications/" + id + "/read", "PUT");
    load();
  }

  async function markAll() {
    await apiSend("/notifications/read-all", "PUT");
    load();
  }

  async function deleteOne(id) {
    await apiDelete("/notifications/" + id);
    load();
  }

  async function clearAll() {
    await apiDelete("/notifications/clear-all");
    load();
  }

  const filtered =
    tab === "ALL" ? items : items.filter((n) => guessType(n.message) === tab);
  const unreadInTab = filtered.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
      >
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {count > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 origin-top-right rounded-card border border-slate-200/60 bg-white shadow-card"
          >
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-semibold text-slate-900">
                Notifications
              </span>
              <div className="flex items-center gap-3">
                {unreadInTab > 0 && (
                  <button
                    type="button"
                    onClick={markAll}
                    className="text-xs font-medium text-primary hover:text-primary-dark hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                {items.length > 0 && <ClearAllButton onConfirm={clearAll} />}
              </div>
            </div>

            {/* Type filter tabs */}
            <div className="flex gap-0.5 border-b border-slate-100 px-2 pt-2">
              {TYPE_TABS.map((t, index) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={
                    "rounded-t-lg px-3 py-1.5 text-xs font-semibold transition " +
                    (tab === t.key
                      ? "border-b-2 border-primary text-primary"
                      : "text-slate-500 hover:text-slate-700")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Notification list */}
            <ul className="max-h-72 divide-y divide-slate-50 overflow-y-auto">
              {filtered.length === 0 && (
                <li className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <svg
                    className="h-8 w-8 text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"
                    />
                  </svg>
                  <p className="text-sm text-slate-500">
                    {tab === "ALL"
                      ? "All caught up!"
                      : `No ${tab.toLowerCase()} notifications`}
                  </p>
                </li>
              )}

              <AnimatePresence initial={false}>
                {filtered.map((n, index) => {
                  const nType = guessType(n.message);
                  const dot =
                    nType === "BOOKING"
                      ? "bg-blue-400"
                      : nType === "TICKET"
                        ? "bg-blue-400"
                        : nType === "COMMENT"
                          ? "bg-amber-400"
                          : "bg-slate-300";
                  return (
                    <motion.li
                      key={n.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className={
                        "group px-4 py-3 " +
                        (n.read ? "opacity-60" : "bg-blue-50/30")
                      }
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-800">{n.message}</p>
                          <div className={`mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1`}>
                            <span className="text-xs text-slate-400">
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                            <div className="flex items-center gap-2">
                              {!n.read && (
                                <button
                                  type="button"
                                  onClick={() => markRead(n.id)}
                                  className="text-xs font-medium text-primary hover:underline"
                                >
                                  Mark read
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteOne(n.id)}
                                className="text-xs font-medium text-red-400 opacity-0 transition hover:text-red-600 hover:underline group-hover:opacity-100"
                                title="Delete notification"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// finalized: 2026-04-21T21:28:45

// refactored: 2026-04-23T10:21:47

// reviewed: 2026-04-23T19:21:03
