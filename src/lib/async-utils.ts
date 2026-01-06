/**
 * Async utility functions for concurrent operations
 */

/**
 * Process items in parallel with limited concurrency
 *
 * @param items - Array of items to process
 * @param batchSize - Number of items to process concurrently
 * @param processor - Async function to process each item
 * @returns Promise resolving to array of results
 *
 * @example
 * const urls = ['url1', 'url2', 'url3', 'url4', 'url5'];
 * const results = await processInBatches(urls, 2, async (url) => {
 *   return await fetch(url);
 * });
 */
export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}
