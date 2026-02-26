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
  List,
  ListItem,
} from '@patternfly/react-core';
import { K8sResourceKind, ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { serviceGVK } from '../../const';
import { useCamelAppServices } from './useCamelAppResources';
import { LongArrowAltRightIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import ResourceLoadingCard from './ResourceLoadingCard';

type CamelAppServicesProps = {
  obj: K8sResourceKind;
};

type Resources = {
  name: string;
  ports: [];
};

const CamelAppServices: React.FC<CamelAppServicesProps> = ({ obj: camelAppOwner }) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  const services: Resources[] = [];

  const { CamelAppServices, loaded: loadedServices } = useCamelAppServices(
    camelAppOwner.metadata.namespace,
    camelAppOwner.metadata.name,
  );
  if (loadedServices && CamelAppServices.length > 0) {
    CamelAppServices.forEach((service) => {
      services.push({
        name: service.metadata.name,
        ports: service.spec?.ports ?? [],
      });
    });
  }

  if (!loadedServices) {
    return <ResourceLoadingCard title={t('Services')} />;
  }

  if (loadedServices && services.length == 0) {
    return <></>;
  }

  return (
    <Card>
      <CardTitle>
        {t('Services')} ({services.length})
      </CardTitle>
      <CardBody>
        <DataList aria-label={t('Services list')} isCompact>
          {services.map((resource, i) => {
            return (
              <DataListItem key={i}>
                <DataListItemRow>
                  <DataListItemCells
                    dataListCells={[
                      <DataListCell key="service">
                        <Content>
                          <ResourceLink
                            groupVersionKind={serviceGVK}
                            name={resource.name}
                            namespace={camelAppOwner.metadata.namespace}
                          />
                        </Content>
                        {resource.ports.length > 0 && (
                          <List isPlain className="camel-margin-top-sm">
                            {resource.ports.map(({ name, port, protocol, targetPort }) => (
                              <ListItem key={name || `${protocol}/${port}`}>
                                {t('Service port:')}{' '}
                                <strong>
                                  {name ? `${name} (${port})` : `${protocol}/${port}`}
                                </strong>{' '}
                                <LongArrowAltRightIcon /> {t('Pod port:')}{' '}
                                <strong>{targetPort}</strong>
                              </ListItem>
                            ))}
                          </List>
                        )}
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

export default CamelAppServices;
