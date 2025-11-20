import * as React from 'react';
import { Button, Popover, PopoverPosition, PopoverProps } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
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
        <div>
          <div>
            {condition &&
            condition?.status &&
            condition?.status == K8sResourceConditionStatus.False ? (
              <>
                <h4>Reason</h4>
                {condition.reason}
              </>
            ) : (
              <Trans t={t}>
                <h4>Service Level Indicator</h4>
                <CamelAppHealth health="error" />: &gt; 10 % failed exchanges
                <br />
                <CamelAppHealth health="warning" />: &gt; 5 % failed exchanges
                <br />
                <CamelAppHealth health="ok" />: healthy
                <br />
                <CamelAppHealth health="unknown" />: no informations
                <br />
              </Trans>
            )}
          </div>
        </div>
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
