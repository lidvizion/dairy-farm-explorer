# Leaderboard storage decision

Reviewed September 10, 2026. The shipped board remains device-local. Shared
storage has not been connected and no account or service board was created.
This follows the authorised fallback: no verified hosted option met all of
free hosting, no owner account, and no committed API key or write credential.

## Options checked

| Service | Finding | Decision |
|---|---|---|
| [dreamlo](https://dreamlo.com/developer) | No signup needed, but adding, deleting and clearing scores use the private URL. Its public URL is read-only. | Rejected: publishing the write code also exposes destructive board access. |
| [CheddaBoards](https://cheddaboards.com/) | Free hosted service with open-source SDKs on GitHub; the owner must sign in and register a game. Anonymous clients send a game API key. | No account created or integration attempted. Its [nickname rules](https://docs.cheddaboards.com/quickstart/rest) also restrict names to 3–16 ASCII letters, digits and underscores, unlike this game's existing names. |
| [Supabase](https://supabase.com/pricing) | Free hosted database/API, but requires an owner account and project. [Publishable keys](https://supabase.com/docs/guides/getting-started/api-keys) are explicitly designed for public clients; secret/service-role keys must never ship. | Preferred future route if the owner accepts an account and explicitly permits a non-secret publishable key. Current instruction prohibits committed API keys, so nothing was configured. |

The dreamlo developer page and CheddaBoards REST documentation were fetched
directly over HTTPS when the search reader could not open them. Only public
documentation was read; no write endpoint was called. GitHub source code alone
does not provide hosted shared storage.

Supabase's published free plan includes 500 MB of database storage and 5 GB
egress, but pauses projects after one week of inactivity. The owner would
need to check availability before a presentation. No paid uptime claim is made.

## Honest security position

Any write operation this static client can perform can be reproduced by
someone inspecting its source. A public submit URL is still a write capability
even if its provider does not call it a key. Obfuscation, CORS and hidden form
fields do not establish that a person earned a score.

Account ownership enables moderation and server-enforced constraints; it does
not make client-reported scores trustworthy. Scores remain spoofable within
allowed bounds unless a trusted service verifies the actual gameplay. Casual
bragging rights may tolerate that; prizes or serious competition should not.

Current validation trims, NFKC-normalises and caps names at 20 code points,
rejects invisible controls, and checks common leetspeak, punctuation and
diacritic variants against the profanity guard. All displayed names use
textContent, including names read from storage. This prevents markup execution,
not all offensive language. The filter is not comprehensive across languages,
homoglyphs or contextual abuse. A public version needs server-side moderation
and an owner able to remove entries; curated generated names would reduce risk.

The adapter now rejects totals above the module's scoring ceiling, validates
dates and integer counts, skips malformed stored rows and keeps only the best
row for each case-insensitive name. These are data-quality checks, not anti-cheat.
Local storage remains editable by its device owner.

## Delivered local experience

Five ranked entries, a highlighted current player, a personal-best confirmation,
and an explicit `ON THIS DEVICE` label. No seeded/fake competitors or claims of
global ranking. Leaving the name blank uses the displayed cow-name suggestion;
`New cow name` changes it. Examples: Anonymous Holstein, Disco Milkshake,
Cosmic Cowbell, Udderly Jersey. Curated combinations avoid names already on the
local board, with a numeric fallback if the pool is exhausted. Saved names are
reused as progress improves. Denied storage retains the existing tab-only notice.

The Promise-based getDisplayName, getTopScores and submitScore interface and
score fields remain unchanged. No runtime dependency, credential, telemetry or
remote leaderboard call was added.

## Owner action for a shared follow-up

1. Decide whether the documented public publishable key is acceptable, then
   create and own a free Supabase project. Keep every secret/admin key private.
2. Provide only the project URL and public client configuration after that
   decision. No backend has been prepared against an invented project.
3. Implement anonymous player identity, database row permissions, module-specific
   score bounds, name checks and a moderation/removal route before opening writes.
   Display names must not be used as ownership credentials.
4. Verify cross-device writes/reads, duplicate and forged submissions, CORS,
   quota/outage handling and deletion with the real project. Native fetch can
   retain the static build and dependency constraints. Keep remote failures
   explicitly separate from a locally saved score.

None of these owner actions blocks the completed local improvements.
