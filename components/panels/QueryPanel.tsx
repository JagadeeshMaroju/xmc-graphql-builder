export function QueryPanel({
  queryText,
  run,
  canRun,
  loading,
  copy,
}: {
  queryText: string;
  run: () => void;
  canRun: boolean;
  loading: boolean;
  copy: () => void;
}) {
  // Add keyboard shortcut for copy (Ctrl+C or Cmd+C)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      copy();
    }
  };
  return (
    <div className="card">
      <div className="card-header">
        <h3
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          GraphQL Query
        </h3>
      </div>
      <div className="card-body">
        <textarea
          readOnly
          value={queryText}
          placeholder="Your GraphQL query will appear here..."
          onFocus={(e) => (e.target as HTMLTextAreaElement).select()}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            height: 200,
            fontFamily:
              "JetBrains Mono, Fira Code, Monaco, Consolas, monospace",
            fontSize: "0.875rem",
            lineHeight: 1.5,
            resize: "vertical",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            background: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            cursor: "text",
            userSelect: "all",
          }}
        />
        <div
          style={{
            marginTop: "var(--space-5)",
            display: "flex",
            gap: "24px",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <button
            onClick={run}
            disabled={!canRun || loading}
            style={{
              minWidth: "130px",
              height: "40px",
              background: canRun && !loading 
                ? "var(--primary)"
                : "var(--text-muted)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0 var(--space-4)",
              fontSize: "0.9rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: canRun && !loading ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              opacity: canRun && !loading ? 1 : 0.6,
              boxShadow: canRun && !loading 
                ? "0 2px 4px rgba(99, 102, 241, 0.2)" 
                : "none"
            }}
            onMouseEnter={(e) => {
              if (canRun && !loading) {
                e.currentTarget.style.background = "var(--primary-hover)";
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(99, 102, 241, 0.3)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (canRun && !loading) {
                e.currentTarget.style.background = "var(--primary)";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(99, 102, 241, 0.2)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Running...
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                Run Query
              </>
            )}
          </button>
          <button
            onClick={copy}
            className="secondary"
            style={{ 
              minWidth: "130px",
              height: "40px",
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-medium)",
              borderRadius: "8px",
              padding: "0 var(--space-4)",
              fontSize: "0.9rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.color = "var(--primary)";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-medium)";
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy Query
          </button>
        </div>
        <div style={{
          marginTop: "12px",
          padding: "8px 12px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          fontSize: "0.8rem",
          color: "#64748b",
          textAlign: "center"
        }}>
          💡 <strong>Copy Tips:</strong> Click textarea to select all, or use Ctrl+C (Cmd+C on Mac) to copy
        </div>
      </div>
    </div>
  );
}
