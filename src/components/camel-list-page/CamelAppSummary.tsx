import * as React from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flex, FlexItem, Label, Split, SplitItem } from '@patternfly/react-core';
import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import { UnknownIcon } from '@patternfly/react-icons';
import { CamelAppKind } from '../../types';
import { getHealthStatus, HealthStatus } from './camel-health-utils';

type CamelAppSummaryProps = {
  data: CamelAppKind[];
  onHealthFilter?: (healthValue: string) => void;
};

const CamelAppSummary: React.FC<CamelAppSummaryProps> = ({ data, onHealthFilter }) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  const healthCounts = useMemo(() => {
    const counts = { healthy: 0, degraded: 0, critical: 0, unknown: 0 };
    data.forEach((app) => {
      const health = app.status?.sliExchangeSuccessRate?.status ?? '';
      const status = getHealthStatus(health);
      switch (status) {
        case HealthStatus.HEALTHY:
          counts.healthy++;
          break;
        case HealthStatus.DEGRADED:
          counts.degraded++;
          break;
        case HealthStatus.CRITICAL:
          counts.critical++;
          break;
        default:
          counts.unknown++;
      }
    });
    return counts;
  }, [data]);

  return (
    <Flex spaceItems={{ default: 'spaceItemsLg' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>
        <Split hasGutter>
          <SplitItem>
            <Label
              color="green"
              icon={<GreenCheckCircleIcon />}
              isCompact
              onClick={() => onHealthFilter?.(HealthStatus.HEALTHY)}
            >
              {healthCounts.healthy} {t('Healthy')}
            </Label>
          </SplitItem>
          {healthCounts.degraded > 0 && (
            <SplitItem>
              <Label
                color="orange"
                icon={<YellowExclamationTriangleIcon />}
                isCompact
                onClick={() => onHealthFilter?.(HealthStatus.DEGRADED)}
              >
                {healthCounts.degraded} {t('Degraded')}
              </Label>
            </SplitItem>
          )}
          {healthCounts.critical > 0 && (
            <SplitItem>
              <Label
                color="red"
                icon={<RedExclamationCircleIcon />}
                isCompact
                onClick={() => onHealthFilter?.(HealthStatus.CRITICAL)}
              >
                {healthCounts.critical} {t('Critical')}
              </Label>
            </SplitItem>
          )}
          {healthCounts.unknown > 0 && (
            <SplitItem>
              <Label
                color="grey"
                icon={<UnknownIcon />}
                isCompact
                onClick={() => onHealthFilter?.(HealthStatus.UNKNOWN)}
              >
                {healthCounts.unknown} {t('Unknown')}
              </Label>
            </SplitItem>
          )}
        </Split>
      </FlexItem>
    </Flex>
  );
};

export default CamelAppSummary;
