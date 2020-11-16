//COLORS
var Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xf5986e,
  brownDark: 0x23190f,
  blue: 0x68c3c0,
};

var scene,
  camera,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  renderer,
  container,
  clock,
  deltaTime,
  totalTime;

var arToolkitSource, arToolkitContext, markerControls1;

var markerRoot1, markerRoot2;

var mesh1;

var HEIGHT,
  WIDTH,
  mousePos = { x: 0, y: 0 };

function createScene() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 60;
  nearPlane = 1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );

  scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = 100;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;
  container = document.getElementById("world");
  container.appendChild(renderer.domElement);

  clock = new THREE.Clock();
  deltaTime = 0;
  totalTime = 0;

  window.addEventListener("resize", handleWindowResize, false);

  //It is the image which is analyzed to do the position tracking
  arToolkitSource = new THREEx.ArToolkitSource({
    sourceType: "webcam", //网络摄像头
  });

  arToolkitSource.init(function onReady() {
    handleWindowResize();
  });

  //main engine, to find the marker position in the image source
  arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: "data/camera_para.dat",
    detectionMode: "mono",
    canvasWidth: 640,
    canvasHeight: 480,
    imageSmoothingEnabled: true,
  });

  // copy projection matrix to camera when initialization complete
  arToolkitContext.init(function onCompleted() {
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
  });

  markerRoot1 = new THREE.Group();
  scene.add(markerRoot1);
  markerControls1 = new THREEx.ArMarkerControls(arToolkitContext, markerRoot1, {
    type: "pattern",
    patternUrl: "data/hiro.patt",
  });

  // let geometry1 = new THREE.CubeGeometry(1, 1, 1);
  // let material1 = new THREE.MeshNormalMaterial({
  //   transparent: true,
  //   opacity: 0.5,
  //   side: THREE.DoubleSide,
  // });

  // mesh1 = new THREE.Mesh(geometry1, material1);
  // mesh1.position.y = 0.5;

  // markerRoot1.add(mesh1);
}

// HANDLE SCREEN EVENTS

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
  arToolkitSource.onResize();
  arToolkitSource.copySizeTo(renderer.domElement);
  if (arToolkitContext.arController !== null) {
    arToolkitSource.copySizeTo(arToolkitContext.arController.canvas);
  }
}

// LIGHTS

var ambientLight, hemisphereLight, shadowLight;

function createLights() {
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
  shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  scene.add(hemisphereLight);
  scene.add(shadowLight);
}

var Drum = function () {
  this.mesh = new THREE.Object3D();
  this.mesh.name = "drum";

  var geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
  var matCockpit = new THREE.MeshPhongMaterial({
    color: Colors.red,
    shading: THREE.FlatShading,
  });
  var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
  cockpit.castShadow = true;
  cockpit.receiveShadow = true;
  this.mesh.add(cockpit);
};

var drum;

function createDrum() {
  drum = new Drum();
  drum.mesh.scale.set(0.25, 0.25, 0.25);
  drum.mesh.position.y = 100;
  markerRoot1.add(drum.mesh);
}

function update() {
  var targetY = normalize(mousePos.y, -0.75, 0.75, 25, 175);
  var targetX = normalize(mousePos.x, -0.75, 0.75, -100, 100);
  drum.mesh.position.y = targetY;
  drum.mesh.position.x = targetX;
  if (arToolkitSource.ready !== false)
    arToolkitContext.update(arToolkitSource.domElement);
}

function normalize(v, vmin, vmax, tmin, tmax) {
  var nv = Math.max(Math.min(v, vmax), vmin);
  var dv = vmax - vmin;
  var pc = (nv - vmin) / dv;
  var dt = tmax - tmin;
  var tv = tmin + pc * dt;
  return tv;
}

function loop() {
  update();
  renderer.render(scene, camera);
  deltaTime = clock.getDelta();
  totalTime += deltaTime;
  requestAnimationFrame(loop);
}

function init(event) {
  document.addEventListener("mousemove", handleMouseMove, false);
  createScene();
  createLights();
  createDrum();
  loop();
}

var mousePos = { x: 0, y: 0 };

function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH) * 2;
  var ty = 1 - (event.clientY / HEIGHT) * 2;
  mousePos = { x: tx, y: ty };
}

window.addEventListener("load", init, false);
