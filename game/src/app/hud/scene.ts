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

  const renderMenus = (): void => {
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
            : buildHearthMenu(params.get("hearth") ?? "cabin", context, onIntent);
    page.append(menu);
  };

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
    document.body.dataset.hudBorder = serializeDescriptor(descriptor);
    renderMenus();
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
  document.body.dataset.bootStatus = "ready";
  return handle;
};
