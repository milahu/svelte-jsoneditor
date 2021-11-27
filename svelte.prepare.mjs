#!/usr/bin/env node

import fs from 'fs';
import child_process from 'child_process';



const buildCommand = 'npm run build';
const svelteConfigPath = './svelte.config.js';
let pkgdir = 'package'; // default value
const ignoreFiles = ['.git'];



async function svelteKitPrepare() {

  console.log(buildCommand);
  child_process.execSync(buildCommand, { stdio: 'inherit', windowsHide: true });

  const srcdir = fs.mkdtempSync('src-of-svelte-kit-');
  ignoreFiles.push(srcdir);

  console.log(`move all files to ${srcdir}, except ${ignoreFiles.join(' ')}`);
  const ignoreFilesSet = new Set(ignoreFiles);
  for (const filename of fs.readdirSync('.')) {
    if (ignoreFilesSet.has(filename)) {
      console.log(`ignore ${filename}`);
      continue;
    }
    console.log(`mv -t ${srcdir}/ ${filename}`);
    fs.renameSync(filename, `${srcdir}/${filename}`);
  }

  // get custom pkgdir
  if (fs.existsSync(svelteConfigPath)) {
    console.log(`import ${svelteConfigPath}`)
    const svelteConfig = await import(svelteConfigPath);
    if (svelteConfig.kit?.package?.dir) {
      pkgdir = svelteConfig.kit.package.dir; // custom value
    }
  }

  // move package files back
  for (const filename of fs.readdirSync(`${srcdir}/${pkgdir}`)) {
    console.log(`mv -t ./ ${filename}`);
    fs.renameSync(`${srcdir}/${pkgdir}/${filename}`, filename);
  }

  console.log(`rmdir ${srcdir}/${pkgdir}`)
  fs.rmdirSync(`${srcdir}/${pkgdir}`); // pkgdir should be empty
}



svelteKitPrepare();
