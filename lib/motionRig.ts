import { Vector3 } from "three";
import type { AnimationType } from "./exercisesData";
export type V3 = [number, number, number];
export const UPPER_ARM = 0.44, FOREARM = 0.43, THIGH = 0.57, SHIN = 0.55;
export const SHOULDER_Y = 0.84, SHOULDER_X = 0.43, HIP_X = 0.19;
export interface MotionPose {
  root: V3;
  tilt: number;
  bend: number;
  lean: number;
  hands: [V3, V3];
  feet: [V3, V3];
  worldHands: boolean;
  elbowPoles: [V3, V3];
}

function symmetric(x: number, y: number, z: number): [V3, V3] {
  return [[-x, y, z], [x, y, z]];
}

/** q 為 0..1 的往返幅度。所有角度是示意值，不是個人活動度處方。 */
export function sampleExercisePose(type: AnimationType | "anatomy", q: number): MotionPose {
  q = Math.max(0, Math.min(1, q));
  const p: MotionPose = {
    root: [0, 1.23, 0], tilt: 0, bend: 0, lean: 0,
    hands: symmetric(0.58, 0.02, 0.08), feet: symmetric(0.22, 0.11, 0),
    worldHands: false, elbowPoles: [[-1, -0.4, 0.4], [1, -0.4, 0.4]],
  };
  switch (type) {
    case "press_horizontal":
    case "press_incline":
      p.root = [0, 0.74, 0];
      p.tilt = type === "press_incline" ? -Math.PI / 3 : -Math.PI / 2;
      p.hands = symmetric(0.42, 0.66 + 0.1 * q, 0.22 + 0.61 * q);
      p.feet = symmetric(0.29, 0.11, 0.72);
      p.elbowPoles = [[-0.8, -0.7, 0], [0.8, -0.7, 0]];
      break;
    case "press_seated":
      p.root = [0, 0.76, -0.1];
      p.hands = symmetric(0.43, 0.65, 0.22 + 0.61 * q);
      p.feet = symmetric(0.27, 0.11, 0.56);
      break;
    case "push_up":
    case "push_up_narrow":
    case "plank": {
      const plank = type === "plank";
      const y = plank ? 0.31 : 0.33 + 0.31 * q;
      p.tilt = Math.acos((y - 0.11) / (THIGH + SHIN - 0.01));
      p.root = [0, y, -1.2 + (THIGH + SHIN - 0.01) * Math.sin(p.tilt)];
      p.worldHands = true;
      p.hands = symmetric(type === "push_up_narrow" ? 0.19 : 0.43, 0.11, plank ? 1.12 : 0.85);
      p.feet = symmetric(0.2, 0.11, -1.2);
      p.elbowPoles = [[-0.6, -1, -0.2], [0.6, -1, -0.2]];
      break;
    }
    case "row_pull":
    case "row_single":
      p.tilt = 0.92;
      p.root = [0, 1.1, -0.16];
      p.hands = symmetric(0.44, 0.25 + 0.24 * q, 0.57 - 0.49 * q);
      p.elbowPoles = [[-0.3, -0.8, -1], [0.3, -0.8, -1]];
      p.feet = symmetric(0.3, 0.11, -0.1);
      if (type === "row_single") {
        p.hands[0] = [-0.52, 0.04, 0.55];
        p.feet[0] = [-0.23, 0.55, -0.54];
      }
      break;
    case "pulldown":
    case "pulldown_supinated":
      p.root = [0, 0.76, 0];
      p.hands = symmetric(type === "pulldown_supinated" ? 0.39 : 0.59, 1.56 - 0.85 * q, 0.12 + 0.12 * q);
      p.elbowPoles = type === "pulldown_supinated" ? [[-.25,-1,.2],[.25,-1,.2]] : [[-1,-.6,.2],[1,-.6,.2]];
      p.feet = symmetric(0.36, 0.11, 0.5);
      break;
    case "row_seated":
      p.root = [0, 0.78, 0]; p.bend = -0.04 * q;
      p.hands = symmetric(0.37 + 0.08 * q, 0.6, 0.76 - 0.64 * q);
      p.elbowPoles = [[-0.6, -0.5, -1], [0.6, -0.5, -1]];
      p.feet = symmetric(0.34, 0.16, 0.7);
      break;
    case "pull_up":
      p.root = [0, 1.27 + 0.59 * q, 0];
      p.worldHands = true;
      p.hands = symmetric(0.57, 3, 0.04);
      p.feet = symmetric(0.2, p.root[1] - 0.72, -0.43);
      p.elbowPoles = [[-1, -0.6, 0.1], [1, -0.6, 0.1]];
      break;
    case "squat":
      p.root = [0, 1.23 - 0.63 * q, -0.22 * q];
      p.bend = 0.23 * q;
      p.feet = symmetric(0.28, 0.11, 0.03);
      p.hands = symmetric(0.66, 0.84, -0.12);
      p.elbowPoles = [[-0.4, -1, -0.3], [0.4, -1, -0.3]];
      break;
    case "hinge":
      p.root = [0, 1.22 - 0.1 * q, -0.28 * q];
      p.bend = 1.1 * q;
      p.hands = symmetric(0.43, 0.06, 0.08 + 0.62 * q);
      p.feet = symmetric(0.24, 0.11, 0);
      break;
    case "leg_press":
      p.root = [0, 0.73, -0.4]; p.tilt = -0.65;
      p.hands = symmetric(0.5, 0.08, 0.02);
      p.feet = symmetric(0.27, 0.85 + 0.32 * q, 0.24 + 0.42 * q);
      break;
    case "bridge":
      p.root = [0, 0.32 + 0.28 * q, 0];
      p.tilt = -Math.acos((0.23 - p.root[1]) / 0.86);
      p.worldHands = true;
      p.hands = symmetric(0.47, 0.11, -0.45);
      p.feet = symmetric(0.26, 0.11, 0.77);
      break;
    case "press_vertical":
      p.hands = symmetric(0.46, 0.95 + 0.72 * q, 0.25 - 0.17 * q);
      p.elbowPoles = [[-0.5, -1, 0.3], [0.5, -1, 0.3]];
      break;
    case "raise": {
      const a = 0.12 + q * 1.37;
      p.hands = symmetric(SHOULDER_X + 0.81 * Math.sin(a), SHOULDER_Y - 0.81 * Math.cos(a), 0.16);
      break;
    }
    case "face_pull":
      p.hands = symmetric(0.25 + 0.34 * q, 0.88 + 0.14 * q, 0.79 - 0.69 * q);
      p.elbowPoles = [[-1, 0.15, -0.5], [1, 0.15, -0.5]];
      break;
    case "pike_push_up":
      p.root = [0, 1.02 + 0.17 * q, 0]; p.tilt = 2.25 - 0.23 * q;
      p.worldHands = true;
      p.hands = symmetric(0.43, 0.11, 1.14);
      p.feet = symmetric(0.24, 0.11, -0.53);
      p.elbowPoles = [[-0.8, -0.7, 0], [0.8, -0.7, 0]];
      break;
    case "curl":
    case "hammer_curl": {
      const a = 0.05 + 2.27 * q;
      p.hands = symmetric(0.47, SHOULDER_Y - UPPER_ARM - FOREARM * Math.cos(a), FOREARM * Math.sin(a));
      p.elbowPoles = [[-0.05, -1, -0.15], [0.05, -1, -0.15]];
      break;
    }
    case "extension": {
      const a = 1.45 * (1 - q);
      p.hands = symmetric(0.32, SHOULDER_Y - UPPER_ARM - FOREARM * Math.cos(a), 0.15 + FOREARM * Math.sin(a));
      p.elbowPoles = [[-0.1, -1, -0.3], [0.1, -1, -0.3]];
      break;
    }
    case "rollout":
      p.root = [0, 0.66 - 0.17 * q, -0.32 + 0.22 * q]; p.tilt = 0.18 + 1.05 * q;
      p.worldHands = true;
      p.hands = symmetric(0.34, 0.18, 0.5 + 0.7 * q);
      p.feet = symmetric(0.22, 0.11, -0.84);
      break;
    case "side_bend":
      p.lean = -0.28 * q;
      p.hands = [[-0.37, 0.28, 0.17], [0.56, 0.01, 0.04]];
      break;
    case "plank_crunch":
      p.root = [0, 0.64, -0.15]; p.bend = 0.12 + 0.65 * q;
      p.hands = symmetric(0.24, 1.02, 0.19);
      p.feet = symmetric(0.23, 0.11, -0.65);
      break;
    case "anatomy": break;
    default: { const unreachable: never = type; throw new Error(`Unknown animation: ${unreachable}`); }
  }
  return p;
}

/** 二節骨骼 IK：超出可達範圍時夾限距離，避免 NaN 與關節反折。 */
export function solveTwoBone(start: V3, end: V3, pole: V3, a: number, b: number): { elbow: V3; end: V3 } {
  const direction = new Vector3(...end).sub(new Vector3(...start));
  const distance = Math.max(Math.abs(a - b) + 0.001, Math.min(a + b - 0.001, direction.length()));
  if (direction.lengthSq() < 1e-8) direction.set(0, -1, 0);
  direction.normalize();
  const perpendicular = new Vector3(...pole).addScaledVector(direction, -new Vector3(...pole).dot(direction));
  if (perpendicular.lengthSq() < 1e-8) {
    perpendicular.set(Math.abs(direction.x) < 0.9 ? 1 : 0, Math.abs(direction.x) < 0.9 ? 0 : 1, 0);
    perpendicular.addScaledVector(direction, -perpendicular.dot(direction));
  }
  perpendicular.normalize();
  const along = (a * a - b * b + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(0, a * a - along * along));
  return {
    elbow: new Vector3(...start).addScaledVector(direction, along).addScaledVector(perpendicular, height).toArray() as V3,
    end: new Vector3(...start).addScaledVector(direction, distance).toArray() as V3,
  };
}

