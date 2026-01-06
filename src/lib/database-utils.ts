/**
 * Database utility functions
 */

/**
 * Checks if the current database is SQLite based on the DATABASE_URL
 * @returns true if using SQLite, false otherwise
 */
export function isSQLiteDatabase(): boolean {
  return process.env.DATABASE_URL?.startsWith("file:") ?? false;
}
