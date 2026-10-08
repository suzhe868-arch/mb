import {readFile} from 'node:fs/promises';
import {validateFourDomainScope} from './scope-validation.mjs';
const read=name=>readFile(new URL(name,import.meta.url),'utf8');
const args=await Promise.all(['field-matrix.tsv','field-freeze-candidates.tsv','field-tiers-376.tsv','F02-G0_四域范围承载映射与延期裁定候选.tsv'].map(read));
const q=validateFourDomainScope(...args);
console.log('F02-G0 SCOPE CANDIDATE PASS:',q.domainCount,'domains;',q.factCount,'fact mappings;',q.fieldCount,'fields;',q.entities,'minimal entities;',q.staticFKs,'static FK edges;',JSON.stringify(q.counts),'; G0_ACCEPTED=NO; DDL NOT_RUN');
