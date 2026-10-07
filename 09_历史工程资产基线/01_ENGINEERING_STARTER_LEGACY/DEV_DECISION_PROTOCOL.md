# Development decision protocol

1. If an issue can be solved without changing product semantics, resolve it technically and log a DEV-TECH finding.
2. If it changes a user-visible business rule, lifecycle state, permission meaning, money/price rule, ownership/responsibility rule, external capability, or data-retention semantics, create `DEV-PD-xxx` and stop only that affected workstream.
3. Other independent workstreams continue.
4. A closed DEV-PD must be written back through baseline Change Control before implementation relies on it.
5. Never revive ARCHIVE behavior to fill a gap.
