/**
 * The manuscript border apparatus (HB1–HB11). DOM/CSS overlay — chosen over a
 * canvas layer because the apparatus is typography-first (four font stacks,
 * State-register caps, em-dash silences) and its verdict states must be
 * image-diffable (L10/A5), both native to DOM/CSS; it overlays the three.js
 * canvas via fixed positioning and never touches renderer internals.
 *
 * Build once with {@link buildBorder}; every state change flows through
 * {@link applyBorder}, which consumes only a {@link BorderDescriptor}.
 */

import type { BorderDescriptor } from "./descriptor";
import type { RenderedString } from "./text";
import {
  colophonMark,
  cornerFlourish,
  dropEmblem,
  filigreeCell,
  pineScaleCell,
  tallyMark,
  thornCell,
  unwrittenTagMark,
  vigilSeal,
} from "./ornaments";

const MARGIN_CELLS = 7;

const el = (className: string, parent: HTMLElement): HTMLElement => {
  const node = document.createElement("div");
  node.className = className;
  parent.append(node);
  return node;
};

/** Build the static apparatus once; dynamic content is stamped by applyBorder. */
export const buildBorder = (mount: HTMLElement): HTMLElement => {
  const root = document.createElement("div");
  root.className = "hud-border";
  root.dataset.testid = "hud-border";
  root.setAttribute("aria-hidden", "false");

  const frame = el("hb-frame", root);

  for (const corner of ["nw", "ne", "se", "sw"] as const) {
    const node = el(`hb-corner hb-corner-${corner}`, frame);
    node.innerHTML = cornerFlourish();
  }

  // HB2/HB4: left margin = ornament column + the Pulse lit-vellum measure.
  const left = el("hb-margin hb-margin-left", frame);
  const pulse = el("hb-pulse", left);
  pulse.dataset.testid = "hud-pulse";
  el("hb-pulse-fill", pulse);
  const leftOrnaments = el("hb-ornaments", left);
  for (let i = 0; i < MARGIN_CELLS; i += 1) {
    el("hb-cell", leftOrnaments);
  }

  // HB4: right margin = Breath, the shorter responding measure.
  const right = el("hb-margin hb-margin-right", frame);
  const breath = el("hb-breath", right);
  breath.dataset.testid = "hud-breath";
  el("hb-breath-fill", breath);

  // HB2: footer verdict band; doses footer-left; colophon + Names footer-right.
  const footer = el("hb-footer", frame);
  const doses = el("hb-doses", footer);
  doses.dataset.testid = "hud-doses";
  const verdict = el("hb-verdict", footer);
  verdict.dataset.testid = "hud-verdict";
  const colophon = el("hb-colophon", footer);
  const seal = el("hb-seal", colophon);
  seal.dataset.testid = "hud-seal";
  seal.innerHTML = vigilSeal();
  const tallies = el("hb-tallies", colophon);
  tallies.dataset.testid = "hud-tallies";
  const mark = el("hb-colophon-mark", colophon);
  mark.innerHTML = colophonMark();
  const tag = el("hb-unwritten", colophon);
  tag.dataset.testid = "hud-unwritten-tag";
  tag.innerHTML = unwrittenTagMark();

  // Footer rule ornament (pine-scale family, HB11).
  const rule = el("hb-footer-rule", frame);
  for (let i = 0; i < MARGIN_CELLS * 2; i += 1) {
    const cell = el("hb-rule-cell", rule);
    cell.innerHTML = pineScaleCell();
  }

  mount.append(root);
  return root;
};

const stampOrnaments = (root: HTMLElement, family: "filigree" | "thorn"): void => {
  const svg = family === "filigree" ? filigreeCell() : thornCell();
  for (const cell of root.querySelectorAll<HTMLElement>(".hb-margin-left .hb-cell")) {
    cell.innerHTML = svg;
  }
};

const stampDoses = (root: HTMLElement, doses: number, maxDoses: number): void => {
  const holder = root.querySelector<HTMLElement>(".hb-doses");
  if (holder === null) {
    return;
  }
  holder.replaceChildren();
  for (let i = 0; i < maxDoses; i += 1) {
    const drop = document.createElement("span");
    drop.className = i < doses ? "hb-drop hb-drop-filled" : "hb-drop";
    drop.innerHTML = dropEmblem(i < doses);
    holder.append(drop);
  }
};

const stampTallies = (root: HTMLElement, groups: number, remainder: number): void => {
  const holder = root.querySelector<HTMLElement>(".hb-tallies");
  if (holder === null) {
    return;
  }
  holder.replaceChildren();
  for (let g = 0; g < groups; g += 1) {
    const group = document.createElement("span");
    group.className = "hb-tally-group";
    for (let s = 0; s < 4; s += 1) {
      const stroke = document.createElement("i");
      stroke.innerHTML = tallyMark(false);
      group.append(stroke);
    }
    const slash = document.createElement("i");
    slash.className = "hb-tally-slash";
    slash.innerHTML = tallyMark(true);
    group.append(slash);
    holder.append(group);
  }
  for (let r = 0; r < remainder; r += 1) {
    const stroke = document.createElement("i");
    stroke.className = "hb-tally-loose";
    stroke.innerHTML = tallyMark(false);
    holder.append(stroke);
  }
};

/**
 * Apply one descriptor. All state reads as data attributes + one CSS custom
 * property (the margin inset — the Turn narrowing geometry, all four sides)
 * so the A5 image-diff sees real layout change, and the e2e can assert state
 * without parsing pixels.
 */
export const applyBorder = (
  root: HTMLElement,
  descriptor: BorderDescriptor,
  verdict: RenderedString | null,
): void => {
  root.dataset.hearth = descriptor.hearth;
  root.dataset.zone = descriptor.zone;
  root.dataset.bossPhase = descriptor.bossPhase;
  root.dataset.numbness = String(descriptor.numbnessStep);
  root.dataset.turnStep = String(descriptor.turnStep);
  root.dataset.turned = String(descriptor.turned);
  root.dataset.unwrittenTag = String(descriptor.unwrittenTag);
  root.dataset.pulseStop = String(descriptor.pulseStop);
  root.dataset.breathStop = String(descriptor.breathStop);
  root.style.setProperty("--hb-inset", `${descriptor.marginInsetPx}px`);
  root.style.setProperty("--hb-pulse-fill", String(descriptor.pulseFraction));
  root.style.setProperty("--hb-breath-fill", String(descriptor.breathFraction));

  stampOrnaments(root, descriptor.ornamentFamily);
  stampDoses(root, descriptor.doses, descriptor.maxDoses);
  stampTallies(root, descriptor.tallyGroups, descriptor.tallyRemainder);

  const verdictNode = root.querySelector<HTMLElement>(".hb-verdict");
  if (verdictNode !== null) {
    verdictNode.textContent = verdict === null ? "" : verdict.text;
    verdictNode.dataset.register = verdict?.stateRegister === true ? "state" : "folk";
    verdictNode.classList.toggle("hb-absent", verdict?.absent === true);
  }
};
