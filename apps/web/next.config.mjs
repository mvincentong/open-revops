import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This worktree lives alongside sibling worktrees that also carry lockfiles. Pin the
  // file-tracing root to the monorepo root so Next stops guessing.
  outputFileTracingRoot: resolve(__dirname, '../..'),
};

export default nextConfig;
