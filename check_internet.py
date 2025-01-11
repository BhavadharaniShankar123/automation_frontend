# import requests
# import time

# def check_internet_connection():
#     """Checks if there is an active internet connection."""
#     test_url = 'https://www.google.com'
#     timeout = 5
#     try:
#         start_time = time.time()
#         response = requests.get(test_url, timeout=timeout)
#         end_time = time.time()

#         if response.status_code == 200:
#             elapsed_time = end_time - start_time
#             content_size = len(response.content)

#             speed_bps = content_size / elapsed_time
#             speed_kbps = speed_bps / 1024
#             speed_mbps = speed_kbps / 1024

#             print("Internet connection is available.")
#             print(f"Speed: {speed_kbps:.2f} KB/s ({speed_mbps:.2f} MB/s)")
#             return True
#         else:
#             print("No internet connection.")
#             return False

#     except (requests.ConnectionError, requests.Timeout):
#         print("No internet connection.")
#         return False



# def main():

#     if not check_internet_connection():
#         print("No internet. Please check your connection and try again.")
#         return

# main()


import requests
import time
from datetime import datetime
import argparse

def log_to_file(message, LOG_FILE):
    """Logs a message to the log file with a timestamp and prints it to the terminal."""
    with open(LOG_FILE, "a") as log_file:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"{timestamp} - {message}\n"
        log_file.write(log_message)
        log_file.write("-" * 40 + "\n")  # Separator for readability
        print(log_message)  # Print the message to the terminal


def check_internet_connection(LOG_FILE):
    """Checks if there is an active internet connection and logs the result."""
    test_url = 'https://www.google.com'
    timeout = 5
    try:
        start_time = time.time()
        response = requests.get(test_url, timeout=timeout)
        end_time = time.time()

        if response.status_code == 200:
            elapsed_time = end_time - start_time
            content_size = len(response.content)

            speed_bps = content_size / elapsed_time
            speed_kbps = speed_bps / 1024
            speed_mbps = speed_kbps / 1024

            message = (
                "Internet connection is available.\n"
                f"Speed: {speed_kbps:.2f} KB/s ({speed_mbps:.2f} MB/s)"
            )
            log_to_file(message, LOG_FILE)
            return True
        else:
            message = "No internet connection."
            log_to_file(message, LOG_FILE)
            return False

    except (requests.ConnectionError, requests.Timeout):
        message = "No internet connection."
        log_to_file(message, LOG_FILE)
        return False


def main(active_path):
    LOG_FILE = f"{active_path}/internet_connection_log.txt"
    
    # Check the internet connection and log it
    if not check_internet_connection(LOG_FILE):
        print("No internet. Please check your connection and try again.")

if __name__ == "__main__":
    #active_path = "/Users/thrisham/Desktop/cobol_code/mainframe_final"  # Set the path as needed
    #main(active_path)

    parser = argparse.ArgumentParser(description="Process repository name and base URL.")
    
    # Add arguments for repo_name and base_url
    #parser.add_argument("repo_name", type=str, help="The name of the repository to process")
    #parser.add_argument("base_url", type=str, help="The base URL of the repository")
    parser.add_argument("active_path", type=str, help="It will download in the current path")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Call the main function with the provided arguments
    result = main(args.active_path)


