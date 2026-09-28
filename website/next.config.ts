import type { NextConfig } from 'next';
import fs from 'fs';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production';
const repoRoot = path.resolve(__dirname, '..');
const appNodeModules = path.resolve(__dirname, 'node_modules');

// Shared sources live in ../src and are typechecked from that location.
// Node walks up from those files, so they never see website/node_modules.
// A symlink at src/node_modules lets tsc find react and @anthropic-ai/sdk
// (including @types) without aliasing those packages in webpack.
const sharedNodeModules = path.resolve(repoRoot, 'src/node_modules');
try {
  const existing = fs.lstatSync(sharedNodeModules);
  if (!existing.isSymbolicLink()) {
    throw new Error('src/node_modules exists and is not a symlink; refusing to replace it');
  }
} catch (err) {
  const code = (err as NodeJS.ErrnoException).code;
  if (code === 'ENOENT') {
    fs.symlinkSync('../website/node_modules', sharedNodeModules, 'dir');
  } else {
    throw err;
  }
}

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? '/selleramp-killer' : '',
  images: {
    unoptimized: true,
  },
  // Shared sources live in ../src. Pin the tracing root to this repo so a
  // parent lockfile outside the checkout is not treated as the workspace root.
  outputFileTracingRoot: repoRoot,
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@shared': path.resolve(repoRoot, 'src/shared'),
    };
    // Files under ../src are compiled from outside this app. Node resolution
    // walks up from those files and never sees website/node_modules, so
    // @anthropic-ai/sdk fails the Pages build. Search this app's node_modules first.
    const modules: string[] = config.resolve.modules ?? ['node_modules'];
    config.resolve.modules = [
      appNodeModules,
      ...modules.filter((entry) => entry !== appNodeModules),
    ];
    return config;
  },
};

export default nextConfig;