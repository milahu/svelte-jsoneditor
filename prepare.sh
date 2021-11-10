#!/bin/sh

set -e # throw on error

npm run build
mkdir .src
shopt -s dotglob
( mv * .src/ || true ) # move all except .src
( mv .src/.git ./ || true ) # maybe restore git
mv .src/package/* ./
rmdir .src/package
