#!/bin/sh

pkgdir=package # svelte.config.js: kit.package.dir
srcdir=.src

set -e # throw on error
set -o xtrace # print commands

mkdir $srcdir

npm run build

# move all files except $srcdir and .git
find . -mindepth 1 -maxdepth 1 -not '(' -name "$srcdir" -or .git ')' -exec mv -t "$srcdir" '{}' ';'

# move package files back
find "$srcdir/$pkgdir" -mindepth 1 -maxdepth 1 -exec mv -t ./ '{}' ';'

rmdir "$srcdir/$pkgdir"
