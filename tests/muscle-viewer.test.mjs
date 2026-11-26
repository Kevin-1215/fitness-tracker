import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { before, test } from "node:test";
import { build } from "esbuild";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { Vector3 } from "three";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let module;
before(async () => {
  await mkdir(".test-output", { recursive: true });
  await build({
    stdin: { contents: 'export * from "./lib/exercisesData"; export * from "./components/MuscleViewer3D"; export * from "./components/anatomy/geometry"; export { default } from "./components/MuscleViewer3D";', resolveDir: process.cwd(), loader: "tsx" },
    outfile: ".test-output/muscle-viewer.mjs", bundle: true, packages: "external", format: "esm", platform: "node", jsx: "automatic",
  });
  module = await import(pathToFileURL(`${process.cwd()}/.test-output/muscle-viewer.mjs`).href);
});

test("26 unique exercises include both reference movements and complete teaching", () => {
  const { exercisesData, CATEGORIES, ANIMATION_TYPES } = module;
  assert.equal(exercisesData.length, 26);
  assert.equal(new Set(exercisesData.map((item) => item.id)).size, 26);
  assert.ok(exercisesData.some((item) => item.id === "reverse_grip_lat_pulldown"));
  assert.ok(exercisesData.some((item) => item.id === "seated_machine_row"));
  for (const category of CATEGORIES) {
    const items = exercisesData.filter((item) => item.category === category);
    assert.ok(items.length >= 4);
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
  assert.ok(module.sampleExercisePose("press_horizontal", 1).hands[0][2] > module.sampleExercisePose("press_horizontal", 0).hands[0][2]);
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
