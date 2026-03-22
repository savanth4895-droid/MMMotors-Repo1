import { useEffect, useRef } from 'react';

/**
 * useDraft — auto-saves form state to localStorage and restores on mount.
 * 
 * @param {string} key        - unique key for this draft (e.g. "draft_create_invoice")
 * @param {object} state      - the current form state object
 * @param {function} setState - the setter to restore draft on mount
 * @param {object} emptyState - the blank/reset state (used to detect if draft is empty)
 * @param {function} onRestore- optional callback after draft is restored
 */
export function useDraft(key, state, setState, emptyState, onRestore) {
  const isMounted = useRef(false);

  // On mount: restore draft if one exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if at least one field has content
        const hasContent = Object.values(parsed).some(v =>
          v !== '' && v !== null && v !== undefined &&
          !(Array.isArray(v) && v.length === 0)
        );
        if (hasContent) {
          setState(parsed);
          if (onRestore) onRestore(parsed);
        }
      }
    } catch (e) { /* ignore corrupt drafts */ }
    isMounted.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On state change: save to localStorage (skip first render)
  useEffect(() => {
    if (!isMounted.current) return;
    try {
      // Don't save if state matches empty state exactly
      const isEmpty = Object.keys(emptyState).every(
        k => state[k] === emptyState[k] || (emptyState[k] === '' && !state[k])
      );
      if (isEmpty) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (e) { /* ignore storage errors */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // clearDraft — call this after successful submit or explicit cancel
  const clearDraft = () => {
    localStorage.removeItem(key);
  };

  return { clearDraft };
}

/**
 * useDraftArray — same as useDraft but for array state (e.g. billItems)
 */
export function useDraftArray(key, items, setItems) {
  const isMounted = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch (e) {}
    isMounted.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;
    try {
      if (items.length === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(items));
      }
    } catch (e) {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const clearDraft = () => localStorage.removeItem(key);
  return { clearDraft };
}
