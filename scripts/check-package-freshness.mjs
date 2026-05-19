#!/usr/bin/env node
// Bloque les packages publiés depuis moins de MIN_AGE_DAYS jours.
// Déclenché par le hook pre-commit quand package.json change.

import { readFileSync } from 'fs'
import { execSync } from 'child_process'

const MIN_AGE_DAYS = 21
const MIN_AGE_MS = MIN_AGE_DAYS * 24 * 60 * 60 * 1000

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }

// Uniquement les packages qui changent vs la version commitée
let changedDeps
try {
  const base = execSync('git show HEAD:package.json 2>/dev/null', { stdio: ['pipe', 'pipe', 'ignore'] }).toString()
  const baseDeps = { ...JSON.parse(base).dependencies, ...JSON.parse(base).devDependencies }
  changedDeps = Object.entries(allDeps).filter(([n, v]) => baseDeps[n] !== v)
} catch {
  changedDeps = Object.entries(allDeps)
}

if (changedDeps.length === 0) process.exit(0)

console.log(`\nVérification de l'âge de ${changedDeps.length} package(s) modifié(s)...`)

const now = Date.now()
const tooFresh = []

for (const [name, spec] of changedDeps) {
  const version = spec.replace(/^[\^~>=<\s]+/, '').split(/[\s<>=]/)[0]
  const url = name.startsWith('@')
    ? `https://registry.npmjs.org/${name.replace('/', '%2F')}`
    : `https://registry.npmjs.org/${name}`
  try {
    const data = await (await fetch(url)).json()
    const published = data.time?.[version]
    if (!published) continue
    const ageDays = Math.floor((now - new Date(published).getTime()) / (1000 * 60 * 60 * 24))
    if (ageDays < MIN_AGE_DAYS) tooFresh.push({ name, version, ageDays, date: published.slice(0, 10) })
  } catch { /* skip si pas de réseau */ }
}

if (tooFresh.length > 0) {
  console.error(`\n[BLOQUÉ] ${tooFresh.length} package(s) publié(s) il y a moins de ${MIN_AGE_DAYS} jours :\n`)
  for (const { name, version, ageDays, date } of tooFresh)
    console.error(`  ${name}@${version}  —  publié le ${date} (${ageDays} jour${ageDays > 1 ? 's' : ''})`)
  console.error(`\nAttends ${MIN_AGE_DAYS} jours avant d'ajouter ces packages.\n`)
  process.exit(1)
}

console.log(`OK — tous les packages ont au moins ${MIN_AGE_DAYS} jours.\n`)
