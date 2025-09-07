// components/search/SearchBuilder.tsx
import { useEffect, useMemo, useState } from "react";
import type { Selection } from "@/lib/graphql/ast";
import { asEnum } from "@/lib/graphql/ast";

type GroupOp = "AND" | "OR";
type FilterName = "_path" | "_templates" | "_language";
type Operator = "CONTAINS" | "NCONTAINS" | "EQ" | "NEQ";

export type SearchCondition = {
  id: string;
  name: FilterName;
  operator: Operator;
  value: string;
};

export function SearchBuilder({
  group,
  setGroup,
  conditions,
  setConditions,
  pageSize,
  setPageSize,
  afterCursor,
  setAfterCursor,
  onEmitArgs,
  ensureDefaultSelection,
}: {
  group: GroupOp;
  setGroup: (g: GroupOp) => void;
  conditions: SearchCondition[];
  setConditions: React.Dispatch<React.SetStateAction<SearchCondition[]>>;

  // pagination (left as variables in the printed document)
  pageSize: number;
  setPageSize: (n: number) => void;
  afterCursor: string;
  setAfterCursor: (s: string) => void;

  // we emit LITERAL inputs for where/orderBy only
  onEmitArgs: (args: { where?: any; orderBy?: any }) => void;
  ensureDefaultSelection: (sel: Selection[]) => void;
}) {
  // ----- optional orderBy -----
  const [orderEnabled, setOrderEnabled] = useState<boolean>(false);
  const [orderField, setOrderField] = useState<string>("__Updated");
  const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("ASC");

  // Build orderBy input literal when enabled
  const orderByInput = useMemo(() => {
    if (!orderEnabled) return undefined;
    if (!orderField || !orderDir) return undefined;
    return { name: orderField, direction: asEnum(orderDir) };
  }, [orderEnabled, orderField, orderDir]);

  // ----- where input (flat AND/OR of conditions) -----
  const whereInput = useMemo(() => {
    const flat = conditions
      .filter((c) => c.value?.trim())
      .map((c) => ({
        name: c.name,
        value: c.value.trim(),
        operator: asEnum(c.operator),
      }));
    return flat.length ? { [group]: flat } : undefined;
  }, [group, conditions]);

  // Emit args (as literals) to parent; omit orderBy when disabled
  useEffect(() => {
    const args: any = {};
    if (whereInput) args.where = whereInput;
    if (orderByInput) args.orderBy = orderByInput;
    onEmitArgs(args);
  }, [whereInput, orderByInput, onEmitArgs]);

  // Ensure a valid default selection for `search`
  useEffect(() => {
    ensureDefaultSelection([
      { field: "total" },
      {
        field: "pageInfo",
        children: [{ field: "endCursor" }, { field: "hasNext" }],
      },
      {
        field: "results",
        children: [{ field: "url", children: [{ field: "path" }] }],
      },
    ]);
  }, [ensureDefaultSelection]);

  /* ---------------- UI helpers ---------------- */
  function addCondition(name: FilterName) {
    const defaults: Record<FilterName, Operator> = {
      _path: "CONTAINS",
      _templates: "EQ",
      _language: "EQ",
    };
    setConditions((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        name,
        operator: defaults[name],
        value: "",
      },
    ]);
  }

  function updateCond(id: string, patch: Partial<SearchCondition>) {
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  }

  function removeCond(id: string) {
    setConditions((prev) => prev.filter((c) => c.id !== id));
  }

  function duplicateCond(id: string) {
    setConditions((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx < 0) return prev;
      const copy: SearchCondition = {
        ...prev[idx],
        id: Math.random().toString(36).slice(2),
      };
      const next = prev.slice();
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }

  function clearAll() {
    setConditions([]);
  }

  /* ---------------- Render ---------------- */
  return (
    <div
      style={{
        border: "1px solid var(--border-light)",
        padding: "8px",
        borderRadius: "6px",
        margin: "6px 8px",
        background: "var(--bg-primary)",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
        overflow: "visible",
        position: "relative",
        zIndex: 0,
        maxWidth: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <h3 style={{ 
        marginTop: 0, 
        marginBottom: "8px",
        fontSize: "0.9rem",
        fontWeight: "600",
        color: "var(--text-primary)",
        display: "flex",
        alignItems: "center",
        gap: "4px"
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        Search Builder
      </h3>

      {/* Compact controls layout */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          marginBottom: "8px",
        }}
      >
        {/* First row: Group and OrderBy toggle */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "500", color: "var(--text-primary)" }}>Group:</label>
            <select
              style={{ 
                padding: "3px 6px",
                border: "1px solid var(--border-light)",
                borderRadius: "3px",
                fontSize: "0.75rem",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                cursor: "pointer",
                transition: "border-color 0.2s ease",
                minWidth: "60px"
              }}
              value={group}
              onChange={(e) => setGroup(e.target.value as GroupOp)}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--primary)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-light)";
              }}
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              padding: "2px 4px",
              borderRadius: "3px",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-tertiary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            onClick={() => setOrderEnabled(!orderEnabled)}
          >
            <div
              style={{
                position: "relative",
                width: "24px",
                height: "14px",
                backgroundColor: orderEnabled ? "var(--primary)" : "var(--border-medium)",
                borderRadius: "7px",
                transition: "all 0.3s ease",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "1px",
                  left: orderEnabled ? "11px" : "1px",
                  width: "12px",
                  height: "12px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  transition: "all 0.3s ease",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                }}
              />
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: "500", color: "var(--text-primary)" }}>OrderBy</span>
          </div>
        </div>

        {/* OrderBy fields when enabled */}
        {orderEnabled && (
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "500", color: "var(--text-primary)" }}>Field:</label>
            <input
              style={{ 
                  padding: "3px 6px",
                border: "1px solid var(--border-light)",
                borderRadius: "3px",
                fontSize: "0.75rem",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                transition: "border-color 0.2s ease",
                  minWidth: "100px"
              }}
              value={orderField}
              onChange={(e) => setOrderField(e.target.value)}
                placeholder="__Updated, __Created, name..."
              onFocus={(e) => {
                e.target.style.borderColor = "var(--primary)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-light)";
              }}
            />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "500", color: "var(--text-primary)" }}>Dir:</label>
            <select
              style={{ 
                  padding: "3px 6px",
                border: "1px solid var(--border-light)",
                borderRadius: "3px",
                fontSize: "0.75rem",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                cursor: "pointer",
                transition: "border-color 0.2s ease",
              }}
              value={orderDir}
              onChange={(e) => setOrderDir(e.target.value as "ASC" | "DESC")}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--primary)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-light)";
              }}
            >
              <option value="ASC">ASC</option>
              <option value="DESC">DESC</option>
            </select>
            </div>
          </div>
        )}

        {/* Pagination controls */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "500", color: "var(--text-primary)" }}>Size:</label>
            <input
        style={{
                padding: "3px 6px",
                border: "1px solid var(--border-light)",
                borderRadius: "3px",
                fontSize: "0.75rem",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                transition: "border-color 0.2s ease",
                width: "50px"
              }}
          type="number"
          value={pageSize}
          onChange={(e) => setPageSize(parseInt(e.target.value || "10", 10))}
          min={1}
        />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "3px", flex: 1, minWidth: "120px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "500", color: "var(--text-primary)" }}>After:</label>
        <input
              style={{ 
                padding: "3px 6px",
                border: "1px solid var(--border-light)",
                borderRadius: "3px",
                fontSize: "0.75rem",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                transition: "border-color 0.2s ease",
                flex: 1
              }}
          type="text"
          value={afterCursor}
          onChange={(e) => setAfterCursor(e.target.value)}
              placeholder="cursor..."
        />
          </div>
        </div>
      </div>

      {/* Filter buttons */}
      <div
        style={{ 
          display: "flex", 
          gap: "4px", 
          marginBottom: "8px", 
          flexWrap: "wrap" 
        }}
      >
        <button 
          onClick={() => addCondition("_path")}
          style={{
            padding: "4px 8px",
            border: "1px solid var(--primary)",
            borderRadius: "3px",
            background: "var(--primary)",
            color: "white",
            fontSize: "0.75rem",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "3px"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--primary-hover)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--primary)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          _path
        </button>
        <button 
          onClick={() => addCondition("_templates")}
          style={{
            padding: "4px 8px",
            border: "1px solid var(--primary)",
            borderRadius: "3px",
            background: "var(--primary)",
            color: "white",
            fontSize: "0.75rem",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "3px"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--primary-hover)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--primary)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          _template
        </button>
        <button 
          onClick={() => addCondition("_language")}
          style={{
            padding: "4px 8px",
            border: "1px solid var(--primary)",
            borderRadius: "3px",
            background: "var(--primary)",
            color: "white",
            fontSize: "0.75rem",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "3px"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--primary-hover)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--primary)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          _language
        </button>
        {conditions.length > 0 && (
          <button 
            onClick={clearAll}
            style={{
              padding: "4px 8px",
              border: "1px solid var(--border-medium)",
              borderRadius: "3px",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: "0.75rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "3px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-tertiary)";
              e.currentTarget.style.borderColor = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "var(--border-medium)";
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
            </svg>
            Clear
          </button>
        )}
      </div>

      {conditions.length === 0 && (
        <div style={{ 
          margin: "8px 0", 
          padding: "8px 12px", 
          background: "var(--bg-tertiary)", 
          borderRadius: "6px",
          border: "1px solid var(--border-light)"
        }}>
          <p style={{ 
            color: "var(--text-secondary)", 
            margin: 0, 
            fontSize: "0.8rem",
            lineHeight: 1.4
          }}>
            Add at least one filter: <code>_path</code>, <code>_template</code>, or <code>_language</code>
          </p>
        </div>
      )}

      {/* Filters table */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {conditions.map((c) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              padding: "8px",
              background: "var(--bg-secondary)",
              borderRadius: "8px",
              border: "1px solid var(--border-light)",
            }}
          >
            <div style={{ 
              padding: "4px 8px", 
              background: "var(--primary)", 
              color: "white", 
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: "600",
              minWidth: "80px",
              textAlign: "center"
            }}>
              {c.name}
            </div>

            <select
              value={c.operator}
              onChange={(e) =>
                updateCond(c.id, { operator: e.target.value as Operator })
              }
              style={{
                padding: "6px 8px",
                border: "1px solid var(--border-light)",
                borderRadius: "4px",
                fontSize: "0.875rem",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                cursor: "pointer",
                minWidth: "100px"
              }}
            >
              {c.name === "_path" ? (
                <>
                  <option value="CONTAINS">CONTAINS</option>
                  <option value="NCONTAINS">NCONTAINS</option>
                </>
              ) : (
                <>
                  <option value="EQ">EQUALS</option>
                  <option value="NEQ">NEQUALS</option>
                </>
              )}
            </select>

            <input
              placeholder={
                c.name === "_language" ? "e.g. en" : "GUID or path fragment"
              }
              value={c.value}
              onChange={(e) => updateCond(c.id, { value: e.target.value })}
              style={{
                padding: "6px 8px",
                border: "1px solid var(--border-light)",
                borderRadius: "4px",
                fontSize: "0.875rem",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                flex: 1,
                minWidth: "150px"
              }}
            />

            <button 
              onClick={() => duplicateCond(c.id)} 
              title="duplicate"
              style={{
                padding: "6px 8px",
                border: "1px solid var(--border-medium)",
                borderRadius: "4px",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-tertiary)";
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.color = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "var(--border-medium)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button 
              onClick={() => removeCond(c.id)} 
              title="remove"
              style={{
                padding: "6px 8px",
                border: "1px solid var(--border-medium)",
                borderRadius: "4px",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fee2e2";
                e.currentTarget.style.borderColor = "#dc2626";
                e.currentTarget.style.color = "#dc2626";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "var(--border-medium)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: "12px", 
        padding: "8px 12px", 
        background: "var(--bg-tertiary)", 
        borderRadius: "6px",
        border: "1px solid var(--border-light)"
      }}>
        <p style={{ 
          color: "var(--text-secondary)", 
          margin: 0, 
          fontSize: "0.8rem",
          lineHeight: 1.4
        }}>
          <strong>Default selection:</strong> <code>total</code>, <code>pageInfo</code>, <code>results</code>
        </p>
      </div>
    </div>
  );
}
