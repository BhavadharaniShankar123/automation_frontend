import os
import subprocess
import argparse

def find_file_in_repo(repo_path, file_name):
    """Search for the file in the repo and return its path if found."""
    for root, dirs, files in os.walk(repo_path):
        if file_name in files:
            return os.path.join(root, file_name)
    return None

def open_in_vscode(file_path):
    """Open the file in VSCode."""
    try:
        subprocess.run(["code", file_path], check=True)
        return "File opened"
    except FileNotFoundError:
        return "VSCode not installed"
    except subprocess.CalledProcessError as e:
        return f"Error opening file in VSCode: {e}"

def main(repo_name, base_url, file_name, active_folder_path):
    """Main function to clone the repo and open the file."""
    workspace_path = os.getcwd()
    repo_url = f"{base_url}/{repo_name}.git"
    clone_path = os.path.join(active_folder_path, repo_name)  # Use the active folder path

    # Find the file in the repository (including subdirectories)
    file_path = find_file_in_repo(clone_path, file_name)

    if file_path:
        result = open_in_vscode(file_path)
        return f"Successfully opened: {file_path}" if result == "File opened" else result
    else:
        return f"File '{file_name}' not found in repository '{repo_name}'."

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process repository name, base URL, file name, and active folder path.")
    parser.add_argument("repo_name", type=str, help="The name of the repository to process")
    parser.add_argument("base_url", type=str, help="The base URL of the repository")
    parser.add_argument("file_name", type=str, help="The name of the file which is to open")
    parser.add_argument("active_folder_path", type=str, help="The path of the active workspace folder")
    args = parser.parse_args()

    result = main(args.repo_name, args.base_url, args.file_name, args.active_folder_path)
    print(result)
