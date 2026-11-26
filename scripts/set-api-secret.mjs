import {createRequire} from "node:module";
import {dirname,join} from "node:path";
import {randomBytes} from "node:crypto";
import {spawnSync} from "node:child_process";
// Run only when provisioning a NEW API. Re-running rotates the key and ends existing sessions.
const require=createRequire(import.meta.url),cli=join(dirname(require.resolve("wrangler/package.json")),"bin/wrangler.js");
const result=spawnSync(process.execPath,[cli,"secret","put","JWT_SECRET","--config","wrangler.api.toml"],{input:randomBytes(32).toString("hex")+"\n",stdio:["pipe","inherit","inherit"]});
if(result.error)throw result.error;process.exit(result.status??1);
