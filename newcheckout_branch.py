import subprocess
import os
import yaml
import argparse

def list_branches(repo_path):
    """List all available branches in the repository."""
    try:
        result = subprocess.run(['git', '-C', repo_path, 'branch', '-a'], check=True, text=True, capture_output=True)
        return result.stdout.strip().split('\n')
    except subprocess.CalledProcessError as e:
        print(f"Error listing branches: {e}")
        return []    

def is_git_repo(folder_path):
    return os.path.isdir(os.path.join(folder_path, ".git"))            


def checkout_branch(repo_path, branch_name):
    """Try to checkout a branch, handle errors, and fallback if needed."""
    try:
        subprocess.run(['git', '-C', repo_path, 'checkout', branch_name], check=True)
        return f"Checked out branch '{branch_name}'."
    except subprocess.CalledProcessError as e:
        print(f"Error checking out branch '{branch_name}': {e}")
        fallback_branch = "main"  # Default fallback branch
        print(f"Attempting to checkout fallback branch '{fallback_branch}'.")
        try:
            subprocess.run(['git', '-C', repo_path, 'checkout', fallback_branch], check=True)
            return f"Checked out fallback branch '{fallback_branch}' successfully."
        except subprocess.CalledProcessError as fallback_error:
            print(f"Failed to checkout fallback branch '{fallback_branch}': {fallback_error}")


def push_branch(repo_path, branch_name):
    """Push a new branch to the remote repository."""
    try:
        subprocess.run(['git', '-C', repo_path, 'push', '-u', 'origin', branch_name], check=True)
        return f"Branch '{branch_name}' pushed to remote repository."
    except subprocess.CalledProcessError as e:
        return f"Error pushing branch '{branch_name}': {e}"


def main(repo_name, base_url,new_branch_name):
    workspace_path = os.getcwd()
    repo_url = f"{base_url}/{repo_name}.git"
    clone_path = os.path.join(workspace_path, repo_name)

    #new_branch_name = input("Enter the name of the new branch: ").strip()
    try:
        subprocess.run(['git', '-C', clone_path, 'checkout', '-b', new_branch_name], check=True)
        print(f"Created and switched to new branch '{new_branch_name}'.")
        push_branch(clone_path, new_branch_name)
    except subprocess.CalledProcessError as e:
        print(f"Error creating new branch '{new_branch_name}': {e}")
    # else:
    #     print("No branches found.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process repository name and base URL.")
    parser.add_argument("repo_name", type=str, help="The name of the repository to process")
    parser.add_argument("base_url", type=str, help="The base URL of the repository")
    parser.add_argument("new_branch_name", type=str, help="It will create a new feature branch")
    args = parser.parse_args()

    print(main(args.repo_name, args.base_url, args.new_branch_name))

# enter the repo name
#Enter the name of the new branch: 

#python3 new_branch.py MortgageApplication https://github.com/ratnamGT MortApp