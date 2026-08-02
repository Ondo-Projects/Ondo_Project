pipeline {
  agent any

  environment {
    APP_ROOT = '/opt/ondo'
    VITE_API_BASE = ''
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Backend') {
      steps {
        dir('BN') {
          sh './gradlew bootJar --no-daemon -x test'
        }
      }
    }

    stage('Build Frontend') {
      steps {
        dir('FN') {
          sh 'npm ci'
          sh 'VITE_API_BASE= npm run build'
        }
      }
    }

    stage('Deploy EC2') {
      steps {
        sh 'chmod +x BN/scripts/deploy-ec2.sh'
        sh './BN/scripts/deploy-ec2.sh'
      }
    }
  }

  post {
    success {
      echo 'Deploy succeeded.'
    }
    failure {
      echo 'Deploy failed — check console output and: sudo journalctl -u ondo-api -n 80'
    }
  }
}
