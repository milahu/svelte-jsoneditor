import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

const ADDITIONAL_EXPORTS = {
  './dist/jsoneditor.js': './dist/jsoneditor.js',
  './dist/jsoneditor.js.map': './dist/jsoneditor.js.map',
  '.': './index.js'
}

const INDEX_FILE_CONTENTS = `
// ES bundle export
export * from 'dist/jsoneditor.js'
`

export function addBundleExports(packageFolder) {
  const pkgFile = path.join(packageFolder, 'package.json')

  const distPkg = JSON.parse(String(readFileSync(pkgFile)))

  const updatedDistPkg = {
    ...distPkg,
    exports: {
      ...distPkg.exports,
      ...ADDITIONAL_EXPORTS
    }
  }

  writeFileSync(pkgFile, JSON.stringify(updatedDistPkg, null, 2))
}

export function addIndexFile(packageFolder) {
  const indexFile = path.join(packageFolder, 'index.js')

  writeFileSync(indexFile, INDEX_FILE_CONTENTS)
}
