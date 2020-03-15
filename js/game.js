var Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xf5986e,
  brownDark: 0x23190f,
  blue: 0x68c3c0
};

var scene,
  camera,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  HEIGHT,
  WIDTH,
  renderer,
  container;

var hemisphereLight, shadowLight;
var sea;
var sky;
var airplane;

var mousePos = { x: 0, y: 0 };

window.addEventListener("load", init, false);

function init() {
  createScene();

  createLights();

  createPlane();
  createSea();
  createSky();

  document.addEventListener("mousemove", handleMouseMove, false);
  document.addEventListener("handmove", handleMouseMove, false);

  loop();
}

function loop() {
  sea.mesh.rotation.z += 0.001;
  sky.mesh.rotation.z += 0.001;

  // update the plane on each frame
  updatePlane();

  renderer.render(scene, camera);

  requestAnimationFrame(loop);
}

function createScene() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  // 创建场景
  scene = new THREE.Scene();

  // 雾
  // 这个类中的参数定义了线性雾。也就是说，雾的密度是随着距离线性增大的。
  scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

  // 创建透视相机
  // fov — 摄像机视锥体垂直视野角度
  // aspect — 摄像机视锥体长宽比
  // near — 摄像机视锥体近端面
  // far — 摄像机视锥体远端面
  camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 1, 10000);

  // 设置相机位置
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = 100;

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;
  container = document.getElementById("world");
  container.appendChild(renderer.domElement);

  window.addEventListener("resize", handleWindowResize, false);
}

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function createLights() {
  // 半球光
  // 光源直接放置于场景之上，光照颜色从天空光线颜色颜色渐变到地面光线颜色。
  // 半球光不能投射阴影
  // skyColor - (可选参数) 天空中发出光线的颜色。 缺省值 0xffffff。
  // groundColor - (可选参数) 地面发出光线的颜色。 缺省值 0xffffff。
  // intensity - (可选参数) 光照强度。 缺省值 1。
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);

  // 平行光
  // 平行光是沿着特定方向发射的光。这种光的表现像是无限远,从它发出的光线都是平行的。
  // 常常用平行光来模拟太阳光的效果; 太阳足够远，因此我们可以认为太阳的位置是无限远，
  // 所以我们认为从太阳发出的光线也都是平行的。
  // 平行光可以投射阴影
  // color - (可选参数) 16进制表示光的颜色。 缺省值为 0xffffff (白色)。
  // intensity - (可选参数) 光照的强度。缺省值为1。
  shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);

  shadowLight.position.set(150, 350, 350);

  // 该平行光会产生动态阴影
  shadowLight.castShadow = true;

  // 用来计算该平行光产生的阴影
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;

  // define the resolution of the shadow; the higher the better,
  // but also the more expensive and less performant
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  scene.add(hemisphereLight);
  scene.add(shadowLight);
}

Sea = function() {
  // 圆柱几何体
  // radiusTop — 圆柱的顶部半径，默认值是1。
  // radiusBottom — 圆柱的底部半径，默认值是1。
  // height — 圆柱的高度，默认值是1。
  // radialSegments — 圆柱侧面周围的分段数，默认为8。
  // heightSegments — 圆柱侧面沿着其高度的分段数，默认值为1。
  var geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);

  // rotate the geometry on the x axis
  geom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

  // Phong网格材质,一种用于具有镜面高光的光泽表面的材质。
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.blue,
    transparent: true,
    opacity: 0.6,
    flatShading: THREE.FlatShading
  });

  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.receiveShadow = true;
};

function createSea() {
  sea = new Sea();
  sea.mesh.position.y = -600;
  scene.add(sea.mesh);
}

Cloud = function() {
  // Create an empty container that will hold the different parts of the cloud
  this.mesh = new THREE.Object3D();

  // create a cube geometry;
  // this shape will be duplicated to create the cloud
  var geom = new THREE.BoxGeometry(20, 20, 20);

  // create a material; a simple white material will do the trick
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.white
  });

  // duplicate the geometry a random number of times
  var nBlocs = 3 + Math.floor(Math.random() * 3);
  for (var i = 0; i < nBlocs; i++) {
    // create the mesh by cloning the geometry
    var m = new THREE.Mesh(geom, mat);

    // set the position and the rotation of each cube randomly
    m.position.x = i * 15;
    m.position.y = Math.random() * 10;
    m.position.z = Math.random() * 10;
    m.rotation.z = Math.random() * Math.PI * 2;
    m.rotation.y = Math.random() * Math.PI * 2;

    // set the size of the cube randomly
    var s = 0.1 + Math.random() * 0.9;
    m.scale.set(s, s, s);

    // allow each cube to cast and to receive shadows
    m.castShadow = true;
    m.receiveShadow = true;

    // add the cube to the container we first created
    this.mesh.add(m);
  }
};

// Define a Sky Object
Sky = function() {
  // Create an empty container
  this.mesh = new THREE.Object3D();

  // choose a number of clouds to be scattered in the sky
  this.nClouds = 20;

  // To distribute the clouds consistently,
  // we need to place them according to a uniform angle
  var stepAngle = (Math.PI * 2) / this.nClouds;

  // create the clouds
  for (var i = 0; i < this.nClouds; i++) {
    var c = new Cloud();

    // set the rotation and the position of each cloud;
    // for that we use a bit of trigonometry
    var a = stepAngle * i; // this is the final angle of the cloud
    var h = 750 + Math.random() * 200; // this is the distance between the center of the axis and the cloud itself

    // Trigonometry!!! I hope you remember what you've learned in Math :)
    // in case you don't:
    // we are simply converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
    c.mesh.position.y = Math.sin(a) * h;
    c.mesh.position.x = Math.cos(a) * h;

    // rotate the cloud according to its position
    c.mesh.rotation.z = a + Math.PI / 2;

    // for a better result, we position the clouds
    // at random depths inside of the scene
    c.mesh.position.z = -400 - Math.random() * 400;

    // we also set a random scale for each cloud
    var s = 1 + Math.random() * 2;
    c.mesh.scale.set(s, s, s);

    // do not forget to add the mesh of each cloud in the scene
    this.mesh.add(c.mesh);
  }
};

function createSky() {
  sky = new Sky();
  sky.mesh.position.y = -600;
  scene.add(sky.mesh);
}

var AirPlane = function() {
  this.mesh = new THREE.Object3D();

  // Create the cabin
  var geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
  var matCockpit = new THREE.MeshPhongMaterial({
    color: Colors.red,
    shading: THREE.FlatShading
  });
  var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
  cockpit.castShadow = true;
  cockpit.receiveShadow = true;
  this.mesh.add(cockpit);

  // Create the engine
  var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
  var matEngine = new THREE.MeshPhongMaterial({
    color: Colors.white,
    shading: THREE.FlatShading
  });
  var engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 40;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);

  // Create the tail
  var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
  var matTailPlane = new THREE.MeshPhongMaterial({
    color: Colors.red,
    shading: THREE.FlatShading
  });
  var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
  tailPlane.position.set(-35, 25, 0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);

  // Create the wing
  var geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
  var matSideWing = new THREE.MeshPhongMaterial({
    color: Colors.red,
    shading: THREE.FlatShading
  });
  var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);

  // propeller
  var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
  var matPropeller = new THREE.MeshPhongMaterial({
    color: Colors.brown,
    shading: THREE.FlatShading
  });
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;

  // blades
  var geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
  var matBlade = new THREE.MeshPhongMaterial({
    color: Colors.brownDark,
    shading: THREE.FlatShading
  });

  var blade = new THREE.Mesh(geomBlade, matBlade);
  blade.position.set(8, 0, 0);
  blade.castShadow = true;
  blade.receiveShadow = true;
  this.propeller.add(blade);
  this.propeller.position.set(50, 0, 0);
  this.mesh.add(this.propeller);
};

function createPlane() {
  airplane = new AirPlane();
  airplane.mesh.scale.set(0.25, 0.25, 0.25);
  airplane.mesh.position.y = 100;
  scene.add(airplane.mesh);
}

function handleMouseMove(event) {
  if (!event.clientX) {
    event.clientX = event.detail.clientX;
    event.clientY = event.detail.clientY;
  }
  // here we are converting the mouse position value received
  // to a normalized value varying between -1 and 1;
  // this is the formula for the horizontal axis:

  var tx = -1 + (event.clientX / WIDTH) * 2;

  // for the vertical axis, we need to inverse the formula
  // because the 2D y-axis goes the opposite direction of the 3D y-axis

  var ty = 1 - (event.clientY / HEIGHT) * 2;
  mousePos = { x: tx, y: ty };
  // console.log("h mouse", mousePos);
}

function updatePlane() {
  // let's move the airplane between -100 and 100 on the horizontal axis,
  // and between 25 and 175 on the vertical axis,
  // depending on the mouse position which ranges between -1 and 1 on both axes;
  // to achieve that we use a normalize function (see below)

  var targetX = normalize(mousePos.x, -1, 1, -100, 100);
  var targetY = normalize(mousePos.y, -1, 1, 25, 175);

  // update the airplane's position
  airplane.mesh.position.y = targetY;
  airplane.mesh.position.x = targetX;
  airplane.propeller.rotation.x += 0.3;
}

function normalize(v, vmin, vmax, tmin, tmax) {
  var nv = Math.max(Math.min(v, vmax), vmin);
  var dv = vmax - vmin;
  var pc = (nv - vmin) / dv;
  var dt = tmax - tmin;
  var tv = tmin + pc * dt;
  return tv;
}
