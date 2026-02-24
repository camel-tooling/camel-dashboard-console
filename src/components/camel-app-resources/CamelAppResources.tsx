import * as React from 'react';
import { CamelAppKind } from '../../types';
import CamelAppPods from './CamelAppPods';
import CamelAppServices from './CamelAppServices';
import CamelAppRoutes from './CamelAppRoutes';
import CamelAppOwnerResource from './CamelAppOwnerResource';
import { Card, CardBody, Spinner, PageSection, Title, Grid, GridItem } from '@patternfly/react-core';
import CamelAppJobs from './CamelAppJobs';
import { CamelAppOwnerGVK } from '../../utils';
import { useCamelAppOwner } from './useCamelAppResources';
import { useTranslation } from 'react-i18next';

type CamelAppResourcesProps = {
  obj: CamelAppKind;
};

// TODO : add volumes
const CamelAppResources: React.FC<CamelAppResourcesProps> = ({ obj: camelInt }) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');
  const ownerReference = camelInt.metadata.ownerReferences[0];
  const ownerGvk = CamelAppOwnerGVK(ownerReference.kind);

  const { CamelAppOwner, isLoading, error } = useCamelAppOwner(
    ownerReference.name,
    camelInt.metadata.namespace,
    ownerGvk,
  );

  if (isLoading) {
    return (
      <>
        <PageSection>
          <Title headingLevel="h2">{t('Resources')}</Title>
        </PageSection>
        <PageSection>
          <Card>
            <CardBody>
              <Spinner />
            </CardBody>
          </Card>
        </PageSection>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageSection>
          <Title headingLevel="h2">{t('Resources')}</Title>
        </PageSection>
        <PageSection>
          <Card>
            <CardBody>{error}</CardBody>
          </Card>
        </PageSection>
      </>
    );
  }

  return (
    <>
      <PageSection data-test="camelapp-resources-tab">
        <Title headingLevel="h2">{t('Resources')}</Title>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem>
            <CamelAppOwnerResource obj={CamelAppOwner} gvk={ownerGvk} />
          </GridItem>
          <GridItem>
            <CamelAppPods obj={CamelAppOwner} />
          </GridItem>
          <GridItem>
            <CamelAppJobs obj={CamelAppOwner} />
          </GridItem>
          <GridItem>
            <CamelAppServices obj={CamelAppOwner} />
          </GridItem>
          <GridItem>
            <CamelAppRoutes obj={CamelAppOwner} />
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};

export default CamelAppResources;
