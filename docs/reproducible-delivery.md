# Reproducible delivery (phase 17)

CI is the only supported release builder. Node `22.15.1`, npm `10.9.2`, the
npm lockfile, MySQL `8.4.10`, and the Docker base tag are fixed in source.
Pull requests and `main` run formatting, lint, Prisma validation/generation,
migrations against disposable MySQL, all tests, and the production image build.

After verification, CI creates `predator-backend-<commit>.tar.gz`. Archive
entries are sorted, ownership is normalized, modification times use the source
commit timestamp, and gzip timestamps are disabled. CI builds it twice and
requires byte-for-byte equality.

The bundle contains runtime source, migrations, public assets, scripts,
`package.json`, and `package-lock.json`. `artifact-manifest.json` records size
and SHA-256 for every included file. The workflow uploads the archive, its
SHA-256 file, and a CycloneDX SBOM. The SBOM remains outside the deterministic
archive because generator metadata may vary.

Verify a downloaded release before deployment:

```bash
sha256sum --check predator-backend-<commit>.tar.gz.sha256
tar -xzf predator-backend-<commit>.tar.gz
cd release-bundle
npm ci --omit=dev
node scripts/verify-artifact-manifest.mjs .
```

Promote the exact same archive or container digest between environments; never
rebuild from a branch. Tags identify a release, while the commit SHA, archive
checksum, and image digest identify its immutable content. Database migrations
remain a separate one-shot deployment step.

Dependabot proposes grouped npm updates plus monthly workflow and Docker base
updates. Lockfile and toolchain changes must pass the same pipeline.
