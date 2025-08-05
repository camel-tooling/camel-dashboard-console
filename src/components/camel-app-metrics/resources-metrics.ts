import { K8sResourceKind, useK8sModel } from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';
import { deploymentGVK } from '../../const';

export enum ResourceUtilizationQuery {
  MEMORY = 'MEMORY',
  CPU = 'CPU',
  FILESYSTEM = 'FILESYSTEM',
  NETWORK_IN = 'NETWORK_IN',
  NETWORK_OUT = 'NETWORK_OUT',
  QUOTA_LIMIT = 'QUOTA_LIMIT',
  QUOTA_REQUEST = 'QUOTA_REQUEST',
}

const podControllerMetricsQueries = {
  [ResourceUtilizationQuery.MEMORY]: _.template(
    "sum(container_memory_working_set_bytes{container!=''} * on(pod) group_left(workload, workload_type) namespace_workload_pod:kube_pod_owner:relabel{workload='<%= name %>', workload_type='<%= type %>'}) by (pod)",
  ),
  [ResourceUtilizationQuery.CPU]: _.template(
    "sum(node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{} * on(pod) group_left(workload, workload_type) namespace_workload_pod:kube_pod_owner:relabel{workload='<%= name %>', workload_type='<%= type %>'}) by (pod)",
  ),
  [ResourceUtilizationQuery.FILESYSTEM]: _.template(
    "sum(pod:container_fs_usage_bytes:sum * on(pod) group_left(workload, workload_type) namespace_workload_pod:kube_pod_owner:relabel{workload='<%= name %>', workload_type='<%= type %>'}) by (pod)",
  ),
  [ResourceUtilizationQuery.NETWORK_IN]: _.template(
    "sum(irate(container_network_receive_bytes_total[5m]) * on (pod) group_left(workload,workload_type) namespace_workload_pod:kube_pod_owner:relabel{workload='<%= name %>', workload_type='<%= type %>'}) by (pod)",
  ),
  [ResourceUtilizationQuery.NETWORK_OUT]: _.template(
    "sum(irate(container_network_transmit_bytes_total[5m]) * on (pod) group_left(workload,workload_type) namespace_workload_pod:kube_pod_owner:relabel{workload='<%= name %>', workload_type='<%= type %>'}) by (pod)",
  ),
};

export const getPodControllerMetricsQueries = (
  name: string,
  type: string,
): { [key: string]: string[] } => ({
  [ResourceUtilizationQuery.MEMORY]: [
    podControllerMetricsQueries[ResourceUtilizationQuery.MEMORY]({ name, type }),
  ],
  [ResourceUtilizationQuery.CPU]: [
    podControllerMetricsQueries[ResourceUtilizationQuery.CPU]({ name, type }),
  ],
  [ResourceUtilizationQuery.FILESYSTEM]: [
    podControllerMetricsQueries[ResourceUtilizationQuery.FILESYSTEM]({ name, type }),
  ],
  [ResourceUtilizationQuery.NETWORK_IN]: [
    podControllerMetricsQueries[ResourceUtilizationQuery.NETWORK_IN]({ name, type }),
  ],
  [ResourceUtilizationQuery.NETWORK_OUT]: [
    podControllerMetricsQueries[ResourceUtilizationQuery.NETWORK_OUT]({ name, type }),
  ],
});

export const useResourceMetricsQueries = (obj: K8sResourceKind): { [key: string]: string[] } => {
  const [model] = useK8sModel(deploymentGVK);
  if (model) {
    return model.id === 'pod' ? null : getPodControllerMetricsQueries(obj.metadata.name, model.id);
  }
  return null;
};
