import * as React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  Label,
  Title,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CamelAppKind } from '../../types';

type CamelAppPodsSummaryProps = {
  obj: CamelAppKind;
};

const CamelAppPodsSummary: React.FC<CamelAppPodsSummaryProps> = ({ obj: camelInt }) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  // Calculate pod status counts
  const podsByStatus =
    camelInt.status?.pods?.reduce((acc, pod) => {
      const status = pod.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

  // Calculate aggregate exchange metrics
  const aggregateExchanges = camelInt.status?.pods?.reduce(
    (acc, pod) => {
      if (pod.runtime?.exchange) {
        acc.succeed += pod.runtime.exchange.succeed || 0;
        acc.pending += pod.runtime.exchange.pending || 0;
        acc.failed += pod.runtime.exchange.failed || 0;
        acc.total += pod.runtime.exchange.total || 0;
      }
      return acc;
    },
    { succeed: 0, pending: 0, failed: 0, total: 0 },
  ) || { succeed: 0, pending: 0, failed: 0, total: 0 };

  const totalPods = camelInt.status?.pods?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Title headingLevel="h4">{t('Pods Summary')}</Title>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
          {/* Pod Status Summary */}
          <FlexItem>
            <div>
              <strong>{t('Pod Status')}</strong> ({totalPods} {t('total')})
            </div>
            <Flex
              direction={{ default: 'row' }}
              spaceItems={{ default: 'spaceItemsSm' }}
              flexWrap={{ default: 'wrap' }}
              className="camel-margin-top-md"
            >
              {Object.entries(podsByStatus).map(([status, count]) => {
                // Color based on status
                let color: 'green' | 'red' | 'orange' | 'blue' | 'grey' = 'grey';
                if (status === 'Running') color = 'green';
                else if (status === 'Failed') color = 'red';
                else if (status === 'Pending') color = 'orange';
                else if (status === 'Terminating') color = 'blue';

                return (
                  <FlexItem key={status}>
                    <Label color={color} isCompact>
                      {count} {status}
                    </Label>
                  </FlexItem>
                );
              })}
            </Flex>
          </FlexItem>

          {/* Aggregate Exchange Metrics */}
          {aggregateExchanges.total > 0 && (
            <FlexItem>
              <div>
                <strong>{t('Total Exchanges Across All Pods')}</strong>
              </div>
              <Flex
                direction={{ default: 'row' }}
                spaceItems={{ default: 'spaceItemsSm' }}
                flexWrap={{ default: 'wrap' }}
                className="camel-margin-top-md"
              >
                <FlexItem>
                  <Label color="green" isCompact>
                    {aggregateExchanges.succeed} {t('succeed')}
                  </Label>
                </FlexItem>
                <FlexItem>
                  <Label color="blue" isCompact>
                    {aggregateExchanges.pending} {t('pending')}
                  </Label>
                </FlexItem>
                <FlexItem>
                  <Label color="red" isCompact>
                    {aggregateExchanges.failed} {t('failed')}
                  </Label>
                </FlexItem>
                <FlexItem>
                  <Label color="grey" isCompact>
                    {aggregateExchanges.total} {t('total')}
                  </Label>
                </FlexItem>
              </Flex>
              {/* Success Rate */}
              {aggregateExchanges.total > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: 'var(--pf-v5-global--FontSize--sm)' }}>
                  {t('Success rate')}:{' '}
                  <strong>
                    {((aggregateExchanges.succeed / aggregateExchanges.total) * 100).toFixed(1)}%
                  </strong>
                </div>
              )}
            </FlexItem>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
};

export default CamelAppPodsSummary;
