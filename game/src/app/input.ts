import type { InputAction, SampledInputEdge } from "../sim/input";

const actionForCode = (code: string): InputAction | undefined => {
  switch (code) {
    case "Space":
      return "attack";
    case "ShiftLeft":
    case "ShiftRight":
      return "roll";
    case "KeyR":
      return "flask";
    default:
      return undefined;
  }
};

export class BrowserInputSource {
  private readonly latchedEdges: SampledInputEdge[] = [];
  private readonly pressedCodes = new Set<string>();

  public constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
  }

  public drainLatchedEdges(): readonly SampledInputEdge[] {
    return this.latchedEdges.splice(0);
  }

  public dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
  }

  private readonly onBlur = (): void => {
    this.latchedEdges.length = 0;
    this.pressedCodes.clear();
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat || this.pressedCodes.has(event.code)) {
      return;
    }
    const action = actionForCode(event.code);
    if (action !== undefined) {
      const wasPressed = this.isActionPressed(action);
      this.pressedCodes.add(event.code);
      if (!wasPressed) {
        this.latchedEdges.push({ action, pressed: true });
      }
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const action = actionForCode(event.code);
    if (action !== undefined && this.pressedCodes.delete(event.code)) {
      if (!this.isActionPressed(action)) {
        this.latchedEdges.push({ action, pressed: false });
      }
    }
  };

  private isActionPressed(action: InputAction): boolean {
    for (const code of this.pressedCodes) {
      if (actionForCode(code) === action) {
        return true;
      }
    }
    return false;
  }
}
