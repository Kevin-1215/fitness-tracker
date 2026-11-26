import { Euler, Matrix4, Quaternion, Vector3 } from "three";
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
  worldElbowPoles?: boolean;
  footPitch?: [number, number];
  headHeight?: number;
  headTilt?: number;
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
    case "press_close":
      p.root = [0, 0.74, 0];
      p.tilt = type === "press_incline" ? -Math.PI / 3 : -Math.PI / 2;
      p.worldHands = true;
      p.hands = symmetric(type === "press_close" ? .26 : .48 - .10*q,
        .74 + .90*Math.cos(p.tilt) + .21 + .58*q, .90*Math.sin(p.tilt) + .04);
      p.feet = symmetric(0.29, 0.11, 0.72);
      p.worldElbowPoles = true;
      p.elbowPoles = [[-.8,-.55,.4],[.8,-.55,.4]];
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
      const y = plank ? 0.31 : 0.31 + 0.19 * q;
      p.tilt = Math.acos((y - 0.11) / (THIGH + SHIN - 0.01));
      p.root = [0, y, -1.2 + (THIGH + SHIN - 0.01) * Math.sin(p.tilt)];
      p.worldHands = true;
      p.hands = symmetric(type === "push_up_narrow" ? 0.19 : 0.43, plank?.11:.03, plank ? 1.40 : 0.85);
      p.feet = symmetric(0.2, 0.11, -1.2);
      p.elbowPoles = [[-0.6, -1, -0.2], [0.6, -1, -0.2]];
      if(plank){p.worldElbowPoles=true;p.elbowPoles=[[0,-1,0],[0,-1,0]];}
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
        p.root=[0,1.05,-.25];p.tilt=1.35;p.worldHands=true;p.worldElbowPoles=true;
        p.hands=[[-.50,.61,.40],[.44,.43+.34*q,.64-.45*q]];
        p.feet[0]=[-.23,.76,-1.24];p.elbowPoles=[[-.3,-1,0],[.3,.1,-1]];
      }
      break;
    case "pulldown":
    case "pulldown_supinated":
    case "pulldown_neutral":
      p.root = [0, 0.76, 0];
      p.hands = symmetric(type === "pulldown_neutral" ? .22 : type === "pulldown_supinated" ? 0.39 : 0.59, 1.56 - 0.85 * q, 0.12 + 0.12 * q);
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
      p.root = [0, 1.22 - 0.12 * q, -0.42 * q];
      p.bend = 1.25 * q;p.worldHands=true;
      p.hands = symmetric(.43,p.root[1]+.1+SHOULDER_Y*Math.cos(p.bend)-.85,p.root[2]+SHOULDER_Y*Math.sin(p.bend)+.02);
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
      p.headHeight=.84;p.headTilt=-p.tilt-Math.PI/2;
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
      p.root = [0, 1.07 + 0.08 * q, 0]; p.tilt = 2.25 - 0.23 * q;
      p.worldHands = true;
      p.hands = symmetric(0.43, 0.03, 1.14);
      p.feet = symmetric(0.24, 0.11, -0.43);
      p.elbowPoles = [[-0.8, -0.7, 0], [0.8, -0.7, 0]];
      break;
    case "curl":
    case "hammer_curl": {
      const a = 0.05 + 2.27 * q;
      p.hands = symmetric(0.47, SHOULDER_Y - UPPER_ARM - FOREARM * Math.cos(a), FOREARM * Math.sin(a));
      p.elbowPoles = [[-0.05, -1, -0.15], [0.05, -1, -0.15]];
      break;
    }
    case "reverse_curl":
    case "alternate_curl": {
      const angles=[.05+2.27*q,.05+2.27*(type==="alternate_curl"?1-q:q)];
      p.hands=angles.map((a,i)=>[(i===0?-1:1)*.47,SHOULDER_Y-UPPER_ARM-FOREARM*Math.cos(a),FOREARM*Math.sin(a)]) as [V3,V3];
      p.elbowPoles=[[-.05,-1,-.15],[.05,-1,-.15]];
      break;
    }
    case "extension": {
      const a = 1.45 * (1 - q);
      p.hands = symmetric(0.32, SHOULDER_Y - UPPER_ARM - FOREARM * Math.cos(a), 0.15 + FOREARM * Math.sin(a));
      p.elbowPoles = [[-0.1, -1, -0.3], [0.1, -1, -0.3]];
      break;
    }
    case "rollout":
      p.root = [0,.60-.13*q,-.23+.20*q];p.tilt=1.20+.27*q;
      p.worldHands = true;
      p.hands = symmetric(.34,.18,.74+.92*q);
      p.feet = symmetric(.22,.11,-1.04);
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
    case "fly_supine":
      p.root=[0,.74,0];p.tilt=-Math.PI/2;p.worldHands=true;p.worldElbowPoles=true;
      p.hands=symmetric(1.07-.87*q,.91+.59*q,-.86);
      p.feet=symmetric(.29,.11,.72);p.elbowPoles=[[-1,-.35,.3],[1,-.35,.3]];
      break;
    case "fly_standing":
      p.hands=symmetric(1.05-.86*q,.72,.12+.64*q);
      p.elbowPoles=[[-1,-.4,0],[1,-.4,0]];p.feet=[[-.25,.11,.18],[.25,.11,-.22]];
      break;
    case "deadlift":
      p.root=[0,.60+.63*q,-.42*(1-q)];p.bend=1.20*(1-q);
      p.worldHands=true;
      {const shoulderY=p.root[1]+.1+SHOULDER_Y*Math.cos(p.bend),shoulderZ=p.root[2]+SHOULDER_Y*Math.sin(p.bend);
      p.hands=symmetric(.45,shoulderY-Math.sqrt(.85**2-(shoulderZ-.10)**2-(.45-SHOULDER_X)**2),.10);}
      p.feet=symmetric(.25,.11,0);p.elbowPoles=[[-.1,-1,0],[.1,-1,0]];
      break;
    case "pullover_cable": {
      p.bend=.14;p.hands=symmetric(.31,.76-.72*q,.77-.48*q);
      p.elbowPoles=[[-.25,-1,-.1],[.25,-1,-.1]];
      break;
    }
    case "inverted_row":
      p.root=[0,.43+.21*q,-.17];p.tilt=-1.31+.13*q;
      p.worldHands=true;p.worldElbowPoles=true;p.hands=symmetric(.48,1.28,-.75);
      p.feet=symmetric(.25,.11,.78);p.elbowPoles=[[-1,-.6,.2],[1,-.6,.2]];
      break;
    case "goblet_squat":
      p.root=[0,1.23-.60*q,-.18*q];p.bend=.20*q;
      p.feet=symmetric(.3,.11,.04);p.hands=symmetric(.10,.68,.31);
      p.elbowPoles=[[-.4,-1,.1],[.4,-1,.1]];
      break;
    case "reverse_lunge":
      p.root=[0,1.23-.49*q,-.18*q];p.bend=.08*q;
      p.feet=[[-.24,.11,.16],[.24,.11,-.08-.85*q]];
      p.hands=symmetric(.50,-.01,.06);
      break;
    case "calf_raise": {
      const angle=.59*q,rise=.11*Math.cos(angle)+.251*Math.sin(angle)-.11,advance=.251-(.251*Math.cos(angle)-.11*Math.sin(angle));
      p.root=[0,1.23+rise,advance*.75];p.feet=symmetric(.22,.11+rise,advance);p.footPitch=[angle,angle];
      break;
    }
    case "hip_thrust":
      p.root=[0,.38+.34*q,0];p.tilt=-Math.acos((.74-p.root[1])/.94);
      p.hands=symmetric(.48,-.03,.25);p.feet=symmetric(.29,.11,.77);
      break;
    case "front_raise": {
      const a=.08+1.48*q;p.hands=symmetric(.45,.84-.83*Math.cos(a),.83*Math.sin(a));
      p.elbowPoles=[[-.1,-1,0],[.1,-1,0]];
      break;
    }
    case "reverse_fly":
      p.root=[0,1.13,-.16];p.bend=.95;p.feet=symmetric(.27,.11,0);
      p.hands=symmetric(.47+.65*q,.20+.53*q,.60-.50*q);
      p.elbowPoles=[[-1,-.5,0],[1,-.5,0]];
      break;
    case "press_vertical_seated":
      p.root=[0,.76,-.1];p.feet=symmetric(.28,.11,.51);
      p.hands=symmetric(.47,.95+.72*q,.19-.12*q);
      p.elbowPoles=[[-.6,-1,.2],[.6,-1,.2]];
      break;
    case "overhead_extension":
      p.hands=symmetric(.09,1.04+.59*q,-.33+.39*q);
      p.elbowPoles=[[-.1,.3,-1],[.1,.3,-1]];
      break;
    case "dead_bug": {
      p.root=[0,.23,0];p.tilt=-Math.PI/2;p.worldHands=true;p.worldElbowPoles=true;
      const a=q*Math.PI/2,b=(1-q)*Math.PI/2;
      p.hands=[[-.36,.32+.76*Math.cos(a),-.94-.76*Math.sin(a)],[.36,.32+.76*Math.cos(b),-.94-.76*Math.sin(b)]];
      p.feet=[[-.22,.20+.56*(1-q),.44+.60*q],[.22,.20+.56*q,.44+.60*(1-q)]];
      p.elbowPoles=[[-.4,1,0],[.4,1,0]];
      break;
    }
    case "bird_dog":
      p.root=[0,.67,-.2];p.tilt=Math.PI/2;p.worldHands=true;p.worldElbowPoles=true;
      p.hands=[[-.43,.03+.62*q,.74+.80*q],[.43,.03,.74]];
      p.feet=[[-.23,.11,-.65],[.23,.11+.54*q,-.65-.66*q]];
      p.elbowPoles=[[-.1,-1,0],[.1,-1,0]];
      break;
    case "hanging_knee_raise":
      p.root=[0,1.26,0];p.worldHands=true;p.hands=symmetric(.5,3,.02);
      p.feet=symmetric(.22,.15+1.13*q,.04+.47*q);p.elbowPoles=[[-1,-.6,.1],[1,-.6,.1]];
      break;
    case "pallof_press":
      p.hands=symmetric(.075,.74,.24+.47*q);p.elbowPoles=[[-1,-.5,0],[1,-.5,0]];
      p.feet=symmetric(.3,.11,0);
      break;
    case "anatomy": break;
    default: { const unreachable: never = type; throw new Error(`Unknown animation: ${unreachable}`); }
  }
  return p;
}

export type LimbSolution=ReturnType<typeof solveTwoBone>;
export function solvePose(pose:MotionPose) {
  const rootMatrix=new Matrix4().compose(new Vector3(...pose.root),new Quaternion().setFromEuler(new Euler(pose.tilt,0,0)),new Vector3(1,1,1));
  const torsoMatrix=rootMatrix.clone().multiply(new Matrix4().compose(new Vector3(0,.1,0),new Quaternion().setFromEuler(new Euler(pose.bend,0,pose.lean)),new Vector3(1,1,1)));
  const inverseRoot=rootMatrix.clone().invert(),inverseTorso=torsoMatrix.clone().invert();
  const arms:LimbSolution[]=[],legs:LimbSolution[]=[],worldPoints:Vector3[]=[];
  for(let i=0;i<2;i++){
    const side=i===0?-1:1,shoulder:V3=[side*SHOULDER_X,SHOULDER_Y,0],hip:V3=[side*HIP_X,0,0];
    const hand=new Vector3(...pose.hands[i]);if(pose.worldHands)hand.applyMatrix4(inverseTorso);
    const pole=new Vector3(...pose.elbowPoles[i]);if(pose.worldElbowPoles)pole.transformDirection(inverseTorso);
    const arm=solveTwoBone(shoulder,hand.toArray() as V3,pole.toArray() as V3,UPPER_ARM,FOREARM);
    const foot=new Vector3(...pose.feet[i]).applyMatrix4(inverseRoot);
    const leg=solveTwoBone(hip,foot.toArray() as V3,[0,0,1],THIGH,SHIN);
    arms.push(arm);legs.push(leg);
    for(const point of [shoulder,arm.elbow,arm.end])worldPoints.push(new Vector3(...point).applyMatrix4(torsoMatrix));
    for(const point of [hip,leg.elbow,leg.end])worldPoints.push(new Vector3(...point).applyMatrix4(rootMatrix));
  }
  for(const point of [[0,0,0],[0,.55,0]] as V3[])worldPoints.push(new Vector3(...point).applyMatrix4(torsoMatrix));
  const headMatrix=torsoMatrix.clone().multiply(new Matrix4().compose(new Vector3(0,pose.headHeight??.99,0),new Quaternion().setFromEuler(new Euler(pose.headTilt??0,0,0)),new Vector3(1,1,1)));
  for(const point of [[0,.245,0],[0,.475,0]] as V3[])worldPoints.push(new Vector3(...point).applyMatrix4(headMatrix));
  return {arms,legs,worldPoints,rootMatrix,torsoMatrix};
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

