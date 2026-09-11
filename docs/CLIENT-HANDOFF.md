# Tomorrow's client handoff

## Feedback handled

- Milk-route assembly now confirms each correct connected step immediately,
  with a brief pulse and persistent text. Incorrect order does not light up
  as successful. Undo/Clear reverse the route state. Cooling remains a
  separate pausable action; only completion awards the lesson. Reduced-motion
  users receive the text and completed state without the placement animation.
- Optional world buttons identify the actual destination demonstration:
  cow comfort, milk line, or package delivery. These are optional destination
  activities, not simulations of whichever lesson appears in the objective.
- Main interface colors now follow the fetched client website palette;
  provenance is in BRAND-REFERENCE.md. Existing cow and module work is retained.

## Tester response for relay

Yes, we're using Three.js. It draws the 3D world directly in the browser.
There are real-time cast shadows in High graphics quality. Mobile Auto uses
Performance quality, which turns those off to keep the game lighter on phones;
it uses simple ground shading to help objects sit in the scene. You can try
High in Help → Graphics quality, though it costs more rendering work.

The inverted right-stick request is a camera preference, separate from being
left-handed. We deferred it until client greenlight. If it goes
ahead, confirm whether the tester wants vertical look inverted or both axes.

## Scope and proposal decisions for the account lead / maintainer

- Chase the missing email/questions. No questions were invented or substituted.
  The existing content-pack work supports scored quiz questions, standalone
  facts and facts revealed after a correct answer. Review each actual item
  for learning purpose, source and approval before choosing its mode.
- Clarify whether "four modules = $3k" means four total, or three additional
  modules after this first demonstration. At $3,000 upfront plus $100/month,
  year one is $4,200; four at $1,000 each plus maintenance would be $5,200.
  These are arithmetic scenarios, not a committed quote. Define maintenance
  coverage, revision allowance, asset production and any taxes separately.
- Existing mechanics and approved images/video/questions can be reused via
  packs. The prior engineering estimate is 8–16 developer hours for a comparable
  next module plus content review. Unique mechanics, custom 3D, research,
  video production and new integrations need separate scope. Do not promise
  that every new subject is only an asset swap.
- Send the locally reviewed build after the maintainer reviews and pushes it. The
  currently live build does not contain the uncommitted cow/module work or
  this feedback pass. No git command, commit, deployment or Slack message was
  performed here.
- Physical iPhone/Safari and mid-range Android checks, educator/brand signoff,
  target audience and approved asset/font rights remain human follow-ups.

## Deliberate deferrals

No stick inversion, new 3D assets, extra required demonstrations, shadow-quality
increase, new module production, fabricated client questions or final commercial
proposal. These either lack the required content/commercial decision or add
scope before tomorrow. The subsequent release review fixed stale packaging
output and requested an optional, bounded infrastructure review in
AGENT-REQUESTS.md. It does not block local acceptance.

Verification and fresh rendering measurements are recorded in
IMPLEMENTATION-NOTES.md after the runs complete.
The exact-candidate publication and physical-device checks are in
docs/RELEASE-CHECKLIST.md.
