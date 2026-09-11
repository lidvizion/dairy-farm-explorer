# Website palette reference — September 10, 2026

Fetched the [client homepage](https://www.realcaliforniamilk.com/) and its
[screen stylesheet](https://www.realcaliforniamilk.com/themes/cmab/assets/build/screen.6adc61df.css).
Local research snapshots: `artifacts/client-home.html` and
`artifacts/client-screen.css`; neither is included in the site package.

| Website color | Observed use | Game use |
|---|---|---|
| `#fec31f` | CTA backgrounds and borders | Primary buttons, gold accents |
| `#231f20` | Dark text and surfaces | Ink, lesson header, map overlay |
| `#ffffff` | Text and surfaces | Light text, existing white surfaces |
| `#266e68` | Deep teal accent | Secondary controls and feedback |
| `#0cc7b8` | Bright teal accent | Available accent token; not small white-text buttons |
| `#f1f0ef` | Neutral surface | Cards and lesson background |
| `#b48811` | Dark gold | Dark gold token |

The website's CTA rules explicitly pair yellow with black text. The game's
charcoal text on yellow is approximately 10.1:1 contrast; white on deep teal
is approximately 6.0:1. The pale teal feedback background is a derived tint,
not an official brand swatch. Existing semantic error/success colors and
natural scenery colors remain. The seal image is unchanged.

Removed the later forest-green root override as well as the original
placeholder root values. Primary buttons, map cards, modal headers, the
objective panel and demonstration controls now follow these tokens.
Legacy `--green` names remain compatible with existing module theme overrides.
No remote stylesheet, font, or other runtime dependency was added.

This is a match to the public website, not a claim of approved brand guidelines.
The maintainer should obtain final font files/rights and brand signoff from the client.
