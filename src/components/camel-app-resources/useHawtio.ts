import { K8sResourceKind, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { consolePluginGVK, consoleGVK, HAWTIO_CONSOLE_PLUGIN_NAME } from '../../const';
import * as jsonpath from 'jsonpath';

const JOLOKIA_PORT_QUERY = '$.spec.containers[*].ports[?(@.name=="jolokia")]';

export function isHawtioEnabled(pod: K8sResourceKind): boolean {
  return pod && jsonpath.query(pod, JOLOKIA_PORT_QUERY).length > 0;
}

export const useHawtioConsolePlugin = (): {
  installed: boolean;
  activated: boolean;
} => {
  const [HawtioConsolePluginResource, pluginLoaded] = useK8sWatchResource<K8sResourceKind>({
    name: HAWTIO_CONSOLE_PLUGIN_NAME,
    groupVersionKind: consolePluginGVK,
    isList: false,
  });

  // used as activated if not found and test tooltip
  const [ConsoleResource, consoleLoaded] = useK8sWatchResource<K8sResourceKind>({
    name: 'cluster',
    groupVersionKind: consoleGVK,
    isList: false,
  });

  const installed = pluginLoaded && HawtioConsolePluginResource != null;

  const activated =
    !consoleLoaded ||
    (consoleLoaded &&
      ConsoleResource?.spec?.plugins?.includes(HAWTIO_CONSOLE_PLUGIN_NAME) === true);

  return { installed, activated };
};
