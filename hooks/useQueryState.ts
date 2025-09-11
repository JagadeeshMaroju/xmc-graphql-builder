import { useState, useEffect } from "react";
import { SearchCondition } from "@/components/search/SearchBuilder";

export function useQueryState() {
  const [rootFieldName, setRootFieldName] = useState<string | null>(null);
  const [rootArgs, setRootArgs] = useState<Record<string, unknown>>({});
  const [selection, setSelection] = useState<any[]>([]);

  // search-specific UI state
  const [searchGroup, setSearchGroup] = useState<"AND" | "OR">("AND");
  const [searchConds, setSearchConds] = useState<SearchCondition[]>([]);
  const [pageSize, setPageSize] = useState<number>(10);
  const [after, setAfter] = useState<string>("");

  useEffect(() => {
    if (!rootFieldName) return;

    // Clear query-building state
    setSelection([]);
    // Initialize default language for item queries
    setRootArgs(rootFieldName === "item" ? { language: "en" } : {});
    
    // Reset search UI state too
    setSearchGroup("AND");
    setSearchConds([]);
    setPageSize(10);
    setAfter("");
  }, [rootFieldName]);

  return {
    rootFieldName,
    setRootFieldName,
    rootArgs,
    setRootArgs,
    selection,
    setSelection,
    searchGroup,
    setSearchGroup,
    searchConds,
    setSearchConds,
    pageSize,
    setPageSize,
    after,
    setAfter,
  };
}
