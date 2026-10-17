import {readFileSync,writeFileSync} from 'node:fs';
export const makeWorkflow = function makeWorkflow(kind){
  if(kind!=="small"&&kind!=="large")throw Error("BAD_KIND");
  const big=kind==="large";
  const path=big?"h52-scheduler-size-probe.yml":"h52-scheduler-alias-control.yml";
  const name=big?"H52 Synthetic 500KiB Size and Alias Probe":"H52 Synthetic Scalar Alias Control";
  const id=big?"size":"small";
  const rows=[
    "name: "+name,
    "on:",
    "  push:",
    "    paths:",
    "      - '.github/workflows/"+path+"'",
    "      - 'audit/h52-scheduler-probe/**'",
    "  pull_request:",
    "    branches: [main]",
    "    paths:",
    "      - '.github/workflows/"+path+"'",
    "      - 'audit/h52-scheduler-probe/**'",
    "permissions:",
    "  contents: read",
    "jobs:",
    "  synthetic-parser-check:",
    "    runs-on: ubuntu-latest",
    "    timeout-minutes: 8",
    "    permissions:",
    "      contents: read",
    "    steps:",
    "      - uses: actions/checkout@v4",
    "      - run: &z echo H52_SAFE_SCALAR_ALIAS_EXECUTED",
    "      - run: *z",
    "      - run: node --test audit/h52-scheduler-probe/tests/probe.test.mjs",
    "      - run: node audit/h52-scheduler-probe/verify.mjs "+id,
    "      - uses: actions/upload-artifact@v4",
    "        with:",
    "          name: h52-synthetic-"+id+"-evidence",
    "          path: audit/h52-scheduler-probe/artifacts/"+id+"-evidence.json",
    "          retention-days: 30",
    "          if-no-files-found: error",
    ""
  ];
  const base=rows.join("\n");
  if(!big)return base;
  const target=511380;
  const fillerLine="# H52_SYNTHETIC_PADDING_ONLY_"+"P".repeat(86)+"\n";
  let needed=target-base.length;
  if(needed<2)throw Error("BAD_PADDING_CAPACITY");
  let lines=Math.floor(needed/fillerLine.length);
  let rest=needed-lines*fillerLine.length;
  if(rest===1){lines--;rest+=fillerLine.length;}
  const content=base+fillerLine.repeat(lines)+(rest>=2?"#"+"P".repeat(rest-2)+"\n":"");
  if(content.length!==target || !content.endsWith("\n"))throw Error("BAD_LARGE_FILE_LENGTH");
  return content;
};
const paths={small:'.github/workflows/h52-scheduler-alias-control.yml',large:'.github/workflows/h52-scheduler-size-probe.yml'};
if(process.argv[1]?.endsWith('generate.mjs')) {
 const arg=process.argv[2];
 if(arg==='--check'){for(const kind of ['small','large']){const actual=readFileSync(paths[kind],'utf8');if(actual!==makeWorkflow(kind))throw Error('H52_GENERATOR_CONTENT_MISMATCH_'+kind);}console.log('H52_SYNTHETIC_GENERATOR_EXACT_PASS');}
 else if(arg==='--write'){for(const kind of ['small','large'])writeFileSync(paths[kind],makeWorkflow(kind));console.log('H52_SYNTHETIC_GENERATED');}
 else throw Error('Only --check or --write allowed');
}
