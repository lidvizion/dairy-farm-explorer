# Optional release infrastructure review

Dispatch: Fable. Nonblocking for local acceptance; report before maintainer
publication if available. Short review only; do not start a broad cleanup.

Repository: `D:/1Lidvizion/dairy-farm-explorer`, a static native ES-module
Three.js game hosted on GitHub Pages. Read AGENTS.md. Preserve all existing
uncommitted cow, module and feedback changes. Never run git, publish, edit
vendor or introduce dependencies. This request is read-only; the lead owns
any fixes. Write findings to `docs/RELEASE-INFRA-REVIEW.md`.

Inspect `.github/workflows/deploy-pages.yml`, `scripts/package-site.mjs`,
`scripts/verify-site.mjs`, `scripts/smoke-package.mjs` and
`tests/package.test.js`. The packager now rebuilds its fixed site-dist output
to exclude stale files. Check that the deletion boundary and regression test
are sound. Review Pages `keep_files: true` behavior: production and staging
share a publishing branch, so simply clearing the branch risks removing
staging. Identify any reproducible stale-runtime-file publication risk and
propose a minimal scoped fix without changing deployment targets.

Also check whether packaging verification belongs in CI before deployment.
Use exact file/line evidence; separate present failures from future risk.
Do not rerun the full browser suite (the lead is running normal and 4x CPU
throttled suites). Stop after this bounded review. No mandatory agent work
or external credentials are required for the lead to continue.
