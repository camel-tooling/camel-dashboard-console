import { CamelAppKind } from '../../types';
import { HealthStatus, getHealthStatus } from './camel-health-utils';

export const getStatus = (obj: CamelAppKind): string => obj.status?.phase ?? 'Unknown';

export const getRuntimeProvider = (obj: CamelAppKind): string =>
  obj.status?.pods?.[0]?.runtime?.runtimeProvider ?? '';

export const getCamelHealth = (obj: CamelAppKind): string =>
  obj.status?.sliExchangeSuccessRate?.status ?? '';

export const getHealthFilterValue = (health: string): HealthStatus => {
  return getHealthStatus(health);
};

export const getRuntimeFilterValue = (obj: CamelAppKind): string => {
  const provider = getRuntimeProvider(obj)?.toLowerCase();
  if (!provider) return 'unknown';
  if (provider.includes('spring')) return 'Spring-Boot';
  if (provider.includes('quarkus')) return 'Quarkus';
  return 'Camel Main';
};
