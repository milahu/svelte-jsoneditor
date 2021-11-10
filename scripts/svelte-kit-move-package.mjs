#! /usr/bin/env node

// svelte-kit-move-package.mjs

// emulate `npm publish package/` for svelte-kit
// to install svelte-kit packages from git

// move all files from pkgdir to the current workdir
// effectively replacing the workdir with pkgdir

// run this in `prepare` after running `build`
// example package.json:
// {
//   "scripts": {
//     "build": "svelte-kit package",
//     "publish-to-npm": "npm publish package/",
//     "prepare": "npm run build && ./svelte-kit-move-package.mjs"
//   }
// }

import fs from 'fs';

const svelteConfigPath = './svelte.config.js';
const ignoreFiles = ['.git'];

async function svelteKitMovePackage() {

  const srcdir = fs.mkdtempSync('src-of-svelte-kit-');
  ignoreFiles.push(srcdir);

  console.log(`moving all files to ${srcdir}, except ${ignoreFiles.join(' ')}`);
  const ignoreFilesSet = new Set(ignoreFiles);
  for (const filename of fs.readdirSync('.')) {
    if (ignoreFilesSet.has(filename)) {
      console.log(`  ignoring ${filename}`);
      continue;
    }
    console.log(`  mv -t ${srcdir}/ ${filename}`);
    fs.renameSync(filename, `${srcdir}/${filename}`);
  }

  let pkgdir = null;
  if (fs.existsSync(svelteConfigPath)) {
    console.log(`import ${svelteConfigPath}`)
    const svelteConfig = await import(svelteConfigPath);
    if (svelteConfig.kit?.package?.dir) {
      console.log(`using custom pkgdir ${pkgdir}`);
      pkgdir = svelteConfig.kit.package.dir;
    }
  }
  if (!pkgdir) {
    pkgdir = 'package';
    console.log(`using default pkgdir ${pkgdir}`);
  }

  console.log(`moving package files from ${srcdir}/${pkgdir}/* to ./`);
  for (const filename of fs.readdirSync(`${srcdir}/${pkgdir}`)) {
    console.log(`  mv -t ./ ${filename}`);
    fs.renameSync(`${srcdir}/${pkgdir}/${filename}`, filename);
  }

  console.log(`  rmdir ${srcdir}/${pkgdir}`)
  fs.rmdirSync(`${srcdir}/${pkgdir}`); // pkgdir should be empty
}

svelteKitMovePackage();
