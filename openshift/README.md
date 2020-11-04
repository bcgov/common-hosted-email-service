# Common Hosted Email Service on Openshift

This application is deployed on Openshift. This readme will outline how to setup and configure an Openshift project to get the application to a deployable state. There are also some historical notes on how to bootstrap from nothing to fully deployed on Openshift. This document assumes a working knowledge of Kubernetes/Openshift container orchestration concepts (i.e. buildconfigs, deployconfigs, imagestreams, secrets, configmaps, routes, etc)

Our builds and deployments are orchestrated with Jenkins as part of the devops tools ecosystem (see [nr-showcase-devops-tools](https://github.com/bcgov/nr-showcase-devops-tools)). Refer to [Jenkinsfile](../Jenkinsfile) and [Jenkinsfile.cicd](../Jenkinsfile.cicd) to see how the Openshift templates are used for building and deploying in our CI/CD pipeline.

## Environment Setup - ConfigMaps and Secrets

There are some requirements in the target Openshift namespace/project which are **outside** of the CI/CD pipeline process. This application requires that a few Secrets as well as Config Maps be already present in the environment before it is able to function as intended. Otherwise the Jenkins pipeline will fail the deployment by design.

### Add Deployer NSP to namespace

As OCP4 requires explicit NSP rules to allow network traffic, we must ensure that k8s deployer pods are able to talk to the k8s API. This must be done in all of your deployment namespaces (dev, test, prod).

``` sh
export NAMESPACE=<YOURNAMESPACE>
oc -n $NAMESPACE process -f nsp.yaml -p NAMESPACE=$NAMESPACE -o yaml | oc -n $NAMESPACE apply -f -
```

### Config Maps

In order to prepare an environment, you will need to ensure that all of the following configmaps and secrets are populated. This is achieved by executing the following commands as a project administrator of the targeted environment. Note that this must be repeated on *each* of the target deployment namespace/projects (i.e. `dev`, `test` and `prod`) as that they are independent of each other. Deployment will fail otherwise. Refer to [custom-environment-variables](../app/config/custom-environment-variables.json) for the direct mapping of environment variables for the backend.

*Note: Replace anything in angle brackets with the appropriate value!*

```sh
oc create -n 9f0fbe-<env> configmap ches-keycloak-config \
  --from-literal=KC_REALM=jbd6rnxw \
  --from-literal=KC_SERVERURL=https://dev.oidc.gov.bc.ca/auth
```

*Note: Change KC_SERVERURL's sso-dev to sso-test or sso depending on the environment!*

```sh
oc create -n 9f0fbe-<env> configmap ches-server-config \
  --from-literal=SERVER_ATTACHMENTLIMIT=20mb \
  --from-literal=SERVER_BODYLIMIT=100mb \
  --from-literal=SERVER_LOGLEVEL=info \
  --from-literal=SERVER_MORGANFORMAT=combined \
  --from-literal=SERVER_PORT=3000 \
  --from-literal=SERVER_SMTPHOST=apps.smtp.gov.bc.ca
```

### Secrets

Replace anything in angle brackets with the appropriate value!

_Note: Publickey if used must be a PEM-encoded value encapsulated in double quotes in the argument. Newlines should not be re-encoded when using this command. If authentication fails, it's very likely a newline whitespace issue._

```sh
oc create -n 9f0fbe-<env> secret generic ches-keycloak-secret \
  --type=kubernetes.io/basic-auth \
  --from-literal=username=<username> \
  --from-literal=password=<password>
```

## Build Config & Deployment

This application is a Node.js standalone microservice. We are currently leveraging basic Openshift Routes to expose and foward incoming traffic to the right pods.

### Application

The application is a standard [Node](https://nodejs.org)/[Express](https://expressjs.com) server. It handles the JWT based authentication via OIDC authentication flow, and exposes the API to authorized users. This deployment container is built up using an Openshift S2I image strategy. The resulting container after build is what is deployed.

## Templates

The Jenkins pipeline heavily leverages Openshift Templates in order to ensure that all of the environment variables, settings, and contexts are pushed to Openshift correctly. Files ending with `.bc.yaml` specify the build configurations, while files ending with `.dc.yaml` specify the components required for deployment.

### Build Configurations

Build configurations will emit and handle the chained builds or standard builds as necessary. They take in the following parameters:

| Name | Required | Description |
| --- | --- | --- |
| REPO_NAME | yes | Application repository name |
| JOB_NAME | yes | Job identifier (i.e. 'pr-5' OR 'master') |
| SOURCE_REPO_REF | yes | Git Pull Request Reference (i.e. 'pull/CHANGE_ID/head') |
| SOURCE_REPO_URL | yes | Git Repository URL |

The template can be manually invoked and deployed via Openshift CLI. For example:

```sh
oc -n 9f0fbe-<env> process -f openshift/app.bc.yaml -p REPO_NAME=common-hosted-email-service
 -p JOB_NAME=master -p SOURCE_REPO_URL=https://github.com/bcgov/common-hosted-email-service.git -p SOURCE_REPO_REF=master -o yaml | oc -n 9f0fbe-<env> create -f -
```

Note that these build configurations do not have any triggers defined. They will be invoked by the Jenkins pipeline, started manually in the console, or by an equivalent oc command for example:

```sh
oc -n 9f0fbe-<env> start-build <buildname> --follow
```

Finally, we generally tag the resultant image so that the deployment config will know which exact image to use. This is also handled by the Jenkins pipeline. The equivalent oc command for example is:

```sh
oc -n 9f0fbe-<env> tag <buildname>:latest <buildname>:master
```

*Note: Remember to swap out the bracketed values with the appropriate values!*

### Deployment Configurations

Deployment configurations will emit and handle the deployment lifecycles of running containers based off of the previously built images. They generally contain a deploymentconfig, a service, and a route. They take in the following parameters:

| Name | Required | Description |
| --- | --- | --- |
| REPO_NAME | yes | Application repository name |
| JOB_NAME | yes | Job identifier (i.e. 'pr-5' OR 'master') |
| NAMESPACE | yes | which namespace/"environment" are we deploying to? dev, test, prod? |
| APP_NAME | yes | short name for the application |
| HOST_ROUTE | yes | used to set the publicly accessible url |

The Jenkins pipeline will handle deployment invocation automatically. However should you need to run it manually, you can do so with the following for example:

```sh
oc -n 9f0fbe-<env> process -f openshift/app.dc.yaml -p REPO_NAME=common-hosted-email-service -p JOB_NAME=master -p NAMESPACE=9f0fbe-<env> -p APP_NAME=ches -p HOST_ROUTE=ches-<env>.pathfinder.gov.bc.ca -o yaml | oc -n 9f0fbe-<env> apply -f -
```

Due to the triggers that are set in the deploymentconfig, the deployment will begin automatically. However, you can deploy manually by use the following command for example:

```sh
oc -n 9f0fbe-<env> rollout latest dc/<buildname>-master
```

*Note: Remember to swap out the bracketed values with the appropriate values!*

## Sidecar Logging

As of October 2020, we are using a Fluent-bit sidecar to collect logs from the CHES application. The sidecar deployment is included in the main app.dc.yaml file.
Additional steps for configuring the sidecar can be seen on the [wiki](https://github.com/bcgov/nr-get-token/wiki/Logging-to-a-Sidecar).

## Pull Request Cleanup

As of this time, we do not automatically clean up resources generated by a Pull Request once it has been accepted and merged in. This is still a manual process. Our PR deployments are all named in the format "pr-###", where the ### is the number of the specific PR. In order to clear all resources for a specific PR, run the following two commands to delete all relevant resources from the Openshift project (replacing `PRNUMBER` with the appropriate number):

```sh
oc delete all -n 9f0fbe-dev --selector app=ches-pr-<PRNUMBER>
oc delete all,svc,cm,sa,role,secret -n 9f0fbe-dev --selector cluster-name=pr-<PRNUMBER>
```

## Appendix: Generating Build Configuration Templates

You will likely not need to run the new template generation sections as that the base templates should already be in git. You should be able to skip those steps.

### New Node Builder Template

*If you are creating a new build configuration template, you will likely use the following commands:*

```sh
oc new-build -n 9f0fbe-tools registry.access.redhat.com/rhscl/nodejs-8-rhel7:latest~https://github.com/bcgov/nr-get-token.git#master --context-dir=frontend --name=get-token-frontend --dry-run -o yaml > openshift/frontend.bc.yaml
sed -i '' -e 's/kind: List/kind: Template/g' openshift/frontend.bc.yaml
sed -i '' -e 's/items:/objects:/g' openshift/frontend.bc.yaml
```

*Note: You need to remove any secrets and credentials that are auto-inserted into the frontend.bc.yaml file.*

### Process and Apply Builder Template

```sh
oc process -n 9f0fbe-tools -f openshift/frontend.bc.yaml -o yaml | oc create -n 9f0fbe-tools -f -
```

### New Caddy Static Image Template

*If you are creating a new build configuration template, you will likely use the following commands:*

```sh
oc new-build -n 9f0fbe-tools --docker-image=docker-registry.default.svc:5000/bcgov/s2i-caddy:v1-stable --source-image=frontend:latest --source-image-path=/opt/app-root/src/dist:tmp -D $'FROM docker-registry.default.svc:5000/bcgov/s2i-caddy:v1-stable\nCOPY tmp/dist/ /var/www/html/\nCMD /tmp/scripts/run' --dry-run --name=get-token-frontend-static -o yaml > openshift/frontend-static.bc.yaml
sed -i '' -e 's/kind: List/kind: Template/g' openshift/frontend-static.bc.yaml
sed -i '' -e 's/items:/objects:/g' openshift/frontend-static.bc.yaml
```

*Note: You need to remove any secrets and credentials that are auto-inserted into the frontend-static.bc.yaml file.*

### Process and Apply Static Image Template

```sh
oc process -n 9f0fbe-tools -f openshift/frontend-static.bc.yaml -o yaml | oc create -n 9f0fbe-tools -f -
```

### Tag the latest build and migrate it to the correct project namespace

```sh
oc tag -n 9f0fbe-dev 9f0fbe-tools/frontend-static:latest frontend-static:dev --reference-policy=local
```

### Create new Application Deployment

*If you are creating a new application deployment template, you will likely use the following commands:*

```sh
oc new-app -n 9f0fbe-dev --image-stream=frontend-static:dev --name=get-token-frontend --dry-run -o yaml > openshift/frontend-static.dc.yaml
```

### Process and Apply the Application Deployment

```sh
oc process -n 9f0fbe-dev -f openshift/frontend-static.dc.yaml -o yaml | oc create -n 9f0fbe-dev -f -
oc create -n 9f0fbe-dev route edge frontend --service=frontend --port=2015-tcp
```

### Templating Work in Progress

The above commands will need to be templated. We can expect something like the following in part of the commands:

```sh
'--name=${NAME}${SUFFIX}' '--context-dir=${GIT_DIR}'
```
