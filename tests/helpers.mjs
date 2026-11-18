// Small builders for the unit tests: people, versions as stored, and items as people read them.
// Nothing here touches a database.

export const ADA = { email: "ada@example.com", name: "Ada" };
export const BEN = { email: "ben@example.com", name: "Ben" };
export const EDITH = { email: "edith@example.com", name: "Edith" };

export const DAY = 24 * 60 * 60 * 1000;
/** An ISO date `days` days before a fixed moment, so that tests do not depend on the clock. */
export const daysAgo = (days) => new Date(Date.parse("2026-11-13T09:00:00.000Z") - days * DAY).toISOString();

/** A part whose text is inside the harness. */
export const text = (name, body, kind = "skill", more = {}) => ({ kind, name, body, ...more });
/** A part as it is stored once it is a piece: the link, and the name the piece had when the harness was saved. */
export const link = (piece, name = piece, kind = "skill") => ({ kind, name, body: "", piece });

/** A version as stored. */
export function fields(over = {}) {
  const { content, ...rest } = over;
  return { name: "Harness", goal: "A goal.", description: "What it does.", kind: "harness", ...rest, content: { prompt: "Do the thing.", variables: [], parts: [], ...(content ?? {}) } };
}

/** An item as people read it: a harness by default, a piece with `kind`. */
export function view(over = {}) {
  const { content, text: textOver, ...rest } = over;
  const savedAt = rest.savedAt ?? daysAgo(10);
  const savedBy = rest.savedBy ?? rest.owner ?? ADA;
  const itsText = { by: savedBy, at: savedAt, note: rest.note ?? "first version", version: 1, nameBy: savedBy, whenBy: savedBy, ...(textOver ?? {}) };
  return {
    slug: "h",
    kind: "harness",
    name: "Harness",
    goal: "A goal.",
    description: "",
    owner: ADA,
    editors: [],
    ownEditors: [],
    madeFor: null,
    version: 1,
    latest: 1,
    note: "first version",
    savedAt,
    savedBy,
    copiedFrom: null,
    openSuggestions: 0,
    archived: false,
    runs: 0,
    cleanRuns: 0,
    lastRunAt: null,
    ...rest,
    text: itsText,
    // As the store fills it in when the name and the timing never changed: the last change is the text's.
    lastChange: rest.lastChange ?? { by: itsText.by, at: itsText.at, note: itsText.note, version: itsText.version },
    content: { prompt: "Do the thing.", variables: [], parts: [], ...(content ?? {}) },
  };
}

/** A part of a harness as people read it: its piece's name and text filled in, and whose words it is. */
export function part(piece, over = {}) {
  const p = {
    kind: "skill",
    name: "Voice",
    body: "Short sentences.",
    piece,
    by: ADA,
    pieceVersion: 1,
    savedBy: ADA,
    pieceSavedAt: daysAgo(10),
    pieceNote: "Made for h",
    textVersion: 1,
    madeFor: "h",
    ownText: true,
    ...over,
  };
  // As the store fills it in when the name and the timing never changed: the last change is the text's.
  // A test of a rename or a new timing gives `pieceChange` itself.
  return { ...p, pieceChange: over.pieceChange ?? { by: p.savedBy, at: p.pieceSavedAt, note: p.pieceNote, version: p.textVersion } };
}
