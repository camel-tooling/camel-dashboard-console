import * as React from 'react';
import { useTranslation } from 'react-i18next';
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
        <br />
        <PageSection className="pf-v6-u-text-align-start">
          <Stack hasGutter>
            <Alert
              title={t('Show a Camel Application')}
              customIcon={<CamelIconAlert />}
              variant="info"
              isInline
            >
              <p>
                {t(
                  'To get your Apache Camel project to show up in the Camel Dashboard, you must enable management and metrics collection, and configure your deployment so it can be discovered by the Camel Monitor Operator.',
                )}
              </p>
            </Alert>
          </Stack>
        </PageSection>
      </EmptyStateBody>
    </EmptyState>
  );
};

export default CamelAppListEmpty;
