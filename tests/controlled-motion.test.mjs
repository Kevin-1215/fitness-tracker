import assert from 'node:assert/strict';
import {before,test} from 'node:test';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import Renderer from '@react-three/test-renderer';
import {Box3,PerspectiveCamera,Quaternion,Vector3} from 'three';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let m;
before(async()=>{
 await mkdir('.test-output',{recursive:true});
 await build({stdin:{contents:'export * from "./lib/controlledMotion";export * from "./lib/motionCatalog";export * from "./lib/exercisesData";export * from "./lib/sceneFraming";export {ControlledHuman} from "./components/anatomy/ControlledHuman";export {default as Viewer} from "./components/MuscleViewer3D";',resolveDir:process.cwd()},outfile:'.test-output/controlled-motion-test.mjs',bundle:true,packages:'external',format:'esm',platform:'node',jsx:'automatic'});
 m=await import(pathToFileURL(process.cwd()+'/.test-output/controlled-motion-test.mjs').href);
});
const originalIds=new Set(['bench_press','dumbbell_bench_press','close_grip_bench_press','incline_dumbbell_press','incline_barbell_press','barbell_biceps_curl','dumbbell_hammer_curl','alternating_dumbbell_curl','dumbbell_lateral_raise','dumbbell_front_raise','barbell_back_squat','dumbbell_romanian_deadlift']);
test('every library exercise enables its reconstructed renderer',()=>{
 assert.equal(m.CONTROLLED_MOTION_COUNT,m.exercisesData.length);assert.equal(m.CONTROLLED_MOTION_COUNT,50);
 for(const id of Object.keys(m.controlledMotions))assert.ok(m.exerciseById.has(id),id);
 assert.equal(m.controlledMotionFor('machine_chest_press').kind,'chest_machine');
 assert.equal(m.controlledMotionFor('reverse_barbell_curl').kind,'reverse_curl');
 for(const id of ['constructor','toString','__proto__'])assert.equal(m.controlledMotionFor(id),undefined);
 for(const id of ['incline_dumbbell_press','bench_press','barbell_back_squat'])assert.match(renderToString(createElement(m.Viewer,{exerciseId:id})),/data-mode="controlled-motion"/);
 assert.match(renderToString(createElement(m.Viewer,{animationType:'press_horizontal',isPlayingAnimation:true})),/data-motion-enabled="false"/);
});
test('joint chains keep fixed segment lengths, hinge directions and grounded feet through the full cycle',()=>{
 const limits={arm:150*Math.PI/180,knee:155*Math.PI/180,wrist:25*Math.PI/180};
 for(const id of Object.keys(m.controlledMotions)){
  const initial=m.sampleControlledPose(id,0);let previous;
  for(let n=0;n<=100;n++){
   const p=m.sampleControlledPose(id,n/100);
   for(let side=0;side<2;side++){
    const a=p.arms[side],l=p.legs[side];
    assert.ok(Math.abs(a.shoulder.distanceTo(a.elbow)-m.BODY.upperArm)<1e-8,id);
    assert.ok(Math.abs(a.elbow.distanceTo(a.wrist)-m.BODY.forearm)<1e-8,id);
    assert.ok(Math.abs(l.hip.distanceTo(l.knee)-m.BODY.thigh)<1e-8,id);
    assert.ok(Math.abs(l.knee.distanceTo(l.ankle)-m.BODY.shin)<1e-8,id);
    assert.ok(a.flexion>=0&&a.flexion<=limits.arm,id);assert.ok(l.flexion>=0&&l.flexion<=limits.knee,id);assert.ok(a.wristDeviation<=(a.palm?90*Math.PI/180:limits.wrist),id+' wrist alignment');
    if(originalIds.has(id))assert.ok(l.ankle.distanceTo(initial.legs[side].ankle)<1e-8,id+' foot slides');
    if(originalIds.has(id))assert.ok(Math.abs(l.ankle.y-.11)<1e-8,id+' ankle loses support');
    assert.ok(Math.abs(a.lower.y)+Math.abs(a.lower.z)<1e-8,id+' elbow gains an extra axis');
    assert.ok(Math.abs(l.lower.y)+Math.abs(l.lower.z)<1e-8,id+' knee gains an extra axis');
    if(previous)assert.ok(a.upper.angleTo(previous.arms[side].upper)<.25,id+' shoulder discontinuity');
   }
   previous=p;
  }
 }
});
test('barbell grip width is invariant; both hands stay on the shaft',()=>{
 for(const id of ['bench_press','incline_barbell_press','close_grip_bench_press','barbell_biceps_curl','barbell_back_squat']){
  const initial=m.sampleControlledPose(id,0),width=initial.arms[0].grip.distanceTo(initial.arms[1].grip);
  for(let n=0;n<=40;n++){const p=m.sampleControlledPose(id,n/40);
   assert.ok(Math.abs(p.arms[0].grip.distanceTo(p.arms[1].grip)-width)<1e-5,id);
   for(const a of p.arms){assert.ok(Math.abs(a.grip.y-p.equipmentPosition.y)<1e-5);assert.ok(Math.abs(a.grip.z-p.equipmentPosition.z)<1e-5);}
  }
 }
});
test('hip hinge stays distinct from squat and raises stop near shoulder height',()=>{
 const hinge=m.sampleControlledPose('dumbbell_romanian_deadlift',1),squat=m.sampleControlledPose('barbell_back_squat',1);
 assert.ok(hinge.legs[0].flexion*180/Math.PI<30);assert.ok(squat.legs[0].flexion*180/Math.PI>110);
 assert.ok(hinge.root.z<m.sampleControlledPose('dumbbell_romanian_deadlift',0).root.z-.4);
 for(const id of ['dumbbell_lateral_raise','dumbbell_front_raise'])for(let n=0;n<=40;n++){const p=m.sampleControlledPose(id,n/40);assert.ok(p.arms.every(a=>a.grip.y<a.shoulder.y+.01),id);}
 const left=m.sampleControlledPose('alternating_dumbbell_curl',1,0),right=m.sampleControlledPose('alternating_dumbbell_curl',1,1);
 assert.ok(left.arms[0].flexion>left.arms[1].flexion);assert.ok(right.arms[1].flexion>right.arms[0].flexion);
});
test('cycle keyframes have stable pauses and continuous reversal',()=>{
 assert.equal(m.cycleDepth(0),0);assert.equal(m.cycleDepth(.54),1);assert.equal(m.cycleDepth(1),0);
 for(const t of [.08,.5,.58,.94])assert.ok(Math.abs(m.cycleDepth(t-1e-6)-m.cycleDepth(t+1e-6))<1e-6);
});
test('closed-chain supports, opposing limbs, calf pivot and leg-press plate remain coherent',()=>{
 for(const id of ['pull_up','hanging_knee_raise','inverted_row','push_up','diamond_push_up','pike_push_up','forearm_plank']){
  const start=m.sampleControlledPose(id,0);
  for(let i=0;i<=60;i++){const p=m.sampleControlledPose(id,i/60);for(let side=0;side<2;side++)assert.ok(p.arms[side].grip.distanceTo(start.arms[side].grip)<1e-4,id+' support hand drifts');}
 }
 for(const id of ['dead_bug','bird_dog'])for(const side of [0,1]){
  const a=m.sampleControlledPose(id,0,side),b=m.sampleControlledPose(id,1,side);
  assert.ok(a.arms[side].grip.distanceTo(b.arms[side].grip)>.3);assert.ok(a.legs[1-side].ankle.distanceTo(b.legs[1-side].ankle)>.3);
  assert.ok(a.arms[1-side].grip.distanceTo(b.arms[1-side].grip)<1e-5);assert.ok(a.legs[side].knee.distanceTo(b.legs[side].knee)<1e-5);
 }
 for(let n=0;n<=40;n++){
  const p=m.sampleControlledPose('standing_calf_raise',n/40);
  const toe=new Vector3(0,-.11,.25).applyAxisAngle(new Vector3(1,0,0),35*n/40*Math.PI/180).add(p.legs[0].ankle);assert.ok(toe.distanceTo(new Vector3(-.26,0,.25))<1e-6);
  const leg=m.sampleControlledPose('leg_press',n/40),local=leg.legs[0].ankle.clone().sub(leg.plate.position).applyQuaternion(leg.plate.rotation.clone().invert());assert.ok(local.distanceTo(new Vector3(-.28,.145,-.085))<1e-6);
 }
 const plank0=m.sampleControlledPose('forearm_plank',0),plank1=m.sampleControlledPose('forearm_plank',1);assert.deepEqual(plank0.points.map(v=>v.toArray()),plank1.points.map(v=>v.toArray()));
 for(const [id,end]of [['standing_cable_fly',1],['dumbbell_chest_fly',0]]){const a=m.sampleControlledPose(id,end);assert.ok(a.arms[0].grip.distanceTo(a.arms[1].grip)<.35,id+' hands do not close');}
 for(const id of ['dumbbell_side_bend','kneeling_cable_crunch']){const a=m.sampleControlledPose(id,0),b=m.sampleControlledPose(id,1);assert.ok(a.root.distanceTo(b.root)<1e-8);assert.ok(a.spine.angleTo(b.spine)>.2);}
});
test('playback advances, pause freezes and seeking remains stable when changing speed',async()=>{
 let frame;
 const props={exerciseId:'incline_dumbbell_press',equipment:'啞鈴',primaryMuscles:[],secondaryMuscles:[],playing:false,cycleDuration:6,xray:false,guides:true,pulse:false,selected:null,onSelect(){},onFrame(value){frame=value;}};
 const renderer=await Renderer.create(createElement(m.ControlledHuman,props));
 try{
  await renderer.advanceFrames(2,.1);const paused=frame.progress;
  await renderer.advanceFrames(6,.1);assert.equal(frame.progress,paused);
  await renderer.update(createElement(m.ControlledHuman,{...props,playing:true}));await renderer.advanceFrames(6,.1);assert.ok(frame.progress>paused+.08);
  await renderer.update(createElement(m.ControlledHuman,{...props,seek:{value:.54,revision:1}}));await renderer.advanceFrames(2,.1);assert.ok(Math.abs(frame.progress-.54)<1e-8);assert.equal(frame.depth,1);
  await renderer.update(createElement(m.ControlledHuman,{...props,cycleDuration:12,seek:{value:.54,revision:1}}));await renderer.advanceFrames(2,.1);assert.ok(Math.abs(frame.progress-.54)<1e-8);
  await renderer.update(createElement(m.ControlledHuman,{...props,playing:true,cycleDuration:12}));await renderer.advanceFrames(6,.1);assert.ok(frame.progress>.575&&frame.progress<.60);
 }finally{await renderer.unmount();}
});
test('rendered hands, weights, joint pivots and shoes match the constrained motion',async()=>{
 for(const id of Object.keys(m.controlledMotions)){
  const e=m.exerciseById.get(id),props={exerciseId:id,equipment:e.equipment,primaryMuscles:e.primaryMuscles,secondaryMuscles:e.secondaryMuscles,playing:false,cycleDuration:6,xray:false,guides:false,pulse:false,selected:null,onSelect(){},onFrame(){}};
  const renderer=await Renderer.create(createElement(m.ControlledHuman,props));
  try{for(const [revision,progress]of [0,.3,.54].entries()){
   await renderer.update(createElement(m.ControlledHuman,{...props,seek:{value:progress,revision}}));await renderer.advanceFrames(2,.016);
   const root=renderer.scene.instance;root.updateMatrixWorld(true);const p=m.sampleControlledPose(id,m.cycleDepth(progress));
   for(let side=0;side<2;side++){
    const grip=renderer.scene.findByProps({name:'controlled-grip-'+side}).instance,wrist=renderer.scene.findByProps({name:'controlled-wrist-'+side}).instance,ankle=renderer.scene.findByProps({name:'controlled-ankle-'+side}).instance;
    assert.ok(grip.getWorldPosition(new Vector3()).distanceTo(p.arms[side].grip)<1e-5,id+' detached grip');
    assert.ok(wrist.getWorldPosition(new Vector3()).distanceTo(p.arms[side].wrist)<1e-5,id+' detached wrist');
    assert.ok(ankle.getWorldPosition(new Vector3()).distanceTo(p.legs[side].ankle)<1e-5,id+' detached ankle');
    if(e.equipment==='啞鈴'&&(p.spec.dumbbellHands??[0,1]).includes(side)){const d=renderer.scene.findAllByProps({name:'dumbbell'})[(p.spec.dumbbellHands??[0,1]).indexOf(side)].instance;assert.ok(d.getWorldPosition(new Vector3()).distanceTo(p.arms[side].grip)<1e-5,id+' floating dumbbell');}
    const footWorld=ankle.getWorldQuaternion(new Quaternion());if(originalIds.has(id))assert.ok(new Vector3(0,1,0).applyQuaternion(footWorld).distanceTo(new Vector3(0,1,0))<1e-5,id+' shoe tilts through floor');
   }
   const bounds=new Box3();let surfaceMin=Infinity;root.traverseVisible(object=>{if(object.isMesh&&object.geometry&&!object.isLine2&&object.name!=='floor-mat'){object.geometry.computeBoundingBox();const b=object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld);bounds.union(b);if(b.min.y<-.005){const positions=object.geometry.getAttribute('position'),point=new Vector3();for(let n=0;n<positions.count;n++)surfaceMin=Math.min(surfaceMin,point.fromBufferAttribute(positions,n).applyMatrix4(object.matrixWorld).y);}}});
   assert.ok(surfaceMin>-.005,id+' surface below floor: '+surfaceMin);
   for(const aspect of [320/410,628/530])for(const view of ['front','side','back','reset']){
    const fit=m.fitCamera(m.controlledEnvelope(id,e.equipment),aspect,view),camera=new PerspectiveCamera(37,aspect,.1,80);camera.position.copy(fit.position);camera.lookAt(fit.target);camera.updateMatrixWorld();
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const screen=new Vector3(x,y,z).project(camera);assert.ok(Math.abs(screen.x)<.98&&Math.abs(screen.y)<.98,id+' clipped '+view);}
   }
  }}finally{await renderer.unmount();}
 }
});
