import { NextResponse } from "next/server";

const BACKEND_URL = process.env.AUDIT_BACKEND_URL || "http://localhost:5001";
const DEFAULT_SCOPE_CONTEXT =
  process.env.AUDIT_SCOPE_CONTEXT ||
  JSON.stringify([
    { location: "HYD", product_name: "product1" },
    { location: "Hyderabad", area: "CC1" },
  ]);
const DEFAULT_USER_ROLES = process.env.AUDIT_USER_ROLES || "SUPER_ADMIN";

const FALLBACK_RECORDS = [
  {
    originalVal: "{\"host\":\"10.0.1.12\",\"port\":5432}",
    changedVal: "{\"host\":\"10.0.1.45\",\"port\":5432}",
    createdAt: 1793172450,
    actionType: "UPDATED",
    context: "CONNECTION",
    contextId: "CONN-HYD-01",
    businessJustification: "Migrated primary ingestion endpoint to HYD CC1 cluster",
    userId: "superadmin",
  },
  {
    originalVal: null,
    changedVal: "{\"streamName\":\"turbine-vibration-stream\",\"partitions\":6}",
    createdAt: 1793172420,
    actionType: "CREATED",
    context: "INSIGHT_STREAM",
    contextId: "STR-908",
    businessJustification: "Enabled real-time anomaly streaming for product1",
    userId: "developer@factigent.io",
  },
  {
    originalVal: "{\"threshold\":85.0}",
    changedVal: "{\"threshold\":92.5}",
    createdAt: 1793172390,
    actionType: "UPDATED",
    context: "ALERT_DEFINITION",
    contextId: "ALT-442",
    businessJustification: "Tuned upper control limit after baseline calibration",
    userId: "analyst@factigent.io",
  },
  {
    originalVal: "{\"role\":\"ROLE_USER\"}",
    changedVal: "{\"role\":\"ROLE_ADMIN\"}",
    createdAt: 1793172310,
    actionType: "UPDATED",
    context: "USER",
    contextId: "USR-119",
    businessJustification: "Granted temporary administrative access for audit review",
    userId: "owner@factigent.io",
  },
];

function buildMockResponseDTO(searchParams) {
  const page = Number(searchParams.get("page") || 0);
  const size = Number(searchParams.get("size") || 10);
  const actionType = searchParams.get("actionType");
  const context = searchParams.get("context");
  const contextId = searchParams.get("contextId");
  const userId = searchParams.get("userId");
  const fromCreatedAt = searchParams.get("fromCreatedAt");
  const toCreatedAt = searchParams.get("toCreatedAt");

  const filtered = FALLBACK_RECORDS.filter((row) => {
    if (actionType && row.actionType !== actionType) return false;
    if (context && row.context !== context) return false;
    if (contextId && !row.contextId.toLowerCase().includes(contextId.toLowerCase())) return false;
    if (userId && !row.userId.toLowerCase().includes(userId.toLowerCase())) return false;
    if (fromCreatedAt && row.createdAt < Number(fromCreatedAt)) return false;
    if (toCreatedAt && row.createdAt > Number(toCreatedAt)) return false;
    return true;
  });

  const start = page * size;
  return {
    status: "success",
    data: {
      records: filtered.slice(start, start + size),
      total: filtered.length,
      page,
      size,
      totalPages: Math.max(1, Math.ceil(filtered.length / size)),
    },
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = `${BACKEND_URL}/audit-logs?${searchParams.toString()}`;

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-USER-SCOPE-CONTEXT":
          request.headers.get("x-user-scope-context") || DEFAULT_SCOPE_CONTEXT,
        "X-USER-ROLES":
          request.headers.get("x-user-roles") || DEFAULT_USER_ROLES,
      },
      cache: "no-store",
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { status: "error", message: text };
    }

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(buildMockResponseDTO(searchParams), {
      status: 200,
      headers: { "X-Audit-Data-Source": "MOCK_FALLBACK" },
    });
  }
}
