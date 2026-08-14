/**
 * Item cards (TEXT_BIBLE §3; slice contract deliverable 5). A card is folk
 * name header · one-line description · lore line, plus the polyphonic panel
 * showing the Church and State registers where they have a word for the
 * thing. Deliberate absences render as em-dash silence, never empty string.
 * Every string resolves through renderString — cards carry no literals.
 */

import { renderString, type RenderedString } from "./text";

export interface CardRender {
  readonly prefix: string;
  readonly header: RenderedString;
  readonly desc: RenderedString;
  readonly lore: RenderedString;
  readonly church: RenderedString;
  readonly state: RenderedString;
}

/** Pure card resolution — testable headless; the DOM builder only stamps it. */
export const renderCard = (
  prefix: string,
  options: { readonly textStep: number; readonly lock?: boolean },
): CardRender => ({
  prefix,
  header: renderString(`${prefix}.name`, options),
  desc: renderString(`${prefix}.desc`, options),
  lore: renderString(`${prefix}.lore`, options),
  church: renderString(`${prefix}.name`, { ...options, register: "church" }),
  state: renderString(`${prefix}.name`, { ...options, register: "state" }),
});

const line = (
  className: string,
  rendered: RenderedString,
  parent: HTMLElement,
  tag = "div",
): void => {
  const node = document.createElement(tag);
  node.className = className;
  if (rendered.stateRegister) {
    node.classList.add("hb-state-line");
  }
  if (rendered.absent) {
    node.classList.add("hb-absent");
  }
  node.textContent = rendered.text;
  parent.append(node);
};

export const buildItemCard = (
  card: CardRender,
): HTMLElement => {
  const root = document.createElement("article");
  root.className = "hud-card";
  root.dataset.testid = "hud-card";
  root.dataset.cardPrefix = card.prefix;

  line("hud-card-name", card.header, root, "h3");
  line("hud-card-desc", card.desc, root);
  line("hud-card-lore", card.lore, root);

  const panel = document.createElement("div");
  panel.className = "hud-card-registers";
  line("hud-card-church", card.church, panel);
  line("hud-card-state", card.state, panel);
  root.append(panel);

  return root;
};

/** Fixture gallery (?scene=hud&view=cards): the card families the slice ships. */
export const CARD_GALLERY: readonly string[] = [
  "item.weapon.hearth_iron",
  "item.tincture.vial",
  "item.ember",
  "item.charm.cedar_dog",
  "item.key.notebook",
  "item.key.open_page",
  "item.key.wardens_tag",
  "item.pouch.pulseleaf",
  "item.pouch.myrrh",
  "item.loot.wolf_meat",
];
