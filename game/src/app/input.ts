import type { InputAction, InputSnapshot } from "../sim/input";

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
  private readonly pressed = new Set<InputAction>();

  public constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
  }

  public snapshot(): InputSnapshot {
    return {
      attack: this.pressed.has("attack"),
      flask: this.pressed.has("flask"),
      roll: this.pressed.has("roll"),
    };
  }

  public dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
  }

  private readonly onBlur = (): void => {
    this.pressed.clear();
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) {
      return;
    }
    const action = actionForCode(event.code);
    if (action !== undefined) {
      this.pressed.add(action);
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const action = actionForCode(event.code);
    if (action !== undefined) {
      this.pressed.delete(action);
    }
  };
}
