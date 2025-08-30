import type { NextApiRequest, NextApiResponse } from "next";
import { getIntrospectionQuery } from "graphql";

function authHeader(token?: string) {
  const tk = token || process.env.XM_TOKEN;
  return tk ? { Authorization: `Bearer ${tk}` } : {};
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  const { endpoint, token } = req.body as { endpoint?: string; token?: string };
  const url = endpoint || process.env.XM_GRAPHQL_ENDPOINT;
  if (!url) return res.status(400).json({ error: "Missing GraphQL endpoint." });
  try {
    const r = await fetch(`${url}?sc_apikey=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: getIntrospectionQuery() }),
      cache: "no-store" as any,
    });
    const json = await r.json();
    if (!r.ok || json.errors)
      return res
        .status(500)
        .json({ error: "Introspection failed", details: json.errors ?? json });
    return res.status(200).json(json.data);
  } catch (e: any) {
    return res.status(500).json({ error: "Fetch failed", details: e?.message });
  }
}
