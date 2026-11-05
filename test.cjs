// Run with: node test.cjs. No packages required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-8);
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML IDs');
for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(target), `Missing anchor: ${target}`);
for (const [, asset] of html.matchAll(/(?:src|href|data-model|data-poster)="\.\/([^"]+)"/g)) {
  assert.ok(fs.existsSync(path.join(__dirname, asset.split('?')[0])), `Missing asset: ${asset}`);
}
assert.ok(!html.includes('href="#"'), 'Placeholder links remain');
assert.ok(!html.includes('>5+</span>'), 'Old project count remains');
console.log('Passed: anchors, unique IDs and local assets.');

// Existing experience card positioning remains bounded.
const motionContext = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, 'experience.js'), 'utf8'), motionContext);
const { experienceCardPose } = motionContext;
const centered = experienceCardPose(270, 510, 960);
close(centered.angle, 0); close(centered.x, 0); close(centered.z, 0);
for (let top = -1800; top <= 1800; top += 50) {
  const pose = experienceCardPose(top, 700, 960);
  assert.ok(Math.abs(pose.angle) <= 55 && pose.z <= 0);
  assert.ok(Object.values(pose).every(Number.isFinite));
}
assert.ok(experienceCardPose(-600, 400, 960).angle < 0);
assert.ok(experienceCardPose(900, 400, 960).angle > 0);
assert.ok(!html.includes('B.Tech.jpg'), 'Bachelor project remains');
assert.ok(!html.includes('spring-plaque') && !html.includes('experience-spring'), 'Duplicate spring remains');
assert.equal((html.match(/class="project-card cad-mini-card"/g) || []).length, 4);
assert.ok(!html.includes('cad-mini-desc') && !html.includes('cad-tags'), 'Verbose CAD cards remain');
console.log('Passed: experience geometry, removed duplicate projects and compact CAD.');

// Continuous, reversible lens-to-overview camera movement; no separated parts.
const cinema = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, 'cinematic.js'),'utf8'),cinema);
const pose = cinema.cinemaPose, mesh = cinema.createPanTiltMesh();
assert.deepEqual(pose(-1),pose(0));assert.deepEqual(pose(2),pose(1));
assert.ok(pose(0).distance < pose(.28).distance && pose(.28).distance < pose(.58).distance);
assert.ok(pose(1).yaw-pose(.58).yaw>180, 'Viewpoint must rotate to the rear');
let previous=pose(0);
for(let i=1;i<=1000;i++) {
  const next=pose(i/1000);
  assert.ok([...next.target,next.distance,next.yaw,next.elevation].every(Number.isFinite));
  assert.ok(Math.abs(next.distance-previous.distance)<3 && Math.abs(next.yaw-previous.yaw)<2,'Camera jumps');
  previous=next;
}
for(const f of mesh) {
  assert.ok(f.points.length>=3 && f.points.flat().every(Number.isFinite));
  const a=f.points[1].map((n,i)=>n-f.points[0][i]), b=f.points[2].map((n,i)=>n-f.points[0][i]);
  assert.ok(Math.hypot(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])>0,'Degenerate face');
}
assert.ok(!/navigation-lab|assembly-spread|workbench\.js|joint-pan/.test(html),'Old experiment remains');
console.log('Passed: camera continuity, zoom/orbit, valid 3D surfaces and removal of the playground.');

// Door passage is reversible scroll geometry, with an obstacle-limited stop.
const delivery=cinema.deliveryState, scan=cinema.deliveryScan;
assert.deepEqual(delivery(-1),delivery(0));assert.deepEqual(delivery(2),delivery(1));
close(delivery(.28).doorAngle,0);close(delivery(.5).doorAngle,105);
close(delivery(.52).robotZ,160);
assert.equal(delivery(.65).chapter,2);
assert.equal(delivery(1).chapter,3);assert.ok(delivery(1).stopped);
close(delivery(.9).robotZ,delivery(1).robotZ);
close(delivery(1).robotZ-40-(-210),34);
assert.ok(scan(delivery(0))[8].hit);close(scan(delivery(0))[8].distance,152);
assert.ok(scan(delivery(.51))[8].distance>scan(delivery(0))[8].distance);
assert.ok(scan(delivery(1))[8].hit);close(scan(delivery(1))[8].distance,66);
let lastZ=160,lastCamera=cinema.deliveryPose(0);
for(let i=0;i<=1000;i++) {
  const p=i/1000,state=delivery(p),camera=cinema.deliveryPose(p);
  assert.ok(state.robotZ<=lastZ && state.robotZ>=-136,'Robot reverses or intersects obstacle');
  if(state.robotZ<160)close(state.doorAngle,105);
  assert.ok([...camera.target,camera.distance,camera.yaw,camera.elevation].every(Number.isFinite));
  assert.ok(Math.abs(camera.distance-lastCamera.distance)<5 && Math.abs(camera.yaw-lastCamera.yaw)<2,'Delivery camera jumps');
  for(const ray of scan(state))assert.ok([...ray.start,...ray.end,ray.distance].every(Number.isFinite) && ray.distance>0);
  lastZ=state.robotZ;lastCamera=camera;
}
for(const f of [...cinema.createDeliveryMesh(),...cinema.createScanMesh(delivery(0)),...cinema.createScanMesh(delivery(1))]) {
  assert.ok(f.points.length>=3 && f.points.flat().every(Number.isFinite));
  const a=f.points[1].map((n,i)=>n-f.points[0][i]),b=f.points[2].map((n,i)=>n-f.points[0][i]);
  assert.ok(Math.hypot(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])>0,'Degenerate delivery face');
}
console.log('Passed: door-first movement, obstacle clearance, scan intersections and delivery camera/mesh geometry.');
