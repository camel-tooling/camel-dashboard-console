import * as React from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Content,
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
} from '@patternfly/react-core';
import { useCamelAppRoutes } from './useCamelAppResources';
import { K8sResourceKind, ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { routeGVK } from '../../const';
import RouteLocation from './RouteLocation';
import { useTranslation } from 'react-i18next';
import ResourceLoadingCard from './ResourceLoadingCard';

type CamelAppRoutesProps = {
  obj: K8sResourceKind;
};

type Resources = {
  name: string;
  route: K8sResourceKind;
};

const CamelAppRoutes: React.FC<CamelAppRoutesProps> = ({ obj: camelAppOwner }) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  const routes: Resources[] = [];

  const { CamelAppRoutes, loaded: loadedRoutes } = useCamelAppRoutes(
    camelAppOwner.metadata.namespace,
    camelAppOwner.metadata.name,
  );
  if (loadedRoutes && CamelAppRoutes.length > 0) {
    CamelAppRoutes.forEach((route) => {
      routes.push({
        name: route.metadata.name,
        route: route,
      });
    });
  }

  if (!loadedRoutes) {
    return <ResourceLoadingCard title={t('Routes')} />;
  }

  if (loadedRoutes && routes.length == 0) {
    return <></>;
  }

  return (
    <Card>
      <CardTitle>
        {t('Routes')} ({routes.length})
      </CardTitle>
      <CardBody>
        <DataList aria-label={t('Routes list')} isCompact>
          {routes.map((resource, i) => {
            return (
              <DataListItem key={i}>
                <DataListItemRow>
                  <DataListItemCells
                    dataListCells={[
                      <DataListCell key="route">
                        <Content>
                          <ResourceLink
                            groupVersionKind={routeGVK}
                            name={resource.name}
                            namespace={camelAppOwner.metadata.namespace}
                          />
                        </Content>
                        <div className="camel-margin-top-sm">
                          <RouteLocation obj={resource.route} />
                        </div>
                      </DataListCell>,
                    ]}
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

export default CamelAppRoutes;
