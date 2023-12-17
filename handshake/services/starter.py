from handshake.services.CommandLine.center import handle_cli
import sys
from multiprocessing import freeze_support

if __name__ == "__main__":
    freeze_support()
    handle_cli(sys.argv[1:])
