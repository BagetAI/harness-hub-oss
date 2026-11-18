# Contributing

Thanks for helping. Harness Hub is small on purpose: a store of text, a website to see it, and a
connector for agents. Changes that keep it that way are the easiest to take.

## Before you start

For anything larger than a fix, open an issue first and say what you want to change and why.
[docs/how-it-works.md](docs/how-it-works.md) has the rules the code keeps; a change that breaks one
of them needs a reason.

## Running it

```bash
pnpm install
cp .env.example .env.local   # fill in the values
pnpm dev                     # http://localhost:3210
```

You need your own Neon database and Clerk application for the dev server and the store checks.
Keep `HUB_TABLE_PREFIX=dev_` in `.env.local`, so local data stays in its own tables.

## Checks

| Command | Needs | Runs on pull requests |
|---|---|---|
| `pnpm test` | nothing | yes |
| `pnpm lint`, `pnpm typecheck`, `pnpm build` | nothing | yes |
| `pnpm check:store` | a database | no: run it locally |
| `pnpm smoke` | `pnpm dev` running | no: run it locally |

A change comes with tests in the layer that can see it (the Tests section of
[docs/how-it-works.md](docs/how-it-works.md) says which), and with that page brought up to date.

## Pull requests

- One change per pull request, with a short description of what it changes for the person using
  the Hub.
- Say which checks you ran. The automatic ones must pass.
- Never commit a real key, token or address. `.env.local` is ignored; keep it that way.

By sending a pull request you agree that your change is released under the [MIT license](LICENSE).
