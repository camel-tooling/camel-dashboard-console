import * as React from 'react';
import { useCamelAppJobs } from './useCamelAppResources';
import {
  Card,
  CardBody,
  CardTitle,
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
} from '@patternfly/react-core';
import { jobGVK } from '../../const';
import { K8sResourceKind, ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import ResourceLoadingCard from './ResourceLoadingCard';
import { useTranslation } from 'react-i18next';

type CamelAppJobsProps = {
  obj: K8sResourceKind;
};

type Resources = {
  name: string;
  status: string;
};

const CamelAppJobs: React.FC<CamelAppJobsProps> = ({ obj: camelAppOwner }) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');
  const jobs: Resources[] = [];

  const { CamelAppJobs, loaded: loadedJobs } = useCamelAppJobs(
    camelAppOwner.metadata.namespace,
    camelAppOwner.spec.selector,
  );
  if (loadedJobs && CamelAppJobs.length > 0) {
    CamelAppJobs.forEach((job) => {
      getJobsStatus(job);
      jobs.push({
        name: job.metadata.name,
        status: getJobsStatus(job),
      });
    });
  }
  if (!loadedJobs) {
    return <ResourceLoadingCard title={t('Jobs')} />;
  }

  if (loadedJobs && jobs.length == 0) {
    return <></>;
  }

  return (
    <Card>
      <CardTitle>
        {t('Jobs')} ({jobs.length})
      </CardTitle>
      <CardBody>
        <DataList aria-label={t('Jobs list')} isCompact>
          {jobs.map((resource, i) => {
            return (
              <DataListItem key={i}>
                <DataListItemRow>
                  <DataListItemCells
                    dataListCells={[
                      <DataListCell key="name" width={4}>
                        <ResourceLink
                          groupVersionKind={jobGVK}
                          name={resource.name}
                          namespace={camelAppOwner.metadata.namespace}
                        />
                      </DataListCell>,
                      <DataListCell key="status" width={2}>
                        <Status title={resource.status || 'N/A'} status={resource.status} />
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

const getJobsStatus = (job: K8sResourceKind): string => {
  const finished =
    job.status?.conditions?.filter(
      (condition) => condition.type == 'Complete' && condition.status == 'True',
    ).length == 1;
  const succeeded =
    job.status?.conditions?.filter(
      (condition) => condition.type == 'SuccessCriteriaMet' && condition.status == 'True',
    ).length == 1;
  if (finished) {
    if (succeeded) {
      return 'Succeeded';
    } else {
      return 'Failed';
    }
  } else {
    return 'Running';
  }
};

export default CamelAppJobs;
