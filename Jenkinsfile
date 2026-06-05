pipeline {
  agent any
  environment {
    AWS_REGION = 'ap-southeast-2'
    ECR_URI = '019511184889.dkr.ecr.ap-southeast-2.amazonaws.com/react-note'
    GITOPS_REPO = 'https://github.com/sk4cks/react-note-deploy.git'
    GITOPS_MANIFEST = 'react-note'
    VITE_BASE_API_URL = 'https://api.13.239.220.205.nip.io'
  }
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Docker Build & Push') {
      steps {
        sh '''
          apt-get update -qq && apt-get install -y -qq awscli docker.io >/dev/null 2>&1 || true
          aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${ECR_URI%/*}
          docker build --platform linux/amd64 \
            --build-arg VITE_BASE_API_URL=$VITE_BASE_API_URL \
            -t $ECR_URI:${BUILD_NUMBER} -t $ECR_URI:latest .
          docker push $ECR_URI:${BUILD_NUMBER}
          docker push $ECR_URI:latest
        '''
      }
    }
    stage('Update GitOps') {
      steps {
        dir('gitops') {
          git url: "${GITOPS_REPO}", branch: 'main', credentialsId: 'github-gitops'
          sh """
            sed -i 's|image: ${ECR_URI}:.*|image: ${ECR_URI}:${BUILD_NUMBER}|' k8s/${GITOPS_MANIFEST}.yaml
            git config user.email 'jenkins@local'
            git config user.name 'jenkins'
            git add k8s/${GITOPS_MANIFEST}.yaml
            git diff --cached --quiet || git commit -m 'ci(react-note): image ${BUILD_NUMBER}'
            git push origin main
          """
        }
      }
    }
  }
}
