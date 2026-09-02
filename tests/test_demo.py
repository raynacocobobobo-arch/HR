import functools
import http.server
import pathlib
import socketserver
import threading
import unittest

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parents[1]
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        pass


class DemoContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        handler = functools.partial(QuietHandler, directory=ROOT)
        cls.server = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
        cls.server_thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.server_thread.start()
        cls.base_url = f"http://127.0.0.1:{cls.server.server_address[1]}/"
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(
            headless=True,
            executable_path=CHROME,
        )

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.server_thread.join()

    def setUp(self):
        self.page = self.browser.new_page(viewport={"width": 1440, "height": 900})
        self.page.goto(self.base_url, wait_until="networkidle")

    def tearDown(self):
        self.page.close()

    def test_eight_object_pages_are_reachable_from_navigation(self):
        expected = ["工作台", "项目", "人员", "档期", "工时", "成本", "报表", "模板与设置"]
        navigation = self.page.locator("[data-nav]")

        self.assertEqual(navigation.count(), 8)
        self.assertEqual(navigation.all_inner_texts(), expected)

        for label in expected:
            self.page.get_by_role("button", name=label, exact=True).click()
            view = self.page.locator(f'[data-view="{label}"]')
            self.assertTrue(view.is_visible(), f"{label} page should be visible")
            self.assertEqual(
                self.page.locator('[data-nav][aria-current="page"]').inner_text(),
                label,
            )

    def test_page_explanation_follows_the_selected_object(self):
        explanation = self.page.get_by_role("complementary", name="功能与原理")
        self.assertEqual(explanation.count(), 1)

        self.page.get_by_role("button", name="成本", exact=True).click()
        self.assertIn("计划成本", explanation.inner_text())
        self.assertIn("实际成本", explanation.inner_text())
        self.assertIn("完工预测", explanation.inner_text())
        self.assertIn("OpenProject", explanation.inner_text())

        self.page.get_by_role("button", name="档期", exact=True).click()
        self.assertIn("Timefold", explanation.inner_text())
        self.assertIn("人工确认", explanation.inner_text())

    def test_project_page_shows_all_seven_phase_gates(self):
        project_nav = self.page.get_by_role("button", name="项目", exact=True)
        self.assertEqual(project_nav.count(), 1)
        project_nav.click()

        stages = self.page.locator('[data-view="项目"] [data-stage]')
        self.assertEqual(stages.count(), 7)
        self.assertEqual(
            stages.all_inner_texts(),
            [
                "项目准入",
                "前期策划",
                "拍摄准备",
                "拍摄执行",
                "后期制作",
                "审片修改",
                "交付关闭",
            ],
        )

    def test_schedule_proposal_can_only_be_applied_as_a_whole(self):
        schedule_nav = self.page.get_by_role("button", name="档期", exact=True)
        self.assertEqual(schedule_nav.count(), 1)
        schedule_nav.click()

        before = self.page.locator('[data-schedule="before"]')
        after = self.page.locator('[data-schedule="after"]')
        self.assertTrue(before.is_visible())
        self.assertTrue(after.is_visible())
        self.assertEqual(self.page.locator("[data-partial-apply]").count(), 0)

        self.page.get_by_role("button", name="应用整套方案", exact=True).click()
        self.assertEqual(
            self.page.get_by_role("status").inner_text(),
            "方案已应用 · 已生成审计记录",
        )


if __name__ == "__main__":
    unittest.main()
