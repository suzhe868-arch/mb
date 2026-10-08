import {readFile} from 'node:fs/promises';
import {validateFullDomain} from './full-domain-validation.mjs';
const paths=['field-matrix.tsv','field-freeze-candidates.tsv','field-tiers-376.tsv','F02-G0_全域510字段逐项物理承载审查.tsv','F02-G0_全域82实体主键外键与延期审查.tsv','F02-G0_PDM01至25正式施工承载总矩阵.tsv','foreign-key-closure.tsv','F02-G0_全域集中问题及处理结果_22项.tsv'];
const vals=await Promise.all(paths.map(n=>readFile(new URL(n,import.meta.url),'utf8')));
const q=validateFullDomain(...vals);
console.log('F02-G0 ALL-DOMAIN CANDIDATE PASS:',q.pdm,'PDM Finals;',q.fields,'field dispositions;',q.entities,'entity dispositions;',q.buildable,'minimum entities;',q.foreignKeys,'static FK edges;',q.deferredWhole,'fully deferred/excluded entities;',q.issues,'centralized findings;',JSON.stringify(q.counts),'; G0_ACCEPTED=NO; DDL NOT_RUN');
