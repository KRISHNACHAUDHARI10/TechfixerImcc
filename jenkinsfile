pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: sonar-scanner
    image: sonarsource/sonar-scanner-cli
    command: ["cat"]
    tty: true

  - name: kubectl
    image: bitnami/kubectl:latest
    command: ["cat"]
    tty: true
    securityContext:
      runAsUser: 0
      readOnlyRootFilesystem: false
    env:
    - name: KUBECONFIG
      value: /kube/config
    volumeMounts:
    - name: kubeconfig-secret
      mountPath: /kube/config
      subPath: kubeconfig

  - name: dind
    image: docker:dind
    securityContext:
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""
    volumeMounts:
    - name: docker-config
      mountPath: /etc/docker/daemon.json
      subPath: daemon.json

  volumes:
  - name: docker-config
    configMap:
      name: docker-daemon-config
  - name: kubeconfig-secret
    secret:
      secretName: kubeconfig-secret
'''
        }
    }

    environment {
        APP_NAME        = "techfixer-app"
        IMAGE_TAG       = "latest"
        REGISTRY_URL    = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
        REGISTRY_REPO   = "2401029"
        SONAR_PROJECT   = "2401029-techfixer-app"
        SONAR_HOST_URL  = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
    }

    stages {

        stage('CHECK') {
            steps {
                echo "✅ TechFixer Jenkinsfile for Roll No 2401029 is ACTIVE"
            }
        }

        stage('Build Docker Image') {
            steps {
                container('dind') {
                    sh '''
                        sleep 15
                        docker build -t $APP_NAME:$IMAGE_TAG .
                        docker images
                    '''
                }
            }
        }

        stage('Run Tests in Docker') {
            steps {
                container('dind') {
                    sh '''
                        # Running basic check (placeholder as no tests exist)
                        echo "Running tests..."
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    withCredentials([
                        string(credentialsId: 'sonar-token-2401029', variable: 'SONAR_TOKEN')
                    ]) {
                        sh '''
                            sonar-scanner \
                              -Dsonar.projectKey=$SONAR_PROJECT \
                              -Dsonar.host.url=$SONAR_HOST_URL \
                              -Dsonar.login=$SONAR_TOKEN \
                              -Dsonar.sources=.
                        '''
                    }
                }
            }
        }

        stage('Login to Docker Registry') {
            steps {
                container('dind') {
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'nexus-credentials',
                            usernameVariable: 'REG_USER',
                            passwordVariable: 'REG_PASS'
                        )
                    ]) {
                        sh '''
                            docker login $REGISTRY_URL -u $REG_USER -p $REG_PASS
                        '''
                    }
                }
            }
        }

        stage('Build - Tag - Push Image') {
            steps {
                container('dind') {
                    sh '''
                        docker tag $APP_NAME:$IMAGE_TAG \
                          $REGISTRY_URL/$REGISTRY_REPO/$APP_NAME:$IMAGE_TAG

                        docker push $REGISTRY_URL/$REGISTRY_REPO/$APP_NAME:$IMAGE_TAG
                        docker pull $REGISTRY_URL/$REGISTRY_REPO/$APP_NAME:$IMAGE_TAG
                        docker images
                    '''
                }
            }
        }

        stage('Deploy Application') {
            steps {
                container('kubectl') {
                    dir('k8s') {
                        sh '''
                            kubectl apply -f deployment.yaml
                            kubectl apply -f service.yaml
                            kubectl apply -f ingress.yaml
                            kubectl rollout status deployment/techfixer-deployment -n 2401029
                        '''
                    }
                }
            }
        }
    }
}
