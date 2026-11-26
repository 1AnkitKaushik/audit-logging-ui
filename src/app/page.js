"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Download,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fetchAuditLogs } from "@/lib/auditApi";

const ACTION_ENUM_OPTIONS = [
  "ALL",
  "CREATED",
  "UPDATED",
  "DELETED",
  "READ",
  "UNKNOWN",
];

const CONTEXT_ENUM_OPTIONS = [
  "ALL",
  "LOGIN",
  "LOGOUT",
  "USER",
  "USER_PROFILE",
  "ROLE",
  "PERMISSION",
  "TAGS",
  "TAG_MAPPING",
  "CONNECTORS",
  "CONNECTION",
  "LIMITS",
  "ALERTS",
  "GROUPS",
  "LOCATION",
  "AREA",
  "PRODUCT",
  "LOCATION_PRODUCT",
  "LOCATION_AREA",
  "ROLE_PERMISSION",
  "ORGANIZATION",
  "EVENT",
  "REPORT",
  "DATA_FLOW",
  "CONTEXT",
  "INSIGHT_ALARM",
  "INSIGHT_CUSTOM_TAG",
  "INSIGHT_STREAM",
];

function prettyJsonOrText(val) {
  if (val === null || val === undefined || val === "") return "—";
  try {
    return JSON.stringify(JSON.parse(val), null, 2);
  } catch {
    return String(val);
  }
}

export default function AuditLoggingPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMock, setIsMock] = useState(false);

  // Immediate UI input states
  const [searchInput, setSearchInput] = useState("");
  const [userIdInput, setUserIdInput] = useState("");
  const [contextIdInput, setContextIdInput] = useState("");

  // Debounced query states
  const [search, setSearch] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [contextIdFilter, setContextIdFilter] = useState("");

  // Exact enum & date filters
  const [actionFilter, setActionFilter] = useState("ALL");
  const [contextFilter, setContextFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedLog, setSelectedLog] = useState(null);

  // 350ms debounce for free-text fields
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setUserIdFilter(userIdInput);
      setContextIdFilter(contextIdInput);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, userIdInput, contextIdInput]);

  const loadLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchAuditLogs({
        search,
        actionType: actionFilter,
        context: contextFilter === "ALL" ? "" : contextFilter,
        contextId: contextIdFilter,
        userId: userIdFilter,
        fromDate,
        toDate,
        page,
        size,
      });
      setLogs(result.logs);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      setIsMock(result.isMock);
    } catch (err) {
      setError(err.message || "Unable to connect to Audit Log API.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [search, actionFilter, contextFilter, contextIdFilter, userIdFilter, fromDate, toDate, page]);

  const resetFilters = () => {
    setSearchInput("");
    setUserIdInput("");
    setContextIdInput("");
    setSearch("");
    setUserIdFilter("");
    setContextIdFilter("");
    setActionFilter("ALL");
    setContextFilter("ALL");
    setFromDate("");
    setToDate("");
    setPage(0);
  };

  const exportCsv = () => {
    const headers = [
      "CreatedAt",
      "UserId",
      "ActionType",
      "Context",
      "ContextId",
      "BusinessJustification",
      "OriginalVal",
      "ChangedVal",
    ];
    const rows = logs.map((l) => [
      l.timestamp,
      l.userId,
      l.actionType,
      l.context,
      l.contextId,
      `"${(l.businessJustification || "").replace(/"/g, '""')}"`,
      `"${(l.originalVal || "").replace(/"/g, '""')}"`,
      `"${(l.changedVal || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ActionBadge = ({ action }) => {
    const colors = {
      CREATED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      UPDATED: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
      DELETED: "bg-rose-500/10 text-rose-300 border-rose-500/30",
      READ: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
      UNKNOWN: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    };
    const cls = colors[action] || "bg-slate-800 text-slate-200 border-slate-700";
    return (
      <code className={`px-2 py-0.5 text-xs font-medium rounded border ${cls}`}>
        {action}
      </code>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                <span
                  className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                    isMock
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {isMock ? "MOCK FALLBACK (5001 OFFLINE)" : "LIVE API (5001)"}
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Change history, scope context trail, and payload diff viewer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm text-slate-300 transition"
            >
              Reset
            </button>
            <button
              onClick={loadLogs}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm text-slate-300 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-semibold text-white transition"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-2xl text-sm text-red-300 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadLogs}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800/60 rounded-lg text-xs font-medium text-white"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-400 uppercase">Total Matching Records</p>
            <p className="text-2xl font-bold text-white mt-1">{totalElements}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-400 uppercase">Creates / Updates (Page)</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {logs.filter((l) => l.actionType !== "DELETED").length}
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-400 uppercase">Deletions (Page)</p>
            <p className="text-2xl font-bold text-rose-400 mt-1">
              {logs.filter((l) => l.actionType === "DELETED").length}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search across userId, contextId, justification, or values..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(0);
              }}
              className="px-4 py-2.5 bg-slate-900/70 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {ACTION_ENUM_OPTIONS.map((act) => (
                <option key={act} value={act}>
                  {act === "ALL" ? "All Actions (actionType)" : act}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="userId (e.g. superadmin)"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className="px-3.5 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <select
              value={contextFilter}
              onChange={(e) => {
                setContextFilter(e.target.value);
                setPage(0);
              }}
              className="px-3.5 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CONTEXT_ENUM_OPTIONS.map((ctx) => (
                <option key={ctx} value={ctx}>
                  {ctx === "ALL" ? "All Contexts (context)" : ctx}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="contextId (e.g. line1-insight2)"
              value={contextIdInput}
              onChange={(e) => setContextIdInput(e.target.value)}
              className="px-3.5 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="datetime-local"
              aria-label="From Created At"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(0);
              }}
              className="px-3.5 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="datetime-local"
              aria-label="To Created At"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(0);
              }}
              className="px-3.5 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900 border-b border-slate-800 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Created At</th>
                  <th className="px-4 py-3.5">User ID</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Context</th>
                  <th className="px-4 py-3.5">Context ID</th>
                  <th className="px-4 py-3.5">Justification</th>
                  <th className="px-4 py-3.5 text-right">Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      No audit records match your filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-300 text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-medium text-white">
                        {log.userId}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <ActionBadge action={log.actionType} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs text-slate-300">
                        {log.context}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs text-slate-400">
                        {log.contextId}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-300 max-w-xs truncate">
                        {log.businessJustification || "—"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page + 1} of {totalPages} ({totalElements} total records)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-200 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                disabled={page + 1 >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-200 transition"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ActionBadge action={selectedLog.actionType} />
                  <h2 className="text-lg font-semibold text-white">
                    {selectedLog.context} — {selectedLog.contextId}
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  By <span className="text-slate-200">{selectedLog.userId}</span> •{" "}
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedLog.businessJustification && (
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300">
                  <span className="font-semibold text-slate-400 uppercase mr-2">
                    Business Justification:
                  </span>
                  {selectedLog.businessJustification}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase font-semibold text-rose-400 mb-1.5">
                    Original Value (originalVal)
                  </p>
                  <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-rose-300 font-mono overflow-x-auto max-h-64">
                    {prettyJsonOrText(selectedLog.originalVal)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold text-emerald-400 mb-1.5">
                    Changed Value (changedVal)
                  </p>
                  <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-300 font-mono overflow-x-auto max-h-64">
                    {prettyJsonOrText(selectedLog.changedVal)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
