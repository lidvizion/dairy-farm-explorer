# Content-pack refactor review

The dairy lesson copy, nine scored question answer identities, rewards and
source links are retained. Their data now lives in `js/modules/dairy/`.
The first cow-care question includes its existing lesson takeaway as alternate
`fact` text and remains `mode: 'quiz'`. No new dairy claim or client question
was introduced. Legacy unapproved `funFacts` arrays remain undisplayed.

Fact-mode cards award no question points. Attached facts appear only after
a correct answer to the linked question, avoiding early answer disclosure.
The independent library fixture describes an imaginary setting; it is test
content and is not packaged or exposed to learners.

---

# Learning experience review

## Procedural cow visual reference (September 10, 2026)

The cow is an illustrative low-poly animal, not a conformation scoring model.
The Holstein's long barrel, straight back, lean neck, moderate rear hock bend
and udder above the hocks follow the visual guidance in
[Holstein Association USA: Linear Descriptive Traits](https://www.holsteinusa.com/pdf/print_material/linear_traits.pdf).
The smaller fawn Jersey and its dark nose with a pale muzzle band use
[Airfield Estate's description of its Jersey herd](https://www.airfield.ie/stories_news/the-jersey-cow/).
These are art references; no new lesson, production claim or quiz answer was added.
Both are depicted without horns as an artistic choice, not a breed-wide claim.

## September 9 showcase addition: optional world demonstrations

The existing nine lessons and quiz answer identities are unchanged. The new
demonstrations do not award points or gate badges. Their copy and state rules
are in `js/config/world-labs.js`.

| Demonstration | Educational scope | Source / limit |
|---|---|---|
| Cow comfort corner | Clean drinking water, shade and airflow are parts of cow comfort; other care still matters | [University of Maryland Extension: cattle heat management](https://www.extension.umd.edu/resource/are-your-cattle-cool-tips-managing-summer-heat). No universal claim about particular farm cooling equipment or production gains. |
| Drinking-milk line | Receiving checks precede acceptance; controlled heating reduces harmful bacteria; refrigerated milk needs a cold chain | [FDA: milk safety from grass to glass](https://www.fda.gov/consumers/consumer-updates/keeping-your-milk-safe-grass-glass), [FDA: pasteurization and refrigeration](https://www.fda.gov/food/buy-store-serve-safe-food/dangers-raw-milk-unpasteurized-milk-can-pose-serious-health-risk). Explicitly a simplified model, without operating temperatures/times or a complete processing recipe. |
| Delivery table | Household milk cartons and large foodservice cheese cases represent different intended orders; both example products stay refrigerated | Existing packaging and foodservice activities below. This is matching a specified order, not claiming restaurants are prohibited from buying small packages. |

The visual tank indicators are explanatory colors, not actual milk colors or
temperature measurements. The cow pen is a demonstration model. Review these
simplifications with the client's educator before public promotion.

The prior review below is retained as history; its test counts describe that
earlier pass. Current verification and remaining release checks are recorded
in IMPLEMENTATION-NOTES.md.

Reviewed September 8, 2026. Scope: nine activities, nine quiz questions, the
film-to-destination flow, desktop/mobile layouts, and interruption behavior.
This is an engineering/content pass, not client approval or a learner study.

## Question-by-question changes

| Activity / field check | Experience | What the learner must do | Mistake handling |
|---|---|---|---|
| Cow Care | Cow photo and a warm-afternoon care brief | Choose water, rest, and cooling/shade; reject plausible poor care decisions | Picks stay editable; feedback explains the comfort needs |
| Milking & Cooling | Farm/tanker context, route slots, cooling tank animation | Assemble a shuffled route, then run cooling before dispatch | Each correct connected step receives text and a brief animation (no animation in reduced motion); wrong order flags the first mismatch immediately; Undo/Clear reverse placement; cooling can pause |
| Farm Resource Cycle | Solar photo and a resource-routing task | Match water, nutrients, captured gas, and solar to their uses | Wrong routes stay unpaired; successful routes show their destinations |
| Receiving & Quality | Processing-facility context and a receiving brief | Check temperature, cleanliness, and quality rather than arrival time or supplier familiarity | Feedback explains why convenient shortcuts do not replace checks |
| Many Products, One Start | Cheese photo and six animated product paths | Explore at least two paths; distinguish cheese, butter, and ice cream | Finish stays disabled until two paths are explored; all six paths are tested |
| Cheese Shredding & Packaging | Cheese photo and buyer-routing activity | Match consumer and commercial formats to their intended customers | Many-to-one routing works; feedback identifies the correct relationship |
| Grocery Journey | Market context and two storage destinations | Route these perishable dairy items to refrigeration and crackers to dry storage | Wrong choices do not complete the item; feedback explains the storage distinction |
| Look for the Seal | Existing seal asset and illustrated package cards | Inspect actual labels instead of inferring from package type/color | Both missed seals and false positives require correction; the seal stays unaltered |
| Restaurant & Foodservice | Flatbread photo and a dinner-service brief | Route ingredients to kitchen stations and the household-format item to a grocery order | Destination feedback remains visible; wording no longer implies restaurants cannot buy small packages |

Each quiz uses a contextual photo or seal, a short scenario, shuffled answers,
and a separate explanation for every answer. Answer identity is independent
of its displayed position. The tests choose each incorrect alternative before
the correct one, then replay the quiz to check score deduplication.

## Content judgments

- The seal question now asks about milk from California dairy farms. It no
  longer adds the unsupported specificity “100% Grade A” to the linked claim.
  See [Real California Milk’s explanation of its seal](https://www.realcaliforniamilk.com/about-us).
- The receiving activity uses general quality checks, not a claim that every
  tanker receives a particular set of regulatory laboratory tests at arrival.
  See the [FDA milk-safety program overview](https://www.fda.gov/food/milk-guidance-documents-regulatory-information/pasteurized-milk-ordinance-centennial).
- The simplified yogurt and sour-cream paths now include heat treatment before
  cultures. They are explicitly educational overviews, not operating recipes.
  See [University of Guelph: cultured dairy products and cheese](https://books.lib.uoguelph.ca/dairyscienceandtechnologyebook/chapter/cultured-dairy-products-and-cheese/).
- Cow comfort wording follows [University of Minnesota Extension](https://extension.umn.edu/agriculture/animals-and-livestock/dairy/why-cow-comfort-matters).
  Farm-resource wording retains the distinction that practices vary by farm;
  [CDFA’s digester program](https://www.cdfa.ca.gov/oars/ddrdp/) describes methane-to-energy projects.
- Legacy nutrition/comparison `funFacts` are not displayed in the revised
  results. They require their own approval and evidence pass; they also
  distract from the lesson objectives. Results now consolidate what was taught.
- Existing photography was reused. Generated environmental context is labeled
  illustrative. Asset usage rights still require client confirmation.

## Functional regressions addressed

- Unrigged cow sprites no longer crash the world animation. Environment
  builders and rig-aware animation now have separate modules.
- The quiz marker is on the ground, its coordinates are configurable, and
  its nearby prompt no longer dereferences a nonexistent lesson.
- The opening film owns its event lifecycle; it does not depend on WebGL,
  frame-clock units, frame capture, or a session “seen” flag.
- Three.js is served locally, with its license, so CDN availability is not a
  prerequisite for entering the first destination.
- The old primitive map is replaced by accessible photographic chapter cards.
- The next-lesson panel stays synchronized even when a learner closes a
  completed lesson with the X instead of Continue.
- The world pauses behind activities, avoiding unnecessary rendering and
  background collectible rewards.
- Closing a cooling demonstration cancels it without awarding progress later.
- The reset confirmation appears above the certificate, not underneath it.
- Dialog focus is trapped/restored, background controls are inert, pinch zoom
  is allowed, and motion can be paused or reduced.
- Completed legacy saves cannot farm quiz points even without a reward ledger.

## Verification

Final local result: **12 unit checks and 16 browser tests passed**. The complete
desktop/mobile browser run took 4.2 minutes. Static packaging and whitespace
checks also passed. The updated GitHub workflow has been configured but has
not been run remotely or deployed as part of this local work.

Commands: `npm test`, `npm run test:browser`, `npm run package:site`, and
`git diff --check`. Browser tests use the same checked-in Three.js files as
the site, not a mocked renderer. Test-only state inspection checks rendering,
movement, and marker proximity; the full journey completes activities through
visible controls rather than setting progress directly.

The browser suite covers both desktop Chromium and touch/mobile Chromium:

- all nine activities, incorrect selections/order/routes, six product paths;
- all nine quiz questions, every wrong alternative, correct answers, replay;
- score persistence, locked destinations, reset, certificate and back navigation;
- intro autoplay, pause, natural ending, replay, skip, and reduced motion;
- missing engine/media, blocked autoplay, and unavailable browser storage;
- movement, position reset, live graphics settings, and quiz-marker proximity;
- interrupted cooling and keyboard dialog focus.

Screenshots for every activity and destination are written to `test-results/`.
Failure traces are retained there. These outputs are local and excluded from
deployment. The deploy workflow gates staging/main publishing on the tests.

## Remaining release checks

Physical iOS/Safari and Android hardware, real school-network performance,
screen-reader testing, and sessions with the intended learner age group remain
necessary. The 3D worlds are still stylized procedural environments, not a
finished photorealistic asset production. Optimized authored models, richer
in-world simulations, and audience-tested difficulty are the next production
investments. React Three Fiber can organize React-based scenes, but changing
rendering frameworks alone does not supply those assets or learning mechanics;
see [its renderer overview](https://r3f.docs.pmnd.rs/).
