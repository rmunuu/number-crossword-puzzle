import { useEffect } from "react";
import type { CellValue } from "../data/puzzle";
import { normalizeInput } from "../utils/normalizeInput";
import type { NavigationDirection } from "./usePuzzleInput";

interface UseKeyboardInputArgs {
  enabled: boolean;
  onClear: () => void;
  onInput: (value: CellValue) => void;
  onMove: (direction: NavigationDirection) => void;
}

function isEditingElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable || tagName === "input" || tagName === "select" || tagName === "textarea";
}

export function useKeyboardInput({
  enabled,
  onClear,
  onInput,
  onMove
}: UseKeyboardInputArgs): void {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (isEditingElement(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        onClear();
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        onMove("up");
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        onMove("down");
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onMove("left");
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        onMove("right");
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        onMove(event.shiftKey ? "previous" : "next");
        return;
      }

      const normalizedInput = normalizeInput(event.key);
      if (normalizedInput !== null) {
        event.preventDefault();
        onInput(normalizedInput);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onClear, onInput, onMove]);
}
