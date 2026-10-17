#!/usr/bin/env python3
"""只读仓库工作流触发预检。保守判断：任何不能证明不触发的情况均阻断。
不调GitHub API、不产生Runner、不启用Source。
"""
import argparse
import fnmatch
import json
import re
import sys
from pathlib import Path

TARGET_BRANCH = "feat/f05-7-v2-trusted-attestation-issuer-gate-01"
TARGET_PATHS = (
    "engineering/f05/v2-attestation-gate/官方证据离线验真.py",
    "engineering/f05/v2-attestation-gate/CI触发容量只读预检.py",
)
REQUIRED_LEGACY_PR = (
    "f05-7-deterministic-matching-readiness-four-tier.yml",
    "f05-8-priority-arbitration-ttl-handover.yml",
    "f05-9-recommendation-visibility-grants.yml",
    "f05-10-consultation-assignee-sla.yml",
    "f05-10-d1-public-pool-owner-claim.yml",
    "f05-9-frozen-f05-8-four-revalidation.yml",
    "f05-10-frozen-f05-8-four-revalidation.yml",
    "f05-10-d1-frozen-f05-8-four-revalidation.yml",
    "f05-10-frozen-f05-9-two-revalidation.yml",
    "f05-10-d1-frozen-f05-9-two-revalidation.yml",
)

def top_block(content, name):
    lines = content.replace("\r\n", "\n").splitlines()
    hit = None
    for n, line in enumerate(lines):
        if re.fullmatch(r"\s*(['\"]?)"+re.escape(name)+r"\1:\s*.*",line) and not line.startswith(" "):
            hit = n
            break
    if hit is None:
        return None
    tail = []
    for line in lines[hit+1:]:
        if line and not line[0].isspace() and not line.startswith("#"):
            break
        tail.append(line)
    return lines[hit].split(":",1)[1].strip(), tail

def event_block(content, event):
    root=top_block(content, "on")
    if root is None:
        return None
    inline, lines=root
    if inline:
        # 解析常用 GitHub 单行 on: {push: {branches: ...}} / on: [push, ...]。
        # 任何超出已知形式的写法保持 Fail Closed，不用字符串子串乱匹配。
        if inline.startswith("[") and inline.endswith("]"):
            keys={x.strip().strip("\"'") for x in inline[1:-1].split(",")}
            return "\n" if event in keys else None
        if inline in {"push","pull_request","pull_request_target","create"}:
            return "\n" if inline == event else None
        if not (inline.startswith("{") and inline.endswith("}")):
            return "UNKNOWN_INLINE"
        match=re.search(r"(?:^|[,{}])\s*"+re.escape(event)+r"\s*:\s*(\{[^{}]*\}|\[[^\]]*\]|[^,{}]+)",inline)
        if not match:
            return None
        expression=match.group(1).strip()
        if expression in {"{}", "[]", ""}:
            return "\n"
        if not (expression.startswith("{") and expression.endswith("}")):
            return "UNKNOWN_INLINE"
        inner=expression[1:-1]
        selectors=[]
        for name in ("branches", "paths", "paths-ignore"):
            m=re.search(r"(?:^|,)\s*"+re.escape(name)+r"\s*:\s*(\[[^\]]*\]|[^,]+)",inner)
            if m:
                val=m.group(1).strip()
                if not val.startswith("["):
                    val="["+val+"]"
                selectors.append("    "+name+": "+val)
        # 其他键无法证明是否影响触发，不能把未知新过滤器略去。
        if re.search(r"(?:^|,)\s*[A-Za-z_][\w-]*\s*:",inner) and not selectors:
            return "UNKNOWN_INLINE"
        return "\n".join(selectors)+"\n"
    start = None
    for n,line in enumerate(lines):
        if re.fullmatch(r"  "+re.escape(event)+r":\s*.*",line):
            start=n
            break
    if start is None:
        return None
    items=[]
    for line in lines[start+1:]:
        if line.startswith("  ") and len(line)>2 and not line[2].isspace() and not line.lstrip().startswith("#"):
            break
        items.append(line)
    return lines[start].strip().split(":",1)[1].strip()+"\n"+"\n".join(items)

def extract_sequence(block, field):
    if "UNKNOWN_INLINE" in block:
        return None
    m=re.search(r"(?m)^\s{4}"+re.escape(field)+r":[ \t]*(.*)$",block)
    if m is None:
        return []
    val=m.group(1).split(" #")[0].strip()
    if val.startswith("[") and val.endswith("]"):
        return [x.strip().strip(" '\"") for x in val[1:-1].split(",") if x.strip()]
    if val:
        return None
    result=[]
    lines=block[m.end():].split("\n")
    for line in lines:
        if re.match(r"^\s{4}\w[^:]*:",line):
            break
        e=re.match(r"^\s{6}-\s*['\"]?([^'\"#]+)",line)
        if e:
            result.append(e.group(1).strip())
    return result or None

def pattern_match(pattern,path):
    if pattern.startswith("!"):
        return None
    # GitHub patterns: ** is recursive, * never traverses /.
    expr="^"+re.escape(pattern).replace(r"\*\*",".*").replace(r"\*","[^/]*").replace(r"\?",".")+"$"
    return bool(re.match(expr,path))

def may_trigger(content,event,branch,paths):
    block=event_block(content,event)
    if block is None:
        return False,"EVENT_ABSENT"
    if block=="UNKNOWN_INLINE":
        return True,"UNKNOWN_INLINE_FAIL_CLOSED"
    branches=extract_sequence(block,"branches")
    if branches is None:
        return True,"UNPARSEABLE_BRANCH_SELECTOR"
    if branches and not any(pattern_match(b,branch) is not False for b in branches):
        return False,"BRANCH_NOT_MATCHED"
    # Empty branches means all branches, not a safe restriction.
    include=extract_sequence(block,"paths")
    ignored=extract_sequence(block,"paths-ignore")
    if include is None or ignored is None:
        return True,"UNPARSEABLE_PATH_SELECTOR"
    if include and not any(pattern_match(p,f) is not False for p in include for f in paths):
        return False,"PATHS_NOT_MATCHED"
    if ignored and all(any(pattern_match(p,f) is True for p in ignored) for f in paths):
        return False,"ALL_PATHS_IGNORED"
    return True,"PATH_AND_BRANCH_MAY_TRIGGER"

def analyze(directory,branch=TARGET_BRANCH,changed=TARGET_PATHS):
    paths=sorted(list(Path(directory).glob("*.yml"))+list(Path(directory).glob("*.yaml")))
    out={"schema":"F05_V2_CI_TRIGGER_PREFLIGHT_V1","branch":branch,
         "paths":list(changed),"workflow_file_count":len(paths),"push_possible":[],
         "pr_possible":[],"create_possible":[],"unknown_timeout_workflows":[],"min_possible_runner_jobs":0,
         "approved_remote_ci":False}
    for path in paths:
        content=path.read_text(encoding="utf-8")
        jobs=top_block(content,"jobs")
        if jobs is None:
            count=0
        else:
            count=sum(bool(re.match(r"^  [A-Za-z_][\w-]*:\s*(?:#.*)?$",line)) for line in jobs[1])
        for event,key in (("push","push_possible"),("pull_request","pr_possible"),("pull_request_target","pr_possible"),("create","create_possible")):
            possible,reason=may_trigger(content,event,"main" if event!="push" else branch,changed)
            if possible:
                out[key].append({"workflow":path.name,"event":event,"jobs_defined":count,"reason":reason})
                out["min_possible_runner_jobs"]+=count
                if not re.search(r"(?m)^\s+timeout-minutes:\s*\d+\s*$",content):
                    out["unknown_timeout_workflows"].append(path.name)
    seen={item["workflow"] for item in out["pr_possible"]}
    out["confirmed_legacy_pr_minimum"]=len(set(REQUIRED_LEGACY_PR)&seen)
    out["missing_required_legacy"]=sorted(set(REQUIRED_LEGACY_PR)-{p.name for p in paths})
    out["scan_complete_for_2026_10_17_main"]=len(paths)>=335 and not out["missing_required_legacy"]
    out["branch_only_static_zero_trigger"]=(
        out["scan_complete_for_2026_10_17_main"] and not out["push_possible"]
        and not out["create_possible"])
    out["release_status"]="BLOCKED_REMOTE_PR_TRIGGER_BUDGET"
    out["reason"]="仅能独立审查分支零触发，不批准PR/旧CI/任何正式签发"
    return out

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--workflows",required=True,help="仓库main工作流目录 .github/workflows")
    p.add_argument("--output",help="可选只读诊断JSON，不含密钥")
    args=p.parse_args()
    result=analyze(args.workflows)
    data=json.dumps(result,ensure_ascii=False,indent=2)+"\n"
    if args.output: Path(args.output).write_text(data,encoding="utf8")
    print(data)
    return 2 if result["release_status"].startswith("BLOCKED") else 0

if __name__=="__main__":
    sys.exit(main())
