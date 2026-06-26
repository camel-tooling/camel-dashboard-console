import * as React from 'react';
import { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DocumentTitle,
  ListPageBody,
  ListPageHeader,
  NamespaceBar,
  useActiveNamespace,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import '../../camel.css';
import { ALL_NAMESPACES_KEY } from '../../const';
import { CamelAppKind } from '../../types';
import CamelAppListEmpty from './CamelAppListEmpty';
import CamelAppNotAvailable from './CamelAppNotAvailable';
import CamelAppSummary from './CamelAppSummary';
import { CamelDataView, CamelDataViewFilterRef } from './CamelDataView';
import { useCamelAppList } from './useCamelAppList';
import { useCamelAppColumns } from './useCamelAppColumns';
import { CamelFilters, initialFilters, useCamelAppFilters } from './useCamelAppFilters';
import { useCamelAppRows } from './useCamelAppRows';
import GettingStartedContent from './GettingStartedContent';

const CamelAppList: React.FC = () => {
  const { t } = useTranslation('plugin__camel-dashboard-console');
  const [activeNamespace, setActiveNamespace] = useActiveNamespace();

  const namespace = activeNamespace === ALL_NAMESPACES_KEY ? '' : activeNamespace;
  const showNamespace = !namespace;

  const columns = useCamelAppColumns(showNamespace);
  const { CamelApps, loaded, error } = useCamelAppList(namespace);
  const { additionalFilterNodes, matchesAdditionalFilters } = useCamelAppFilters(CamelApps);
  const getDataViewRows = useCamelAppRows();

  const filterRef = useRef<CamelDataViewFilterRef<CamelFilters> | null>(null);

  const handleHealthFilter = useCallback((healthValue: string) => {
    filterRef.current?.onSetFilters({ health: [healthValue] });
  }, []);

  const oldCRDFlagEnabled = useFlag('CAMEL_APP_FLAG');
  const newCRDFlagEnabled = useFlag('CAMEL_MONITOR_FLAG');
  const operatorInstalled = oldCRDFlagEnabled || newCRDFlagEnabled;

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
        <ListPageHeader
          title={t('Camel Applications')}
          badge={
            loaded &&
            CamelApps.length > 0 && (
              <CamelAppSummary data={CamelApps} onHealthFilter={handleHealthFilter} />
            )
          }
          helpText={loaded && CamelApps.length > 0 && <GettingStartedContent />}
        ></ListPageHeader>

        <ListPageBody>
          <div className="pf-v6-l-grid">
            <div className="pf-v6-l-grid__item">
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
                  filterRef={filterRef}
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
