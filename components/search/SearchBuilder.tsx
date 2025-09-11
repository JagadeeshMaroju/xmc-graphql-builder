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
    <div className="search-builder">
      <h3 className="search-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        Search Builder
      </h3>

      {/* Compact controls layout */}
      <div className="controls-layout">
        {/* First row: Group and OrderBy toggle */}
        <div className="controls-row">
          <div className="control-group">
            <label className="control-label">Group:</label>
            <select
              className="control-select"
              value={group}
              onChange={(e) => setGroup(e.target.value as GroupOp)}
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </div>

          <div
            className="toggle-container"
            onClick={() => setOrderEnabled(!orderEnabled)}
          >
            <div className={`toggle-switch ${orderEnabled ? 'enabled' : ''}`}>
              <div className="toggle-handle" />
            </div>
            <span className="toggle-label">OrderBy</span>
          </div>
        </div>

        {/* OrderBy fields when enabled */}
        {orderEnabled && (
          <div className="controls-row">
            <div className="control-group">
              <label className="control-label">Field:</label>
              <input
                className="control-input"
                value={orderField}
                onChange={(e) => setOrderField(e.target.value)}
                placeholder="__Updated, __Created, name..."
              />
            </div>
            <div className="control-group">
              <label className="control-label">Dir:</label>
              <select
                className="control-select"
                value={orderDir}
                onChange={(e) => setOrderDir(e.target.value as "ASC" | "DESC")}
              >
                <option value="ASC">ASC</option>
                <option value="DESC">DESC</option>
              </select>
            </div>
          </div>
        )}

        {/* Pagination controls */}
        <div className="controls-row">
          <div className="control-group">
            <label className="control-label">Size:</label>
            <input
              className="control-input-small"
              type="number"
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value || "10", 10))}
              min={1}
            />
          </div>
          <div className="control-group" style={{ flex: 1, minWidth: "80px" }}>
            <label className="control-label">After:</label>
            <input
              className="control-input-medium"
              type="text"
              value={afterCursor}
              onChange={(e) => setAfterCursor(e.target.value)}
              placeholder="cursor..."
            />
          </div>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="filter-buttons">
        <button 
          onClick={() => addCondition("_path")}
          className="filter-button"
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          _path
        </button>
        <button 
          onClick={() => addCondition("_templates")}
          className="filter-button"
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          _template
        </button>
        <button 
          onClick={() => addCondition("_language")}
          className="filter-button"
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          _language
        </button>
        {conditions.length > 0 && (
          <button 
            onClick={clearAll}
            className="clear-button"
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
            </svg>
            Clear
          </button>
        )}
      </div>

      {conditions.length === 0 && (
        <div className="empty-message">
          <p>
            Add at least one filter: <code>_path</code>, <code>_template</code>, or <code>_language</code>
          </p>
        </div>
      )}

      {/* Filters table */}
      <div className="filters-list">
        {conditions.map((c) => (
          <div
            key={c.id}
            className="filter-item"
          >
            <div className="filter-badge">
              {c.name}
            </div>

            <select
              className="filter-select"
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
              className="filter-input"
              placeholder={
                c.name === "_language" ? "e.g. en" : "GUID or path fragment"
              }
              value={c.value}
              onChange={(e) => updateCond(c.id, { value: e.target.value })}
            />

            <button 
              onClick={() => duplicateCond(c.id)} 
              title="duplicate"
              className="filter-action-button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button 
              onClick={() => removeCond(c.id)} 
              title="remove"
              className="filter-action-button remove"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="default-selection">
        <p>
          <strong>Default selection:</strong> <code>total</code>, <code>pageInfo</code>, <code>results</code>
        </p>
      </div>
    </div>
  );
}
