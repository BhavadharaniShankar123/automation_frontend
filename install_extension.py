import yaml
import subprocess
import argparse

def load_extensions_from_yaml(file_path):
    """Loads the list of required extensions from the YAML file."""
    try:
        with open(file_path, 'r') as file:
            data = yaml.safe_load(file)
            return data.get('required_extensions', [])
    except FileNotFoundError:
        print(f"YAML file not found at {file_path}")
        return []
    except yaml.YAMLError as e:
        print(f"Error reading YAML file: {e}")
        return []
    
def get_installed_extensions():
    """Returns a list of installed VSCode extensions."""
    try:
        result = subprocess.run(['code', '--list-extensions'], stdout=subprocess.PIPE, text=True, check=True)
        installed_extensions = result.stdout.splitlines()
        return installed_extensions
    except subprocess.CalledProcessError as e:
        print(f"Error listing extensions: {e}")
        return []


def install_extension(extension):
    """Installs the given VSCode extension."""
    try:
        print(f"Installing extension: {extension}")
        subprocess.run(['code', '--install-extension', extension, '--force'], check=True)
        return f"Extension {extension} installed successfully."
    except subprocess.CalledProcessError as e:
        return f"Error installing extension {extension}: {e}"



def main(required_extensions):
    installed_extensions = get_installed_extensions()
    results = []
    for extension in required_extensions:
        if extension not in installed_extensions:
            print(f"Extension {extension} is not installed. Installing...")
            results.append(install_extension(extension))
        else:
            results.append(f"Extension {extension} is already installed.")  
    
    return results

    

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Install and verify VSCode extensions.")
    parser.add_argument("required_extensions", type=str,nargs="+", help="List of extension to be installed")
    args = parser.parse_args()

    print( '\n',main(args.required_extensions))
