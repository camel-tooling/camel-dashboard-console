import { useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';

type SetSearchParams = (
  updater: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams),
) => void;

export const useSearchParams = (): [URLSearchParams, SetSearchParams] => {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const setSearchParams = useCallback<SetSearchParams>(
    (updater) => {
      const currentParams = new URLSearchParams(location.search);
      const newParams = typeof updater === 'function' ? updater(currentParams) : updater;
      navigate({ ...location, search: newParams.toString() }, { replace: true });
    },
    [navigate, location],
  );

  return [searchParams, setSearchParams];
};
