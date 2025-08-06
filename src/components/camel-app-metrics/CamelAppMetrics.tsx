import { CamelAppKind } from '../../types';
import * as React from 'react';
import { Grid, GridItem, PageSection } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceUtilizationQuery, useResourceMetricsQueries } from './resources-metrics';
import ResourceMetricsCard from './ResourceMetricsCard';

export type CamelAppMetricsProps = {
  obj: CamelAppKind;
};

const CamelAppMetrics: React.FC<CamelAppMetricsProps> = ({ obj: camelInt }) => {
  const { t } = useTranslation('plugin__camel-openshift-console-plugin');
  const queries = useResourceMetricsQueries(camelInt);

  return (
    <PageSection>
      {queries ? (
        <Grid hasGutter>
          <GridItem xl={6} lg={12}>
            <ResourceMetricsCard
              namespace={camelInt.metadata.namespace}
              queries={queries[ResourceUtilizationQuery.MEMORY]}
              title={t('Memory usage')}
            />
          </GridItem>
          <GridItem xl={6} lg={12}>
            <ResourceMetricsCard
              namespace={camelInt.metadata.namespace}
              queries={queries[ResourceUtilizationQuery.CPU]}
              title={t('CPU usage')}
            />
          </GridItem>
          <GridItem xl={6} lg={12}>
            <ResourceMetricsCard
              namespace={camelInt.metadata.namespace}
              queries={queries[ResourceUtilizationQuery.FILESYSTEM]}
              title={t('Filesystem')}
            />
          </GridItem>
          <GridItem xl={6} lg={12}>
            <ResourceMetricsCard
              namespace={camelInt.metadata.namespace}
              queries={queries[ResourceUtilizationQuery.NETWORK_IN]}
              title={t('Network in')}
            />
          </GridItem>
          <GridItem xl={6} lg={12}>
            <ResourceMetricsCard
              namespace={camelInt.metadata.namespace}
              queries={queries[ResourceUtilizationQuery.NETWORK_OUT]}
              title={t('Network out')}
            />
          </GridItem>
        </Grid>
      ) : (
        <></>
      )}
    </PageSection>
  );
};

export default CamelAppMetrics;
