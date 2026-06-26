import * as React from 'react';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import type { DataViewFilterOption } from '@patternfly/react-data-view/dist/esm/DataViewFilters';
import { CamelAppKind } from '../../types';
import {
  getStatus,
  getCamelHealth,
  getHealthFilterValue,
  getRuntimeFilterValue,
} from './camelAppAccessors';
import { getCamelVersions } from './camelAppVersion';

export type CamelFilters = {
  name: string;
  health: string[];
  runtime: string[];
  version: string[];
  status: string[];
};

export const initialFilters: CamelFilters = {
  name: '',
  health: [],
  runtime: [],
  version: [],
  status: [],
};

export const useCamelAppFilters = (data: CamelAppKind[]) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  const healthFilterOptions = useMemo<DataViewFilterOption[]>(() => {
    const values = [
      ...new Set(data.map((app) => getHealthFilterValue(getCamelHealth(app)))),
    ].sort();
    return values.map((v) => ({ value: v, label: v }));
  }, [data]);

  const runtimeFilterOptions = useMemo<DataViewFilterOption[]>(
    () => [
      { value: 'Spring-Boot', label: 'Spring-Boot' },
      { value: 'Quarkus', label: 'Quarkus' },
      { value: 'Camel Main', label: 'Camel Main' },
    ],
    [],
  );

  const versionFilterOptions = useMemo<DataViewFilterOption[]>(() => {
    const versions = [
      ...new Set(data.flatMap((app) => getCamelVersions(app, 'asc') ?? []).filter(Boolean)),
    ].sort();
    return versions.map((v) => ({ value: v, label: v }));
  }, [data]);

  const statusFilterOptions = useMemo<DataViewFilterOption[]>(() => {
    const statuses = [...new Set(data.map((app) => getStatus(app)))].sort();
    return statuses.map((s) => ({ value: s, label: s }));
  }, [data]);

  const additionalFilterNodes = useMemo<React.ReactNode[]>(
    () => [
      React.createElement(DataViewCheckboxFilter, {
        key: 'health',
        filterId: 'health',
        title: t('Camel Health'),
        placeholder: t('Filter by health'),
        options: healthFilterOptions,
      }),
      React.createElement(DataViewCheckboxFilter, {
        key: 'runtime',
        filterId: 'runtime',
        title: t('Runtime Provider'),
        placeholder: t('Filter by runtime'),
        options: runtimeFilterOptions,
      }),
      React.createElement(DataViewCheckboxFilter, {
        key: 'version',
        filterId: 'version',
        title: t('Camel Version'),
        placeholder: t('Filter by version'),
        options: versionFilterOptions,
      }),
      React.createElement(DataViewCheckboxFilter, {
        key: 'status',
        filterId: 'status',
        title: t('Status'),
        placeholder: t('Filter by status'),
        options: statusFilterOptions,
      }),
    ],
    [t, healthFilterOptions, runtimeFilterOptions, versionFilterOptions, statusFilterOptions],
  );

  const matchesAdditionalFilters = useCallback((resource: CamelAppKind, filters: CamelFilters) => {
    if (filters.health.length > 0) {
      const healthValue = getHealthFilterValue(getCamelHealth(resource));
      if (!filters.health.includes(healthValue)) return false;
    }
    if (filters.runtime.length > 0) {
      const runtimeValue = getRuntimeFilterValue(resource);
      if (!filters.runtime.includes(runtimeValue)) return false;
    }
    if (filters.version.length > 0) {
      const versions = getCamelVersions(resource, 'asc') ?? [];
      if (!filters.version.some((v) => versions.includes(v))) return false;
    }
    if (filters.status.length > 0) {
      const statusValue = getStatus(resource);
      if (!filters.status.includes(statusValue)) return false;
    }
    return true;
  }, []);

  return { additionalFilterNodes, matchesAdditionalFilters };
};
