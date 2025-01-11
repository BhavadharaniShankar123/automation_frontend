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
#         return f"Branch '{branch_name}' pushed to remote repository."
#     except subprocess.CalledProcessError as e:
#         return f"Error pushing branch '{branch_name}': {e}"


# def main(repo_name, base_url,new_branch_name):
#     workspace_path = os.getcwd()
#     repo_url = f"{base_url}/{repo_name}.git"
#     clone_path = os.path.join(workspace_path, repo_name)

#     #new_branch_name = input("Enter the name of the new branch: ").strip()
#     try:
#         subprocess.run(['git', '-C', clone_path, 'checkout', '-b', new_branch_name], check=True)
#         print(f"Created and switched to new branch '{new_branch_name}'.")
#         push_branch(clone_path, new_branch_name)
#     except subprocess.CalledProcessError as e:
#         print(f"Error creating new branch '{new_branch_name}': {e}")
#     # else:
#     #     print("No branches found.")


# if __name__ == "__main__":
#     parser = argparse.ArgumentParser(description="Process repository name and base URL.")
#     parser.add_argument("repo_name", type=str, help="The name of the repository to process")
#     parser.add_argument("base_url", type=str, help="The base URL of the repository")
#     parser.add_argument("new_branch_name", type=str, help="It will create a new feature branch")
#     args = parser.parse_args()

#     print(main(args.repo_name, args.base_url, args.new_branch_name))

# # enter the repo name
# #Enter the name of the new branch: 

# #python3 new_branch.py MortgageApplication https://github.com/ratnamGT MortApp



import subprocess
import os
import logging
import argparse
from datetime import datetime

def log_to_file(message, LOG_FILE):
    """Logs a message to the log file with a timestamp."""
    with open(LOG_FILE, "a") as log_file:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_file.write(f"{timestamp} - {message}\n")
        log_file.write("-" * 40 + "\n")  # Separator for readability

def list_branches(repo_path, LOG_FILE):
    """List all available branches in the repository."""
    try:
        log_to_file(f"Listing all branches in repository: {repo_path}", LOG_FILE)
        result = subprocess.run(['git', '-C', repo_path, 'branch', '-a'], check=True, text=True, capture_output=True)
        branches = result.stdout.strip().split('\n')
        log_to_file(f"Branches found: {branches}", LOG_FILE)
        return branches
    except subprocess.CalledProcessError as e:
        log_to_file(f"Error listing branches: {e}", LOG_FILE)
        return []

def is_git_repo(folder_path, LOG_FILE):
    """Check if the folder is a valid Git repository."""
    log_to_file(f"Checking if {folder_path} is a valid Git repository.", LOG_FILE)
    result = os.path.isdir(os.path.join(folder_path, ".git"))
    if result:
        log_to_file(f"{folder_path} is a valid Git repository.", LOG_FILE)
    else:
        log_to_file(f"{folder_path} is not a valid Git repository.", LOG_FILE)
    return result

def checkout_branch(repo_path, branch_name, LOG_FILE):
    """Try to checkout a branch, handle errors, and fallback if needed."""
    try:
        log_to_file(f"Attempting to checkout branch: {branch_name}", LOG_FILE)
        subprocess.run(['git', '-C', repo_path, 'checkout', branch_name], check=True)
        log_to_file(f"Successfully checked out branch: {branch_name}", LOG_FILE)
        return f"Checked out branch '{branch_name}'."
    except subprocess.CalledProcessError as e:
        log_to_file(f"Error checking out branch '{branch_name}': {e}", LOG_FILE)
        fallback_branch = "main"  # Default fallback branch
        log_to_file(f"Attempting to checkout fallback branch: {fallback_branch}", LOG_FILE)
        try:
            subprocess.run(['git', '-C', repo_path, 'checkout', fallback_branch], check=True)
            log_to_file(f"Successfully checked out fallback branch: {fallback_branch}", LOG_FILE)
            return f"Checked out fallback branch '{fallback_branch}' successfully."
        except subprocess.CalledProcessError as fallback_error:
            log_to_file(f"Failed to checkout fallback branch '{fallback_branch}': {fallback_error}", LOG_FILE)
            return f"Critical error: Unable to checkout any branch."

def push_branch(repo_path, branch_name, LOG_FILE):
    """Push a new branch to the remote repository."""
    try:
        log_to_file(f"Pushing branch '{branch_name}' to remote repository.", LOG_FILE)
        subprocess.run(['git', '-C', repo_path, 'push', '-u', 'origin', branch_name], check=True)
        log_to_file(f"Branch '{branch_name}' pushed to remote repository successfully.", LOG_FILE)
        return f"Branch '{branch_name}' pushed to remote repository."
    except subprocess.CalledProcessError as e:
        log_to_file(f"Error pushing branch '{branch_name}': {e}", LOG_FILE)
        return f"Error pushing branch '{branch_name}': {e}"

def main(repo_name, base_url, new_branch_name, active_path):
    """Main function to handle repository setup and branch operations."""
    LOG_FILE = os.path.join(active_path, "internet_connection_log.txt")

    repo_url = f"{base_url}/{repo_name}.git"  # Construct the Git repository URL
    clone_path = os.path.join(active_path, repo_name)

    log_to_file(f"Starting process for repository: {repo_name} at {base_url}", LOG_FILE)
    log_to_file(f"Local repository path: {clone_path}", LOG_FILE)

    # Check if the folder is a Git repository
    if not is_git_repo(clone_path, LOG_FILE):
        error_message = f"Error: {clone_path} is not a valid Git repository. Please clone the repository first."
        log_to_file(error_message, LOG_FILE)
        return error_message

    # Perform the branch creation and push
    log_to_file(f"Creating and switching to new branch: {new_branch_name}", LOG_FILE)
    try:
        subprocess.run(['git', '-C', clone_path, 'checkout', '-b', new_branch_name], check=True)
        log_to_file(f"Successfully created and switched to new branch: {new_branch_name}", LOG_FILE)
        push_message = push_branch(clone_path, new_branch_name, LOG_FILE)
        return push_message
    except subprocess.CalledProcessError as e:
        error_message = f"Error creating new branch '{new_branch_name}': {e}"
        log_to_file(error_message, LOG_FILE)
        return error_message

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process repository name and base URL.")
    parser.add_argument("repo_name", type=str, help="The name of the repository to process")
    parser.add_argument("base_url", type=str, help="The base URL of the repository")
    parser.add_argument("new_branch_name", type=str, help="The name of the new branch to create")
    parser.add_argument("active_path", type=str, help="It will download in the current path")
    args = parser.parse_args()

main(args.repo_name, args.base_url, args.new_branch_name, args.active_path)
    # print(result)


