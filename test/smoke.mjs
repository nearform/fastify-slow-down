#!/usr/bin/env node
// Stage-2 "2a" smoke test: does this package, AS PUBLISHED, install into a clean
// consumer and import without throwing?
//
// It packs the real tarball (npm pack, honouring `files`/`exports`/`.npmignore`),
// installs it into a throwaway project, and dynamically imports every entry point
// declared in `exports` (or `main`). That reproduces what a downstream consumer
// sees, so it catches the class of breaks that in-repo unit tests never do:
// missing published files, broken exports maps, ESM/CJS resolution, and — under
// engine-strict / strict-peers — engines and peer-range narrowing.
//
// Zero dependencies: pure Node built-ins + the `npm` on PATH. Copy this one file
// anywhere, or run it via the composite action in ./action. Works identically
// locally and in CI.
//
//   node smoke.mjs [packageDir=.] [options]
//     --build "<cmd>"   run a build command in the package before packing
//     --script <path>   a per-package usage script to run inside the consumer
//                       (gets the installed package; exit non-zero = fail)
//     --consumer-deps "<specs>"  versions to PIN in the consumer before installing
//                       the tarball (space-separated, e.g. "react@18 react-dom@18").
//                       This is the peer-version axis: it forces the floor/ceiling
//                       of a supported range instead of letting npm pick newest.
//     --no-engine-strict  don't fail install on an engines mismatch (default: strict)
//     --strict-peers      fail install on an unmet/conflicting peer range (ERESOLVE)
//     --keep              leave the temp dirs in place (for debugging)
//     --json              emit a machine-readable summary on stdout

import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  copyFileSync,
  existsSync,
  readFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, basename } from 'node:path'
import { spawnSync } from 'node:child_process'

// ---------- tiny arg parsing ----------
const argv = process.argv.slice(2)
const opts = {
  build: null,
  script: null,
  consumerDeps: '',
  engineStrict: true,
  strictPeers: false,
  keep: false,
  json: false
}
const positional = []
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--build') opts.build = argv[++i]
  else if (a === '--script') opts.script = argv[++i]
  else if (a === '--consumer-deps') opts.consumerDeps = argv[++i]
  else if (a === '--no-engine-strict') opts.engineStrict = false
  else if (a === '--strict-peers') opts.strictPeers = true
  else if (a === '--keep') opts.keep = true
  else if (a === '--json') opts.json = true
  else positional.push(a)
}
const packageDir = resolve(positional[0] || '.')

// ---------- helpers ----------
const results = []
function record(step, ok, detail) {
  results.push({ step, ok, detail })
  const tag = ok ? '  ✓ PASS' : '  ✗ FAIL'
  console.log(`${tag}  ${step}${detail ? `  — ${detail}` : ''}`)
}
function skip(step, detail) {
  results.push({ step, ok: 'skip', detail })
  console.log(`  ⊘ SKIP  ${step}${detail ? `  — ${detail}` : ''}`)
}
function run(cmd, args, cwd, opt = {}) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', ...opt })
  return {
    code: r.status,
    out: (r.stdout || '') + (r.stderr || ''),
    error: r.error
  }
}
function die(msg) {
  console.error(`\nsmoke: ${msg}`)
  process.exit(2)
}

// ---------- read the target package ----------
const pkgJsonPath = join(packageDir, 'package.json')
if (!existsSync(pkgJsonPath)) die(`no package.json at ${packageDir}`)
const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'))
if (!pkg.name) die('package.json has no "name"')
console.log(
  `\nsmoke-testing ${pkg.name}@${pkg.version || '?'}  (node ${process.version})\n`
)

// ---------- enumerate the entry points a consumer could import ----------
function collectSpecifiers(p) {
  const name = p.name
  const specs = new Set()
  const exp = p.exports
  if (exp == null || typeof exp === 'string') {
    specs.add(name)
  } else if (typeof exp === 'object') {
    const subpaths = Object.keys(exp).filter(k => k.startsWith('.'))
    if (subpaths.length === 0) {
      specs.add(name) // conditions-only on the root
    } else {
      for (const k of subpaths) {
        if (k.includes('*') || k === './package.json') continue // can't enumerate / not runtime
        if (exp[k] === null) continue // deliberately blocked subpath
        specs.add(k === '.' ? name : name + k.slice(1))
      }
    }
  }
  return [...specs]
}
const specifiers = collectSpecifiers(pkg)
const bins =
  typeof pkg.bin === 'string' ? { [pkg.name]: pkg.bin } : pkg.bin || {}
// Does the package actually promise an importable/runnable surface? Themes,
// config presets and other convention-consumed packages declare none — for
// those, a failed bare import is "not applicable", not a break.
const hasDeclaredSurface =
  !!(pkg.exports || pkg.main || pkg.module) || Object.keys(bins).length > 0

// ---------- scratch dirs ----------
const work = mkdtempSync(join(tmpdir(), 'smoke-'))
const packDest = join(work, 'pack')
const consumer = join(work, 'consumer')
run('mkdir', ['-p', packDest, consumer])
let exitCode = 0
try {
  // optional build before packing
  if (opts.build) {
    const r = run('sh', ['-c', opts.build], packageDir)
    record(
      `build (${opts.build})`,
      r.code === 0,
      r.code === 0 ? null : trunc(r.out)
    )
    if (r.code !== 0) throw new Error('build failed')
  }

  // 1. pack the real tarball
  const packed = run(
    'npm',
    ['pack', '--json', `--pack-destination=${packDest}`],
    packageDir
  )
  let tarball
  try {
    tarball = join(
      packDest,
      JSON.parse(packed.out.trim().replace(/^[^[{]*/, '')).at(0).filename
    )
  } catch {
    // npm can print warnings before the JSON; fall back to the single .tgz it wrote
    tarball = existsSync(packDest)
      ? join(
          packDest,
          run('sh', ['-c', 'ls *.tgz'], packDest).out.trim().split('\n')[0]
        )
      : null
  }
  const packedOk = !!tarball && existsSync(tarball)
  record('npm pack', packedOk, packedOk ? basename(tarball) : trunc(packed.out))
  if (!packedOk) throw new Error('pack failed')

  // 2. install into a clean consumer
  writeFileSync(
    join(consumer, 'package.json'),
    JSON.stringify({ name: 'smoke-consumer', private: true, version: '0.0.0' })
  )
  if (opts.engineStrict)
    writeFileSync(join(consumer, '.npmrc'), 'engine-strict=true\n')
  const consumerDeps = (opts.consumerDeps || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const installArgs = [
    'install',
    tarball,
    ...consumerDeps,
    '--no-audit',
    '--no-fund',
    '--loglevel=error'
  ]
  if (opts.strictPeers) installArgs.push('--strict-peer-deps')
  const inst = run('npm', installArgs, consumer)
  const instLabel = consumerDeps.length
    ? `install into clean consumer (pinned: ${consumerDeps.join(', ')})`
    : 'install into clean consumer'
  record(instLabel, inst.code === 0, inst.code === 0 ? null : trunc(inst.out))
  if (inst.code !== 0) throw new Error('install failed')

  // 3. import every entry point (dynamic import handles both ESM and CJS)
  const driver = join(consumer, '_smoke_driver.mjs')
  writeFileSync(
    driver,
    `const specs = ${JSON.stringify(specifiers)}\n` +
      `let failed = 0\n` +
      `for (const s of specs) {\n` +
      `  try { const m = await import(s); if (m == null) throw new Error('import resolved to null'); console.log('OK ' + s) }\n` +
      `  catch (e) { failed++; console.log('ERR ' + s + ' :: ' + (e && e.message)) }\n` +
      `}\n` +
      `process.exit(failed ? 1 : 0)\n`
  )
  const imp = run('node', ['_smoke_driver.mjs'], consumer)
  for (const line of imp.out.split('\n')) {
    if (line.startsWith('OK ')) record(`import ${line.slice(3)}`, true)
    else if (line.startsWith('ERR ')) {
      const spec = line.slice(4).split(' :: ')[0]
      if (hasDeclaredSurface)
        record(`import ${spec}`, false, line.split(' :: ')[1])
      else
        skip(
          `import ${spec}`,
          'no declared entry point (exports/main/bin) — non-import archetype; needs an archetype-specific smoke'
        )
    }
  }
  if (hasDeclaredSurface && imp.code !== 0) exitCode = 1

  // 4. bin smoke — best effort: did it get published & is it runnable? (nonzero exit is OK)
  for (const name of Object.keys(bins)) {
    const binPath = join(consumer, 'node_modules', '.bin', name)
    if (!existsSync(binPath)) {
      record(`bin ${name} published`, false, 'not found in .bin')
      exitCode = 1
      continue
    }
    const r = run(binPath, ['--help'], consumer, { timeout: 15000 })
    const ran = !r.error // spawn succeeded; any exit code means it executed
    record(
      `bin ${name} runs`,
      ran,
      ran ? null : String(r.error && r.error.code)
    )
    if (!ran) exitCode = 1
  }

  // 5. optional per-package usage script, run against the installed package
  if (opts.script) {
    const dest = join(
      consumer,
      '_smoke_user' + (opts.script.endsWith('.mjs') ? '.mjs' : '.js')
    )
    copyFileSync(resolve(opts.script), dest)
    const r = run('node', [basename(dest)], consumer)
    record(
      `usage script (${basename(opts.script)})`,
      r.code === 0,
      r.code === 0 ? null : trunc(r.out)
    )
    if (r.code !== 0) exitCode = 1
  }
} catch {
  exitCode = exitCode || 1
} finally {
  if (!opts.keep) rmSync(work, { recursive: true, force: true })
  else console.log(`\n(kept scratch at ${work})`)
}

function trunc(s) {
  s = (s || '').trim()
  return s.length > 400 ? s.slice(0, 400) + ' …' : s
}

const passed = results.filter(r => r.ok === true).length
const failed = results.filter(r => r.ok === false).length
const skipped = results.filter(r => r.ok === 'skip').length
const importsPassed = results.filter(
  r => r.ok === true && r.step.startsWith('import ')
).length
const notApplicable = failed === 0 && !hasDeclaredSurface && importsPassed === 0
if (failed > 0) {
  console.log(`\n✗ ${pkg.name}: ${passed} passed, ${failed} failed`)
} else if (notApplicable) {
  console.log(
    `\n⊘ ${pkg.name}: NOT APPLICABLE — no importable entry points. Packs & installs fine, but this is a non-import archetype ` +
      `(e.g. a Slidev theme / config preset). It needs an archetype-specific smoke — for a Slidev theme, \`slidev build\` a sample deck.`
  )
} else {
  console.log(
    `\n✓ ${pkg.name}: ${passed} passed${skipped ? `, ${skipped} skipped` : ''}, 0 failed`
  )
}
if (opts.json)
  console.log(
    JSON.stringify({
      name: pkg.name,
      version: pkg.version,
      passed,
      failed,
      skipped,
      notApplicable,
      ok: exitCode === 0,
      results
    })
  )
process.exit(exitCode)
