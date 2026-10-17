#!/usr/bin/env python3
"""F05-7 V2 候选证据：独立 ZIP 原文验真，不签发正式来源。stdlib only。"""
import argparse
import hashlib
import io
import json
import re
import stat
import sys
import zipfile
from pathlib import PurePosixPath, Path

REPO = 'suzhe868-arch/mb'
RUN = 39035485532
HEAD = 'bdffc492df7dc09d9192d3ac485d598df7a8c040'
BRANCH = 'feat/f05-7-v2-versioned-source-66-candidate-01'
# 官方 REST metadata + A PR111 独立 ZIP 复核提供的固定摘要；变更须另行 A 审签。
ARTIFACTS = (
    (0, 12101319115, 'd0d6723e8b6fb5a6ad6ec442b8d71f9426589f10b5a1d49e9ddf9a77acd04649', 17, 2035009),
    (1, 12102520536, 'd3eb27569b09068498781a284467e636e79261b14d2e9a068ed43a8ca7a06cda', 17, 1958399),
    (2, 12101854148, '6e2acf179aa7058b2eaee19ed76c3a8837001f67619dda9bdecd5c6df9a8884f', 16, 2403938),
    (3, 12102560092, 'cb87bcc89f74007a5eb835a7f7f33792a3c2ddb8550ba38d32c9a432bae255c0', 16, 2181108),
)
# 八份GitHub main@e3ad49b source blobs均经本轮官方GitHub Contents API独立核实。
# 注意：旧来源 ref 99c38d0 的同名文件并非这些 blob；不可跨ref冒充旧Issuer。
FROZEN_MAIN_BLOBS = {
    'f05-7-frozen-h52-revalidation.yml': '687a9f767b0d0b144372550735da6159066b4833',
    'f05-7-frozen-f05-4-2-revalidation.yml': 'ed32a3bfe870be32dba116490b5a99d4f83bb85a',
    'f05-7-frozen-f05-6-2-revalidation.yml': 'a90f9526802c8a1e505e3e6e984215b030af22c1',
    'f05-7-frozen-j2-revalidation.yml': '642c706348884d754c73ce49e624f78915a91218',
    'f05-7-frozen-f05-5-2-revalidation.yml': '0687174fbf9b841cdc510b5caf93550f3bbd15be',
    'f05-7-deterministic-matching-readiness-four-tier.yml': '3f563fcc3137197f37c986963a3e48259d1f4626',
    'f05-7-frozen-i2-revalidation.yml': 'cf4befa47755824466c8b4e16de049c1916fd3dd',
    'f05-7-frozen-k2-revalidation.yml': 'd756184fc5c7cbbf15b21d8715b195d3df4a4419',
}
ORIGINAL_LEGACY_SOURCE_REF = '99c38d013f67cc56975f1664120fb87c204afc3c'
# 三个 SHA-256 承诺仅取自本轮已核验官方工件；不代表 A 已签名。
EXPECTED_FROZEN8_ROOT = '319d4bc6264f597d354ff3b6eec98c182c170e5dd9983632185243a40241ef44'
EXPECTED_MATRIX66_ROOT = 'b24ab94147d6586b327318794158eed8cd6c5d71567165b8bc469da5dfbd56b0'
EXPECTED_BODY931_MERKLE_ROOT = 'f28eb01052054bb1427d8aad0bb678e82288d6b9be7e43a4e78a6ebbc9f2eed2'


MASK = re.compile(rb'::add-mask::(?!\[REDACTED\])|-----BEGIN (?:[A-Z ]* )?PRIVATE KEY-----|F03_1_HMAC_KEY_BASE64=[A-Za-z0-9+/]{43}=')


def deny(code):
    raise ValueError('F05_V2_FAIL_CLOSED_' + code)


def sha(value):
    return hashlib.sha256(value).hexdigest()


def safe_archive(data, limit):
    if len(data) > 5 * 1024 * 1024:
        deny('ZIP_COMPRESSED_LIMIT')
    try:
        z = zipfile.ZipFile(io.BytesIO(data))
        infos = z.infolist()
        if len(infos) > 25000 or len({x.filename for x in infos}) != len(infos):
            deny('ZIP_DUPLICATES_OR_COUNT')
        total = 0
        for info in infos:
            name = info.filename
            path = PurePosixPath(name)
            if not name or name.startswith('/') or '\\' in name or '..' in path.parts or path.is_absolute():
                deny('ZIP_TRAVERSAL')
            if stat.S_IFMT(info.external_attr >> 16) == stat.S_IFLNK:
                deny('ZIP_SYMLINK')
            total += info.file_size
            if total > limit:
                deny('ZIP_UNCOMPRESSED_LIMIT')
        return z
    except (zipfile.BadZipFile, RuntimeError):
        deny('ZIP_CORRUPT')


def verify_one(raw_zip, shard, artifact_id, pinned, expected_jobs, expected_size):
    if len(raw_zip) != expected_size or sha(raw_zip) != pinned:
        deny('OUTER_OFFICIAL_DIGEST')
    outer = safe_archive(raw_zip, 5 * 1024 * 1024)
    if set(outer.namelist()) != {'artifact-integrity-manifest.json', 'original-evidence.zip'}:
        deny('OUTER_MANIFEST_LAYOUT')
    manifest = json.loads(outer.read('artifact-integrity-manifest.json'))
    checks = (manifest.get('schema') == 'V2_ORIGINAL_SHARD_LOSSLESS_PACK_V2' and
              manifest.get('issue') == 106 and manifest.get('shard') == shard and
              manifest.get('complete_evidence') is True and
              manifest.get('security_scan') == 'A107_ALL_SOURCE_FILES_SCAN_BEFORE_ZIP_V1' and
              manifest.get('formal_source_signed') is False and
              manifest.get('expected_run_sha') == HEAD and str(manifest.get('expected_run_id')) == str(RUN) and
              manifest.get('max_upload_bytes') == 5 * 1024 * 1024 and
              manifest.get('max_uncompressed_bytes') == 64 * 1024 * 1024)
    if not checks:
        deny('MANIFEST_CONTEXT')
    inner_bytes = outer.read('original-evidence.zip')
    if sha(inner_bytes) != manifest.get('packed_sha256') or len(inner_bytes) != manifest.get('packed_bytes'):
        deny('INNER_DIGEST')
    inner = safe_archive(inner_bytes, 64 * 1024 * 1024)
    items = manifest.get('items')
    if not isinstance(items, list) or set(inner.namelist()) != {i.get('path') for i in items} or len(inner.namelist()) != len(items):
        deny('MANIFEST_FILES_MISSING')
    by_path = {}
    sum_bytes = 0
    for item in items:
        path = item['path']
        data = inner.read(path)
        if len(data) != item['bytes'] or sha(data) != item['sha256']:
            deny('ORIGINAL_BODY_HASH')
        if MASK.search(data):
            deny('UNMASKED_SECRET')
        by_path[path] = data
        sum_bytes += len(data)
    if sum_bytes != manifest.get('raw_bytes'):
        deny('RAW_BYTES')
    files = [name for name in by_path if name.endswith('/真实单Job证据.json')]
    if len(files) != expected_jobs or manifest.get('source_file_count') != len(items):
        deny('SHARD_JOB_OR_FILE_COUNT')
    results = []
    for file in files:
        r = json.loads(by_path[file])
        key = r.get('original_file', '') + '#' + r.get('original_job_id', '')
        folder = sha(key.encode())[:16]
        if file != folder + '/真实单Job证据.json':
            deny('JOB_RECORD_PATH')
        if (r.get('candidate_head') != HEAD or r.get('candidate_branch') != BRANCH or
            str(r.get('run_id')) != str(RUN) or str(r.get('attempt')) != '1' or
            r.get('formal_issuer_signed') is not False or r.get('clean_git_worktree') is not True or
            r.get('original_source_sha') != ORIGINAL_LEGACY_SOURCE_REF or
            r.get('job_runner') != 'candidate_shard_' + str(shard) or
            r.get('event') != 'push' or
            FROZEN_MAIN_BLOBS.get(r.get('original_file')) != r.get('source_blob') or
            not re.fullmatch('[0-9a-f]{40}', r.get('source_blob') or '') or
            not isinstance(r.get('command_sha256'), list) or not (isinstance(r.get('artifacts'), list) or (r.get('status') == 'BLOCKED_EQUIVALENCE' and r.get('artifacts') is None))):
            deny('JOB_ID_OR_SCOPE')
        log = by_path.get(folder + '/真实Shell及PG16命令.log')
        if log is None or sha(log) != r.get('log_sha256'):
            deny('JOB_LOG_HASH')
        status = r.get('status')
        if status in ('REAL_PG16_PASS', 'REAL_ORIGINAL_NONPG_PASS'):
            if ((status == 'REAL_PG16_PASS') != (r.get('original_job_kind') == 'PG16') or
                r.get('pg16') != (status == 'REAL_PG16_PASS')):
                deny('PG16_KIND')
            if status == 'REAL_PG16_PASS' and not str(r.get('postgres_version_num', '')).startswith('16'):
                deny('PG16_VERSION')
            if status == 'REAL_ORIGINAL_NONPG_PASS' and r.get('postgres_version_num') is not None:
                deny('PG16_KIND')
            if r.get('executed_commands') != len(r['command_sha256']):
                deny('COMMAND_COUNT')
            markers = re.findall(rb'SOURCE_STEP_PASS [0-9]+', log)
            if len(markers) != r['executed_commands']:
                deny('SOURCE_STEP_MARKERS')
            if not str(r.get('log_redaction', '')).startswith('SECURE_MASKED_'):
                deny('LOG_REDACTION')
            for art in r['artifacts']:
                for entry in art.get('files', []):
                    rel = folder + '/artifact-files/' + str(art['index']) + '_' + art['name'] + '/' + entry['path']
                    if rel not in by_path or len(by_path[rel]) != entry['bytes'] or sha(by_path[rel]) != entry['sha256']:
                        deny('ORIGINAL_JOB_ARTIFACT')
        elif status == 'BLOCKED_EQUIVALENCE':
            if key != 'f05-7-deterministic-matching-readiness-four-tier.yml#match-source' or 'LEGACY_SOURCE_ORACLE' not in str(r.get('blocker')):
                deny('WRONG_BLOCKED_ORACLE')
        else:
            deny('UNEXPECTED_JOB_STATUS')
        results.append((key, status, r.get('source_blob'),
                        r.get('original_job_kind'), r.get('command_sha256'), r.get('log_sha256')))
    leaves = [[shard, item['path'], item['bytes'], item['sha256']] for item in items]
    return {'artifact_id': artifact_id, 'shard': shard, 'files': len(items), 'jobs': len(files),
            'bytes': len(raw_zip), '_body_leaves': leaves}, results


def verify_directory(folder):
    reports, records, body_leaves = [], [], []
    for shard, artid, digest, count, size in ARTIFACTS:
        filename = Path(folder) / ('F05-7_官方分片_%d.zip' % artid)
        if not filename.is_file():
            deny('ARTIFACT_MISSING_' + str(artid))
        report, found = verify_one(filename.read_bytes(), shard, artid, digest, count, size)
        body_leaves.extend(report.pop('_body_leaves'))
        reports.append(report)
        records += found
    keys = [x[0] for x in records]
    if len(keys) != 66 or len(set(keys)) != 66:
        deny('66_UNIQUE_JOBS')
    counts = {kind: sum(x[1] == kind for x in records) for kind in ('REAL_PG16_PASS', 'REAL_ORIGINAL_NONPG_PASS', 'BLOCKED_EQUIVALENCE')}
    if counts != {'REAL_PG16_PASS': 63, 'REAL_ORIGINAL_NONPG_PASS': 2, 'BLOCKED_EQUIVALENCE': 1}:
        deny('65_PLUS_LEGACY_BLOCKER')
    if len({x[0].split('#')[0] for x in records}) != 8 or not all(len(set(y[2] for y in records if y[0].startswith(prefix))) == 1 for prefix in set(x[0].split('#')[0] for x in records)):
        deny('SAME_SOURCE_MULTIPLE_BLOBS')
    frozen_digest = sha(json.dumps(sorted(FROZEN_MAIN_BLOBS.items()),ensure_ascii=False,
                                  separators=(',',':')).encode('utf-8'))
    matrix = sorted([[key.split('#')[0],key.split('#')[1],blob,kind,status,commands,logsha]
                     for key,status,blob,kind,commands,logsha in records])
    matrix_digest = sha(json.dumps(matrix,ensure_ascii=False,separators=(',',':')).encode('utf-8'))
    leaves = [hashlib.sha256(b'F05_V2_LEAF\0' +
              json.dumps(item,ensure_ascii=False,separators=(',',':')).encode('utf-8')).digest()
              for item in sorted(body_leaves)]
    if len(leaves)!=931:
        deny('BODY_931_COUNT')
    while len(leaves)>1:
        if len(leaves)%2: leaves.append(leaves[-1])
        leaves = [hashlib.sha256(b'F05_V2_NODE\0'+leaves[i]+leaves[i+1]).digest()
                  for i in range(0,len(leaves),2)]
    body_root = leaves[0].hex()
    if (frozen_digest!=EXPECTED_FROZEN8_ROOT or matrix_digest!=EXPECTED_MATRIX66_ROOT or
        body_root!=EXPECTED_BODY931_MERKLE_ROOT):
        deny('FROZEN_MATRIX_OR_MERKLE_ROOT_CHANGED')
    # Old historical successes must have been physically re-run on this exact HEAD.
    by_key = {x[0]:x for x in records}
    for historical in ['f05-7-frozen-h52-revalidation.yml#f05-3f-https-pg16',
                       'f05-7-frozen-k2-revalidation.yml#k-https']:
        if by_key.get(historical,(None,None))[1]!='REAL_PG16_PASS':
            deny('HISTORICAL_JOB_NOT_RERUN_ON_HEAD')
    result = {'protocol': 'V2_SOURCE_CANDIDATE_66_NEW_HEAD_V1', 'run_id': RUN, 'head_sha': HEAD,
              'proof_type': 'OFFLINE_OFFICIAL_ARTIFACT_BYTES_MATCH_PINNED_API_DIGEST_NOT_AN_ISSUER',
              'artifacts': reports, 'total_original_files': sum(x['files'] for x in reports),
              'frozen_eight_blob_roots_sha256': frozen_digest,
              'original_66_matrix_sha256': matrix_digest,
              'original_body_merkle_root_sha256': body_root,
              'job_status': counts, 'legacy_oracle': 'BLOCKED_EQUIVALENCE',
              'eight_main_source_git_blobs': 'MATCH_OFFICIAL_GITHUB_MAIN_E3AD49B_METADATA',
              'original_step_catalog_redrive': 'REQUIRES_A_VERIFICATION',
              'formal_issuer_signed': False, 'five_sources': 'SOURCE_GAP_OPEN_FAIL_CLOSED',
              'signer_trust': 'BLOCKED_SIGNER_TRUST', 'production_ready': False}
    return result


def main():
    p = argparse.ArgumentParser(description='仅候选证据离线正文哈希审计；不能签发 Source')
    p.add_argument('--zip-dir', required=True)
    args = p.parse_args()
    try:
        print(json.dumps(verify_directory(args.zip_dir), indent=2, ensure_ascii=False))
    except Exception as exc:
        print(json.dumps({'status': 'FAIL_CLOSED', 'reason': str(exc), 'formal_issuer_signed': False}, ensure_ascii=False), file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()
