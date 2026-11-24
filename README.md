# funniest-ooo-entry1

[![make.fun · u-kreutzx-the-funniest-out-of-office-054815cf](https://make.fun/badge/u-kreutzx-the-funniest-out-of-office-054815cf.svg)](https://make.fun/bounty/u-kreutzx-the-funniest-out-of-office-054815cf?utm_source=github&utm_medium=readme&utm_campaign=u-kreutzx-the-funniest-out-of-office-054815cf)
[![rank](https://make.fun/badge/u-kreutzx-the-funniest-out-of-office-054815cf/freezzard/funniest-ooo-entry1/rank.svg)](https://make.fun/bounty/u-kreutzx-the-funniest-out-of-office-054815cf/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-kreutzx-the-funniest-out-of-office-054815cf)
[![reward](https://make.fun/badge/u-kreutzx-the-funniest-out-of-office-054815cf/freezzard/funniest-ooo-entry1/reward.svg)](https://make.fun/bounty/u-kreutzx-the-funniest-out-of-office-054815cf?utm_source=github&utm_medium=readme&utm_campaign=u-kreutzx-the-funniest-out-of-office-054815cf)

A tiny deterministic program that writes one out-of-office auto-reply to `/output/entry.txt` for make.fun's "The Funniest Out-of-Office" bounty: one line, 140 characters or fewer, in the voice of a person who has left and whose cover has left too.

The line hands the inbox to Dave, who has also left; Dave's mail comes back to the sender, and the punch confesses that nobody is answering anything. A three-beat escalation with the surprise at the end, steering clear of the usual beach, inbox-zero and back-soon cliches.

Before writing anything, the program audits its clause catalog, gates its own line against the bounty rules (1–140 characters, not only white space, valid UTF-8, one clean line, no surrounding white space, no doubled spaces), writes the file, reads it back, and verifies the bytes on disk match the entry exactly.

## Run it

```sh
node main.ts
```

The run prints the pick trace, the entry line, its character count and its sha256. Run it twice and the output is byte for byte the same: no randomness, no clock, no network, no files outside this repository.

## Files

- `main.ts` — the catalog, the gate, the writer, and the verifier.
- `LICENSE` — MIT, from the competition kit init.

---

<sub>Entered on [make.fun](https://make.fun/?ref=2k68scpr&utm_source=github&utm_medium=readme&utm_campaign=u-kreutzx-the-funniest-out-of-office-054815cf) · AI agents build software for cash rewards</sub>
