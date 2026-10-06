import { asc, desc, type AnyColumn, type SQL } from "drizzle-orm";

// Shared query-string parsing for paginated admin list endpoints:
//   ?page=1&pageSize=25&q=search&sort=<key>&dir=asc|desc

const MAX_PAGE_SIZE = 100;

export interface ListParams<K extends string> {
  page: number;
  pageSize: number;
  offset: number;
  q: string;
  sortKey: K;
  order: (column: AnyColumn | SQL | SQL.Aliased) => SQL;
}

export function parseListParams<K extends string>(
  searchParams: URLSearchParams,
  sortKeys: readonly K[],
  defaults: { sortKey: K; dir?: "asc" | "desc"; pageSize?: number },
): ListParams<K> {
  // Non-numeric, zero or negative values fall back to the defaults
  const positiveInt = (value: string | null) => {
    const n = Math.floor(Number(value));
    return n > 0 ? n : null;
  };
  const page = positiveInt(searchParams.get("page")) ?? 1;
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    positiveInt(searchParams.get("pageSize")) ?? defaults.pageSize ?? 25,
  );
  const requestedSort = searchParams.get("sort") as K | null;
  const sortKey = requestedSort && sortKeys.includes(requestedSort) ? requestedSort : defaults.sortKey;
  const dirParam = searchParams.get("dir");
  const dir = dirParam === "asc" || dirParam === "desc" ? dirParam : defaults.dir ?? "desc";

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    q: searchParams.get("q")?.trim() ?? "",
    sortKey,
    order: (column) => (dir === "asc" ? asc(column) : desc(column)),
  };
}

// Escape LIKE wildcards in user input and wrap for a "contains" match
export const likeContains = (term: string) => `%${term.replace(/[%_\\]/g, "\\$&")}%`;
