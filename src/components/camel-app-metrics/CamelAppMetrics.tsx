import { CamelAppKind } from '../../types';
import * as React from 'react';
import { Grid, PageSection } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceUtilizationQuery, useResourceMetricsQueries } from './resources-metrics';
import ResourceMetricsCard from './ResourceMetricsCard';

export type CamelAppMetricsProps = {
  obj: CamelAppKind;
};

const CamelAppMetrics: React.FC<CamelAppMetricsProps> = ({ obj: camelInt }) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');
  const queries = useResourceMetricsQueries(camelInt);

  return (
    <PageSection data-test="camelapp-metrics-tab">
      {queries ? (
        <Grid hasGutter>
          <ResourceMetricsCard
            namespace={camelInt.metadata.namespace}
            queries={queries[ResourceUtilizationQuery.EXCHANGES]}
            title={t('Message exchanges per minute')}
            units="exchanges/min"
          />
          <ResourceMetricsCard
            namespace={camelInt.metadata.namespace}
            queries={queries[ResourceUtilizationQuery.FAILED_EXCHANGES]}
            title={t('Message failure rate')}
            units="%"
          />
          <ResourceMetricsCard
            namespace={camelInt.metadata.namespace}
            queries={queries[ResourceUtilizationQuery.MEMORY]}
            title={t('Memory usage')}
          />
          <ResourceMetricsCard
            namespace={camelInt.metadata.namespace}
            queries={queries[ResourceUtilizationQuery.CPU]}
            title={t('CPU usage')}
          />
          <ResourceMetricsCard
            namespace={camelInt.metadata.namespace}
            queries={queries[ResourceUtilizationQuery.FILESYSTEM]}
            title={t('Filesystem')}
          />
          <ResourceMetricsCard
            namespace={camelInt.metadata.namespace}
            queries={queries[ResourceUtilizationQuery.NETWORK_IN]}
            title={t('Network in')}
          />
          <ResourceMetricsCard
            namespace={camelInt.metadata.namespace}
            queries={queries[ResourceUtilizationQuery.NETWORK_OUT]}
            title={t('Network out')}
          />
        </Grid>
      ) : (
        <></>
      )}
    </PageSection>
  );
};

export default CamelAppMetrics;
