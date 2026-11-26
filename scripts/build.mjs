import { createRequire } from "node:module";
import { dirname,join } from "node:path";
import { spawnSync } from "node:child_process";
const require=createRequire(import.meta.url);
for(const args of [
  [join(dirname(require.resolve("vite/package.json")),"bin/vite.js"),"build"],
  [join(dirname(require.resolve("wrangler/package.json")),"bin/wrangler.js"),"pages","functions","build","functions","--outdir=dist-worker"],
]){const result=spawnSync(process.execPath,args,{stdio:"inherit",env:process.env});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);}
