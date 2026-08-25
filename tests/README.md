# Integration Tests

Playwright-based end-to-end tests for the Camel Dashboard Console OpenShift plugin.

## Structure

```
tests/
├── config/
│   └── playwright.config.ts       # Playwright configuration
├── fixtures/
│   └── index.ts                   # Playwright fixtures (page objects, appInfo, error check)
├── pages/
│   ├── login.ts                   # Page object for the OCP console login flow
│   ├── console-page.ts            # Page object for OCP console interactions
│   ├── camel-list-page.ts         # Page object for Camel list page
│   └── camel-details-page.ts      # Page object for Camel details page
├── support/
│   └── check-errors.ts            # Asserts the console logged no JS errors
├── setup/
│   └── auth.setup.ts              # Login + save session (runs once before tests)
├── utils/
│   └── oc-utils.ts                # oc CLI helpers
├── plugin-integration.spec.ts     # Plugin loads and sidebar navigation works
├── camel-list-page.spec.ts        # List page functionality
└── camel-details-page.spec.ts     # Details page functionality
```

## Prerequisites

- OpenShift cluster with the Camel Dashboard plugin deployed
- `oc` CLI installed
- Node.js 20+ and Yarn
- Chrome and/or Firefox installed (tests run on both by default)

Install Playwright browsers if not already present:

```bash
npx playwright install chrome firefox
```

## Running Tests

Single command — pass cluster credentials via environment variables:

```bash
# Against a deployed cluster (plugin already installed)
CLUSTER_URL=https://api.mycluster.example.com:6443 \
CLUSTER_USER=kubeadmin \
CLUSTER_PASSWORD=<password> \
  yarn test:e2e

# If your cluster has multiple identity providers (e.g. kube:admin + htpasswd), specify which one to use:
CLUSTER_URL=https://api.mycluster.example.com:6443 \
CLUSTER_USER=admin \
CLUSTER_PASSWORD=<password> \
CLUSTER_IDP=my_htpasswd_provider \
  yarn test:e2e
```

The test runner will:
1. Log in to the cluster via `oc login`
2. Derive the console URL from the cluster
3. Authenticate via the OCP login page (once, reused across all tests)
4. Run all tests on Chrome and Firefox

### Browsers

Tests run on both **Chrome** and **Firefox** by default. To run a specific browser:

```bash
# Chrome only
yarn test:e2e --project=chrome

# Firefox only
yarn test:e2e --project=firefox
```

### Local Development (Dev Mode)

Dev mode is for testing **uncommitted local source code** without building a container image or deploying to the cluster. It auto-starts two local servers before running tests:

- **Plugin dev server** (`yarn start`, port 9001) — serves your local plugin JS/CSS bundle via webpack
- **Console bridge** (`start-console.sh`, port 9000) — runs the OpenShift Console UI in a container, connected to your cluster's API, loading the plugin from localhost:9001

Tests then run against `http://localhost:9000`, which is the full OpenShift Console with your local plugin code.

Dev mode works against **any** OpenShift cluster — CRC, remote, or deployed — as long as your machine can reach the cluster's API server. The console bridge runs locally but talks to the remote cluster, so you see real cluster data with your local plugin code.

In **default mode** (without `DEV`), the plugin is already deployed on the cluster. Tests open the cluster's own console URL directly — no local servers needed. This is what CI uses.

```bash
# Dev mode against local CRC
CLUSTER_URL=https://api.crc.testing:6443 \
CLUSTER_USER=kubeadmin \
CLUSTER_PASSWORD=<password> \
  yarn test:e2e-dev

# Dev mode against a remote cluster
CLUSTER_URL=https://api.remote-cluster.example.com:6443 \
CLUSTER_USER=admin \
CLUSTER_PASSWORD=<password> \
CLUSTER_IDP=my_htpasswd_provider \
  yarn test:e2e-dev

# Default mode — test deployed plugin
CLUSTER_URL=https://api.mycluster.example.com:6443 \
CLUSTER_USER=kubeadmin \
CLUSTER_PASSWORD=<password> \
  yarn test:e2e
```

### Additional Options

```bash
# Headed mode (see the browser)
yarn test:e2e-headed

# Playwright UI mode (interactive test runner)
yarn test:e2e-ui

# Specific test file
yarn test:e2e tests/camel-list-page.spec.ts

# Override number of parallel workers (default: 2)
yarn test:e2e --workers=1     # sequential
yarn test:e2e --workers=2     # 2 parallel workers
yarn test:e2e --workers=4     # 4 parallel workers
yarn test:e2e --workers=100%  # use all CPU cores

# NOTE: Multiple workers are safe for read-only tests (browsing pages, checking UI).
# If you add tests that create or delete cluster resources, use workers=1
# or implement per-worker namespace isolation to avoid test interference.

# View HTML report from last run
yarn test:e2e-report
```

## Architecture & Conventions

### Authentication

Login is encapsulated in a `LoginPage` page object (`pages/login.ts`) and runs
**once** via the `auth-setup` project (`setup/auth.setup.ts`), which saves the
authenticated session to `tests/.auth/state.json`. The `chrome` and `firefox`
projects declare `dependencies: ['auth-setup']` and load that session through
`storageState`, so individual tests never log in themselves.

`LoginPage.login()`:
- Short-circuits on auth-disabled clusters via the console's
  `window.SERVER_FLAGS.authDisabled` runtime flag.
- Handles both a direct username/password form and an identity-provider
  selection screen (uses `CLUSTER_IDP`, defaulting to `kube:admin` for
  `kubeadmin`).

### Fixtures

`fixtures/index.ts` extends Playwright's `test` with:
- `consolePage`, `listPage`, `detailsPage` — page objects injected per test.
- `appInfo` (worker-scoped) — discovers the first CamelApp in the cluster once
  per worker. The details specs `test.skip(...)` when it is `null` (no CamelApp
  deployed).
- `checkConsoleErrors` (auto) — after every test, asserts the console recorded
  no JS error (`window.windowError`). No per-test wiring needed.

Specs import `{ test, expect }` from `../fixtures`, **not** from
`@playwright/test`.

### Selectors

`testIdAttribute` is set to `data-test` in the config, so page objects use
`page.getByTestId('camelapp-name')` instead of
`page.locator('[data-test="camelapp-name"]')`. Prefer, in order: `getByTestId`
→ role/text locators → PatternFly (`.pf-v6-c-*`) / console (`.co-*`) classes.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `CLUSTER_URL` | OpenShift API server URL | Yes (unless `CONSOLE_URL` set) |
| `CLUSTER_USER` | Cluster username | Yes |
| `CLUSTER_PASSWORD` | Cluster password | Yes |
| `CLUSTER_IDP` | Identity provider name (e.g. `my_htpasswd_provider`). Auto-detected for `kubeadmin`. | No |
| `CONSOLE_URL` | Console URL (skips auto-detection) | No |
| `DEV` | Set to `true` for local dev mode | No |

## CI/CD

```bash
export CLUSTER_URL=https://api.ci-cluster.example.com:6443
export CLUSTER_USER=kubeadmin
export CLUSTER_PASSWORD=$KUBEADMIN_PASSWORD
yarn test:e2e
```

## Test Reports

Generated in `tests/reports/` after each run:

- `html/` — HTML report (open with `yarn test:e2e-report`)
- `test-results.json` — JSON report
- `artifacts/` — traces and screenshots on failure
