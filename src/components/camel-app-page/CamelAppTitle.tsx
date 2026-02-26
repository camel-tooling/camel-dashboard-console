import * as React from 'react';
import { Link } from 'react-router-dom-v5-compat';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ALL_NAMESPACES_KEY, camelAppGVK } from '../../const';
import { ResourceStatus, useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import { PageHeader } from '@patternfly/react-component-groups';
import { CamelAppKind } from '../../types';
import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import CamelImage from '@images/camel.svg';
import '../../camel.css';

type CamelAppTitleProps = {
  name: string;
  namespace: string;
  obj: CamelAppKind;
};

export const getUrlList = (namespace): string => {
  if (namespace === ALL_NAMESPACES_KEY) {
    return `/camel/all-namespaces`;
  } else {
    return `/camel/ns/` + namespace;
  }
};

const CamelAppTitle: React.FC<CamelAppTitleProps> = ({ name, obj }) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  const [activeNamespace] = useActiveNamespace();

  return (
    <>
      <PageHeader
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to={getUrlList(activeNamespace)}>{t('Camel')}</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>{t('Camel Application')}</BreadcrumbItem>
          </Breadcrumb>
        }
        title={
          <div className="co-m-pane__heading co-resource-item" data-test="camelapp-title">
            <span className="co-resource-item">
              <span className="pf-v6-u-screen-reader">C</span>
              <span
                className="co-m-resource-icon co-m-resource-secret co-m-resource-camel--lg co-m-resource-icon--lg"
                title={camelAppGVK.kind + '.' + camelAppGVK.group}
              >
                <img src={CamelImage} alt="Camel" className="camel-icon--lg" />
              </span>
              <span className="co-resource-item__resource-name" data-test="camelapp-name">
                {name}
              </span>
            </span>
            <ResourceStatus>
              <Status status={obj?.status?.phase} />
            </ResourceStatus>
          </div>
        }
      ></PageHeader>
    </>
  );
};

export default CamelAppTitle;
