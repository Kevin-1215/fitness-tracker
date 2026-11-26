import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Vector3 } from "three";

type Point = [number, number];
export type LimbKind = "upperArm" | "forearm" | "thigh" | "shin";

function profile(points: readonly [number, number, number][], y: number): [number, number] {
  if (y <= points[0][0]) return [points[0][1], points[0][2]];
  for (let i = 1; i < points.length; i++) {
    if (y <= points[i][0]) {
      const t = (y - points[i - 1][0]) / (points[i][0] - points[i - 1][0]);
      const p0 = points[Math.max(0,i-2)], p1 = points[i-1], p2 = points[i], p3 = points[Math.min(points.length-1,i+1)];
      const h = p2[0]-p1[0], t2 = t*t, t3=t2*t;
      const value = (axis: 1 | 2) => {
        const m1 = (p2[axis]-p0[axis]) / (p2[0]-p0[0]);
        const m2 = (p3[axis]-p1[axis]) / (p3[0]-p1[0]);
        return Math.max(.001,(2*t3-3*t2+1)*p1[axis]+(t3-2*t2+t)*h*m1+(-2*t3+3*t2)*p2[axis]+(t3-t2)*h*m2);
      };
      return [value(1),value(2)];
    }
  }
  return [points.at(-1)![1], points.at(-1)![2]];
}

const TORSO: [number, number, number][] = [
  [0, 0.255, 0.158], [0.12, 0.242, 0.16], [0.28, 0.235, 0.164],
  [0.44, 0.29, 0.185], [0.61, 0.355, 0.205], [0.75, 0.385, 0.206],
  [0.84, 0.36, 0.17], [0.91, 0.235, 0.135], [1.01, 0.105, 0.095], [1.1, 0.095, 0.09],
];
const gaussian = (x: number, y: number, cx: number, cy: number, sx: number, sy: number) => Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));

export function torsoSurface(x: number, y: number, back = false, offset = 0): Vector3 {
  const [width, depth] = profile(TORSO, y);
  x = Math.max(-width, Math.min(width, x));
  const round = Math.sqrt(Math.max(0, 1 - (x / width) ** 2));
  let z = depth;
  if (!back) {
    z += 0.037 * gaussian(Math.abs(x), y, 0.18, 0.71, 0.19, 0.13);
    z += 0.014 * gaussian(Math.abs(x), y, 0.085, 0.34, 0.055, 0.25);
    z -= 0.01 * gaussian(x, y, 0, 0.57, 0.025, 0.32);
  } else {
    z += 0.022 * gaussian(Math.abs(x), y, 0.18, 0.7, 0.13, 0.16);
    z += 0.018 * gaussian(Math.abs(x), y, 0.12, 0.32, 0.1, 0.27);
    z -= 0.014 * gaussian(x, y, 0, 0.55, 0.032, 0.4);
  }
  return new Vector3(x, y, (back ? -1 : 1) * (z * round + offset));
}

function gridGeometry(map: (u: number, v: number) => Vector3, columns: number, rows: number, reverse = false) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
    const u = col / columns, v = row / rows;
    positions.push(...map(u, v).toArray()); uvs.push(u, v);
  }
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const a = row * (columns + 1) + col, b = a + 1, c = a + columns + 1, d = c + 1;
    indices.push(...(reverse ? [a, b, c, b, d, c] : [a, c, b, b, c, d]));
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}

export function createTorsoGeometry() {
  return gridGeometry((u, v) => {
    const y = v * 1.1, width = profile(TORSO, y)[0], angle = u * Math.PI * 2;
    return torsoSurface(width * Math.cos(angle), y, Math.sin(angle) < 0);
  }, 80, 64);
}

const LIMBS: Record<LimbKind, { length: number; points: [number, number, number][] }> = {
  upperArm: { length: 0.44, points: [[-.16,.001,.001],[-.11,.08,.085],[-.045,.118,.124],[0, .126, .132], [.15, .16, .15], [.38, .137, .14], [.63, .12, .123], [.86, .091, .092], [1, .081, .085]] },
  forearm: { length: 0.43, points: [[0, .082, .083], [.2, .098, .094], [.45, .085, .079], [.76, .063, .057], [1, .052, .05]] },
  thigh: { length: 0.57, points: [[0, .156, .157], [.22, .164, .17], [.47, .153, .155], [.75, .123, .122], [1, .092, .095]] },
  shin: { length: 0.55, points: [[0, .09, .094], [.26, .108, .116], [.48, .095, .11], [.8, .062, .067], [1, .052, .057]] },
};

export function limbSurface(kind: LimbKind, t: number, angle: number, offset = 0): Vector3 {
  const spec = LIMBS[kind], [rx, rz] = profile(spec.points, t);
  const bulge = kind === "upperArm" ? .015 * Math.sin(Math.PI * t) ** 2 * Math.sin(angle) ** 2 : 0;
  return new Vector3((rx + offset) * Math.cos(angle), -t * spec.length, (rz + offset + bulge) * Math.sin(angle));
}

export function createLimbGeometry(kind: LimbKind) {
  return gridGeometry((u, v) => limbSurface(kind, kind === "upperArm" ? -.16 + v * 1.16 : v, u * Math.PI * 2), 48, 40, true);
}

export interface SurfacePatch { geometry: BufferGeometry; outline: Vector3[] }

export function createTorsoPatch(points: Point[], back: boolean): SurfacePatch {
  const curve = new CatmullRomCurve3(points.map(([x, y]) => new Vector3(x, y, 0)), true, "centripetal");
  const boundary = curve.getPoints(80).slice(0, -1);
  const center = boundary.reduce((sum, point) => sum.add(point), new Vector3()).multiplyScalar(1 / boundary.length);
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const xs = boundary.map((p) => p.x), ys = boundary.map((p) => p.y);
  const minX = Math.min(...xs), width = Math.max(...xs) - minX, minY = Math.min(...ys), height = Math.max(...ys) - minY;
  const rings = 10, count = boundary.length;
  for (let ring = 0; ring <= rings; ring++) for (const edge of boundary) {
    const p = center.clone().lerp(edge, ring / rings), point = torsoSurface(p.x, p.y, back, .0045);
    positions.push(...point.toArray()); uvs.push((p.x - minX) / width, (p.y - minY) / height);
  }
  for (let ring = 0; ring < rings; ring++) for (let i = 0; i < count; i++) {
    const a = ring * count + i, b = ring * count + (i + 1) % count, c = a + count, d = b + count;
    indices.push(a, c, b, b, c, d);
  }
  const geometry = new BufferGeometry(); geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  return { geometry, outline: [...boundary, boundary[0]].map((p) => torsoSurface(p.x, p.y, back, .0075)) };
}

export function createLimbPatch(kind: LimbKind, centerAngle: number, spread: number, start: number, end: number): SurfacePatch {
  const map = (u: number, v: number) => {
    const rounded = Math.max(.025, Math.sin(v * Math.PI) ** .23);
    return limbSurface(kind, start + (end - start) * v, centerAngle + (u - .5) * spread * rounded, .004);
  };
  const outline = [
    ...Array.from({ length: 41 }, (_, i) => map(0, i / 40)),
    ...Array.from({ length: 41 }, (_, i) => map(1, 1 - i / 40)), map(0, 0),
  ];
  return { geometry: gridGeometry(map, 24, 28, true), outline };
}

export const TORSO_PATCHES: { muscle: "chest" | "lats" | "upper_back" | "lower_back" | "obliques" | "abs"; points: Point[]; back: boolean }[] = [];
for (const side of [-1, 1]) {
  const mirror = (points: Point[]) => points.map(([x, y]) => [x * side, y] as Point);
  TORSO_PATCHES.push(
    { muscle: "chest", back: false, points: mirror([[.025,.78],[.14,.825],[.30,.79],[.35,.70],[.265,.61],[.045,.61]]) },
    { muscle: "upper_back", back: true, points: mirror([[.025,.96],[.14,.88],[.30,.77],[.23,.665],[.055,.565],[.025,.67]]) },
    { muscle: "lats", back: true, points: mirror([[.075,.535],[.28,.645],[.325,.56],[.25,.32],[.11,.12],[.065,.29]]) },
    { muscle: "lower_back", back: true, points: mirror([[.025,.46],[.07,.43],[.085,.12],[.03,.07]]) },
    { muscle: "obliques", back: false, points: mirror([[.17,.49],[.26,.49],[.23,.15],[.16,.12]]) },
  );
  for (const y of [.2, .345, .49]) TORSO_PATCHES.push({ muscle: "abs", back: false, points: mirror([[.025,y+.055],[.125,y+.048],[.125,y-.049],[.03,y-.055]]) });
}
