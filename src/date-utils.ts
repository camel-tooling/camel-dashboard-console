import { TFunction } from 'i18next';
import { getLastLanguage } from './utils';

export type Duration = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export const relativeTimeFormatter = (langArg: string) =>
  Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(langArg) : null;

export const dateTimeFormatter = (langArg: string) =>
  new Intl.DateTimeFormat(langArg, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    year: 'numeric',
  });

function getDuration(ms: number): Duration {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  seconds %= 60;
  let hours = Math.floor(minutes / 60);
  minutes %= 60;
  const days = Math.floor(hours / 24);
  hours %= 24;
  return { days, hours, minutes, seconds };
}

export function formatDuration(ms: number, t: TFunction, options?): string {
  const langArg = getLastLanguage();
  const duration = getDuration(ms);

  // Check for null. If dateTime is null, it returns incorrect date Jan 1 1970.
  if (!duration) {
    return '-';
  }

  const d = new Date(ms);
  const justNow = t('Just now');

  // If the event occurred less than one minute in the future, assume it's clock drift and show "Just now."
  if (!options?.omitSuffix && ms < 60000 && ms > -60000) {
    return justNow;
  }

  // Do not attempt to handle other dates in the future.
  if (ms < 0) {
    return '-';
  }

  const { days, hours, minutes } = getDuration(ms);

  if (options?.omitSuffix) {
    if (days) {
      return t('{{count}} day', { count: days });
    }
    if (hours) {
      return t('{{count}} hour', { count: hours });
    }
    return t('{{count}} minute', { count: minutes });
  }

  // Fallback to normal date/time formatting if Intl.RelativeTimeFormat is not
  // available. This is the case for older Safari versions.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat#browser_compatibility
  if (!relativeTimeFormatter(langArg)) {
    return dateTimeFormatter(langArg).format(d);
  }

  if (!days && !hours && !minutes) {
    return justNow;
  }

  if (days) {
    return relativeTimeFormatter(langArg).format(-days, 'day');
  }

  if (hours) {
    return relativeTimeFormatter(langArg).format(-hours, 'hour');
  }

  return relativeTimeFormatter(langArg).format(-minutes, 'minute');
}
