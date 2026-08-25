import path from 'path';

// Absolute so it resolves the same regardless of the cwd tests are run from.
// Shared by the config (storageState for the browser projects), the auth setup
// (writes it), and the appInfo fixture (reads it for the per-worker scrape).
export const AUTH_FILE = path.resolve(__dirname, '../.auth/state.json');
