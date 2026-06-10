import * as React from 'react';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DocumentTitle,
  ListPageBody,
  ListPageHeader,
  NamespaceBar,
  Timestamp,
  useActiveNamespace,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import { Label } from '@patternfly/react-core';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import type { DataViewFilterOption } from '@patternfly/react-data-view/dist/esm/DataViewFilters';
import { MinusIcon } from '@patternfly/react-icons';
import { SortByDirection } from '@patternfly/react-table';
import { Link } from 'react-router-dom';
import '../../camel.css';
import { ALL_NAMESPACES_KEY } from '../../const';
import { CamelAppKind } from '../../types';
import CamelAppHealth from './CamelAppHealth';
import CamelAppListEmpty from './CamelAppListEmpty';
import CamelAppNotAvailable from './CamelAppNotAvailable';
import CamelNewProjectAlert from './CamelNewProjectAlert';
import CamelImage from '@images/camel.svg';
import {
  CamelDataView,
  CamelDataViewColumn,
  CamelDataViewTd,
  nameCellProps,
  nameColumnProps,
} from './CamelDataView';
import { useCamelAppList } from './useCamelAppList';
import { sortResourceByCamelVersion, getCamelVersionAsString } from './camelAppVersion';
import { sortResourceByLastMessage, getLastMessageTimestamp } from './lastMessage';
import { getCamelVersions } from './camelAppVersion';

type CamelFilters = {
  name: string;
  health: string[];
  runtime: string[];
  version: string[];
  status: string[];
};

const initialFilters: CamelFilters = {
  name: '',
  health: [],
  runtime: [],
  version: [],
  status: [],
};

const getStatus = (obj: CamelAppKind) => obj.status?.phase ?? 'Unknown';
const getRuntimeProvider = (obj: CamelAppKind) =>
  obj.status?.pods?.[0]?.runtime?.runtimeProvider ?? '';
const getCamelHealth = (obj: CamelAppKind) =>
  obj.status?.sliExchangeSuccessRate?.status ?? '';

const getHealthFilterValue = (health: string): string => {
  switch (health?.toLowerCase()) {
    case 'ok':
    case 'success':
      return 'Healthy';
    case 'warning':
      return 'Degraded';
    case 'error':
      return 'Critical';
    default:
      return 'Unknown';
  }
};

const getRuntimeFilterValue = (obj: CamelAppKind): string => {
  const provider = getRuntimeProvider(obj)?.toLowerCase();
  if (!provider) return 'unknown';
  if (provider.includes('spring')) return 'Spring-Boot';
  if (provider.includes('quarkus')) return 'Quarkus';
  return 'Camel Main';
};

const CamelAppList: React.FC = () => {
  const { t } = useTranslation('plugin__camel-dashboard-console');
  const [activeNamespace, setActiveNamespace] = useActiveNamespace();

  const namespace = activeNamespace === ALL_NAMESPACES_KEY ? '' : activeNamespace;
  const showNamespace = !namespace;

  const columns = useMemo<CamelDataViewColumn<CamelAppKind>[]>(
    () => [
      { title: t('Name'), id: 'name', sortFunction: 'metadata.name', props: nameColumnProps },
      ...(showNamespace
        ? [{ title: t('Namespace'), id: 'namespace', sortFunction: 'metadata.namespace' }]
        : []),
      { title: t('Status'), id: 'status', sortFunction: 'status.phase' },
      {
        title: t('Camel Health'),
        id: 'health',
        sortFunction: 'status.sliExchangeSuccessRate.status',
      },
      {
        title: t('Runtime Provider'),
        id: 'runtime',
        sortFunction: 'status.pods[0].runtime.runtimeProvider',
      },
      {
        title: t('Camel Version'),
        id: 'camel',
        sortFunction: (data: CamelAppKind[], direction: SortByDirection) =>
          [...data].sort(sortResourceByCamelVersion(direction)),
      },
      {
        title: t('Time since the last message'),
        id: 'lastmessage',
        sortFunction: (data: CamelAppKind[], direction: SortByDirection) =>
          [...data].sort(sortResourceByLastMessage(direction)),
      },
    ],
    [t, showNamespace],
  );

  const { CamelApps, loaded, error } = useCamelAppList(namespace);

  const oldCRDFlagEnabled = useFlag('CAMEL_APP_FLAG');
  const newCRDFlagEnabled = useFlag('CAMEL_MONITOR_FLAG');
  const operatorInstalled = oldCRDFlagEnabled || newCRDFlagEnabled;

  const healthFilterOptions = useMemo<DataViewFilterOption[]>(() => {
    const values = [
      ...new Set(
        CamelApps.map((app) => getHealthFilterValue(getCamelHealth(app))),
      ),
    ].sort();
    return values.map((v) => ({ value: v, label: v }));
  }, [CamelApps]);

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
      ...new Set(
        CamelApps.flatMap((app) => getCamelVersions(app, 'asc') ?? []).filter(Boolean),
      ),
    ].sort();
    return versions.map((v) => ({ value: v, label: v }));
  }, [CamelApps]);

  const statusFilterOptions = useMemo<DataViewFilterOption[]>(() => {
    const statuses = [...new Set(CamelApps.map((app) => getStatus(app)))].sort();
    return statuses.map((s) => ({ value: s, label: s }));
  }, [CamelApps]);

  const additionalFilterNodes = useMemo<React.ReactNode[]>(
    () => [
      <DataViewCheckboxFilter
        key="health"
        filterId="health"
        title={t('Camel Health')}
        placeholder={t('Filter by health')}
        options={healthFilterOptions}
      />,
      <DataViewCheckboxFilter
        key="runtime"
        filterId="runtime"
        title={t('Runtime Provider')}
        placeholder={t('Filter by runtime')}
        options={runtimeFilterOptions}
      />,
      <DataViewCheckboxFilter
        key="version"
        filterId="version"
        title={t('Camel Version')}
        placeholder={t('Filter by version')}
        options={versionFilterOptions}
      />,
      <DataViewCheckboxFilter
        key="status"
        filterId="status"
        title={t('Status')}
        placeholder={t('Filter by status')}
        options={statusFilterOptions}
      />,
    ],
    [t, healthFilterOptions, runtimeFilterOptions, versionFilterOptions, statusFilterOptions],
  );

  const matchesAdditionalFilters = useCallback(
    (resource: CamelAppKind, filters: CamelFilters) => {
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
    },
    [],
  );

  const getDataViewRows = useCallback(
    (
      data: CamelAppKind[],
      tableColumns: CamelDataViewColumn<CamelAppKind>[],
    ): CamelDataViewTd[][] => {
      return data.map((obj) => {
        const lastMessageDate = getLastMessageTimestamp(obj, 'asc');

        const rowCells: Record<string, { cell: React.ReactNode; props?: Record<string, unknown> }> =
          {
            name: {
              cell: (
                <span className="co-resource-item co-resource-item--truncate">
                  <span className="co-m-resource-icon co-m-resource-camel">
                    <img src={CamelImage} alt="Camel" className="camel-icon" />
                  </span>
                  <Link
                    to={`/camel/app/ns/${obj.metadata.namespace}/name/${obj.metadata.name}`}
                    className="co-resource-item__resource-name"
                    title={obj.metadata.name}
                    data-test="camelapp-link"
                  >
                    {obj.metadata.name}
                  </Link>
                </span>
              ),
              props: nameCellProps,
            },
            namespace: {
              cell: (
                <span className="co-break-word co-line-clamp">
                  {obj.metadata?.namespace || (
                    <Label color="grey" icon={<MinusIcon />} isCompact>
                      {t('No namespace')}
                    </Label>
                  )}
                </span>
              ),
            },
            status: {
              cell: <Status status={getStatus(obj)} />,
            },
            health: {
              cell: <CamelAppHealth health={getCamelHealth(obj)} />,
            },
            runtime: {
              cell: getRuntimeProvider(obj) || (
                <Label color="grey" icon={<MinusIcon />} isCompact>
                  {t('No runtime provider')}
                </Label>
              ),
            },
            camel: {
              cell: getCamelVersionAsString(obj, 'asc') || (
                <Label color="grey" icon={<MinusIcon />} isCompact>
                  {t('No camel version')}
                </Label>
              ),
            },
            lastmessage: {
              cell: lastMessageDate ? <Timestamp timestamp={lastMessageDate} /> : '-',
            },
          };

        return tableColumns.map(({ id }) => ({
          id,
          cell: rowCells[id]?.cell ?? '-',
          props: rowCells[id]?.props,
        }));
      });
    },
    [t],
  );

  if (!operatorInstalled) {
    return (
      <>
        <DocumentTitle>{t('Camel Applications')}</DocumentTitle>
        <NamespaceBar onNamespaceChange={setActiveNamespace} />
        <div className="co-m-list">
          <ListPageHeader title={t('Camel Applications')} />
          <CamelAppNotAvailable />
        </div>
      </>
    );
  }

  return (
    <>
      <DocumentTitle>{t('Camel Applications')}</DocumentTitle>
      <NamespaceBar onNamespaceChange={setActiveNamespace} />
      <div className="co-m-list">
        <ListPageHeader title={t('Camel Applications')} />
        <ListPageBody>
          <div className="pf-v6-l-grid">
            <div className="pf-v6-l-grid__item">
              {loaded && CamelApps.length > 0 && (
                <div className="pf-v6-u-mb-sm">
                  <CamelNewProjectAlert />
                </div>
              )}
              {loaded && CamelApps.length === 0 ? (
                <CamelAppListEmpty />
              ) : (
                <CamelDataView<CamelAppKind, CamelFilters>
                  label={t('Camel Applications')}
                  data={CamelApps}
                  loaded={loaded}
                  loadError={error}
                  columns={columns}
                  getDataViewRows={getDataViewRows}
                  initialFilters={initialFilters}
                  additionalFilterNodes={additionalFilterNodes}
                  matchesAdditionalFilters={matchesAdditionalFilters}
                />
              )}
            </div>
          </div>
        </ListPageBody>
      </div>
    </>
  );
};

export default CamelAppList;
