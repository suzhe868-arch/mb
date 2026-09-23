# 01 CURRENT BASELINE REGISTER

## Baseline identity

- Project: 名邦汽车 V1
- Recertification mode: `AUTO-RUN END-TO-END`
- Core implementation: **FORBIDDEN until PHASE 15 PASS**
- Current process authority: user directive dated 2026-09-06, superseding prior implementation-ready status claims.

## Canonical read order

1. `CHECKPOINT/名邦汽车_V1_CURRENT_CHECKPOINT_2026-09-06.md` — entry/index; process status notice patched.
2. `CHECKPOINT/名邦汽车_V1_SSOT_CHECKPOINT_2026-09-06.md` — primary product/business SSOT.
3. `CHECKPOINT/名邦汽车_V1_IA_CHECKPOINT_2026-09-06.md` — current IA, subordinate to SSOT.
4. `CHECKPOINT/名邦汽车_V1_DECISION_REGISTER_2026-09-06.md` — current CLOSED decisions.
5. Current technical contracts listed in `01_AUTHORITATIVE_FILE_REGISTER.md`.
6. Validation/gate/handoff artifacts — evidence only.

## Authority rule

`User latest explicit confirmation > SSOT > IA > CLOSED Decision > Current Technical Contract > evidence/history`.

## Phase-01 conclusion

The old `READY FOR IMPLEMENTATION` state is not a current authority conflict after patching: it is now explicitly historical evidence. No unresolved product-rule conflict was found that requires H1/H4 at PHASE 01.
