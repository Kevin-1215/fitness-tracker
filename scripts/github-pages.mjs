import {spawnSync} from "node:child_process";
const [mode,apiOrigin]=process.argv.slice(2);
const credential=spawnSync("git",["credential","fill"],{input:"protocol=https\nhost=github.com\n\n",encoding:"utf8",env:{...process.env,GIT_TERMINAL_PROMPT:"0",GCM_INTERACTIVE:"Never"}});
const fields=Object.fromEntries((credential.stdout??"").trim().split("\n").map(line=>{const i=line.indexOf("=");return [line.slice(0,i),line.slice(i+1)];}));
if(!fields.password)throw new Error("Sign in to GitHub through Git Credential Manager first");
const headers={Authorization:`Bearer ${fields.password}`,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json"};
async function request(path,method="GET",body){const response=await fetch("https://api.github.com"+path,{method,headers,...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(`GitHub ${method} ${path}: HTTP ${response.status} ${(await response.json()).message??""}`);return response.status===204?null:response.json();}
const user=await request("/user");if(user.login!=="Kevin-1215")throw new Error("Unexpected GitHub account; review target owner");
const repo="/repos/Kevin-1215/fitness-tracker";
if(mode==="create"){
  const existing=await fetch("https://api.github.com"+repo,{headers});
  if(existing.status===404){const created=await request("/user/repos","POST",{name:"fitness-tracker",description:"FORM: workout and nutrition journal with interactive anatomy, GitHub Pages frontend and Cloudflare D1 API",private:false,auto_init:false});console.log(`Created ${created.html_url}`);}
  else if(existing.ok)console.log("Existing repository retained");else throw new Error(`Repository lookup ${existing.status}`);
}else if(mode==="configure"||mode==="variable"){
  if(!apiOrigin||new URL(apiOrigin).origin!==apiOrigin||!apiOrigin.startsWith("https://"))throw new Error("Supply exact HTTPS API origin");
  const existing=await fetch("https://api.github.com"+repo+"/actions/variables/VITE_API_ORIGIN",{headers});
  await request(repo+(existing.status===404?"/actions/variables":"/actions/variables/VITE_API_ORIGIN"),existing.status===404?"POST":"PATCH",{name:"VITE_API_ORIGIN",value:apiOrigin});
  if(mode==="variable"){console.log("Configured public VITE_API_ORIGIN repository variable");process.exit(0);}
  const pages=await fetch("https://api.github.com"+repo+"/pages",{headers});
  await request(repo+"/pages",pages.status===404?"POST":"PUT",{build_type:"workflow"});console.log("Configured API origin and GitHub Actions Pages publishing");
}else if(mode==="status"){
  const runs=await request(repo+"/actions/runs?per_page=3");console.log(JSON.stringify(runs.workflow_runs.map(run=>({id:run.id,status:run.status,conclusion:run.conclusion,url:run.html_url,head:run.head_sha}))));
  const pages=await request(repo+"/pages");console.log(JSON.stringify({pages:pages.html_url,status:pages.status,build_type:pages.build_type}));
}else throw new Error("Usage: node scripts/github-pages.mjs create | configure https://api-origin | status");
