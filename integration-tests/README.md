# Integration Tests for Camel Dashboard Console

This directory contains Cypress-based end-to-end integration tests for the Camel Dashboard Console OpenShift plugin.

## Test Structure

```
integration-tests/
├── tests/                          # Test files
│   ├── plugin-integration.cy.ts    # P0: Plugin loads and navigation works
│   ├── camel-list-page.cy.ts       # P1: List page functionality
│   └── camel-details-page.cy.ts    # P1: Details page functionality
├── support/                        # Cypress custom commands
│   ├── index.ts                    # Main support file
│   ├── login.ts                    # Login/logout commands
│   ├── nav.ts                      # Navigation helpers
│   ├── project.ts                  # Project/namespace commands
│   └── selectors.ts                # Test selector helpers
├── plugins/                        # Cypress plugins
│   └── index.ts                    # Webpack preprocessor config
├── fixtures/                       # Test data fixtures
├── artifacts/                      # Test outputs (gitignored)
│   ├── screenshots/                # Failure screenshots
│   └── videos/                     # Test run recordings
├── screenshots/                    # Test reports (gitignored)
├── cypress.config.js               # Cypress configuration
└── README.md                       # This file
```

## Running Tests

### **Prerequisites**
- OpenShift cluster with console access
- `oc` CLI configured and logged in
- Camel Dashboard Operator installed (creates CamelApp CRD)
- Node.js 20+ and Yarn installed

### **Local Development (Recommended)**

**Terminal 1 - Start Plugin:**
```bash
yarn install
yarn run start
```

**Terminal 2 - Start OpenShift Console:**
```bash
oc login <your-cluster>
yarn run start-console
```

**Terminal 3 - Run Tests:**
```bash
# Interactive mode (opens Cypress UI)
yarn run test-cypress-skip-helm

# Headless mode (runs in terminal)
yarn run test-cypress-headless-skip-helm
```

### **CI/CD Environment**

For automated testing with Helm deployment:
```bash
export PLUGIN_TEMPLATE_PULL_SPEC=quay.io/camel-tooling/camel-dashboard-console:latest
yarn run test-cypress-headless
```

Or use the provided script:
```bash
./test-prow-e2e.sh
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SKIP_HELM_INSTALL` | Skip Helm chart installation | `false` |
| `BRIDGE_BASE_ADDRESS` | OpenShift console URL | `http://localhost:9000/` |
| `BRIDGE_KUBEADMIN_PASSWORD` | Admin password | Auto-detected |
| `BRIDGE_E2E_BROWSER_NAME` | Browser for tests | `electron` |
| `PLUGIN_TEMPLATE_PULL_SPEC` | Plugin image to deploy | - |

## Test Results

### **Viewing Results**

After running tests, check:

**Console Output:**
```
✔  All specs passed!
```

**JSON Reports:**
```bash
cat integration-tests/screenshots/cypress_report*.json
```

**Videos:**
```bash
ls integration-tests/artifacts/videos/
```

**Screenshots (only on failures):**
```bash
ls integration-tests/artifacts/screenshots/
```


## Troubleshooting

### **Tests Timeout**
- Increase `defaultCommandTimeout` in `cypress.config.js`
- Check console is running: `http://localhost:9000`
- Check plugin is running: `http://localhost:9001`

### **"CamelApp CRD not found"**
- Install Camel Dashboard Operator
- Or manually install CRD:
  ```bash
  oc apply -f <camelapp-crd.yaml>
  ```

### **Details Page Tests Skipped**
- This is expected if no CamelApps exist
- Create a test CamelApp:
  ```bash
  oc apply -f <test-camelapp.yaml>
  ```

### **Welcome Popup Won't Close**
- The test handles French/English popups
- Check console logs for popup structure
- Update popup selectors if needed

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [OpenShift Console Plugin SDK](https://github.com/openshift/console)
- [Console CronTab Plugin Example](https://github.com/openshift/console-crontab-plugin)
- [Camel Dashboard Documentation](https://camel-tooling.github.io/camel-dashboard/)
