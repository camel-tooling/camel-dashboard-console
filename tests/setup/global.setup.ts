import fs from 'fs';
import path from 'path';
import { execHelm, execOc, ocApplyYaml } from '../utils/oc-utils';
import { renderManifest } from '../utils/manifests';
import { waitFor } from '../utils/wait';
import {
  MANAGED_SELECTOR,
  getEnabledPlugins,
  pluginDeployViaHelm,
  resolveProvisioningNames,
  resolveSampleApps,
  setEnabledPlugins,
} from './provisioning';

/** Directory holding the packaged plugin Helm chart (camel-dashboard-console-*.tgz). */
const CHARTS_DIR = path.resolve(__dirname, '../../docs/charts');

/** Locates the vendored plugin chart so Helm installs are reproducible (no repo add). */
function findPluginChart(): string {
  const tgz = fs.readdirSync(CHARTS_DIR).find((f) => /^camel-dashboard-console-.*\.tgz$/.test(f));
  if (!tgz) {
    throw new Error(`No camel-dashboard-console chart (.tgz) found in ${CHARTS_DIR}`);
  }
  return path.join(CHARTS_DIR, tgz);
}

/**
 * Installs the console plugin from the vendored Helm chart. We disable the chart's
 * console-patching job so enabling stays in one place (setEnabledPlugins below), keeping
 * the rollout wait deterministic. Used when the operator doesn't auto-deploy the plugin.
 */
function deployPluginViaHelm(releaseName: string, image: string, namespace: string): void {
  try {
    execHelm('version --short');
  } catch {
    throw new Error('PLUGIN_DEPLOY=helm requires the "helm" CLI to be installed');
  }
  const chart = findPluginChart();
  console.log(`[global-setup] installing console plugin via Helm (${chart}) in "${namespace}"...`);
  execHelm(
    `upgrade --install ${releaseName} ${chart} --namespace ${namespace} ` +
      `--set plugin.name=${releaseName} --set plugin.image=${image} ` +
      `--set plugin.jobs.patchConsoles.enabled=false --wait --timeout 5m`,
  );
}

/** Reads a required env var, failing fast with a clear message if it's missing. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`DEPLOY=true requires the "${name}" environment variable to be set`);
  }
  return value;
}

/** Creates a namespace if it doesn't already exist, labelling ones we create for cleanup. */
function ensureNamespace(namespace: string): void {
  const existing = execOc(`get namespace ${namespace} --ignore-not-found -o name`);
  if (!existing) {
    console.log(`[global-setup] creating namespace "${namespace}"...`);
    execOc(`create namespace ${namespace}`);
    execOc(`label namespace ${namespace} ${MANAGED_SELECTOR}`);
  }
}

/**
 * Deploys a sample Camel app and waits for the operator to create its CamelMonitor
 * (the resource the plugin lists). The app is labelled camel.apache.org/monitor so the
 * operator picks it up.
 */
async function deploySampleApp(name: string, image: string, namespace: string): Promise<void> {
  console.log(`[global-setup] deploying sample app "${name}" (${image}) in "${namespace}"...`);
  ocApplyYaml(
    renderManifest('camel-sample-app.yaml', {
      APP_NAME: name,
      APP_NAMESPACE: namespace,
      APP_IMAGE: image,
    }),
  );
  console.log(`[global-setup] waiting for CamelMonitor "${name}" to be created...`);
  try {
    await waitFor(
      `CamelMonitor ${name}`,
      () =>
        execOc(
          `get camelmonitors.camel.apache.org ${name} -n ${namespace} --ignore-not-found -o name`,
        ) !== '',
      { timeoutMs: 180_000, intervalMs: 5_000 },
    );
  } catch {
    throw new Error(
      `CamelMonitor "${name}" was not created in "${namespace}". The operator must WATCH ` +
        `that namespace: with an OwnNamespace install it only watches OPERATOR_NAMESPACE, so ` +
        `either set SAMPLE_NAMESPACE=OPERATOR_NAMESPACE or install with ` +
        `OPERATOR_INSTALL_MODE=AllNamespaces.`,
    );
  }
}

/** Returns true if a CatalogSource with this name exists in the namespace. */
function catalogSourceExists(name: string, namespace: string): boolean {
  const found = execOc(`get catalogsource ${name} -n ${namespace} --ignore-not-found -o name`);
  return found !== '';
}

/**
 * Waits until a freshly-created CatalogSource reports its gRPC connection as READY.
 * Applying a Subscription before this works (OLM retries) but is noisy — this makes
 * the sequence explicit so the Subscription resolves on the first attempt.
 */
async function waitForCatalogReady(name: string, namespace: string): Promise<void> {
  await waitFor(
    `CatalogSource ${name} READY`,
    () => {
      const state = execOc(
        `get catalogsource ${name} -n ${namespace} --ignore-not-found ` +
          `-o jsonpath={.status.connectionState.lastObservedState}`,
      );
      console.log(`[global-setup]   catalog state: ${state || '(no status yet)'}`);
      return state === 'READY';
    },
    { timeoutMs: 180_000, intervalMs: 5_000 },
  );
}

/** Returns true if the namespace already has at least one OperatorGroup. */
function operatorGroupExists(namespace: string): boolean {
  const found = execOc(`get operatorgroup -n ${namespace} -o name`);
  return found !== '';
}

/** Returns true if a (cluster-scoped) ConsolePlugin with this name exists. */
function consolePluginExists(name: string): boolean {
  const found = execOc(`get consoleplugin ${name} --ignore-not-found -o name`);
  return found !== '';
}

/** The parts of the console Deployment we read to track a rollout. */
interface Deployment {
  metadata: { generation: number };
  spec: { replicas?: number };
  status?: { observedGeneration?: number; updatedReplicas?: number; availableReplicas?: number };
}

/** Reads the console Deployment's current generation. */
function getConsoleGeneration(): number {
  const json = execOc('get deployment console -n openshift-console -o json');
  return (JSON.parse(json) as Deployment).metadata.generation;
}

/**
 * Waits until the console Deployment has rolled out a generation newer than
 * `sinceGeneration` and all its replicas are updated and available.
 *
 * Comparing against the pre-patch generation avoids a race where we'd otherwise
 * see the OLD, already-complete rollout and return before the new one starts.
 */
async function waitForConsoleRollout(sinceGeneration: number): Promise<void> {
  await waitFor(
    'console rollout to complete',
    () => {
      const d = JSON.parse(
        execOc('get deployment console -n openshift-console -o json'),
      ) as Deployment;
      const desired = d.spec.replicas ?? 1;
      return (
        d.metadata.generation > sinceGeneration &&
        (d.status?.observedGeneration ?? 0) >= d.metadata.generation &&
        (d.status?.updatedReplicas ?? 0) === desired &&
        (d.status?.availableReplicas ?? 0) === desired
      );
    },
    { timeoutMs: 300_000, intervalMs: 5_000 },
  );
}

/**
 * Waits until the console Deployment stops changing - same generation and fully
 * available for a sustained window. Enabling a plugin often triggers a SECOND console
 * rollout shortly after the first; if we returned after just one, that later rollout
 * would restart the console mid-test and invalidate auth.setup's saved session
 * (tests then get redirected to the OAuth login page). This absorbs it before login.
 */
async function waitForConsoleStable(): Promise<void> {
  const stableForMs = 30_000;
  let lastGeneration = -1;
  let stableSince = Date.now();
  await waitFor(
    'console to stop redeploying',
    () => {
      const d = JSON.parse(
        execOc('get deployment console -n openshift-console -o json'),
      ) as Deployment;
      const desired = d.spec.replicas ?? 1;
      const ready =
        (d.status?.observedGeneration ?? 0) >= d.metadata.generation &&
        (d.status?.updatedReplicas ?? 0) === desired &&
        (d.status?.availableReplicas ?? 0) === desired;
      if (ready && d.metadata.generation === lastGeneration) {
        return Date.now() - stableSince >= stableForMs;
      }
      // New generation or not fully ready → restart the stability window.
      lastGeneration = d.metadata.generation;
      stableSince = Date.now();
      return false;
    },
    { timeoutMs: 300_000, intervalMs: 5_000 },
  );
}

/**
 * Runs ONCE before any test (and before the auth-setup project).
 * Playwright calls whatever this file `export default`s.
 *
 * Deployment is OPT-IN: by default we assume the operator + plugin are already on
 * the cluster and just run the tests. Set DEPLOY=true to provision everything first.
 */
async function globalSetup(): Promise<void> {
  if (process.env.DEPLOY !== 'true') {
    console.log('[global-setup] DEPLOY != true — skipping provisioning, using existing install');
    return;
  }

  const channel = requireEnv('CHANNEL');
  const startingCsv = requireEnv('STARTING_CSV');
  const {
    operatorName,
    operatorNamespace,
    catalogName,
    catalogNamespace,
    pluginName,
    sampleNamespace,
  } = resolveProvisioningNames();

  // The install namespace needs exactly ONE OperatorGroup. openshift-operators has
  // a cluster-wide one; a custom namespace may have none (fresh) or already have
  // one (prior run / pre-existing). Create ours only when none exists - a second
  // OperatorGroup would break the install.
  //
  // OPERATOR_INSTALL_MODE picks the watch scope for a custom namespace:
  //   OwnNamespace (default) - watch only operatorNamespace (sample apps must live there)
  //   AllNamespaces          - watch the whole cluster (sample apps can be anywhere)
  const installMode = process.env.OPERATOR_INSTALL_MODE ?? 'OwnNamespace';
  if (installMode !== 'OwnNamespace' && installMode !== 'AllNamespaces') {
    throw new Error(
      `OPERATOR_INSTALL_MODE must be "OwnNamespace" or "AllNamespaces", got "${installMode}"`,
    );
  }
  ensureNamespace(operatorNamespace);
  if (operatorGroupExists(operatorNamespace)) {
    console.log(`[global-setup] namespace "${operatorNamespace}" already has an OperatorGroup`);
  } else {
    const ogManifest =
      installMode === 'AllNamespaces'
        ? 'operator-group-all-namespaces.yaml'
        : 'operator-group.yaml';
    console.log(
      `[global-setup] creating ${installMode} OperatorGroup in "${operatorNamespace}"...`,
    );
    ocApplyYaml(renderManifest(ogManifest, { OPERATOR_NAMESPACE: operatorNamespace }));
  }

  // Ensure the catalog exists: reuse it if it's already on the cluster (e.g. a GA
  // catalog like redhat-operators), otherwise build it from INDEX_IMAGE.
  if (catalogSourceExists(catalogName, catalogNamespace)) {
    console.log(`[global-setup] using existing catalog "${catalogName}"`);
  } else {
    const indexImage = requireEnv('INDEX_IMAGE');
    console.log(`[global-setup] creating CatalogSource "${catalogName}" from ${indexImage}...`);
    ocApplyYaml(
      renderManifest('catalog-source.yaml', {
        CATALOG_NAME: catalogName,
        CATALOG_NAMESPACE: catalogNamespace,
        INDEX_IMAGE: indexImage,
      }),
    );
    console.log(`[global-setup] waiting for CatalogSource "${catalogName}" to be READY...`);
    await waitForCatalogReady(catalogName, catalogNamespace);
  }

  console.log('[global-setup] applying Subscription...');
  ocApplyYaml(
    renderManifest('subscription.yaml', {
      OPERATOR_NAME: operatorName,
      OPERATOR_NAMESPACE: operatorNamespace,
      CHANNEL: channel,
      STARTING_CSV: startingCsv,
      CATALOG_NAME: catalogName,
      CATALOG_NAMESPACE: catalogNamespace,
    }),
  );

  console.log(`[global-setup] waiting for CSV "${startingCsv}" to reach Succeeded...`);
  await waitFor(
    `CSV ${startingCsv} Succeeded`,
    () => {
      // --ignore-not-found: before OLM creates the CSV, this returns an empty
      // string (exit 0) instead of throwing, so the loop can keep polling.
      const phase = execOc(
        `get csv ${startingCsv} -n ${operatorNamespace} --ignore-not-found ` +
          `-o jsonpath={.status.phase}`,
      );
      if (phase) {
        console.log(`[global-setup]   CSV phase: ${phase}`);
        return phase === 'Succeeded';
      }
      // No CSV yet — show the Subscription's progress so a slow/stuck install is visible.
      // Fully-qualified name: "subscription" is ambiguous when Knative is installed.
      const subState = execOc(
        `get subscriptions.operators.coreos.com ${operatorName} -n ${operatorNamespace} ` +
          `--ignore-not-found -o jsonpath={.status.state}`,
      );
      console.log(`[global-setup]   CSV not created yet (subscription: ${subState || 'unknown'})`);
      return false;
    },
    { timeoutMs: 600_000, intervalMs: 5_000 },
  );

  console.log('[global-setup] operator installed.');

  // Enable the console plugin. This is separate from the Subscription — it patches
  // the console operator, which redeploys the console and LOGS OUT any session.
  // We run before the auth-setup project, so auth.setup logs in afterwards against
  // the stable console. Doing it idempotently avoids a needless rollout on reruns.

  // In global mode the operator auto-deploys the plugin (incl. the ConsolePlugin CR).
  // For namespace-scoped installs (or builds without the plugin) deploy it ourselves
  // from the Helm chart, which creates the same ConsolePlugin the steps below expect.
  if (pluginDeployViaHelm()) {
    const pluginImage = requireEnv('PLUGIN_IMAGE');
    deployPluginViaHelm(pluginName, pluginImage, operatorNamespace);
  }

  // The ConsolePlugin CR appears shortly AFTER the CSV succeeds (operator) or the Helm
  // install, so poll for it rather than checking once. Time out with a helpful hint if
  // it never appears.
  console.log(`[global-setup] waiting for ConsolePlugin "${pluginName}" to be created...`);
  try {
    await waitFor(`ConsolePlugin ${pluginName} to exist`, () => consolePluginExists(pluginName), {
      timeoutMs: 120_000,
      intervalMs: 5_000,
    });
  } catch {
    throw new Error(
      `ConsolePlugin "${pluginName}" was not created after the operator installed. ` +
        `The operator only auto-deploys the plugin in GLOBAL mode ` +
        `(OPERATOR_NAMESPACE=openshift-operators) and only from a catalog that bundles it ` +
        `(the community catalog ships the operator only). Check OPERATOR_NAME/version/` +
        `CATALOG_NAME, or set PLUGIN_NAME to the correct name.`,
    );
  }

  const enabledPlugins = getEnabledPlugins();
  if (enabledPlugins.includes(pluginName)) {
    console.log(`[global-setup] plugin "${pluginName}" already enabled`);
  } else {
    const generationBefore = getConsoleGeneration();
    console.log(`[global-setup] enabling plugin "${pluginName}" (console will redeploy)...`);
    setEnabledPlugins([...enabledPlugins, pluginName]);

    console.log('[global-setup] waiting for console rollout...');
    await waitForConsoleRollout(generationBefore);
    console.log('[global-setup] console rollout complete.');
  }

  // Deploy sample Camel app(s) so the plugin has something to list and the details
  // specs can run. With no CAMEL_SAMPLE_* image set, those specs skip (by design).
  const sampleApps = resolveSampleApps();
  if (sampleApps.length === 0) {
    console.log('[global-setup] no CAMEL_SAMPLE_* image set — skipping sample apps');
  } else {
    if (sampleNamespace !== operatorNamespace) {
      ensureNamespace(sampleNamespace);
    }
    for (const app of sampleApps) {
      await deploySampleApp(app.name, app.image, sampleNamespace);
    }
  }

  // Final gate before auth.setup logs in: ensure the console has stopped redeploying,
  // so a late plugin-induced rollout can't invalidate the saved session mid-test.
  console.log('[global-setup] waiting for the console to stabilize before login...');
  await waitForConsoleStable();
  console.log('[global-setup] console is stable.');
}

export default globalSetup;
