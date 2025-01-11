# import os
# import subprocess
# import argparse

# def find_file_in_repo(repo_path, file_name):
#     for root, dirs, files in os.walk(repo_path):
#         if file_name in files:
#             return os.path.join(root, file_name)
#     return None

# def open_in_vscode(file_path):
#     try:
#         subprocess.run(["code", file_path], check=True)
#     except FileNotFoundError:
#         print("VSCode is not installed. Please install VSCode from https://code.visualstudio.com/")
#     except subprocess.CalledProcessError as e:
#         print(f"Error opening file in VSCode: {e}")


# def main(repo_name, base_url, file_name,commit_message):
#     workspace_path = os.getcwd()
#     clone_path = os.path.join(workspace_path, repo_name)
    
#     file_path = find_file_in_repo(clone_path, file_name)

#     """if file_path:
#         print(f"Opening file {file_path} in VSCode...")
#         open_in_vscode(file_path)
#         input("Edit the file in VSCode, save changes, and press Enter to continue...")"""

#         # Check if there are changes to commit
#     try:
#             result = subprocess.run(
#                 ['git', '-C', clone_path, 'status', '--porcelain'],
#                 stdout=subprocess.PIPE,
#                 text=True,
#                 check=True
#             )
#             if not result.stdout.strip():
#                 return "No changes detected. Please make changes before committing."
                

#             # If changes are present, proceed to commit and push
#             #commit_message = input("Enter commit message for your changes: ")
#             subprocess.run(['git', '-C', clone_path, 'add', file_path], check=True)
#             subprocess.run(['git', '-C', clone_path, 'commit', '-m', commit_message], check=True)
#             subprocess.run(['git', '-C', clone_path, 'push'], check=True)
#             return "Changes pushed to the remote repository successfully."
#     except subprocess.CalledProcessError as e:
#             return f"Error processing Git operations: {e}"
#     """else:
#         create_file = input(f"File {file_name} not found in the repository at {clone_path}. Do you want to create the file? (yes/no): ").lower()
#         if create_file == 'yes':
#             file_path = os.path.join(clone_path, file_name)
#             open(file_path, 'w').close()
#             print(f"File {file_name} created.")
#             open_in_vscode(file_path)
#         else:
#             print("Operation canceled. Exiting.")"""

# if __name__== "__main__":
#     parser = argparse.ArgumentParser(description="Process repository name, base URL, and file name.")
#     parser.add_argument("repo_name", type=str, help="The name of the repository to process")
#     parser.add_argument("base_url", type=str, help="The base URL of the repository")
#     parser.add_argument("file_name", type=str, help="The name of the file to open or create")
#     parser.add_argument("commit_message", type=str, help="The name of the file to open or create")
#     args = parser.parse_args()

#     print(main(args.repo_name, args.base_url, args.file_name,args.commit_message))
# ### 1 follow-up question: Enter the repo name:
# ### 2 follow-up question: Enter the name of the file you want to commit (including extension):  --> file_name

# #python3 commit_after_change.py MortgageApplication https://github.com/ratnamGT hello.cbl changed


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

def main(repo_name, base_url, file_name, commit_message,active_folder_path):
    """Main function to clone the repo, find or create the file, and open it."""
    LOG_FILE = os.path.join(active_folder_path, "internet_connection_log.txt")
    repo_url = f"{base_url}/{repo_name}.git"
    clone_path = os.path.join(os.getcwd(), repo_name)

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
        file_path = os.path.join(clone_path, file_name)
        open(file_path, 'w').close()
        log_to_file(f"File {file_name} not found. Created new file at {file_path}", LOG_FILE)
        print(f"File {file_name} not found in the repository. Created new file at: {file_path}")

    try:
        log_to_file("Checking for uncommitted changes", LOG_FILE)
        result = subprocess.run(
            ['git', '-C', clone_path, 'status', '--porcelain'],
            stdout=subprocess.PIPE,
            text=True,
            check=True
        )
        if not result.stdout.strip():
            log_to_file("No changes detected. Exiting.", LOG_FILE)
            print("No changes detected. Please make changes before committing.")
            return

        log_to_file("Staging and committing changes", LOG_FILE)
        subprocess.run(['git', '-C', clone_path, 'add', file_path], check=True)
        subprocess.run(['git', '-C', clone_path, 'commit', '-m', commit_message], check=True)
        subprocess.run(['git', '-C', clone_path, 'push'], check=True)
        log_to_file("Changes pushed to the remote repository successfully", LOG_FILE)
        print("Changes pushed to the remote repository successfully.")
    except subprocess.CalledProcessError as e:
        log_to_file(f"Error during Git operations: {e}", LOG_FILE)
        print(f"Error processing Git operations: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process repository name, base URL, file name, and commit message.")
    parser.add_argument("repo_name", type=str, help="The name of the repository to process")
    parser.add_argument("base_url", type=str, help="The base URL of the repository")
    parser.add_argument("file_name", type=str, help="The name of the file to open or create")
    parser.add_argument("commit_message", type=str, help="The commit message for changes")
    parser.add_argument("active_folder_path", type=str, help="The path of the active workspace folder")
    args = parser.parse_args()

    main(args.repo_name, args.base_url, args.file_name, args.commit_message,args.active_folder_path)


