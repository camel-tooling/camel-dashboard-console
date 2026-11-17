import * as React from 'react';
import { PauseCircleIcon } from '@patternfly/react-icons';
import { StatusComponent, StatusIconAndText } from '@openshift-console/dynamic-plugin-sdk';

type CamelAppStatusProps = {
  status?: string;
  title?: string;
};

const CamelAppStatus: React.FC<CamelAppStatusProps> = ({ status, title }) => {
  if (status === 'Paused') {
    return <StatusIconAndText title={title ?? status} icon={<PauseCircleIcon />} />;
  }

  return <StatusComponent status={status} title={title} />;
};

export default CamelAppStatus;
