import { useState, useEffect, useMemo } from "react";
import type { GraphQLSchema } from "graphql";
import { QueryPanel } from "@/components/panels/QueryPanel";
import { ComplexityBar } from "@/components/panels/ComplexityBar";
import { collectValuesFromSelections } from "@/utils/queryHelpers";
import { computeComplexity } from "@/utils/complexity";
import {
  buildOperation,
  makeVarDef,
  printDoc,
  rootQueryType,
  collectVariablesFromSelections,
  toNamedTypeNode,
  mergeRootArgsIntoSelections,
} from "@/lib/graphql/ast";
import { DEFAULT_WEIGHTS } from "@/lib/graphql/complexity";

interface QueryPreviewProps {
  schema: GraphQLSchema | null;
  rootFieldName: string | null;
  rootArgs: Record<string, unknown>;
  selection: any[];
  appContext: any;
}

export function QueryPreview({ 
  schema, 
  rootFieldName, 
  rootArgs, 
  selection, 
  appContext 
}: QueryPreviewProps) {
  const [variables, setVariables] = useState<Record<string, unknown>>({});
  const [variableDefs, setVariableDefs] = useState<
    import("graphql").VariableDefinitionNode[]
  >([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Ultra-robust copy function with multiple fallback methods
  const copyToClipboard = async (text: string) => {
    try {
      setCopyStatus('idle');
      
      // Method 1: Try modern clipboard API (most reliable when available)
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          setCopyStatus('success');
          setTimeout(() => setCopyStatus('idle'), 2000);
          return true;
        } catch (clipboardError) {
          // Clipboard API failed, trying fallback methods
        }
      }
      
      // Method 2: Create a temporary textarea and use execCommand
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.setAttribute('readonly', '');
      textArea.setAttribute('contenteditable', 'true');
      
      document.body.appendChild(textArea);
      
      // Focus and select the text
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, text.length);
      
      // Try to copy
      let successful = false;
      try {
        successful = document.execCommand('copy');
      } catch (execError) {
        // execCommand failed
      }
      
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 2000);
        return true;
      }
      
      // Method 3: Try to select text in the existing textarea
      const existingTextarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
      if (existingTextarea) {
        existingTextarea.focus();
        existingTextarea.select();
        existingTextarea.setSelectionRange(0, existingTextarea.value.length);
        
        try {
          successful = document.execCommand('copy');
          if (successful) {
            setCopyStatus('success');
            setTimeout(() => setCopyStatus('idle'), 2000);
            return true;
          }
        } catch (execError) {
          // execCommand on existing textarea failed
        }
      }
      
      // Method 4: Show manual copy instructions
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 5000);
      
      // Show a modal with instructions
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      
      modal.innerHTML = `
        <div style="
          background: white;
          padding: 24px;
          border-radius: 12px;
          max-width: 500px;
          margin: 20px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        ">
          <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px;">
            Manual Copy Required
          </h3>
          <p style="margin: 0 0 16px 0; color: #6b7280; line-height: 1.5;">
            Automatic copy is not available. Please use one of these methods:
          </p>
          <div style="margin: 16px 0;">
            <button id="selectAllBtn" style="
              background: #6366f1;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              margin-right: 8px;
              font-size: 14px;
            ">Select All Text</button>
            <button id="closeModalBtn" style="
              background: #6b7280;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            ">Close</button>
          </div>
          <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 12px;">
            After selecting, press Ctrl+C (or Cmd+C on Mac) to copy.
          </p>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Add event listeners
      const selectAllBtn = modal.querySelector('#selectAllBtn');
      const closeModalBtn = modal.querySelector('#closeModalBtn');
      
      selectAllBtn?.addEventListener('click', () => {
        if (existingTextarea) {
          existingTextarea.focus();
          existingTextarea.select();
          existingTextarea.setSelectionRange(0, existingTextarea.value.length);
        }
      });
      
      closeModalBtn?.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      // Auto-close after 10 seconds
      setTimeout(() => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
      }, 10000);
      
      return false;
      
    } catch (error) {
      console.error('All copy methods failed:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
      return false;
    }
  };

  const { queryText, complexity, warnLevel } = useMemo(() => {
    if (!schema || !rootFieldName) {
      setVariableDefs([]);
      return { queryText: "", complexity: 0, warnLevel: "ok" as const };
    }
    const qField = rootQueryType(schema).getFields()[rootFieldName];

    // 1) Merge the current root args + tree selection under the chosen root field
    const mergedSelectionsBase = mergeRootArgsIntoSelections(
      rootFieldName,
      rootArgs,
      selection,
      qField?.args
    );

    // 2) For the search root, inline where/orderBy; keep pagination as variables
    let mergedSelections = mergedSelectionsBase;

    if (rootFieldName === "search" && mergedSelectionsBase.length === 1) {
      const only = mergedSelectionsBase[0];

      const literalArgs = (only.args ?? []).map((a) => {
        // Inline these:
        if (a.name === "where" || a.name === "orderBy") {
          return { ...a, literal: true };
        }
        // Keep variables for pagination, but allow nice variable names
        if (a.name === "first") {
          return { ...a, varName: "pageSize" }; // produces $pageSize
        }
        if (a.name === "after") {
          return { ...a, varName: "after" }; // produces $after
        }
        return a;
      });

      // Ensure default selection if empty
      const hasChildren = (only.children ?? []).length > 0;
      const defaultChildren = [
        { field: "total" },
        {
          field: "pageInfo",
          children: [{ field: "endCursor" }, { field: "hasNext" }],
        },
        {
          field: "results",
          children: [{ field: "url", children: [{ field: "path" }] }],
        },
      ];

      mergedSelections = [
        {
          ...only,
          args: literalArgs,
          children: hasChildren ? only.children : defaultChildren,
        },
      ];
    }

    // 2.1) For the layout root, ensure default selection (keep arguments as variables)
    if (rootFieldName === "layout" && mergedSelectionsBase.length === 1) {
      const only = mergedSelectionsBase[0];

      // Ensure default selection if empty
      const hasChildren = (only.children ?? []).length > 0;
      const defaultChildren = [
        {
          field: "item",
          children: [{ field: "rendered" }],
        },
      ];

      mergedSelections = [
        {
          ...only,
          children: hasChildren ? only.children : defaultChildren,
        },
      ];
    }

    // 3) Infer variables only from non-literal args (so `where`/`orderBy` do not create $vars)
    const varMap = collectVariablesFromSelections(
      schema,
      rootQueryType(schema),
      mergedSelections
    );
    const defs = Array.from(varMap.entries()).map(([name, { type, nonNull }]) =>
      makeVarDef(name, toNamedTypeNode(type), nonNull)
    );
    setVariableDefs(defs);

    // 4) Build and print
    const doc = buildOperation("query", rootFieldName, mergedSelections, defs);
    const printed = printDoc(doc);

    const comp = computeComplexity(schema, qField, mergedSelections);
    const warnLevel =
      comp >= DEFAULT_WEIGHTS.maxBlock
        ? "block"
        : comp >= DEFAULT_WEIGHTS.maxWarn
        ? "warn"
        : "ok";
    return { queryText: printed, complexity: comp, warnLevel };
  }, [schema, rootFieldName, JSON.stringify(rootArgs), JSON.stringify(selection)]);

  // Auto-computed variables from selection field args + root args (root wins on clashes)
  const computedVariables = useMemo(() => {
    const fromSelection = collectValuesFromSelections(selection, {});
    const merged: Record<string, unknown> = { ...fromSelection, ...rootArgs };
    // Only keep variables actually declared in the operation
    const opVarNames = new Set(variableDefs.map((d) => d.variable.name.value));
    const pruned: Record<string, unknown> = {};
    opVarNames.forEach((n) => {
      if (merged[n] !== undefined) pruned[n] = merged[n];
    });
    return pruned;
  }, [selection, rootArgs, variableDefs]);

  useEffect(() => {
    let names = variableDefs.map((d) => d.variable.name.value);
    if (!names.length)
      names = Array.from(
        new Set(
          Array.from((queryText || "").matchAll(/\$\w+/g)).map((m) =>
            m[0].slice(1)
          )
        )
      );
    setVariables((prev) => {
      const next: Record<string, unknown> = {};
      for (const n of names) next[n] = n in prev ? prev[n] : null;
      return next;
    });
  }, [variableDefs, queryText]);

  useEffect(() => {
    setVariables((prev) => {
      const next = { ...prev };
      const opVarNames = new Set(
        variableDefs.map((d) => d.variable.name.value)
      );
      for (const [k, v] of Object.entries(rootArgs)) {
        if (
          opVarNames.has(k) &&
          (next[k] === undefined || next[k] === null || next[k] === "")
        )
          next[k] = v as any;
      }
      return next;
    });
  }, [rootArgs, variableDefs]);

  async function runQuery() {
    if (!queryText) return;
    setLoading(true);
    setResult(null);
    
    // Get current credentials
    const xmCloudToken = appContext?.resourceAccess?.[0]?.context?.preview;
    const tokenToUse = xmCloudToken || "";
    const endpointToUse = process.env.NEXT_PUBLIC_XM_ENDPOINT || "";
    
    const r = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: endpointToUse,
        token: tokenToUse || undefined,
        query: queryText,
        variables: computedVariables, // <<< use auto variables
      }),
    });
    const json = await r.json();
    setResult(json);
    setLoading(false);
  }

  return (
    <div className="query-preview">
      <QueryPanel
        queryText={queryText}
        run={runQuery}
        canRun={!!queryText && warnLevel !== "block"}
        loading={loading}
        copy={() => copyToClipboard(queryText)}
      />

      {/* Copy Status Indicator */}
      {copyStatus !== 'idle' && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 16px',
          borderRadius: '8px',
          color: 'white',
          fontWeight: '500',
          fontSize: '14px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          background: copyStatus === 'success' ? '#10b981' : '#ef4444',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {copyStatus === 'success' ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Copied to clipboard!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Copy failed - try manual selection
            </>
          )}
        </div>
      )}

      <div style={{ marginTop: "32px" }}>
        <h3
          style={{
            margin: "0 0 16px 0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
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
            <path d="M12 2v20M2 12h20" />
          </svg>
          Complexity
        </h3>
        <ComplexityBar value={complexity} />
      </div>

      <div style={{ marginTop: "32px" }}>
        <h3
          style={{
            margin: "0 0 16px 0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
          </svg>
          Preview
        </h3>
        <div className="card">
          <pre
            style={{
              margin: 0,
              padding: "16px",
              fontSize: "0.875rem",
              lineHeight: 1.5,
              maxHeight: "300px",
              overflow: "auto",
              background: "var(--bg-tertiary)",
              border: "none",
              borderRadius: "6px",
            }}
          >
            {result ? JSON.stringify(result, null, 2) : "No result yet."}
          </pre>
        </div>
      </div>
    </div>
  );
}
