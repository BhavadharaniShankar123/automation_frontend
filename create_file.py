# import os
# import subprocess
# import argparse

# def find_file_in_repo(repo_path, file_name):
#     """Search for the file in the repository folder and subfolders."""
#     for root, _, files in os.walk(repo_path):
#         if file_name in files:
#             return os.path.join(root, file_name)
#     return None

# def open_in_vscode(file_path):
#     """Open the specified file in VSCode."""
#     try:
#         subprocess.run(["code", file_path], check=True)
#         print(f"File opened in VSCode: {file_path}")
#     except FileNotFoundError:
#         print("VSCode is not installed. Please install VSCode from https://code.visualstudio.com/")
#     except subprocess.CalledProcessError as e:
#         print(f"Error opening file in VSCode: {e}")

# def main(repo_name, base_url, file_name, active_folder_path):
#     """Main function to clone the repo, find or create the file, and open it."""
#     repo_url = f"{base_url}/{repo_name}.git"
#     clone_path = os.path.join(active_folder_path, repo_name)

   
#     if not os.path.exists(clone_path):
#         print(f"Cloning repository {repo_name}...")
#         subprocess.run(["git", "clone", repo_url, clone_path], check=True)
#     else:
#         print(f"Repository {repo_name} already exists.")

   
#     file_path = find_file_in_repo(clone_path, file_name)
#     if file_path:
#         print(f"File {file_name} found in the repository.")
#     else:
      
#         file_path = os.path.join(active_folder_path, file_name)
#         open(file_path, 'w').close()
#         print(f"File {file_name} not found in the repository. Created new file at: {file_path}")

   
#     open_in_vscode(file_path)

# if __name__ == "__main__":
#     parser = argparse.ArgumentParser(description="Process repository name, base URL, file name, and active folder path.")
#     parser.add_argument("repo_name", type=str, help="The name of the repository to process")
#     parser.add_argument("base_url", type=str, help="The base URL of the repository")
#     parser.add_argument("file_name", type=str, help="The name of the file to open or create")
#     parser.add_argument("active_folder_path", type=str, help="The path of the active workspace folder")
#     args = parser.parse_args()

#     main(args.repo_name, args.base_url, args.file_name, args.active_folder_path)

import os
import subprocess
import argparse
from datetime import datetime

def log_to_file(message, LOG_FILE):
    """Logs a message to the log file with a timestamp."""
    with open(LOG_FILE, "a") as log_file:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_file.write(f"{timestamp} - {message}\n")
        log_file.write("-" * 40 + "\n")  # Separator for readability

def find_file_in_repo(repo_path, file_name, LOG_FILE):
    """Search for the file in the repository folder and subfolders."""
    log_to_file(f"Searching for file '{file_name}' in repository '{repo_path}'", LOG_FILE)
    for root, _, files in os.walk(repo_path):
        if file_name in files:
            file_path = os.path.join(root, file_name)
            log_to_file(f"File found: {file_path}", LOG_FILE)
            return file_path
    log_to_file(f"File '{file_name}' not found in repository '{repo_path}'", LOG_FILE)
    return None

def open_in_vscode(file_path, LOG_FILE):
    """Open the specified file in VSCode."""
    try:
        log_to_file(f"Attempting to open file in VSCode: {file_path}", LOG_FILE)
        subprocess.run(["code", file_path], check=True)
        log_to_file(f"File opened successfully in VSCode: {file_path}", LOG_FILE)
        print(f"File opened in VSCode: {file_path}")
    except FileNotFoundError:
        log_to_file("VSCode is not installed", LOG_FILE)
        print("VSCode is not installed. Please install VSCode from https://code.visualstudio.com/")
    except subprocess.CalledProcessError as e:
        log_to_file(f"Error opening file in VSCode: {e}", LOG_FILE)
        print(f"Error opening file in VSCode: {e}")

def main(repo_name, base_url, file_name, active_folder_path,folder_path):
    """Main function to clone the repo, find or create the file, and open it."""
    LOG_FILE = os.path.join(folder_path, "internet_connection_log.txt")
    repo_url = f"{base_url}/{repo_name}.git"
    clone_path = os.path.join(active_folder_path, repo_name)

    log_to_file(f"Starting process for repository: {repo_name}", LOG_FILE)

    if not os.path.exists(clone_path):
        log_to_file(f"Cloning repository from {repo_url} to {clone_path}", LOG_FILE)
        print(f"Cloning repository {repo_name}...")
        subprocess.run(["git", "clone", repo_url, clone_path], check=True)
        log_to_file(f"Repository cloned successfully", LOG_FILE)
    else:
        log_to_file(f"Repository {repo_name} already exists at {clone_path}", LOG_FILE)
        print(f"Repository {repo_name} already exists.")

    file_path = find_file_in_repo(clone_path, file_name, LOG_FILE)

    if file_path:
        log_to_file(f"File {file_name} found in repository", LOG_FILE)
        print(f"File {file_name} found in the repository.")
    else:
        file_path = os.path.join(active_folder_path, file_name)
        open(file_path, 'w').close()
        log_to_file(f"File {file_name} not found. Created new file at {file_path}", LOG_FILE)
        print(f"File {file_name} not found in the repository. Created new file at: {file_path}")

    open_in_vscode(file_path, LOG_FILE)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process repository name, base URL, file name, and active folder path.")
    parser.add_argument("repo_name", type=str, help="The name of the repository to process")
    parser.add_argument("base_url", type=str, help="The base URL of the repository")
    parser.add_argument("file_name", type=str, help="The name of the file to open or create")
    parser.add_argument("active_folder_path", type=str, help="The path of the active workspace folder")
    parser.add_argument("folder_path", type=str, help="The path of the active workspace folder")
    args = parser.parse_args()

    main(args.repo_name, args.base_url, args.file_name, args.active_folder_path,args.folder_path)

