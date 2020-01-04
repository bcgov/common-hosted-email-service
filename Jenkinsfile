#!groovy
import bcgov.GitHubHelper

// --------------------
// Declarative Pipeline
// --------------------
pipeline {
  agent any

  environment {
    // Enable pipeline verbose debug output if greater than 0
    DEBUG_OUTPUT = 'false'

    // Get projects/namespaces from config maps
    DEV_PROJECT = new File('/var/run/configs/ns/project.dev').getText('UTF-8').trim()
    TEST_PROJECT = new File('/var/run/configs/ns/project.test').getText('UTF-8').trim()
    PROD_PROJECT = new File('/var/run/configs/ns/project.prod').getText('UTF-8').trim()
    TOOLS_PROJECT = new File('/var/run/configs/ns/project.tools').getText('UTF-8').trim()

    // Get application config from config maps
    REPO_OWNER = new File('/var/run/configs/jobs/repo.owner').getText('UTF-8').trim()
    REPO_NAME = new File('/var/run/configs/jobs/repo.name').getText('UTF-8').trim()
    APP_NAME = new File('/var/run/configs/jobs/app.name').getText('UTF-8').trim()
    APP_DOMAIN = new File('/var/run/configs/jobs/app.domain').getText('UTF-8').trim()

    // JOB_NAME should be the pull request/branch identifier (i.e. 'pr-5')
    JOB_NAME = JOB_BASE_NAME.toLowerCase()

    // SOURCE_REPO_* references git repository resources
    SOURCE_REPO_RAW = "https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/master"
    SOURCE_REPO_REF = 'master'
    SOURCE_REPO_URL = "https://github.com/${REPO_OWNER}/${REPO_NAME}.git"

    // HOST_ROUTE is the full domain route endpoint (ie. 'appname-pr-5-9f0fbe-dev.pathfinder.gov.bc.ca')
    DEV_HOST_ROUTE = "${APP_NAME}-${JOB_NAME}-${DEV_PROJECT}.${APP_DOMAIN}"
    TEST_HOST_ROUTE = "${APP_NAME}-${JOB_NAME}-${TEST_PROJECT}.${APP_DOMAIN}"
    PROD_HOST_ROUTE = "${APP_NAME}-${JOB_NAME}-${PROD_PROJECT}.${APP_DOMAIN}"

    // SonarQube Endpoint URL
    SONARQUBE_URL_INT = 'http://sonarqube:9000'
    SONARQUBE_URL_EXT = "https://sonarqube-${TOOLS_PROJECT}.${APP_DOMAIN}"
  }

  options {
    parallelsAlwaysFailFast()
  }

  stages {
    stage('Initialize') {
      agent any
      steps {
        // Cancel any running builds in progress
        timeout(10) {
          echo "Cancelling previous ${APP_NAME}-${JOB_NAME} builds in progress..."
          abortAllPreviousBuildInProgress(currentBuild)
        }

        script {
          if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
            // Force OpenShift Plugin directives to be verbose
            openshift.logLevel(1)

            // Print all environment variables
            echo 'DEBUG - All pipeline environment variables:'
            echo sh(returnStdout: true, script: 'env')
          }
        }
      }
    }

    stage('Tests') {
      agent any
      steps {
        notifyStageStatus('Tests', 'PENDING')

        script {
          dir('app') {
            try {
              timeout(10) {
                echo 'Installing NPM Dependencies...'
                sh 'npm ci'

                echo 'Reporting Outdated and Vulnerable Dependencies...'
                sh 'npm audit || true'
                sh 'npm outdated || true'

                echo 'Linting and Testing...'
                sh 'npm run test'

                echo 'Lint Checks and Tests passed'
              }
            } catch (e) {
              echo 'Lint Checks and Tests failed'
              throw e
            }
          }

          echo 'Performing SonarQube static code analysis...'
          sh """
          sonar-scanner \
            -Dsonar.host.url='${SONARQUBE_URL_INT}' \
            -Dsonar.projectKey='${REPO_NAME}-${JOB_NAME}' \
            -Dsonar.projectName='Common Hosted Email Service (${JOB_NAME.toUpperCase()})'
          """
        }
      }
      post {
        success {
          echo 'All Lint Checks and Tests passed'
          notifyStageStatus('Tests', 'SUCCESS')
        }
        failure {
          echo 'Some Lint Checks and Tests failed'
          notifyStageStatus('Tests', 'FAILURE')
        }
      }
    }

    stage('Build') {
      agent any
      steps {
        script {
          openshift.withCluster() {
            openshift.withProject(TOOLS_PROJECT) {
              if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
                echo "DEBUG - Using project: ${openshift.project()}"
              }

              try {
                notifyStageStatus('Build', 'PENDING')

                echo "Processing BuildConfig ${REPO_NAME}-app..."
                def bcApp = openshift.process('-f',
                  'openshift/app.bc.yaml',
                  "REPO_NAME=${REPO_NAME}",
                  "JOB_NAME=${JOB_NAME}",
                  "SOURCE_REPO_URL=${SOURCE_REPO_URL}",
                  "SOURCE_REPO_REF=${SOURCE_REPO_REF}"
                )

                echo "Building ImageStream ${REPO_NAME}-app..."
                openshift.apply(bcApp).narrow('bc').startBuild('-w').logs('-f')

                echo "Tagging Image ${REPO_NAME}-app:${JOB_NAME}..."
                openshift.tag("${REPO_NAME}-app:latest",
                  "${REPO_NAME}-app:${JOB_NAME}"
                )

                echo 'App build successful'
                notifyStageStatus('Build', 'SUCCESS')
              } catch (e) {
                echo 'App build failed'
                notifyStageStatus('Build', 'FAILURE')
                throw e
              }
            }
          }
        }
      }
      post {
        success {
          echo 'Cleanup BuildConfigs...'
          script {
            openshift.withCluster() {
              openshift.withProject(TOOLS_PROJECT) {
                if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
                  echo "DEBUG - Using project: ${openshift.project()}"
                } else {
                  def bcApp = openshift.selector('bc', "${REPO_NAME}-app-${JOB_NAME}")

                  if(bcApp.exists()) {
                    echo "Removing BuildConfig ${REPO_NAME}-app-${JOB_NAME}..."
                    bcApp.delete()
                  }
                }
              }
            }
          }
        }
      }
    }

    stage('Deploy - Dev') {
      agent any
      steps {
        script {
          deployStage('Dev', DEV_PROJECT, DEV_HOST_ROUTE)
        }
      }
      post {
        success {
          createDeploymentStatus(DEV_PROJECT, 'SUCCESS', DEV_HOST_ROUTE)
          notifyStageStatus('Deploy - Dev', 'SUCCESS')
        }
        unsuccessful {
          createDeploymentStatus(DEV_PROJECT, 'FAILURE', DEV_HOST_ROUTE)
          notifyStageStatus('Deploy - Dev', 'FAILURE')
        }
      }
    }

    stage('Deploy - Test') {
      agent any
      steps {
        script {
          deployStage('Test', TEST_PROJECT, TEST_HOST_ROUTE)
        }
      }
      post {
        success {
          createDeploymentStatus(TEST_PROJECT, 'SUCCESS', TEST_HOST_ROUTE)
          notifyStageStatus('Deploy - Test', 'SUCCESS')
        }
        unsuccessful {
          createDeploymentStatus(TEST_PROJECT, 'FAILURE', TEST_HOST_ROUTE)
          notifyStageStatus('Deploy - Test', 'FAILURE')
        }
      }
    }

    stage('Deploy - Prod') {
      agent any
      steps {
        script {
          deployStage('Prod', PROD_PROJECT, PROD_HOST_ROUTE)
        }
      }
      post {
        success {
          createDeploymentStatus(PROD_PROJECT, 'SUCCESS', PROD_HOST_ROUTE)
          notifyStageStatus('Deploy - Prod', 'SUCCESS')
        }
        unsuccessful {
          createDeploymentStatus(PROD_PROJECT, 'FAILURE', PROD_HOST_ROUTE)
          notifyStageStatus('Deploy - Prod', 'FAILURE')
        }
      }
    }
  }
}

// ------------------
// Pipeline Functions
// ------------------

// Parameterized deploy stage
def deployStage(String stageEnv, String projectEnv, String hostRouteEnv) {
  if (!stageEnv.equalsIgnoreCase('Dev')) {
    input("Deploy to ${projectEnv}?")
  }

  notifyStageStatus("Deploy - ${stageEnv}", 'PENDING')

  openshift.withCluster() {
    openshift.withProject(projectEnv) {
      if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
        echo "DEBUG - Using project: ${openshift.project()}"
      }

      echo "Checking for ConfigMaps and Secrets in project ${openshift.project()}..."
      if(!(openshift.selector('cm', "ches-keycloak-config").exists() &&
      openshift.selector('cm', "ches-server-config").exists() &&
      openshift.selector('secret', "ches-keycloak-secret").exists())) {
        echo 'Some ConfigMaps and/or Secrets are missing. Please consult the openshift readme for details.'
        throw new Exception('Missing ConfigMaps and/or Secrets')
      }

      timeout(10) {
        parallel(
          Patroni: {
            // Apply Patroni Secret
            if(openshift.selector('secret', "patroni-${JOB_NAME}-secret").exists()) {
              echo "Patroni Secret already exists. Skipping..."
            } else {
              echo "Processing Patroni Secret..."
              def dcPatroniSecretTemplate = openshift.process('-f',
                'openshift/patroni.secret.yaml',
                "APP_DB_NAME=${APP_NAME}",
                "INSTANCE=${JOB_NAME}",
                "NAMESPACE=${projectEnv}"
              )

              echo "Creating Patroni Secret..."
              openshift.create(dcPatroniSecretTemplate)
            }

            // Apply Patroni Database
            if(openshift.selector('statefulset', "patroni-${JOB_NAME}").exists()) {
              echo "Patroni Deployment already exists. Skipping..."
            } else {
              echo "Processing Patroni StatefulSet.."
              def dcPatroniTemplate = openshift.process('-f',
                'openshift/patroni.dc.yaml',
                "INSTANCE=${JOB_NAME}"
              )

              echo "Applying Patroni StatefulSet..."
              def dcPatroni = openshift.apply(dcPatroniTemplate).narrow('statefulset')
              dcPatroni.rollout().status('--watch=true')
            }
          },

          Redis: {
            // Apply Redis Secret
            if(openshift.selector('secret', "redis-${JOB_NAME}-secret").exists()) {
              echo "Redis Secret already exists. Skipping..."
            } else {
              echo "Processing Redis Secret..."
              def dcRedisSecretTemplate = openshift.process('-f',
                'openshift/redis.secret.yaml',
                "REPO_NAME=${REPO_NAME}",
                "JOB_NAME=${JOB_NAME}",
                "APP_NAME=${APP_NAME}"
              )

              echo "Creating Redis Secret..."
              openshift.create(dcRedisSecretTemplate)
            }

            // Apply Redis Deployment
            if(openshift.selector('dc', "redis-${JOB_NAME}").exists()) {
              echo "Redis Deployment already exists. Skipping..."
            } else {
              echo "Processing DeploymentConfig Redis.."
              def dcRedisTemplate = openshift.process('-f',
                'openshift/redis.dc.yaml',
                "REPO_NAME=${REPO_NAME}",
                "JOB_NAME=${JOB_NAME}",
                "APP_NAME=${APP_NAME}"
              )

              echo "Applying Redis Deployment..."
              def dcRedis = openshift.apply(dcRedisTemplate).narrow('dc')
              dcRedis.rollout().status('--watch=true')
            }
          }
        )
      }

      createDeploymentStatus(projectEnv, 'PENDING', hostRouteEnv)

      // Wait for deployments to roll out
      timeout(10) {
        // Apply Server
        echo "Tagging Image ${REPO_NAME}-app:${JOB_NAME}..."
        openshift.tag("${TOOLS_PROJECT}/${REPO_NAME}-app:${JOB_NAME}", "${REPO_NAME}-app:${JOB_NAME}")

        echo "Processing DeploymentConfig ${REPO_NAME}-app..."
        def dcAppTemplate = openshift.process('-f',
          'openshift/app.dc.yaml',
          "REPO_NAME=${REPO_NAME}",
          "JOB_NAME=${JOB_NAME}",
          "NAMESPACE=${projectEnv}",
          "APP_NAME=${APP_NAME}",
          "HOST_ROUTE=${hostRouteEnv}"
        )

        echo "Applying ${REPO_NAME}-app Deployment..."
        def dcApp = openshift.apply(dcAppTemplate).narrow('dc')
        dcApp.rollout().status('--watch=true')
      }
    }
  }
}

// --------------------
// Supporting Functions
// --------------------

// Notify stage status and pass to Jenkins-GitHub library
def notifyStageStatus(String name, String status) {
  def sha1 = GIT_COMMIT
  if(JOB_BASE_NAME.startsWith('PR-')) {
    sha1 = GitHubHelper.getPullRequestLastCommitId(this)
  }

  GitHubHelper.createCommitStatus(
    this, sha1, status, BUILD_URL, '', "Stage: ${name}"
  )
}

// Create deployment status and pass to Jenkins-GitHub library
def createDeploymentStatus(String environment, String status, String hostUrl) {
  def ghDeploymentId = new GitHubHelper().createDeployment(
    this,
    SOURCE_REPO_REF,
    [
      'environment': environment,
      'task': "deploy:master"
    ]
  )

  new GitHubHelper().createDeploymentStatus(
    this,
    ghDeploymentId,
    status,
    ['targetUrl': "https://${hostUrl}"]
  )

  if (status.equalsIgnoreCase('SUCCESS')) {
    echo "${environment} deployment successful at https://${hostUrl}"
  } else if (status.equalsIgnoreCase('PENDING')) {
    echo "${environment} deployment pending..."
  } else if (status.equalsIgnoreCase('FAILURE')) {
    echo "${environment} deployment failed"
  }
}

// Creates a comment and pass to Jenkins-GitHub library
def commentOnPR(String comment) {
  if(JOB_BASE_NAME.startsWith('PR-')) {
    GitHubHelper.commentOnPullRequest(this, comment)
  }
}
