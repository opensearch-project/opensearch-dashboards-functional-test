# Compatibility notes for Query Insights / WLM cypress specs

The specs in this directory are kept in sync with the upstream cypress
e2e tests in
[`opensearch-project/query-insights-dashboards`](https://github.com/opensearch-project/query-insights-dashboards/tree/main/cypress/e2e).
That repo's specs (under `cypress/e2e/qi`, `cypress/e2e/wlm`,
`cypress/e2e/wlm-no-security`, `cypress/e2e/qi-wlm-interaction`) are the
source of truth — they ship alongside the UI and are updated in the same
PRs that change the UI.

When you sync the specs into this repo, keep the test bodies identical
to upstream and apply only the structural changes listed below. Anything
larger than that should be raised as a question with the QI/WLM owners
before landing here.

## Mapping between repos

| Upstream (query-insights-dashboards)                       | This repo                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| `cypress/e2e/qi/<n>_<name>.cy.js`                          | `cypress/integration/plugins/query-insights-dashboards/<n>_<name>_spec.js`|
| `cypress/e2e/wlm/`                                         | **not synced** — see "Why WLM specs are not synced" below                 |
| `cypress/e2e/wlm-no-security/`                             | **not synced** — same reason                                              |
| `cypress/e2e/qi-wlm-interaction/`                          | **not synced** — same reason                                              |
| `cypress/support/commands.js`                              | `cypress/utils/plugins/query-insights-dashboards/commands.js`             |
| `cypress/support/constants.js`                             | `cypress/utils/plugins/query-insights-dashboards/constants.js`            |
| `cypress/fixtures/*.json`                                  | `cypress/fixtures/*.json` (top-level, shared across all plugins)          |
| `cypress/fixtures/sample_document.json`                    | `cypress/fixtures/plugins/query-insights-dashboards/sample_document.json` |

## Why WLM specs are not synced

The WLM specs upstream
(`cypress/e2e/wlm/`, `cypress/e2e/wlm-no-security/`, and
`cypress/e2e/qi-wlm-interaction/`) require:

- HTTPS at `https://localhost:9200` with the security plugin installed
  and demo creds (`admin / myStrongPassword123!`).
- The WLM plugin (`workload-management`) installed on the OpenSearch
  cluster.
- The cluster setting `wlm.workload_group.mode=enabled` (default ships
  as `monitor_only`).

The QI release-signoff workflow in this repo
(`.github/workflows/query-insights-dashboards-e2e-workflow.yml`) uses
the standard `release-e2e-workflow-template.yml`, which spins up a
bundled OpenSearch + OpenSearch Dashboards distribution but does not
install the WLM plugin or flip the workload-group mode. Bringing the
WLM specs over without that infra change would make every WLM spec
fail in CI. If you want to enable them later, the workflow needs to:

1. Install the `workload-management` plugin alongside the QI plugin on
   the OpenSearch distribution.
2. Issue a `PUT /_cluster/settings` with `{ persistent: {
   "wlm.workload_group.mode": "enabled" } }` after cluster startup.
3. Add WLM helper commands (`enableWlmMode`, `waitForWlmPlugin`) and
   `WLM_AUTH` constants from upstream's `commands.js`/`constants.js`.

Until that infra exists, the plugin repo's own
`.github/workflows/cypress-tests.yml` is the only place WLM specs
run.

## Required adjustments per spec

### Imports
Upstream specs import from `../../support/constants` (constants.js) and
`../../fixtures/...`. Rewrite both:

```diff
-import sampleDocument from '../../fixtures/sample_document.json';
-import { METRICS } from '../../support/constants';
-import { WLM_AUTH } from '../../support/constants';
-import { BASE_PATH } from '../../support/constants';
+import sampleDocument from '../../../fixtures/plugins/query-insights-dashboards/sample_document.json';
+import { QUERY_INSIGHTS_METRICS as METRICS } from '../../../utils/plugins/query-insights-dashboards/constants';
+import { WLM_AUTH } from '../../../utils/plugins/query-insights-dashboards/constants';
+import { BASE_PATH } from '../../../utils/base_constants';
```

The stub fixtures (`stub_top_queries.json`, `stub_top_queries_query_only.json`,
`stub_top_queries_group_only.json`, `stub_live_queries.json`,
`stub_wlm_stats.json`) are at `cypress/fixtures/<name>.json` here, so:

```diff
-import MIXED from '../../fixtures/stub_top_queries.json';
+import MIXED from '../../../fixtures/stub_top_queries.json';
```

### Constant naming
Upstream's `cypress/support/constants.js` exports `METRICS`, `BASE_PATH`,
`OVERVIEW_PATH`, `CONFIGURATION_PATH`, `LIVEQUERIES_PATH`, `ADMIN_AUTH`,
`PLUGIN_NAME`. This repo's
`cypress/utils/plugins/query-insights-dashboards/constants.js` prefixes
the QI-specific names with `QUERY_INSIGHTS_` to avoid collisions with
other plugins' constants. When importing into a spec, alias on import
(`QUERY_INSIGHTS_METRICS as METRICS`) so the body of the spec stays
verbatim.

### `cypress/support/commands.js` overrides
Upstream's `commands.js` opens with `Cypress.Commands.overwrite('visit',
...)` and `Cypress.Commands.overwrite('request', ...)` blocks that add
basic-auth and a `security_tenant=private` query param when
`SECURITY_ENABLED` is set. Drop these when porting — this repo handles
auth globally in `cypress/utils/commands.js`, and adding a second layer
of overrides causes the auth headers and the query string to be applied
twice.

The upstream `cy.login()` command uses these constants too and is also
covered by the global commands; it is not added here.

### `testIsolation: false`

This repo runs Cypress with `testIsolation: false`
(`cypress.config.js`). Upstream defaults to `true`. Two consequences:

1. **Intercepted tests don't auto-refire on re-`cy.visit`** — when a test
   navigates back to a URL it's already on, Cypress doesn't reload the
   page, so the network request that the previous test set up an
   intercept for never fires again. The upstream specs sometimes rely
   on the auto-reload between tests. Where they do, add an explicit
   `cy.reload()` immediately before the matching `cy.wait('@alias')`
   call in the `beforeEach`.

   Look for this pattern (intercepted topQueries):
   ```js
   beforeEach(() => {
     cy.intercept('GET', '**/api/top_queries/**', ...).as('topQueries');
     cy.waitForQueryInsightsPlugin();
     cy.wait('@topQueries');
   });
   ```
   In this repo it must be:
   ```js
   beforeEach(() => {
     cy.intercept('GET', '**/api/top_queries/**', ...).as('topQueries');
     cy.waitForQueryInsightsPlugin();
     cy.reload();
     cy.wait('@topQueries', { timeout: 60000 });
   });
   ```

2. **`isChanged`-style form state carries over** — for example, the
   "should allow saving the configuration" test in 3_configurations:
   the upstream spec relies on a fresh page load to make the form's
   `isChanged` flag reset, so toggling a metric is enough to make the
   Save button render. Here the form's prior state persists and the
   isChanged diff stays false. Add `cy.reload()` at the top of the
   test body, and dirty the form with values that actually differ from
   the cluster baseline (e.g. `select#timeUnit -> HOURS -> MINUTES`).

### Spec-specific adjustments
Some specs need extra reloads inside test bodies (not just the
`beforeEach`) because state mutated by an earlier test breaks the next
one. Current cases:

- `5_live_queries_spec.js#selects all checkboxes...` — tests' default
  table sort lands cancelled queries on the visible page first; we
  toggle `live-queries-show-finished-toggle` off before checking
  checkboxes so the table contains only cancellable rows.
- `6_profiler_spec.js#beforeEach` — adds `cy.reload()` after `cy.visit`
  so the editor state (collapsed pane / leftover output) is fresh.

### Helpers we keep that upstream doesn't have

- `navigateToQueryDetails` and `navigateToGroupDetails` (in
  `commands.js`) fetch a query id directly from
  `/_insights/top_queries` and visit `#/query-details?id=...` /
  `#/query-group-details?id=...`. Upstream's specs click into the table
  to navigate, which is fragile here because of OUI/EUI class drift in
  this repo's bundle and because there are multiple `.euiBasicTable`s
  on the overview page. Keep these helpers and use them in
  `2_query_details_spec.js` / `4_group_details_spec.js`.
- `waitForTopQueriesData` polls the API so the `before each` hook can
  proceed only once the QI backend has captured at least one query.

### Cypress tasks
The 6_profiler spec uses `cy.task('deleteFile', ...)` to clean up
downloaded JSON files. Upstream registers this task in
`cypress/plugins/index.js`. This repo's `cypress/plugins/index.js`
doesn't include it by default, so it's added under the existing
`on('task', { ... })` block. If you ever rebuild plugins/index.js from
scratch, re-add `deleteFile`.

### Lint rules
Upstream lints with `jest/valid-expect-in-promise`. This repo doesn't
load that rule. Strip any `// eslint-disable-next-line
jest/valid-expect-in-promise` comments — they cause `Definition for
rule 'jest/...' was not found` errors here.

### Window size (`enableTopQueries`, `enableGrouping`)
Upstream uses `window_size: '1m'`; the previous functional-test version
used `'5m'`. Keep `'1m'` so the Top N table populates inside a single
test's beforeEach instead of staying empty.

### Imports that aren't strictly needed
The upstream `WLM_AUTH` import is referenced by WLM-only specs which we
don't sync (see "Why WLM specs are not synced" above). If you do bring
WLM specs over later, also add `WLM_AUTH` to `constants.js` and the
`enableWlmMode` / `waitForWlmPlugin` helpers to `commands.js`.

## Updating from upstream

When upstream lands a UI change with matching cypress updates:

1. Diff the upstream spec(s) against this repo's copy.
2. Apply upstream's changes verbatim to the test bodies.
3. Re-apply the import / constant alias / `cy.reload()` adjustments
   listed above.
4. Run `yarn lint --fix` and `yarn cypress:run-with-security --spec
   'cypress/integration/plugins/query-insights-dashboards/<spec>'`
   against a local OS+QI dev cluster to verify.
5. Update this file if the set of required adjustments changed.
