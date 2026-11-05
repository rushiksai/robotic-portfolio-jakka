// A camera move around one intact model. Scroll never changes the page's input behaviour.
function cinemaPose(progress) {
  const keys = [
    [0, [-205,198,65], 25, -3, 0],
    [.28, [-170,198,40], 190, -9, 5],
    [.58, [-85,123,0], 480, 28, 14],
    [.94, [-85,123,0], 480, 218, 17],
    [1, [-85,123,0], 480, 218, 17]
  ];
  return interpolateCinemaPose(keys,progress);
}

function interpolateCinemaPose(keys,progress) {
  const p = Math.max(0, Math.min(1, progress));
  let i = 0;
  while (i < keys.length-2 && p > keys[i+1][0]) i++;
  const a = keys[i], b = keys[i+1], t = (p-a[0])/(b[0]-a[0]), s = t*t*(3-2*t);
  const mix = (x,y) => x+(y-x)*s;
  return { target:a[1].map((v,n)=>mix(v,b[1][n])), distance:mix(a[2],b[2]), yaw:mix(a[3],b[3]), elevation:mix(a[4],b[4]) };
}

function cinemaMesh() {
  const faces = [];
  let group='static';
  const face = (points, color, finish='matte') => faces.push({points,color,finish,group});
  function extrude(outline, back, front, color) {
    const area = outline.reduce((s,p,i)=>{const q=outline[(i+1)%outline.length];return s+p[0]*q[1]-q[0]*p[1];},0);
    if(area<0) outline=[...outline].reverse();
    const rear=outline.map(([x,y])=>[x,y,back]), fore=outline.map(([x,y])=>[x,y,front]);
    face([...rear].reverse(),color); face(fore,color);
    outline.forEach((_,i)=>{const j=(i+1)%outline.length;face([rear[i],rear[j],fore[j],fore[i]],color);});
  }
  function box([x,y,z],[w,h,d],color,chamfer=0) {
    const a=x-w/2,b=x+w/2,c=y-h/2,e=y+h/2,r=Math.min(chamfer,w*.49,h*.49);
    extrude(r?[[a+r,c],[b-r,c],[b,c+r],[b,e-r],[b-r,e],[a+r,e],[a,e-r],[a,c+r]]:[[a,c],[b,c],[b,e],[a,e]],z-d/2,z+d/2,color);
  }
  function cylinder(center, radius, length, color, axis='z', segments=48, finish='metal') {
    const ring = position => Array.from({length:segments},(_,i)=>{
      const t=i*Math.PI*2/segments, a=Math.cos(t)*radius,b=Math.sin(t)*radius;
      return axis==='x' ? [center[0]+position,center[1]+a,center[2]+b] : axis==='z' ? [center[0]+a,center[1]+b,center[2]+position] : [center[0]+a,center[1]+position,center[2]-b];
    });
    const a=ring(-length/2),b=ring(length/2);
    face([...a].reverse(),color,finish);face(b,color,finish);
    a.forEach((_,i)=>{const j=(i+1)%segments;face([a[i],a[j],b[j],b[i]],color,finish);});
  }
  return {faces,face,box,cylinder,extrude,group:name=>{group=name;}};
}

function createPanTiltMesh() {
  const {faces,box,cylinder,extrude}=cinemaMesh();
  const blue=[43,102,184], metal=[174,190,207], dark=[26,33,45], black=[10,16,26];
  // Dimensions are illustrative, following the silhouette of the supplied prototype.
  cylinder([0,7,0],44,14,blue,'y');
  box([0,32,0],[48,36,48],dark,3);
  cylinder([0,54,0],36,10,metal,'y');
  cylinder([0,63,0],41,8,blue,'y');
  box([0,125.5,0],[30,117,48],blue,2);
  box([-70.5,197.5,0],[171,27,48],blue,2);
  // Thin support web and the separate camera-side actuator cradle.
  extrude([[-14,117],[-14,184],[-79,184]],-19,-15,blue);
  box([-171,197,0],[50,58,52],dark,4);
  box([-171,230,0],[65,8,62],blue,3);
  box([-171,164,0],[65,8,62],blue,3);
  cylinder([-171,197,29],18,8,metal);
  box([-171,183,37],[71,7,20],blue,2);
  box([-170,198,45],[108,34,26],metal,5);
  box([-170,198,58.5],[99,27,2],black,4);
  // Machined lens rings and layered coated glass stay on the same camera geometry.
  for (const offset of [-35,0,35]) {
    const x=-170+offset, r=offset===0?5.2:9;
    cylinder([x,198,60],r+1,2,metal,'z',96);
    cylinder([x,198,61.2],r,2,dark,'z',96);
    cylinder([x,198,62.3],r*.83,.5,[51,61,78],'z',96);
    cylinder([x,198,62.7],r*.71,.3,[9,22,40],'z',96,'glass');
  }
  for (const x of [-215,-125]) for(const y of [188,208]) {
    cylinder([x,y,60],1.3,1,metal,'z',12);
    cylinder([x,y,60.6],.6,.2,black,'z',6);
  }
  for (const x of [-190,-152]) for(const y of [176,218]) cylinder([x,y,27],2.2,1,metal,'z',12);
  for(let i=0;i<6;i++) {
    const t=i*Math.PI/3;
    cylinder([32*Math.cos(t),67.5,32*Math.sin(t)],2,1,metal,'y',12);
  }
  box([0,124,-25],[12,23,3],dark,1);
  for (let y=189;y<=207;y+=3) box([-170,y,31.5],[29,.7,1],dark);
  return faces;
}

// A staged account of the user's demonstrated behaviour, not a ROS or bag replay.
function deliveryState(progress) {
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{const t=clamp(x);return t*t*(3-2*t);};
  const p=clamp(progress),doorAngle=ease((p-.28)/.22)*105;
  const obstacleFront=-210,bodyHalfLength=40,clearance=34;
  const stopZ=obstacleFront+bodyHalfLength+clearance;
  const requestedZ=160-ease((p-.52)/.36)*365;
  // Obstacle clearance limits travel. There is no time-triggered stop.
  const robotZ=Math.max(stopZ,requestedZ);
  const stopped=requestedZ<=stopZ;
  return {doorAngle,robotZ,stopped,chapter:stopped?3:p>=.52?2:p>=.28?1:0,
    transforms:{
      door:{pivot:[-75,0,0],rotation:[0,doorAngle*Math.PI/180,0]},
      robot:{offset:[0,0,robotZ]},
      leftWheel:{pivot:[-37,20,0],rotation:[(robotZ-160)/20,0,0],offset:[0,0,robotZ]},
      rightWheel:{pivot:[37,20,0],rotation:[(robotZ-160)/20,0,0],offset:[0,0,robotZ]}
    }};
}
function deliveryPose(progress) {
  return interpolateCinemaPose([
    [0,[0,80,160],125,32,18],
    [.25,[0,58,0],850,36,37],
    [.52,[0,48,-25],850,26,40],
    [.84,[0,48,-135],650,100,42],
    [1,[0,55,-150],600,118,32]
  ],progress);
}
function createDeliveryMesh() {
  const m=cinemaMesh(), {box,cylinder,group}=m;
  const blue=[42,94,164],black=[23,30,41],metal=[163,182,204],grey=[86,107,138];
  // A cutaway doorway makes the sensing and clearance visible from above.
  box([0,-7,-28],[365,10,580],[46,63,89],4);
  for(const x of [-180,180]) box([x,-1,-28],[2,2,578],[80,110,151]);
  box([-129,74,0],[104,150,9],grey,2);box([129,74,0],[104,150,9],grey,2);
  for(const x of [-78,78]) box([x,77,0],[7,157,14],metal,1);
  box([0,153,0],[160,7,14],metal,1);
  box([0,48,-240],[96,96,60],[118,137,165],4);
  box([0,97,-240],[82,2,48],[161,181,206],1);
  group('door');
  box([0,75,0],[146,147,6],blue,2);
  box([56,75,5],[3,16,3],metal,1);box([49,82,7],[16,3,3],metal,1);
  for(const y of [28,120]) cylinder([-74,y,0],3,13,metal,'y',16);
  // Generic TurtleBot silhouette: differential drive, stacked decks and rooftop LiDAR.
  group('robot');
  box([0,26,0],[70,9,80],black,9);
  box([0,59,0],[66,5,73],blue,8);
  box([0,72,0],[58,4,62],black,7);
  for(const x of [-24,24]) for(const z of [-25,25]) cylinder([x,45,z],2.3,32,metal,'y',12);
  box([0,41,10],[34,18,34],[48,58,70],2);
  box([0,40,-31],[29,13,6],black,2);
  for(const x of [-9,9]) cylinder([x,41,-35],3,2,metal,'z',16);
  cylinder([0,78,-8],15,9,metal,'y');
  cylinder([0,84,-8],13,8,[12,25,44],'y');
  cylinder([0,88.5,-8],14,2,blue,'y');
  for(let i=0;i<16;i++) {
    const a=i*Math.PI/8;
    box([Math.sin(a)*13,84,-8+Math.cos(a)*13],[1,2,1],[76,167,231]);
  }
  cylinder([0,9,26],7,9,black,'x',24);
  for(const [name,x] of [['leftWheel',-37],['rightWheel',37]]) {
    group(name);
    cylinder([x,20,0],20,13,black,'x',48);
    cylinder([x+(x<0?-7:7),20,0],12,1,metal,'x',32);
    cylinder([x+(x<0?-8:8),20,0],5,2,blue,'x',24);
    for(let i=0;i<6;i++) {
      const a=i*Math.PI/3;
      cylinder([x+(x<0?-8:8),20+Math.cos(a)*8,Math.sin(a)*8],1.6,1,black,'x',8);
    }
  }
  return m.faces;
}
// Intersections keep illustrative scan returns on the door, walls or obstacle.
function deliveryScan(state) {
  const origin=[0,state.robotZ-8],radians=state.doorAngle*Math.PI/180;
  const doorEnd=[-75+150*Math.cos(radians),-150*Math.sin(radians)];
  const segments=[
    [[-180,0],[-80,0]],[[80,0],[180,0]],[[-75,0],doorEnd],
    [[-48,-210],[48,-210]],[[48,-210],[48,-270]],[[48,-270],[-48,-270]],[[-48,-270],[-48,-210]]
  ];
  const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
  return Array.from({length:17},(_,i)=>{
    const angle=(i-8)*6*Math.PI/180,direction=[Math.sin(angle),-Math.cos(angle)];
    let distance=340,hit=false;
    for(const [a,b] of segments) {
      const edge=[b[0]-a[0],b[1]-a[1]],relative=[a[0]-origin[0],a[1]-origin[1]],den=cross(direction,edge);
      if(Math.abs(den)<1e-8)continue;
      const t=cross(relative,edge)/den,u=cross(relative,direction)/den;
      if(t>=0&&u>=0&&u<=1&&t<distance){distance=t;hit=true;}
    }
    return {start:[origin[0],84,origin[1]],end:[origin[0]+direction[0]*distance,84,origin[1]+direction[1]*distance],hit,distance};
  });
}
function createScanMesh(state) {
  const m=cinemaMesh(),color=state.stopped||state.doorAngle<30?[239,137,112]:[102,186,248];
  for(const ray of deliveryScan(state)) {
    const a=ray.start,b=ray.end,dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
    const w=[-dz/length*.3,0,dx/length*.3];
    const points=[a.map((v,i)=>v+w[i]),b.map((v,i)=>v+w[i]),b.map((v,i)=>v-w[i]),a.map((v,i)=>v-w[i])];
    m.face(points,color,'glow');m.face([...points].reverse(),color,'glow');
    if(ray.hit)m.cylinder(b,1.4,2,color,'y',8,'glow');
  }
  return m.faces;
}

function initCinema(storyId, scene) {
  const story=document.getElementById(storyId);
  if(!story)return;
  const stage=story.querySelector('.cinema-stage'),canvas=stage.querySelector('canvas');
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});
  if(!gl) return;
  const vertex=`
    attribute vec3 position, normal, color;
    attribute vec2 lensUV;
    attribute float glass;
    uniform vec3 eye, cameraRight, cameraUp, cameraBack, modelOffset, modelPivot, modelRotation;
    uniform vec2 viewport, origin;
    uniform float focal;
    varying vec3 vNormal,vColor,vPosition;
    varying vec2 vUV;
    varying float vGlass;
    vec3 rotateModel(vec3 p){
      float x=modelRotation.x,y=modelRotation.y;
      p=vec3(p.x,p.y*cos(x)-p.z*sin(x),p.y*sin(x)+p.z*cos(x));
      return vec3(p.x*cos(y)+p.z*sin(y),p.y,-p.x*sin(y)+p.z*cos(y));
    }
    void main(){
      vec3 world=rotateModel(position-modelPivot)+modelPivot+modelOffset;
      vec3 p=world-eye;
      float depth=-dot(p,cameraBack);
      vec2 xy=vec2(dot(p,cameraRight),dot(p,cameraUp))*focal;
      vec2 offset=vec2(2.0*origin.x/viewport.x-1.0,1.0-2.0*origin.y/viewport.y);
      gl_Position=vec4(2.0*xy/viewport+offset*depth,1.0005*depth-1.00025,depth);
      vNormal=rotateModel(normal);vColor=color;vPosition=world;vUV=lensUV;vGlass=glass;
    }`;
  const fragment=`
    precision highp float;
    uniform vec3 eye;
    varying vec3 vNormal,vColor,vPosition;
    varying vec2 vUV;
    varying float vGlass;
    void main(){
      vec3 n=normalize(vNormal),view=normalize(eye-vPosition);
      vec3 key=normalize(vec3(-.5,.8,1.0)),fill=normalize(vec3(.7,.25,-.7));
      float light=.32+.65*max(0.0,dot(n,key))+.28*max(0.0,dot(n,fill));
      float spec=pow(max(0.0,dot(n,normalize(key+view))),40.0);
      vec3 result=vColor*light+vec3(.42)*spec;
      if(vGlass>1.5){result=vColor;}
      else if(vGlass>.5){
        float r=length(vUV);
        float edge=smoothstep(.5,1.0,r);
        float reflection=exp(-15.0*length(vUV-vec2(-.27,.32)));
        float ring=exp(-85.0*pow(r-.75,2.0));
        result=mix(vec3(.016,.03,.07),vec3(.06,.15,.23),edge)+vec3(.28,.40,.46)*reflection+vec3(.035,.065,.1)*ring;
      }
      gl_FragColor=vec4(result,1.0);
    }`;
  function shader(type,source) {
    const result=gl.createShader(type);gl.shaderSource(result,source);gl.compileShader(result);
    if(!gl.getShaderParameter(result,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
    return result;
  }
  let program;
  try {
    program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) return;
  } catch { return; } // Keep the local poster visible if 3D is unavailable.
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);};
  function makeVertices(mesh) {
    const vertices=[];
    for(const face of mesh) {
      const normal=norm(cross(sub(face.points[1],face.points[0]),sub(face.points[2],face.points[0])));
      const center=face.points[0].map((_,i)=>face.points.reduce((s,p)=>s+p[i],0)/face.points.length);
      const glass=face.finish==='glass'&&normal[2]>.9;
      const radius=glass?Math.hypot(...sub(face.points[0],center)):1;
      for(let i=1;i<face.points.length-1;i++)for(const p of [face.points[0],face.points[i],face.points[i+1]]) {
        vertices.push(...p,...normal,...face.color.map(c=>c/255),(p[0]-center[0])/radius,(p[1]-center[1])/radius,face.finish==='glow'?2:glass?1:0);
      }
    }
    return new Float32Array(vertices);
  }
  gl.useProgram(program);
  const attributes=[['position',3],['normal',3],['color',3],['lensUV',2],['glass',1]].map(([name,size])=>[gl.getAttribLocation(program,name),size]);
  function bind(buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    let offset=0;
    for(const [location,size] of attributes){gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,48,offset*4);offset+=size;}
  }
  const grouped=new Map();
  for(const face of scene.mesh()) {
    if(!grouped.has(face.group))grouped.set(face.group,[]);
    grouped.get(face.group).push(face);
  }
  const meshes=[...grouped].map(([name,faces])=>{
    const vertices=makeVertices(faces),buffer=gl.createBuffer();bind(buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
    return {name,buffer,count:vertices.length/12};
  });
  const scanBuffer=scene.scan?gl.createBuffer():null;
  const uniforms=Object.fromEntries(['eye','cameraRight','cameraUp','cameraBack','viewport','origin','focal','modelOffset','modelPivot','modelRotation'].map(name=>[name,gl.getUniformLocation(program,name)]));
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const captions=[...story.querySelectorAll('.cinema-caption')],dots=[...story.querySelectorAll('.cinema-chapters span')];
  let width=1,height=1,frame=0;
  function render(progress) {
    const state=scene.frame(progress),pose=scene.pose(progress),yaw=pose.yaw*Math.PI/180,elevation=pose.elevation*Math.PI/180;
    const back=[Math.sin(yaw)*Math.cos(elevation),Math.sin(elevation),Math.cos(yaw)*Math.cos(elevation)];
    const eye=pose.target.map((v,i)=>v+back[i]*pose.distance),right=norm(cross([0,1,0],back)),up=cross(back,right);
    const mobile=width<700;
    gl.uniform3fv(uniforms.eye,eye);gl.uniform3fv(uniforms.cameraRight,right);gl.uniform3fv(uniforms.cameraUp,up);gl.uniform3fv(uniforms.cameraBack,back);
    gl.uniform2f(uniforms.viewport,width,height);gl.uniform2f(uniforms.origin,width*(mobile?.5:.67),height*(mobile?.36:.46));
    gl.uniform1f(uniforms.focal,Math.min(height*1.35,width*(mobile?1.3:1.6)));
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    function transform(value={}) {
      gl.uniform3fv(uniforms.modelOffset,value.offset||[0,0,0]);
      gl.uniform3fv(uniforms.modelPivot,value.pivot||[0,0,0]);
      gl.uniform3fv(uniforms.modelRotation,value.rotation||[0,0,0]);
    }
    for(const mesh of meshes){transform(state.transforms?.[mesh.name]);bind(mesh.buffer);gl.drawArrays(gl.TRIANGLES,0,mesh.count);}
    if(scanBuffer){
      const vertices=makeVertices(scene.scan(state));transform();bind(scanBuffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,vertices.length/12);
    }
    const chapter=state.chapter;
    captions.forEach((caption,i)=>{caption.classList.toggle('is-active',i===chapter);caption.setAttribute('aria-hidden',String(i!==chapter));});
    dots.forEach((item,i)=>item.classList.toggle('is-active',i===chapter));
    story.style.setProperty('--cinema-progress',progress);
    canvas.dataset.progress=progress.toFixed(4);canvas.dataset.view=String(chapter);
  }
  function update() {
    frame=0;
    if(gl.isContextLost())return;
    const rect=story.getBoundingClientRect(),staticView=reduced.matches||innerHeight<520;
    if(rect.bottom<0||rect.top>innerHeight)return;
    render(staticView?scene.staticProgress:Math.max(0,Math.min(1,(80-rect.top)/Math.max(1,story.offsetHeight-stage.offsetHeight))));
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  function resize(){
    width=stage.clientWidth;height=stage.clientHeight;
    const ratio=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);gl.viewport(0,0,canvas.width,canvas.height);schedule();
  }
  story.classList.add('cinema-ready');
  canvas.addEventListener('webglcontextlost',()=>{story.classList.remove('cinema-ready');cancelAnimationFrame(frame);frame=0;});
  new ResizeObserver(resize).observe(stage);
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize);
  reduced.addEventListener('change',resize);
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','lang']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  resize();
}
function initCinematicProjects() {
  initCinema('motion-lab',{mesh:createPanTiltMesh,pose:cinemaPose,staticProgress:.58,frame:p=>({chapter:p<.2?0:p<.44?1:p<.72?2:3})});
  initCinema('delivery-lab',{mesh:createDeliveryMesh,pose:deliveryPose,frame:deliveryState,scan:createScanMesh,staticProgress:.25});
}
if(typeof document!=='undefined') {
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initCinematicProjects);
  else initCinematicProjects();
}
