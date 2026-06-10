import { useMemo, useCallback } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

type SetSearchParams = (
  updater: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams),
) => void;

export const useSearchParams = (): [URLSearchParams, SetSearchParams] => {
  const location = useLocation();
  const history = useHistory();

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const setSearchParams = useCallback<SetSearchParams>(
    (updater) => {
      const currentParams = new URLSearchParams(location.search);
      const newParams = typeof updater === 'function' ? updater(currentParams) : updater;
      history.replace({
        ...location,
        search: newParams.toString(),
      });
    },
    [history, location],
  );

  return [searchParams, setSearchParams];
};
