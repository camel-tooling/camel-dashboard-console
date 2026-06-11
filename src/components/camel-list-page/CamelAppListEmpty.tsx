import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import '../../camel.css';
import { Alert, EmptyState, EmptyStateBody, PageSection, Stack } from '@patternfly/react-core';
import { CamelIcon, CamelIconAlert } from './CamelIcon';
import GettingStartedContent from './GettingStartedContent';

const CamelAppListEmpty: React.FC = () => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  return (
    <EmptyState
      data-test="camelapp-list-empty"
      titleText="No Camel Application found"
      icon={CamelIcon}
      headingLevel="h2"
    >
      <EmptyStateBody>
        <GettingStartedContent />
        <br/>
        <PageSection className="pf-v6-u-text-align-start">
          <Stack hasGutter>
            <Alert
              title={t('Show a Camel Application')}
              customIcon={<CamelIconAlert />}
              variant="info"
              isInline
            >
              <Trans t={t}>
                <p>
                  To get your Apache Camel project to show up in the Camel Dashboard, you must
                  enable{' '}
                  <a href="https://camel.apache.org/components/others/observability-services.html">
                    management and metrics collection
                  </a>{' '}
                  and{' '}
                  <a href="https://camel-tooling.github.io/camel-dashboard/docs/user-guide/">
                    configure
                  </a>{' '}
                  your deployment so it can be discovered by the{' '}
                  <a href="https://camel-tooling.github.io/camel-dashboard/docs/installation-guide/advanced/operator/">
                    Camel Monitor Operator
                  </a>
                  .
                </p>
              </Trans>
            </Alert>
          </Stack>
        </PageSection>
      </EmptyStateBody>
    </EmptyState>
  );
};

export default CamelAppListEmpty;
