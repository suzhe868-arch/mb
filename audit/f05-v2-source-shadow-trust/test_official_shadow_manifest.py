"""Real 4 official ZIP test: independent of JS mocks, read-only and no skipped cases."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import shutil
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('official_shadow_manifest.py')
spec = importlib.util.spec_from_file_location('official_shadow_manifest', SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
OFFICIAL_DIR = Path(os.environ.get('F05_V2_OFFICIAL_ARTIFACT_DIR', '/mnt/data'))

class OfficialShadowEvidenceTest(unittest.TestCase):
    def test_four_genuine_official_files(self):
        doc=mod.build_shadow(OFFICIAL_DIR)
        self.assertEqual(doc['repository_id'], 1382955791)
        self.assertEqual(doc['body_file_count'], 931)
        self.assertEqual(doc['original_job_count'], 66)
        self.assertEqual(doc['pg16_pass'], 63)
        self.assertEqual(doc['original_nonpg_pass'], 2)
        self.assertEqual(doc['legacy_oracle'], 'BLOCKED_EQUIVALENCE')
        self.assertFalse(doc['formal_issuer_signed'])
        self.assertEqual(set(doc), set(json.loads(SCRIPT.with_name('official_shadow_manifest.json').read_text())))
    def test_missing_zip_rejects_evidence_expired(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaisesRegex(ValueError, 'BLOCKED_EVIDENCE_EXPIRED'):
                mod.build_shadow(Path(temp))
    def test_tampered_official_bytes_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            directory=Path(temp)
            for shard,aid,_,_,_ in mod.load_existing_verifier().ARTIFACTS:
                original=OFFICIAL_DIR / ('F05-7_官方分片_%s.zip' % aid)
                target=directory / original.name
                shutil.copyfile(original,target)
            target=directory / 'F05-7_官方分片_12102520536.zip'
            data=bytearray(target.read_bytes()); data[100]^=1; target.write_bytes(data)
            with self.assertRaisesRegex(ValueError,'BLOCKED_OFFICIAL_BYTES_INVALID'):
                mod.build_shadow(directory)
    def test_source_does_not_have_certificate_or_private_body(self):
        doc=mod.build_shadow(OFFICIAL_DIR)
        text=json.dumps(doc,sort_keys=True)
        for forbidden in ('-----BEGIN PRIVATE KEY','::add-mask::','github_token','job_log','raw_evidence','original_zip','signed_attestation_bundle'):
            self.assertNotIn(forbidden,text)
    def test_signed_fields_never_override_external_absence(self):
        doc=mod.build_shadow(OFFICIAL_DIR)
        self.assertFalse(doc['online_github_rest_verified_by_A'])
        self.assertFalse(doc['private_immutable_archive_verified_by_A'])
        self.assertFalse(doc['persistent_replay_ledger_verified_by_A'])
        self.assertEqual(doc['five_source_status'],'SOURCE_GAP_OPEN_FAIL_CLOSED')

if __name__=='__main__':unittest.main()
