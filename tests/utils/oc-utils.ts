import { execSync } from 'child_process';

/** Builds an Error from a child_process failure, preferring its captured stderr. */
function cliError(prefix: string, error: unknown): Error {
  const err = error as Error & { stderr?: string };
  return new Error(`${prefix}: ${err.stderr || err.message}`);
}

export function execOc(command: string): string {
  try {
    return execSync(`oc ${command}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();
  } catch (error: unknown) {
    throw cliError('oc execution failed', error);
  }
}

export function ocApplyYaml(yamlContent: string): string {
  try {
    return execSync('oc apply -f -', {
      input: yamlContent,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error: unknown) {
    throw cliError('oc apply failed', error);
  }
}

export function ocDelete(resource: string, name: string, namespace?: string): string {
  const nsFlag = namespace ? `-n ${namespace}` : '';
  try {
    // --wait=false: don't block until the object (and dependents) finish terminating.
    // Teardown is fire-and-forget; a stuck finalizer must not hang the test command.
    return execSync(`oc delete ${resource} ${name} ${nsFlag} --ignore-not-found --wait=false`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();
  } catch (error: unknown) {
    throw cliError('oc delete failed', error);
  }
}

export function execHelm(command: string): string {
  try {
    return execSync(`helm ${command}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();
  } catch (error: unknown) {
    throw cliError('helm execution failed', error);
  }
}
