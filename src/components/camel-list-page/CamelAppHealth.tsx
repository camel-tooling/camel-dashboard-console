import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import { UnknownIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

type CamelAppHealthProps = {
  health: string;
};

const CamelAppHealth: React.FC<CamelAppHealthProps> = ({ health }) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');
  // FIXME: manage undefined
  switch (health?.toLowerCase()) {
    case 'ok':
      return (
        <>
          <GreenCheckCircleIcon title={t("OK")} />
          &nbsp;&nbsp;{t("OK")}
        </>
      );
    case 'success':
      return (
        <>
          <GreenCheckCircleIcon title={t("Success")} />
          &nbsp;&nbsp;{t("Success")}
        </>
      );
    case 'warning':
      return (
        <>
          <YellowExclamationTriangleIcon title={t("Warning")} />
          &nbsp;&nbsp;{t("Warning")}
        </>
      );
    case 'error':
      return (
        <>
          <RedExclamationCircleIcon title={t("Error")} />
          &nbsp;&nbsp;{t("Error")}
        </>
      );
    default:
      return (
        <>
          <UnknownIcon title={t('Unknown')} />
          &nbsp;&nbsp;{t('Unknown')}
        </>
      );
  }
};

export default CamelAppHealth;
