import subprocess
import os
import yaml
import argparse


def is_git_repo(folder_path):
    """Check if a folder is a valid Git repository."""
    return os.path.isdir(os.path.join(folder_path, ".git"))


def list_branches(repo_path):
    """List all available branches in the repository."""
    try:
        result = subprocess.run(['git', '-C', repo_path, 'branch', '-a'], check=True, text=True, capture_output=True)
        return result.stdout.strip().split('\n')
    except subprocess.CalledProcessError as e:
        print(f"Error listing branches: {e}")
        return []


def main(repo_name, dir_path, active_folder_path):
    """Main function to process the repository."""
    workspace_path = os.path.join(dir_path, active_folder_path)
    clone_path = os.path.join(workspace_path, repo_name)

    if not is_git_repo(clone_path):
        return f"Error: {clone_path} is not a valid Git repository."

    branches = list_branches(clone_path)
    if branches:
        print("Available branches:")
        for branch in branches:
            print(branch)
        return branches
    else:
        return "No branches found."


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
