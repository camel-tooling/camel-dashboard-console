import * as React from 'react';
import { useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SkeletonTableBody } from '@patternfly/react-component-groups';
import {
  Bullseye,
  Pagination,
  PaginationVariant,
} from '@patternfly/react-core';
import {
  DataView,
  DataViewFilters,
  DataViewState,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
} from '@patternfly/react-data-view';
import { useDataViewFilters, useDataViewPagination } from '@patternfly/react-data-view';
import { InnerScrollContainer, SortByDirection, Tbody, Td, Tr } from '@patternfly/react-table';
import type { ThProps } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useSearchParams } from './useSearchParams';
import { useCamelDataViewSort, getSortByDirection } from './useCamelDataViewSort';

export type CamelDataViewColumn<TData> = {
  id: string;
  title: string;
  sortFunction?: string | ((data: TData[], direction: SortByDirection) => TData[]);
  props?: ThProps;
};

export type CamelDataViewTd = {
  id: string;
  cell: React.ReactNode;
  props?: Record<string, unknown>;
};

type BaseFilters = {
  name: string;
};

type CamelDataViewProps<TData, TFilters extends BaseFilters> = {
  label?: string;
  data: TData[];
  loaded: boolean;
  loadError?: string;
  columns: CamelDataViewColumn<TData>[];
  getDataViewRows: (data: TData[], columns: CamelDataViewColumn<TData>[]) => CamelDataViewTd[][];
  initialFilters: TFilters;
  additionalFilterNodes?: React.ReactNode[];
  matchesAdditionalFilters?: (obj: TData, filters: TFilters) => boolean;
  getObjectName?: (obj: TData) => string;
};

export const nameColumnProps = {
  isStickyColumn: true,
  stickyMinWidth: '0',
  modifier: 'nowrap' as const,
};

export const nameCellProps = {
  isStickyColumn: true,
  stickyMinWidth: '0',
  hasRightBorder: true,
};

const sortByValue =
  <TData,>(direction: SortByDirection, getter: (obj: TData) => unknown) =>
  (a: TData, b: TData) => {
    const aVal = getter(a);
    const bVal = getter(b);
    const result =
      typeof aVal === 'string' && typeof bVal === 'string'
        ? aVal.localeCompare(bVal)
        : (aVal as number) - (bVal as number);
    return direction === SortByDirection.asc ? result : -result;
  };

const defaultGetName = (obj: unknown): string =>
  (obj as { metadata?: { name?: string } })?.metadata?.name ?? '';


export const CamelDataView = <TData, TFilters extends BaseFilters>({
  label,
  data,
  loaded,
  loadError,
  columns,
  getDataViewRows,
  initialFilters,
  additionalFilterNodes,
  matchesAdditionalFilters,
  getObjectName = defaultGetName,
}: CamelDataViewProps<TData, TFilters>) => {
  const { t } = useTranslation('plugin__camel-dashboard-console');
  const [searchParams, setSearchParams] = useSearchParams();

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<TFilters>({
    initialFilters,
    searchParams,
    setSearchParams,
  });

  const filteredData = useMemo(
    () =>
      data?.filter((resource) => {
        const resourceName = getObjectName(resource);
        const matchesName =
          !filters.name ||
          resourceName.toLowerCase().includes(filters.name.toLowerCase());

        return matchesName && (matchesAdditionalFilters?.(resource, filters) ?? true);
      }) ?? [],
    [data, filters, getObjectName, matchesAdditionalFilters],
  );

  const pagination = useDataViewPagination({
    perPage: 50,
    searchParams,
    setSearchParams,
  });

  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    if (!_.isEqual(prevFiltersRef.current, filters) && pagination.page > 1) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('page', '1');
        return newParams;
      });
    }
    prevFiltersRef.current = filters;
  }, [filters, pagination.page, setSearchParams]);

  const dataViewColumns = useMemo(
    () =>
      columns.map(({ id, title, sortFunction, props: columnProps }, index) => {
        const headerProps: ThProps = { dataLabel: title, ...columnProps };

        if (sortFunction) {
          headerProps.sort = {
            columnIndex: index,
            sortBy: {
              index: 0,
              direction: SortByDirection.asc,
              defaultDirection: SortByDirection.asc,
            },
          };
        }

        return {
          id,
          title,
          sortFunction,
          props: headerProps,
          cell: <span>{title}</span>,
        };
      }),
    [columns],
  );

  const { sortBy, onSort } = useCamelDataViewSort<TData>({ columns: dataViewColumns });

  const sortedData = useMemo(() => {
    const sortColumn = dataViewColumns[sortBy.index];
    if (!sortColumn?.sortFunction) return filteredData;

    const direction = getSortByDirection(sortBy.direction);

    if (typeof sortColumn.sortFunction === 'string') {
      return [...filteredData].sort(
        sortByValue(direction, (obj) => _.get(obj, sortColumn.sortFunction as string)),
      );
    }

    if (typeof sortColumn.sortFunction === 'function') {
      return sortColumn.sortFunction([...filteredData], direction);
    }

    return filteredData;
  }, [dataViewColumns, filteredData, sortBy.direction, sortBy.index]);

  const paginatedData = sortedData.slice(
    (pagination.page - 1) * pagination.perPage,
    pagination.page * pagination.perPage,
  );

  const dataViewRows = getDataViewRows(paginatedData, dataViewColumns);

  const columnsWithSort = useMemo(
    () =>
      dataViewColumns.map((column) => {
        if (!column.sortFunction || !column.props.sort) return column;
        return {
          ...column,
          props: {
            ...column.props,
            sort: {
              ...column.props.sort,
              sortBy: {
                ...column.props.sort.sortBy,
                index: sortBy.index,
                direction: sortBy.direction,
              },
              onSort,
            },
          },
        };
      }),
    [dataViewColumns, sortBy.index, sortBy.direction, onSort],
  );

  const activeState = useMemo(() => {
    if (!loaded) return DataViewState.loading;
    if (filteredData.length === 0) return DataViewState.empty;
    return undefined;
  }, [filteredData.length, loaded]);

  const bodyLoading = useMemo(
    () => <SkeletonTableBody rowsCount={5} columnsCount={columns.length} />,
    [columns.length],
  );

  const bodyEmpty = useMemo(
    () => (
      <Tbody>
        <Tr>
          <Td colSpan={columns.length}>
            <Bullseye>
              {label
                ? t('No {{label}} found', { label })
                : t('None found')}
            </Bullseye>
          </Td>
        </Tr>
      </Tbody>
    ),
    [columns.length, label, t],
  );

  const paginationTitles = useMemo(
    () => ({
      paginationAriaLabel: t('Pagination'),
      ofWord: t('of'),
      itemsPerPage: t('Items per page'),
      perPageSuffix: t('per page'),
    }),
    [t],
  );

  const filterNodes = useMemo<React.ReactNode[]>(() => {
    const basicFilters: React.ReactNode[] = [
      <DataViewTextFilter
        key="name"
        filterId="name"
        title={t('Name')}
      />,
    ];

    return additionalFilterNodes?.length > 0
      ? [...basicFilters, ...additionalFilterNodes]
      : basicFilters;
  }, [additionalFilterNodes, t]);

  if (loadError) {
    return (
      <Bullseye>
        <span>{t('Error loading data: {{error}}', { error: loadError })}</span>
      </Bullseye>
    );
  }

  return (
    <DataView activeState={activeState}>
      <DataViewToolbar
        filters={
          <DataViewFilters values={filters} onChange={(_e, values) => onSetFilters(values)}>
            {filterNodes}
          </DataViewFilters>
        }
        clearAllFilters={clearAllFilters}
        pagination={
          <Pagination
            itemCount={filteredData.length}
            titles={paginationTitles}
            variant={PaginationVariant.top}
            {...pagination}
          />
        }
      />
      <InnerScrollContainer>
        <DataViewTable
          aria-label={t('{{label}} table', { label })}
          columns={columnsWithSort}
          rows={dataViewRows}
          bodyStates={{ empty: bodyEmpty, loading: bodyLoading }}
          gridBreakPoint=""
        />
      </InnerScrollContainer>
      <Pagination
        itemCount={filteredData.length}
        titles={paginationTitles}
        variant={PaginationVariant.bottom}
        {...pagination}
      />
    </DataView>
  );
};
