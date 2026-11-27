import assert from 'node:assert/strict';
import {test,before} from 'node:test';
import {mkdir,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import {Miniflare} from 'miniflare';
let mod;
before(async()=>{
 await mkdir('.test-output',{recursive:true});
 await build({stdin:{contents:'export * from "./lib/exerciseSources";export * from "./lib/exerciseCoaching";export * from "./lib/exercisesData";export * from "./lib/foodsData";export {default as Viewer} from "./components/MuscleViewer3D";export {default as Video} from "./components/ExerciseVideo";',resolveDir:process.cwd(),loader:'tsx'},outfile:'.test-output/exercise-guides.mjs',bundle:true,packages:'external',format:'esm',platform:'node',jsx:'automatic'});
 mod=await import(pathToFileURL(process.cwd()+'/.test-output/exercise-guides.mjs').href);
});
test('all 50 exercises have a source, an actual video destination, and variant-specific coaching',()=>{
 assert.deepEqual(Object.keys(mod.exerciseSources).sort(),mod.exercisesData.map(e=>e.id).sort());
 for(const e of mod.exercisesData){const source=mod.exerciseSources[e.id],guide=mod.coachingFor(e),url=new URL(source.url);
  assert.ok(['www.nasm.org','www.youtube.com','www.muscleandstrength.com','www.mayoclinic.org'].includes(url.hostname));
  assert.equal(url.protocol,'https:');assert.ok([guide.contact,guide.range,guide.easier].every(text=>text.trim().length>0&&!text.includes('TODO')),e.id);
  assert.ok(guide.sets>=1&&guide.reps>=1);assert.equal(guide.labels.length,4);
  if(source.video.provider==='youtube')assert.match(source.video.id,/^[\w-]{11}$/);else if(source.video.provider==='vimeo')assert.match(source.video.id,/^\d+$/);else assert.equal(new URL(source.video.url).hostname,'www.mayoclinic.org');
 }
 // Do not silently substitute a grip, support setup or added load.
 for(const id of ['one_arm_dumbbell_row','seated_machine_row','standing_calf_raise','goblet_squat','dumbbell_hammer_curl'])assert.ok(mod.exerciseSources[id].variantNote,id);
 assert.equal(mod.exerciseSources.pike_push_up.video.id,'XckEEwa1BPI'); // floor-supported, not feet on a bench
 assert.match(mod.exerciseSources.neutral_grip_lat_pulldown.url,/v-bar/);
 assert.equal(mod.coachingFor(mod.exerciseById.get('forearm_plank')).holdSeconds,20);
});
test('public 3D viewer cannot play the withheld IK motion through legacy props',()=>{
 const html=renderToString(createElement(mod.Viewer,{animationType:'press_incline',isPlayingAnimation:true,defaultPlayingAnimation:true}));
 assert.match(html,/data-mode="unavailable"/);assert.match(html,/data-motion-enabled="false"/);
 assert.ok(!html.includes('播放 3D 動作示範'));assert.ok(!html.includes('動作進度'));assert.match(html,/請先選擇動作/);
});
test('video is opt-in, always has a direct fallback, and discloses differences',()=>{
 const source=mod.exerciseSources.seated_machine_row;
 const html=renderToString(createElement(mod.Video,{source,name:'坐姿寬距對握划船'}));
 assert.ok(!html.includes('<iframe'));assert.match(html,/在 YouTube 觀看/);assert.match(html,/窄距對握/);
 assert.ok(html.includes(source.url));
 const limited=mod.exerciseSources.dumbbell_hammer_curl;
 const external=renderToString(createElement(mod.Video,{source:limited,name:'啞鈴槌式彎舉'}));
 assert.ok(!external.includes('<iframe'));assert.ok(!external.includes('載入實人示範'));
 assert.ok(external.includes(limited.url));assert.match(external,/作者限制影片僅在原網站播放/);
});
test('four requested food defaults preserve exact custom values and explicit unknown macros',()=>{
 assert.equal(mod.foodsData.length,24);const get=id=>mod.foodsData.find(f=>f.id===id);
 assert.deepEqual([get('big_beggar_superman').calories,get('big_beggar_superman').protein_g],[450,25]);
 assert.deepEqual([get('small_beggar_superman').calories,get('small_beggar_superman').protein_g],[300,15]);
 assert.equal(get('big_beggar_superman').carbs_g,null);assert.equal(get('small_beggar_superman').fat_g,null);
 assert.equal(get('egg_pancake').calories,261);assert.equal(get('latte').calories,124);
 assert.ok(get('latte').source.url.startsWith('https://www.mcdonalds.com/tw/'));
});
test('additive D1 migration retains old values and flags them as known',async()=>{
 const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-07-01',d1Databases:{DB:'partial-migration'}});
 try{const db=await mf.getD1Database('DB');
  await db.prepare('CREATE TABLE nutrition_logs(id TEXT PRIMARY KEY,calories INTEGER,protein_g REAL,carbs_g REAL NOT NULL,fat_g REAL NOT NULL)').run();
  await db.prepare('INSERT INTO nutrition_logs VALUES(?,?,?,?,?)').bind('existing-meal',450,25,42,13).run();
  const migration=await readFile('migrations/0002_partial_nutrition.sql','utf8');
  for(const sql of migration.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
  const old=await db.prepare('SELECT * FROM nutrition_logs WHERE id=?').bind('existing-meal').first();
  assert.deepEqual(old,{id:'existing-meal',calories:450,protein_g:25,carbs_g:42,fat_g:13,carbs_known:1,fat_known:1});
 }finally{await mf.dispose();}
});
