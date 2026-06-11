import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
const GettingStartedContent: React.FC = () => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  return (
    <Trans t={t}>
      <p>
        Visit the{' '}
        <a href="https://developers.redhat.com/products/red-hat-build-of-apache-camel">
          Red Hat Build of Apache Camel
        </a>{' '}
        developer page, browse the{' '}
        <a href="https://docs.redhat.com/en/documentation/red_hat_build_of_apache_camel/">
          official documentation
        </a>
        , or check the{' '}
        <a href="https://jboss-fuse.github.io/apache-camel-on-ocp-best-practices/">
          Apache Camel on OCP best practices
        </a>{' '}
        to get started.
      </p>
    </Trans>
  );
};

export default GettingStartedContent;
