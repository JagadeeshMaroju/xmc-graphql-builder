import type { NextApiRequest, NextApiResponse } from "next";

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
  const { endpoint, token, query, variables } = req.body as {
    endpoint?: string;
    token?: string;
    query: string;
    variables?: Record<string, unknown>;
  };
  const url = endpoint || process.env.XM_GRAPHQL_ENDPOINT;
  if (!url || !query)
    return res.status(400).json({ error: "Missing endpoint or query." });
  try {
    const r = await fetch(`${url}?sc_apikey=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      cache: "no-store" as any,
    });
    const json = await r.json();
    return res.status(r.ok ? 200 : 500).json(json);
  } catch (e: any) {
    return res.status(500).json({ error: "Fetch failed", details: e?.message });
  }
}
