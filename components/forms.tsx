"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  addPart,
  addTeammate,
  agentAccess,
  archive,
  createItem,
  visibility,
  editor,
  myValues,
  ownCopy,
  removeTeammate,
  saveAbout,
  saveVariables,
  teamNotes,
  type FormState,
} from "@/app/h/[slug]/actions";
import { useSaved } from "@/components/use-saved";
import type { HarnessView, ItemKind, Person, Variable } from "@/lib/hub/types";

/*
 * The forms of the dashboard. Each one opens from a small button, keeps what
 * was typed when a save is refused, and shows the Hub's answer next to its
 * buttons. Someone who may change the item saves a new version; anyone else
 * sends the same change to the owner as a suggestion.
 */

export type Mode = "save" | "suggest";

export const WHEN_OPTIONS = [
  ["start", "At the start"],
  ["before_tool", "Before a tool"],
  ["after_tool", "After a tool"],
  ["end", "At the end"],
] as const;
export const ICON_OPTIONS = [
  ["connector", "Connector"],
  ["browser", "Browser"],
  ["code", "Code"],
  ["send", "Send"],
] as const;
const KIND_OPTIONS = [
  ["skill", "Skill: how to judge or write something"],
  ["tool", "Tool: what the agent uses, and what it may do with it"],
  ["hook", "Hook: one rule at a set moment"],
  ["memory", "Memory: what is kept between runs"],
] as const;

/** The answer of the last attempt: grey when it went through, in the flag colour when it did not. */
function Status({ state, answered, link = "See it" }: { state: FormState; answered: boolean; link?: string }) {
  return (
    <span className={state.ok ? "mu" : "flag"} role="status">
      {answered && state.message}
      {answered && state.ok && state.href && (
        <>
          {" "}
          <Link href={state.href}>{link}</Link>
        </>
      )}
    </span>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <>
      <label className="mu" htmlFor={id}>
        {label}
      </label>
      {children}
    </>
  );
}

function Select({ id, name, value, onChange, options, none }: { id: string; name: string; value: string; onChange: (v: string) => void; options: readonly (readonly [string, string])[]; none?: string }) {
  return (
    <select id={id} name={name} className="fld" value={value} onChange={(e) => onChange(e.target.value)}>
      {none !== undefined && <option value="">{none}</option>}
      {options.map(([v, text]) => (
        <option key={v} value={v}>
          {text}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Name, goal and description of a harness; name, summary and timing of a piece
// ---------------------------------------------------------------------------

export function AboutForm({ h, mode }: { h: HarnessView; mode: Mode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(h.name);
  const [goal, setGoal] = useState(h.goal);
  const [description, setDescription] = useState(h.description);
  const [schedule, setSchedule] = useState(h.content.schedule ?? "");
  const [testedOn, setTestedOn] = useState(h.content.testedOn ?? "");
  const [when, setWhen] = useState<string>(h.content.when ?? "");
  const [icon, setIcon] = useState<string>(h.content.icon ?? "");
  const [note, setNote] = useState("");
  const { state, run, pending, answered, forget } = useSaved(saveAbout, () => {
    setOpen(false);
    setNote("");
  });
  const piece = h.kind !== "harness";

  if (!open) {
    return (
      <div className="inlinebar">
        <button
          type="button"
          className="btn sm"
          onClick={() => {
            setName(h.name);
            setGoal(h.goal);
            setDescription(h.description);
            setSchedule(h.content.schedule ?? "");
            setTestedOn(h.content.testedOn ?? "");
            setWhen(h.content.when ?? "");
            setIcon(h.content.icon ?? "");
            forget();
            setOpen(true);
          }}
        >
          {mode === "save" ? (piece ? "Edit name and summary" : "Edit name, goal and description") : "Suggest a change to these"}
        </button>
        <Status state={state} answered={answered} />
      </div>
    );
  }

  return (
    <form action={run} className="editform flat">
      <input type="hidden" name="slug" value={h.slug} />
      <input type="hidden" name="version" value={h.version} />
      <Field id="about-name" label="Name">
        <input id="about-name" name="name" className="fld" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      {!piece && (
        <Field id="about-goal" label="Goal: what the agent is for, in one sentence. The outcome, not the steps.">
          <input id="about-goal" name="goal" className="fld" maxLength={200} value={goal} onChange={(e) => setGoal(e.target.value)} />
        </Field>
      )}
      <Field id="about-description" label={piece ? "Summary: one line saying what it is for" : "What it does, in one or two short sentences"}>
        <textarea id="about-description" name="description" rows={2} maxLength={piece ? 200 : 300} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      {!piece && (
        <Field id="about-schedule" label="When it is meant to run, in one line (optional). Harness Hub runs nothing: each person's agent sets it up when they ask.">
          <input id="about-schedule" name="schedule" className="fld" maxLength={200} placeholder="At 06:44, Sunday through Thursday" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
        </Field>
      )}
      {!piece && (
        <Field id="about-tested" label="Works well on: the models and agents you tried it on, in one line (optional). Runs reported by model show next to it.">
          <input id="about-tested" name="tested_on" className="fld" maxLength={200} placeholder="Opus 5.5 in Claude; GPT-5 in Codex" value={testedOn} onChange={(e) => setTestedOn(e.target.value)} />
        </Field>
      )}
      {h.kind === "hook" && (
        <Field id="about-when" label="When the rule applies">
          <Select id="about-when" name="when" value={when} onChange={setWhen} options={WHEN_OPTIONS} none="Not said" />
        </Field>
      )}
      {h.kind === "tool" && (
        <Field id="about-icon" label="Icon">
          <Select id="about-icon" name="icon" value={icon} onChange={setIcon} options={ICON_OPTIONS} none="None" />
        </Field>
      )}
      <Field id="about-note" label={mode === "save" ? "What changed (one line, shown in the version list)" : "Your suggestion in one line (the owner sees this first)"}>
        <input id="about-note" name="note" className="fld" required maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="editbar">
        <button type="submit" className="btn pri sm" disabled={pending}>
          {pending ? "Sending…" : mode === "save" ? "Save as new version" : "Send suggestion"}
        </button>
        <button type="button" className="btn sm" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </button>
        <Status state={state} answered={answered && !state.ok} />
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Variables: what each person sets for their own run
// ---------------------------------------------------------------------------

export function VariablesForm({ slug, version, variables, mode }: { slug: string; version: number; variables: Variable[]; mode: Mode }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Variable[]>(variables);
  const [note, setNote] = useState("");
  const { state, run, pending, answered, forget } = useSaved(saveVariables, () => {
    setOpen(false);
    setNote("");
  });
  const change = (i: number, patch: Partial<Variable>) => setRows(rows.map((r, at) => (at === i ? { ...r, ...patch } : r)));

  if (!open) {
    return (
      <div className="inlinebar">
        <button
          type="button"
          className="btn sm"
          onClick={() => {
            setRows(variables);
            forget();
            setOpen(true);
          }}
        >
          {mode === "save" ? "Edit variables" : "Suggest a change to the variables"}
        </button>
        <Status state={state} answered={answered} />
      </div>
    );
  }

  return (
    <form action={run} className="editform flat">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="variables" value={JSON.stringify(rows)} />
      <p className="mu">
        The text uses a variable by its name in braces, like {"{handle}"}. Leave the default empty for anything personal: each
        person is then asked for it.
      </p>
      <div className="varrows">
        {rows.map((v, i) => (
          <div className="varrow" key={i}>
            <input aria-label="Name" className="fld mono" placeholder="name" maxLength={40} value={v.key} onChange={(e) => change(i, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} />
            <input aria-label="What to ask for" className="fld" placeholder="What to ask the person for" maxLength={200} value={v.label} onChange={(e) => change(i, { label: e.target.value })} />
            <input aria-label="Default" className="fld" placeholder="Default (empty = each person provides it)" maxLength={200} value={v.default ?? ""} onChange={(e) => change(i, { default: e.target.value })} />
            <button type="button" className="btn sm" onClick={() => setRows(rows.filter((_, at) => at !== i))} aria-label={`Remove the variable ${v.key || i + 1}`}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <div>
        <button type="button" className="btn sm" onClick={() => setRows([...rows, { key: "", label: "" }])} disabled={rows.length >= 30}>
          Add a variable
        </button>
      </div>
      <Field id="vars-note" label={mode === "save" ? "What changed (one line)" : "Your suggestion in one line"}>
        <input id="vars-note" name="note" className="fld" required maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="editbar">
        <button type="submit" className="btn pri sm" disabled={pending}>
          {pending ? "Sending…" : mode === "save" ? "Save as new version" : "Send suggestion"}
        </button>
        <button type="button" className="btn sm" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </button>
        <Status state={state} answered={answered && !state.ok} />
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// A new part: a piece from the library, or one written here for this harness
// ---------------------------------------------------------------------------

/** A piece that a harness could take on, as the list to choose from shows it. */
export type Pickable = { slug: string; name: string; kind: string; owner: string };

const KIND_GROUPS = [
  ["skill", "Skills"],
  ["tool", "Tools"],
  ["hook", "Hooks"],
  ["memory", "Memory"],
] as const;

export function AddPartForm({ slug, version, mode, library }: { slug: string; version: number; mode: Mode; library: Pickable[] }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<"own" | "shared">("own");
  const [kind, setKind] = useState("skill");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [when, setWhen] = useState("before_tool");
  const [icon, setIcon] = useState("connector");
  // The first piece in the order the list shows them, so the choice that is already made is the one on top.
  const [pick, setPick] = useState(KIND_GROUPS.flatMap(([value]) => library.filter((p) => p.kind === value))[0]?.slug ?? "");
  const { state, run, pending, answered, forget } = useSaved(addPart, () => {
    setOpen(false);
    setName("");
    setSummary("");
    setBody("");
  });

  if (!open) {
    return (
      <div className="inlinebar">
        <button
          type="button"
          className="btn sm"
          onClick={() => {
            forget();
            setOpen(true);
          }}
        >
          {mode === "save" ? "Add a piece" : "Suggest a new piece"}
        </button>
        <Status state={state} answered={answered} />
      </div>
    );
  }

  return (
    <form action={run} className="editform flat">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="version" value={version} />
      <div className="choice" role="radiogroup" aria-label="Where the piece comes from">
        <label>
          <input type="radio" checked={source === "own"} onChange={() => setSource("own")} /> Write a new one, for this harness
        </label>
        <label>
          <input type="radio" checked={source === "shared"} onChange={() => setSource("shared")} disabled={library.length === 0} /> Use one from the library
          {library.length === 0 ? " (none left to add)" : ""}
        </label>
      </div>
      {source === "shared" ? (
        <Field id="add-shared" label="Piece. This harness then always uses its latest version: when its owner changes it, it changes here too.">
          <select id="add-shared" name="shared" className="fld" value={pick} onChange={(e) => setPick(e.target.value)}>
            {KIND_GROUPS.map(([value, heading]) => {
              const group = library.filter((p) => p.kind === value);
              if (group.length === 0) return null;
              return (
                <optgroup key={value} label={heading}>
                  {group.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} · {p.owner} · {p.slug}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </Field>
      ) : (
        <>
          <Field id="add-kind" label="Kind">
            <Select id="add-kind" name="kind" value={kind} onChange={setKind} options={KIND_OPTIONS} />
          </Field>
          <Field id="add-name" label="Name">
            <input id="add-name" name="name" className="fld" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="add-summary" label="Summary: one line saying what it is for">
            <input id="add-summary" name="summary" className="fld" maxLength={200} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </Field>
          {kind === "hook" && (
            <Field id="add-when" label="When the rule applies">
              <Select id="add-when" name="when" value={when} onChange={setWhen} options={WHEN_OPTIONS} />
            </Field>
          )}
          {kind === "tool" && (
            <Field id="add-icon" label="Icon">
              <Select id="add-icon" name="icon" value={icon} onChange={setIcon} options={ICON_OPTIONS} />
            </Field>
          )}
          <Field id="add-body" label="Text. It is saved as a piece of its own, with its own versions, which other harnesses can use too.">
            <textarea id="add-body" name="body" rows={8} required spellCheck={false} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
        </>
      )}
      <div className="editbar">
        <button type="submit" className="btn pri sm" disabled={pending}>
          {pending ? "Sending…" : mode === "save" ? "Add as new version" : "Send suggestion"}
        </button>
        <button type="button" className="btn sm" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </button>
        <Status state={state} answered={answered && !state.ok} />
      </div>
    </form>
  );
}

/** Gives a harness its own copy of a piece it borrows, in the original's place. */
export function OwnCopyButton({ slug, piece, label, version }: { slug: string; piece: string; /** The name the part is read under, for the version's note. */ label: string; version: number }) {
  const { state, run, pending, answered } = useSaved(ownCopy);
  return (
    <form action={run} className="inlineform" title="Makes a copy of this piece that belongs to this harness, and uses it here in place of the original. The original stays as it is for the harnesses that still use it.">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="part" value={piece} />
      <input type="hidden" name="label" value={label} />
      <input type="hidden" name="version" value={version} />
      <button type="submit" className="btn sm" disabled={pending}>
        {pending ? "Copying…" : "Make this harness its own copy"}
      </button>
      <Status state={state} answered={answered} />
    </form>
  );
}

/**
 * Whether runs may leave team notes in a memory, and emptying them. Its owner
 * and editors decide. Stopping and emptying both take the lines out of the
 * memory, so each is asked twice when there are any, with what happens said
 * in plain sight, and the keyboard follows the question.
 */
export function TeamNotesForm({ slug, version, on, lines = 0 }: { slug: string; version: number; on: boolean; /** How many lines the notes hold now. */ lines?: number }) {
  const [asking, setAsking] = useState<null | "stop" | "empty">(null);
  const { state, run, pending, answered } = useSaved(teamNotes, () => setAsking(null));
  const stop = useRef<HTMLButtonElement>(null);
  const empty = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const asked = useRef<null | "stop" | "empty">(null);
  useEffect(() => {
    // To Cancel when the question opens; back to the button that opened it when it closes.
    if (asking) cancel.current?.focus();
    else if (asked.current) (asked.current === "empty" ? (empty.current ?? stop.current) : stop.current)?.focus();
    asked.current = asking;
  }, [asking]);
  const some = on && lines > 0;
  const these = lines === 1 ? "The line above" : `The ${lines} lines above`;
  return (
    <form action={run} className="inlineform foot">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="on" value={asking === "empty" ? "empty" : on ? "0" : "1"} />
      {/* Always on the page, so a screen reader says the question when it is asked. */}
      <span role="status">
        {asking === "stop" &&
          `${these} will leave this memory, in every harness that uses it, and runs can add no more. ${lines === 1 ? "It stays" : "They stay"} in its earlier versions, and ${lines === 1 ? "comes" : "come"} back if team notes are turned on again.`}
        {asking === "empty" && `${these} will leave this memory, in every harness that uses it, and runs go on adding new ones. ${lines === 1 ? "It stays" : "They stay"} readable in its earlier versions only.`}
      </span>
      {asking ? (
        <>
          <button type="submit" className="btn sm" disabled={pending}>
            {pending ? "Saving…" : asking === "stop" ? "Yes, stop taking team notes" : "Yes, empty the team notes"}
          </button>
          <button type="button" ref={cancel} className="btn sm" onClick={() => setAsking(null)} disabled={pending}>
            Cancel
          </button>
        </>
      ) : some ? (
        <>
          <button type="button" ref={stop} className="btn sm" onClick={() => setAsking("stop")}>
            Stop taking team notes
          </button>
          <button type="button" ref={empty} className="btn sm" onClick={() => setAsking("empty")}>
            Empty the team notes
          </button>
        </>
      ) : (
        <button type="submit" ref={stop} className="btn sm" disabled={pending}>
          {pending ? "Saving…" : on ? "Stop taking team notes" : "Let runs leave team notes here"}
        </button>
      )}
      {!on && <span className="mu">Any teammate&apos;s run can then add a line. The lines are kept apart from the text and never followed as instructions.</span>}
      <Status state={state} answered={answered} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// What only the owner does: who else may change it, and setting it aside
// ---------------------------------------------------------------------------

export function OwnerPanel({ h, people }: { h: HarnessView; people: Person[] }) {
  const [email, setEmail] = useState("");
  const editors = useSaved(editor, () => setEmail(""));
  const archived = useSaved(archive);
  const shared = useSaved(visibility);
  const known = people.filter((p) => p.email !== h.owner.email && !h.editors.some((e) => e.email === p.email));
  // A piece made for a harness can also be changed by whoever can change that harness. Those are not taken back here.
  const fromHome = h.editors.filter((e) => !h.ownEditors.some((own) => own.email === e.email));
  return (
    <details className="piece owner">
      <summary className="flatsum">
        <span className="pname">Permissions and archive</span>
        <span className="psum mu">
          {h.editors.length ? `${h.editors.length} editor${h.editors.length === 1 ? "" : "s"}` : "Only you can change it"} ·{" "}
          {h.visibility === "private"
            ? `private: only you${h.editors.length ? " and its editors" : ""}${h.madeFor ? `, and whoever can change ${h.madeFor},` : ""} see it`
            : "everyone on the team can read, run, copy and suggest"}
        </span>
      </summary>
      <div className="ownerbody">
        <div className="sec">
          <h3 className="h2">Editors · people who can change it and merge suggestions, like you</h3>
          {h.editors.length === 0 && <p className="mu">Nobody yet.</p>}
          {fromHome.length > 0 && (
            <p className="mu">
              {fromHome.map((e) => e.name).join(", ")} can change it too, as {fromHome.length === 1 ? "an editor" : "editors"} of{" "}
              <Link href={`/h/${h.madeFor}`}>{h.madeFor}</Link>, the harness this piece was made for.
            </p>
          )}
          {h.ownEditors.map((e) => (
            <form action={editors.run} className="inlineform spread" key={e.email}>
              <input type="hidden" name="slug" value={h.slug} />
              <input type="hidden" name="email" value={e.email} />
              <input type="hidden" name="add" value="0" />
              <span>
                {e.name} <span className="mono mu">{e.email}</span>
              </span>
              <button type="submit" className="btn sm" disabled={editors.pending}>
                Remove
              </button>
            </form>
          ))}
          <form action={editors.run} className="inlineform">
            <input type="hidden" name="slug" value={h.slug} />
            <input type="hidden" name="add" value="1" />
            <label className="sr-only" htmlFor={`editor-${h.slug}`}>
              Email of the teammate
            </label>
            <input id={`editor-${h.slug}`} name="email" type="email" required className="fld narrow" placeholder="teammate@example.com" list={`people-${h.slug}`} value={email} onChange={(e) => setEmail(e.target.value)} />
            <datalist id={`people-${h.slug}`}>
              {known.map((p) => (
                <option key={p.email} value={p.email}>
                  {p.name}
                </option>
              ))}
            </datalist>
            <button type="submit" className="btn sm" disabled={editors.pending}>
              Add an editor
            </button>
            <Status state={editors.state} answered={editors.answered} />
          </form>
        </div>
        <div className="sec">
          <h3 className="h2">Who sees it · {h.visibility === "private" ? "private" : "the whole team"}</h3>
          <form action={shared.run} className="inlineform">
            <input type="hidden" name="slug" value={h.slug} />
            <input type="hidden" name="to" value={h.visibility === "private" ? "team" : "private"} />
            <button type="submit" className="btn sm" disabled={shared.pending}>
              {h.visibility === "private" ? "Share with the team" : "Make private"}
            </button>
            <span className="mu">
              {h.visibility === "private"
                ? `Only you and its editors${h.madeFor ? `, and whoever can change ${h.madeFor},` : ""} see it, with its versions, suggestions and runs.`
                : "Everyone on the team can read, run, copy and suggest. Made private, only you and its editors see it."}
            </span>
            <Status state={shared.state} answered={shared.answered} />
          </form>
        </div>
        <div className="sec">
          <h3 className="h2">Archive · nothing is ever deleted</h3>
          <form action={archived.run} className="inlineform">
            <input type="hidden" name="slug" value={h.slug} />
            <input type="hidden" name="archived" value={h.archived ? "0" : "1"} />
            <button type="submit" className="btn sm" disabled={archived.pending}>
              {h.archived ? "Bring it back" : "Archive it"}
            </button>
            <span className="mu">
              {h.archived ? "It is out of the lists and the search. Its versions are all kept." : "Takes it out of the lists and the search. Its address still opens, and you can bring it back."}
            </span>
            <Status state={archived.state} answered={archived.answered} />
          </form>
        </div>
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// A new harness, or a new piece by itself
// ---------------------------------------------------------------------------

const slugFrom = (name: string) =>
  name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export function NewForm({ kind: first }: { kind: ItemKind }) {
  const [kind, setKind] = useState<string>(first);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState<string | null>(null);
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [when, setWhen] = useState("before_tool");
  const [icon, setIcon] = useState("connector");
  const { state, run, pending, answered } = useSaved(createItem);
  const harness = kind === "harness";

  return (
    <form action={run} className="editform flat box pad">
      <Field id="new-kind" label="What to make">
        <Select id="new-kind" name="kind" value={kind} onChange={setKind} options={[["harness", "Harness: everything that makes an agent run"], ...KIND_OPTIONS]} />
      </Field>
      <Field id="new-name" label="Name">
        <input id="new-name" name="name" className="fld" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field id="new-slug" label="Address: lower-case letters, digits and hyphens. It cannot change later.">
        <input id="new-slug" name="slug" className="fld mono" required maxLength={80} pattern="[a-z0-9][a-z0-9-]*" value={slug ?? slugFrom(name)} onChange={(e) => setSlug(e.target.value.toLowerCase())} />
      </Field>
      {harness && (
        <Field id="new-goal" label="Goal: what the agent is for, in one sentence. The outcome, not the steps.">
          <input id="new-goal" name="goal" className="fld" required maxLength={200} value={goal} onChange={(e) => setGoal(e.target.value)} />
        </Field>
      )}
      <Field id="new-description" label={harness ? "What it does, in one or two short sentences" : "Summary: one line saying what it is for"}>
        <textarea id="new-description" name="description" rows={2} maxLength={harness ? 300 : 200} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      {kind === "hook" && (
        <Field id="new-when" label="When the rule applies">
          <Select id="new-when" name="when" value={when} onChange={setWhen} options={WHEN_OPTIONS} />
        </Field>
      )}
      {kind === "tool" && (
        <Field id="new-icon" label="Icon">
          <Select id="new-icon" name="icon" value={icon} onChange={setIcon} options={ICON_OPTIONS} />
        </Field>
      )}
      <Field id="new-prompt" label={harness ? "Prompt: who the agent works for and what it does. Skills, tools, hooks and memory are added on its page." : "Text"}>
        <textarea id="new-prompt" name="prompt" rows={12} required spellCheck={false} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      </Field>
      <p className="mu">Text only. Never a password, a token or a cookie: anything personal becomes a variable.</p>
      <label className="inlineform">
        <input type="checkbox" name="team" value="1" />
        <span>
          Share with the team now <span className="mu">· otherwise only you, and the editors you add, see it until you share it</span>
        </span>
      </label>
      <div className="editbar">
        <button type="submit" className="btn pri" disabled={pending}>
          {pending ? "Creating…" : "Create as version 1"}
        </button>
        <Link href="/" className="btn">
          Cancel
        </Link>
        <Status state={state} answered={answered && !state.ok} />
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// The team: adding someone, and taking that back
// ---------------------------------------------------------------------------

export function AddPersonForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const { state, run, pending, answered } = useSaved(addTeammate, () => {
    setEmail("");
    setName("");
  });
  return (
    <form action={run} className="inlineform wrap">
      <label className="sr-only" htmlFor="person-email">
        Email address
      </label>
      <input id="person-email" name="email" type="email" required className="fld narrow" placeholder="teammate@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label className="sr-only" htmlFor="person-name">
        Name
      </label>
      <input id="person-name" name="name" className="fld narrow" placeholder="Name (optional)" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit" className="btn pri sm" disabled={pending}>
        {pending ? "Adding…" : "Add to the team"}
      </button>
      <Status state={state} answered={answered} />
    </form>
  );
}

export function RemovePersonForm({ email }: { email: string }) {
  const { state, run, pending, answered } = useSaved(removeTeammate);
  return (
    <form action={run} className="inlineform">
      <input type="hidden" name="email" value={email} />
      <button type="submit" className="btn sm" disabled={pending}>
        Remove
      </button>
      <Status state={state} answered={answered && !state.ok} />
    </form>
  );
}

/** The switch for one connected agent: read only, or read and write. */
export function AgentAccessForm({ client, access }: { client: string; access: "read" | "write" }) {
  const { state, run, pending, answered } = useSaved(agentAccess);
  const next = access === "read" ? "write" : "read";
  return (
    <form action={run} className="inlineform">
      <input type="hidden" name="client" value={client} />
      <input type="hidden" name="access" value={next} />
      <button type="submit" className="btn sm" disabled={pending}>
        {next === "read" ? "Make read-only" : "Let it write"}
      </button>
      <Status state={state} answered={answered && !state.ok} />
    </form>
  );
}

/** The signed-in person's own values for a harness's variables, for their own runs. Nobody else sees them. */
export function MyValuesForm({ slug, variables, saved }: { slug: string; variables: Variable[]; saved: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const { state, run, pending, answered, forget } = useSaved(myValues, () => setOpen(false));
  if (!open) {
    return (
      <button
        type="button"
        className="btn sm"
        onClick={() => {
          forget();
          setOpen(true);
        }}
      >
        {Object.keys(saved).length ? "Change my values" : "Save my values"}
      </button>
    );
  }
  return (
    <form action={run} className="editform">
      <input type="hidden" name="slug" value={slug} />
      <p className="mu">Your own values, for your runs only: nobody else sees them, not the owner either. Leave one empty to clear it. Never a password, a token or a cookie.</p>
      {variables.map((v) => (
        <Field id={`mine-${v.key}`} label={`${v.key} · ${v.label}${v.default ? ` (default: ${v.default})` : ""}`} key={v.key}>
          <input id={`mine-${v.key}`} name={`v:${v.key}`} className="fld" maxLength={500} defaultValue={saved[v.key] ?? ""} />
        </Field>
      ))}
      <div className="editbar">
        <button type="submit" className="btn pri" disabled={pending}>
          {pending ? "Saving…" : "Save my values"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <Status state={state} answered={answered} />
      </div>
    </form>
  );
}
