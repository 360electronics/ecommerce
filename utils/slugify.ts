/**
 * Converts a string into a URL-friendly slug.
 * - Lowercases the string
 * - Trims leading/trailing spaces
 * - Removes non-alphanumeric characters (except spaces and hyphens)
 * - Replaces spaces with hyphens
 * - Collapses multiple hyphens into one
 * 
 * @param text - The input string to slugify
 * @returns The slugified string
 */
export function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Remove invalid chars
      .replace(/\s+/g, "-")         // Replace spaces with -
      .replace(/-+/g, "-");         // Collapse multiple -
  }
  