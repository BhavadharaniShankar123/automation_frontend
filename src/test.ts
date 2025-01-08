import * as vscode from 'vscode';
import axios from 'axios';
import { exec } from 'child_process';
import * as path from 'path';

// Logger function
function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

let currentPanel: vscode.WebviewPanel | undefined;

async function sendApiRequest(query: string, callback: (response: any) => void) {
  const apiUrl = 'http://10.190.226.6:8000/repository'; // Correct API endpoint

  try {
    // Sending POST request with the body containing "query": "hi"
    const response = await axios.post(apiUrl, {
      query: query
    });

    // Log the full response for debugging
    console.log('Full API Response:', response.data);

    // Check if response contains the expected structure
    if (response.data && response.data.action && response.data.name) {
      // If response has 'action' and 'name', pass it to the callback
      callback(response.data);

      // Run the Python script with the received name parameter
      runPythonScript(response.data.name);
    } else {
      // Handle case where expected data is not present in response
      callback({ action: 'Error', name: 'Invalid response structure' });
    }

  } catch (error) {
    log('Error making API request: ' + error);
    callback({ action: 'Error', name: 'Failed to fetch posts' });
  }
}

// Function to run the Python script and pass the 'name' as a parameter
function runPythonScript(name: string) {
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'script.py'); // This will resolve the path to 'test-automation/script.py'

  exec(`python3 ${scriptPath} ${name}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      return;
    }

    // Log the result from the Python script
    console.log('Python Script Output:', stdout);

    // Send the directory path to the WebView
    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `Python script output: ${stdout}`
    });
  });
}

export function activate(context: vscode.ExtensionContext) {
  log('Extension "test-automation" is now active!');

  const disposable = vscode.commands.registerCommand('test-automation.helloWorld', () => {
    log('Command "test-automation.helloWorld" executed');

    if (currentPanel) {
      currentPanel.reveal();
    } else {
      currentPanel = vscode.window.createWebviewPanel(
        'chatPanel',
        'Chat Panel',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      currentPanel.webview.html = getWebviewContent();

      // Handle messages from the WebView
      currentPanel.webview.onDidReceiveMessage(
        (message: { command: string; text: string }) => {
          log(`Webview sent: ${JSON.stringify(message)}`);

          if (message.command === 'sendMessage') {
            const userMessage = message.text.trim();

            if (userMessage !== '') {
              sendApiRequest(userMessage, (response) => {
                // currentPanel?.webview.postMessage({
                //   command: 'apiResponse',
                //   text: `Action: ${response.action}, Name: ${response.name}`
                // });
              });
            } else {
              log('Message is empty.');
            }
          }
        },
        undefined,
        context.subscriptions
      );

      currentPanel.onDidDispose(() => {
        log('WebView disposed.');
        currentPanel = undefined;
      });
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {
  log('Extension "test-automation" is now deactivated.');
}

function getWebviewContent(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chat Panel</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          background-color: #f9f9f9;
          border-bottom: 1px solid #ddd;
        }
        .input-container {
          display: flex;
          padding: 10px;
          background-color: #fff;
        }
        input[type="text"] {
          flex: 1;
          padding: 10px;
          font-size: 14px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        button {
          margin-left: 10px;
          padding: 10px;
          font-size: 14px;
          border: none;
          background-color: #007acc;
          color: #fff;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: #005f99;
        }
      </style>
    </head>
    <body>
      <div class="chat-container">
        <div class="messages" id="messages"></div>
        <div class="input-container">
          <input type="text" id="messageInput" placeholder="Type a message..." />
          <button id="sendButton">Send</button>
        </div>
      </div>
      <script>
        const vscode = acquireVsCodeApi();

        // Handle Send button click
        document.getElementById('sendButton')?.addEventListener('click', sendMessage);

        // Handle Enter key press
        document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') sendMessage();
        });

        function sendMessage() {
          const input = document.getElementById('messageInput');
          const message = input.value.trim();

          if (message !== '') {
            vscode.postMessage({ command: 'sendMessage', text: message });

            addMessageToChat('You', message, 'blue');
            input.value = '';
          }
        }

        // Handle messages from the extension
        window.addEventListener('message', (event) => {
          const message = event.data;

          if (message.command === 'apiResponse') {
            addMessageToChat('Server', message.text, 'green');
          } else if (message.command === 'apiError') {
            addMessageToChat('Error', message.text, 'red');
          }
        });

        function addMessageToChat(sender, text, color) {
          const messagesDiv = document.getElementById('messages');
          const messageElement = document.createElement('div');
          messageElement.textContent =  text;
          messageElement.style.color = color;
          messagesDiv.appendChild(messageElement);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
      </script>
    </body>
    </html>
  `;
}
