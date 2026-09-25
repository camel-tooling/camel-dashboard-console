import { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';
import { formatDuration } from '../../date-utils';
import { TFunction } from 'i18next';

export const sortResourceByLastMessage =
  (direction: string) => (a: K8sResourceKind, b: K8sResourceKind) => {
    const { first, second } =
      direction === 'asc' ? { first: a, second: b } : { first: b, second: a };

    const firstValue = first ? getLastMessageTimestamp(first, direction) : undefined;
    const secondValue = second ? getLastMessageTimestamp(second, direction) : undefined;

    const originTime = new Date(null).getTime();
    const firstValueDate = firstValue ? Date.parse(firstValue) : originTime;
    const secondValueDate = secondValue ? Date.parse(secondValue) : originTime;

    return firstValueDate - secondValueDate;
  };

export function getLastMessageTimestamp(camelInt: K8sResourceKind, direction: string): string {
  if (direction == 'asc') {
    const lastMessagesTimestamps = camelInt.status?.pods
      ?.map((pod) => pod.runtime?.exchange?.lastTimestamp)
      .filter((item) => item !== undefined)
      .reduce((acc, item) => {
        if (!acc.includes(item)) acc.push(item);
        return acc;
      }, [])
      .sort();
    if (lastMessagesTimestamps && lastMessagesTimestamps.length > 0) {
      return lastMessagesTimestamps[0];
    }
  } else {
    const lastMessagesTimestamps = camelInt.status?.pods
      ?.map((pod) => pod.runtime?.exchange?.lastTimestamp)
      .filter((item) => item !== undefined)
      .reduce((acc, item) => {
        if (!acc.includes(item)) acc.push(item);
        return acc;
      }, [])
      .sort()
      .reverse();
    if (lastMessagesTimestamps && lastMessagesTimestamps.length > 0) {
      return lastMessagesTimestamps[0];
    }
  }
  return '';
}

export function getLastMessageAsString(
  camelInt: K8sResourceKind,
  direction: string,
  t: TFunction,
): string {
  const lastMessagesTimestamp = getLastMessageTimestamp(camelInt, direction);
  if (lastMessagesTimestamp) {
    const now = Date.now();
    const lastMessageTimestamp = Date.parse(lastMessagesTimestamp);
    const duration = now - lastMessageTimestamp;
    const durationFull = formatDuration(duration, t, {
      omitSuffix: false,
    });
    return durationFull;
  }
  return '';
}
