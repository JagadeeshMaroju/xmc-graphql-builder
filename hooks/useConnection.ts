import { useEffect, useState } from "react";
import { buildSchemaFromIntrospection } from "@/lib/graphql/schema";
import { useMarketplaceClient } from "@/lib/hooks/useMarketplaceClient";
import { z } from "zod";

/*
  Helper Zod schema used to validate the shape of data we send to
  the server-side `/api/schema` endpoint. We expect an `endpoint`
  (GraphQL URL) and an optional `token` used for authentication.
*/
const ConnectSchema = z.object({
  endpoint: z.string().url(),
  token: z.string().optional(),
});

/**
 * useConnection
 * - Loads XM Cloud application context (via `useMarketplaceClient`) and
 *   automatically fetches the GraphQL introspection schema when possible.
 * - Returns the built schema instance (or `null`), any connection error
 *   message, a boolean indicating whether an automatic connection is in
 *   progress, and the XM Cloud `appContext` when available.
 *
 * Key behaviors:
 * - Reads `NEXT_PUBLIC_XM_ENDPOINT` from the environment to determine the
 *   GraphQL endpoint used for introspection.
 * - Attempts to extract an XM Cloud preview token from the `appContext`
 *   (`resourceAccess[0].context.preview`) and requires it to be present.
 * - Calls the local `/api/schema` endpoint to perform the introspection
 *   (so credentials/tokens are not exposed directly in the client).
 * - Uses `buildSchemaFromIntrospection` to convert the introspection
 *   response into a runtime schema object consumed by the app.
 */
export function useConnection() {
  // Marketplace client provides methods to query application context
  // and may indicate initialization/loading state or an error.
  const { client, error, isInitialized, isLoading } = useMarketplaceClient();

  // XM Cloud application context (populated from the marketplace client).
  // This may contain authentication info, resource access data, etc.
  const [appContext, setAppContext] = useState<any>();

  // The built GraphQL schema (null until successfully loaded).
  const [schema, setSchema] = useState<any>(null);

  // Human-readable connection error string (used to display errors to users).
  const [connectError, setConnectError] = useState<string | null>(null);

  // Flag used to avoid multiple simultaneous auto-connection attempts.
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);

  /*
    Effect: retrieve the XM Cloud `application.context` via the
    marketplace client. We guard with `isInitialized` and `client`
    to ensure the client is ready before querying.
  */
  useEffect(() => {
    if (!error && isInitialized && client) {
      client
        .query("application.context")
        .then((res: any) => {
          // store the application context for later use (token extraction)
          setAppContext(res.data);
        })
        .catch((error) => {
          // Non-fatal: log retrieval problems but do not throw. The
          // schema loading effect will re-run when/if `appContext`
          // becomes available.
          console.error("Error retrieving application.context:", error);
        });
    }
  }, [client, error, isInitialized]);

  /*
    Effect: automatic schema load.
    - Runs only on the client (`typeof window !== 'undefined'`).
    - Skips if we already have a schema or are currently connecting.
    - Extracts a token from `appContext` and reads the endpoint from
      `NEXT_PUBLIC_XM_ENDPOINT` before validating and POSTing to
      `/api/schema` which performs server-side introspection.
    - Updates `schema`, `connectError`, and `isAutoConnecting` accordingly.
  */
  useEffect(() => {
    // Only run on client side; avoid executing during SSR.
    if (typeof window === "undefined") return;

    // Don't attempt to auto-connect if we already have a schema or
    // another auto-connection is currently in progress.
    if (schema || isAutoConnecting) return;

    setIsAutoConnecting(true);
    setConnectError(null);

    (async () => {
      try {
        // Try to get an XM Cloud preview token from the application context.
        // The exact path may vary; here we follow the existing app's shape.
        const xmCloudToken = appContext?.resourceAccess?.[0]?.context?.preview;
        const tokenToUse = xmCloudToken || "";

        // Read endpoint from environment variable injected at build/runtime.
        const endpointToUse = process.env.NEXT_PUBLIC_XM_ENDPOINT || "";

        // Basic validation checks with informative error messages.
        if (!endpointToUse) {
          throw new Error("No endpoint available. Please set NEXT_PUBLIC_XM_ENDPOINT environment variable.");
        }

        if (!tokenToUse) {
          throw new Error("No authentication token available. Please ensure you're running in XM Cloud.");
        }

        // Validate payload shape before sending to the API endpoint.
        const parsed = ConnectSchema.safeParse({
          endpoint: endpointToUse,
          token: tokenToUse,
        });

        if (!parsed.success) {
          // Use the first validation error message when available.
          throw new Error(parsed.error.errors[0]?.message || "Invalid credentials");
        }

        // POST to the local serverless route which will perform the
        // introspection on the given endpoint using the provided token.
        const r = await fetch("/api/schema", {
          method: "POST",
          body: JSON.stringify(parsed.data),
          headers: { "Content-Type": "application/json" },
        });

        const json = await r.json();
        if (!r.ok || json.error) {
          // Surface server-side error messages when possible.
          throw new Error(json.error || "Failed to introspect.");
        }

        // Build runtime schema from the introspection result and store it.
        const sch = buildSchemaFromIntrospection(json);
        setSchema(sch);
      } catch (error) {
        // Persist a user-friendly error message for display in the UI.
        console.error("Schema loading failed:", error);
        setConnectError("Failed to load schema: " + (error as Error).message);
      } finally {
        // Mark the auto-connection attempt as complete regardless of outcome.
        setIsAutoConnecting(false);
      }
    })();
  }, [appContext]); // Re-run when XM Cloud context becomes available

  return {
    schema,
    connectError,
    isAutoConnecting,
    appContext,
  };
}
