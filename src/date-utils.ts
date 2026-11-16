import { TFunction } from 'i18next';

export type Duration = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

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

/**
 * Compact age, Kubernetes-style (e.g. 54s, 12m, 3h, 4d).
 */
export function formatCompactDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '0s';
  }

  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 120) {
    return `${totalSeconds}s`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 120) {
    return `${totalMinutes}m`;
  }

  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 48) {
    return `${totalHours}h`;
  }

  return `${Math.floor(totalHours / 24)}d`;
}

export function formatDuration(ms: number, t: TFunction): string {
  if (!Number.isFinite(ms) || ms < 0) {
    return '-';
  }

  const { days, hours, minutes } = getDuration(ms);

  if (days) {
    return t('{{count}} day', { count: days });
  }
  if (hours) {
    return t('{{count}} hour', { count: hours });
  }
  return t('{{count}} minute', { count: minutes });
}
