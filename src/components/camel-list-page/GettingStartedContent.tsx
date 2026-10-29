import * as React from 'react';
import { useTranslation } from 'react-i18next';

const GettingStartedContent: React.FC = () => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  return (
    <p>
      {t(
        'To get started, review the Red Hat Build of Apache Camel developer page, the official documentation, or the Apache Camel on OCP best practices.',
      )}
    </p>
  );
};

export default GettingStartedContent;
