import { Alert, PageSection } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

const CamelAppNotAvailable: React.FC = () => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  return (
    <PageSection className="pf-v6-u-text-align-start">
      <Alert title={t('Camel Monitor Operator is missing')} variant="warning" isInline>
        <p>
          {t(
            'The Camel Monitor Operator is required because it is responsible for detecting the applications deployed on the cluster.',
          )}
        </p>
        <br />
        <p>{t('Please ensure the Camel Dashboard is installed correctly.')}</p>
      </Alert>
    </PageSection>
  );
};

export default CamelAppNotAvailable;
