import * as React from 'react';
import { useEffect, useState } from 'react';
import { dateTimeFormatter, formatCompactDuration } from '../date-utils';
import { getLastLanguage } from '../utils';

type CamelAppLastMessageProps = {
  timestamp: string;
  suffix?: string;
};

const CamelAppLastMessage: React.FC<CamelAppLastMessageProps> = ({ timestamp, suffix }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const lastMessageDate = new Date(timestamp);
  const age = formatCompactDuration(now - lastMessageDate.getTime());

  return (
    <span title={dateTimeFormatter(getLastLanguage()).format(lastMessageDate)}>
      {age}
      {suffix ? ` ${suffix}` : ''}
    </span>
  );
};

export default CamelAppLastMessage;
