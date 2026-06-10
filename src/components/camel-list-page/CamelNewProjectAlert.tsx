import * as React from 'react';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import '../../camel.css';
import {
  Button,
  Card,
  CardBody,
  CardExpandableContent,
  CardHeader,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
import { CamelIconAlert } from './CamelIcon';

const CamelNewProjectAlert: React.FC = () => {
  const { t } = useTranslation('plugin__camel-dashboard-console');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <Card
      id="camel-getting-started"
      isExpanded={isExpanded}
      isCompact
      variant="secondary"
    >
      <CardHeader
        onExpand={() => setIsExpanded(!isExpanded)}
        toggleButtonProps={{ 'aria-label': t('Toggle getting started') }}
        actions={{
          actions: (
            <Button
              variant="plain"
              aria-label={t('Close')}
              onClick={() => setIsVisible(false)}
            >
              <TimesIcon />
            </Button>
          ),
        }}
      >
        <span className="co-m-resource-icon co-m-resource-camel" style={{ marginRight: '8px' }}>
          <CamelIconAlert />
        </span>
        {t('Getting started with Camel')}
      </CardHeader>
      <CardExpandableContent>
        <CardBody>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListDescription>
                <Trans t={t}>
                  To get started with Apache Camel, you can either follow the guide for the{' '}
                  <a href="https://camel.apache.org/camel-core/getting-started/index.html#BookGettingStarted-CreatingYourFirstProject">
                    main Camel distribution
                  </a>{' '}
                  or use a guide tailored for popular frameworks like{' '}
                  <a href="https://camel.apache.org/camel-spring-boot/next/index.html">
                    Spring Boot
                  </a>{' '}
                  and{' '}
                  <a href="https://camel.apache.org/camel-quarkus/next/user-guide/first-steps.html">
                    Quarkus
                  </a>
                  . Each approach is suited for different project needs and development styles.
                  <br />
                  <br />
                  You can also use one of the following tools:
                </Trans>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Kaoto</DescriptionListTerm>
              <DescriptionListDescription>
                <Trans t={t}>
                  <a href="https://kaoto.io/">Kaoto</a> is a visual, low-code editor that lets you
                  design and configure Apache Camel integrations with a drag-and-drop interface.
                  It&apos;s available as a VS Code extension and within platforms like the OpenShift
                  Dev Sandbox. Kaoto simplifies deployment to OpenShift by generating cloud-native
                  YAML that&apos;s ready to use.
                </Trans>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Apache Camel CLI (JBang)</DescriptionListTerm>
              <DescriptionListDescription>
                <Trans t={t}>
                  The{' '}
                  <a href="https://camel.apache.org/manual/camel-jbang.html#_creating_and_running_camel_routes">
                    Apache Camel CLI
                  </a>
                  , powered by JBang, is a command-line tool for rapid prototyping. It allows you to
                  run Camel routes directly from a single file, without the need for a full Maven or
                  Gradle project. By using the additional Camel JBang Kubernetes plugin, you can also
                  automate the build and deployment process for OpenShift.
                </Trans>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Apache Camel IDE Plugins</DescriptionListTerm>
              <DescriptionListDescription>
                <Trans t={t}>
                  <p>
                    IDE plugins streamline the development and deployment of Camel projects by
                    offering features like code completion, validation, and integrated deployment
                    tools.
                  </p>
                  <ul>
                    <li>
                      Visual Studio Code:{' '}
                      <a href="https://marketplace.visualstudio.com/items?itemName=redhat.apache-camel-extension-pack">
                        The Extension Pack for Apache Camel by Red Hat
                      </a>{' '}
                      includes the Kaoto visual designer
                    </li>
                    <li>
                      IntelliJ IDEA:{' '}
                      <a href="https://plugins.jetbrains.com/plugin/9371-apache-camel">
                        The Apache Camel Plugin
                      </a>{' '}
                      provides excellent code assistance, validation, and navigation for Camel
                      projects within the IntelliJ IDEA environment
                    </li>
                  </ul>
                </Trans>
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
};

export default CamelNewProjectAlert;
