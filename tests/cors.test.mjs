import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {after,before,test} from "node:test";
import {build} from "esbuild";
import {Miniflare} from "miniflare";
const frontend="https://kevin-1215.github.io",origin="https://api.example.test";
let mf,cookie;
const request=(path,options={})=>mf.dispatchFetch(origin+path,{...options,headers:{Origin:frontend,...(cookie?{Cookie:cookie}:{}),...options.headers}});
before(async()=>{
  const bundle=await build({entryPoints:["worker/index.ts"],bundle:true,write:false,format:"esm",platform:"browser",target:"es2022"});
  mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:"2026-07-01",d1Databases:{DB:"cors-tests"},bindings:{JWT_SECRET:"cors-test-only-"+"c".repeat(48),FRONTEND_ORIGIN:frontend}});
  const db=await mf.getD1Database("DB"),schema=await readFile("schema.sql","utf8");
  for(const sql of schema.replace(/--[^\n]*/g,"").split(";").map(value=>value.trim()).filter(Boolean))await db.prepare(sql).run();
});
after(async()=>{await mf?.dispose();});
test("CORS preflight trusts only the exact frontend and supported headers and methods",async()=>{
  const response=await request("/api/profile",{method:"OPTIONS",headers:{"Access-Control-Request-Method":"POST","Access-Control-Request-Headers":"content-type"}});
  assert.equal(response.status,204);assert.equal(response.headers.get("Access-Control-Allow-Origin"),frontend);assert.equal(response.headers.get("Access-Control-Allow-Credentials"),"true");assert.equal(response.headers.get("Access-Control-Allow-Methods"),"GET, POST");
  for(const headers of [{Origin:frontend+".evil.test"},{"Access-Control-Request-Method":"PATCH"},{"Access-Control-Request-Method":"POST","Access-Control-Request-Headers":"authorization"}]){
    const rejected=await request("/api/profile",{method:"OPTIONS",headers:{"Access-Control-Request-Method":"POST",...headers}});assert.equal(rejected.status,403);
  }
  const evil=await request("/api/auth/me",{headers:{Origin:"https://evil.test"}});assert.equal(evil.status,403);assert.equal(evil.headers.get("Access-Control-Allow-Origin"),null);
});
test("cross-origin register issues a Secure HttpOnly partitioned cookie and the session owns D1 data",async()=>{
  const response=await request("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:"cors@example.test",password:"cors test password",display_name:"CORS"})});
  assert.equal(response.status,201);const setCookie=response.headers.get("Set-Cookie");assert.match(setCookie,/^__Host-fit_session=/);for(const attribute of ["Secure","HttpOnly","SameSite=None","Partitioned"])assert.ok(setCookie.includes(attribute));
  cookie=setCookie.split(";")[0];
  assert.equal((await request("/api/auth/me")).status,200);
  const profile=await request("/api/profile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({height_cm:175,weight_kg:75,age:30,gender:"male",activity_level:1.55,goal_type:"maintain"})});assert.equal(profile.status,200);assert.equal((await profile.json()).metrics.tdee,2633);
});
test("CORS also applies to auth errors and logout revokes the same partitioned cookie",async()=>{
  const unsupported=await request("/api/profile",{method:"DELETE"});assert.equal(unsupported.status,405);assert.equal(unsupported.headers.get("Allow"),"GET, POST");assert.equal(unsupported.headers.get("Access-Control-Allow-Origin"),frontend);
  const logout=await request("/api/auth/logout",{method:"POST"});assert.equal(logout.status,200);assert.match(logout.headers.get("Set-Cookie"),/Max-Age=0/);assert.match(logout.headers.get("Set-Cookie"),/Partitioned/);
  const revoked=await request("/api/auth/me");assert.equal(revoked.status,401);assert.equal(revoked.headers.get("Access-Control-Allow-Origin"),frontend);assert.match(revoked.headers.get("Cache-Control"),/private, no-store/);
});
