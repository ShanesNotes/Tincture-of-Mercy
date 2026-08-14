/**
 * HUD scene bootstrap — mounted additively behind `?scene=hud` in main.ts
 * (the s13 mount pattern). The border overlays the three.js canvas as a
 * fixed DOM layer; renderer internals are never touched (contract
 * deliverable 1). Until integration binds sim state, fixtures drive the
 * apparatus and `window.__hud.setState(...)` is the scripted-state seam the
 * e2e walks.
 *
 * Query params:
 *   ?scene=hud                     border over the canvas, default fixture
 *   &fixture=<name>                one of HUD_FIXTURES
 *   &view=cards                    item-card gallery in the page area
 *   &menu=pause|settings|death|hearth   open a menu (death adds &pageLost=1)
 */

import "../menus/menus.css";
import "./hud.css";

import { applyBorder, buildBorder } from "./border";
import { buildItemCard, CARD_GALLERY, renderCard } from "./cards";
import { descriptorFromModel, serializeDescriptor, type BorderDescriptor } from "./descriptor";
import { DEFAULT_FIXTURE, fixtureByName } from "./fixtures";
import { deriveHudModel } from "./model";
import { renderString } from "./text";
import type { HudInput } from "./types";
import type { MenuIntent } from "../menus/intents";
import { defaultSettings } from "../menus/logic";
import {
  buildDeathOverlay,
  buildHearthMenu,
  buildPauseMenu,
  buildSettingsPanel,
  type MenuTextContext,
} from "../menus/menus";

export interface HudSceneHandle {
  readonly setState: (input: HudInput) => void;
  readonly setFixture: (name: string) => void;
  readonly descriptor: () => BorderDescriptor;
  readonly openMenu: (menu: string | null) => void;
  readonly menu: () => string | null;
}

declare global {
  interface Window {
    __hud?: HudSceneHandle;
    __hudIntents?: MenuIntent[];
  }
}

type MenuKind = "pause" | "settings" | "death" | "hearth";

export interface HudSceneOptions {
  readonly mount: HTMLElement;
  readonly params: URLSearchParams;
  /** s19: the live Hearth the player is standing in, when the world is driving. */
  readonly hearthId?: () => string | null;
}

export const bootHudScene = (options: HudSceneOptions): HudSceneHandle => {
  const { mount, params } = options;

  const border = buildBorder(mount);
  const page = document.createElement("div");
  page.className = "hud-page";
  page.dataset.testid = "hud-page";
  border.querySelector<HTMLElement>(".hb-frame")?.append(page);

  let input: HudInput = fixtureByName(params.get("fixture"));
  let openMenuKind: MenuKind | null = null;

  const textContext = (): MenuTextContext => ({
    textStep: deriveHudModel(input).textStep,
    lock: input.registerLocked,
  });

  let renderedMenuKind: MenuKind | null | undefined;
  const renderMenus = (force = false): void => {
    // The border re-renders every sim tick once the world drives it. Tearing
    // the menu DOM down and rebuilding it sixty times a second is pure waste,
    // and it also destroys any focus the player has inside an open menu.
    if (!force && openMenuKind === renderedMenuKind) {
      return;
    }
    renderedMenuKind = openMenuKind;
    page.querySelectorAll(".hud-menu").forEach((node) => node.remove());
    if (openMenuKind === null) {
      return;
    }
    const context = textContext();
    const onIntent = (intent: MenuIntent): void => {
      (window.__hudIntents ??= []).push(intent);
      window.dispatchEvent(new CustomEvent<MenuIntent>("hud-intent", { detail: intent }));
      if (intent.type === "resume" || intent.type === "close-settings" || intent.type === "death-acknowledged") {
        openMenuKind = null;
        renderMenus();
      } else if (intent.type === "open-settings") {
        openMenuKind = "settings";
        renderMenus();
      }
    };
    const menu =
      openMenuKind === "pause"
        ? buildPauseMenu(context, onIntent)
        : openMenuKind === "settings"
          ? buildSettingsPanel(defaultSettings(), context, onIntent)
          : openMenuKind === "death"
            ? buildDeathOverlay(params.get("pageLost") === "1", context, onIntent)
            : buildHearthMenu(options.hearthId?.() ?? params.get("hearth") ?? "cabin", context, onIntent);
    page.append(menu);
  };

  let renderedDescriptor: string | undefined;
  let renderedTextStep: number | undefined;
  const render = (): void => {
    const model = deriveHudModel(input);
    const descriptor = descriptorFromModel(model);
    const verdict =
      descriptor.footerKey === null
        ? null
        : renderString(descriptor.footerKey, {
            textStep: model.textStep,
            lock: input.registerLocked,
          });
    applyBorder(border, descriptor, verdict);
    document.body.dataset.hudFixture = params.get("fixture") ?? DEFAULT_FIXTURE;
    const serialized = serializeDescriptor(descriptor);
    if (serialized !== renderedDescriptor) {
      renderedDescriptor = serialized;
      document.body.dataset.hudBorder = serialized;
    }
    const textStepChanged = model.textStep !== renderedTextStep;
    renderedTextStep = model.textStep;
    renderMenus(textStepChanged);
  };

  const renderGallery = (): void => {
    if (params.get("view") !== "cards") {
      return;
    }
    const gallery = document.createElement("div");
    gallery.className = "hud-card-gallery";
    gallery.dataset.testid = "hud-card-gallery";
    const context = textContext();
    for (const prefix of CARD_GALLERY) {
      gallery.append(buildItemCard(renderCard(prefix, context)));
    }
    page.append(gallery);
  };

  const handle: HudSceneHandle = {
    setState: (next) => {
      input = next;
      render();
    },
    setFixture: (name) => {
      input = fixtureByName(name);
      render();
    },
    descriptor: () => descriptorFromModel(deriveHudModel(input)),
    openMenu: (menu) => {
      openMenuKind =
        menu === "pause" || menu === "settings" || menu === "death" || menu === "hearth"
          ? menu
          : null;
      renderMenus();
    },
    menu: () => openMenuKind,
  };

  window.__hud = handle;
  window.__hudIntents = [];

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      openMenuKind = openMenuKind === null ? "pause" : null;
      renderMenus();
    }
  });

  const menuParam = params.get("menu");
  if (menuParam !== null) {
    handle.openMenu(menuParam);
  }
  render();
  renderGallery();

  document.body.dataset.hudMounted = "true";
  // The world boot path owns its own readiness signal; only the standalone
  // `?scene=hud` route is ready the moment the border is on screen.
  if (params.get("scene") === "hud") {
    document.body.dataset.bootStatus = "ready";
  }
  return handle;
};
