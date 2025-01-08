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
var baseUrlPath: string = '';
let repositoryName: string = '';
let fileName: string = '';

async function sendApiRequest(query: string, callback: (response: any) => void) {
  const apiUrl = 'http://10.190.226.6:8000/repository';

  try {
    const response = await axios.post(apiUrl, { query });
    baseUrlPath = response.data.base_url;
    console.log('Full API Response:', response.data);

    // Handle different actions from the API
    if (response.data && response.data.action === 'install_extensions') {
      const requiredExtensions = response.data.required_extensions;
      runInstallExtensionsScript(requiredExtensions);
    } else if (response.data && response.data.action === 'check_internet') {
   
      check_internet(response.data);
    }  else if (response.data && response.data.action === 'list_branches') {
      // Ask for repository name to list branches
      currentPanel?.webview.postMessage({
        command: 'askRepositoryNameBranch',
        text: 'Enter the repository name to list branches:'
      });
    } else if (response.data && response.data.action === 'clone') {
      // Ask for repository name to clone
      currentPanel?.webview.postMessage({
        command: 'askRepositoryNameClone',
        text: 'Enter the repository name to clone:'
      });
    } else if (response.data && response.data.action === 'open_file') {
      // Ask for repository name first
      currentPanel?.webview.postMessage({
        command: 'askRepositoryName',
        text: 'Enter the repository name to open the file:'
      });
    } else {
      callback(response.data);
    }
  } catch (error) {
    log('Error making API request: ' + error);
    callback({ action: 'Error', name: 'Failed to fetch posts' });
  }
}


function check_internet(requiredExtensions: string[]) {
 
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'check_internet.py');
  

  exec(`python3 ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      return;
    }

    console.log('Python Script Output:', stdout);

    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `\n${stdout}`
    });
  });
}


function runInstallExtensionsScript(requiredExtensions: string[]) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'install_extension.py');
  
  const extensionsArg = requiredExtensions.join(' ');

  exec(`python3 ${scriptPath} ${extensionsArg}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      return;
    }

    console.log('Python Script Output:', stdout);

    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `Extensions installed successfully:\n${stdout}`
    });
  });
}

function runOpenFileScript(repositoryName: string, fileName: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const activeFolderPath = workspaceFolders[0].uri.fsPath;
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'open_file.py');

  exec(`python3 ${scriptPath} ${repositoryName} ${baseUrlPath} ${fileName} ${activeFolderPath}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      return;
    }

    console.log('Python Script Output:', stdout);

    if (stdout.includes('not found')) {
      // Ask the user if they want to create the file
      currentPanel?.webview.postMessage({
        command: 'askCreateFile',
        text: `File '${fileName}' not found in repository '${repositoryName}'. Do you want to create it? (yes/no)`
      });
    } else {
      currentPanel?.webview.postMessage({
        command: 'apiResponse',
        text: ``
      });
    }
  });
}

function runCreateFileScript(repositoryName: string, fileName: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const activeFolderPath = path.join(workspaceFolders[0].uri.fsPath, repositoryName);
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'create_file.py');
  console.log("three",scriptPath,repositoryName,baseUrlPath,fileName,activeFolderPath)

  exec(`python3 ${scriptPath} ${repositoryName} ${baseUrlPath} ${fileName} ${activeFolderPath}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      return;
    }

    console.log('Python Script Output:', stdout);

    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `File '${fileName}' created successfully.`
    });
  });
}

function runPythonScript(repositoryName: string, baseUrl: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const activeFolderPath = workspaceFolders[0].uri.fsPath;
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'clone.py');

  exec(`python3 ${scriptPath} ${repositoryName} ${baseUrl} ${activeFolderPath}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      return;
    }

    console.log('Python Script Output:', stdout);

    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `Repository cloned successfully: ${stdout}`
    });
  });
}

function runPythonScriptBranch(repositoryName: string, baseUrl: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const activeFolderPath = workspaceFolders[0].uri.fsPath;
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'list_branches.py');

  exec(`python3 ${scriptPath} ${repositoryName} ${baseUrl} ${activeFolderPath}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      return;
    }

    console.log('Python Script Output:', stdout);

    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `Branches in the repository:\n${stdout}`
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

      currentPanel.webview.onDidReceiveMessage(
        async (message: { command: string; text: string }) => {
          log(`Webview sent: ${JSON.stringify(message)}`);

          if (message.command === 'sendMessage') {
            const userMessage = message.text.trim();
            if (userMessage !== '') {
              sendApiRequest(userMessage, (response) => {
                if (response.action === 'install_extensions') {
                  currentPanel?.webview.postMessage({
                    command: 'apiResponse',
                    text: 'Installing extensions...'
                  });
                } else if (response.action === 'list_branches') {
                  currentPanel?.webview.postMessage({
                    command: 'askRepositoryNameBranch',
                    text: 'Enter the repository name to list branches:'
                  });
                } else if (response.action === 'clone') {
                  currentPanel?.webview.postMessage({
                    command: 'askRepositoryNameClone',
                    text: 'Enter the repository name to clone:'
                  });
                } else if (response.action === 'open_file') {
                  currentPanel?.webview.postMessage({
                    command: 'askRepositoryName',
                    text: 'Enter the repository name to open the file:'
                  });
                }
              });
            } else {
              log('Message is empty.');
            }
          } else if (message.command === 'repositoryName') {
            repositoryName = message.text.trim();
            // Proceed to the next action if repository name is set
            currentPanel?.webview.postMessage({
              command: 'askFileName',
              text: 'Enter the file name to open:'
            });
          } else if (message.command === 'fileName') {
            console.log("two")
            fileName = message.text.trim();
            runOpenFileScript(repositoryName, fileName);
          } else if (message.command === 'repositoryNameBranch') {
            const repositoryName = message.text.trim();
            const baseUrl = 'https://github.com/ratnamGT';
            runPythonScriptBranch(repositoryName, baseUrl);
          } else if (message.command === 'repositoryNameClone') {
            const repositoryName = message.text.trim();
            const baseUrl = 'https://github.com/ratnamGT';
            runPythonScript(repositoryName, baseUrl);
          } else if (message.command === 'createFile' && message.text.trim().toLowerCase() === 'yes') {
            // Use the previously entered repository name and file name
            runCreateFileScript(repositoryName, fileName);
          
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
          background-color: #000;
          color: #fff;
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
          padding: 20px;
          background-color: #222;
          border-bottom: 1px solid #444;
        }
        .input-container {
          display: flex;
          padding: 10px;
          background-color: #111;
        }
        input[type="text"] {
          flex: 1;
          padding: 10px;
          font-size: 14px;
          border: 1px solid #444;
          border-radius: 4px;
          background-color: #333;
          color: #fff;
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
        .message {
          margin-bottom: 10px;
          padding: 8px 12px;
          border-radius: 4px;
        }
        .user {
          background-color: #444;
          color: #00ff00;
        }
        .server {
          background-color: #555;
          color: #00bfff;
        }
        .error {
          background-color: #d9534f;
          color: #fff;
        }
        .follow-up {
          background-color: #666;
          color: #ff9900;
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

        document.getElementById('sendButton')?.addEventListener('click', sendMessage);
        document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') sendMessage();
        });

        let currentCommand = null;

        function sendMessage() {
          const input = document.getElementById('messageInput');
          const message = input.value.trim();

          if (message !== '') {
            vscode.postMessage({
              command: currentCommand || 'sendMessage',
              text: message
            });

            addMessageToChat('You', message, 'user');
            input.value = '';
            currentCommand = null;
          }
        }

        window.addEventListener('message', (event) => {
          const message = event.data;
          
          if (message.command === 'apiResponse') {
            addMessageToChat('Server', message.text, 'server');
          } else if (message.command === 'apiError') {
            addMessageToChat('Error', message.text, 'error');
          } else if (message.command === 'askRepositoryName') {
            currentCommand = 'repositoryName';
            addMessageToChat('Server', message.text, 'follow-up');
          } else if (message.command === 'askFileName') {
            currentCommand = 'fileName';
            addMessageToChat('Server', message.text, 'follow-up');
          } else if (message.command === 'askRepositoryNameClone') {
            currentCommand = 'repositoryNameClone';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'askRepositoryNameBranch') {
            currentCommand = 'repositoryNameBranch';
            addMessageToChat('Server', message.text, 'follow-up');
          } else if (message.command === 'askCreateFile') {
            currentCommand = 'createFile';
            addMessageToChat('Server', message.text, 'follow-up');
          }
        });

        function addMessageToChat(sender, text, type) {
          const messagesDiv = document.getElementById('messages');
          const messageElement = document.createElement('div');
          messageElement.classList.add('message', type);
          messageElement.innerHTML = text;
          messagesDiv.appendChild(messageElement);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
      </script>
    </body>
    </html>
  `;
}


// import * as vscode from 'vscode';
// import axios from 'axios';
// import { exec } from 'child_process';
// import * as path from 'path';

// // Logger function
// function log(message: string) {
//   const timestamp = new Date().toISOString();
//   console.log(`[${timestamp}] ${message}`);
// }

// let currentPanel: vscode.WebviewPanel | undefined;
// var baseUrlPath: string = '';
// let repositoryName: string = '';
// let fileName: string = '';

// async function sendApiRequest(query: string, callback: (response: any) => void) {
//   const apiUrl = 'http://10.190.226.6:8000/repository';

//   try {
//     const response = await axios.post(apiUrl, { query });
//     baseUrlPath = response.data.base_url;
//     console.log('Full API Response:', response.data);

//     // Handle different actions from the API
//     if (response.data && response.data.action === 'install_extensions') {
//       const requiredExtensions = response.data.required_extensions;
//       runInstallExtensionsScript(requiredExtensions);
//     } else if (response.data && response.data.action === 'check_internet') {
   
//       check_internet(response.data);
//     } 
    
//     else if (response.data && response.data.action === 'list_branches') {
//       // Ask for repository name to list branches
//       currentPanel?.webview.postMessage({
//         command: 'askRepositoryNameBranch',
//         text: 'Enter the repository name to list branches:'
//       });
//     } else if (response.data && response.data.action === 'clone') {
//       currentPanel?.webview.postMessage({
//         command: 'askRepositoryNameClone',
//         text: 'Enter the repository name to clone:'
//       });
//     } else if (response.data && response.data.action === 'open_file') {
//       // Ask for repository name first
//       currentPanel?.webview.postMessage({
//         command: 'askRepositoryName',
//         text: 'Enter the repository name to open the file:'
//       });
//     } else {
//       callback(response.data);
//     }
//   } catch (error) {
//     log('Error making API request: ' + error);
//     callback({ action: 'Error', name: 'Failed to fetch posts' });
//   }
// }

// function runInstallExtensionsScript(requiredExtensions: string[]) {
//   const workspaceFolders = vscode.workspace.workspaceFolders;
//   if (!workspaceFolders || workspaceFolders.length === 0) {
//     log('No workspace folder is open.');
//     return;
//   }

//   const projectFolderPath = path.dirname(__dirname);
//   const scriptPath = path.resolve(projectFolderPath, 'install_extension.py');
  
//   const extensionsArg = requiredExtensions.join(' ');

//   exec(`python3 ${scriptPath} ${extensionsArg}`, (error, stdout, stderr) => {
//     if (error) {
//       log(`Error executing Python script: ${error.message}`);
//       return;
//     }

//     if (stderr) {
//       log(`Python stderr: ${stderr}`);
//       return;
//     }

//     console.log('Python Script Output:', stdout);

//     currentPanel?.webview.postMessage({
//       command: 'apiResponse',
//       text: `Extensions installed successfully:\n${stdout}`
//     });
//   });
// }
// function check_internet(requiredExtensions: string[]) {
 
//   const projectFolderPath = path.dirname(__dirname);
//   const scriptPath = path.resolve(projectFolderPath, 'check_internet.py');
  

//   exec(`python3 ${scriptPath}`, (error, stdout, stderr) => {
//     if (error) {
//       log(`Error executing Python script: ${error.message}`);
//       return;
//     }

//     if (stderr) {
//       log(`Python stderr: ${stderr}`);
//       return;
//     }

//     console.log('Python Script Output:', stdout);

//     currentPanel?.webview.postMessage({
//       command: 'apiResponse',
//       text: `\n${stdout}`
//     });
//   });
// }

// function runPythonScriptBranch(repositoryName: string, baseUrl: string) {
//   const workspaceFolders = vscode.workspace.workspaceFolders;
//   if (!workspaceFolders || workspaceFolders.length === 0) {
//     log('No workspace folder is open.');
//     return;
//   }

//   const activeFolderPath = workspaceFolders[0].uri.fsPath;
//   const projectFolderPath = path.dirname(__dirname);
//   const scriptPath = path.resolve(projectFolderPath, 'list_auto.py');

//   exec(`python3 ${scriptPath} ${repositoryName} ${activeFolderPath}`, (error, stdout, stderr) => {
//     if (error) {
//       log(`Error executing Python script: ${error.message}`);
//       return;
//     }

//     if (stderr) {
//       log(`Python stderr: ${stderr}`);
//       return;
//     }

//     console.log('Python Script Output:', stdout);

//     currentPanel?.webview.postMessage({
//       command: 'apiResponse',
//       text: `Available branches:<br>${stdout}`
//     });
//   });
// }

// function runPythonScript(repositoryName: string, baseUrl: string) {
//   const workspaceFolders = vscode.workspace.workspaceFolders;
//   if (!workspaceFolders || workspaceFolders.length === 0) {
//     log('No workspace folder is open.');
//     return;
//   }

//   const activeFolderPath = workspaceFolders[0].uri.fsPath;
//   const projectFolderPath = path.dirname(__dirname);
//   const scriptPath = path.resolve(projectFolderPath, 'script.py');

//   exec(`python3 ${scriptPath} ${repositoryName} ${baseUrlPath} ${activeFolderPath}`, (error, stdout, stderr) => {
//     if (error) {
//       log(`Error executing Python script: ${error.message}`);
//       return;
//     }

//     if (stderr) {
//       log(`Python stderr: ${stderr}`);
//       return;
//     }

//     currentPanel?.webview.postMessage({
//       command: 'apiResponse',
//       text: `${stdout}`
//     });
//   });
// }

// function runOpenFileScript(repositoryName: string, fileName: string) {
//   const workspaceFolders = vscode.workspace.workspaceFolders;
//   if (!workspaceFolders || workspaceFolders.length === 0) {
//     log('No workspace folder is open.');
//     return;
//   }

//   const activeFolderPath = workspaceFolders[0].uri.fsPath;
//   const projectFolderPath = path.dirname(__dirname);
//   const scriptPath = path.resolve(projectFolderPath, 'open_file.py');

//   exec(`python3 ${scriptPath} ${repositoryName} ${baseUrlPath} ${fileName} ${activeFolderPath}`, (error, stdout, stderr) => {
//     if (error) {
//       log(`Error executing Python script: ${error.message}`);
//       return;
//     }

//     if (stderr) {
//       log(`Python stderr: ${stderr}`);
//       return;
//     }

//     console.log('Python Script Output:', stdout);

//     currentPanel?.webview.postMessage({
//       command: 'apiResponse',
//       text: `${stdout}`
//     });
//   });
// }

// export function activate(context: vscode.ExtensionContext) {
//   log('Extension "test-automation" is now active!');

//   const disposable = vscode.commands.registerCommand('test-automation.helloWorld', () => {
//     log('Command "test-automation.helloWorld" executed');

//     if (currentPanel) {
//       currentPanel.reveal();
//     } else {
//       currentPanel = vscode.window.createWebviewPanel(
//         'chatPanel',
//         'Chat Panel',
//         vscode.ViewColumn.One,
//         { enableScripts: true }
//       );

//       currentPanel.webview.html = getWebviewContent();

//       currentPanel.webview.onDidReceiveMessage(
//         async (message: { command: string; text: string }) => {
//           log(`Webview sent: ${JSON.stringify(message)}`);

//           if (message.command === 'sendMessage') {
//             const userMessage = message.text.trim();
//             if (userMessage !== '') {
//               sendApiRequest(userMessage, (response) => {
//                 if (response.action === 'install_extensions') {
//                   currentPanel?.webview.postMessage({
//                     command: 'apiResponse',
//                     text: 'Installing extensions...'
//                   });
//                 } else if (response.action === 'list_branches') {
//                   currentPanel?.webview.postMessage({
//                     command: 'askRepositoryNameBranch',
//                     text: 'Enter the repository name to list branches:'
//                   });
//                 } else if (response.action === 'clone') {
//                   currentPanel?.webview.postMessage({
//                     command: 'askRepositoryNameClone',
//                     text: 'Enter the repository name to clone:'
//                   });
//                 } else if (response.action === 'open_file') {
//                   currentPanel?.webview.postMessage({
//                     command: 'askRepositoryName',
//                     text: 'Enter the repository name to open the file:'
//                   });
//                 }
//               });
//             } else {
//               log('Message is empty.');
//             }
//           } else if (message.command === 'repositoryName') {
//             repositoryName = message.text.trim();
//             // Proceed to the next action if repository name is set
//             currentPanel?.webview.postMessage({
//               command: 'askFileName',
//               text: 'Enter the file name to open:'
//             });
//           } else if (message.command === 'fileName') {
//             fileName = message.text.trim();
//             runOpenFileScript(repositoryName, fileName);
//           } else if (message.command === 'repositoryNameBranch') {
//             const repositoryName = message.text.trim();
//             const baseUrl = 'https://github.com/ratnamGT';
//             runPythonScriptBranch(repositoryName, baseUrl);
//           } else if (message.command === 'repositoryNameClone') {
//             const repositoryName = message.text.trim();
//             const baseUrl = 'https://github.com/ratnamGT';
//             runPythonScript(repositoryName, baseUrl);
//           } 
//         },
//         undefined,
//         context.subscriptions
//       );

//       currentPanel.onDidDispose(() => {
//         log('WebView disposed.');
//         currentPanel = undefined;
//       });
//     }
//   });

//   context.subscriptions.push(disposable);
// }

// export function deactivate() {
//   log('Extension "test-automation" is now deactivated.');
// }

// function getWebviewContent(): string {
//   return `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Chat Panel</title>
//       <style>
//         body {
//           font-family: Arial, sans-serif;
//           background-color: #000;
//           color: #fff;
//           margin: 0;
//           padding: 0;
//           display: flex;
//           flex-direction: column;
//           height: 100vh;
//         }
//         .chat-container {
//           flex: 1;
//           display: flex;
//           flex-direction: column;
//           overflow: hidden;
//         }
//         .messages {
//           flex: 1;
//           overflow-y: auto;
//           padding: 20px;
//           background-color: #222;
//           border-bottom: 1px solid #444;
//         }
//         .input-container {
//           display: flex;
//           padding: 10px;
//           background-color: #111;
//         }
//         input[type="text"] {
//           flex: 1;
//           padding: 10px;
//           font-size: 14px;
//           border: 1px solid #444;
//           border-radius: 4px;
//           background-color: #333;
//           color: #fff;
//         }
//         button {
//           margin-left: 10px;
//           padding: 10px;
//           font-size: 14px;
//           border: none;
//           background-color: #007acc;
//           color: #fff;
//           border-radius: 4px;
//           cursor: pointer;
//         }
//         button:hover {
//           background-color: #005f99;
//         }
//         .message {
//           margin-bottom: 10px;
//           padding: 8px 12px;
//           border-radius: 4px;
//         }
//         .user {
//           background-color: #444;
//           color: #00ff00;
//         }
//         .server {
//           background-color: #555;
//           color: #00bfff;
//         }
//         .error {
//           background-color: #d9534f;
//           color: #fff;
//         }
//         .follow-up {
//           background-color: #666;
//           color: #ff9900;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="chat-container">
//         <div class="messages" id="messages"></div>
//         <div class="input-container">
//           <input type="text" id="messageInput" placeholder="Type a message..." />
//           <button id="sendButton">Send</button>
//         </div>
//       </div>
//       <script>
//         const vscode = acquireVsCodeApi();

//         document.getElementById('sendButton')?.addEventListener('click', sendMessage);
//         document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
//           if (e.key === 'Enter') sendMessage();
//         });

//         let currentCommand = null;

//         function sendMessage() {
//           const input = document.getElementById('messageInput');
//           const message = input.value.trim();

//           if (message !== '') {
//             vscode.postMessage({
//               command: currentCommand || 'sendMessage',
//               text: message
//             });

//             addMessageToChat('You', message, 'user');
//             input.value = '';
//             currentCommand = null;
//           }
//         }

//        window.addEventListener('message', (event) => {
//   const message = event.data;
  
//   if (message.command === 'apiResponse') {
//     addMessageToChat('Server', message.text, 'server');
//   } else if (message.command === 'apiError') {
//     addMessageToChat('Error', message.text, 'error');
//   } else if (message.command === 'askRepositoryName') {
//     currentCommand = 'repositoryName';
//     addMessageToChat('Server', message.text, 'follow-up');
//   } else if (message.command === 'askFileName') {
//     currentCommand = 'fileName';
//     addMessageToChat('Server', message.text, 'follow-up');
//   } else if (message.command === 'askRepositoryNameClone') {
//     currentCommand = 'repositoryNameClone';
//     addMessageToChat('Server', message.text, 'follow-up');
//   }
//     else if (message.command === 'askRepositoryNameBranch') {
//     currentCommand = 'repositoryNameBranch';
//     addMessageToChat('Server', message.text, 'follow-up');
//   }
// });


//         function addMessageToChat(sender, text, type) {
//           const messagesDiv = document.getElementById('messages');
//           const messageElement = document.createElement('div');
//           messageElement.classList.add('message', type);
//           messageElement.innerHTML = text;
//           messagesDiv.appendChild(messageElement);
//           messagesDiv.scrollTop = messagesDiv.scrollHeight;
//         }
//       </script>
//     </body>
//     </html>
//   `;
// }

