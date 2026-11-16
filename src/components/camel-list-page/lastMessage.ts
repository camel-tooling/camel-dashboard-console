import { SortByDirection } from '@patternfly/react-table';
import { CamelAppKind } from '../../types';

const getLastMessageTimestamps = (camelInt: CamelAppKind): string[] => {
  const timestamps =
    camelInt.status?.pods
      ?.map((pod) => pod.runtime?.exchange?.lastTimestamp)
      .filter((timestamp): timestamp is string => !!timestamp) ?? [];

  // The operator keeps the SLI when the app is scaled down, so this timestamp is
  // the only last exchange information available for paused monitors.
  const sliTimestamp = camelInt.status?.sliExchangeSuccessRate?.lastTimestamp;
  if (sliTimestamp) {
    timestamps.push(sliTimestamp);
  }

  return timestamps;
};

export function getLastMessageTimestamp(camelInt: CamelAppKind): string {
  const timestamps = getLastMessageTimestamps(camelInt)
    .map((timestamp) => ({ timestamp, time: Date.parse(timestamp) }))
    .filter(({ time }) => !Number.isNaN(time))
    .sort((a, b) => b.time - a.time);

  return timestamps.length > 0 ? timestamps[0].timestamp : '';
}

const getLastMessageTime = (camelInt: CamelAppKind): number => {
  const time = Date.parse(getLastMessageTimestamp(camelInt));
  return Number.isNaN(time) ? 0 : time;
};

export const sortResourceByLastMessage =
  (direction: SortByDirection) => (a: CamelAppKind, b: CamelAppKind) => {
    const result = getLastMessageTime(a) - getLastMessageTime(b);
    return direction === SortByDirection.asc ? result : -result;
  };
