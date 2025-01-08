import requests
import time

def check_internet_connection():
    """Checks if there is an active internet connection."""
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

            print("Internet connection is available.")
            print(f"Speed: {speed_kbps:.2f} KB/s ({speed_mbps:.2f} MB/s)")
            return True
        else:
            print("No internet connection.")
            return False

    except (requests.ConnectionError, requests.Timeout):
        print("No internet connection.")
        return False



def main():

    if not check_internet_connection():
        print("No internet. Please check your connection and try again.")
        return

main()


