// Lets `node --test` import the Hub's own TypeScript modules: it registers the resolve hook in
// scripts/ts-resolve.mjs, which finds "@/lib/..." and imports written without an extension.
// Node removes the types itself. Used by `pnpm test`.
import { register } from "node:module";

register("./ts-resolve.mjs", import.meta.url);
