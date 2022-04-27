#! /usr/bin/env node

import fs from 'fs'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))

for (const key of ['svelte', 'module', 'main']) {
  if (!pkg[key]) continue
  // workaround: avoid double-patching
  // FIXME why is this script is called twice
  if (pkg[key].startsWith('package/')) continue
  pkg[key] = 'package/' + pkg[key]
}

fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n', 'utf8')
