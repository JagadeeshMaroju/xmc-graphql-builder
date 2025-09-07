// Helper functions for localStorage credential management
export const getStoredCredentials = () => {
  if (typeof window === "undefined") {
    console.log("🌐 Server-side: returning empty credentials");
    return { endpoint: "", token: "" };
  }
  try {
    const stored = localStorage.getItem("graphql-builder-credentials");
    console.log("💾 Raw stored data:", stored);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("📦 Parsed credentials:", parsed);
      return {
        endpoint: parsed.endpoint || "",
        token: parsed.token || "",
      };
    }
  } catch (error) {
    console.warn("Failed to load stored credentials:", error);
  }
  console.log("❌ No stored credentials found");
  return { endpoint: "", token: "" };
};

export const saveCredentials = (endpoint: string, token: string) => {
  if (typeof window === "undefined") {
    console.log("🌐 Server-side: cannot save credentials");
    return;
  }
  try {
    const credentials = {
      endpoint,
      token,
      savedAt: new Date().toISOString(),
    };
    console.log("💾 Saving credentials:", {
      endpoint,
      token: token ? `${token.substring(0, 10)}...` : 'empty',
      savedAt: credentials.savedAt,
    });
    localStorage.setItem(
      "graphql-builder-credentials",
      JSON.stringify(credentials)
    );
    console.log("✅ Credentials saved successfully");
  } catch (error) {
    console.warn("Failed to save credentials:", error);
  }
};

export const clearStoredCredentials = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("graphql-builder-credentials");
  } catch (error) {
    console.warn("Failed to clear credentials:", error);
  }
};
