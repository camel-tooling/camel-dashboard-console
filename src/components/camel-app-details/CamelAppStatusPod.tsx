import * as React from 'react';
import { CamelAppKind, CamelAppStatusPod } from '../../types';
import {
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Content,
  ContentVariants,
  Title,
  Card,
  CardHeader,
  CardBody,
  Label,
  Divider,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { podGVK } from '../../const';
import {
  ResourceLink,
  ResourceStatus,
  YellowExclamationTriangleIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import { formatCompactDuration } from '../../date-utils';
import CamelAppLastMessage from '../CamelAppLastMessage';
import { Table, Tbody } from '@patternfly/react-table';

type CamelAppStatusPodProps = {
  obj: CamelAppKind;
  pod: CamelAppStatusPod;
};

const hasRuntime = (camelPod: CamelAppStatusPod) =>
  camelPod.runtime &&
  (camelPod.runtime.camelVersion ||
    camelPod.runtime.runtimeProvider ||
    camelPod.runtime.runtimeVersion);
const hasRuntimeExchanges = (camelPod: CamelAppStatusPod) =>
  camelPod.runtime?.exchange ? true : false;
const hasObserve = (camelPod: CamelAppStatusPod) =>
  camelPod.observe && Object.keys(camelPod.observe).length > 0;
const hasStatusMessage = (camelPod: CamelAppStatusPod) => (camelPod.reason ? true : false);
const hasProcessInfo = (camelPod: CamelAppStatusPod) =>
  camelPod.jvmMemoryMax !== undefined ||
  camelPod.jvmMemoryUsed !== undefined ||
  (camelPod.processCPUUsed !== undefined && camelPod.processCPUUsed !== '');

const CamelAppStatusPod: React.FC<CamelAppStatusPodProps> = ({ obj: camelInt, pod: camelPod }) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');
  // Golang time.Time is in nanoseconds
  // TODO: add tooltip with date
  const now = Date.now();
  const uptime = formatCompactDuration(now - Date.parse(camelPod.uptimeTimestamp));

  const bytesToMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(0);

  const formatMemory = () => {
    if (camelPod.jvmMemoryUsed === undefined) return '';
    const usedMB = bytesToMB(camelPod.jvmMemoryUsed);
    if (!camelPod.jvmMemoryMax) return `${usedMB} MB`;
    const maxMB = bytesToMB(camelPod.jvmMemoryMax);
    const percentage = ((camelPod.jvmMemoryUsed / camelPod.jvmMemoryMax) * 100).toFixed(1);
    return `${usedMB} MB / ${maxMB} MB (${percentage}%)`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <Title headingLevel="h4">
            <h4>
              <ResourceLink
                displayName={camelPod.name}
                groupVersionKind={podGVK}
                name={camelPod.name}
                namespace={camelInt.metadata.namespace}
              >
                <ResourceStatus additionalClassNames="hidden-xs">
                  <Status status={camelPod.status} />
                </ResourceStatus>
              </ResourceLink>
            </h4>
          </Title>
        </CardHeader>
        <CardBody>
          <DescriptionList
            columnModifier={{
              default: '1Col',
            }}
          >
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Internal IP')}:</DescriptionListTerm>
              <DescriptionListDescription>
                <Content component={ContentVariants.p}>{camelPod.internalIp}</Content>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Uptime')}:</DescriptionListTerm>
              <DescriptionListDescription>
                <Content component={ContentVariants.p}>{uptime}</Content>
              </DescriptionListDescription>
            </DescriptionListGroup>

            {hasStatusMessage(camelPod) ? (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Status message')}:</DescriptionListTerm>
                <DescriptionListDescription>
                  <Label color="orange" icon={<YellowExclamationTriangleIcon />} isCompact>
                    {camelPod.reason}
                  </Label>
                </DescriptionListDescription>
              </DescriptionListGroup>
            ) : (
              <></>
            )}

            {(hasRuntime(camelPod) ||
              hasRuntimeExchanges(camelPod) ||
              hasObserve(camelPod) ||
              hasProcessInfo(camelPod)) && (
              <DescriptionListGroup>
                <DescriptionListDescription>
                  <Divider />
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}

            {hasRuntime(camelPod) ? (
              <>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Runtime')}:</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Table>
                      <Tbody>
                        <tr>
                          <td>{t('Camel Version')}:</td>
                          <td>{camelPod.runtime.camelVersion}</td>
                        </tr>
                        <tr>
                          <td>{t('Runtime Provider')}:</td>
                          <td>{camelPod.runtime.runtimeProvider}</td>
                        </tr>
                        <tr>
                          <td>{t('Runtime Version')}:</td>
                          <td>{camelPod.runtime.runtimeVersion}</td>
                        </tr>
                      </Tbody>
                    </Table>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {(hasProcessInfo(camelPod) ||
                  hasRuntimeExchanges(camelPod) ||
                  hasObserve(camelPod)) && (
                  <DescriptionListGroup>
                    <DescriptionListDescription>
                      <Divider />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </>
            ) : (
              <></>
            )}
            {hasProcessInfo(camelPod) ? (
              <>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Process')}:</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Table>
                      <Tbody>
                        {camelPod.jvmMemoryUsed !== undefined && (
                          <tr>
                            <td>{t('JVM Memory')}:</td>
                            <td>{formatMemory()}</td>
                          </tr>
                        )}
                        {camelPod.processCPUUsed !== undefined &&
                          camelPod.processCPUUsed !== '' && (
                            <tr>
                              <td>{t('CPU Usage')}:</td>
                              <td>
                                {camelPod.processCPUUsed}
                                {camelPod.processCPUMax &&
                                  camelPod.processCPUMax !== '' &&
                                  ` / ${camelPod.processCPUMax}`}
                              </td>
                            </tr>
                          )}
                      </Tbody>
                    </Table>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {(hasRuntimeExchanges(camelPod) || hasObserve(camelPod)) && (
                  <DescriptionListGroup>
                    <DescriptionListDescription>
                      <Divider />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </>
            ) : (
              <></>
            )}
            {hasRuntimeExchanges(camelPod) ? (
              <>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Exchanges')}:</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Flex
                      direction={{ default: 'column' }}
                      spaceItems={{ default: 'spaceItemsSm' }}
                    >
                      {camelPod.runtime.exchange.lastTimestamp && (
                        <FlexItem>
                          <div className="camel-inline-timestamp">
                            <span>{t('Last message')}:</span>
                            <CamelAppLastMessage
                              timestamp={camelPod.runtime.exchange.lastTimestamp}
                              suffix={t('ago')}
                            />
                          </div>
                        </FlexItem>
                      )}
                      <FlexItem>
                        <Flex
                          direction={{ default: 'row' }}
                          spaceItems={{ default: 'spaceItemsSm' }}
                          flexWrap={{ default: 'wrap' }}
                        >
                          <FlexItem>
                            <Label color="green" isCompact>
                              {camelPod.runtime.exchange.succeed
                                ? camelPod.runtime.exchange.succeed
                                : 0}{' '}
                              {t('succeed')}
                            </Label>
                          </FlexItem>
                          <FlexItem>
                            <Label color="blue" isCompact>
                              {camelPod.runtime.exchange.pending
                                ? camelPod.runtime.exchange.pending
                                : 0}{' '}
                              {t('pending')}
                            </Label>
                          </FlexItem>
                          <FlexItem>
                            <Label color="red" isCompact>
                              {camelPod.runtime.exchange.failed
                                ? camelPod.runtime.exchange.failed
                                : 0}{' '}
                              {t('failed')}
                            </Label>
                          </FlexItem>
                          <FlexItem>
                            <Label color="grey" isCompact>
                              {camelPod.runtime.exchange.total
                                ? camelPod.runtime.exchange.total
                                : 0}{' '}
                              {t('total')}
                            </Label>
                          </FlexItem>
                        </Flex>
                      </FlexItem>
                    </Flex>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {hasObserve(camelPod) && (
                  <DescriptionListGroup>
                    <DescriptionListDescription>
                      <Divider />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </>
            ) : (
              <></>
            )}

            {hasObserve(camelPod) ? (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Endpoints')}:</DescriptionListTerm>
                <DescriptionListDescription>
                  <Table>
                    <Tbody>
                      <tr>
                        <td>{t('Health')}:</td>
                        <td>
                          {camelPod.observe.healthEndpoint}:{camelPod.observe.healthPort}
                        </td>
                      </tr>
                      <tr>
                        <td>{t('Metrics')}:</td>
                        <td>
                          {camelPod.observe.metricsEndpoint}:{camelPod.observe.metricsPort}
                        </td>
                      </tr>
                    </Tbody>
                  </Table>
                </DescriptionListDescription>
              </DescriptionListGroup>
            ) : (
              <></>
            )}
          </DescriptionList>
        </CardBody>
      </Card>
    </>
  );
};

export default CamelAppStatusPod;
