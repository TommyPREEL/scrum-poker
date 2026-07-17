import { useEffect, useRef } from "react";

// setInterval déclaratif : évite les closures obsolètes en gardant le
// dernier callback dans une ref, et se nettoie proprement au démontage.
// Passer `delayMs` à null met le polling en pause (ex: hors de la room).
export function useInterval(callback, delayMs) {
  const savedRef = useRef(callback);

  useEffect(() => {
    savedRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs == null) return;
    const id = setInterval(() => savedRef.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}
