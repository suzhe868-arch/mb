import tempfile
import unittest
from pathlib import Path
from importlib.machinery import SourceFileLoader

mod=SourceFileLoader("ci_preflight",str(Path(__file__).parent/"CI触发容量只读预检.py")).load_module()

class TriggerPreflightTests(unittest.TestCase):
    def test_old_f05_pr_is_a_real_trigger(self):
        y="""name: F05-old
on:
  push:
    branches: [feat/f05-older]
  pull_request:
    branches: [main]
    paths:
      - 'engineering/f05/**'
jobs:
  source:
    runs-on: ubuntu-latest
"""
        self.assertEqual(mod.may_trigger(y,"push",mod.TARGET_BRANCH,mod.TARGET_PATHS)[0],False)
        self.assertEqual(mod.may_trigger(y,"pull_request","main",mod.TARGET_PATHS)[0],True)
    def test_doc_only_is_not_pr_trigger(self):
        y="""on:
  pull_request:
    branches: [main]
    paths:
      - '07_重建工作区/**'
jobs:
  check:
    runs-on: ubuntu-24.04
"""
        self.assertFalse(mod.may_trigger(y,"pull_request","main",mod.TARGET_PATHS)[0])
    def test_broad_pr_never_treated_as_safe(self):
        self.assertTrue(mod.may_trigger("on:\\n  pull_request:\\n    branches: [main]\\n",
                        "pull_request","main",mod.TARGET_PATHS)[0])
    def test_inline_map_is_fail_closed(self):
        self.assertTrue(mod.may_trigger("on: {push: {}, pull_request: {}}","pull_request","main",mod.TARGET_PATHS)[0])
    def test_unknown_branch_is_fail_closed(self):
        y="on:\\n  push:\\n    branches: REQUIRES_DYNAMIC_INPUT\\n"
        self.assertTrue(mod.may_trigger(y,"push",mod.TARGET_BRANCH,mod.TARGET_PATHS)[0])
    def test_full_scan_blocks_release(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d)/"old.yml").write_text("on:\\n  pull_request:\\n    branches: [main]\\n    paths: [engineering/f05/**]\\njobs:\\n  test:\\n    runs-on: ubuntu-24.04\\n",encoding="utf8")
            r=mod.analyze(d)
            self.assertEqual(r["release_status"],"BLOCKED_REMOTE_PR_TRIGGER_BUDGET")
            self.assertFalse(r["scan_complete_for_2026_10_17_main"])

class InlineScopedBranchTests(unittest.TestCase):
    def test_inline_other_prefix_cannot_trigger(self):
        y="on: {push: {branches: feat/f05-7-deterministic-matching-readiness-four-*}}\njobs:\n  pg:\n    runs-on: ubuntu-latest\n"
        self.assertFalse(mod.may_trigger(y,"push",mod.TARGET_BRANCH,mod.TARGET_PATHS)[0])
    def test_inline_exact_target_does_trigger(self):
        y="on: {push: {branches: feat/f05-7-v2-trusted-attestation-issuer-gate-*}}\n"
        self.assertTrue(mod.may_trigger(y,"push",mod.TARGET_BRANCH,mod.TARGET_PATHS)[0])
    def test_inline_other_trigger_is_absent(self):
        y="on: {push: {branches: main}}\n"
        self.assertFalse(mod.may_trigger(y,"create",mod.TARGET_BRANCH,mod.TARGET_PATHS)[0])
    def test_inline_array_event_set(self):
        self.assertTrue(mod.may_trigger("on: [push, pull_request]\n","push",mod.TARGET_BRANCH,mod.TARGET_PATHS)[0])
        self.assertFalse(mod.may_trigger("on: [push, pull_request]\n","create",mod.TARGET_BRANCH,mod.TARGET_PATHS)[0])
