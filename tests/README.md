# Integration Tests

Playwright-based end-to-end tests for the Camel Dashboard Console OpenShift plugin.

## Platform

These tests target **OpenShift** and are not portable to vanilla Kubernetes:

- The plugin is an **OpenShift Console dynamic plugin** — it only runs inside the OpenShift web console, which the tests drive. Plain k8s has no OpenShift console to host it
- `DEPLOY=true` provisioning relies on **OLM** (`CatalogSource`, `Subscription`, `OperatorGroup`, `CSV`) and the **OpenShift Console operator** (`ConsolePlugin`, `consoles.operator.openshift.io`). OpenShift ships these built-in; vanilla k8s does  not (OLM would have to be installed, and there is no OpenShift-console equivalent).
- Commands use `oc`. It is a superset of `kubectl`, so the generic apply/delete calls would translate, but the OLM/console pieces above would not — so running on upstream  k8s is **not supported**.

**CRC / OpenShift Local works** — it is a single-node OpenShift, so OLM, the console, and `ConsolePlugin` are all present. Point `CLUSTER_URL` at it like any other cluster (see Dev Mode examples below).

## Structure

```
tests/
├── config/
│   ├── playwright.config.ts       # Playwright configuration
│   └── paths.ts                   # Shared absolute paths (e.g. auth storageState)
├── fixtures/
│   ├── fixtures.ts                # Playwright fixtures (page objects, appInfo, error check)
│   └── manifests/                 # Cluster resource YAMLs applied during DEPLOY provisioning
│       ├── catalog-source.yaml    # Custom (non-GA) CatalogSource, built from INDEX_IMAGE
│       ├── operator-group.yaml    # OperatorGroup for custom-namespace installs
│       ├── subscription.yaml      # OLM Subscription for the operator
│       └── camel-sample-app.yaml  # Sample Camel app Deployment (so the plugin has apps to list)
├── pages/
│   ├── login.ts                   # Page object for the OCP console login flow
│   ├── console-page.ts            # Page object for OCP console interactions
│   ├── camel-list-page.ts         # Page object for Camel list page
│   └── camel-details-page.ts      # Page object for Camel details page
├── support/
│   └── check-errors.ts            # Asserts the console logged no JS errors
├── setup/
│   ├── auth.setup.ts              # Login + save session (runs once before tests)
│   ├── global.setup.ts            # Optional operator + plugin provisioning (DEPLOY=true)
│   ├── global.teardown.ts         # Cleanup of provisioned resources (DEPLOY=true)
│   └── provisioning.ts            # Shared names/labels/console-plugin helpers for setup+teardown
├── utils/
│   ├── oc-utils.ts                # oc CLI helpers (exec, apply, delete)
│   ├── manifests.ts               # Reads a manifest and substitutes ${VAR} placeholders
│   └── wait.ts                    # sleep() + waitFor() polling helper
└── specs/
    ├── plugin-integration.spec.ts # Plugin loads and sidebar navigation works
    ├── camel-list-page.spec.ts    # List page functionality
    └── camel-details-page.spec.ts # Details page functionality
```

## Prerequisites

- OpenShift cluster with the Camel Dashboard plugin deployed — **or** set `DEPLOY=true`
  to have the test run provision the operator + plugin for you (see
  [Deploying the operator + plugin](#deploying-the-operator--plugin-deploytrue))
- `oc` CLI installed and logged in the cluster
- `helm` CLI — only when using `PLUGIN_DEPLOY=helm` (namespace-scoped plugin install)
- Node.js 22 (see `.nvmrc`) and Yarn
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

> **Note:** If Playwright's bundled Chromium cannot be downloaded (e.g. CDN unreachable), set `BROWSER_CHANNEL=chrome` to use your system Chrome for the auth-setup step. This applies to both browser projects since `auth-setup` is a shared dependency:
> ```bash
> BROWSER_CHANNEL=chrome yarn test:e2e --project=chrome
> ```

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

### Deploying the operator + plugin (`DEPLOY=true`)

Provisioning is **opt-in**. By default the test run assumes the operator and plugin
are already installed and just runs the tests against them. Set `DEPLOY=true` to have
`global.setup.ts` install everything once, before any test, as part of the same command.

```bash
# Build a custom catalog from an index image and install from it (the default)
DEPLOY=true \
INDEX_IMAGE=quay.io/your-org/camel-catalog:latest \
CHANNEL=candidate \
STARTING_CSV=camel-monitor-operator.v1.0.0 \
CLUSTER_URL=https://api.mycluster.example.com:6443 \
CLUSTER_USER=kubeadmin \
CLUSTER_PASSWORD=<password> \
  yarn test:e2e

# Install from an existing catalog (e.g. redhat-operators), no INDEX_IMAGE
DEPLOY=true \
CATALOG_NAME=redhat-operators \
OPERATOR_NAME=<ga-package-name> \
CHANNEL=stable \
STARTING_CSV=<csv> \
CLUSTER_URL=... CLUSTER_USER=... CLUSTER_PASSWORD=... \
  yarn test:e2e

# Custom single namespace (upstream OwnNamespace install) — pass OPERATOR_NAMESPACE
DEPLOY=true \
INDEX_IMAGE=quay.io/your-org/camel-catalog:latest \
CHANNEL=candidate \
STARTING_CSV=camel-monitor-operator.v1.0.0 \
OPERATOR_NAMESPACE=camel-test \
CLUSTER_URL=... CLUSTER_USER=... CLUSTER_PASSWORD=... \
  yarn test:e2e

# With sample Camel apps so the details specs run (deploy both, or just one)
DEPLOY=true \
INDEX_IMAGE=quay.io/your-org/camel-catalog:latest \
CHANNEL=candidate \
STARTING_CSV=camel-monitor-operator.v1.0.0 \
CAMEL_SAMPLE_SB=quay.io/your-org/camel-sampple-sb:latest \
CAMEL_SAMPLE_QUARKUS=quay.io/your-org/camel-sample-quarkus:latest \
SAMPLE_NAMESPACE=sample-apps \
CLUSTER_URL=... CLUSTER_USER=... CLUSTER_PASSWORD=... \
  yarn test:e2e

# Operator in a custom namespace, watching ALL namespaces, plugin via Helm, sample app
# in its own namespace (requires the helm CLI)
DEPLOY=true \
CATALOG_NAME=community-operators \
CHANNEL=stable-v0 \
STARTING_CSV=camel-monitor-operator.v0.2.1 \
OPERATOR_NAMESPACE=camel-test \
OPERATOR_INSTALL_MODE=AllNamespaces \
PLUGIN_DEPLOY=helm \
PLUGIN_IMAGE=quay.io/camel-tooling/camel-dashboard-console:latest \
CAMEL_SAMPLE_SB=quay.io/camel-tooling/sample-db-app-sb:4.18.x-redhat \
SAMPLE_NAMESPACE=sample-camel-sb \
CLUSTER_URL=... CLUSTER_USER=... CLUSTER_PASSWORD=... \
  yarn test:e2e
```

By default the operator installs cluster-wide into `openshift-operators`. To install it
into a **custom namespace** instead, set `OPERATOR_NAMESPACE`. The setup creates that
namespace and an OperatorGroup in it, whose scope is controlled by `OPERATOR_INSTALL_MODE`:

- **`OwnNamespace`** (default) — the operator watches **only** `OPERATOR_NAMESPACE`. Sample
  apps must therefore live in that same namespace (`SAMPLE_NAMESPACE` defaults to it).
- **`AllNamespaces`** — the operator is installed in the custom namespace but watches the
  **whole cluster**, so sample apps can live anywhere (e.g. a separate `SAMPLE_NAMESPACE`).

Either way the operator's CSV must declare the chosen mode as supported — check with
`oc get csv <STARTING_CSV> -n <ns> -o jsonpath='{.spec.installModes}'`.

> **Mismatched namespaces → CamelMonitor timeout.** With `OwnNamespace` (the default), a
> sample app deployed to a *different* `SAMPLE_NAMESPACE` is never seen by the operator, so no
> `CamelMonitor` is created and setup times out. Fix by setting `SAMPLE_NAMESPACE` equal to
> `OPERATOR_NAMESPACE`, or by installing with `OPERATOR_INSTALL_MODE=AllNamespaces`.

> **Console plugin requires GLOBAL install mode — unless you deploy it via Helm.** The
> operator only auto-deploys the console plugin (Deployment/Service/ConfigMap/ConsolePlugin)
> when installed in **global mode** — i.e. `OPERATOR_NAMESPACE=openshift-operators` (the
> default). A **namespace-scoped install provisions the operator only**. To test the plugin
> alongside a namespace-scoped operator (or with a build that doesn't bundle it), set
> **`PLUGIN_DEPLOY=helm`** with **`PLUGIN_IMAGE=<image>`**: setup installs the plugin from the
> vendored chart (`docs/charts/camel-dashboard-console-*.tgz`, no `helm repo add` needed) and
> then enables it as usual. This path requires the **`helm` CLI** (only for this mode).

What `DEPLOY=true` does, in order (all steps are idempotent, so reruns are safe):

1. Ensures the install namespace (`OPERATOR_NAMESPACE`, default `openshift-operators`)
   exists and has exactly one OperatorGroup (creates one only for a custom namespace that
   lacks it; `openshift-operators` already has a global one).
2. Ensures the catalog exists — reuses it if present, otherwise builds a `CatalogSource`
   from `INDEX_IMAGE`.
3. Applies the `Subscription` and waits for the operator's CSV to reach `Succeeded`.
4. Makes the console plugin available, then enables it: in global mode the operator
   auto-deploys it; with `PLUGIN_DEPLOY=helm` setup installs it from the vendored chart
   instead. Either way it's disabled by default, so setup patches
   `consoles.operator.openshift.io/cluster` to enable it and waits for the console to redeploy.
5. (Optional) Deploys sample Camel app(s) if `CAMEL_SAMPLE_SB` and/or
   `CAMEL_SAMPLE_QUARKUS` are set, then waits for the operator to create each
   `CamelMonitor`. Each sample Deployment is labelled `camel.apache.org/monitor=<name>`,
   which is how the operator detects it.

> **Sample apps & the details specs:** the `camel-details-page` specs need at least one
> CamelApp in the cluster; without one they **skip** (`No CamelApp found in cluster`). Set
> `CAMEL_SAMPLE_SB` and/or `CAMEL_SAMPLE_QUARKUS` (see the sample-apps example above) to
> deploy one and exercise those specs.
>
> **Caveat: only one app is tested.** The details specs use `findFirstApp()`, so if **both**
> sample apps are deployed, only the **first** one is actually tested (the other just adds to
> the list). So it usually makes sense to deploy **one** sample app (pass just one of
> `CAMEL_SAMPLE_SB` / `CAMEL_SAMPLE_QUARKUS`). Deploying **both** is still fine if you also
> pass `KEEP_DEPLOY=true`, in this case the deployments stay after the run so you can inspect the second
> app manually for debugging.

> **Why plugin-enable happens here, before login:** patching the console's plugin list
> redeploys the console and **logs out any session**. `global.setup` runs before the
> `auth-setup` project, so the login (and saved `storageState`) happens *after* the
> redeploy settles — otherwise the session would be invalidated mid-run.

**Cleanup** runs automatically after the tests (`global.teardown.ts`, also gated on
`DEPLOY=true`): it **disables the plugin first** (the plugin must be disabled before the
operator is removed, or the cluster keeps considering it enabled), deletes the Subscription
+ CSV, deletes the ConsolePlugin (the operator creates it without an ownerRef, so it isn't
garbage-collected on uninstall), and removes the CatalogSource, OperatorGroup, sample apps,
and any namespace it created. Cleanup is **label-scoped** (`camel-e2e-managed=true`) for
cluster-shared types, so it only deletes resources `global.setup` created and never touches
shared ones such as the `redhat-operators` catalog or `openshift-operators`.

> **Inspecting after a run:** set `KEEP_DEPLOY=true` to skip cleanup and leave the
> operator and plugin installed for debugging.

### Additional Options

```bash
# Headed mode (see the browser)
yarn test:e2e-headed

# Playwright UI mode (interactive test runner)
yarn test:e2e-ui

# Specific test file
yarn test:e2e tests/specs/camel-list-page.spec.ts

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

`fixtures/fixtures.ts` extends Playwright's `test` with:
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
| `BROWSER_CHANNEL` | Browser channel for the auth-setup project (e.g. `chrome`). Useful when Playwright's bundled Chromium is not available. | No |

### Provisioning (`DEPLOY=true` only)

These are read by `global.setup.ts` and ignored unless `DEPLOY=true`.

| Variable | Description | Required |
|---|---|---|
| `DEPLOY` | Set to `true` to provision the operator + plugin before tests (and clean up after) | No (default: off) |
| `KEEP_DEPLOY` | Set to `true` to skip teardown and leave provisioned resources in place | No |
| `CHANNEL` | Subscription channel | Yes (when `DEPLOY=true`) |
| `STARTING_CSV` | CSV (version) to install and wait for | Yes (when `DEPLOY=true`) |
| `INDEX_IMAGE` | Catalog index image | Only when the catalog must be created |
| `OPERATOR_NAME` | Operator package name | No (default: `camel-monitor-operator`) |
| `OPERATOR_NAMESPACE` | Install namespace | No (default: `openshift-operators`) |
| `OPERATOR_INSTALL_MODE` | OperatorGroup scope for a custom namespace: `OwnNamespace` (watch only that namespace) or `AllNamespaces` (watch the whole cluster) | No (default: `OwnNamespace`) |
| `CATALOG_NAME` | CatalogSource name to install from | No (default: `camel-monitor-catalog`) |
| `CATALOG_NAMESPACE` | CatalogSource namespace | No (default: `openshift-marketplace`) |
| `PLUGIN_NAME` | ConsolePlugin name to enable | No (default: `camel-dashboard-console`) |
| `PLUGIN_DEPLOY` | `helm` to deploy the plugin from the vendored Helm chart instead of relying on the operator's auto-deploy (for namespace-scoped installs) | No (default: operator auto-deploy) |
| `PLUGIN_IMAGE` | Plugin container image | Yes when `PLUGIN_DEPLOY=helm` |
| `CAMEL_SAMPLE_SB` | Image for a Spring Boot sample app (`camel-sb-app`) to deploy | No |
| `CAMEL_SAMPLE_QUARKUS` | Image for a Quarkus sample app (`camel-quarkus-app`) to deploy | No |
| `SAMPLE_NAMESPACE` | Namespace to deploy sample apps into | No (default: `OPERATOR_NAMESPACE`) |

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
