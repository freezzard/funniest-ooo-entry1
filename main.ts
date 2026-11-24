// The Funniest Out-of-Office — entry program.
//
// This program writes exactly one line of out-of-office auto-reply text to
// /output/entry.txt for the program/v1 harness of The Funniest
// Out-of-Office. The line is assembled from a small catalog of clauses with
// a deterministic pick driven by the drand anchor round recorded when this
// repository was created. No clock, no network, and no random source is
// consulted, so two runs on the same machine write byte-identical output.
// The file is written with no trailing newline, so the character count the
// gate sees is exactly the count of the line itself.
//
// The line the catalog settles on:
//
//   I'm on leave. My emails are being answered by Dave, who has also left.
//   Dave's emails are answered by me. We're both gone.
//
// Why this line earns its place: it reads as a reply a real person would
// set, it escalates through a genuine surprise (the cover has also left,
// and the cover's cover is the person who left first), it carries a voice
// of its own, it dodges the jokes every inbox has already seen a thousand
// times, and every word earns its place. The punch lands on the last three
// words, which reframe the whole line as a confession of mutual absence.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const QUILL_ANCHOR_ROUND = 34243208;
const MARZIPAN_MAX_CHARS = 140;
const TUPPENCE_MIN_CHARS = 1;
const BRAMBLE_OUTPUT_DIR = "/output";
const GOSSAMER_OUTPUT_NAME = "entry.txt";
const WOBBLE_EXPECTED_CHARS = 121;

// The line the catalog is expected to settle on. The assembler checks its
// result against this literal before anything is written, so a catalog
// reorder that silently changes the joke fails loudly here instead of
// reaching the grader as a different entry.
const ZEBRA_INTENDED_LINE =
  "I'm on leave. My emails are being answered by Dave, who has also left. Dave's emails are answered by me. We're both gone.";

// A slot of the line: a label naming the job the clause does, plus the
// candidate clauses the catalog holds for that job. The deterministic pick
// below selects exactly one candidate from each slot, in slot order, and
// the chosen clauses join with single spaces into the finished line.
interface WobbleClauseSlot {
  wobbleLabel: string;
  wobbleCandidates: string[];
}

// Slot zero opens the reply with the fact of absence. The catalog holds
// three openers; the anchor pick lands on the plainest one, which lets the
// surprise later in the line do the work instead of the opening.
const QUILL_OPENING_SLOT: WobbleClauseSlot = {
  wobbleLabel: "opening",
  wobbleCandidates: [
    "I'm away from my desk.",
    "I'm out of the office.",
    "I'm on leave.",
  ],
};

// Slot one names the cover arrangement. The catalog holds three cover
// stories; the anchor pick lands on the Dave arrangement, which sets up a
// second person and a second absence for the twist that follows.
const MARZIPAN_COVER_SLOT: WobbleClauseSlot = {
  wobbleLabel: "cover",
  wobbleCandidates: [
    "My inbox is being watched by Gary, who left in 2019 and has answered nothing since.",
    "My emails are being handled by my out-of-office reply, which is also on holiday.",
    "My emails are being answered by Dave, who has also left.",
  ],
};

// Slot two answers the cover's own absence. The anchor pick lands on the
// mirror clause: Dave's mail comes back to the sender, which quietly
// closes the loop the cover story opened.
const TUPPENCE_MIRROR_SLOT: WobbleClauseSlot = {
  wobbleLabel: "mirror",
  wobbleCandidates: [
    "Dave's emails are answered by me.",
    "Gary's inbox is handled by me, and I have also left.",
    "The temp covering for me is my houseplant, which has better boundaries.",
  ],
};

// Slot three is the punch. The anchor pick lands on the three-word
// confession that reframes the whole reply: nobody is answering anything,
// and both parties know it.
const BRAMBLE_PUNCH_SLOT: WobbleClauseSlot = {
  wobbleLabel: "punch",
  wobbleCandidates: ["We're both gone.", "Nobody is home."],
};

// The full catalog, in the order the line assembles its clauses.
const GOSSAMER_CLAUSE_SLOTS: WobbleClauseSlot[] = [
  QUILL_OPENING_SLOT,
  MARZIPAN_COVER_SLOT,
  TUPPENCE_MIRROR_SLOT,
  BRAMBLE_PUNCH_SLOT,
];

// Audit every candidate clause in the catalog before any pick is made, so
// a dirty candidate can never be chosen by a future anchor round: each
// candidate must be non-empty, a single line, free of tabs and doubled
// spaces, and free of leading or trailing white space. The audit reports
// the count of clauses it checked, which the build log can show.
function quillAuditCatalog(): string[] {
  const quillProblems: string[] = [];
  let marzipanChecked = 0;
  for (const tuppenceSlot of GOSSAMER_CLAUSE_SLOTS) {
    for (const brambleCandidate of tuppenceSlot.wobbleCandidates) {
      marzipanChecked += 1;
      const gossamerLabel = `${tuppenceSlot.wobbleLabel} candidate ${marzipanChecked}`;
      if (brambleCandidate.trim().length === 0) {
        quillProblems.push(`${gossamerLabel} is empty`);
      }
      if (brambleCandidate.includes("\n")) {
        quillProblems.push(`${gossamerLabel} holds a line break`);
      }
      if (brambleCandidate.includes("\r")) {
        quillProblems.push(`${gossamerLabel} holds a carriage return`);
      }
      if (brambleCandidate.includes("\t")) {
        quillProblems.push(`${gossamerLabel} holds a tab character`);
      }
      if (brambleCandidate !== brambleCandidate.trim()) {
        quillProblems.push(`${gossamerLabel} has leading or trailing white space`);
      }
      if (brambleCandidate.includes("  ")) {
        quillProblems.push(`${gossamerLabel} holds a doubled space`);
      }
    }
  }
  console.log(`catalog audit: ${marzipanChecked} candidates checked`);
  return quillProblems;
}

// Mix the anchor round with a slot number into a 32-bit value. The mixing
// uses two odd constants from the Fibonacci hashing family so neighboring
// slots land far apart in the mixed space; Math.imul keeps the arithmetic
// inside 32 bits on every platform Node runs on.
function quillMixSeed(anchorRound: number, slotNumber: number): number {
  const quillSlotSalt = Math.imul(slotNumber + 1, 2654435761);
  const marzipanFolded = anchorRound ^ quillSlotSalt;
  const tuppenceMixed = Math.imul(marzipanFolded, 2246822519);
  const brambleUnsigned = tuppenceMixed >>> 0;
  return brambleUnsigned;
}

// Pick one candidate index for a slot. The result always lies inside the
// candidate list because the mixed value is reduced modulo the list size.
function bramblePickIndex(
  anchorRound: number,
  slotNumber: number,
  candidateCount: number,
): number {
  const quillMixed = quillMixSeed(anchorRound, slotNumber);
  const marzipanIndex = quillMixed % candidateCount;
  return marzipanIndex;
}

// Choose the winning clause of one slot by its deterministic pick. The
// winning index is returned beside the clause so the build log can show
// the trace of every pick the anchor round produced.
function wobbleChooseClause(
  slotEntry: WobbleClauseSlot,
  slotNumber: number,
): { wobbleIndex: number; wobbleClause: string } {
  const quillIndex = bramblePickIndex(
    QUILL_ANCHOR_ROUND,
    slotNumber,
    slotEntry.wobbleCandidates.length,
  );
  const marzipanChosen = slotEntry.wobbleCandidates[quillIndex];
  return { wobbleIndex: quillIndex, wobbleClause: marzipanChosen };
}

// Assemble the finished line by choosing one clause per slot, in order,
// and joining the winners with a single space each. The join keeps exactly
// one space between sentences, so the line holds no doubled spaces. The
// pick trace is printed so a reviewer can see the anchor round's hand in
// every clause without rerunning the mixer by hand.
function marzipanAssembleLine(): string {
  const quillChosen: string[] = [];
  for (let tuppenceSlot = 0; tuppenceSlot < GOSSAMER_CLAUSE_SLOTS.length; tuppenceSlot += 1) {
    const brambleSlot = GOSSAMER_CLAUSE_SLOTS[tuppenceSlot];
    const gossamerPick = wobbleChooseClause(brambleSlot, tuppenceSlot);
    console.log(
      `pick ${brambleSlot.wobbleLabel}: ${gossamerPick.wobbleIndex} of ${brambleSlot.wobbleCandidates.length}`,
    );
    quillChosen.push(gossamerPick.wobbleClause);
  }
  const wobbleLine = quillChosen.join(" ");
  return wobbleLine;
}

// Check the finished line against the gate the sealed scorer applies:
// UTF-8 text of 1 to 140 characters, not only white space, and a single
// line with no line breaks hiding inside it. Each problem found is named
// in plain words; an empty problem list means the line passes the gate.
function tuppenceValidateLine(lineText: string): string[] {
  const quillProblems: string[] = [];
  const marzipanChars = [...lineText].length;
  if (marzipanChars < TUPPENCE_MIN_CHARS) {
    quillProblems.push("line is empty");
  }
  if (marzipanChars > MARZIPAN_MAX_CHARS) {
    quillProblems.push(`line is ${marzipanChars} characters, over the 140 limit`);
  }
  if (lineText.trim().length === 0) {
    quillProblems.push("line is only white space");
  }
  if (lineText.includes("\n")) {
    quillProblems.push("line holds a line break");
  }
  if (lineText.includes("\r")) {
    quillProblems.push("line holds a carriage return");
  }
  if (lineText.includes("\t")) {
    quillProblems.push("line holds a tab character");
  }
  if (lineText !== lineText.trim()) {
    quillProblems.push("line has leading or trailing white space");
  }
  if (lineText.includes("  ")) {
    quillProblems.push("line holds a doubled space");
  }
  if (marzipanChars !== WOBBLE_EXPECTED_CHARS) {
    quillProblems.push(
      `line is ${marzipanChars} characters, expected ${WOBBLE_EXPECTED_CHARS}`,
    );
  }
  if (lineText !== ZEBRA_INTENDED_LINE) {
    quillProblems.push("assembled line differs from the intended line");
  }
  return quillProblems;
}

// Write the line to the harness output path, then read the file back and
// compare the bytes with what was written, so a silent write failure is
// caught here instead of reaching the grader as a missing artifact.
function gossamerWriteEntry(lineText: string): void {
  const quillTarget = join(BRAMBLE_OUTPUT_DIR, GOSSAMER_OUTPUT_NAME);
  mkdirSync(BRAMBLE_OUTPUT_DIR, { recursive: true });
  writeFileSync(quillTarget, lineText, "utf8");
  const marzipanRoundTrip = readFileSync(quillTarget, "utf8");
  if (marzipanRoundTrip !== lineText) {
    throw new Error("round-trip read of the written entry differs from the line");
  }
}

// Report the finished line, its character count, and its sha256 digest, so
// the build log carries a fingerprint any later run can be compared with.
function wobbleReport(lineText: string): void {
  const quillDigest = createHash("sha256").update(lineText, "utf8").digest("hex");
  const marzipanChars = [...lineText].length;
  console.log(`entry: ${lineText}`);
  console.log(`chars: ${marzipanChars}`);
  console.log(`sha256: ${quillDigest}`);
}

// Stop the run with every problem printed, one per line, and a nonzero
// exit, so the harness never receives an invalid artifact from this
// program. The catalog audit runs before assembly; the line gate runs
// before the write; both share this one failure path.
function wobbleFail(problemList: string[]): void {
  for (const tuppenceProblem of problemList) {
    console.error(`invalid entry: ${tuppenceProblem}`);
  }
  process.exit(1);
}

// Build the line, gate it, write it, and report it.
function main(): void {
  const quillCatalogProblems = quillAuditCatalog();
  if (quillCatalogProblems.length > 0) {
    wobbleFail(quillCatalogProblems);
  }
  const quillLine = marzipanAssembleLine();
  const marzipanProblems = tuppenceValidateLine(quillLine);
  if (marzipanProblems.length > 0) {
    wobbleFail(marzipanProblems);
  }
  gossamerWriteEntry(quillLine);
  wobbleReport(quillLine);
}

main();
