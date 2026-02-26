import * as React from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Content,
  Icon,
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
  Tooltip,
  Button,
} from '@patternfly/react-core';
import { K8sResourceKind, ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { podGVK } from '../../const';
import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import { useCamelAppPods } from './useCamelAppResources';
import { getPodStatus } from './podStatus';
import { useTranslation } from 'react-i18next';
import { isHawtioEnabled, useHawtioConsolePlugin } from './useHawtio';
import { HawtioIcon } from './HawtioIcon';
import ResourceLoadingCard from './ResourceLoadingCard';

type CamelAppPodsProps = {
  obj: K8sResourceKind;
};

type Resources = {
  name: string;
  status: string;
  hawtioEnabled: boolean;
};

const CamelAppPods: React.FC<CamelAppPodsProps> = ({ obj: camelInt }) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  const pods: Resources[] = [];

  const { CamelAppPods, loaded: loadedPods } = useCamelAppPods(
    camelInt.metadata.namespace,
    camelInt.kind,
    camelInt.spec.selector,
  );

  const { installed: installedHawtioConsolePlugin, activated: activatedHawtioConsolePlugin } =
    useHawtioConsolePlugin();

  if (loadedPods && CamelAppPods.length > 0) {
    CamelAppPods.forEach((pod) => {
      pods.push({
        name: pod.metadata.name,
        status: getPodStatus(pod),
        hawtioEnabled: isHawtioEnabled(pod),
      });
    });
  }
  if (!loadedPods) {
    return <ResourceLoadingCard title={t('Pods')} />;
  }

  if (loadedPods && pods.length == 0) {
    return <></>;
  }

  return (
    <Card>
      <CardTitle>
        {t('Pods')} ({pods.length})
      </CardTitle>
      <CardBody>
        <DataList aria-label="Pods list" isCompact>
          {pods.map((resource, i) => {
            return (
              <DataListItem key={i}>
                <DataListItemRow>
                  <DataListItemCells
                    dataListCells={[
                      <DataListCell key="name" width={4}>
                        <Content>
                          <ResourceLink
                            groupVersionKind={podGVK}
                            name={resource.name}
                            namespace={camelInt.metadata.namespace}
                          />
                        </Content>
                      </DataListCell>,
                      <DataListCell key="status" width={2}>
                        <Content>
                          <Status title={resource.status || 'N/A'} status={resource.status} />
                        </Content>
                      </DataListCell>,
                      <DataListCell key="logs" width={3} alignRight>
                        <Content>
                          <Button
                            variant="link"
                            isInline
                            component="a"
                            href={`/k8s/ns/${camelInt.metadata.namespace}/pods/${resource.name}/logs`}
                          >
                            {t('View Logs')}
                          </Button>
                        </Content>
                      </DataListCell>,
                      resource.hawtioEnabled &&
                        installedHawtioConsolePlugin &&
                        activatedHawtioConsolePlugin && (
                          <DataListCell key="hawtio" width={3} alignRight>
                            <Content>
                              <Button
                                variant="link"
                                isInline
                                component="a"
                                href={`/k8s/ns/${camelInt.metadata.namespace}/pods/${resource.name}/hawtio`}
                              >
                                <Icon size="bodyDefault">
                                  <HawtioIcon />
                                </Icon>{' '}
                                {t('View Hawtio')}
                              </Button>
                            </Content>
                          </DataListCell>
                        ),
                      resource.hawtioEnabled &&
                        installedHawtioConsolePlugin &&
                        !activatedHawtioConsolePlugin && (
                          <DataListCell key="hawtio" width={3} alignRight>
                            <Content>
                              <Tooltip
                                content={t(
                                  'Hawtio plugin is installed but not enabled. Please enable it in the console settings.',
                                )}
                              >
                                <span>
                                  <Button variant="link" isInline isDisabled>
                                    <Icon size="bodyDefault">
                                      <HawtioIcon />
                                    </Icon>{' '}
                                    {t('View Hawtio')}
                                  </Button>
                                </span>
                              </Tooltip>
                            </Content>
                          </DataListCell>
                        ),
                    ].filter(Boolean)}
                  />
                </DataListItemRow>
              </DataListItem>
            );
          })}
        </DataList>
      </CardBody>
    </Card>
  );
};

export default CamelAppPods;
