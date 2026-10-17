#!/usr/bin/env python3
"""只读官方ZIP去敏影子摘要。不会验证在线 REST、签发 Source 或写入原件。"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
VERIFIER = ROOT / 'engineering/f05/v2-attestation-gate/官方证据离线验真.py'
REPO_ID = 1382955791
REPO = 'suzhe868-arch/mb'
RUN = 39035485532
SHA = 'bdffc492df7dc09d9192d3ac485d598df7a8c040'
DIGESTS = (
    'd0d6723e8b6fb5a6ad6ec442b8d71f9426589f10b5a1d49e9ddf9a77acd04649',
    'd3eb27569b09068498781a284467e636e79261b14d2e9a068ed43a8ca7a06cda',
    '6e2acf179aa7058b2eaee19ed76c3a8837001f67619dda9bdecd5c6df9a8884f',
    'cb87bcc89f74007a5eb835a7f7f33792a3c2ddb8550ba38d32c9a432bae255c0',
)
PROTOCOL = 'F05_V2_SHADOW_EVIDENCE_MANIFEST_V1'
SHA256 = re.compile(r'^[a-f0-9]{64}$')


def refuse(code):
    raise ValueError('BLOCKED_' + code)


def load_existing_verifier():
    if not VERIFIER.is_file():
        refuse('OFFICIAL_VERIFIER_UNAVAILABLE')
    spec = importlib.util.spec_from_file_location('v2_existing_official_verifier', VERIFIER)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    if (module.RUN != RUN or module.HEAD != SHA or
            tuple(x[2] for x in module.ARTIFACTS) != DIGESTS):
        refuse('PINNED_VERIFIER_MISMATCH')
    return module


def build_shadow(zip_dir: Path):
    """基于四份真实、已固化 SHA 的 ZIP 原字节生成可公开去敏字段；不接受 mock 替代。"""
    verifier = load_existing_verifier()
    try:
        result = verifier.verify_directory(zip_dir)
    except (OSError, ValueError, KeyError, TypeError, RuntimeError) as exc:
        # Never print nested raw evidence, supplied paths, API tokens or arbitrary exceptions.
        code = 'EVIDENCE_EXPIRED' if not all(
            (zip_dir / ('F05-7_官方分片_%d.zip' % x[1])).is_file() for x in verifier.ARTIFACTS
        ) else 'OFFICIAL_BYTES_INVALID'
        refuse(code)
    counts = result.get('job_status')
    if counts != {'REAL_PG16_PASS': 63, 'REAL_ORIGINAL_NONPG_PASS': 2, 'BLOCKED_EQUIVALENCE': 1}:
        refuse('LEGACY_ORACLE_NOT_PRESERVED')
    artifacts = result.get('artifacts')
    if (result.get('run_id') != RUN or result.get('head_sha') != SHA or
            result.get('total_original_files') != 931 or result.get('formal_issuer_signed') is not False or
            len(artifacts or ()) != 4 or
            [x['artifact_id'] for x in artifacts] != [z[1] for z in verifier.ARTIFACTS]):
        refuse('OFFICIAL_PROOF_CONTEXT')
    roots = (result['frozen_eight_blob_roots_sha256'], result['original_66_matrix_sha256'],
             result['original_body_merkle_root_sha256'])
    if not all(SHA256.fullmatch(r) for r in roots):
        refuse('OFFICIAL_ROOT_INVALID')
    # Strict allowlist only: no original ZIP, log, job body, PEM, token, customer data or source path.
    return {
        'schema': PROTOCOL,
        'repository': REPO,
        'repository_id': REPO_ID,
        'run_id': RUN,
        'head_sha': SHA,
        'run_attempt': 1,
        'event': 'push',
        'artifact_ids': [x[1] for x in verifier.ARTIFACTS],
        'artifact_sha256': list(DIGESTS),
        'body_file_count': 931,
        'original_job_count': 66,
        'pg16_pass': 63,
        'original_nonpg_pass': 2,
        'legacy_oracle': 'BLOCKED_EQUIVALENCE',
        'legacy_native_66_success': False,
        'root_frozen8_sha256': roots[0],
        'root_job66_sha256': roots[1],
        'root_body931_sha256': roots[2],
        'bytes_verified_locally': True,
        'online_github_rest_verified_by_A': False,
        'sigstore_identity_verified_by_A': False,
        'private_immutable_archive_verified_by_A': False,
        'independent_reviewer_verified_by_A': False,
        'persistent_replay_ledger_verified_by_A': False,
        'authorization_granted': False,
        'formal_issuer_signed': False,
        'five_source_status': 'SOURCE_GAP_OPEN_FAIL_CLOSED',
        'production_ready': False,
    }


def main():
    ap = argparse.ArgumentParser(description='只读旧官方ZIP → 去敏影子manifest，不能做真实签署')
    ap.add_argument('--zip-dir', type=Path, required=True)
    args = ap.parse_args()
    try:
        doc = build_shadow(args.zip_dir)
        print(json.dumps(doc, ensure_ascii=False, sort_keys=True, separators=(',', ':')))
    except Exception as exc:
        # print exclusively controlled error codes
        code = str(exc)
        if not code.startswith('BLOCKED_'):
            code = 'BLOCKED_OFFICIAL_VERIFICATION_FAILED'
        print(json.dumps({'status': 'FAIL_CLOSED', 'code': code,
                          'formal_issuer_signed': False, 'authorization_granted': False},
                         ensure_ascii=False), file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
