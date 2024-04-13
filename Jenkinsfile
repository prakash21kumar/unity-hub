pipeline {
  agent {
    node {
      label 'Node'
    }

  }
  stages {
    stage('Install') {
      agent {
        node {
          label 'Node'
        }

      }
      steps {
        sh 'cd server && npm install && npm start'
        echo 'Installing '
      }
    }

  }
}