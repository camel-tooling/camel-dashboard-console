import { execHelm, execOc, ocDelete } from '../utils/oc-utils';
import {
  MANAGED_SELECTOR,
  getEnabledPlugins,
  pluginDeployViaHelm,
  resolveProvisioningNames,
  resolveSampleApps,
  setEnabledPlugins,
} from './provisioning';

/** Removes the plugin from the console operator's enabled list, if present. */
function disablePlugin(pluginName: string): void {
  const plugins = getEnabledPlugins();
  if (!plugins.includes(pluginName)) {
    return;
  }
  console.log(`[global-teardown] disabling plugin "${pluginName}"...`);
  setEnabledPlugins(plugins.filter((name) => name !== pluginName));
}

/**
 * Runs ONCE after all tests. Playwright calls whatever this file `export default`s.
 *
 * Only cleans up when DEPLOY=true (i.e. this run provisioned the resources). Set
 * KEEP_DEPLOY=true to leave everything installed for inspection after a run.
 *
 * Cleanup is label-scoped (camel-e2e-managed=true) for cluster-shared resource types,
 * so it can never delete things it didn't create — e.g. the redhat-operators catalog.
 */
async function globalTeardown(): Promise<void> {
  if (process.env.DEPLOY !== 'true') {
    return;
  }
  if (process.env.KEEP_DEPLOY === 'true') {
    console.log('[global-teardown] KEEP_DEPLOY=true — leaving provisioned resources in place');
    return;
  }

  const { operatorName, operatorNamespace, catalogNamespace, pluginName, sampleNamespace } =
    resolveProvisioningNames();
  const startingCsv = process.env.STARTING_CSV;

  // Delete sample apps first (same env as setup → same names). Removing the Deployment
  // and its CamelMonitor leaves nothing orphaned for the operator to reconcile.
  const sampleApps = resolveSampleApps();
  if (sampleApps.length > 0) {
    console.log('[global-teardown] deleting sample apps...');
    for (const app of sampleApps) {
      ocDelete('deployment', app.name, sampleNamespace);
      ocDelete('camelmonitors.camel.apache.org', app.name, sampleNamespace);
    }
  }

  // Disable the plugin first so the console stops referencing it.
  disablePlugin(pluginName);

  // If we installed the plugin via Helm, uninstall the release (removes its
  // Deployment/Service/ConfigMap/ConsolePlugin/RBAC).
  if (pluginDeployViaHelm()) {
    console.log('[global-teardown] uninstalling console plugin Helm release...');
    try {
      execHelm(`uninstall ${pluginName} --namespace ${operatorNamespace}`);
    } catch {
      // Release may not exist (setup failed before install) — ignore.
    }
  }

  // Delete the Subscription, then the CSV it leaves behind (deleting a Subscription
  // does not remove the installed ClusterServiceVersion).
  // Use the fully-qualified resource name: "subscription" alone is ambiguous on
  // clusters where Knative is installed (it also defines a Subscription kind), and
  // oc would delete the wrong one — leaving the OLM Subscription orphaned.
  console.log('[global-teardown] deleting Subscription and CSV...');
  ocDelete('subscriptions.operators.coreos.com', operatorName, operatorNamespace);
  if (startingCsv) {
    ocDelete('csv', startingCsv, operatorNamespace);
  }

  // The operator creates the (cluster-scoped) ConsolePlugin without an ownerRef, so
  // removing the CSV does NOT garbage-collect it. Delete it explicitly, otherwise a
  // stale ConsolePlugin lingers and makes the next run think the plugin is present.
  console.log('[global-teardown] deleting ConsolePlugin...');
  ocDelete('consoleplugins.console.openshift.io', pluginName);

  // Delete only the catalog/operatorgroup WE created (label-scoped), never shared ones.
  // --wait=false everywhere so teardown never blocks on termination/finalizers.
  console.log('[global-teardown] deleting managed CatalogSource and OperatorGroup...');
  execOc(
    `delete catalogsource -l ${MANAGED_SELECTOR} -n ${catalogNamespace} --ignore-not-found --wait=false`,
  );
  execOc(
    `delete operatorgroup -l ${MANAGED_SELECTOR} -n ${operatorNamespace} --ignore-not-found --wait=false`,
  );

  // Delete only namespaces we created (label-scoped, cluster-wide query).
  console.log('[global-teardown] deleting managed namespaces...');
  execOc(`delete namespace -l ${MANAGED_SELECTOR} --ignore-not-found --wait=false`);

  console.log('[global-teardown] cleanup complete.');
}

export default globalTeardown;
