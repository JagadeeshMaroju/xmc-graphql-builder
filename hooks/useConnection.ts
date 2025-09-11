import { useEffect, useState } from "react";
import { buildSchemaFromIntrospection } from "@/lib/graphql/schema";
import { useMarketplaceClient } from "@/lib/hooks/useMarketplaceClient";
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


    setIsAutoConnecting(true);
    setConnectError(null);

    // Load schema immediately
    (async () => {
      try {
        // Use XM Cloud token if available, otherwise empty
        const xmCloudToken = appContext?.resourceAccess?.[0]?.context?.preview;
        const tokenToUse = xmCloudToken || "";
        
        // Use environment variable for endpoint
        const endpointToUse = process.env.NEXT_PUBLIC_XM_ENDPOINT || "";
        

        if (!endpointToUse) {
          throw new Error("No endpoint available. Please set NEXT_PUBLIC_XM_ENDPOINT environment variable.");
        }

        if (!tokenToUse) {
          throw new Error("No authentication token available. Please ensure you're running in XM Cloud.");
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
