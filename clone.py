import os
import subprocess
import shutil
import argparse

def clone_repo(repo_url, clone_path):
    try:
        subprocess.run(['git', 'clone', repo_url, clone_path], check=True)
        return f"Repository cloned successfully to {clone_path}."
    except subprocess.CalledProcessError as e:
        return f"Error cloning repository: {e}"

def is_git_repo(folder_path):
    return os.path.isdir(os.path.join(folder_path, ".git"))

def pull_latest_changes(repo_path):
    try:
        subprocess.run(['git', '-C', repo_path, 'pull'], check=True)
        return "Latest changes pulled successfully."
    except subprocess.CalledProcessError as e:
        return f"Error pulling latest changes: {e}"

def delete_folder(folder_path):
    permission = input(f"The folder '{folder_path}' is not a git repository. Do you want to delete it? (yes/no): ").lower()
    if permission == 'yes':
        shutil.rmtree(folder_path)
        print(f"Folder '{folder_path}' deleted.")
        return True
    else:
        print("Operation canceled. Exiting.")
        return False

def main(repo_name, base_url, dir_path):
    workspace_path = dir_path
    repo_url = f"{base_url}/{repo_name}.git"
    clone_path = os.path.join(workspace_path, repo_name)

    if not os.path.isdir(clone_path):
        return clone_repo(repo_url, clone_path)

    if is_git_repo(clone_path):
        return pull_latest_changes(clone_path)
    else:
        if delete_folder(clone_path):
            return clone_repo(repo_url, clone_path)
        else:
            return

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process repository name, base URL, and directory path.")
    
    parser.add_argument("repo_name", type=str, help="The name of the repository to process")
    parser.add_argument("base_url", type=str, help="The base URL of the repository")
    parser.add_argument("dir_path", type=str, help="The path where the repository should be cloned")
    
    args = parser.parse_args()
    
    
    print(main(args.repo_name, args.base_url, args.dir_path))


