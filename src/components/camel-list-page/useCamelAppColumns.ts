import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SortByDirection } from '@patternfly/react-table';
import { CamelAppKind } from '../../types';
import { CamelDataViewColumn, nameColumnProps } from './CamelDataView';
import { sortResourceByCamelVersion } from './camelAppVersion';
import { sortResourceByLastMessage } from './lastMessage';

export const useCamelAppColumns = (showNamespace: boolean) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  return useMemo<CamelDataViewColumn<CamelAppKind>[]>(
    () => [
      { title: t('Name'), id: 'name', sortFunction: 'metadata.name', props: nameColumnProps },
      ...(showNamespace
        ? [{ title: t('Namespace'), id: 'namespace', sortFunction: 'metadata.namespace' }]
        : []),
      { title: t('Status'), id: 'status', sortFunction: 'status.phase' },
      {
        title: t('Camel Health'),
        id: 'health',
        sortFunction: 'status.sliExchangeSuccessRate.status',
      },
      {
        title: t('Runtime Provider'),
        id: 'runtime',
        sortFunction: 'status.pods[0].runtime.runtimeProvider',
      },
      {
        title: t('Camel Version'),
        id: 'camel',
        sortFunction: (data: CamelAppKind[], direction: SortByDirection) =>
          [...data].sort(sortResourceByCamelVersion(direction)),
      },
      {
        title: t('Time since the last message'),
        id: 'lastmessage',
        sortFunction: (data: CamelAppKind[], direction: SortByDirection) =>
          [...data].sort(sortResourceByLastMessage(direction)),
      },
    ],
    [t, showNamespace],
  );
};
