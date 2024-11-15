# common-hosted-email-service

![Version: 0.2.2](https://img.shields.io/badge/Version-0.2.2-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.8.0](https://img.shields.io/badge/AppVersion-0.8.0-informational?style=flat-square)

A microservice for managing access control to S3 Objects

**Homepage:** <https://bcgov.github.io/common-hosted-email-service>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| NR Common Service Showcase Team | <NR.CommonServiceShowcase@gov.bc.ca> | <https://bcgov.github.io/common-service-showcase/team.html> |

## Source Code

* <https://github.com/bcgov/common-hosted-email-service>

## Requirements

Kubernetes: `>= 1.13.0`

| Repository | Name | Version |
|------------|------|---------|
| file://../postgres | postgres(postgrescluster) | 2.0.1 |
| https://charts.bitnami.com/bitnami | redis(redis) | 20.0.3 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| autoscaling.behavior | object | `{"scaleDown":{"policies":[{"periodSeconds":120,"type":"Pods","value":1}],"selectPolicy":"Max","stabilizationWindowSeconds":120},"scaleUp":{"policies":[{"periodSeconds":30,"type":"Pods","value":2}],"selectPolicy":"Max","stabilizationWindowSeconds":0}}` | behavior configures the scaling behavior of the target in both Up and Down directions (scaleUp and scaleDown fields respectively). |
| autoscaling.enabled | bool | `false` | Specifies whether the Horizontal Pod Autoscaler should be created |
| autoscaling.maxReplicas | int | `16` |  |
| autoscaling.minReplicas | int | `2` |  |
| autoscaling.targetCPUUtilizationPercentage | int | `80` |  |
| config.configMap | object | `{"DB_PORT":"5432","SERVER_ATTACHMENTLIMIT":"20mb","SERVER_BODYLIMIT":"100mb","SERVER_LOGLEVEL":"http","SERVER_PORT":"3000","SERVER_SMTPHOST":"apps.smtp.gov.bc.ca"}` | These values will be wholesale added to the configmap as is; refer to the ches documentation for what each of these values mean and whether you need them defined. Ensure that all values are represented explicitly as strings, as non-string values will not translate over as expected into container environment variables. For configuration keys named `*_ENABLED`, either leave them commented/undefined, or set them to string value "true". |
| config.enabled | bool | `false` | Set to true if you want to let Helm manage and overwrite your configmaps. |
| config.releaseScoped | bool | `false` | This should be set to true if and only if you require configmaps and secrets to be release scoped. In the event you want all instances in the same namespace to share a similar configuration, this should be set to false |
| failurePolicy | string | `"Retry"` |  |
| fullnameOverride | string | `nil` | String to fully override fullname |
| image.pullPolicy | string | `"IfNotPresent"` | Default image pull policy |
| image.repository | string | `"docker.io/bcgovimages"` | Default image repository |
| image.tag | string | `nil` | Overrides the image tag whose default is the chart appVersion. |
| imagePullSecrets | list | `[]` | Specify docker-registry secret names as an array |
| nameOverride | string | `nil` | String to partially override fullname |
| networkPolicy.enabled | bool | `true` | Specifies whether a network policy should be created |
| podAnnotations | object | `{}` | Annotations for ches pods |
| podSecurityContext | object | `{}` | Privilege and access control settings |
| postgres.databaseInitSQL.key | string | `"bootstrap.sql"` |  |
| postgres.databaseInitSQL.name | string | `"bootstrap-sql"` |  |
| postgres.databaseInitSQL.sql | string | `"\\c ches;\nALTER DATABASE ches OWNER TO app;\nALTER SCHEMA public OWNER TO app;\nREVOKE CREATE ON SCHEMA public FROM PUBLIC;\n"` |  |
| postgres.enabled | bool | `true` |  |
| postgres.instances[0].dataVolumeClaimSpec.accessModes[0] | string | `"ReadWriteOnce"` |  |
| postgres.instances[0].dataVolumeClaimSpec.resources.requests.storage | string | `"1Gi"` |  |
| postgres.instances[0].dataVolumeClaimSpec.storageClassName | string | `"netapp-block-standard"` |  |
| postgres.instances[0].name | string | `"db"` |  |
| postgres.instances[0].replicas | int | `2` |  |
| postgres.instances[0].resources.limits.cpu | string | `"100m"` |  |
| postgres.instances[0].resources.limits.memory | string | `"256Mi"` |  |
| postgres.instances[0].resources.requests.cpu | string | `"50m"` |  |
| postgres.instances[0].resources.requests.memory | string | `"128Mi"` |  |
| postgres.instances[0].sidecars.replicaCertCopy.resources.limits.cpu | string | `"50m"` |  |
| postgres.instances[0].sidecars.replicaCertCopy.resources.limits.memory | string | `"64Mi"` |  |
| postgres.instances[0].sidecars.replicaCertCopy.resources.requests.cpu | string | `"1m"` |  |
| postgres.instances[0].sidecars.replicaCertCopy.resources.requests.memory | string | `"32Mi"` |  |
| postgres.monitoring | bool | `false` |  |
| postgres.pgBackRestConfig.jobs.resources.limits.cpu | string | `"50m"` |  |
| postgres.pgBackRestConfig.jobs.resources.limits.memory | string | `"128Mi"` |  |
| postgres.pgBackRestConfig.jobs.resources.requests.cpu | string | `"10m"` |  |
| postgres.pgBackRestConfig.jobs.resources.requests.memory | string | `"64Mi"` |  |
| postgres.pgBackRestConfig.manual.options[0] | string | `"--type=full"` |  |
| postgres.pgBackRestConfig.manual.repoName | string | `"repo1"` |  |
| postgres.pgBackRestConfig.repoHost.resources.limits.cpu | string | `"50m"` |  |
| postgres.pgBackRestConfig.repoHost.resources.limits.memory | string | `"256Mi"` |  |
| postgres.pgBackRestConfig.repoHost.resources.requests.cpu | string | `"20m"` |  |
| postgres.pgBackRestConfig.repoHost.resources.requests.memory | string | `"128Mi"` |  |
| postgres.pgBackRestConfig.sidecars.pgbackrest.resources.limits.cpu | string | `"20m"` |  |
| postgres.pgBackRestConfig.sidecars.pgbackrest.resources.limits.memory | string | `"64Mi"` |  |
| postgres.pgBackRestConfig.sidecars.pgbackrest.resources.requests.cpu | string | `"5m"` |  |
| postgres.pgBackRestConfig.sidecars.pgbackrest.resources.requests.memory | string | `"16Mi"` |  |
| postgres.pgBackRestConfig.sidecars.pgbackrestConfig.resources.limits.cpu | string | `"20m"` |  |
| postgres.pgBackRestConfig.sidecars.pgbackrestConfig.resources.limits.memory | string | `"64Mi"` |  |
| postgres.pgBackRestConfig.sidecars.pgbackrestConfig.resources.requests.cpu | string | `"5m"` |  |
| postgres.pgBackRestConfig.sidecars.pgbackrestConfig.resources.requests.memory | string | `"32Mi"` |  |
| postgres.pgBouncerConfig.config.global.client_tls_sslmode | string | `"disable"` |  |
| postgres.pgBouncerConfig.replicas | int | `2` |  |
| postgres.pgBouncerConfig.resources.limits.cpu | string | `"20m"` |  |
| postgres.pgBouncerConfig.resources.limits.memory | string | `"64Mi"` |  |
| postgres.pgBouncerConfig.resources.requests.cpu | string | `"5m"` |  |
| postgres.pgBouncerConfig.resources.requests.memory | string | `"32Mi"` |  |
| postgres.postgresVersion | int | `16` | ------------------------------ note: override methodology: - defaults exist in subchart postgres - overrides that apply to all ches environments are defined in this values.yaml file - overrides specific to a single environment are defined in values.<environment>.yaml name of the cluster. in ches pipeline we pass this in Helm deploy command in github action eg: --set postgres.name=postgres-master name: postgres-master |
| postgres.users[0].databases[0] | string | `"ches"` |  |
| postgres.users[0].name | string | `"app"` |  |
| redis.architecture | string | `"replication"` |  |
| redis.auth.enabled | bool | `false` |  |
| redis.enabled | bool | `true` |  |
| redis.global.storageClass | string | `"netapp-block-standard"` |  |
| redis.image.registry | string | `"artifacts.developer.gov.bc.ca/docker-remote"` |  |
| redis.replica.persistence.accessMode | string | `"ReadWriteOnce"` |  |
| redis.replica.persistence.enabled | bool | `true` |  |
| redis.replica.persistence.size | string | `"25Mi"` |  |
| redis.replica.persistentVolumeClaimRetentionPolicy.enabled | bool | `true` |  |
| redis.replica.persistentVolumeClaimRetentionPolicy.whenDeleted | string | `"Delete"` |  |
| redis.replica.replicaCount | int | `2` |  |
| redis.replica.resources.limits.cpu | string | `"50m"` |  |
| redis.replica.resources.limits.memory | string | `"150Mi"` |  |
| redis.replica.resources.requests.cpu | string | `"20m"` |  |
| redis.replica.resources.requests.memory | string | `"50Mi"` |  |
| redis.replica.shareProcessNamespace | bool | `true` |  |
| redis.sentinel.containerSecurityContext | object | `{}` |  |
| redis.sentinel.enabled | bool | `true` |  |
| redis.sentinel.image.registry | string | `"artifacts.developer.gov.bc.ca/docker-remote"` |  |
| redis.sentinel.persistence.accessMode | string | `"ReadWriteOnce"` |  |
| redis.sentinel.persistence.enabled | bool | `true` |  |
| redis.sentinel.persistence.size | string | `"25Mi"` |  |
| redis.sentinel.persistence.storageClass | string | `"netapp-block-standard"` |  |
| redis.sentinel.persistentVolumeClaimRetentionPolicy.enabled | bool | `true` |  |
| redis.sentinel.persistentVolumeClaimRetentionPolicy.whenDeleted | string | `"Delete"` |  |
| redis.sentinel.persistentVolumeClaimRetentionPolicy.whenScaled | string | `"Delete"` |  |
| redis.sentinel.podSecurityContext | object | `{}` |  |
| redis.sentinel.quorum | int | `1` |  |
| redis.sentinel.resources.limits.cpu | string | `"50m"` |  |
| redis.sentinel.resources.limits.memory | string | `"150Mi"` |  |
| redis.sentinel.resources.requests.cpu | string | `"20m"` |  |
| redis.sentinel.resources.requests.memory | string | `"50Mi"` |  |
| replicaCount | int | `2` |  |
| resources.limits.cpu | string | `"200m"` | Limit Peak CPU (in millicores ex. 1000m) |
| resources.limits.memory | string | `"256Mi"` | Limit Peak Memory (in gigabytes Gi or megabytes Mi ex. 2Gi) |
| resources.requests.cpu | string | `"50m"` | Requested CPU (in millicores ex. 500m) |
| resources.requests.memory | string | `"128Mi"` | Requested Memory (in gigabytes Gi or megabytes Mi ex. 500Mi) |
| route.annotations | object | `{}` | Annotations to add to the route |
| route.enabled | bool | `true` | Specifies whether a route should be created |
| route.host | string | `"chart-example.local"` |  |
| route.tls.insecureEdgeTerminationPolicy | string | `"Redirect"` |  |
| route.tls.termination | string | `"edge"` |  |
| route.wildcardPolicy | string | `"None"` |  |
| securityContext | object | `{}` | Privilege and access control settings |
| service.port | int | `3000` | Service port |
| service.portName | string | `"3000-tc"` | Service port name |
| service.type | string | `"ClusterIP"` | Service type |
| serviceAccount.annotations | object | `{}` | Annotations to add to the service account |
| serviceAccount.enabled | bool | `false` | Specifies whether a service account should be created |
| serviceAccount.name | string | `nil` | The name of the service account to use. If not set and create is true, a name is generated using the fullname template |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.14.2](https://github.com/norwoodj/helm-docs/releases/v1.14.2)
