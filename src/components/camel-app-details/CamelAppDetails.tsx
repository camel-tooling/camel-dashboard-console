import * as React from 'react';
import { CamelAppKind } from '../../types';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Grid,
  GridItem,
  Label,
  PageSection,
  Title,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  GreenCheckCircleIcon,
  K8sResourceConditionStatus,
  ResourceLink,
  YellowExclamationTriangleIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import { ArrowCircleUpIcon } from '@patternfly/react-icons';
import { camelMonitorGVK } from '../../const';
import CamelAppStatusPod from './CamelAppStatusPod';
import CamelAppHealthCard from './CamelAppHealthCard';
import CamelAppPodsSummary from './CamelAppPodsSummary';

type CamelAppDetailsProps = {
  obj: CamelAppKind;
};

const monitoredCondition = (camelInt: CamelAppKind) => {
  const monitoredConditions = camelInt.status?.conditions?.filter(
    (contidition) => contidition.type == 'Monitored',
  );
  if (monitoredConditions?.length > 0) {
    return monitoredConditions[0];
  }
  return;
};

const upgradeAvailableCondition = (camelInt: CamelAppKind) => {
  const conditions = camelInt.status?.conditions?.filter(
    (condition) => condition.type === 'UpgradeAvailable',
  );
  if (conditions?.length > 0) {
    return conditions[0];
  }
  return;
};

const CamelAppDetails: React.FC<CamelAppDetailsProps> = ({ obj: camelInt }) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  const monitored = monitoredCondition(camelInt);
  const upgradeAvailable = upgradeAvailableCondition(camelInt);

  return (
    <>
      <PageSection data-test="camelapp-details-tab">
        <Title headingLevel="h2">{t('Camel Application Details')}</Title>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem md={6} lg={6}>
            <Card isFullHeight>
              <CardHeader>
                <CardTitle>{t('Overview')}</CardTitle>
              </CardHeader>
              <CardBody>
                <DescriptionList>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Resource')}:</DescriptionListTerm>
                    <DescriptionListDescription>
                      <ResourceLink
                        displayName={camelInt.metadata.name}
                        groupVersionKind={camelMonitorGVK}
                        name={camelInt.metadata.name}
                        namespace={camelInt.metadata.namespace}
                      />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Image')}:</DescriptionListTerm>
                    <DescriptionListDescription>
                      {camelInt.status?.image ? (
                        <div className="co-break-all co-select-to-copy">
                          {camelInt.status.image}
                        </div>
                      ) : (
                        'unknown'
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Monitored')}:</DescriptionListTerm>
                    <DescriptionListDescription>
                      {monitored && monitored?.status == K8sResourceConditionStatus.True ? (
                        <Label color="green" icon={<GreenCheckCircleIcon />} isCompact>
                          {t('Monitored')}
                        </Label>
                      ) : (
                        <Label color="orange" icon={<YellowExclamationTriangleIcon />} isCompact>
                          {t('Not Monitored')}
                          {monitored?.message && ` - ${monitored.message}`}
                        </Label>
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  {upgradeAvailable &&
                    upgradeAvailable.status === K8sResourceConditionStatus.True && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Upgrade')}:</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Label color="blue" icon={<ArrowCircleUpIcon />} isCompact>
                            {upgradeAvailable.message}
                          </Label>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                </DescriptionList>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem md={6} lg={6}>
            <CamelAppHealthCard obj={camelInt} />
          </GridItem>
        </Grid>
      </PageSection>
      <Divider />
      <PageSection>
        <Title headingLevel="h3">
          {t('Pods')} ({camelInt.status?.pods?.length || 0})
        </Title>
        <div className="camel-section-spacing">
          <CamelAppPodsSummary obj={camelInt} />
        </div>
        <Grid hasGutter sm={12} md={6} lg={6} xl={6} xl2={4}>
          {camelInt.status?.pods
            ? camelInt.status.pods.map((pod, i) => {
                return (
                  <GridItem key={i}>
                    <CamelAppStatusPod obj={camelInt} pod={pod} />
                  </GridItem>
                );
              })
            : ''}
        </Grid>
      </PageSection>
    </>
  );
};

export default CamelAppDetails;
