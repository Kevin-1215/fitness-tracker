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
test('only twelve named variants enable the reconstructed renderer',()=>{
 assert.equal(m.CONTROLLED_MOTION_COUNT,12);
 for(const id of Object.keys(m.controlledMotions))assert.ok(m.exerciseById.has(id),id);
 assert.equal(m.controlledMotionFor('machine_chest_press'),undefined);
 assert.equal(m.controlledMotionFor('reverse_barbell_curl'),undefined);
 for(const id of ['constructor','toString','__proto__'])assert.equal(m.controlledMotionFor(id),undefined);
 for(const id of ['incline_dumbbell_press','bench_press','barbell_back_squat'])assert.match(renderToString(createElement(m.Viewer,{exerciseId:id})),/data-mode="controlled-motion"/);
 assert.match(renderToString(createElement(m.Viewer,{animationType:'press_horizontal',isPlayingAnimation:true})),/data-motion-enabled="false"/);
});
test('joint chains keep fixed segment lengths, hinge directions and grounded feet through the full cycle',()=>{
 const limits={arm:140*Math.PI/180,knee:130*Math.PI/180,wrist:25*Math.PI/180};
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
    assert.ok(a.flexion>=0&&a.flexion<=limits.arm,id);assert.ok(l.flexion>=0&&l.flexion<=limits.knee,id);assert.ok(a.wristDeviation<=limits.wrist,id);
    assert.ok(l.ankle.distanceTo(initial.legs[side].ankle)<1e-8,id+' foot slides');
    assert.ok(Math.abs(l.ankle.y-.11)<1e-8,id+' ankle loses support');
    assert.ok(Math.abs(a.lower.y)+Math.abs(a.lower.z)<1e-8,id+' elbow gains an extra axis');
    assert.ok(Math.abs(l.lower.y)+Math.abs(l.lower.z)<1e-8,id+' knee gains an extra axis');
    if(previous)assert.ok(a.upper.angleTo(previous.arms[side].upper)<.08,id+' shoulder discontinuity');
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
    if(e.equipment==='啞鈴'){const d=renderer.scene.findAllByProps({name:'dumbbell'})[side].instance;assert.ok(d.getWorldPosition(new Vector3()).distanceTo(p.arms[side].grip)<1e-5,id+' floating dumbbell');}
    const footWorld=ankle.getWorldQuaternion(new Quaternion());assert.ok(new Vector3(0,1,0).applyQuaternion(footWorld).distanceTo(new Vector3(0,1,0))<1e-5,id+' shoe tilts through floor');
   }
   const bounds=new Box3();root.traverseVisible(object=>{if(object.isMesh&&object.geometry&&!object.isLine2){object.geometry.computeBoundingBox();bounds.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));}});
   assert.ok(bounds.min.y>-.005,id+' surface below floor');
   for(const aspect of [320/410,628/530])for(const view of ['front','side','back','reset']){
    const fit=m.fitCamera(m.controlledEnvelope(id,e.equipment),aspect,view),camera=new PerspectiveCamera(37,aspect,.1,80);camera.position.copy(fit.position);camera.lookAt(fit.target);camera.updateMatrixWorld();
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const screen=new Vector3(x,y,z).project(camera);assert.ok(Math.abs(screen.x)<.98&&Math.abs(screen.y)<.98,id+' clipped '+view);}
   }
  }}finally{await renderer.unmount();}
 }
});
