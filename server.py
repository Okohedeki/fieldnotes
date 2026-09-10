"""Serve Fieldnotes locally; no external dependencies or network services."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial
import argparse
import webbrowser

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8879)
parser.add_argument('--open', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parent
server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(SimpleHTTPRequestHandler, directory=str(root)))
url = f'http://127.0.0.1:{args.port}'
print(f'Fieldnotes is ready at {url}', flush=True)
if args.open:
    webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
