import { nanoid } from "nanoid";

export const makeId = () => nanoid();

export const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']"),
  );
};

export const isShortcutCombo = (e: KeyboardEvent) => {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
};
