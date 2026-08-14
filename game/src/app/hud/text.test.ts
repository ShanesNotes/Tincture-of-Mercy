/**
 * renderString coverage (slice contract test row: "renderString ladder +
 * lock behavior"). All expectations are against the shipping bible content
 * (TEXT_BIBLE §2 before/after table rows are quoted verbatim).
 */

import { describe, expect, it } from "vitest";

import { ABSENT_MARK, renderString } from "./text";

describe("the Numbness ladder", () => {
  it("walks ui.death.message folk → degraded (TEXT_BIBLE §2 table verbatim)", () => {
    expect(renderString("ui.death.message", { textStep: 0 }).text).toBe("The page falls open.");
    expect(renderString("ui.death.message", { textStep: 2 }).text).toBe("Page open.");
    expect(renderString("ui.death.message", { textStep: 3 }).text).toBe(
      "Outcome failure recorded.",
    );
  });

  it("falls back down the ladder when a step is not authored", () => {
    // item.pouch.pulseleaf.name authors numb2/numb3 only: step 1 holds folk.
    expect(renderString("item.pouch.pulseleaf.name", { textStep: 1 }).text).toBe("Pulseleaf");
    expect(renderString("item.pouch.pulseleaf.name", { textStep: 2 }).text).toBe(
      "Pulseleaf (LOL)",
    );
    expect(renderString("item.pouch.pulseleaf.name", { textStep: 3 }).text).toBe("LOL");
  });

  it("L-T2: lines without numb variants never degrade and never take State styling", () => {
    const spoken = renderString("npc.anna.water", { textStep: 3 });
    expect(spoken.text).toBe("Just the wet on my lip. Don't spend it all on me.");
    expect(spoken.stateRegister).toBe(false);
  });

  it('"" at a step means the line is not shown at all (lore lines die)', () => {
    expect(renderString("item.key.open_page.lore", { textStep: 1 }).absent).toBe(false);
    const dead = renderString("item.key.open_page.lore", { textStep: 2 });
    expect(dead.absent).toBe(true);
    expect(dead.text).toBe(ABSENT_MARK);
  });

  it("clamps out-of-range steps", () => {
    expect(renderString("ui.death.message", { textStep: 99 }).text).toBe(
      "Outcome failure recorded.",
    );
    expect(renderString("ui.death.message", { textStep: -2 }).text).toBe("The page falls open.");
  });
});

describe("register locks (L-T4)", () => {
  it("lock forces step-0 folk whatever the textStep", () => {
    const locked = renderString("ui.death.message", { textStep: 3, lock: true });
    expect(locked.text).toBe("The page falls open.");
    expect(locked.stateRegister).toBe(false);
  });
});

describe("explicit registers and deliberate absence", () => {
  it("renders Church and State panels where the register has a word", () => {
    expect(
      renderString("item.tincture.vial.name", { textStep: 0, register: "church" }).text,
    ).toBe("mercy you can carry");
    expect(
      renderString("item.tincture.vial.name", { textStep: 0, register: "state" }).text,
    ).toBe("E-3 stabilizer");
  });

  it("null is deliberate silence — em-dash, never empty string", () => {
    // The State has no word for the cedar dog (TEXT_BIBLE §1).
    const absent = renderString("item.charm.cedar_dog.name", { textStep: 0, register: "state" });
    expect(absent.absent).toBe(true);
    expect(absent.text).toBe(ABSENT_MARK);
    expect(absent.text).not.toBe("");
  });

  it("explicit-register panels ignore the ladder (the register says what it says)", () => {
    expect(
      renderString("item.tincture.vial.name", { textStep: 3, register: "church" }).text,
    ).toBe("mercy you can carry");
  });

  it("unknown keys render as absence, not a crash", () => {
    expect(renderString("ui.does.not.exist", { textStep: 0 }).absent).toBe(true);
  });
});

describe("HB8 State-register typography flag", () => {
  it("explicit State register is flagged", () => {
    expect(
      renderString("item.tincture.vial.name", { textStep: 0, register: "state" }).stateRegister,
    ).toBe(true);
  });

  it("Numbness step ≥2 degradation is flagged once the line leaves folk", () => {
    expect(renderString("ui.turn.rising", { textStep: 0 }).stateRegister).toBe(false);
    expect(renderString("ui.turn.rising", { textStep: 1 }).stateRegister).toBe(false);
    expect(renderString("ui.turn.rising", { textStep: 2 }).stateRegister).toBe(true);
    expect(renderString("ui.turn.rising", { textStep: 3 }).stateRegister).toBe(true);
  });
});

describe("{n} substitution", () => {
  it("fills State dose counts", () => {
    expect(
      renderString("item.ember.desc", { textStep: 0, register: "state", vars: { n: 2 } }).text,
    ).toBe("E-7. Units on hand: 2. Self-administration is within protocol.");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(
      renderString("ui.level.names_banked", { textStep: 0 }).text,
    ).toBe("Names: {n}");
  });
});
