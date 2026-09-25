import * as React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Divider,
  Flex,
  FlexItem,
  Label,
  Progress,
  ProgressVariant,
  Title,
} from '@patternfly/react-core';
import { Table, Tbody } from '@patternfly/react-table';
import { K8sResourceConditionStatus, Timestamp } from '@openshift-console/dynamic-plugin-sdk';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { CamelAppKind } from '../../types';
import CamelAppHealth from '../camel-list-page/CamelAppHealth';
import { PopoverCamelHealth } from './CamelAppHealthPopover';
import { formatDuration } from '../../date-utils';

type CamelAppHealthCardProps = {
  obj: CamelAppKind;
};

const getProgressVariant = (health: string): ProgressVariant => {
  switch (health?.toLowerCase()) {
    case 'ok':
    case 'success':
      return ProgressVariant.success;
    case 'warning':
      return ProgressVariant.warning;
    case 'error':
      return ProgressVariant.danger;
    default:
      return undefined;
  }
};

const healthyCondition = (camelInt: CamelAppKind) => {
  const healthConditions = camelInt.status?.conditions?.filter(
    (contidition) => contidition.type == 'Healthy',
  );
  if (healthConditions?.length > 0) {
    return healthConditions[0];
  }
  return;
};

const memoryPressureCondition = (camelInt: CamelAppKind) => {
  const conditions = camelInt.status?.conditions?.filter(
    (condition) => condition.type == 'MemoryPressure',
  );
  if (conditions?.length > 0) {
    return conditions[0];
  }
  return;
};

const cpuPressureCondition = (camelInt: CamelAppKind) => {
  const conditions = camelInt.status?.conditions?.filter(
    (condition) => condition.type == 'CPUPressure',
  );
  if (conditions?.length > 0) {
    return conditions[0];
  }
  return;
};

const CamelAppHealthCard: React.FC<CamelAppHealthCardProps> = ({ obj: camelInt }) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  const healthy = healthyCondition(camelInt);
  const memoryPressure = memoryPressureCondition(camelInt);
  const cpuPressure = cpuPressureCondition(camelInt);
  const healthStatus = camelInt.status?.sliExchangeSuccessRate?.status || '';
  const successPercentage = Number(camelInt.status?.sliExchangeSuccessRate?.successPercentage) || 0;

  return (
    <Card isFullHeight>
      <CardHeader>
        <CardTitle>
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            spaceItems={{ default: 'spaceItemsSm' }}
          >
            <FlexItem>{t('Health')}</FlexItem>
            <FlexItem>
              <CamelAppHealth health={healthStatus} />
            </FlexItem>
          </Flex>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
          {camelInt.status?.sliExchangeSuccessRate ? (
            <>
              <FlexItem>
                <Flex
                  alignItems={{ default: 'alignItemsCenter' }}
                  spaceItems={{ default: 'spaceItemsSm' }}
                >
                  <FlexItem>
                    <Title headingLevel="h4" size="md">
                      {t('Service Level Indicator')}
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <PopoverCamelHealth
                      popoverBody={<OutlinedQuestionCircleIcon />}
                      condition={healthy}
                    />
                  </FlexItem>
                </Flex>
              </FlexItem>
              <FlexItem>
                <Progress
                  value={successPercentage}
                  title={t('Success rate')}
                  variant={getProgressVariant(healthStatus)}
                  size="lg"
                />
              </FlexItem>
              <FlexItem>
                <Flex
                  direction={{ default: 'row' }}
                  spaceItems={{ default: 'spaceItemsLg' }}
                  justifyContent={{ default: 'justifyContentSpaceAround' }}
                >
                  <FlexItem>
                    <div className="camel-text-center">
                      <Title headingLevel="h2" size="2xl">
                        {camelInt.status.sliExchangeSuccessRate.samplingIntervalTotal ?? '?'}
                      </Title>
                      <div className="camel-font-small">{t('Total exchanges')}</div>
                    </div>
                  </FlexItem>
                  <FlexItem>
                    <div className="camel-text-center">
                      <Title headingLevel="h2" size="2xl" className="camel-text-danger">
                        {camelInt.status.sliExchangeSuccessRate.samplingIntervalFailed | 0}
                      </Title>
                      <div className="camel-font-small">{t('Failed exchanges')}</div>
                    </div>
                  </FlexItem>
                </Flex>
              </FlexItem>
              <FlexItem>
                <Divider />
              </FlexItem>
              <FlexItem>
                <Table>
                  <Tbody>
                    {camelInt.status?.sliExchangeSuccessRate.lastTimestamp ? (
                      <tr>
                        <td>{t('Last message')}:</td>
                        <td>
                          <Timestamp
                            timestamp={camelInt.status.sliExchangeSuccessRate.lastTimestamp}
                          />
                        </td>
                      </tr>
                    ) : (
                      <></>
                    )}
                    <tr>
                      <td>{t('Sampling interval')}:</td>
                      <td>
                        {formatDuration(
                          camelInt.status.sliExchangeSuccessRate.samplingInterval / 1000000,
                          t,
                          { omitSuffix: true },
                        )}
                      </td>
                    </tr>
                  </Tbody>
                </Table>
              </FlexItem>
            </>
          ) : (
            <></>
          )}
          {(memoryPressure || cpuPressure) && (
            <>
              <FlexItem>
                <Divider />
              </FlexItem>
              <FlexItem>
                <Title headingLevel="h4" size="md">
                  {t('Resource Pressure')}
                </Title>
              </FlexItem>
              <FlexItem>
                <Flex
                  direction={{ default: 'row' }}
                  spaceItems={{ default: 'spaceItemsSm' }}
                  flexWrap={{ default: 'wrap' }}
                >
                  {memoryPressure && (
                    <FlexItem>
                      <Label
                        color={
                          memoryPressure.status === K8sResourceConditionStatus.True
                            ? 'orange'
                            : 'green'
                        }
                        isCompact
                      >
                        {memoryPressure.status === K8sResourceConditionStatus.True
                          ? t('Memory Pressure')
                          : t('Memory OK')}
                      </Label>
                    </FlexItem>
                  )}
                  {cpuPressure && (
                    <FlexItem>
                      <Label
                        color={
                          cpuPressure.status === K8sResourceConditionStatus.True
                            ? 'orange'
                            : 'green'
                        }
                        isCompact
                      >
                        {cpuPressure.status === K8sResourceConditionStatus.True
                          ? t('CPU Pressure')
                          : t('CPU OK')}
                      </Label>
                    </FlexItem>
                  )}
                </Flex>
              </FlexItem>
            </>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
};

export default CamelAppHealthCard;
