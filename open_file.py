# import os
# import subprocess
# import argparse

# def find_file_in_repo(repo_path, file_name):
#     """Search for the file in the repo and return its path if found."""
#     for root, dirs, files in os.walk(repo_path):
#         if file_name in files:
#             return os.path.join(root, file_name)
#     return None

# def open_in_vscode(file_path):
#     """Open the file in VSCode."""
#     try:
#         subprocess.run(["code", file_path], check=True)
#         return "File opened"
#     except FileNotFoundError:
#         return "VSCode not installed"
#     except subprocess.CalledProcessError as e:
#         return f"Error opening file in VSCode: {e}"

# def main(repo_name, base_url, file_name, active_folder_path):
#     """Main function to clone the repo and open the file."""
#     workspace_path = os.getcwd()
#     repo_url = f"{base_url}/{repo_name}.git"
#     clone_path = os.path.join(active_folder_path, repo_name)  # Use the active folder path

#     # Find the file in the repository (including subdirectories)
#     file_path = find_file_in_repo(clone_path, file_name)

#     if file_path:
#         result = open_in_vscode(file_path)
#         return f"Successfully opened: {file_path}" if result == "File opened" else result
#     else:
#         return f"File '{file_name}' not found in repository '{repo_name}'."

# if __name__ == "__main__":
#     parser = argparse.ArgumentParser(description="Process repository name, base URL, file name, and active folder path.")
#     parser.add_argument("repo_name", type=str, help="The name of the repository to process")
#     parser.add_argument("base_url", type=str, help="The base URL of the repository")
#     parser.add_argument("file_name", type=str, help="The name of the file which is to open")
#     parser.add_argument("active_folder_path", type=str, help="The path of the active workspace folder")
#     args = parser.parse_args()

#     result = main(args.repo_name, args.base_url, args.file_name, args.active_folder_path)
#     print(result)

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
    """Search for the file in the repo and return its path if found."""
    log_to_file(f"Searching for file '{file_name}' in repository '{repo_path}'", LOG_FILE)
    for root, dirs, files in os.walk(repo_path):
        if file_name in files:
            file_path = os.path.join(root, file_name)
            log_to_file(f"File found: {file_path}", LOG_FILE)
            return file_path
    log_to_file(f"File '{file_name}' not found in repository '{repo_path}'", LOG_FILE)
    return None

def open_in_vscode(file_path, LOG_FILE):
    """Open the file in VSCode."""
    try:
        log_to_file(f"Attempting to open file in VSCode: {file_path}", LOG_FILE)
        subprocess.run(["code", file_path], check=True)
        log_to_file(f"File opened successfully in VSCode: {file_path}", LOG_FILE)
        return "File opened"
    except FileNotFoundError:
        log_to_file("VSCode not installed", LOG_FILE)
        return "VSCode not installed"
    except subprocess.CalledProcessError as e:
        log_to_file(f"Error opening file in VSCode: {e}", LOG_FILE)
        return f"Error opening file in VSCode: {e}"

def main(repo_name, base_url, file_name, active_folder_path):
    """Main function to clone the repo and open the file."""
    LOG_FILE = os.path.join(active_folder_path, "internet_connection_log.txt")

    #workspace_path = os.getcwd()
    repo_url = f"{base_url}/{repo_name}.git"
    clone_path = os.path.join(active_folder_path, repo_name)  # Use the active folder path

    log_to_file(f"Starting process for repository: {repo_name} at {base_url}", LOG_FILE)
    log_to_file(f"Local repository path: {clone_path}", LOG_FILE)

    # Find the file in the repository (including subdirectories)
    file_path = find_file_in_repo(clone_path, file_name, LOG_FILE)

    if file_path:
        result = open_in_vscode(file_path, LOG_FILE)
        if result == "File opened":
            log_to_file(f"Successfully opened: {file_path}", LOG_FILE)
            return f"Successfully opened: {file_path}"
        else:
            log_to_file(result, LOG_FILE)
            return result
    else:
        message = f"File '{file_name}' not found in repository '{repo_name}'."
        log_to_file(message, LOG_FILE)
        return message

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process repository name, base URL, file name, and active folder path.")
    parser.add_argument("repo_name", type=str, help="The name of the repository to process")
    parser.add_argument("base_url", type=str, help="The base URL of the repository")
    parser.add_argument("file_name", type=str, help="The name of the file which is to open")
    parser.add_argument("active_folder_path", type=str, help="The path of the active workspace folder")
    args = parser.parse_args()

    result = main(args.repo_name, args.base_url, args.file_name, args.active_folder_path)
    print(result)
