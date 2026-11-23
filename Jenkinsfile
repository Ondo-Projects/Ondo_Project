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
        // root 소유 사본만 sudo 허용 (BN/scripts/jenkins-ec2-setup.sh 로 설치)
        sh 'sudo /opt/ondo/bin/deploy-ec2.sh "$WORKSPACE"'
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
