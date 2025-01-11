# import subprocess
# import os
# import yaml
# import argparse

# def list_branches(repo_path):
#     """List all available branches in the repository."""
#     try:
#         result = subprocess.run(['git', '-C', repo_path, 'branch', '-a'], check=True, text=True, capture_output=True)
#         return result.stdout.strip().split('\n')
#     except subprocess.CalledProcessError as e:
#         print(f"Error listing branches: {e}")
#         return []    

# def is_git_repo(folder_path):
#     return os.path.isdir(os.path.join(folder_path, ".git"))            


# def checkout_branch(repo_path, branch_name):
#     """Try to checkout a branch, handle errors, and fallback if needed."""
#     try:
#         subprocess.run(['git', '-C', repo_path, 'checkout', branch_name], check=True)
#         return f"Checked out branch '{branch_name}'."
#     except subprocess.CalledProcessError as e:
#         print(f"Error checking out branch '{branch_name}': {e}")
#         fallback_branch = "main"  # Default fallback branch
#         print(f"Attempting to checkout fallback branch '{fallback_branch}'.")
#         try:
#             subprocess.run(['git', '-C', repo_path, 'checkout', fallback_branch], check=True)
#             return f"Checked out fallback branch '{fallback_branch}' successfully."
#         except subprocess.CalledProcessError as fallback_error:
#             print(f"Failed to checkout fallback branch '{fallback_branch}': {fallback_error}")


# def push_branch(repo_path, branch_name):
#     """Push a new branch to the remote repository."""
#     try:
#         subprocess.run(['git', '-C', repo_path, 'push', '-u', 'origin', branch_name], check=True)
#         print(f"Branch '{branch_name}' pushed to remote repository.")
#     except subprocess.CalledProcessError as e:
#         print(f"Error pushing branch '{branch_name}': {e}")


# def main(repo_name, base_url,branch_name):
#     workspace_path = os.getcwd()
#     repo_url = f"{base_url}/{repo_name}.git"
#     clone_path = os.path.join(workspace_path, repo_name)

#     # if not is_git_repo(clone_path):
#     #     print(f"Error: {clone_path} is not a valid Git repository.")
#     #     return

#     # branches = list_branches(clone_path)
#     # if branches:
#     #     print("Available branches:")
#         # for i, branch in enumerate(branches, start=1):
#         #     print(f"{i}. {branch}")

#         #action = input("Do you want to checkout an existing branch or create a new one? (enter 'existing' or 'new'): ").lower()

#         # if action in branches:
#         #     branch_num = int(input(f"Enter the branch number you want to checkout (1-{len(branches)}): "))
#         #     if 1 <= branch_num <= len(branches):
#         #         branch_name = branches[branch_num - 1].strip()
#         #         normalized_branch = branch_name.replace("remotes/origin/", "").strip()
#     return checkout_branch(clone_path, branch_name)
    

#             # else:
#                 # print("Invalid branch number.")
#         # """elif action == 'new':
#         #     new_branch_name = input("Enter the name of the new branch: ").strip()
#         #     try:
#         #         subprocess.run(['git', '-C', clone_path, 'checkout', '-b', new_branch_name], check=True)
#         #         print(f"Created and switched to new branch '{new_branch_name}'.")
#         #         push_branch(clone_path, new_branch_name)
#         #     except subprocess.CalledProcessError as e:
#         #         print(f"Error creating new branch '{new_branch_name}': {e}")"""
#     # else:
#     #     print("No branches found.")


# if __name__ == "__main__":
#     parser = argparse.ArgumentParser(description="Process repository name and base URL.")
#     parser.add_argument("repo_name", type=str, help="The name of the repository to process")
#     parser.add_argument("base_url", type=str, help="The base URL of the repository")
#     parser.add_argument("branch_name", type=str, help="It will checkout to the branch name")
#     args = parser.parse_args()

#     print(main(args.repo_name, args.base_url, args.branch_name))


#     ###radio button

#     #python3 checkout_branch.py MortgageApplication https://github.com/gmsadmin-git remotes/origin/feature/test


#     #https://github.com/gmsadmin-git

#checkout_branch.py

import subprocess
import os
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
    log_to_file(f"Checked if {folder_path} is a Git repository: {is_repo}", LOG_FILE)
    return is_repo

def list_branches(repo_path, LOG_FILE):
    """List all available branches in the repository."""
    try:
        result = subprocess.run(['git', '-C', repo_path, 'branch', '-a'], check=True, text=True, capture_output=True)
        branches = result.stdout.strip().split('\n')
        log_to_file(f"Listed branches in repository {repo_path}.", LOG_FILE)
        return branches
    except subprocess.CalledProcessError as e:
        log_to_file(f"Error listing branches in {repo_path}: {e}", LOG_FILE)
        print(f"Error listing branches: {e}")
        return []

def checkout_branch(repo_path, branch_name, LOG_FILE):
    """Try to checkout a branch, handle errors, and fallback if needed."""
    try:
        subprocess.run(['git', '-C', repo_path, 'checkout', branch_name], check=True)
        message = f"Checked out branch '{branch_name}'."
        log_to_file(message, LOG_FILE)
        return message
    except subprocess.CalledProcessError as e:
        log_to_file(f"Error checking out branch '{branch_name}': {e}", LOG_FILE)
        print(f"Error checking out branch '{branch_name}': {e}")
        fallback_branch = "main"  # Default fallback branch
        try:
            subprocess.run(['git', '-C', repo_path, 'checkout', fallback_branch], check=True)
            message = f"Checked out fallback branch '{fallback_branch}' successfully."
            log_to_file(message, LOG_FILE)
            return message
        except subprocess.CalledProcessError as fallback_error:
            log_to_file(f"Failed to checkout fallback branch '{fallback_branch}': {fallback_error}", LOG_FILE)
            return f"Failed to checkout both '{branch_name}' and fallback branch '{fallback_branch}'."

def push_branch(repo_path, branch_name, LOG_FILE):
    """Push a new branch to the remote repository."""
    try:
        subprocess.run(['git', '-C', repo_path, 'push', '-u', 'origin', branch_name], check=True)
        message = f"Branch '{branch_name}' pushed to remote repository."
        log_to_file(message, LOG_FILE)
        print(message)
    except subprocess.CalledProcessError as e:
        log_to_file(f"Error pushing branch '{branch_name}': {e}", LOG_FILE)
        print(f"Error pushing branch '{branch_name}': {e}")

def main(repo_name, base_url, branch_name, active_path):
    """Main function to process the repository."""
    LOG_FILE = f"{active_path}/internet_connection_log.txt"
    #workspace_path = os.getcwd()
    repo_url = f"{base_url}/{repo_name}.git"
    clone_path = os.path.join(active_path, repo_name)
    #LOG_FILE = os.path.join(workspace_path, "")

    if not is_git_repo(clone_path, LOG_FILE):
        message = f"Error: {clone_path} is not a valid Git repository."
        log_to_file(message, LOG_FILE)
        return message

    # Checkout to the branch
    return checkout_branch(clone_path, branch_name, LOG_FILE)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process repository name and base URL.")
    parser.add_argument("repo_name", type=str, help="The name of the repository to process")
    parser.add_argument("base_url", type=str, help="The base URL of the repository")
    parser.add_argument("branch_name", type=str, help="The branch to checkout to")
    parser.add_argument("active_path", type=str, help="It will download in the current path")
    args = parser.parse_args()

    print(main(args.repo_name, args.base_url, args.branch_name, args.active_path))

