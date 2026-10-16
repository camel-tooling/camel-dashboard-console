import { execOc } from '../utils/oc-utils';

/**
 * Label put on every resource global.setup creates, so global.teardown can delete
 * exactly those and never touch shared/pre-existing ones (e.g. the redhat-operators
 * catalog, or openshift-operators). Keep this in sync with the `labels:` blocks in
 * fixtures/manifests/*.yaml.
 */
export const MANAGED_SELECTOR = 'camel-e2e-managed=true';

/** The cluster-wide namespace that already has a global OperatorGroup. */
export const GLOBAL_OPERATOR_NAMESPACE = 'openshift-operators';

/** Default catalog name used when CATALOG_NAME isn't set. */
export const CUSTOM_CATALOG_NAME = 'camel-monitor-catalog';

/** Names/namespaces that setup and teardown must agree on. */
export interface ProvisioningNames {
  operatorName: string;
  operatorNamespace: string;
  catalogName: string;
  catalogNamespace: string;
  pluginName: string;
  /** Namespace to deploy sample Camel apps into (must be watched by the operator). */
  sampleNamespace: string;
}

/** Resolves the shared names from env vars, applying the same defaults in both phases. */
export function resolveProvisioningNames(): ProvisioningNames {
  const operatorNamespace = process.env.OPERATOR_NAMESPACE ?? GLOBAL_OPERATOR_NAMESPACE;
  return {
    operatorName: process.env.OPERATOR_NAME ?? 'camel-monitor-operator',
    operatorNamespace,
    catalogName: process.env.CATALOG_NAME ?? CUSTOM_CATALOG_NAME,
    catalogNamespace: process.env.CATALOG_NAMESPACE ?? 'openshift-marketplace',
    pluginName: process.env.PLUGIN_NAME ?? 'camel-dashboard-console',
    // Default to the operator's namespace, which is always within its watch scope
    // (AllNamespaces → anywhere; OwnNamespace → only operatorNamespace).
    sampleNamespace: process.env.SAMPLE_NAMESPACE ?? operatorNamespace,
  };
}

/**
 * Whether to deploy the console plugin ourselves via the Helm chart instead of
 * relying on the operator's auto-deploy. Needed for namespace-scoped (OwnNamespace)
 * installs, or operator builds that don't bundle the plugin. Requires PLUGIN_IMAGE.
 */
export function pluginDeployViaHelm(): boolean {
  return process.env.PLUGIN_DEPLOY === 'helm';
}

/** A sample Camel app to deploy so the plugin has something to list. */
export interface SampleApp {
  name: string;
  image: string;
}

/**
 * Resolves which sample apps to deploy from env vars. Deploy both, one, or none —
 * the operator detects each via the `camel.apache.org/monitor` label and creates a
 * CamelMonitor the plugin then lists. With none set, the details specs skip.
 */
export function resolveSampleApps(): SampleApp[] {
  const apps: SampleApp[] = [];
  if (process.env.CAMEL_SAMPLE_SB) {
    apps.push({ name: 'camel-sb-app', image: process.env.CAMEL_SAMPLE_SB });
  }
  if (process.env.CAMEL_SAMPLE_QUARKUS) {
    apps.push({ name: 'camel-quarkus-app', image: process.env.CAMEL_SAMPLE_QUARKUS });
  }
  return apps;
}

/** The part of the console operator config we read/patch. */
interface ConsoleOperatorConfig {
  spec?: { plugins?: string[] };
}

/** Reads the list of plugins currently enabled on the console operator. */
export function getEnabledPlugins(): string[] {
  const json = execOc('get consoles.operator.openshift.io cluster -o json');
  return (JSON.parse(json) as ConsoleOperatorConfig).spec?.plugins ?? [];
}

/** Replaces the console operator's enabled-plugins list (triggers a console redeploy). */
export function setEnabledPlugins(plugins: string[]): void {
  const patch = JSON.stringify({ spec: { plugins } });
  execOc(`patch consoles.operator.openshift.io cluster --type=merge -p '${patch}'`);
}
