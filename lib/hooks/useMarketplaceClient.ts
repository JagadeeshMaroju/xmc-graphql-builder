// utils/hooks/useMarketplaceClient.ts
import { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";

export interface MarketplaceClientState {
  client: ClientSDK | null;
  error: Error | null;
  isLoading: boolean;
  isInitialized: boolean;
}

export interface UseMarketplaceClientOptions {
  retryAttempts?: number; // Default: 3
  retryDelay?: number; // Default: 1000ms
  autoInit?: boolean; // Default: true
}

const DEFAULT_OPTIONS: Required<UseMarketplaceClientOptions> = {
  retryAttempts: 3,
  retryDelay: 1000,
  autoInit: true,
};

let client: ClientSDK | undefined = undefined;

/*
  getMarketplaceClient
  - Lazily initializes and caches a singleton ClientSDK instance.
  - Uses window.parent as the target for the marketplace SDK iframe messaging.
  - Calling this repeatedly will return the same cached instance.
*/
async function getMarketplaceClient() {
  if (client) {
    return client;
  }
  const config = {
    target: window.parent,
  };
  client = await ClientSDK.init(config);
  return client;
}

/*
  useMarketplaceClient hook
  - Provides safe initialization and lifecycle management for the
    Sitecore Marketplace ClientSDK inside React components.
  - Exposes state (client, error, isLoading, isInitialized) and an
    `initialize` function to trigger (or retry) initialization manually.
  - Supports configurable retry attempts/delay and optional auto-init.
*/
export function useMarketplaceClient(
  options: UseMarketplaceClientOptions = {}
) {
  // Merge user options with defaults (memoized to avoid unnecessary re-renders).
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);

  // Hook local state representing the client initialization lifecycle.
  const [state, setState] = useState<MarketplaceClientState>({
    client: null,
    error: null,
    isLoading: false,
    isInitialized: false,
  });

  // Ref used to prevent concurrent initializations across renders/calls.
  const isInitializingRef = useRef(false);

  /*
    initializeClient
    - Attempts to obtain the marketplace client with retry semantics.
    - Ensures only one initialization runs at a time using isInitializingRef.
    - Updates hook state to reflect progress, success, or final failure.
  */
  const initializeClient = useCallback(
    async (attempt = 1): Promise<void> => {
      let shouldProceed = false;
      setState((prev) => {
        // If already initializing or initialized, skip.
        if (prev.isLoading || prev.isInitialized || isInitializingRef.current) {
          return prev;
        }
        shouldProceed = true;
        isInitializingRef.current = true;
        return { ...prev, isLoading: true, error: null };
      });

      if (!shouldProceed) return;

      try {
        const client = await getMarketplaceClient();
        setState({
          client,
          error: null,
          isLoading: false,
          isInitialized: true,
        });
      } catch (error) {
        // On failure, retry up to the configured number of attempts.
        if (attempt < opts.retryAttempts) {
          await new Promise((resolve) => setTimeout(resolve, opts.retryDelay));
          return initializeClient(attempt + 1);
        }
        // Final failure: store an Error instance and reset flags.
        setState({
          client: null,
          error:
            error instanceof Error
              ? error
              : new Error("Failed to initialize MarketplaceClient"),
          isLoading: false,
          isInitialized: false,
        });
      } finally {
        // Allow other initialization attempts after this run completes.
        isInitializingRef.current = false;
      }
    },
    [opts.retryAttempts, opts.retryDelay]
  );

  /*
    Auto-initialize on mount (unless autoInit is false).
    - Returns a cleanup that resets state and prevents in-flight init refs
      from remaining true after unmount.
  */
  useEffect(() => {
    if (opts.autoInit) {
      initializeClient();
    }
    return () => {
      // Ensure any in-progress initialization isn't left marked as running,
      // and reset hook state to its initial shape.
      isInitializingRef.current = false;
      setState({
        client: null,
        error: null,
        isLoading: false,
        isInitialized: false,
      });
    };
  }, [opts.autoInit, initializeClient]);

  // Return stable memoized API including the initialize function.
  return useMemo(
    () => ({
      ...state,
      initialize: initializeClient,
    }),
    [state, initializeClient]
  );
}