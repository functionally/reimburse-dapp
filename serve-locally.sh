#!/usr/bin/env nix-shell
#!nix-shell -I nixpkgs=/home/bbush/.nix-defexpr/channels/nixos-unstable
#!nix-shell -i bash -p nodejs-16_x

npx serve --ssl-cert localhost.crt --ssl-key localhost.key
