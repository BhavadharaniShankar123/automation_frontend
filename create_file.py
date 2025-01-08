import os
import subprocess
import argparse

def find_file_in_repo(repo_path, file_name):
    """Search for the file in the repository folder and subfolders."""
    for root, _, files in os.walk(repo_path):
        if file_name in files:
            return os.path.join(root, file_name)
    return None

def open_in_vscode(file_path):
    """Open the specified file in VSCode."""
    try:
        subprocess.run(["code", file_path], check=True)
        print(f"File opened in VSCode: {file_path}")
    except FileNotFoundError:
        print("VSCode is not installed. Please install VSCode from https://code.visualstudio.com/")
    except subprocess.CalledProcessError as e:
        print(f"Error opening file in VSCode: {e}")

def main(repo_name, base_url, file_name, active_folder_path):
    """Main function to clone the repo, find or create the file, and open it."""
    repo_url = f"{base_url}/{repo_name}.git"
    clone_path = os.path.join(active_folder_path, repo_name)

   
    if not os.path.exists(clone_path):
        print(f"Cloning repository {repo_name}...")
        subprocess.run(["git", "clone", repo_url, clone_path], check=True)
    else:
        print(f"Repository {repo_name} already exists.")

   
    file_path = find_file_in_repo(clone_path, file_name)
    if file_path:
        print(f"File {file_name} found in the repository.")
    else:
      
        file_path = os.path.join(active_folder_path, file_name)
        open(file_path, 'w').close()
        print(f"File {file_name} not found in the repository. Created new file at: {file_path}")

   
    open_in_vscode(file_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process repository name, base URL, file name, and active folder path.")
    parser.add_argument("repo_name", type=str, help="The name of the repository to process")
    parser.add_argument("base_url", type=str, help="The base URL of the repository")
    parser.add_argument("file_name", type=str, help="The name of the file to open or create")
    parser.add_argument("active_folder_path", type=str, help="The path of the active workspace folder")
    args = parser.parse_args()

    main(args.repo_name, args.base_url, args.file_name, args.active_folder_path)

