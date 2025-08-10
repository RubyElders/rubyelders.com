# rubyelders.com

## start "dev server"

```
npx --yes chokidar-cli "**/*.{erb,json,md,rb,ebr}" -c "ruby generate.rb"
```

## build

```
ruby generate.rb
```

## manual deploy (push to gh-pages)

Just commit changes, other to ruby generate.rb, there is no build needed.

*Usually there is no need for manual deploy. `master` branch is automatically deployed by GitHub actions.*
