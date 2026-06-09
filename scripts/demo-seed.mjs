#!/usr/bin/env node
// Placeholder demo seeder for the scaffold phase. The real implementation generates a
// deterministic synthetic dataset from DEMO_SEED (see packages/demo-data and
// .claude/rules/20-determinism-and-demo-data.md). It must be idempotent.
const seed = process.env.DEMO_SEED ?? "open-revops-golden-v1";
console.log(`OpenRevOps — demo:seed (scaffold placeholder)`);
console.log(`Would seed deterministic synthetic data with DEMO_SEED="${seed}".`);
console.log(`No data store exists yet; nothing to seed. Exiting cleanly.`);
