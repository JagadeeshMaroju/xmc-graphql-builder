interface ConnectionPanelProps {
  isAutoConnecting: boolean;
  connectError: string | null;
  schema: any;
}

export function ConnectionPanel({ isAutoConnecting, connectError, schema }: ConnectionPanelProps) {
  return (
    <>
      {/* Connection Status */}
      {isAutoConnecting && (
        <div style={{
          marginBottom: "var(--space-4)",
          padding: "var(--space-4)",
          background: "linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)",
          border: "1px solid #ffc107",
          borderRadius: "12px",
          fontSize: "0.9rem",
          color: "#856404",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 4px 12px rgba(255, 193, 7, 0.15)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            width: "20px",
            height: "20px",
            border: "3px solid #856404",
            borderTop: "3px solid transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            flexShrink: 0
          }}></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "600", marginBottom: "2px" }}>
              Loading GraphQL Schema...
            </div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
              Please wait while we connect to your GraphQL endpoint
            </div>
          </div>
          <div style={{
            position: "absolute",
            top: "-2px",
            right: "-2px",
            width: "8px",
            height: "8px",
            background: "#ffc107",
            borderRadius: "50%",
            animation: "pulse 2s infinite"
          }}></div>
        </div>
      )}

      {connectError && (
        <div style={{
          marginBottom: "var(--space-4)",
          padding: "var(--space-4)",
          background: "linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)",
          border: "1px solid #dc3545",
          borderRadius: "12px",
          fontSize: "0.9rem",
          color: "#721c24",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          boxShadow: "0 4px 12px rgba(220, 53, 69, 0.15)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "#dc3545",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: "2px"
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>
              Connection Error
            </div>
            <div style={{ fontSize: "0.85rem", lineHeight: 1.4 }}>
              {connectError}
            </div>
          </div>
          <div style={{
            position: "absolute",
            top: "-2px",
            right: "-2px",
            width: "8px",
            height: "8px",
            background: "#dc3545",
            borderRadius: "50%",
            animation: "pulse 2s infinite"
          }}></div>
        </div>
      )}

      {schema && (
        <div style={{
          marginBottom: "var(--space-10)",
          padding: "var(--space-4) var(--space-5)",
          background: "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)",
          border: "1px solid #28a745",
          borderRadius: "8px",
          fontSize: "0.85rem",
          color: "#155724",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          position: "relative"
        }}>
          <div style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "#10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: "600", 
              fontSize: "0.9rem",
              color: "#155724"
            }}>
              Connected & Ready
            </div>
          </div>
        </div>
      )}
    </>
  );
}
