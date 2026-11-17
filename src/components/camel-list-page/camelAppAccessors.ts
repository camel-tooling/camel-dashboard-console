import { K8sResourceCondition } from '@openshift-console/dynamic-plugin-sdk';
import { CamelAppKind } from '../../types';
import { HealthStatus, getHealthStatus } from './camel-health-utils';

export const getStatus = (obj: CamelAppKind): string => obj.status?.phase ?? 'Unknown';

export const getRunningPodsCount = (obj: CamelAppKind): number =>
  obj.status?.pods?.filter((pod) => pod.status === 'Running').length ?? 0;

// Display the number of running Pods next to the status, e.g. "Running (2)".
export const getStatusDisplay = (obj: CamelAppKind): string => {
  const status = getStatus(obj);
  if (status !== 'Running') {
    return status;
  }
  const runningPods = getRunningPodsCount(obj);
  return runningPods > 0 ? `${status} (${runningPods})` : status;
};

export const getRuntimeProvider = (obj: CamelAppKind): string =>
  obj.status?.pods?.[0]?.runtime?.runtimeProvider ?? '';

export const getCamelHealth = (obj: CamelAppKind): string =>
  obj.status?.sliExchangeSuccessRate?.status ?? '';

export const getHealthFilterValue = (health: string): HealthStatus => {
  return getHealthStatus(health);
};

export const getUpgradeAvailableCondition = (
  obj: CamelAppKind,
): K8sResourceCondition | undefined => {
  const conditions = obj.status?.conditions?.filter(
    (condition) => condition.type === 'UpgradeAvailable',
  );
  return conditions?.length > 0 ? conditions[0] : undefined;
};

export const getUpgradeFilterValue = (obj: CamelAppKind): string => {
  const condition = getUpgradeAvailableCondition(obj);
  if (!condition) return 'Unknown';
  if (condition.status === 'True') return 'Available';
  if (condition.status === 'False') return 'Up to date';
  return 'Unknown';
};

export const getRuntimeFilterValue = (obj: CamelAppKind): string => {
  const provider = getRuntimeProvider(obj)?.toLowerCase();
  if (!provider) return 'unknown';
  if (provider.includes('spring')) return 'Spring-Boot';
  if (provider.includes('quarkus')) return 'Quarkus';
  return 'Camel Main';
};
