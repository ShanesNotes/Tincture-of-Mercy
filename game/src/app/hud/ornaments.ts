/**
 * Procedural border cells from the Ironwood atlas families (HB11: filigree,
 * thorn, pine-scale — HUD and world one workshop; slice contract: procedural/
 * SVG cells are correct, final ornament art is a non-goal). All cells are
 * pure line-work in ink; gold appears only on the lit-Hearth seal (HB9).
 *
 * Every cell is an inline SVG string stamped into the DOM by border.ts.
 */

const svg = (body: string, viewBox = "0 0 24 24"): string =>
  `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1" ` +
  `stroke-linecap="round" aria-hidden="true">${body}</svg>`;

/** Corner flourish — scroll-filigree family, one per corner (rotated by CSS). */
export const cornerFlourish = (): string =>
  svg(
    `<path d="M2 22 V6 Q2 2 6 2 H22"/>` +
      `<path d="M5 22 V8 Q5 5 8 5 H22"/>` +
      `<path d="M8 12 Q8 8 12 8 Q15 8 15 11 Q15 13 13 13 Q11 13 11 11"/>` +
      `<circle cx="6.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>`,
  );

/** Bare thorn column cell — danger/wild zone character (HB2). */
export const thornCell = (): string =>
  svg(
    `<path d="M12 2 V22"/>` +
      `<path d="M12 7 L7 4"/>` +
      `<path d="M12 12 L17 9"/>` +
      `<path d="M12 17 L7 14"/>`,
  );

/** Carved-warmth column cell — domestic zone character (filigree scroll, HB2). */
export const filigreeCell = (): string =>
  svg(
    `<path d="M12 2 V22"/>` +
      `<path d="M12 6 Q7 6 7 10 Q7 13 10 13 Q12 13 12 11"/>` +
      `<path d="M12 18 Q17 18 17 14 Q17 11 14 11 Q12 11 12 13"/>`,
  );

/** Pine-scale column cell — the third atlas family, used on the footer rule. */
export const pineScaleCell = (): string =>
  svg(
    `<path d="M2 20 Q7 8 12 8 Q17 8 22 20"/>` +
      `<path d="M6 20 Q9 12 12 12 Q15 12 18 20"/>` +
      `<path d="M10 20 Q11 16 12 16 Q13 16 14 20"/>`,
  );

/** A single Tincture dose — countable drop emblem, footer-left (HB4). */
export const dropEmblem = (filled: boolean): string =>
  svg(
    `<path d="M12 3 Q17 10 17 14 A5 5 0 0 1 7 14 Q7 10 12 3 Z"` +
      (filled ? ` fill="currentColor"` : "") +
      `/>`,
  );

/** One tally stroke; the fifth stroke of a group slashes across (HB4 graphite hand). */
export const tallyMark = (slash: boolean): string =>
  slash
    ? svg(`<path d="M3 20 L21 6"/>`, "0 0 24 24")
    : svg(`<path d="M12 4 V20"/>`, "0 0 24 24");

/** Colophon mark — the workshop sign at the foot of the page (HB2). */
export const colophonMark = (): string =>
  svg(
    `<circle cx="12" cy="12" r="8"/>` +
      `<path d="M12 4 V20 M4 12 H20"/>` +
      `<circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>`,
  );

/** The lit-Hearth vigil seal — the border's one licensed gold element (HB9, CM19). */
export const vigilSeal = (): string =>
  svg(
    `<circle cx="12" cy="12" r="9"/>` +
      `<circle cx="12" cy="12" r="5.5"/>` +
      `<path d="M12 1.5 V5 M12 19 V22.5 M1.5 12 H5 M19 12 H22.5"/>` +
      `<path d="M12 8.5 Q14 11 14 13 A2 2 0 0 1 10 13 Q10 11 12 8.5 Z" fill="currentColor" stroke="none"/>`,
  );

/** The unwritten-tag mark — stamped tin outline, empty centre (CM40: the border accuses gently). */
export const unwrittenTagMark = (): string =>
  svg(
    `<rect x="5" y="8" width="14" height="9" rx="1.5"/>` +
      `<circle cx="8" cy="12.5" r="1"/>` +
      `<path d="M11 11.5 H17 M11 14 H15" stroke-dasharray="1.5 1.5"/>`,
  );
