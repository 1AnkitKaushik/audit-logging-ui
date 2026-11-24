const API_BASE_URL = process.env.NEXT_PUBLIC_AUDIT_API_URL || "";
const USE_MOCK = !API_BASE_URL;

const MOCK_LOGS = [
  {
    id: "AUD-1042",
    timestamp: "2026-11-23T12:15:00Z",
    actor: "admin@example.com",
    role: "ADMIN",
    action: "LICENSE_ISSUED",
    resource: "ORG_1794991409454",
    status: "SUCCESS",
    details: "Issued RSA-2048 license with 365 days validity and 7 days grace.",
    metadata: { modules: ["USER_MANAGEMENT", "AUDIT_LOGS"], validityDays: 365 }
  },
  {
    id: "AUD-1041",
    timestamp: "2026-11-23T11:50:12Z",
    actor: "developer@example.com",
    role: "DEVELOPER",
    action: "POLICY_UPDATED",
    resource: "AUDIT_RETENTION_POLICY",
    status: "SUCCESS",
    details: "Updated audit log retention window from 90 days to 180 days.",
    metadata: { previousDays: 90, newDays: 180 }
  },
  {
    id: "AUD-1040",
    timestamp: "2026-11-23T11:22:45Z",
    actor: "system-enforcer",
    role: "SERVICE",
    action: "SIGNATURE_CHECK",
    resource: "license-enforcer-keda",
    status: "FAILURE",
    details: "Rejected license artifact due to signature mismatch (INVALID_SIGNATURE).",
    metadata: { reason: "INVALID_SIGNATURE", actionRequired: "SCALE_TO_ZERO" }
  },
  {
    id: "AUD-1039",
    timestamp: "2026-11-23T10:05:30Z",
    actor: "owner@example.com",
    role: "OWNER",
    action: "ROLE_ASSIGNED",
    resource: "USER_test3",
    status: "WARNING",
    details: "Granted temporary elevated audit viewer permissions.",
    metadata: { grantedRole: "AUDITOR", expiresInHours: 24 }
  }
];

export async function fetchAuditLogs({ search = "", status = "ALL", action = "ALL" } = {}) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return MOCK_LOGS.filter((log) => {
      const matchesSearch =
        !search ||
        log.actor.toLowerCase().includes(search.toLowerCase()) ||
        log.resource.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "ALL" || log.status === status;
      const matchesAction = action === "ALL" || log.action === action;
      return matchesSearch && matchesStatus && matchesAction;
    });
  }

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status !== "ALL") params.set("status", status);
  if (action !== "ALL") params.set("action", action);

  const res = await fetch(`${API_BASE_URL}/audit-logs?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch audit logs (${res.status})`);
  const json = await res.json();
  return Array.isArray(json) ? json : json.data || [];
}