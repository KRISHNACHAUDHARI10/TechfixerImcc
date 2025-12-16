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
                    sh '''
                        docker login $REGISTRY_URL -u admin -p Changeme@2025
                    '''
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
                            # 1. Apply Namespace first
                            kubectl apply -f namespace.yaml
                            
                            # 2. Create Image Pull Secret in the new namespace
                            kubectl create secret docker-registry nexus-secret \
                                --docker-server=$REGISTRY_URL \
                                --docker-username=admin \
                                --docker-password=Changeme@2025 \
                                --namespace=2401029 \
                                --dry-run=client -o yaml | kubectl apply -f -

                            # 3. Apply Resources
                            # Cleanup old resources to ensure clean recreation (Avoids PVC stuck in Terminating)
                            kubectl delete deployment techfixer-deployment -n 2401029 --ignore-not-found
                            kubectl delete pvc techfixer-pvc -n 2401029 --ignore-not-found
                            
                            kubectl apply -f pvc.yaml
                            kubectl apply -f deployment.yaml
                            kubectl apply -f service.yaml
                            kubectl apply -f ingress.yaml
                            
                            # 4. Wait for Rollout
                            if ! kubectl rollout status deployment/techfixer-deployment -n 2401029; then
                                echo "⚠️ Deployment Failed! Fetching Debug Info..."
                                kubectl get events -n 2401029 --sort-by='.lastTimestamp'
                                kubectl get pvc -n 2401029
                                kubectl get pods -n 2401029
                                kubectl describe pods -l app=techfixer -n 2401029
                                kubectl logs -l app=techfixer -n 2401029 --tail=50
                                exit 1
                            fi
                        '''
                    }
                }
            }
        }
    }
}
