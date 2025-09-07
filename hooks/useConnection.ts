import { useEffect, useState } from "react";
import { buildSchemaFromIntrospection } from "@/lib/graphql/schema";
import { useMarketplaceClient } from "@/lib/hooks/useMarketplaceClient";
import { getStoredCredentials, saveCredentials } from "@/utils/credentials";
import { z } from "zod";

const ConnectSchema = z.object({
  endpoint: z.string().url(),
  token: z.string().optional(),
});

export function useConnection() {
  const { client, error, isInitialized, isLoading } = useMarketplaceClient();
  const [appContext, setAppContext] = useState<any>();
  const [schema, setSchema] = useState<any>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);

  useEffect(() => {
    if (!error && isInitialized && client) {
      client
        .query("application.context")
        .then((res: any) => {
          setAppContext(res.data);
        })
        .catch((error) => {
          console.error("Error retrieving application.context:", error);
        });
    }
  }, [client, error, isInitialized]);

  // Load schema directly on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Don't run if we already have a schema or are currently loading
    if (schema || isAutoConnecting) return;

    console.log("🚀 Loading schema directly on page load...");

    setIsAutoConnecting(true);
    setConnectError(null);

    // Load schema immediately
    (async () => {
      try {
        // Use XM Cloud token if available, otherwise use stored token, otherwise empty
        const xmCloudToken = appContext?.resourceAccess?.[0]?.context?.preview;
        const storedCreds = getStoredCredentials();
        const tokenToUse = xmCloudToken || storedCreds.token || "";
        
        // Use stored endpoint or environment variable
        const endpointToUse = storedCreds.endpoint || process.env.NEXT_PUBLIC_XM_ENDPOINT || "";
        
        console.log("📋 Using credentials:", {
          endpoint: endpointToUse,
          hasToken: !!tokenToUse,
          tokenSource: xmCloudToken ? 'XM Cloud' : storedCreds.token ? 'stored' : 'none',
        });

        if (!endpointToUse) {
          throw new Error("No endpoint available. Please set NEXT_PUBLIC_XM_ENDPOINT environment variable.");
        }

        if (!tokenToUse) {
          throw new Error("No authentication token available. Please ensure you're running in XM Cloud or have stored credentials.");
        }

        const parsed = ConnectSchema.safeParse({
          endpoint: endpointToUse,
          token: tokenToUse,
        });

        if (!parsed.success) {
          throw new Error(
            parsed.error.errors[0]?.message || "Invalid credentials"
          );
        }

        console.log("Making API call to /api/schema...");
        const r = await fetch("/api/schema", {
          method: "POST",
          body: JSON.stringify(parsed.data),
          headers: { "Content-Type": "application/json" },
        });

        const json = await r.json();
        if (!r.ok || json.error) {
          throw new Error(json.error || "Failed to introspect.");
        }

        const sch = buildSchemaFromIntrospection(json);
        setSchema(sch);
        
        // Save credentials for future use
        if (endpointToUse && tokenToUse) {
          saveCredentials(endpointToUse, tokenToUse);
        }
        
        console.log("✅ Schema loaded successfully");
      } catch (error) {
        console.error("Schema loading failed:", error);
        setConnectError("Failed to load schema: " + (error as Error).message);
      } finally {
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
