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
        border: "1px solid #eee",
        padding: 12,
        borderRadius: 8,
        margin: "12px 16px",
        overflow: "visible",
        position: "relative",
        zIndex: 0,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Search</h3>

      {/* Group + optional orderBy + pagination controls */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 8,
          alignItems: "center",
          marginBottom: 8,
          overflow: "visible",
          position: "relative",
          zIndex: 1,
        }}
      >
        <label style={{ gridColumn: "span 1" }}>Group</label>
        <select
          style={{ 
            gridColumn: "span 2",
            padding: "8px 12px",
            border: "1px solid var(--border-light)",
            borderRadius: "6px",
            fontSize: "0.875rem",
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            fontFamily: "JetBrains Mono, Fira Code, Monaco, Consolas, monospace",
            cursor: "pointer",
            transition: "border-color 0.2s ease",
            position: "relative",
            zIndex: 999,
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

        <div
          style={{
            gridColumn: "span 3",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: "var(--radius-md)",
            transition: "background-color 0.2s ease",
            margin: 0,
            fontSize: "0.875rem",
            fontWeight: "500",
            color: "var(--text-primary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-tertiary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
          onClick={() => setOrderEnabled(!orderEnabled)}
        >
          {/* Custom Toggle Switch */}
          <div
            style={{
              position: "relative",
              width: "44px",
              height: "24px",
              backgroundColor: orderEnabled ? "var(--primary)" : "var(--border-medium)",
              borderRadius: "12px",
              transition: "all 0.3s ease",
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: orderEnabled 
                ? "0 2px 4px rgba(99, 102, 241, 0.3)" 
                : "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "2px",
                left: orderEnabled ? "22px" : "2px",
                width: "20px",
                height: "20px",
                backgroundColor: "white",
                borderRadius: "50%",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                transform: orderEnabled ? "scale(1)" : "scale(0.9)",
              }}
            />
          </div>
          <span>Enable orderBy</span>
        </div>

        {orderEnabled && (
          <>
            <label 
              style={{ 
                gridColumn: "span 2",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "var(--text-primary)",
                fontFamily: "JetBrains Mono, Fira Code, Monaco, Consolas, monospace",
                display: "flex",
                alignItems: "center",
                margin: 0,
              }}
            >
              orderBy.name
            </label>
            <input
              style={{ 
                gridColumn: "span 2",
                padding: "8px 12px",
                border: "1px solid var(--border-light)",
                borderRadius: "6px",
                fontSize: "0.875rem",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontFamily: "JetBrains Mono, Fira Code, Monaco, Consolas, monospace",
                transition: "border-color 0.2s ease",
                position: "relative",
                zIndex: 10,
              }}
              value={orderField}
              onChange={(e) => setOrderField(e.target.value)}
              placeholder="__Updated / __Created / name …"
              onFocus={(e) => {
                e.target.style.borderColor = "var(--primary)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-light)";
              }}
            />

            <label 
              style={{ 
                gridColumn: "span 1",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "var(--text-primary)",
                fontFamily: "JetBrains Mono, Fira Code, Monaco, Consolas, monospace",
                display: "flex",
                alignItems: "center",
                margin: 0,
              }}
            >
              direction
            </label>
            <select
              style={{ 
                gridColumn: "span 1",
                padding: "8px 12px",
                border: "1px solid var(--border-light)",
                borderRadius: "6px",
                fontSize: "0.875rem",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontFamily: "JetBrains Mono, Fira Code, Monaco, Consolas, monospace",
                cursor: "pointer",
                transition: "border-color 0.2s ease",
                position: "relative",
                zIndex: 999,
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
          </>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 8,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <label style={{ gridColumn: "span 2" }}>pageSize</label>
        <input
          style={{ gridColumn: "span 2" }}
          type="number"
          value={pageSize}
          onChange={(e) => setPageSize(parseInt(e.target.value || "10", 10))}
          min={1}
        />

        <label style={{ gridColumn: "span 1" }}>after</label>
        <input
          style={{ gridColumn: "span 7" }}
          type="text"
          value={afterCursor}
          onChange={(e) => setAfterCursor(e.target.value)}
          placeholder="cursor…"
        />
      </div>

      {/* Quick add + clear */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}
      >
        <button onClick={() => addCondition("_path")}>+ _path</button>
        <button onClick={() => addCondition("_templates")}>+ _template</button>
        <button onClick={() => addCondition("_language")}>+ _language</button>
        {conditions.length > 0 && <button onClick={clearAll}>Clear all</button>}
      </div>

      {conditions.length === 0 && (
        <p style={{ color: "#666", margin: "8px 0" }}>
          Add at least one filter (<code>_path</code>, <code>_template</code>,
          or <code>_language</code>).
        </p>
      )}

      {/* Filters table */}
      <div style={{ display: "grid", gap: 8 }}>
        {conditions.map((c) => (
          <div
            key={c.id}
            style={{
              display: "grid",
              gridTemplateColumns: "140px 160px 1fr auto auto",
              gap: 8,
              alignItems: "center",
            }}
          >
            <code>{c.name}</code>

            <select
              value={c.operator}
              onChange={(e) =>
                updateCond(c.id, { operator: e.target.value as Operator })
              }
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
            />

            <button onClick={() => duplicateCond(c.id)} title="duplicate">
              ⎘
            </button>
            <button onClick={() => removeCond(c.id)} title="remove">
              ✕
            </button>
          </div>
        ))}
      </div>

      <p style={{ color: "#888", marginTop: 8 }}>
        Result selection defaults to <code>total</code>, <code>pageInfo</code>,
        and{" "}
        <code>
          results {"{"} url {"{"} path {"}"} {"}"}
        </code>
        .
      </p>
    </div>
  );
}
