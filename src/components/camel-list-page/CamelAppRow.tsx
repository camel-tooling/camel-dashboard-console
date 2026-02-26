import * as React from 'react';
import {
  K8sResourceKind,
  RowProps,
  TableData,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import { getCamelVersionAsString } from './camelAppVersion';
import CamelImage from '@images/camel.svg';
import CamelAppHealth from './CamelAppHealth';
import { getLastMessageTimestamp } from './lastMessage';
import { Label } from '@patternfly/react-core';
import { MinusIcon } from '@patternfly/react-icons';

const getNamespace = (obj) => obj.metadata?.namespace;
const getStatus = (obj) => (obj.status?.phase ? obj.status.phase : 'Unknown');
const getRuntimeProvider = (obj) =>
  obj.status?.pods && obj.status?.pods[0].runtime ? obj.status.pods[0].runtime.runtimeProvider : '';
const getCamelHealth = (obj) =>
  obj.status?.sliExchangeSuccessRate ? obj.status.sliExchangeSuccessRate.status : '';

// Check for a modified mouse event. For example - Ctrl + Click
const isModifiedEvent = (event: React.MouseEvent<HTMLElement>) => {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
};

const CamelAppRow: React.FC<RowProps<K8sResourceKind>> = ({ obj: camelInt, activeColumnIDs }) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');

  // Dead code ?
  const handleClick = (e) => {
    // Don't set last namespace if its modified click (Ctrl+Click).
    if (isModifiedEvent(e)) {
      return;
    }
  };

  const lastMessageDate = getLastMessageTimestamp(camelInt, 'asc');

  return (
    <>
      <TableData id="name" activeColumnIDs={activeColumnIDs} data-test-rows="resource-row">
        <span className="co-resource-item co-resource-item--truncate">
          <span className="co-m-resource-icon co-m-resource-camel">
            <img src={CamelImage} alt="Camel" className="camel-icon" />
          </span>

          <Link
            to={`/camel/app/ns/${camelInt.metadata.namespace}/name/${camelInt.metadata.name}`}
            className="co-resource-item__resource-name"
            title={camelInt.metadata.name}
            onClick={handleClick}
            data-test="camelapp-link"
          >
            {camelInt.metadata.name}
          </Link>
        </span>
      </TableData>
      <TableData id="namespace" activeColumnIDs={activeColumnIDs}>
        <span className="co-break-word co-line-clamp">
          {getNamespace(camelInt) || (
            <Label color="grey" icon={<MinusIcon />} isCompact>
              {t('No namespace')}
            </Label>
          )}
        </span>
      </TableData>
      <TableData id="status" activeColumnIDs={activeColumnIDs}>
        <Status status={getStatus(camelInt)} />
      </TableData>
      <TableData id="health" activeColumnIDs={activeColumnIDs}>
        <CamelAppHealth health={getCamelHealth(camelInt)} />
      </TableData>
      <TableData id="runtime" activeColumnIDs={activeColumnIDs}>
        {getRuntimeProvider(camelInt) || (
          <Label color="grey" icon={<MinusIcon />} isCompact>
            {t('No runtime provider')}
          </Label>
        )}
      </TableData>
      <TableData id="camel" activeColumnIDs={activeColumnIDs}>
        {getCamelVersionAsString(camelInt, 'asc') || (
          <Label color="grey" icon={<MinusIcon />} isCompact>
            {t('No camel version')}
          </Label>
        )}
      </TableData>
      <TableData id="lastmessage" activeColumnIDs={activeColumnIDs}>
        {lastMessageDate ? <Timestamp timestamp={lastMessageDate} /> : '-'}
      </TableData>
    </>
  );
};

export default CamelAppRow;
