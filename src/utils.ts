export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

export function sortedIndex<T>(array: T[], value: T, compare: (a: T, b: T) => number) {
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = (low + high) >> 1;
    if (compare(array[mid], value) < 0) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}
