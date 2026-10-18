"""Serve the public-site mockups on a loopback address.

From the project root:

    python design/mockups/serve.py --detach

--detach starts the server as a background process with no window that keeps running after the
terminal or agent session that started it ends, waits until http://127.0.0.1:8765/ answers, and
prints the address. If a server already answers on the port it says so and starts nothing. Without
--detach the server runs in the foreground. The pages read data/ from the ignored
artifacts/mockup-data/ (build it first with build_data.py)
and offer the tracked results/ tables of the project checkout as downloads under files/, with the rows
for independent and third-party candidates removed, because the site shows Democratic and Republican
candidates only. It also serves the treatment specimens in design/treatments/ under /treatments/.
"""
import csv
import functools
import io
import http.server
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parents[1]
ROUTES = {"/treatments/": HERE.parent / "treatments",
          "/instrument/": HERE.parent / "instrument",
          "/data/": PROJECT / "artifacts" / "mockup-data",
          "/files/": PROJECT / "results"}


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path.startswith("/files/") and path.endswith(".csv"):
            src = ROUTES["/files/"] / Path(path).name
            if not src.is_file():
                return self.send_error(404)
            rows = list(csv.reader(open(src, encoding="utf-8", newline="")))
            col = rows[0].index("party_group") if "party_group" in rows[0] else None
            out = io.StringIO()
            csv.writer(out, lineterminator="\n").writerows(
                r for i, r in enumerate(rows) if col is None or i == 0 or r[col] in ("Democratic", "Republican"))
            body = out.getvalue().encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", f'attachment; filename="{src.name}"')
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def translate_path(self, path):
        path = path.split("?", 1)[0].split("#", 1)[0]
        for prefix, root in ROUTES.items():
            if path.startswith(prefix):
                return str(root / path[len(prefix):])
        return super().translate_path(path)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass


def answers(url):
    try:
        return urllib.request.urlopen(url, timeout=2).status == 200
    except OSError:
        return False


if __name__ == "__main__":
    if not (ROUTES["/data/"] / "site.json").exists():
        sys.exit("Build the data first: build_data.py (see its docstring).")
    args = [a for a in sys.argv[1:] if a != "--detach"]
    port = int(args[0]) if args else 8765
    url = f"http://127.0.0.1:{port}/"
    if "--detach" in sys.argv:
        if answers(url):
            sys.exit(f"Already serving {url}")
        flags = getattr(subprocess, "DETACHED_PROCESS", 0) | getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)             | getattr(subprocess, "CREATE_NO_WINDOW", 0)
        subprocess.Popen([sys.executable, __file__, str(port)], creationflags=flags, close_fds=True,
                         stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                         start_new_session=sys.platform != "win32")
        for _ in range(50):
            if answers(url):
                sys.exit(f"Serving {url} in the background")
            time.sleep(0.2)
        sys.exit(f"The server did not answer at {url}")
    class Server(http.server.ThreadingHTTPServer):
        request_queue_size = 128   # a page loads several scripts at once; the default of 5 refuses some

    server = Server(("127.0.0.1", port), functools.partial(Handler, directory=str(HERE)))
    print(f"http://127.0.0.1:{port}/")
    server.serve_forever()
