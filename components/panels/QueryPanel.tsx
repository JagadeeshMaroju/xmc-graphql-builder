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
          }}
        />
        <div
          style={{
            marginTop: "var(--space-4)",
            display: "flex",
            gap: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={run}
            disabled={!canRun || loading}
            style={{
              minWidth: "120px",
              background:
                canRun && !loading ? "var(--primary)" : "var(--text-muted)",
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
            style={{ minWidth: "120px" }}
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
      </div>
    </div>
  );
}
