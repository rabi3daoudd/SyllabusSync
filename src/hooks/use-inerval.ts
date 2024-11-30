import { useEffect, useRef } from 'react';

/**
 * useInterval Hook
 * Sets up an interval to call a callback function at specified delays.
 *
 * @param callback - The function to be called at each interval.
 * @param delay - The delay in milliseconds. Pass `null` to stop the interval.
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
