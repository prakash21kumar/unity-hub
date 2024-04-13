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
        sh 'npm install'
        echo 'Installing '
      }
    }

  }
}
