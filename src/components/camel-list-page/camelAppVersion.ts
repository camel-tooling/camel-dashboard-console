import { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';

export const sortResourceByCamelVersion =
  (direction: string) => (a: K8sResourceKind, b: K8sResourceKind) => {
    const { first, second } =
      direction === 'asc' ? { first: a, second: b } : { first: b, second: a };

    const firstValue = getCamelVersions(first, direction)[0] ?? '';
    const secondValue = getCamelVersions(second, direction)[0] ?? '';

    return firstValue.localeCompare(secondValue);
  };

export const getCamelVersions = (camelInt: K8sResourceKind, direction: string): string[] => {
  const versions = [
    ...new Set<string>(
      camelInt.status?.pods
        ?.map((pod) => pod.runtime?.camelVersion)
        .filter((version): version is string => !!version) ?? [],
    ),
  ].sort();

  return direction === 'asc' ? versions : versions.reverse();
};

export const getCamelVersionAsString = (camelInt: K8sResourceKind, direction: string): string =>
  getCamelVersions(camelInt, direction).join(',');
