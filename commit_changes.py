import os
import subprocess
import argparse

def find_file_in_repo(repo_path, file_name):
    for root, dirs, files in os.walk(repo_path):
        if file_name in files:
            return os.path.join(root, file_name)
    return None

def open_in_vscode(file_path):
    try:
        subprocess.run(["code", file_path], check=True)
    except FileNotFoundError:
        print("VSCode is not installed. Please install VSCode from https://code.visualstudio.com/")
    except subprocess.CalledProcessError as e:
        print(f"Error opening file in VSCode: {e}")


def main(repo_name, base_url, file_name,commit_message):
    workspace_path = os.getcwd()
    clone_path = os.path.join(workspace_path, repo_name)
    
    file_path = find_file_in_repo(clone_path, file_name)

    """if file_path:
        print(f"Opening file {file_path} in VSCode...")
        open_in_vscode(file_path)
        input("Edit the file in VSCode, save changes, and press Enter to continue...")"""

        # Check if there are changes to commit
    try:
            result = subprocess.run(
                ['git', '-C', clone_path, 'status', '--porcelain'],
                stdout=subprocess.PIPE,
                text=True,
                check=True
            )
            if not result.stdout.strip():
                return "No changes detected. Please make changes before committing."
                

            # If changes are present, proceed to commit and push
            #commit_message = input("Enter commit message for your changes: ")
            subprocess.run(['git', '-C', clone_path, 'add', file_path], check=True)
            subprocess.run(['git', '-C', clone_path, 'commit', '-m', commit_message], check=True)
            subprocess.run(['git', '-C', clone_path, 'push'], check=True)
            return "Changes pushed to the remote repository successfully."
    except subprocess.CalledProcessError as e:
            return f"Error processing Git operations: {e}"
    """else:
        create_file = input(f"File {file_name} not found in the repository at {clone_path}. Do you want to create the file? (yes/no): ").lower()
        if create_file == 'yes':
            file_path = os.path.join(clone_path, file_name)
            open(file_path, 'w').close()
            print(f"File {file_name} created.")
            open_in_vscode(file_path)
        else:
            print("Operation canceled. Exiting.")"""

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process repository name, base URL, and file name.")
    parser.add_argument("repo_name", type=str, help="The name of the repository to process")
    parser.add_argument("base_url", type=str, help="The base URL of the repository")
    parser.add_argument("file_name", type=str, help="The name of the file to open or create")
    parser.add_argument("commit_message", type=str, help="The name of the file to open or create")
    args = parser.parse_args()

    print(main(args.repo_name, args.base_url, args.file_name,args.commit_message))
### 1 follow-up question: Enter the repo name:
### 2 follow-up question: Enter the name of the file you want to commit (including extension):  --> file_name

#python3 commit_after_change.py MortgageApplication https://github.com/ratnamGT hello.cbl changed