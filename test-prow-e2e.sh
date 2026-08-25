#!/usr/bin/env bash

set -exuo pipefail

ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}
REPORTS_DIR=tests/reports
INSTALLER_DIR=${INSTALLER_DIR:=${ARTIFACT_DIR}/installer}

function copyArtifacts {
  if [ -d "$ARTIFACT_DIR" ] && [ -d "$REPORTS_DIR" ]; then
    if [[ -z "$(ls -A -- "$REPORTS_DIR")" ]]; then
      echo "No artifacts were copied."
    else
      echo "Copying artifacts from $(pwd)..."
      cp -r "$REPORTS_DIR" "${ARTIFACT_DIR}/reports"
    fi
  fi
}

trap copyArtifacts EXIT


# don't log kubeadmin-password
set +x
CLUSTER_PASSWORD="$(cat "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR}/auth/kubeadmin-password}")"
export CLUSTER_PASSWORD
set -x
CONSOLE_URL="$(oc get consoles.config.openshift.io cluster -o jsonpath='{.status.consoleURL}')"
export CONSOLE_URL
export CLUSTER_USER=kubeadmin

echo "Install dependencies"
if [ ! -d node_modules ]; then
  yarn install
fi

echo "Install Playwright browsers"
yarn playwright install --with-deps chrome firefox

echo "Runs Playwright tests"
yarn run test:e2e
