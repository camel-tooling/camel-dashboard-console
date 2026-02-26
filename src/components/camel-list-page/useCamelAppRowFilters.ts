import { RowFilter, RowFilterItem } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { CamelAppKind } from '../../types';
import { getCamelVersions } from './camelAppVersion';
import { getHealthDisplayName } from './camel-health-utils';

export function statusFilterReducer(app): string {
  const status = app.status?.phase;
  return status ? `status-${status}` : 'status-undefined';
}
export function statusFilter(input, app): boolean {
  const reduced = statusFilterReducer(app);
  if (input.selected?.length) {
    return input.selected.includes(reduced);
  }
  return true;
}

export function statusFilterItems(CamelApps: CamelAppKind[]): RowFilterItem[] {
  const statuses = [...new Set(CamelApps.map((app) => app.status?.phase))].sort();

  if (statuses?.length) {
    return statuses.map((status) => {
      return { id: `status-${status}`, title: status };
    });
  } else {
    return [];
  }
}

export function runtimeProviderFilterReducer(app): string {
  if (!app.status?.pods) {
    return 'runtime-provider-unknown';
  }
  const runtimeProviderLower = app.status.pods[0]?.runtime?.runtimeProvider?.toLowerCase();
  if (runtimeProviderLower === undefined) {
    return 'runtime-provider-unknown';
  } else if (runtimeProviderLower.includes('spring')) {
    return 'runtime-provider-spring-boot';
  } else if (runtimeProviderLower.includes('quarkus')) {
    return 'runtime-provider-quarkus';
  } else {
    return 'runtime-provider-main';
  }
}

export function runtimeProviderFilter(input, app): boolean {
  const reduced = runtimeProviderFilterReducer(app);
  if (input.selected?.length) {
    return input.selected.includes(reduced);
  }
  return true;
}

export const runtimeProviderFilterItems: RowFilterItem[] = [
  { id: 'runtime-provider-spring-boot', title: 'Spring-Boot' },
  { id: 'runtime-provider-quarkus', title: 'Quarkus' },
  { id: 'runtime-provider-main', title: 'Camel Main' },
];

export function camelVersionFilterReducer(app): string {
  const versions = getCamelVersions(app, 'asc');
  if (versions) {
    return versions.map((v) => `camel-version-${v}`).join();
  }
  return '';
}

export function camelVersionFilter(input, app): boolean {
  const versions = getCamelVersions(app, 'asc');
  if (input.selected?.length) {
    if (versions?.length) {
      return versions.some((version) => input.selected.includes(`camel-version-${version}`));
    }
    return false;
  }
  return true;
}

export function camelVersionFilterItems(CamelApps: CamelAppKind[]): RowFilterItem[] {
  const versions = [
    ...new Set(
      CamelApps.map((app) => getCamelVersions(app, 'asc')).reduce((acc, camelVersions) => {
        if (camelVersions) {
          acc.push(...camelVersions.filter((version) => !!version));
        }
        return acc;
      }, []),
    ),
  ].sort();

  if (versions?.length) {
    return versions.map((version) => {
      return { id: `camel-version-${version}`, title: version };
    });
  } else {
    return [];
  }
}

export function camelHealthFilterReducer(app): string {
  const health = app.status?.sliExchangeSuccessRate
    ? app.status.sliExchangeSuccessRate.status
    : 'Unknown';
  return `camel-health-${health}`;
}

export function camelHealthFilter(input, app): boolean {
  const reduced = camelHealthFilterReducer(app);
  if (input.selected?.length) {
    return input.selected.includes(reduced);
  }
  return true;
}

export function camelHealthFilterItems(
  CamelApps: CamelAppKind[],
  t: (key: string) => string,
): RowFilterItem[] {
  const camelHealthes = [
    ...new Set(
      CamelApps.map((app) =>
        app.status?.sliExchangeSuccessRate ? app.status.sliExchangeSuccessRate.status : 'Unknown',
      ),
    ),
  ].sort();

  if (camelHealthes?.length) {
    return camelHealthes.map((camelHealth) => {
      return {
        id: `camel-health-${camelHealth}`,
        title: getHealthDisplayName(camelHealth, t),
      };
    });
  } else {
    return [];
  }
}

export const camelAppRowFilters = (CamelApps: CamelAppKind[]): RowFilter[] => {
  const { t } = useTranslation('plugin__camel-dashboard-console');
  return [
    {
      filterGroupName: t('Camel Health'),
      type: 'camel-health',
      reducer: camelHealthFilterReducer,
      filter: camelHealthFilter,
      items: camelHealthFilterItems(CamelApps, t),
    },
    {
      filterGroupName: t('Runtime Provider'),
      type: 'runtime-provider',
      reducer: runtimeProviderFilterReducer,
      filter: runtimeProviderFilter,
      items: runtimeProviderFilterItems,
    },
    {
      filterGroupName: t('Camel Version'),
      type: 'camel-version',
      reducer: camelVersionFilterReducer,
      filter: camelVersionFilter,
      items: camelVersionFilterItems(CamelApps),
    },
    {
      filterGroupName: t('Status'),
      type: 'status',
      reducer: statusFilterReducer,
      filter: statusFilter,
      items: statusFilterItems(CamelApps),
    },
  ];
};
