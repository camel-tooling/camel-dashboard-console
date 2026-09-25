import * as React from 'react';
import {
  Button,
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
import {
  K8sGroupVersionKind,
  K8sResourceKind,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

type CamelAppOwnerResourceProps = {
  obj: K8sResourceKind;
  gvk: K8sGroupVersionKind;
};

const CamelAppOwnerResource: React.FC<CamelAppOwnerResourceProps> = ({
  obj: camelAppOwner,
  gvk: ownerGvk,
}) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  return (
    <Card>
      <CardTitle>{camelAppOwner.kind}</CardTitle>
      <CardBody>
        <DataList aria-label={t('{{kind}} list', { kind: camelAppOwner.kind })} isCompact>
          <DataListItem>
            <DataListItemRow>
              <DataListItemCells
                dataListCells={[
                  <DataListCell key="name" width={4}>
                    <Content>
                      <ResourceLink
                        groupVersionKind={ownerGvk}
                        name={camelAppOwner.metadata.name}
                        namespace={camelAppOwner.metadata.namespace}
                      />
                    </Content>
                  </DataListCell>,
                  <DataListCell key="dashboards" width={3} alignRight>
                    <Content>
                      <Button
                        variant="link"
                        isInline
                        component={(props) => (
                          <Link
                            {...props}
                            to={`/dev-monitoring/ns/${camelAppOwner.metadata.namespace}?dashboard=dashboard-k8s-resources-workload&workload=${camelAppOwner.metadata.name}&type=ALL_OPTIONS_KEY`}
                          />
                        )}
                      >
                        {t('View dashboards')}
                      </Button>
                    </Content>
                  </DataListCell>,
                ]}
              />
            </DataListItemRow>
          </DataListItem>
        </DataList>
      </CardBody>
    </Card>
  );
};

export default CamelAppOwnerResource;
