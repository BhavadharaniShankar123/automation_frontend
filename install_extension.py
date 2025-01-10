# import yaml
# import subprocess
# import argparse

# def load_extensions_from_yaml(file_path):
#     """Loads the list of required extensions from the YAML file."""
#     try:
#         with open(file_path, 'r') as file:
#             data = yaml.safe_load(file)
#             return data.get('required_extensions', [])
#     except FileNotFoundError:
#         print(f"YAML file not found at {file_path}")
#         return []
#     except yaml.YAMLError as e:
#         print(f"Error reading YAML file: {e}")
#         return []
    
# def get_installed_extensions():
#     """Returns a list of installed VSCode extensions."""
#     try:
#         result = subprocess.run(['code', '--list-extensions'], stdout=subprocess.PIPE, text=True, check=True)
#         installed_extensions = result.stdout.splitlines()
#         return installed_extensions
#     except subprocess.CalledProcessError as e:
#         print(f"Error listing extensions: {e}")
#         return []


# def install_extension(extension):
#     """Installs the given VSCode extension."""
#     try:
#         print(f"Installing extension: {extension}")
#         subprocess.run(['code', '--install-extension', extension, '--force'], check=True)
#         return f"Extension {extension} installed successfully."
#     except subprocess.CalledProcessError as e:
#         return f"Error installing extension {extension}: {e}"



# def main(required_extensions):
#     installed_extensions = get_installed_extensions()
#     results = []
#     for extension in required_extensions:
#         if extension not in installed_extensions:
#             print(f"Extension {extension} is not installed. Installing...")
#             results.append(install_extension(extension))
#         else:
#             results.append(f"Extension {extension} is already installed.")  
    
#     return results

    

# if __name__ == "__main__":
#     parser = argparse.ArgumentParser(description="Install and verify VSCode extensions.")
#     parser.add_argument("required_extensions", type=str,nargs="+", help="List of extension to be installed")
#     args = parser.parse_args()

#     print( '\n',main(args.required_extensions))

import yaml
import subprocess
import argparse
from datetime import datetime

#LOG_FILE = f"{active_path}/internet_connection_log.txt"

def log_to_file(message,LOG_FILE):
    """Logs a message to the log file with a timestamp."""
    with open(LOG_FILE, "a") as log_file:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_file.write(f"{timestamp} - {message}\n")
        log_file.write("-" * 40 + "\n")  # Separator for readability

def load_extensions_from_yaml(file_path,LOG_FILE):
    """Loads the list of required extensions from the YAML file."""
    try:
        with open(file_path, 'r') as file:
            data = yaml.safe_load(file)
            return data.get('required_extensions', [])
    except FileNotFoundError:
        message = f"YAML file not found at {file_path}"
        print(message)
        log_to_file(message,LOG_FILE)
        return []
    except yaml.YAMLError as e:
        message = f"Error reading YAML file: {e}"
        print(message)
        log_to_file(message,LOG_FILE)
        return []

def get_installed_extensions(LOG_FILE):
    """Returns a list of installed VSCode extensions."""
    try:
        result = subprocess.run(['code', '--list-extensions'], stdout=subprocess.PIPE, text=True, check=True)
        return result.stdout.splitlines()
    except subprocess.CalledProcessError as e:
        message = f"Error listing extensions: {e}"
        print(message)
        log_to_file(message,LOG_FILE)
        return []

def install_extension(extension,LOG_FILE):
    """Installs the given VSCode extension."""
    try:
        print(f"Installing extension: {extension}")
        subprocess.run(['code', '--install-extension', extension, '--force'], check=True)
        message = f"Extension {extension} installed successfully."
        log_to_file(message,LOG_FILE)
        return message
    except subprocess.CalledProcessError as e:
        message = f"Error installing extension {extension}: {e}"
        log_to_file(message,LOG_FILE)
        return message

def main(required_extensions,active_path):
    LOG_FILE = f"{active_path}/internet_connection_log.txt"
    installed_extensions = get_installed_extensions(LOG_FILE)
    results = []
    for extension in required_extensions:
        if extension not in installed_extensions:
            print(f"Extension {extension} is not installed. Installing...")
            results.append(install_extension(extension,LOG_FILE))
        else:
            message = f"Extension {extension} is already installed."
            print(message)
            log_to_file(message,LOG_FILE)
            results.append(message)
    
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Install and verify VSCode extensions.")
    parser.add_argument("required_extensions", type=str, nargs="+", help="List of extensions to be installed")
    parser.add_argument("active_path", type=str, help="It will download in the current path")
    args = parser.parse_args()

    results = main(args.required_extensions,args.active_path)
    for result in results:
        print(result)

#   python3 extension_log.py IBM.zopeneditor ms-vscode-remote.remote-ssh {path}