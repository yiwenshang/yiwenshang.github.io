//COLORS
var Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xf5986e,
  brownDark: 0x23190f,
  blue: 0x68c3c0,
};
// ("use strict");

// Physijs.scripts.worker = "physi/physijs_worker.js";
// Physijs.scripts.ammo = "physi/ammo.js";

var scene, camera, renderer, clock, deltaTime, totalTime;

var arToolkitSource, arToolkitContext;

var markerRoot1, markerRoot2;

var render_stats, physics_stats;

var mesh1;

function init() {
  initialize();
  animate();
}

function initialize() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setClearColor(new THREE.Color("lightgrey"), 0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "0px";
  renderer.domElement.style.left = "0px";
  let container = document.getElementById("world");
  container.appendChild(renderer.domElement);

  render_stats = new Stats();
  render_stats.domElement.style.position = "absolute";
  render_stats.domElement.style.top = "0px";
  render_stats.domElement.style.zIndex = 100;
  container.appendChild(render_stats.domElement);

  physics_stats = new Stats();
  physics_stats.domElement.style.position = "absolute";
  physics_stats.domElement.style.top = "50px";
  physics_stats.domElement.style.zIndex = 100;
  container.appendChild(physics_stats.domElement);

  scene = new Physijs.Scene();
  scene.setGravity(new THREE.Vector3(0, -30, 0));

  scene.addEventListener("update", function () {
    scene.simulate(undefined, 1);
    physics_stats.update();
  });

  let ambientLight = new THREE.AmbientLight(0xcccccc, 0.5);
  scene.add(ambientLight);

  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(60, 50, 60);
  camera.lookAt(scene.position);
  scene.add(camera);

  clock = new THREE.Clock();
  deltaTime = 0;
  totalTime = 0;

  ////////////////////////////////////////////////////////////
  // setup arToolkitSource
  ////////////////////////////////////////////////////////////

  arToolkitSource = new THREEx.ArToolkitSource({
    sourceType: "webcam",
  });

  function onResize() {
    arToolkitSource.onResize();
    arToolkitSource.copySizeTo(renderer.domElement);
    if (arToolkitContext.arController !== null) {
      arToolkitSource.copySizeTo(arToolkitContext.arController.canvas);
    }
  }

  arToolkitSource.init(function onReady() {
    onResize();
  });

  // handle resize event
  window.addEventListener("resize", function () {
    onResize();
  });

  ////////////////////////////////////////////////////////////
  // setup arToolkitContext
  ////////////////////////////////////////////////////////////

  // create atToolkitContext
  arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: "data/camera_para.dat",
    detectionMode: "mono",
  });

  // copy projection matrix to camera when initialization complete
  arToolkitContext.init(function onCompleted() {
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
  });

  ////////////////////////////////////////////////////////////
  // setup markerRoots
  ////////////////////////////////////////////////////////////

  // build markerControls
  markerRoot1 = new THREE.Group();
  scene.add(markerRoot1);
  let markerControls1 = new THREEx.ArMarkerControls(
    arToolkitContext,
    markerRoot1,
    {
      type: "pattern",
      patternUrl: "data/hiro.patt",
    }
  );

  var material_drum = Physijs.createMaterial(
    new THREE.MeshPhongMaterial({
      color: Colors.red,
      shading: THREE.FlatShading,
    }),
    0.8,
    0.3
  );

  drawDrum(markerRoot1, material_drum);
  //人kanji
  markerRoot2 = new THREE.Group();
  scene.add(markerRoot2);
  let markerControls2 = new THREEx.ArMarkerControls(
    arToolkitContext,
    markerRoot2,
    {
      type: "pattern",
      patternUrl: "data/kanji.patt",
    }
  );
  var material_hummer = Physijs.createMaterial(
    new THREE.MeshPhongMaterial({
      color: Colors.white,
      shading: THREE.FlatShading,
    }),
    0.8,
    0.3
  );

  drawHammer(markerRoot2, material_hummer);
}

function drawDrum(scene, material) {
  let cube = new Physijs.BoxMesh(
    new THREE.CubeGeometry(1, 1, 1, 2, 2, 3),
    material,
    0
  );
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);
}

function drawHammer(scene, material) {
  let cube = new Physijs.BoxMesh(
    new THREE.CubeGeometry(0.3, 0.3, 8, 2, 2, 3),
    material,
    0
  );
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);
}

function update() {
  render_stats.update();
  // update artoolkit on every frame
  if (arToolkitSource.ready !== false)
    arToolkitContext.update(arToolkitSource.domElement);
}

function render() {
  scene.simulate();
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  deltaTime = clock.getDelta();
  totalTime += deltaTime;
  update();
  render();
}

window.addEventListener("load", init, false);
