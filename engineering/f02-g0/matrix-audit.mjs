import {readFile} from 'node:fs/promises';
import {validateMatrix} from './matrix-validation.mjs';
const data=await readFile(new URL('./field-matrix.tsv',import.meta.url),'utf8');
const result=validateMatrix(data);
console.log('F02-G0 Current authority matrix PASS: original 376 + new 37 =',result.fieldCount,'candidate fields;',result.entityCount,'entity candidates;',result.pdmCount,'PDM refs; no Customer Merge; all FK targets known; all fields CANDIDATE_UNFROZEN / NOT_RUN');
