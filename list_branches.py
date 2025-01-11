# import subprocess
# import os
# import yaml
# import argparse


# def is_git_repo(folder_path):
#     """Check if a folder is a valid Git repository."""
#     return os.path.isdir(os.path.join(folder_path, ".git"))


# def list_branches(repo_path):
#     """List all available branches in the repository."""
#     try:
#         result = subprocess.run(['git', '-C', repo_path, 'branch', '-a'], check=True, text=True, capture_output=True)
#         return result.stdout.strip().split('\n')
#     except subprocess.CalledProcessError as e:
#         print(f"Error listing branches: {e}")
#         return []


# def main(repo_name, dir_path, active_folder_path):
#     """Main function to process the repository."""
#     workspace_path = os.path.join(dir_path, active_folder_path)
#     clone_path = os.path.join(workspace_path, repo_name)

#     if not is_git_repo(clone_path):
#         return f"Error: {clone_path} is not a valid Git repository."

#     branches = list_branches(clone_path)
#     if branches:
#         print("Available branches:")
#         for branch in branches:
#             print(branch)
#         return branches
#     else:
#         return "No branches found."


# if __name__ == "__main__":
#     # Create an argument parser
#     parser = argparse.ArgumentParser(description="Process repository name and base URL.")

#     # Add arguments for repo_name, dir_path, and active_folder_path
#     parser.add_argument("repo_name", type=str, help="The name of the repository to process")
#     parser.add_argument("dir_path", type=str, help="The base directory path")
#     parser.add_argument("active_folder_path", type=str, help="The path of the active workspace folder")

#     # Parse arguments
#     args = parser.parse_args()

#     # Call the main function with the provided arguments
#     print(main(args.repo_name, args.dir_path, args.active_folder_path))



#list_branch.py

import subprocess
import os
import yaml
import argparse
from datetime import datetime

def log_to_file(message, LOG_FILE):
    """Logs a message to the log file with a timestamp."""
    with open(LOG_FILE, "a") as log_file:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_file.write(f"{timestamp} - {message}\n")
        log_file.write("-" * 40 + "\n")  # Separator for readability

def is_git_repo(folder_path, LOG_FILE):
    """Check if a folder is a valid Git repository."""
    is_repo = os.path.isdir(os.path.join(folder_path, ".git"))
    message = f"Checked if {folder_path} is a Git repository: {is_repo}"
    log_to_file(message, LOG_FILE)
    return is_repo

def list_branches(repo_path, LOG_FILE):
    """List all available branches in the repository."""
    try:
        result = subprocess.run(['git', '-C', repo_path, 'branch', '-a'], check=True, text=True, capture_output=True)
        branches = result.stdout.strip().split('\n')
        log_to_file(f"Branches listed successfully in {repo_path}.", LOG_FILE)
        return branches
    except subprocess.CalledProcessError as e:
        message = f"Error listing branches in {repo_path}: {e}"
        log_to_file(message, LOG_FILE)
        print(message)
        return []

def main(repo_name, dir_path, active_folder_path):
    """Main function to process the repository."""
    workspace_path = os.path.join(dir_path, active_folder_path)
    print(workspace_path)
    clone_path = os.path.join(workspace_path, repo_name)
    print(clone_path)
    LOG_FILE = os.path.join(workspace_path, "internet_connection_log.txt")

    if not is_git_repo(clone_path, LOG_FILE):
        message = f"Error: {clone_path} is not a valid Git repository."
        log_to_file(message, LOG_FILE)
        return message

    branches = list_branches(clone_path, LOG_FILE)
    if branches:
        message = f"Available branches in {clone_path}:\n" + "\n".join(branches)
        log_to_file(message, LOG_FILE)
        print("Available branches:")
        for branch in branches:
            print(branch)
        return branches
    else:
        message = "No branches found."
        log_to_file(message, LOG_FILE)
        return message

if __name__ == "__main__":
    # Create an argument parser
    parser = argparse.ArgumentParser(description="Process repository name and base URL.")

    # Add arguments for repo_name, dir_path, and active_folder_path
    parser.add_argument("repo_name", type=str, help="The name of the repository to process")
    parser.add_argument("dir_path", type=str, help="The base directory path")
    parser.add_argument("active_folder_path", type=str, help="The path of the active workspace folder")

    # Parse arguments
    args = parser.parse_args()

    # Call the main function with the provided arguments
    print(main(args.repo_name, args.dir_path, args.active_folder_path))