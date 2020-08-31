# Common Hosted Email Service [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE) [![Quality Gate](https://sonarqube-9f0fbe-tools.pathfinder.gov.bc.ca/api/badges/gate?key=common-hosted-email-service-master)](https://sonarqube-9f0fbe-tools.pathfinder.gov.bc.ca/dashboard?id=common-hosted-email-service-master)

[![Bugs](https://sonarqube-9f0fbe-tools.pathfinder.gov.bc.ca/api/badges/measure?key=common-hosted-email-service-master&metric=bugs)](https://sonarqube-9f0fbe-tools.pathfinder.gov.bc.ca/dashboard?id=common-hosted-email-service-master)
[![Vulnerabilities](https://sonarqube-9f0fbe-tools.pathfinder.gov.bc.ca/api/badges/measure?key=common-hosted-email-service-master&metric=vulnerabilities)](https://sonarqube-9f0fbe-tools.pathfinder.gov.bc.ca/dashboard?id=common-hosted-email-service-master)
[![Code Smells](https://sonarqube-9f0fbe-tools.pathfinder.gov.bc.ca/api/badges/measure?key=common-hosted-email-service-master&metric=code_smells)](https://sonarqube-9f0fbe-tools.pathfinder.gov.bc.ca/dashboard?id=common-hosted-email-service-master)
[![Coverage](https://sonarqube-9f0fbe-tools.pathfinder.gov.bc.ca/api/badges/measure?key=common-hosted-email-service-master&metric=coverage)](https://sonarqube-9f0fbe-tools.pathfinder.gov.bc.ca/dashboard?id=common-hosted-email-service-master)
[![Lines](https://sonarqube-9f0fbe-tools.pathfinder.gov.bc.ca/api/badges/measure?key=common-hosted-email-service-master&metric=lines)](https://sonarqube-9f0fbe-tools.pathfinder.gov.bc.ca/dashboard?id=common-hosted-email-service-master)
[![Duplication](https://sonarqube-9f0fbe-tools.pathfinder.gov.bc.ca/api/badges/measure?key=common-hosted-email-service-master&metric=duplicated_lines_density)](https://sonarqube-9f0fbe-tools.pathfinder.gov.bc.ca/dashboard?id=common-hosted-email-service-master)

CHES - Powered by NodeMailer (a shared library)

To learn more about the **Common Services** available visit the [Common Services Showcase](https://bcgov.github.io/common-service-showcase/) page.

## Directory Structure

    .github/                   - PR and Issue templates
    app/                       - Node.js web application
    openshift/                 - OpenShift-deployment specific files
    CODE-OF-CONDUCT.md         - Code of Conduct
    CONTRIBUTING.md            - Contributing Guidelines
    Jenkinsfile                - Top-level Pipeline
    Jenkinsfile.cicd           - Pull-Request Pipeline
    LICENSE                    - License
    sonar-project.properties   - SonarQube Scanner settings

## Documentation

* [Application Readme](app/README.md)
* [API Specification](app/README.md#api-usage)
* [Openshift Readme](openshift/README.md)
* [Devops Tools Setup](https://github.com/bcgov/nr-showcase-devops-tools)
* [Showcase Team Roadmap](https://github.com/bcgov/nr-get-token/wiki/Product-Roadmap)

## Getting Help or Reporting an Issue

To report bugs/issues/features requests, please file an issue.

## How to Contribute

If you would like to contribute, please see our [contributing](CONTRIBUTING.md) guidelines.

Please note that this project is released with a [Contributor Code of Conduct](CODE-OF-CONDUCT.md). By participating in this project you agree to abide by its terms.

## License

Unless otherwise specified, all code in this repository falls under the following license:

    Copyright 2019-2020 Province of British Columbia

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

The `nodemailer-openpgp` and `openpgp` library dependencies are licensed under [LGPL-3.0](https://opensource.org/licenses/lgpl-3.0.html).
