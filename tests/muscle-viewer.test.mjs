import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { before, test } from "node:test";
import { build } from "esbuild";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import {Box3,PerspectiveCamera,Vector3} from "three";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let module;
before(async () => {
  await mkdir(".test-output", { recursive: true });
  await build({
    stdin: { contents: 'export * from "./lib/exercisesData"; export * from "./lib/sceneFraming"; export * from "./lib/motionRig"; export * from "./components/MuscleViewer3D"; export * from "./components/anatomy/geometry"; export { default } from "./components/MuscleViewer3D";', resolveDir: process.cwd(), loader: "tsx" },
    outfile: ".test-output/muscle-viewer.mjs", bundle: true, packages: "external", format: "esm", platform: "node", jsx: "automatic",
  });
  module = await import(pathToFileURL(`${process.cwd()}/.test-output/muscle-viewer.mjs`).href);
});

test("50 unique exercises include complete coaching across all muscle groups", () => {
  const { exercisesData, CATEGORIES, ANIMATION_TYPES } = module;
  assert.equal(exercisesData.length, 50);
  assert.equal(new Set(exercisesData.map((item) => item.id)).size, 50);
  assert.ok(exercisesData.some((item) => item.id === "reverse_grip_lat_pulldown"));
  assert.ok(exercisesData.some((item) => item.id === "seated_machine_row"));
  for (const category of CATEGORIES) {
    const items = exercisesData.filter((item) => item.category === category);
    assert.ok(items.length >= 8);
    assert.deepEqual(new Set(items.map((item) => item.equipment)), new Set(["槓鈴", "啞鈴", "滑輪/機械", "徒手"]));
  }
  for (const item of exercisesData) {
    assert.match(item.name, /\(.+\)/);
    assert.equal(item.instructions.length, 4);
    assert.ok(item.instructions.every((text) => text.length > 20));
    assert.ok(item.commonMistakes.length >= 2 && item.commonMistakes.length <= 3);
    assert.ok(item.primaryMuscles.length > 0);
    assert.ok(ANIMATION_TYPES.includes(item.animationType));
    assert.ok([...module.expandMuscles([...item.primaryMuscles, ...item.secondaryMuscles])].every((id) => id in module.MUSCLE_LABELS));
  }
});

test("group aliases expand to visible anatomy without losing primary precedence", () => {
  assert.deepEqual(module.expandMuscles(["chest"]), new Set(["chest"]));
  assert.deepEqual(module.expandMuscles(["shoulders"]), new Set(["front_delts", "side_delts", "rear_delts"]));
  assert.ok(module.expandMuscles(["back", "core", "arms", "legs"]).has("hamstrings"));
});

test("every animation yields finite poses throughout its full cycle", () => {
  for (const type of module.ANIMATION_TYPES) {
    for (let step = 0; step <= 20; step++) {
      const pose = module.sampleExercisePose(type, step / 20);
      assert.ok([pose.tilt, pose.bend, pose.lean, ...pose.root, ...pose.hands.flat(), ...pose.feet.flat()].every(Number.isFinite), type);
    }
    if (type === "plank") assert.deepEqual(module.sampleExercisePose(type, 0), module.sampleExercisePose(type, 1));
    else assert.notDeepEqual(module.sampleExercisePose(type, 0), module.sampleExercisePose(type, 1), type);
  }
  const standing = module.sampleExercisePose("squat", 0), bottom = module.sampleExercisePose("squat", 1);
  assert.ok(bottom.root[1] < standing.root[1]);
  assert.deepEqual(bottom.feet, standing.feet);
  assert.ok(module.sampleExercisePose("press_horizontal", 1).hands[0][1] > module.sampleExercisePose("press_horizontal", 0).hands[0][1]);
});

test("all exercises fit every preset camera at narrow mobile, tablet and desktop aspect ratios",()=>{
  for(const exercise of module.exercisesData){
    const bounds=module.motionEnvelope(exercise.animationType,exercise.equipment);
    for(const aspect of [280/410,348/410,620/530,1100/660])for(const view of ["front","side","back","reset"]){
      const fit=module.fitCamera(bounds,aspect,view),camera=new PerspectiveCamera(37,aspect,.1,80);
      camera.position.copy(fit.position);camera.lookAt(fit.target);camera.updateMatrixWorld();
      for(let step=0;step<=40;step++)for(const point of module.solvePose(module.sampleExercisePose(exercise.animationType,step/40)).worldPoints){
        const projected=point.clone().project(camera);
        assert.ok(Math.abs(projected.x)<.96&&Math.abs(projected.y)<.96&&projected.z>-1&&projected.z<1,`${exercise.id}/${view}/${aspect}: ${projected.toArray()}`);
      }
    }
  }
});

function visibleBounds(root){
  const bounds=new Box3();root.updateMatrixWorld(true);
  root.traverseVisible(object=>{if(object.geometry){object.geometry.computeBoundingBox();bounds.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));}});
  return bounds;
}
test("motion targets remain reachable and elbow and knee centers stay above the floor",()=>{
  for(const exercise of module.exercisesData)for(let step=0;step<=40;step++){
    const pose=module.sampleExercisePose(exercise.animationType,step/40),sample=module.solvePose(pose);
    for(let i=0;i<2;i++){
      const wrist=new Vector3(...sample.arms[i].end);if(pose.worldHands)wrist.applyMatrix4(sample.torsoMatrix);
      const ankle=new Vector3(...sample.legs[i].end).applyMatrix4(sample.rootMatrix);
      assert.ok(wrist.distanceTo(new Vector3(...pose.hands[i]))<.05,`${exercise.id}: unreachable hand target`);
      assert.ok(ankle.distanceTo(new Vector3(...pose.feet[i]))<.05,`${exercise.id}: unreachable foot target`);
      assert.ok(new Vector3(...sample.arms[i].elbow).applyMatrix4(sample.torsoMatrix).y>=0,`${exercise.id}: elbow below floor`);
      assert.ok(new Vector3(...sample.legs[i].elbow).applyMatrix4(sample.rootMatrix).y>=0,`${exercise.id}: knee below floor`);
    }
  }
});
test("rendered anatomy and equipment remain inside the fitted view for every exercise and motion extremes",async()=>{
  const failures=[];
  for(const exercise of module.exercisesData){
    const props={primaryMuscles:exercise.primaryMuscles,secondaryMuscles:exercise.secondaryMuscles,animationType:exercise.animationType,equipment:exercise.equipment,playing:false,anatomy:false,cycleDuration:5,pulse:false};
    const renderer=await ReactThreeTestRenderer.create(createElement(module.ProceduralHuman,props));
    const expected=module.motionEnvelope(exercise.animationType,exercise.equipment);
    for(const [index,progress] of [0,.42,.75].entries()){
      await renderer.update(createElement(module.ProceduralHuman,{...props,seek:{value:progress,revision:index+1}}));await renderer.advanceFrames(1,.016);
      const actual=visibleBounds(renderer.scene.findByProps({name:"human-rig"}).instance).union(visibleBounds(renderer.scene.findByProps({name:"training-equipment"}).instance));
      for(const aspect of [280/410,1100/660])for(const view of ["front","side","back","reset"]){
        const fit=module.fitCamera(expected,aspect,view),camera=new PerspectiveCamera(37,aspect,.1,80);camera.position.copy(fit.position);camera.lookAt(fit.target);camera.updateMatrixWorld();
        for(const x of [actual.min.x,actual.max.x])for(const y of [actual.min.y,actual.max.y])for(const z of [actual.min.z,actual.max.z]){
          const point=new Vector3(x,y,z).project(camera);if(Math.abs(point.x)>.98||Math.abs(point.y)>.98)failures.push(`${exercise.id} phase ${progress} ${view}: ${point.toArray()}`);
        }
      }
    }
    await renderer.unmount();
  }
  assert.deepEqual(failures,[]);
});

test("two-bone IK preserves segment lengths for reachable, unreachable, zero-distance and collinear targets", () => {
  for (const end of [[0, -0.7, 0.1], [0, -5, 0], [0, 0, 0], [0, 0.87, 0]]) {
    const solved = module.solveTwoBone([0, 0, 0], end, [0, -1, 0], 0.44, 0.43);
    const elbow = new Vector3(...solved.elbow), wrist = new Vector3(...solved.end);
    assert.ok(solved.elbow.every(Number.isFinite));
    assert.ok(Math.abs(elbow.length() - 0.44) < 1e-6);
    assert.ok(Math.abs(wrist.distanceTo(elbow) - 0.43) < 1e-6);
  }
});

test("server rendering remains browser-independent", () => {
  const html = renderToString(createElement(module.default, { primaryMuscles: ["chest"], animationType: "press_horizontal" }));
  assert.match(html, /載入 3D 人體/);
  assert.match(html, /播放 3D 動作示範/);
  assert.match(html, /動作進度/);
  assert.match(html, /胸大肌/);
});

test("useFrame drives elbows and equipment; pausing freezes pose while material highlights stay correct", async () => {
  let selected, lastFrame;
  const props = { primaryMuscles: ["chest"], secondaryMuscles: ["chest", "triceps"], animationType: "press_horizontal", equipment: "槓鈴", playing: true, anatomy: false, cycleDuration: 5, pulse: false, onSelect: (muscle) => { selected = muscle; }, onPlayback: (frame) => { lastFrame = frame; } };
  const renderer = await ReactThreeTestRenderer.create(createElement(module.ProceduralHuman, props));
  await renderer.advanceFrames(1, 0.016);
  const elbow = renderer.scene.findByProps({ name: "left-elbow" }).instance;
  const initial = elbow.quaternion.toArray();
  await renderer.advanceFrames(30, 0.05);
  assert.notDeepEqual(elbow.quaternion.toArray(), initial);
  const chest = renderer.scene.findAllByProps({ name: "muscle-chest" })[0].instance.material;
  const triceps = renderer.scene.findAllByProps({ name: "muscle-triceps" })[0].instance.material;
  const quads = renderer.scene.findAllByProps({ name: "muscle-quads" })[0].instance.material;
  assert.equal(chest.color.getHexString(), "f97316"); assert.equal(chest.emissiveIntensity, 0.9);
  assert.equal(triceps.color.getHexString(), "eab308"); assert.equal(triceps.emissiveIntensity, 0.45);
  assert.equal(quads.color.getHexString(), "bfc7cd"); assert.equal(quads.opacity, 1);
  await renderer.fireEvent(renderer.scene.findAllByProps({ name: "muscle-chest" })[0], "click", { delta: 0, stopPropagation() {} });
  assert.equal(selected, "chest");
  await renderer.update(createElement(module.ProceduralHuman, { ...props, playing: false }));
  const paused = elbow.quaternion.toArray();
  await renderer.advanceFrames(30, 0.05);
  assert.deepEqual(elbow.quaternion.toArray(), paused);
  const rig = renderer.scene.findByProps({ name: "human-rig" }).instance;
  const bar = renderer.scene.findByProps({ name: "virtual-barbell" }).instance;
  rig.updateMatrixWorld(true);
  const left = renderer.scene.findByProps({ name: "hand--1" }).instance.getWorldPosition(new Vector3());
  const right = renderer.scene.findByProps({ name: "hand-1" }).instance.getWorldPosition(new Vector3());
  assert.ok(bar.position.distanceTo(left.add(right).multiplyScalar(0.5)) < 1e-5);
  const seekRequest = { value: .6, revision: 1 };
  await renderer.update(createElement(module.ProceduralHuman, { ...props, playing: false, xray: true, seek: seekRequest }));
  await renderer.advanceFrames(1, .016);
  assert.equal(quads.color.getHexString(), "334155"); assert.equal(quads.opacity, .3);
  assert.notDeepEqual(elbow.quaternion.toArray(), paused);
  await renderer.update(createElement(module.ProceduralHuman, { ...props, seek: seekRequest }));
  await renderer.advanceFrames(20, .05);
  await renderer.update(createElement(module.ProceduralHuman, { ...props, playing: false, cycleDuration: 10, seek: seekRequest }));
  await renderer.advanceFrames(5, .05);
  assert.ok(Math.abs(lastFrame.progress - .8) < 1e-6, "changing speed preserves progress after manual seeking");
  await renderer.unmount();
});

test("sculpted surfaces and conforming muscle patches have finite positions and normals", () => {
  const geometries = [module.createTorsoGeometry(), ...["upperArm", "forearm", "thigh", "shin"].map(module.createLimbGeometry)];
  for (const entry of module.TORSO_PATCHES) geometries.push(module.createTorsoPatch(entry.points, entry.back).geometry);
  for (const geometry of geometries) {
    assert.ok(geometry.getAttribute("position").count > 100);
    assert.ok([...geometry.getAttribute("position").array].every(Number.isFinite));
    assert.ok([...geometry.getAttribute("normal").array].every(Number.isFinite));
    geometry.dispose();
  }
});
