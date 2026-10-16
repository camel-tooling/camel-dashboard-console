import fs from 'fs';
import path from 'path';

const MANIFESTS_DIR = path.resolve(__dirname, '../fixtures/manifests');

/**
 * Reads a manifest YAML from tests/fixtures/manifests and replaces every
 * ${PLACEHOLDER} with the matching value from `vars`.
 *
 * Throws if the file references a placeholder we weren't given a value for,
 * so a missing env var fails fast instead of applying broken YAML.
 *
 * @param fileName e.g. 'subscription.yaml'
 * @param vars     e.g. { CHANNEL: 'stable-v1', STARTING_CSV: 'camel-monitor.v1.0.0' }
 * @returns the rendered YAML, ready to pipe into `oc apply -f -`
 */
export function renderManifest(fileName: string, vars: Record<string, string>): string {
  const filePath = path.join(MANIFESTS_DIR, fileName);
  const template = fs.readFileSync(filePath, 'utf-8');

  return template.replace(/\$\{(\w+)\}/g, (_match, name: string) => {
    const value = vars[name];
    if (value === undefined) {
      throw new Error(`Manifest "${fileName}": no value provided for \${${name}}`);
    }
    return value;
  });
}
