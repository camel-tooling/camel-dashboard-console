import * as React from 'react';
import { PauseCircleIcon } from '@patternfly/react-icons';
import { StatusComponent, StatusIconAndText } from '@openshift-console/dynamic-plugin-sdk';

type CamelAppStatusProps = {
  status?: string;
};

const CamelAppStatus: React.FC<CamelAppStatusProps> = ({ status }) => {
  if (status === 'Paused') {
    return <StatusIconAndText title={status} icon={<PauseCircleIcon />} />;
  }

  return <StatusComponent status={status} />;
};

export default CamelAppStatus;
