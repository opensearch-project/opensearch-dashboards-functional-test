/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */
// Fetch GitHub credentials using Jenkins' withCredentials step
def getCredentials() {
    try {
        withCredentials([usernamePassword(credentialsId: 'jenkins-github-bot-token', passwordVariable: 'GITHUB_TOKEN', usernameVariable: 'GITHUB_USER')]) { 
            env.REMOTE_GITHUB_TOKEN = sh(script: 'echo $GITHUB_TOKEN', returnStdout: true).trim()
        }
    } catch (Exception ex) {
        echo "Error: Unable to fetch GitHub token from Jenkins credentials. Message: ${ex.getMessage()}"
    }
}

getCredentials()
