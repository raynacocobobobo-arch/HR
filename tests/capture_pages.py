import functools
import http.server
import pathlib
import socketserver
import threading

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "screenshots"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PAGES = {
    "工作台": "01-workbench.png",
    "项目": "02-projects.png",
    "人员": "03-people.png",
    "档期": "04-schedule.png",
    "工时": "05-time.png",
    "成本": "06-cost.png",
    "报表": "07-reports.png",
    "模板与设置": "08-settings.png",
}


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        pass


OUTPUT.mkdir(exist_ok=True)
handler = functools.partial(QuietHandler, directory=ROOT)
server = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
url = f"http://127.0.0.1:{server.server_address[1]}/"

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(url, wait_until="networkidle")
        for label, filename in PAGES.items():
            page.get_by_role("button", name=label, exact=True).click()
            page.screenshot(path=OUTPUT / filename, full_page=True)
            print(f"captured {label}: screenshots/{filename}")
        browser.close()
finally:
    server.shutdown()
    server.server_close()
    thread.join()
