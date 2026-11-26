import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after,before,test } from "node:test";
import { build } from "esbuild";
import { Miniflare } from "miniflare";

let mf, alice, bob;
const origin="https://fitness.example", date="2026-11-26", previous="2026-11-20";
const profile={height_cm:175,weight_kg:75,age:30,gender:"male",activity_level:1.55,goal_type:"lose"};
const request=(path,{method="GET",body,cookie=alice,source=origin}={}) => mf.dispatchFetch(origin+path,{method,headers:{Origin:source,...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{"Content-Type":"application/json"})},...(body===undefined?{}:{body:JSON.stringify(body)})});
const postSet=(cookie,logDate,weight,code="bench_press") => request("/api/workouts",{method:"POST",cookie,body:{log_date:logDate,exercise_code:code,weight_kg:weight,reps:10}});
before(async()=>{
  const bundle=await build({entryPoints:["tests/edge-entry.ts"],bundle:true,write:false,format:"esm",platform:"browser",target:"es2022"});
  mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:"2026-07-01",d1Databases:{DB:"dashboard-tests"},bindings:{JWT_SECRET:"dashboard-test-only-"+"z".repeat(48)}});
  const db=await mf.getD1Database("DB"), schema=await readFile("schema.sql","utf8");
  for(const sql of schema.replace(/--[^\n]*/g,"").split(";").map((s)=>s.trim()).filter(Boolean))await db.prepare(sql).run();
  for(const [email,ip] of [["alice@dashboard.test","203.0.113.10"],["bob@dashboard.test","203.0.113.11"]]){
    const result=await mf.dispatchFetch(origin+"/api/auth/register",{method:"POST",headers:{Origin:origin,"Content-Type":"application/json","CF-Connecting-IP":ip},body:JSON.stringify({email,password:"dashboard test password",display_name:email.split("@")[0]})});
    assert.equal(result.status,201); const cookie=result.headers.get("set-cookie").split(";")[0]; if(email.startsWith("alice"))alice=cookie;else bob=cookie;
  }
});
after(async()=>{await mf?.dispose();});

test("all data endpoints require a live JWT session",async()=>{
  for(const path of ["profile","workouts","nutrition"])assert.equal((await request(`/api/${path}`,{cookie:""})).status,401);
});
test("profile calculation is server-owned and account-isolated",async()=>{
  const initial=await(await request("/api/profile")).json(); assert.equal(initial.metrics,null);
  const result=await request("/api/profile",{method:"POST",body:{...profile,user_id:"forged-bob",target_calories:1}});
  assert.equal(result.status,200); const data=await result.json();
  assert.equal(data.metrics.bmr,1699);assert.equal(data.metrics.tdee,2633);assert.equal(data.metrics.target_calories,2238);assert.equal(data.profile.target_calories,2238);assert.notEqual(data.profile.user_id,"forged-bob");
  assert.equal((await(await request("/api/profile",{cookie:bob})).json()).metrics,null);
  const female=await(await request("/api/profile",{method:"POST",cookie:bob,body:{...profile,gender:"female",goal_type:"maintain"}})).json();
  assert.equal(female.metrics.bmr,1533);assert.equal(female.metrics.tdee,2376);
});
test("workouts keep dates, PR and previous sessions scoped to the authenticated user",async()=>{
  assert.equal((await postSet(alice,previous,50)).status,201);await postSet(alice,previous,55);await postSet(bob,previous,200);
  const current=await postSet(alice,date,60);assert.equal(current.status,201);
  await postSet(alice,date,65);await postSet(bob,date,250);await postSet(alice,"2026-12-01",100);
  const data=await(await request(`/api/workouts?date=${date}&exercise_code=bench_press&user_id=forged`)).json();
  assert.equal(data.logs.length,2);assert.deepEqual(data.logs.map((r)=>r.set_number),[1,2]);assert.equal(data.history.pr_weight_kg,65);
  assert.equal(data.history.last_date,previous);assert.deepEqual(data.history.last_sets.map((r)=>r.weight_kg),[50,55]);assert.equal(data.volume_kg,1250);
  assert.equal((await request(`/api/workouts?id=${data.logs[0].id}`,{method:"DELETE",cookie:bob})).status,404);
  assert.equal((await request(`/api/workouts?id=${data.logs[1].id}`,{method:"DELETE"})).status,200);
  assert.equal((await(await request(`/api/workouts?date=${date}&exercise_code=bench_press`)).json()).history.pr_weight_kg,60);
});
test("parallel inserts allocate distinct increasing set numbers",async()=>{
  const responses=await Promise.all(Array.from({length:8},()=>postSet(alice,date,20,"barbell_row")));
  assert.ok(responses.every((r)=>r.status===201));
  const data=await(await request(`/api/workouts?date=${date}&exercise_code=barbell_row`)).json();
  assert.deepEqual(data.logs.filter((r)=>r.exercise_code==="barbell_row").map((r)=>r.set_number),[1,2,3,4,5,6,7,8]);
});
test("nutrition totals, bound SQL text and deletes remain account- and date-isolated",async()=>{
  const food={log_date:date,meal_type:"lunch",food_name:"雞胸肉'); DROP TABLE users;--",calories:165,protein_g:31,carbs_g:0,fat_g:3.6,user_id:"forged"};
  const first=await request("/api/nutrition",{method:"POST",body:food});assert.equal(first.status,201);const entry=(await first.json()).entry;
  await request("/api/nutrition",{method:"POST",body:{...food,food_name:"白飯",calories:195,protein_g:3.9,carbs_g:43,fat_g:.5}});
  await request("/api/nutrition",{method:"POST",body:{...food,log_date:previous,calories:900}});
  const data=await(await request(`/api/nutrition?date=${date}`)).json();assert.deepEqual(data.totals,{calories:360,protein_g:34.9,carbs_g:43,fat_g:4.1,carbs_unknown_count:0,fat_unknown_count:0});
  assert.equal((await(await request(`/api/nutrition?date=${date}`,{cookie:bob})).json()).logs.length,0);
  assert.equal((await request(`/api/nutrition?id=${entry.id}`,{method:"DELETE",cookie:bob})).status,404);
  assert.equal((await request(`/api/nutrition?id=${entry.id}`,{method:"DELETE"})).status,200);
  assert.equal((await(await request(`/api/nutrition?date=${date}`)).json()).totals.calories,195);
  assert.equal((await request("/api/auth/me")).status,200);
});

test("partial food macros survive save/reload without pretending unknown is zero",async()=>{
  const day='2026-11-27';
  const body={log_date:day,meal_type:'lunch',food_name:'大乞丐超人',calories:450,protein_g:25,carbs_g:null,fat_g:null};
  const created=await request('/api/nutrition',{method:'POST',body});assert.equal(created.status,201);
  const initial=await created.json();assert.equal(initial.entry.carbs_g,null);assert.equal(initial.entry.fat_g,null);
  await request('/api/nutrition',{method:'POST',body:{...body,food_name:'蛋餅',calories:261,protein_g:11,carbs_g:34,fat_g:9}});
  const dayData=await(await request(`/api/nutrition?date=${day}`)).json();
  assert.deepEqual(dayData.totals,{calories:711,protein_g:36,carbs_g:34,fat_g:9,carbs_unknown_count:1,fat_unknown_count:1});
  assert.equal(dayData.logs.find(r=>r.food_name==='大乞丐超人').carbs_g,null);
  assert.equal(dayData.logs.find(r=>r.food_name==='蛋餅').carbs_g,34);
  assert.equal((await(await request(`/api/nutrition?date=${day}`,{cookie:bob})).json()).logs.length,0);
  assert.equal((await request(`/api/nutrition?id=${initial.entry.id}`,{method:'DELETE',cookie:bob})).status,404);
  for(const patch of [{calories:null},{protein_g:null},{carbs_g:-1},{fat_g:'unknown'}])assert.equal((await request('/api/nutrition',{method:'POST',body:{...body,...patch}})).status,400);
  assert.equal((await request(`/api/nutrition?id=${initial.entry.id}`,{method:'DELETE'})).status,200);
  const after=await(await request(`/api/nutrition?date=${day}`)).json();assert.equal(after.totals.carbs_unknown_count,0);assert.equal(after.totals.calories,261);
});
test("invalid dates, non-finite or negative numbers, unknown exercises and cross-origin mutations fail",async()=>{
  assert.equal((await request("/api/workouts?date=2026-02-30")).status,400);
  assert.equal((await request("/api/nutrition?date=2025-02-29")).status,400);
  for(const patch of [{reps:0},{weight_kg:-1},{weight_kg:null},{exercise_code:"injected' OR 1=1--"}]){
    assert.equal((await request("/api/workouts",{method:"POST",body:{log_date:date,exercise_code:"bench_press",weight_kg:50,reps:10,...patch}})).status,400);
  }
  assert.equal((await request("/api/profile",{method:"POST",body:{...profile,activity_level:999}})).status,400);
  assert.equal((await request("/api/profile",{method:"POST",body:profile,source:"https://evil.test"})).status,403);
  assert.equal((await request("/api/nutrition?id=not-an-id",{method:"DELETE",source:"https://evil.test"})).status,403);
  assert.equal((await request("/api/nutrition",{method:"POST",body:{log_date:date,meal_type:"lunch",food_name:"food",calories:100,protein_g:-2,carbs_g:0,fat_g:0}})).status,400);
});
test("new catalog exercises are accepted with the server-owned canonical name",async()=>{
  const result=await postSet(alice,"2026-11-28",0,"standing_pallof_press");assert.equal(result.status,201);
  const data=await result.json();assert.equal(data.entry.exercise_code,"standing_pallof_press");assert.match(data.entry.exercise_name,/站姿滑輪抗旋轉推/);assert.equal(data.entry.weight_kg,0);
  const other=await(await request("/api/workouts?date=2026-11-28&exercise_code=standing_pallof_press",{cookie:bob})).json();assert.equal(other.logs.length,0);
});
