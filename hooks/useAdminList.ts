"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AdminListQuery<S extends string> {
  page: number;
  pageSize: number;
  q: string;
  sort: S;
  dir: "asc" | "desc";
}

/**
 * State + fetching for a server-paginated admin list (EnhancedTable serverSide).
 * Endpoint must accept page/pageSize/q/sort/dir and return { data, total, stats? }.
 */
export function useAdminList<Row, Stats, S extends string = string>(
  endpoint: string,
  initial: Omit<AdminListQuery<S>, "page" | "q">,
  extraParams: Record<string, string> = {},
  mapRow: (row: any) => Row = (row) => row,
) {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true); // first load
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<AdminListQuery<S>>({ ...initial, page: 1, q: "" });
  const [searchInput, setSearchInput] = useState("");
  const requestIdRef = useRef(0);
  const extraKey = JSON.stringify(extraParams);
  const mapRowRef = useRef(mapRow);
  mapRowRef.current = mapRow;

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        ...JSON.parse(extraKey),
        page: String(query.page),
        pageSize: String(query.pageSize),
        sort: query.sort,
        dir: query.dir,
      });
      if (query.q) params.set("q", query.q);

      const res = await fetch(`${endpoint}?${params}`, { cache: "no-store" });
      const result = await res.json().catch(() => ({}));
      if (requestId !== requestIdRef.current) return; // stale response
      if (!res.ok) throw new Error(result.error || result.message || `Error ${res.status}`);

      setRows((result.data ?? []).map((r: any) => mapRowRef.current(r)));
      setTotal(result.total ?? 0);
      setStats(result.stats ?? null);
      setError(null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsFetching(false);
        setIsLoading(false);
      }
    }
  }, [endpoint, extraKey, query]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Debounce search → server query (back to page 1)
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((prev) =>
        prev.q === searchInput.trim() ? prev : { ...prev, q: searchInput.trim(), page: 1 },
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Props for EnhancedTable in server-side mode
  const tableProps = {
    search: { onSearch: setSearchInput },
    pagination: {
      serverSide: true,
      totalItems: total,
      onPageChange: (page: number) => setQuery((prev) => ({ ...prev, page })),
      onPageSizeChange: (pageSize: number) =>
        setQuery((prev) => ({ ...prev, pageSize, page: 1 })),
    },
    sorting: {
      serverSide: true,
      onSortChange: (sort: unknown, dir: "asc" | "desc") =>
        setQuery((prev) => ({ ...prev, sort: String(sort) as S, dir, page: 1 })),
    },
  };

  return { rows, total, stats, isLoading, isFetching, error, query, reload, tableProps };
}
