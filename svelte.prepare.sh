#!/bin/sh

pkgdir=package # svelte.config.js: kit.package.dir
srcdir=.src

set -e # throw on error
shopt -s dotglob # also move hidden files
shopt -s extglob # move by regex
set -o xtrace # print commands

mkdir $srcdir
npm run build
mv !($srcdir|.git) $srcdir/ # move all except $srcdir and .git
#[ -d $srcdir/.git ] && mv $srcdir/.git ./ # restore git
mv $srcdir/$pkgdir/* ./
rmdir $srcdir/$pkgdir
