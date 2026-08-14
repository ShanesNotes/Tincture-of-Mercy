/**
 * Menu DOM builders (slice contract deliverable 6). Menus live inside the
 * border apparatus — the death overlay is a border state, not a modal box —
 * and emit intents only (no persistence; s15 owns saves). All visible text
 * resolves through renderString at the model's current textStep, so Ember's
 * Numbness degrades the menus too.
 */

import { bibleEntry } from "../hud/bible";
import { renderEntry, renderString, type RenderedString } from "../hud/text";
import type { MenuIntentHandler } from "./intents";
import {
  bindingLabelKey,
  deathOverlayKeys,
  HEARTH_VERBS,
  MENU_CHROME,
  type MenuChromeId,
  type SettingsModel,
} from "./logic";

export interface MenuTextContext {
  readonly textStep: number;
  readonly lock?: boolean;
}

/**
 * Resolve a UI string: the text bible where it authors the key, the menu
 * chrome table otherwise (see the chrome note in logic.ts). Both paths run
 * through the same Numbness ladder.
 */
export const renderUiString = (
  key: string,
  context: MenuTextContext,
): RenderedString => {
  if (bibleEntry(key) !== undefined) {
    return renderString(key, context);
  }
  const chrome = MENU_CHROME[key as MenuChromeId];
  if (chrome === undefined) {
    return renderString(key, context); // yields the em-dash absence, loudly testable
  }
  return renderEntry(key, chrome, context);
};

const label = (
  node: HTMLElement,
  key: string,
  context: MenuTextContext,
): void => {
  const rendered = renderUiString(key, context);
  node.textContent = rendered.text;
  if (rendered.stateRegister) {
    node.classList.add("hb-state-line");
  }
};

const button = (
  key: string,
  context: MenuTextContext,
  onClick: () => void,
  testid: string,
): HTMLButtonElement => {
  const node = document.createElement("button");
  node.type = "button";
  node.className = "hud-menu-button";
  node.dataset.testid = testid;
  label(node, key, context);
  node.addEventListener("click", onClick);
  return node;
};

const shell = (kind: string): HTMLElement => {
  const root = document.createElement("section");
  root.className = `hud-menu hud-menu-${kind}`;
  root.dataset.testid = `hud-menu-${kind}`;
  root.setAttribute("role", "dialog");
  return root;
};

/** Pause menu: resume / settings / quit intents (contract deliverable 6). */
export const buildPauseMenu = (
  context: MenuTextContext,
  onIntent: MenuIntentHandler,
): HTMLElement => {
  const root = shell("pause");
  root.append(
    button("ui.menu.resume", context, () => onIntent({ type: "resume" }), "menu-resume"),
    button("ui.menu.settings", context, () => onIntent({ type: "open-settings" }), "menu-settings"),
    button("ui.menu.quit", context, () => onIntent({ type: "quit-to-title" }), "menu-quit"),
  );
  return root;
};

/**
 * Settings panel: audio buses, reduced-feedback toggle, gamepad remap table
 * display. Everything emits intents; nothing persists (slice non-goal).
 */
export const buildSettingsPanel = (
  model: SettingsModel,
  context: MenuTextContext,
  onIntent: MenuIntentHandler,
): HTMLElement => {
  const root = shell("settings");

  const buses = document.createElement("div");
  buses.className = "hud-settings-buses";
  for (const bus of model.buses) {
    const row = document.createElement("label");
    row.className = "hud-settings-row";
    const name = document.createElement("span");
    label(name, `ui.settings.bus.${bus.id}`, context);
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = String(bus.value);
    slider.dataset.testid = `settings-bus-${bus.id}`;
    slider.addEventListener("change", () =>
      onIntent({ type: "set-audio-bus", bus: bus.id, value: Number(slider.value) }),
    );
    row.append(name, slider);
    buses.append(row);
  }
  root.append(buses);

  const feedbackRow = document.createElement("label");
  feedbackRow.className = "hud-settings-row";
  const feedbackLabel = document.createElement("span");
  label(feedbackLabel, "ui.settings.reduced_feedback", context);
  const toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.checked = model.reducedFeedback;
  toggle.dataset.testid = "settings-reduced-feedback";
  toggle.addEventListener("change", () =>
    onIntent({ type: "set-reduced-feedback", enabled: toggle.checked }),
  );
  feedbackRow.append(feedbackLabel, toggle);
  root.append(feedbackRow);

  const table = document.createElement("table");
  table.className = "hud-remap-table";
  table.dataset.testid = "settings-remap";
  for (const binding of model.bindings) {
    const row = document.createElement("tr");
    const action = document.createElement("td");
    label(action, bindingLabelKey(binding.action), context);
    const control = document.createElement("td");
    const controlButton = button(
      "ui.settings.remap",
      context,
      () => onIntent({ type: "remap-gamepad", action: binding.action }),
      `settings-remap-${binding.action}`,
    );
    controlButton.prepend(`${binding.control} — `);
    control.append(controlButton);
    row.append(action, control);
    table.append(row);
  }
  root.append(table);

  root.append(
    button("ui.menu.back", context, () => onIntent({ type: "close-settings" }), "menu-back"),
  );
  return root;
};

/**
 * Death overlay — "the page falls open". Border-integrated: it is a page-area
 * treatment inside the manuscript frame (the border stays awake around it),
 * never a modal box. Graphite-hand lines from the text bible only.
 */
export const buildDeathOverlay = (
  pageLost: boolean,
  context: MenuTextContext,
  onIntent: MenuIntentHandler,
): HTMLElement => {
  const root = shell("death");
  const lines = document.createElement("div");
  lines.className = "hud-death-lines";
  deathOverlayKeys(pageLost).forEach((key, index) => {
    const lineNode = document.createElement("p");
    lineNode.className = index === 0 ? "hud-death-line hud-death-line-main" : "hud-death-line";
    lineNode.dataset.testid = "hud-death-line";
    label(lineNode, key, context);
    lines.append(lineNode);
  });
  root.append(lines);
  root.append(
    button("ui.recovery.respawn", context, () => onIntent({ type: "death-acknowledged" }), "menu-respawn"),
  );
  return root;
};

/**
 * Hearth menu skeleton: the rest verbs (TEXT_BIBLE §5) wired to scene-system
 * intent events (HEARTH_VERBS mapping). No state is mutated here.
 */
export const buildHearthMenu = (
  hearthId: string,
  context: MenuTextContext,
  onIntent: MenuIntentHandler,
): HTMLElement => {
  const root = shell("hearth");
  for (const verb of HEARTH_VERBS) {
    root.append(
      button(
        verb.key,
        context,
        () => onIntent({ type: verb.intent, hearthId }),
        `hearth-verb-${verb.intent}`,
      ),
    );
  }
  return root;
};
