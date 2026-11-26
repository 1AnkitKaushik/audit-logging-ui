const API_BASE_URL = process.env.NEXT_PUBLIC_AUDIT_API_URL || "/api";

const DEFAULT_SCOPE_CONTEXT =
  process.env.NEXT_PUBLIC_AUDIT_SCOPE_CONTEXT ||
  JSON.stringify([
    { location: "HYD", product_name: "product1" },
    { location: "Hyderabad", area: "CC1" },
  ]);

const DEFAULT_USER_ROLES =
  process.env.NEXT_PUBLIC_AUDIT_USER_ROLES || "SUPER_ADMIN";

function toEpochSeconds(dateTimeLocal) {
  if (!dateTimeLocal) return null;
  const ms = Date.parse(dateTimeLocal);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

function normalizeTimestamp(raw) {
  if (!raw) return new Date().toISOString();
  const num = Number(raw);
  if (!Number.isNaN(num)) {
    return new Date(num < 1e12 ? num * 1000 : num).toISOString();
  }
  return String(raw);
}

function normalizeLog(item, index) {
  const action = item.actionType || "UNKNOWN";
  const isFailure = action === "FAILED" || action === "ERROR" || action === "REJECTED";
  const isDelete = action === "DELETED";

  return {
    id: `${item.contextId || "LOG"}-${item.createdAt || index}`,
    timestamp: normalizeTimestamp(item.createdAt),
    createdAtRaw: item.createdAt,
    userId: item.userId || "unknown",
    actionType: action,
    context: item.context || "GENERAL",
    contextId: item.contextId || "-",
    originalVal: item.originalVal ?? null,
    changedVal: item.changedVal ?? null,
    businessJustification: item.businessJustification || "",
    badgeTone: isFailure ? "FAILURE" : isDelete ? "WARNING" : "SUCCESS",
    raw: item,
  };
}

export async function fetchAuditLogs({
  search = "",
  actionType = "ALL",
  context = "",
  contextId = "",
  userId = "",
  fromDate = "",
  toDate = "",
  page = 0,
  size = 10,
} = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));

  const fromCreatedAt = toEpochSeconds(fromDate);
  const toCreatedAt = toEpochSeconds(toDate);

  if (fromCreatedAt !== null) params.set("fromCreatedAt", String(fromCreatedAt));
  if (toCreatedAt !== null) params.set("toCreatedAt", String(toCreatedAt));
  if (actionType && actionType !== "ALL") params.set("actionType", actionType);
  if (context.trim()) params.set("context", context.trim().toUpperCase());
  if (contextId.trim()) params.set("contextId", contextId.trim());
  if (userId.trim()) params.set("userId", userId.trim());

  const res = await fetch(`${API_BASE_URL}/audit-logs?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-USER-SCOPE-CONTEXT": DEFAULT_SCOPE_CONTEXT,
      "X-USER-ROLES": DEFAULT_USER_ROLES,
    },
    cache: "no-store",
  });

  const dataSource = res.headers.get("X-Audit-Data-Source") || "LIVE_BACKEND";
  const json = await res.json();

  if (!res.ok || json.status === "error") {
    throw new Error(json.message || `Failed to fetch audit logs (${res.status})`);
  }

  const pageDto = json.data || json;
  const rawRecords = Array.isArray(pageDto)
    ? pageDto
    : pageDto.records || pageDto.content || [];

  let normalized = rawRecords.map(normalizeLog);

  if (search.trim()) {
    const q = search.toLowerCase();
    normalized = normalized.filter(
      (l) =>
        l.userId.toLowerCase().includes(q) ||
        l.context.toLowerCase().includes(q) ||
        l.contextId.toLowerCase().includes(q) ||
        l.businessJustification.toLowerCase().includes(q) ||
        (l.originalVal || "").toLowerCase().includes(q) ||
        (l.changedVal || "").toLowerCase().includes(q)
    );
  }

  const totalElements =
    typeof pageDto.total === "number" ? pageDto.total : normalized.length;
  const totalPages =
    typeof pageDto.totalPages === "number"
      ? Math.max(1, pageDto.totalPages)
      : Math.max(1, Math.ceil(totalElements / size));

  return {
    logs: normalized,
    totalElements,
    totalPages,
    page: typeof pageDto.page === "number" ? pageDto.page : page,
    size: typeof pageDto.size === "number" ? pageDto.size : size,
    isMock: dataSource === "MOCK_FALLBACK",
  };
}
