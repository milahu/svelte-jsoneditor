#!/bin/sh

pkgdir=package # svelte.config.js: kit.package.dir
srcdir=.src

set -e # throw on error
set -o xtrace # print commands

if [ -d "$srcdir" ]
then
  if ! (rmdir "$srcdir") # remove empty srcdir
  then
    echo "error: srcdir $srcdir is not empty"
    exit 1
  fi
fi

mkdir "$srcdir"

npm run build

# move all files except $srcdir and .git
find . -mindepth 1 -maxdepth 1 '(' -not -name "$srcdir" -and -not -name .git ')' -exec mv -t "$srcdir" '{}' ';'

# move package files back
find "$srcdir/$pkgdir" -mindepth 1 -maxdepth 1 -exec mv -t ./ '{}' ';'

rmdir "$srcdir/$pkgdir"
