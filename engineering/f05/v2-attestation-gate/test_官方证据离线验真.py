import io
import os
from pathlib import Path
import tempfile
import unittest
import zipfile
from unittest.mock import patch
from 官方证据离线验真 import verify_directory, safe_archive, verify_one, ARTIFACTS

SOURCE = Path(os.getenv('F05_V2_OFFICIAL_ARTIFACT_DIR', '/mnt/data/不存在的官方ZIP目录'))
HAVE_OFFICIAL = all((SOURCE / f'F05-7_官方分片_{aid}.zip').is_file() for _, aid, *_ in ARTIFACTS)


def zipped(entries):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf,'w') as z:
        for path, value in entries:
            z.writestr(path,value)
    return buf.getvalue()


class OfficialProof(unittest.TestCase):
    @unittest.skipUnless(HAVE_OFFICIAL, '无官方原文ZIP，不能虚报端到端实测')
    def test_four_real_official_zips(self):
        p = verify_directory(SOURCE)
        self.assertEqual(p['total_original_files'], 931)
        self.assertEqual(p['job_status']['REAL_PG16_PASS'], 63)
        self.assertFalse(p['formal_issuer_signed'])

    @unittest.skipUnless(HAVE_OFFICIAL, '无官方原文ZIP')
    def test_tampered_zip_fails_closed(self):
        shard, art, digest, n, size = ARTIFACTS[0]
        raw = bytearray((SOURCE/f'F05-7_官方分片_{art}.zip').read_bytes())
        raw[64] ^= 1
        with self.assertRaisesRegex(ValueError, 'OUTER_OFFICIAL_DIGEST'):
            verify_one(bytes(raw), shard, art, digest, n, size)

    @unittest.skipUnless(HAVE_OFFICIAL, '无官方原文ZIP')
    def test_cross_shard_zip_fails_closed(self):
        shard, art, digest, n, size = ARTIFACTS[0]
        wrong = (SOURCE/f'F05-7_官方分片_{ARTIFACTS[1][1]}.zip').read_bytes()
        with self.assertRaisesRegex(ValueError, 'OUTER_OFFICIAL_DIGEST'):
            verify_one(wrong, shard, art, digest, n, size)

    def test_missing_artifact_fails_closed(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaisesRegex(ValueError, 'ARTIFACT_MISSING'):
                verify_directory(d)

    def test_zip_path_traversal_rejected(self):
        with self.assertRaisesRegex(ValueError,'ZIP_TRAVERSAL'):
            safe_archive(zipped([('../steal',b'bad')]),4096)

    def test_duplicate_zip_member_rejected(self):
        with self.assertRaisesRegex(ValueError,'ZIP_DUPLICATES_OR_COUNT'):
            safe_archive(zipped([('duplicate',b'1'),('duplicate',b'2')]),4096)

    def test_zip_uncompressed_bomb_rejected(self):
        with self.assertRaisesRegex(ValueError,'ZIP_UNCOMPRESSED_LIMIT'):
            safe_archive(zipped([('big',b'a'*3000)]),2048)

if __name__ == '__main__':
    unittest.main(verbosity=2)
