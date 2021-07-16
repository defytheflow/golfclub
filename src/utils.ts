import React, { Dispatch, ReducerState, ReducerAction } from 'react';
import { Row } from './types';

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

export function callAll<T, R>(...fns: Array<(...args: T[]) => R | undefined>) {
  return (...args: T[]) => fns.forEach(fn => fn && fn(...args));
}

export const cleanHI = (value: string) => Number(value.replace(',', '.')).toFixed(2);

export const cleanPercent = (value: string) => String(Number(cleanHI(value)));

export function cleanValue(field: keyof Row, value: string) {
  value = value.trim();

  if (field === 'hi' && value !== '') {
    value = cleanHI(value);
  }

  if (field === 'number' && value !== '') {
    const zeros = 6 - value.length;
    if (zeros) {
      for (let i = 0; i < zeros; i++) {
        value = '0' + value;
      }
    }
  }

  return value;
}

export function createRow(
  order: number,
  number: string,
  name: string,
  gender: string,
  hi: string
) {
  return { order, number, name, gender, hi };
}

export function createColumn(order: number, width: number, percent?: number) {
  return { order, width, ...(percent && { percent }) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useReducerLogger<S, D extends React.Dispatch<any>>([state, dispatch]: [
  S,
  D
]): [S, D] {
  const newDispatch = React.useCallback(
    action => {
      console.log('DISPATCH', action);
      dispatch(action);
    },
    [dispatch]
  );
  return [state, newDispatch as D];
}
