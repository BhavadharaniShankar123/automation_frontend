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
let branchName: string = '';
let branchlist: string = '';
let username: string = '';
let password: string = '';
let hlq: string = '';
let ipars: string = '';
let iparsvalue: string = '';

let gmsmf: string = '';
let gmsstest: string = '';


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
    }else if (response.data && response.data.action === 'lpar_list') {
      gmsmf = response.data.ssh_config.gmsmf;
      gmsstest = response.data.ssh_config.gmsstest;
      currentPanel?.webview.postMessage({
        command: 'askRepositoryNameMainFrame',
        text: 'Enter the repository name:'
      });
    }
    else if (response.data && response.data.action === 'commit_changes') {
      // Ask for repository, file, and commit message
      currentPanel?.webview.postMessage({
        command: 'askCommitDetails',
        text: 'Enter the commit message:'
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
  const activeFolderPath = workspaceFolders[0].uri.fsPath;
  const scriptPath = path.resolve(projectFolderPath, 'install_extension.py');
  
  const extensionsArg = requiredExtensions.join(' ');

  exec(`python3 ${scriptPath} ${extensionsArg} ${activeFolderPath}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      currentPanel?.webview.postMessage({
        command: 'apiResponse',
        text: `\n${stderr}`
      });
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

  exec(`python3 ${scriptPath} ${repositoryName} ${baseUrlPath} ${activeFolderPath}`, (error, stdout, stderr) => {
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

  exec(`python3 ${scriptPath} ${repositoryName} ${baseUrlPath} ${activeFolderPath}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      return;
    }

    console.log('Python Script Output:', stdout);
    branchlist=stdout;
    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `Branches in the repository:\n${stdout}`
    });
    currentPanel?.webview.postMessage({
      command: 'askNewExisting',
      text: 'Do you want to checkout branch:(new/existing)'
    });
  });
}
function runCommitScript(fileName: string, commitMessage: string, baseUrl: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const activeFolderPath = path.join(workspaceFolders[0].uri.fsPath, repositoryName);
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'commit_changes.py');
  console.log("respo name",activeFolderPath)
  exec(`python3 ${scriptPath} ${activeFolderPath} ${baseUrlPath} ${fileName} "${commitMessage}"`, (error, stdout, stderr) => {
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
      text: `Changes to '${fileName}' committed and pushed successfully.`
    });
  });
}

function runCheckoutScript() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const activeFolderPath = path.join(workspaceFolders[0].uri.fsPath, repositoryName);
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'checkout_branch.py');
  console.log("respo name",activeFolderPath)
  exec(`python3 ${scriptPath} ${activeFolderPath} ${baseUrlPath} ${branchName}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      currentPanel?.webview.postMessage({
        command: 'apiResponse',
        text: `${stderr}`
      });
      return;
    }

    console.log('Python Script Output:', stdout);

    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `${stdout}`
    });
  });
}

function runCheckoutNewScript() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const activeFolderPath = path.join(workspaceFolders[0].uri.fsPath, repositoryName);
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'newcheckout_branch.py');
  console.log("respo name",activeFolderPath)
  exec(`python3 ${scriptPath} ${activeFolderPath} ${baseUrlPath} ${branchName}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      currentPanel?.webview.postMessage({
        command: 'apiResponse',
        text: `${stderr}`
      });
      return;
    }

    console.log('Python Script Output:', stdout);

    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `${stdout}`
    });
  });
}


function runMainframeScript() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const activeFolderPath = path.join(workspaceFolders[0].uri.fsPath, repositoryName);
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'lpar_mainframe.py');
  console.log("respo name",activeFolderPath)
  exec(`python3 ${scriptPath} ${activeFolderPath} ${baseUrlPath} ${username} ${password} ${hlq} ${fileName} ${iparsvalue}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      currentPanel?.webview.postMessage({
        command: 'apiResponse',
        text: `${stderr}`
      });
      return;
    }

    console.log('Python Script Output:', stdout);

    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `${stdout}`
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
                }else if (response.action === 'commit_changes') {
                  currentPanel?.webview.postMessage({
                    command: 'askCommitDetails',
                    text: 'Enter the commit message:'
                  });
                }else if (response.action === 'lpar_list') {
                  // Ask for repository name first
                  currentPanel?.webview.postMessage({
                    command: 'askRepositoryNameMainFrame',
                    text: 'Enter the repository name:'
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
             repositoryName = message.text.trim();
            const baseUrl = 'https://github.com/gmsadmin-git';
            runPythonScriptBranch(repositoryName, baseUrl);
           
          } else if (message.command === 'repositoryNameClone') {
            const repositoryName = message.text.trim();
            const baseUrl = 'https://github.com/gmsadmin-git';
            runPythonScript(repositoryName, baseUrl);
          } else if (message.command === 'createFile' && message.text.trim().toLowerCase() === 'yes') {
            // Use the previously entered repository name and file name
            runCreateFileScript(repositoryName, fileName);
          
          }else if (message.command === 'commitChanges') {
            const commitMsg = message.text.trim();
            const baseUrl = 'https://github.com/gmsadmin-git';
            runCommitScript(fileName, commitMsg, baseUrl);
          } else if (message.command === 'newExisting') {
           const newExisting = message.text.trim();
           if(newExisting.toLowerCase()=='new'){
            currentPanel?.webview.postMessage({
              command: 'askNewBranchName',
              text: 'Enter the new branch name to checkout:'
            });
           }else{
            currentPanel?.webview.postMessage({
              command: 'askExistingBranchName',
              text: 'Enter the branch name to checkout:'
            });
           }
          }else if (message.command === 'newBranchName') {
            branchName = message.text.trim();
            runCheckoutNewScript();
          }else if (message.command === 'existingBranchName') {
            branchName = message.text.trim();
            runCheckoutScript();
          }
      
          else if (message.command === 'repositoryNameMainFrame') {
            repositoryName = message.text.trim();
            currentPanel?.webview.postMessage({
              command: 'askFileNameMainframe',
              text: 'Enter the file name:'
            });
          
          } else if (message.command === 'fileNameMainframe') {
            fileName = message.text.trim();
            // Proceed to the next action if repository name is set
            currentPanel?.webview.postMessage({
              command: 'askMainframeUsername',
              text: 'Enter the username:'
            });
          }  else if (message.command === 'mainframeUsername') {
            username = message.text.trim();
            currentPanel?.webview.postMessage({
              command: 'askMainframePassword',
              text: 'Enter the password:'
            });
          }else if (message.command === 'mainframePassword') {
            password = message.text.trim();
            currentPanel?.webview.postMessage({
              command: 'askMainframehlq',
              text: 'Enter the Hlq:'
            });
          }else if (message.command === 'mainframehlq') {
            hlq= message.text.trim();
            currentPanel?.webview.postMessage({
              command: 'askMainframegmsmfgmsstest',
              text: 'Enter the lpars:(gmsmf/ gmsstest): '
            });
          }else if (message.command === 'mainframegmsmfgmsstest') {
            ipars= message.text.trim();
            if (ipars.toLowerCase() === 'gmsmf') {
              iparsvalue = `'{"gmsmf":${JSON.stringify(gmsmf)}}'`;
          } else {
              iparsvalue = `'{"gmsstest":${JSON.stringify(gmsstest)}}'`;
          }
          console.log('result', iparsvalue);
          
           
            runMainframeScript()
           
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
          }else if (message.command === 'askCommitDetails') {
            currentCommand = 'commitChanges';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'askNewExisting') {
            currentCommand = 'newExisting';
            addMessageToChat('Server', message.text, 'follow-up');
          } else if (message.command === 'askNewBranchName') {
            currentCommand = 'newBranchName';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'askExistingBranchName') {
            currentCommand = 'existingBranchName';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'askRepositoryNameMainFrame') {
            currentCommand = 'repositoryNameMainFrame';
            addMessageToChat('Server', message.text, 'follow-up');
          }
             else if (message.command === 'askFileNameMainframe') {
            currentCommand = 'fileNameMainframe';
            addMessageToChat('Server', message.text, 'follow-up');
          }
          else if (message.command === 'askMainframeUsername') {
            currentCommand = 'mainframeUsername';
            addMessageToChat('Server', message.text, 'follow-up');
          }
            
          else if (message.command === 'askMainframePassword') {
            currentCommand = 'mainframePassword';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'askMainframehlq') {
            currentCommand = 'mainframehlq';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'askMainframegmsmfgmsstest') {
            currentCommand = 'mainframegmsmfgmsstest';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'askMainframegmsmfgmsstestvalue') {
            currentCommand = 'mainframegmsmfgmsstestvalue';
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


/*
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
let branchName: string = '';
let branchlist: string = '';
let username: string = '';
let password: string = '';
let hlq: string = '';
let ipars: string = '';
let iparsvalue: string = '';

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
    }else if (response.data && response.data.action === 'lpar_list') {
      // Ask for repository name first
      currentPanel?.webview.postMessage({
        command: 'askRepositoryNameMainFrame',
        text: 'Enter the repository name:'
      });
    }
    else if (response.data && response.data.action === 'commit_changes') {
      // Ask for repository, file, and commit message
      currentPanel?.webview.postMessage({
        command: 'askCommitDetails',
        text: 'Enter the commit message:'
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
  const activeFolderPath = workspaceFolders[0].uri.fsPath;
  console.log(activeFolderPath);
  const scriptPath = path.resolve(projectFolderPath, 'install_extension.py');
  
  const extensionsArg = requiredExtensions.join(' ');

  exec(`python3 ${scriptPath} ${extensionsArg} ${activeFolderPath}`, (error, stdout, stderr) => {
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

  exec(`python3 ${scriptPath} ${repositoryName} ${baseUrlPath} ${activeFolderPath}`, (error, stdout, stderr) => {
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

  exec(`python3 ${scriptPath} ${repositoryName} ${baseUrlPath} ${activeFolderPath}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      return;
    }

    console.log('Python Script Output:', stdout);
    branchlist=stdout;
    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `Branches in the repository:\n${stdout}`
    });
    currentPanel?.webview.postMessage({
      command: 'askNewExisting',
      text: 'Do you want to checkout branch:(new/existing)'
    });
  });
}
function runCommitScript(fileName: string, commitMessage: string, baseUrl: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const activeFolderPath = path.join(workspaceFolders[0].uri.fsPath, repositoryName);
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'commit_changes.py');
  console.log("respo name",activeFolderPath)
  exec(`python3 ${scriptPath} ${activeFolderPath} ${baseUrlPath} ${fileName} "${commitMessage}"`, (error, stdout, stderr) => {
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
      text: `Changes to '${fileName}' committed and pushed successfully.`
    });
  });
}

function runCheckoutScript() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const activeFolderPath = path.join(workspaceFolders[0].uri.fsPath, repositoryName);
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'checkout_branch.py');
  console.log("respo name",activeFolderPath)
  exec(`python3 ${scriptPath} ${activeFolderPath} ${baseUrlPath} ${branchName}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      currentPanel?.webview.postMessage({
        command: 'apiResponse',
        text: `${stderr}`
      });
      return;
    }

    console.log('Python Script Output:', stdout);

    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `${stdout}`
    });
  });
}

function runCheckoutNewScript() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const activeFolderPath = path.join(workspaceFolders[0].uri.fsPath, repositoryName);
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'newcheckout_branch.py');
  console.log("respo name",activeFolderPath)
  exec(`python3 ${scriptPath} ${activeFolderPath} ${baseUrlPath} ${branchName}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      currentPanel?.webview.postMessage({
        command: 'apiResponse',
        text: `${stderr}`
      });
      return;
    }

    console.log('Python Script Output:', stdout);

    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `${stdout}`
    });
  });
}


function runMainframeScript() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const activeFolderPath = path.join(workspaceFolders[0].uri.fsPath, repositoryName);
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'lpar_mainframe.py');
  console.log("respo name",activeFolderPath)
  exec(`python3 ${scriptPath} ${activeFolderPath} ${baseUrlPath} ${username} ${password} ${hlq} ${fileName} ${iparsvalue}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      currentPanel?.webview.postMessage({
        command: 'apiResponse',
        text: `${stderr}`
      });
      return;
    }

    console.log('Python Script Output:', stdout);

    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `${stdout}`
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
                }else if (response.action === 'commit_changes') {
                  currentPanel?.webview.postMessage({
                    command: 'askCommitDetails',
                    text: 'Enter the commit message:'
                  });
                }else if (response.action === 'lpar_list') {
                  // Ask for repository name first
                  currentPanel?.webview.postMessage({
                    command: 'askRepositoryNameMainFrame',
                    text: 'Enter the repository name:'
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
             repositoryName = message.text.trim();
            const baseUrl = 'https://github.com/gmsadmin-git';
            runPythonScriptBranch(repositoryName, baseUrl);
           
          } else if (message.command === 'repositoryNameClone') {
            const repositoryName = message.text.trim();
            const baseUrl = 'https://github.com/gmsadmin-git';
            runPythonScript(repositoryName, baseUrl);
          } else if (message.command === 'createFile' && message.text.trim().toLowerCase() === 'yes') {
            // Use the previously entered repository name and file name
            runCreateFileScript(repositoryName, fileName);
          
          }else if (message.command === 'commitChanges') {
            const commitMsg = message.text.trim();
            const baseUrl = 'https://github.com/gmsadmin-git';
            runCommitScript(fileName, commitMsg, baseUrl);
          } else if (message.command === 'newExisting') {
           const newExisting = message.text.trim();
           if(newExisting.toLowerCase()=='new'){
            currentPanel?.webview.postMessage({
              command: 'askNewBranchName',
              text: 'Enter the new branch name to checkout:'
            });
           }else{
            currentPanel?.webview.postMessage({
              command: 'askExistingBranchName',
              text: 'Enter the branch name to checkout:'
            });
           }
          }else if (message.command === 'newBranchName') {
            branchName = message.text.trim();
            runCheckoutNewScript();
          }else if (message.command === 'existingBranchName') {
            branchName = message.text.trim();
            runCheckoutScript();
          }
      
          else if (message.command === 'repositoryNameMainFrame') {
            repositoryName = message.text.trim();
            currentPanel?.webview.postMessage({
              command: 'askFileNameMainframe',
              text: 'Enter the file name:'
            });
          
          } else if (message.command === 'fileNameMainframe') {
            fileName = message.text.trim();
            // Proceed to the next action if repository name is set
            currentPanel?.webview.postMessage({
              command: 'askMainframeUsername',
              text: 'Enter the username:'
            });
          }  else if (message.command === 'mainframeUsername') {
            username = message.text.trim();
            currentPanel?.webview.postMessage({
              command: 'askMainframePassword',
              text: 'Enter the password:'
            });
          }else if (message.command === 'mainframePassword') {
            password = message.text.trim();
            currentPanel?.webview.postMessage({
              command: 'askMainframehlq',
              text: 'Enter the Hlq:'
            });
          }else if (message.command === 'mainframehlq') {
            hlq= message.text.trim();
            currentPanel?.webview.postMessage({
              command: 'askMainframegmsmfgmsstest',
              text: 'Enter the lpars:(gmsmf/ gmsstest): '
            });
          }else if (message.command === 'mainframegmsmfgmsstest') {
            ipars= message.text.trim();
            if(ipars.toLowerCase()=='gmsmf'){
              currentPanel?.webview.postMessage({
                command: 'askMainframegmsmfgmsstestvalue',
                text: 'Enter the gmsmf: '
              });
            }else{
              currentPanel?.webview.postMessage({
                command: 'askMainframegmsmfgmsstestvalue',
                text: 'Enter the gmsstest :'
              });
            }
           
          }else if (message.command === 'mainframegmsmfgmsstestvalue') {
            iparsvalue= message.text.trim();
            runMainframeScript()
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
          }else if (message.command === 'askCommitDetails') {
            currentCommand = 'commitChanges';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'askNewExisting') {
            currentCommand = 'newExisting';
            addMessageToChat('Server', message.text, 'follow-up');
          } else if (message.command === 'askNewBranchName') {
            currentCommand = 'newBranchName';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'askExistingBranchName') {
            currentCommand = 'existingBranchName';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'askRepositoryNameMainFrame') {
            currentCommand = 'repositoryNameMainFrame';
            addMessageToChat('Server', message.text, 'follow-up');
          }
             else if (message.command === 'askFileNameMainframe') {
            currentCommand = 'fileNameMainframe';
            addMessageToChat('Server', message.text, 'follow-up');
          }
          else if (message.command === 'askMainframeUsername') {
            currentCommand = 'mainframeUsername';
            addMessageToChat('Server', message.text, 'follow-up');
          }
            
          else if (message.command === 'askMainframePassword') {
            currentCommand = 'mainframePassword';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'askMainframehlq') {
            currentCommand = 'mainframehlq';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'askMainframegmsmfgmsstest') {
            currentCommand = 'mainframegmsmfgmsstest';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'askMainframegmsmfgmsstestvalue') {
            currentCommand = 'mainframegmsmfgmsstestvalue';
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
*/

/*
import * as vscode from 'vscode';
import axios from 'axios';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
// Logger function to log to console and file
function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  // Log to console
  console.log(logMessage);

  // Log to file
  const logFilePath = path.join(__dirname, 'chatbot_logs.txt');
  fs.appendFileSync(logFilePath, logMessage, 'utf8');
}

let currentPanel: vscode.WebviewPanel | undefined;
var baseUrlPath: string = '';
let repositoryName: string = '';
let fileName: string = '';
let branchName: string = '';
let branchlist: string = '';

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
    }else if (response.data && response.data.action === 'commit_changes') {
      // Ask for repository, file, and commit message
      currentPanel?.webview.postMessage({
        command: 'askCommitDetails',
        text: 'Enter the commit message:'
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

  exec(`python3 ${scriptPath} ${repositoryName} ${baseUrlPath} ${activeFolderPath}`, (error, stdout, stderr) => {
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

  exec(`python3 ${scriptPath} ${repositoryName} ${baseUrlPath} ${activeFolderPath}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      return;
    }

    console.log('Python Script Output:', stdout);
    branchlist=stdout;
    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `Branches in the repository:\n${stdout}`
    });
    currentPanel?.webview.postMessage({
      command: 'askNewExisting',
      text: 'Do you want to checkout branch:(new/existing)'
    });
  });
}
function runCommitScript(fileName: string, commitMessage: string, baseUrl: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const activeFolderPath = path.join(workspaceFolders[0].uri.fsPath, repositoryName);
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'commit_changes.py');
  console.log("respo name",activeFolderPath)
  exec(`python3 ${scriptPath} ${activeFolderPath} ${baseUrlPath} ${fileName} "${commitMessage}"`, (error, stdout, stderr) => {
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
      text: `Changes to '${fileName}' committed and pushed successfully.`
    });
  });
}

function runCheckoutScript() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const activeFolderPath = path.join(workspaceFolders[0].uri.fsPath, repositoryName);
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'checkout_branch.py');
  console.log("respo name",activeFolderPath)
  exec(`python3 ${scriptPath} ${activeFolderPath} ${baseUrlPath} ${branchName}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      currentPanel?.webview.postMessage({
        command: 'apiResponse',
        text: `${stderr}`
      });
      return;
    }

    console.log('Python Script Output:', stdout);

    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `${stdout}`
    });
  });
}

function runCheckoutNewScript() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log('No workspace folder is open.');
    return;
  }

  const activeFolderPath = path.join(workspaceFolders[0].uri.fsPath, repositoryName);
  const projectFolderPath = path.dirname(__dirname);
  const scriptPath = path.resolve(projectFolderPath, 'newcheckout_branch.py');
  console.log("respo name",activeFolderPath)
  exec(`python3 ${scriptPath} ${activeFolderPath} ${baseUrlPath} ${branchName}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error executing Python script: ${error.message}`);
      return;
    }

    if (stderr) {
      log(`Python stderr: ${stderr}`);
      currentPanel?.webview.postMessage({
        command: 'apiResponse',
        text: `${stderr}`
      });
      return;
    }

    console.log('Python Script Output:', stdout);

    currentPanel?.webview.postMessage({
      command: 'apiResponse',
      text: `${stdout}`
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
                }else if (response.action === 'commit_changes') {
                  currentPanel?.webview.postMessage({
                    command: 'askCommitDetails',
                    text: 'Enter the commit message:'
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
             repositoryName = message.text.trim();
            const baseUrl = 'https://github.com/gmsadmin-git';
            runPythonScriptBranch(repositoryName, baseUrl);
           
          } else if (message.command === 'repositoryNameClone') {
            const repositoryName = message.text.trim();
            const baseUrl = 'https://github.com/gmsadmin-git';
            runPythonScript(repositoryName, baseUrl);
          } else if (message.command === 'createFile' && message.text.trim().toLowerCase() === 'yes') {
            // Use the previously entered repository name and file name
            runCreateFileScript(repositoryName, fileName);
          
          }else if (message.command === 'commitChanges') {
            const commitMsg = message.text.trim();
            const baseUrl = 'https://github.com/gmsadmin-git';
            runCommitScript(fileName, commitMsg, baseUrl);
          }else if (message.command === 'newExisting') {
           const newExisting = message.text.trim();
           if(newExisting.toLowerCase()=='new'){
            currentPanel?.webview.postMessage({
              command: 'askNewBranchName',
              text: 'Enter the new branch name:'
            });
           }else{
            currentPanel?.webview.postMessage({
              command: 'askExistingBranchName',
              text: 'Enter the branch name to checkout:'
            });
           }
          }else if (message.command === 'newBranchName') {
            branchName = message.text.trim();
            runCheckoutNewScript();
          }else if (message.command === 'existingBranchName') {
            branchName = message.text.trim();
            runCheckoutScript();
          }else if (message.command === 'viewLogs') {
            // Read the log file and send its content to the webview
            const logFilePath = path.join(__dirname, 'chatbot_logs.txt');
            fs.readFile(logFilePath, 'utf8', (err, data) => {
              if (err) {
                currentPanel?.webview.postMessage({
                  command: 'apiError',
                  text: 'Error reading log file: ' + err.message
                });
                return;
              }
              currentPanel?.webview.postMessage({
                command: 'viewLogs',
                text: data
              });
            });
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
        .log-icon {
          margin-left: 10px;
          cursor: pointer;
          font-size: 20px;
          color: #007acc;
        }
        .log-icon:hover {
          color: #005f99;
        }
      </style>
    </head>
    <body>
      <div class="chat-container">
        <div class="messages" id="messages"></div>
        <div class="input-container">
          <input type="text" id="messageInput" placeholder="Type a message..." />
          <button id="sendButton">Send</button>
           <span class="log-icon" id="logIcon">📄</span>
        </div>
      </div>
      <script>
        const vscode = acquireVsCodeApi();
 document.getElementById('logIcon')?.addEventListener('click', () => {
          vscode.postMessage({
            command: 'viewLogs'
          });
        });
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
          }else if (message.command === 'askCommitDetails') {
            currentCommand = 'commitChanges';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'askNewExisting') {
            currentCommand = 'newExisting';
            addMessageToChat('Server', message.text, 'follow-up');
          } else if (message.command === 'askNewBranchName') {
            currentCommand = 'newBranchName';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'askExistingBranchName') {
            currentCommand = 'existingBranchName';
            addMessageToChat('Server', message.text, 'follow-up');
          }else if (message.command === 'viewLogs') {
            // Display log file content
            const logContent = message.text;
            addMessageToChat('Logs', logContent, 'server');
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
*/
//old working
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
// let branchName: string = '';

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
//     }  else if (response.data && response.data.action === 'list_branches') {
//       // Ask for repository name to list branches
//       currentPanel?.webview.postMessage({
//         command: 'askRepositoryNameBranch',
//         text: 'Enter the repository name to list branches:'
//       });
//     } else if (response.data && response.data.action === 'clone') {
//       // Ask for repository name to clone
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
//     }else if (response.data && response.data.action === 'commit_changes') {
//       // Ask for repository, file, and commit message
//       currentPanel?.webview.postMessage({
//         command: 'askCommitDetails',
//         text: 'Enter the commit message:'
//       });
//     } else {
//       callback(response.data);
//     }
//   } catch (error) {
//     log('Error making API request: ' + error);
//     callback({ action: 'Error', name: 'Failed to fetch posts' });
//   }
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

//     if (stdout.includes('not found')) {
//       // Ask the user if they want to create the file
//       currentPanel?.webview.postMessage({
//         command: 'askCreateFile',
//         text: `File '${fileName}' not found in repository '${repositoryName}'. Do you want to create it? (yes/no)`
//       });
//     } else {
//       currentPanel?.webview.postMessage({
//         command: 'apiResponse',
//         text: ``
//       });
//     }
//   });
// }

// function runCreateFileScript(repositoryName: string, fileName: string) {
//   const workspaceFolders = vscode.workspace.workspaceFolders;
//   if (!workspaceFolders || workspaceFolders.length === 0) {
//     log('No workspace folder is open.');
//     return;
//   }

//   const activeFolderPath = path.join(workspaceFolders[0].uri.fsPath, repositoryName);
//   const projectFolderPath = path.dirname(__dirname);
//   const scriptPath = path.resolve(projectFolderPath, 'create_file.py');
//   console.log("three",scriptPath,repositoryName,baseUrlPath,fileName,activeFolderPath)

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
//       text: `File '${fileName}' created successfully.`
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
//   const scriptPath = path.resolve(projectFolderPath, 'clone.py');

//   exec(`python3 ${scriptPath} ${repositoryName} ${baseUrlPath} ${activeFolderPath}`, (error, stdout, stderr) => {
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
//       text: `Repository cloned successfully: ${stdout}`
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
//   const scriptPath = path.resolve(projectFolderPath, 'list_branches.py');

//   exec(`python3 ${scriptPath} ${repositoryName} ${baseUrlPath} ${activeFolderPath}`, (error, stdout, stderr) => {
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
//       text: `Branches in the repository:\n${stdout}`
//     });
//     currentPanel?.webview.postMessage({
//       command: 'askBranchName',
//       text: 'Enter the branch name to checkout:'
//     });
//   });
// }
// function runCommitScript(fileName: string, commitMessage: string, baseUrl: string) {
//   const workspaceFolders = vscode.workspace.workspaceFolders;
//   if (!workspaceFolders || workspaceFolders.length === 0) {
//     log('No workspace folder is open.');
//     return;
//   }

//   const activeFolderPath = path.join(workspaceFolders[0].uri.fsPath, repositoryName);
//   const projectFolderPath = path.dirname(__dirname);
//   const scriptPath = path.resolve(projectFolderPath, 'commit_changes.py');
//   console.log("respo name",activeFolderPath)
//   exec(`python3 ${scriptPath} ${activeFolderPath} ${baseUrlPath} ${fileName} "${commitMessage}"`, (error, stdout, stderr) => {
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
//       text: `Changes to '${fileName}' committed and pushed successfully.`
//     });
//   });
// }

// function runCheckoutScript() {
//   const workspaceFolders = vscode.workspace.workspaceFolders;
//   if (!workspaceFolders || workspaceFolders.length === 0) {
//     log('No workspace folder is open.');
//     return;
//   }

//   const activeFolderPath = path.join(workspaceFolders[0].uri.fsPath, repositoryName);
//   const projectFolderPath = path.dirname(__dirname);
//   const scriptPath = path.resolve(projectFolderPath, 'checkout_branch.py');
//   console.log("respo name",activeFolderPath)
//   exec(`python3 ${scriptPath} ${activeFolderPath} ${baseUrlPath} ${branchName}`, (error, stdout, stderr) => {
//     if (error) {
//       log(`Error executing Python script: ${error.message}`);
//       return;
//     }

//     if (stderr) {
//       log(`Python stderr: ${stderr}`);
//       currentPanel?.webview.postMessage({
//         command: 'apiResponse',
//         text: `${stderr}`
//       });
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
//                 }else if (response.action === 'commit_changes') {
//                   currentPanel?.webview.postMessage({
//                     command: 'askCommitDetails',
//                     text: 'Enter the commit message:'
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
//             console.log("two")
//             fileName = message.text.trim();
//             runOpenFileScript(repositoryName, fileName);
//           } else if (message.command === 'repositoryNameBranch') {
//              repositoryName = message.text.trim();
//             const baseUrl = 'https://github.com/gmsadmin-git';
//             runPythonScriptBranch(repositoryName, baseUrl);
           
//           } else if (message.command === 'repositoryNameClone') {
//             const repositoryName = message.text.trim();
//             const baseUrl = 'https://github.com/gmsadmin-git';
//             runPythonScript(repositoryName, baseUrl);
//           } else if (message.command === 'createFile' && message.text.trim().toLowerCase() === 'yes') {
//             // Use the previously entered repository name and file name
//             runCreateFileScript(repositoryName, fileName);
          
//           }else if (message.command === 'commitChanges') {
//             const commitMsg = message.text.trim();
//             const baseUrl = 'https://github.com/gmsadmin-git';
//             runCommitScript(fileName, commitMsg, baseUrl);
//           }else if (message.command === 'branchName') {
//             branchName = message.text.trim();
//             runCheckoutScript();
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

//         window.addEventListener('message', (event) => {
//           const message = event.data;
          
//           if (message.command === 'apiResponse') {
//             addMessageToChat('Server', message.text, 'server');
//           } else if (message.command === 'apiError') {
//             addMessageToChat('Error', message.text, 'error');
//           } else if (message.command === 'askRepositoryName') {
//             currentCommand = 'repositoryName';
//             addMessageToChat('Server', message.text, 'follow-up');
//           } else if (message.command === 'askFileName') {
//             currentCommand = 'fileName';
//             addMessageToChat('Server', message.text, 'follow-up');
//           } else if (message.command === 'askRepositoryNameClone') {
//             currentCommand = 'repositoryNameClone';
//             addMessageToChat('Server', message.text, 'follow-up');
//           }else if (message.command === 'askRepositoryNameBranch') {
//             currentCommand = 'repositoryNameBranch';
//             addMessageToChat('Server', message.text, 'follow-up');
//           } else if (message.command === 'askCreateFile') {
//             currentCommand = 'createFile';
//             addMessageToChat('Server', message.text, 'follow-up');
//           }else if (message.command === 'askCommitDetails') {
//             currentCommand = 'commitChanges';
//             addMessageToChat('Server', message.text, 'follow-up');
//           }else if (message.command === 'askBranchName') {
//             currentCommand = 'branchName';
//             addMessageToChat('Server', message.text, 'follow-up');
//           }
//         });

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


/*
import * as vscode from 'vscode';
const axios = require('axios');
const { exec } = require('child_process');

const apiUrl = 'http://10.190.226.6:8000/repository';

function activate(context: vscode.ExtensionContext) {
    const chatbotCommand = vscode.commands.registerCommand('test-automation.helloWorld', async () => {
        const panel = vscode.window.createWebviewPanel(
            'chatbotInterface',
            'Chatbot Interface',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
            }
        );

        panel.webview.html = getWebviewContent();

        let followUpIndex = 0;
        const followUpQuestions = [
            'Enter the repo name:',
            'Enter the user name:',
            'Enter the password:',
            'Enter the HLQ:',
            'Enter your LPAR (gmsmf / gmsstest):'
        ];
        const userInputs: { [key: string]: string } = {};

        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'userInput':
                    const userInput = message.text;
                    if (followUpIndex === 0) {
                        try {
                            const response = await axios.post(apiUrl, { query: userInput });
                            const data = response.data;

                            if (data.action === 'lpar_list') {
                                userInputs.originalQuery = userInput;
                                panel.webview.postMessage({ command: 'followUp', question: followUpQuestions[followUpIndex] });
                            } else {
                                panel.webview.postMessage({ command: 'apiResponse', text: 'Unsupported action received from API.' });
                            }
                        } catch (error) {
                            const errorMessage = (error as any).message || 'Unknown error';
                            panel.webview.postMessage({ command: 'apiResponse', text: `Error: ${errorMessage}` });
                        }
                    } else {
                        handleFollowUp(userInput);
                    }
                    break;
            }
        });

        function handleFollowUp(input: string) {
            switch (followUpIndex) {
                case 1: userInputs.repoName = input; break;
                case 2: userInputs.userName = input; break;
                case 3: userInputs.password = input; break;
                case 4: userInputs.hlq = input; break;
                case 5:
                    userInputs.lparChoice = input;
                    finalizeInputs();
                    return;
            }
            followUpIndex++;
            if (followUpIndex < followUpQuestions.length) {
                panel.webview.postMessage({ command: 'followUp', question: followUpQuestions[followUpIndex] });
            }
        }

        async function finalizeInputs() {
            try {
                const response = await axios.post(apiUrl, { query: userInputs.originalQuery });
                const data = response.data;
                const selectedLpar = data.ssh_config[userInputs.lparChoice];

                if (!selectedLpar) {
                    panel.webview.postMessage({ command: 'apiResponse', text: 'Invalid LPAR choice.' });
                    return;
                }

                const scriptArgs = {
                    repoName: userInputs.repoName,
                    baseUrl: data.base_url,
                    userName: userInputs.userName,
                    password: userInputs.password,
                    hlq: userInputs.hlq,
                    lpar: selectedLpar
                };

                const pythonCommand = `python3 your_script.py '${JSON.stringify(scriptArgs)}'`;
                exec(pythonCommand, (error: Error | null, stdout: string, stderr: string) => {
                    if (error) {
                        panel.webview.postMessage({ command: 'scriptOutput', text: `Error: ${stderr}` });
                        return;
                    }
                    panel.webview.postMessage({ command: 'scriptOutput', text: `Success: ${stdout}` });
                });
            } catch (error) {
                panel.webview.postMessage({ command: 'apiResponse', text: `Error: ${(error as any).message}` });
            }
        }
    });

    context.subscriptions.push(chatbotCommand);
}

function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chatbot Interface</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 10px; }
            .chat-container { max-width: 600px; margin: 0 auto; }
            .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
            .user { background-color: #e0f7fa; align-self: flex-end; }
            .bot { background-color: #eceff1; align-self: flex-start; }
            .input-container { margin-top: 20px; display: flex; }
            input { flex: 1; padding: 10px; font-size: 16px; }
            button { padding: 10px; font-size: 16px; margin-left: 5px; }
        </style>
    </head>
    <body>
        <div class="chat-container" id="chatContainer"></div>
        <div class="input-container">
            <input type="text" id="userInput" placeholder="Type your message here...">
            <button onclick="sendMessage()">Send</button>
        </div>
        <script>
            const vscode = acquireVsCodeApi();

            function addMessage(text, sender) {
                const chatContainer = document.getElementById('chatContainer');
                const message = document.createElement('div');
                message.className = 'message ' + sender;
                message.textContent = text;
                chatContainer.appendChild(message);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }

            function sendMessage() {
                const userInput = document.getElementById('userInput').value;
                if (userInput.trim()) {
                    addMessage(userInput, 'user');
                    vscode.postMessage({ command: 'userInput', text: userInput });
                    document.getElementById('userInput').value = '';
                }
            }

            window.addEventListener('message', (event) => {
                const message = event.data;
                switch (message.command) {
                    case 'followUp':
                        addMessage(message.question, 'bot');
                        break;
                    case 'apiResponse':
                        addMessage(message.text, 'bot');
                        break;
                    case 'scriptOutput':
                        addMessage('Python Script Output: ' + message.text, 'bot');
                        break;
                }
            });
        </script>
    </body>
    </html>`;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
*/