import { BaseSyntheticEvent, useCallback, useState, useEffect } from 'react';
import { ISortBy, SortByDirection } from '@patternfly/react-table';
import { useSearchParams } from './useSearchParams';
import { CamelDataViewColumn } from './CamelDataView';

export const getSortByDirection = (value: string): SortByDirection =>
  value === SortByDirection.desc.valueOf() ? SortByDirection.desc : SortByDirection.asc;

export const useCamelDataViewSort = <TData>({
  columns,
  sortColumnIndex,
  sortDirection,
}: {
  columns: CamelDataViewColumn<TData>[];
  sortColumnIndex?: number;
  sortDirection?: SortByDirection;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialSortState = useCallback<() => ISortBy>(() => {
    const sortByParam = searchParams.get('sortBy');
    const orderByParam = searchParams.get('orderBy');

    if (sortByParam && columns.length > 0) {
      const columnIndex = columns.findIndex((col) => col.title === sortByParam);
      if (columnIndex >= 0) {
        return {
          index: columnIndex,
          direction: getSortByDirection(orderByParam),
        };
      }
    }

    return {
      index: sortColumnIndex ?? 0,
      direction: sortDirection ?? SortByDirection.asc,
    };
  }, [searchParams, columns, sortColumnIndex, sortDirection]);

  const [sortBy, setSortBy] = useState<ISortBy>(getInitialSortState);

  const applySort = useCallback(
    (index: number, direction: SortByDirection) => {
      const sortColumn = columns[index];
      if (sortColumn) {
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set('sortBy', sortColumn.title);
          newParams.set('orderBy', direction);
          return newParams;
        });
        setSortBy({ index, direction });
      }
    },
    [columns, setSearchParams],
  );

  useEffect(() => {
    const newSortState = getInitialSortState();
    setSortBy((prev) => {
      if (prev.index === newSortState.index && prev.direction === newSortState.direction) {
        return prev;
      }
      return newSortState;
    });
  }, [getInitialSortState]);

  const onSort = useCallback(
    (event: BaseSyntheticEvent, index: number, direction: SortByDirection) => {
      event.preventDefault();
      applySort(index, direction);
    },
    [applySort],
  );

  return { sortBy, onSort };
};
