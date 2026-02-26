import * as React from 'react';
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Popover,
  PopoverPosition,
  PopoverProps,
  Title,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import CamelAppHealth from '../camel-list-page/CamelAppHealth';
import {
  K8sResourceCondition,
  K8sResourceConditionStatus,
} from '@openshift-console/dynamic-plugin-sdk';

type PopoverCamelHealthProps = {
  popoverBody: React.ReactNode;
  onHide?: () => void;
  onShow?: () => void;
  title?: string;
  hideHeader?: boolean;
  isVisible?: boolean;
  shouldClose?: (hideFunction: any) => void;
  shouldOpen?: PopoverProps['shouldOpen'];
  condition?: K8sResourceCondition;
};

export const PopoverCamelHealth: React.FC<PopoverCamelHealthProps> = ({
  hideHeader,
  isVisible = null,
  shouldClose = null,
  shouldOpen = null,
  popoverBody,
  title,
  onHide,
  onShow,
  condition,
}) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');
  return (
    <Popover
      position={PopoverPosition.right}
      headerContent={hideHeader ? null : title}
      bodyContent={() => (
        <>
          {condition &&
          condition?.status &&
          condition?.status == K8sResourceConditionStatus.False ? (
            <>
              <Title headingLevel="h4" size="md">
                {t('Reason')}
              </Title>
              <p>{condition.reason}</p>
            </>
          ) : (
            <>
              <Title headingLevel="h4" size="md" className="camel-margin-bottom-sm">
                {t('Service Level Indicator')}
              </Title>
              <DescriptionList isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    <CamelAppHealth health="ok" />
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {t('Healthy (≤ 5% failed exchanges)')}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    <CamelAppHealth health="warning" />
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {t('> 5% failed exchanges')}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    <CamelAppHealth health="error" />
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {t('> 10% failed exchanges')}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    <CamelAppHealth health="unknown" />
                  </DescriptionListTerm>
                  <DescriptionListDescription>{t('No information')}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </>
          )}
        </>
      )}
      aria-label={title}
      onHide={onHide}
      onShow={onShow}
      isVisible={isVisible}
      shouldClose={shouldClose}
      shouldOpen={shouldOpen}
    >
      <Button
        variant="link"
        isInline
        className="pf-v5-c-button pf-m-plain details-item__popover-button"
      >
        {popoverBody}
      </Button>
    </Popover>
  );
};
