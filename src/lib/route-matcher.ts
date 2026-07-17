import { NextRequest } from "next/server";

export function createRouteMatcher(patterns: string[]) {
  // Separate regular paths from exclusion paths (prefixed with !)
  const includePatterns: string[] = [];
  const excludePatterns: string[] = [];

  patterns.forEach((pattern) => {
    if (pattern.startsWith("!")) {
      excludePatterns.push(pattern.slice(1)); // Remove the '!'
    } else {
      includePatterns.push(pattern);
    }
  });

  // Convert standard patterns to regex (handling wildcards)
  const includeRegexes = includePatterns.map(
    (p) => new RegExp(`^${p.replace(/\*/g, ".*")}$`),
  );

  // Convert exclusion patterns to regex (handling wildcards)
  const excludeRegexes = excludePatterns.map(
    (p) => new RegExp(`^${p.replace(/\*/g, ".*")}$`),
  );

  return (request: NextRequest) => {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // First check: If it matches any exclusion rule, it is NOT protected
    const isExcluded = excludeRegexes.some((regex) => regex.test(pathname));
    if (isExcluded) return false;

    // Second check: If it matches standard inclusion rules, it IS protected
    return includeRegexes.some((regex) => regex.test(pathname));
  };
}
