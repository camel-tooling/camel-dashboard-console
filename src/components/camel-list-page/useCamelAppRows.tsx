import * as React from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Timestamp } from '@openshift-console/dynamic-plugin-sdk';
import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import { Label } from '@patternfly/react-core';
import { MinusIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { CamelAppKind } from '../../types';
import { CamelDataViewColumn, CamelDataViewTd, nameCellProps } from './CamelDataView';
import CamelAppHealth from './CamelAppHealth';
import CamelImage from '@images/camel.svg';
import { getStatus, getRuntimeProvider, getCamelHealth } from './camelAppAccessors';
import { getCamelVersionAsString } from './camelAppVersion';
import { getLastMessageTimestamp } from './lastMessage';

export const useCamelAppRows = () => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  return useCallback(
    (
      data: CamelAppKind[],
      tableColumns: CamelDataViewColumn<CamelAppKind>[],
    ): CamelDataViewTd[][] => {
      return data.map((obj) => {
        const lastMessageDate = getLastMessageTimestamp(obj, 'asc');

        const rowCells: Record<string, { cell: React.ReactNode; props?: Record<string, unknown> }> =
          {
            name: {
              cell: (
                <span className="co-resource-item co-resource-item--truncate">
                  <span className="co-m-resource-icon co-m-resource-camel">
                    <img src={CamelImage} alt="Camel" className="camel-icon" />
                  </span>
                  <Link
                    to={`/camel/app/ns/${obj.metadata.namespace}/name/${obj.metadata.name}`}
                    className="co-resource-item__resource-name"
                    title={obj.metadata.name}
                    data-test="camelapp-link"
                  >
                    {obj.metadata.name}
                  </Link>
                </span>
              ),
              props: nameCellProps,
            },
            namespace: {
              cell: (
                <span className="co-break-word co-line-clamp">
                  {obj.metadata?.namespace || (
                    <Label color="grey" icon={<MinusIcon />} isCompact>
                      {t('No namespace')}
                    </Label>
                  )}
                </span>
              ),
            },
            status: {
              cell: <Status status={getStatus(obj)} />,
            },
            health: {
              cell: <CamelAppHealth health={getCamelHealth(obj)} />,
            },
            runtime: {
              cell: getRuntimeProvider(obj) || (
                <Label color="grey" icon={<MinusIcon />} isCompact>
                  {t('No runtime provider')}
                </Label>
              ),
            },
            camel: {
              cell: getCamelVersionAsString(obj, 'asc') || (
                <Label color="grey" icon={<MinusIcon />} isCompact>
                  {t('No camel version')}
                </Label>
              ),
            },
            lastmessage: {
              cell: lastMessageDate ? <Timestamp timestamp={lastMessageDate} /> : '-',
            },
          };

        return tableColumns.map(({ id }) => ({
          id,
          cell: rowCells[id]?.cell ?? '-',
          props: rowCells[id]?.props,
        }));
      });
    },
    [t],
  );
};
