//COLORS
var Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xf5986e,
  brownDark: 0x23190f,
  blue: 0x68c3c0,
};

var scene, camera, renderer, clock, deltaTime, totalTime;

var arToolkitSource,
  arToolkitContext,
  smoothedControls_drum,
  smoothedControls_ham;

var markerRoot1, markerRoot2, markerControls1, markerControls2;

var mesh1;

var material_drum, material_hummer;

var drum, hammer;

var ham_len = 4;
var drum_sideLen = 1;
var ham_sideLen = 0.3;

//SCREEN & MOUSE VARIABLES

var HEIGHT,
  WIDTH,
  mousePos = { x: 0, y: 0 };

function init() {
  initialize();
  createLights();
  animate();
}

function initialize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();

  let ambientLight = new THREE.AmbientLight(0xcccccc, 0.5);
  scene.add(ambientLight);

  camera = new THREE.Camera();
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  //   renderer.setClearColor(new THREE.Color("lightgrey"), 0);
  renderer.setSize(640, 480);
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "0px";
  renderer.domElement.style.left = "0px";
  container = document.getElementById("world");
  container.appendChild(renderer.domElement);

  clock = new THREE.Clock();
  deltaTime = 0;
  totalTime = 0;

  arToolkitSource = new THREEx.ArToolkitSource({
    sourceType: "webcam",
  });

  function onResize() {
    arToolkitSource.onResizeElement();
    arToolkitSource.copyElementSizeTo(renderer.domElement);
    if (arToolkitContext.arController !== null) {
      arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
    }
  }

  arToolkitSource.init(function onReady() {
    onResize();
  });

  // handle resize event
  window.addEventListener("resize", function () {
    onResize();
  });

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

  drawDrum();

  drawHammer();
  console.log("info of scene", scene);
}

function drawDrum() {
  markerRoot1 = new THREE.Group();
  markerRoot1.name = "Drum MarkerRoot";
  scene.add(markerRoot1);
  markerControls1 = new THREEx.ArMarkerControls(arToolkitContext, markerRoot1, {
    type: "pattern",
    patternUrl: "data/hiro.patt",
  });

  let smoothedRoot_drum = new THREE.Group();
  smoothedRoot_drum.name = "Drum SmmoothedRoot";
  scene.add(smoothedRoot_drum);
  smoothedControls_drum = new THREEx.ArSmoothedControls(smoothedRoot_drum, {
    lerpPosition: 0.8,
    lerpQuaternion: 0.8,
    lerpScale: 1,
    // minVisibleDelay: 1,
    // minUnvisibleDelay: 1,
  });

  createDrum(smoothedRoot_drum);
}

function drawHammer() {
  //人kanji
  markerRoot2 = new THREE.Group();
  markerRoot2.name = "Hammer MarkerRoot";
  scene.add(markerRoot2);
  markerControls2 = new THREEx.ArMarkerControls(arToolkitContext, markerRoot2, {
    type: "pattern",
    patternUrl: "data/kanji.patt",
    changeMatrixMode: "modelViewMatrix",
  });

  let smoothedRoot_ham = new THREE.Group();
  smoothedRoot_ham.name = "Hammer SmmoothedRoot";
  scene.add(smoothedRoot_ham);
  smoothedControls_ham = new THREEx.ArSmoothedControls(smoothedRoot_ham, {
    lerpPosition: 0.8,
    lerpQuaternion: 0.8,
    lerpScale: 1,
    // minVisibleDelay: 1,
    // minUnvisibleDelay: 1,
  });

  createHammer(smoothedRoot_ham);
}

var Drum = function () {
  this.mesh = new THREE.Object3D();

  material_drum = new THREE.MeshPhongMaterial({
    color: Colors.red,
    flatShading: THREE.FlatShading,
  });

  var drum1 = new THREE.Mesh(
    new THREE.CubeGeometry(drum_sideLen, drum_sideLen, drum_sideLen, 2, 2, 3),
    material_drum
  );
  drum1.castShadow = true;
  drum1.reveiveShadow = true;

  this.mesh.add(drum1);
  //   scene.add(drum);
};

var Hammer = function () {
  this.mesh = new THREE.Object3D();

  material_hummer = new THREE.MeshPhongMaterial({
    color: Colors.white,
    flatShading: THREE.FlatShading,
  });
  var hammer1 = new THREE.Mesh(
    new THREE.CubeGeometry(ham_sideLen, ham_sideLen, ham_len, 2, 2, 3),
    material_hummer
  );
  hammer1.castShadow = true;
  hammer1.reveiveShadow = true;
  this.mesh.add(hammer1);
  // scene.add(hammer);
};

function createDrum(sence) {
  drum = new Drum();
  drum.mesh.position.y = 0;
  sence.add(drum.mesh);
}

function createHammer(sence) {
  hammer = new Hammer();
  hammer.mesh.position.y = 0;
  sence.add(hammer.mesh);
}

function update() {
  var targetY = normalize(mousePos.y, -0.75, 0.75, 25, 175);
  var targetX = normalize(mousePos.x, -0.75, 0.75, -100, 100);
  //   drum.mesh.position.x = targetX / 10;
  //   markerRoot1.position.x = targetX;

  if (markerControls1.object3d.visible && markerControls2.object3d.visible) {
    //2 is drum, 4 is hammer
    let distance_x = Math.abs(
      scene.children[2].position.x - scene.children[4].position.x
    );
    let distance_y = Math.abs(
      scene.children[4].position.y - scene.children[2].position.y
    );
    let distance_z = Math.abs(
      scene.children[4].position.z - scene.children[2].position.z
    );

    if (
      distance_x < drum_sideLen / 2 + ham_len / 2 &&
      distance_y < drum_sideLen / 2 + ham_sideLen / 2 &&
      distance_z < drum_sideLen / 2 + ham_sideLen / 2
    ) {
      console.log("Bingo!");
    }
    //console.log("distance of y is", distance_y);
    // console.log("both shown, info of scene", scene);
    // let distance = drum.mesh.position.x - hammer.mesh.position.x;
    // // console.log("the distance between hammer and drum is", distance);
    // console.log(
    //   "the position of drum is x:" +
    //     drum.mesh.position.x +
    //     " y is " +
    //     drum.mesh.position.y
    // );
    // console.log(
    //   "the position of ham is x:" +
    //     hammer.mesh.position.x +
    //     " y is " +
    //     hammer.mesh.position.y
    // );
  }

  // update artoolkit on every frame
  if (arToolkitSource.ready !== false)
    //source is image/video/webcam
    arToolkitContext.update(arToolkitSource.domElement);
  smoothedControls_drum.update(markerRoot1);
  smoothedControls_ham.update(markerRoot2);
}

function render() {
  renderer.render(scene, camera);
}

function normalize(v, vmin, vmax, tmin, tmax) {
  var nv = Math.max(Math.min(v, vmax), vmin);
  var dv = vmax - vmin;
  var pc = (nv - vmin) / dv;
  var dt = tmax - tmin;
  var tv = tmin + pc * dt;
  return tv;
}

function animate(event) {
  document.addEventListener("mousemove", handleMouseMove, false);
  requestAnimationFrame(animate);
  deltaTime = clock.getDelta();
  totalTime += deltaTime;
  update();
  render();
}

var mousePos = { x: 0, y: 0 };

function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH) * 2;
  var ty = 1 - (event.clientY / HEIGHT) * 2;
  mousePos = { x: tx, y: ty };
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
window.addEventListener("load", init, false);
