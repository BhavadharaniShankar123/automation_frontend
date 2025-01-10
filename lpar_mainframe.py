import os, json
from getpass import getpass
import webbrowser
import shutil
import paramiko
import yaml
import argparse


def load_config(yaml_file='vscode_extension.yaml'):  # Default file name
    script_dir = os.path.dirname(os.path.realpath(__file__))  # Get the directory of the running script
    yaml_path = os.path.join(script_dir, yaml_file)  # Construct the full path to the YAML file
    if os.path.exists(yaml_path):
        with open(yaml_path, 'r') as file:
            config = yaml.safe_load(file)
        return config
    else:
        raise FileNotFoundError(f"Configuration file '{yaml_file}' not found at path: {yaml_path}")

def create_ssh_connection(hostname, port, username, password):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(hostname=hostname, port=port, username=username, password=password)
        print("Connection successful!")
        stdin, stdout, stderr = ssh.exec_command("pwd")
        mainframe_pwd = stdout.read().decode().strip()
        print(f"Mainframe working directory: {mainframe_pwd}")
        return ssh, mainframe_pwd
    except Exception as e:
        print(f"SSH connection failed: {e}")
    return None, None


def check_and_create_directories(ssh, mainframe_pwd, application, workspace_name="sandbox1"):
    try:
        # Dynamically construct paths
        workspace_path = f"{mainframe_pwd}/{workspace_name}"
        application_path = f"{workspace_path}/{application}"

        # Ensure workspace directory exists
        print(f"Ensuring workspace directory: {workspace_path}")
        stdin, stdout, stderr = ssh.exec_command(f"mkdir -p {workspace_path}")
        if stderr.read().strip():
            raise Exception(f"Failed to create workspace directory: {workspace_path}")

        # Ensure application directory exists
        print(f"Ensuring application directory: {application_path}")
        stdin, stdout, stderr = ssh.exec_command(f"mkdir -p {application_path}")
        if stderr.read().strip():
            raise Exception(f"Failed to create application directory: {application_path}")

        return workspace_path, application_path
    except Exception as e:
        print(f"Error creating directories: {e}")
        return None, None


def check_or_clone_repository(ssh, repo_url, application_path):
    """
    Check if a Git repository exists on the mainframe.
    If not, clone the repository. If it exists, pull the latest changes.
    """
    try:
        # Check if the repository already exists
        check_git_repo_cmd = f"if [ -d {application_path}/.git ]; then echo 'found'; else echo 'not_found'; fi"
        stdin, stdout, stderr = ssh.exec_command(check_git_repo_cmd)
        repo_status = stdout.read().decode().strip()

        if repo_status == 'not_found':
            print(f"No Git repository found at {application_path}. Cloning the repository...")
            clone_command = f"""
                export GIT_SHELL=/usr/lpp/Rocket/rsusr/ported/bin/bash && \
                export GIT_EXEC_PATH=/usr/lpp/Rocket/rsusr/ported/libexec/git-core && \
                export GIT_TEMPLATE_DIR=/usr/lpp/Rocket/rsusr/ported/share/git-core/templates && \
                export GIT_MAN_PATH=/usr/lpp/Rocket/rsusr/ported/share/man && \
                export PATH=$PATH:/usr/lpp/Rocket/rsusr/ported/bin && \
                git clone {repo_url} {application_path}
            """
            stdin, stdout, stderr = ssh.exec_command(clone_command)
            clone_output = stdout.read().decode().strip()
            clone_error = stderr.read().decode().strip()
            if clone_error:
                raise Exception(f"Clone error: {clone_error}")
            print("Repository cloned successfully.")
        else:
            print(f"Repository already exists at {application_path}. Pulling latest changes...")
            pull_command = f"""
                export GIT_SHELL=/usr/lpp/Rocket/rsusr/ported/bin/bash && \
                export GIT_EXEC_PATH=/usr/lpp/Rocket/rsusr/ported/libexec/git-core && \
                export GIT_TEMPLATE_DIR=/usr/lpp/Rocket/rsusr/ported/share/git-core/templates && \
                export GIT_MAN_PATH=/usr/lpp/Rocket/rsusr/ported/share/man && \
                export PATH=$PATH:/usr/lpp/Rocket/rsusr/ported/bin && \
                cd {application_path} && git pull
            """
            stdin, stdout, stderr = ssh.exec_command(pull_command)
            pull_output = stdout.read().decode().strip()
            pull_error = stderr.read().decode().strip()
            if pull_error:
                raise Exception(f"Pull error: {pull_error}")
            print("Latest changes pulled successfully.")
    except Exception as e:
        print(f"Error during repository setup: {e}")    



# Search for the Absolute Path of the Source File Dynamically
def find_source_file(ssh, application_path, filename):
    try:
        print(f"Searching for '{filename}' in '{application_path}'...")

        # Case-sensitive search using `-name`
        find_command = f"find {application_path} -type f -name \"{filename}\""
        print(f"Executing: {find_command}")

        stdin, stdout, stderr = ssh.exec_command(find_command)
        file_path = stdout.read().decode().strip()  # Capture the found file path
        error_output = stderr.read().decode().strip()  # Capture any error output

        print(f"Find Command Output: {file_path}")
        if error_output:
            print(f"Find Command Errors: {error_output}")

        # If file is not found and case sensitivity might be an issue
        if not file_path:
            print(f"File not found using exact name match. Trying case-insensitive search...")
            list_command = f"ls -R {application_path}"
            stdin, stdout, stderr = ssh.exec_command(list_command)
            all_files = stdout.read().decode().strip().split("\n")
            matching_files = [f for f in all_files if filename.lower() in f.lower()]
            
            if matching_files:
                file_path = f"{application_path}/{matching_files[0]}"
                print(f"Case-insensitive match found: {file_path}")
            else:
                raise FileNotFoundError(f"Source file '{filename}' not found in the application directory.")

        return file_path  # Return the found file path
    except Exception as e:
        print(f"Error finding source file: {e}")
        return None
    

# Run mainframe commands and log messages to a file
def run_mainframe_commands(ssh, hlq, application, filename, file_path, config, workspace, outdir):
    try:
        folder_name = os.path.dirname(file_path) if file_path else ""
        
        if not folder_name:
            raise ValueError("Cannot determine the folder name. The source file path is invalid.")
        
        print(f"Ensuring output directory exists: {outdir}")
        ssh.exec_command(f"mkdir -p {outdir}")
        
        groovyzpath = config.get('groovyzpath')
        zappbuildpath = config.get('zappbuildpath')
        
        if not groovyzpath or not zappbuildpath:
            raise ValueError("Missing groovyzpath or zappbuildpath in configuration.")
        
        # Construct the command
        uss_command = (
            f". ~/.profile && "
            f"{groovyzpath} "
            f"{zappbuildpath} -DBB_PERSONAL_DAEMON --workspace {workspace} "
            f"--application {application} --outDir {outdir} "
            f"--hlq {hlq} {folder_name}/{filename} --verbose"
        )

# Executing USS Command: /u/gmszfs/dbb20/usr/lpp/IBM/dbb/bin/groovyz -DBB_PERSONAL_DAEMON /u/gmsratn/zAppbuild20/Development/build.groovy 
# --workspace /u/gmsratn/workspace --application MortgageApplication --outDir /u/gmsratn/outdir 
# --hlq GMSRATN /u/gmsratn/workspace/MortgageApplication/cobol/hello.cbl --verbose
        print(f"Executing USS Command: {uss_command}")
        
        # Execute the command and stream output in real-time
        stdin, stdout, stderr = ssh.exec_command(uss_command)
        
        stdout_output = []
        stderr_output = []

        print("Command output (stdout):")
        for line in iter(stdout.readline, ""):
            print(line.strip())
            stdout_output.append(line.strip())

        print("Command error output (stderr):")
        for line in iter(stderr.readline, ""):
            print(line.strip())
            stderr_output.append(line.strip())

        # Join outputs to return as a single string
        return "\n".join(stdout_output), "\n".join(stderr_output)
    except Exception as e:
        error_message = f"Failed to execute build command: {e}"
        print(error_message)
        return None, error_message



# Analyze Logs and Display Build Status
def analyze_build_logs(output, error_output):
    if error_output:
        print("Build failed.")
        print(f"Error Logs:\n{error_output}")
    else:
        print("Build succeeded.")
        print(f"Build Output:\n{output}")


def main(repo_name, git_url, username, password , hlq ,filename, lpar_details):
    # ssh_config = load_config("timeout_dynamic.yaml")
    # config_path = "application_details.yaml"
    # config = load_config(config_path)

    # if config is None:
    #     print("Error loading configuration.")
    #     return

    #current_dir = os.path.dirname(os.path.abspath(__file__))
    #workspace_path = input("Enter the VS Code workspace path (press enter to use the current directory): ") or current_dir
    #clone_path = os.path.join(workspace_path, repo_name)
    repo_url = f"{git_url}/{repo_name}.git"

    # lpar_list = list(ssh_config.keys())
    # print("Available Mainframe LPARs:")
    # for idx, lpar in enumerate(lpar_list):
    #     print(f"{idx + 1}. {lpar}")

    # selected_idx = int(input("Select your target LPAR by number: ")) - 1
    # selected_lpar = lpar_list[selected_idx]
    # lpar_details = ssh_config[selected_lpar]

    # app_list = [config['repositories']['git_Application']]
    # print("Available applications:")
    # for idx, app in enumerate(app_list):
    #     print(f"{idx + 1}. {app}")

    # app_idx = int(input("Select your application by number: ")) - 1
    # application_name = app_list[app_idx]
    # main_build_branch = config['repositories']['main_build_branch']
    lpar_details = json.loads(lpar_details)
    lpar_values = lpar_details.values()
    data_list = list(lpar_values)

# Access the first dictionary in the list
    first_dict = data_list[0]
    hostname = first_dict.get('mfip')
    # print(hostname)
    # print(type(hostname))
    
    port = int(first_dict.get('sshport', 22))
    # print(port)
    # print(type(port))
    #username = input("Enter your username: ")
    #password = getpass("Enter your password: ")
    #hlq = input("Enter your HLQ: ")

    ssh_client, mainframe_pwd = create_ssh_connection('13.233.106.52', '2022', username, password)

    if ssh_client and mainframe_pwd:
        sftp = ssh_client.open_sftp()
        try:
            workspace_name = "sandbox1"
            outdir = f"{mainframe_pwd}/outdir"
            workspace_path, application_path = check_and_create_directories(
                ssh_client, mainframe_pwd, repo_name, workspace_name
            )

            if workspace_path and application_path:
                print("Cloning the repository from GitHub to the mainframe...")
                check_or_clone_repository(ssh_client, repo_url, application_path)

                #filename = input("Enter the filename: ")
                file_path = find_source_file(ssh_client, application_path, filename)

                if file_path:
                    output, error_output = run_mainframe_commands(
                        ssh_client, hlq, repo_name, filename, file_path, lpar_details, workspace_path, outdir
                    )
                    analyze_build_logs(output, error_output)
        finally:
            sftp.close()
            ssh_client.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mainframe Git repository processing.")
    parser.add_argument("repo_name", type=str, help="The name of the repository")
    parser.add_argument("base_url", type=str, help="The Git base URL")
    parser.add_argument("username", type=str, help="username to login into the mainframe")
    parser.add_argument("password", type=str, help="password to login into the mainframe")
    parser.add_argument("hlq", type=str, help="hlq to login into the mainframe")
    parser.add_argument("filename", type=str, help="Filename to execute the uss command")
    parser.add_argument("lpar_details", type=str, help="Get the the path to run USSz")

    args = parser.parse_args()

    main(args.repo_name, args.base_url,args.username, args.password , args.hlq , args.filename , args.lpar_details)


#follow up question:

#repo name
#username "Enter your username: 
# password Enter your password: 
# hlq = Enter your HLQ: 
# Enter the filename: 

# GMSRATN
#python3 lpar_mainframe.py MortgageApplication  https://github.com/gmsadmin-git GMSRATN gmsrat GMSRATN 

# """python3 lpar_mainframe.py MortgageApplication https://github.com/gmsadmin-git GMSRATN gmsrat GMSRATN '{"gmsmf": {"mfip": "13.201.47.154", "sshport": "2022", "groovyzpath": "/u/gmszfs/dbb20/usr/lpp/IBM/dbb/bin/groovyz", "zappbuildpath": "/u/gmsratn/zAppbuild20/Development/build.groovy"}, "gmsstest": {"mfip": "13.201.47.154", "sshport": "2022", "groovyzpath": "$DBB_HOME/bin/groovyz.", "zappbuildpath": "/u/gmszfs/zAppbuild20/Development/build.groovy."}}'
# """


#    python3 lpar_mainframe.py MortgageApplication https://github.com/gmsadmin-git GMSRATN gmsrat GMSRATN hello.cbl '{"gmsmf": {"mfip": "13.233.106.52", "sshport": "2022", "groovyzpath": "/u/gmszfs/dbb20/usr/lpp/IBM/dbb/bin/groovyz",  "zappbuildpath": "/u/gmsratn/zAppbuild20/build.groovy"}}'