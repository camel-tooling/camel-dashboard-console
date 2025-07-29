# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#
# Use bash explicitly in this Makefile to avoid unexpected platform
# incompatibilities among Linux distros.
#
SHELL := /bin/bash

PLUGIN_VERSION := 0.1.1
PLUGIN_NAME := camel-openshift-console-plugin
PLUGIN_NAMESPACE := camel-dashboard
PLUGIN_IMAGE := quay.io/camel-tooling/camel-openshift-console-plugin

# Replace SNAPSHOT with the current timestamp
DATETIMESTAMP=$(shell date -u '+%Y%m%d-%H%M%S')
VERSION := $(subst -SNAPSHOT,-$(DATETIMESTAMP),$(VERSION))


#
# =======================
# Override-able Variables
# =======================
#

#
# the namespace, image name and version for the plugin
#

CUSTOM_PLUGIN_NAMESPACE ?= $(PLUGIN_NAMESPACE)
CUSTOM_PLUGIN_IMAGE ?= $(PLUGIN_IMAGE)
CUSTOM_PLUGIN_VERSION ?= $(PLUGIN_VERSION)



#
# =======================
# Environment Checks
# =======================
#


yarn:
ifeq (, $(shell command -v yarn 2> /dev/null))
	$(error "No yarn found in PATH. Please install and re-run")
endif

podman:
ifeq (, $(shell command -v podman 2> /dev/null))
	$(error "No podman found in PATH. Please install and re-run")
endif

oc:
ifeq (, $(shell command -v oc 2> /dev/null))
	$(error "No oc found in PATH. Please install and re-run")
endif

helm:
ifeq (, $(shell command -v helm 2> /dev/null))
	$(error "No helm found in PATH. Please install and re-run")
endif

.PHONY: yarn podman oc helm

#
# =========================
# Development and Building
# =========================
#

# TODO licence, format, and lint-fix

#---
#
#@ setup
#
#== Sets up yarn by installing all dependencies
#
#=== Calls: yarn
#
#---
setup: yarn
	@echo "####### Setup $(PLUGIN_NAME) ..."
	yarn install

#---
#
#@ lint
#
#== Executes linting of all source code
#
#=== Calls: setup
#
#---
lint: setup
	@echo "####### Linter $(PLUGIN_NAME) ..."
	yarn lint

#---
#
#@ build
#
#== Performs a local build of the console plugin
#
#=== Calls: setup
#
#---
build: setup
	@echo "####### Building $(PLUGIN_NAME) ..."
	yarn build

#---
#
#@ build-dev
#
#== Performs a local build dev mode of the console plugin
#
#=== Calls: setup
#
#---
build-dev: setup
	@echo "####### Building $(PLUGIN_NAME) ..."
	yarn build-dev

#---
#
#@ image
#
#== Executes a local build of the production container images
#
#=== Calls: podman
#
#* PARAMETERS:
#** CUSTOM_PLUGIN_IMAGE:     Set a custom plugin image to install from
#** CUSTOM_PLUGIN_VERSION:   Set a custom plugin image version to install from
#
#---
image: podman
	podman build -t $(CUSTOM_PLUGIN_IMAGE):$(CUSTOM_PLUGIN_VERSION) .

#---
#
#@ push
#
#== Pushes the locally build image to the registry
#
#=== Calls: podman
#
#* PARAMETERS:
#** CUSTOM_PLUGIN_IMAGE:     Set a custom plugin image to install from
#** CUSTOM_PLUGIN_VERSION:   Set a custom plugin image version to install from
#
#---
push: podman
	podman push --tls-verify=false $(CUSTOM_PLUGIN_IMAGE):$(CUSTOM_PLUGIN_VERSION) 

.PHONY: setup build build-dev image

#
# ============================
# Installation and Deployment
# ============================
#



#---
#
#@ deploy
#
#== Install the plugin into an OCP cluster
#
#=== Calls: oc, helm
#
#* PARAMETERS:
#** CUSTOM_PLUGIN_NAMESPACE: Set a custom namespace to install to
#** CUSTOM_PLUGIN_IMAGE:     Set a custom plugin image to install from
#** CUSTOM_PLUGIN_VERSION:   Set a custom plugin image version to install from
#
#---
deploy: oc helm
	./bin/install-camel-openshift-console-plugin --namespace $(CUSTOM_PLUGIN_NAMESPACE) --image $(CUSTOM_PLUGIN_IMAGE):$(CUSTOM_PLUGIN_VERSION)

#---
#
#@ undeploy
#
#== Install the plugin into an OCP cluster
#
#=== Calls: helm
#
#* PARAMETERS:
#** CUSTOM_PLUGIN_NAMESPACE: Set a custom namespace to uninstall from
#
#---
undeploy: helm
	helm uninstall $(PLUGIN_NAME) --namespace=$(CUSTOM_PLUGIN_NAMESPACE)

all: image push deploy

.PHONY: deploy undeploy all

#
# ============================
# Release
# ============================
#

#---
#
#@ helm-release
#
#== Release helm chart
#
#=== Calls: helm
#
#* PARAMETERS:
#** CUSTOM_PLUGIN_VERSION: Set a custom plugin chart version to release
#
#---
helm-release: helm
	./bin/release-helm-chart-camel-openshift-console-plugin ${CUSTOM_PLUGIN_VERSION}

.PHONY: helm-release

help: ## Show this help screen.
	@awk 'BEGIN { printf "\nUsage: make \033[31m<PARAM1=val1 PARAM2=val2>\033[0m \033[36m<target>\033[0m\n"; printf "\nAvailable targets are:\n" } /^#@/ { printf "\033[36m%-15s\033[0m", $$2; subdesc=0; next } /^#===/ { printf "%-14s \033[32m%s\033[0m\n", " ", substr($$0, 5); subdesc=1; next } /^#==/ { printf "\033[0m%s\033[0m\n\n", substr($$0, 4); next } /^#\*\*/ { printf "%-14s \033[31m%s\033[0m\n", " ", substr($$0, 4); next } /^#\*/ && (subdesc == 1) { printf ""; next } /^#\-\-\-/ { printf "\n"; next }' $(MAKEFILE_LIST)
	

.DEFAULT_GOAL := help
default: help

.PHONY: help
