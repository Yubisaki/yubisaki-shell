# yubisaki-shell

## USAGE

```bash
yarn global add yubisaki-shell

# deploy
yubisaki deploy -u <github userName> -p <vuepress docs dir> -r <github repository address>
# example
yubisaki deploy -u bloss -p docs -r bloss.github.io

# new post article
yubisaki post -p <file path> --page <filename>
# example
yubisaki post -p docs/hello --page index.md
```