//COLORS
var Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xf5986e,
    brownDark: 0x23190f,
    blue: 0x68c3c0,
    grey: 0x808080,
  };
  
  var scene, camera, renderer, clock, deltaTime, totalTime;
  var chip_startTime, chip_deltaTime;
  var newTime = new Date().getTime();
  var oldTime = new Date().getTime();
  
  var arToolkitSource,
    arToolkitContext,
    smoothedControls_drum,
    smoothedControls_ham;
  
  var markerRoot1, markerRoot2, markerControls1, markerControls2;
  
  var mesh1;
  
  var material_drum, material_hummer, material_chip;
  
  var smoothedRoot_drum, smoothedRoot_ham;
  
  var drum, hammer, target, chipHolder, plate, dongHolder, button_start;
  
  var font_beat, inTarget;
  
  var target_pos = { x: -4, y: 0, z: 0.1 };
  
  var ham_len = 4;
  var drum_sideLen = 1;
  var ham_sideLen = 0.3;
  
  var btnS_x = 1.6,
    btnS_y = 0.4,
    btnS_z = 1.2;
  
  var radius_dong = 0.25,
    radius_target = 0.3;
  
  var drum_color;
  
  var chipPool = [];
  var chipInUse = [];
  
  var beat;
  
  var score, combo;
  
  let distance_x;
  let distance_y;
  let distance_z;
  
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
    drum_color = Colors.red;
    beat = 0;
    inTarget = 0;
    score = 0;
    combo = 0;
    scene = new THREE.Scene();
  
    let ambientLight = new THREE.AmbientLight(0xcccccc, 0.5);
    scene.add(ambientLight);
  
    camera = new THREE.Camera();
    scene.add(camera);
  
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
  
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
  
    drawDrumGroup();
    drawHammerGroup();
    console.log("info of scene", scene);
  }
  
  function drawDrumGroup() {
    markerRoot1 = new THREE.Group();
    markerRoot1.name = "Drum MarkerRoot";
    scene.add(markerRoot1);
    markerControls1 = new THREEx.ArMarkerControls(arToolkitContext, markerRoot1, {
      type: "pattern",
      patternUrl: "data/hiro.patt",
    });
  
    smoothedRoot_drum = new THREE.Group();
    smoothedRoot_drum.name = "Drum SmmoothedRoot";
    smoothedRoot_drum.scale.set(0.5, 0.5, 0.5);
    scene.add(smoothedRoot_drum);
    smoothedControls_drum = new THREEx.ArSmoothedControls(smoothedRoot_drum, {
      lerpPosition: 0.8,
      lerpQuaternion: 0.8,
      lerpScale: 1,
    });
  
    createDrum();
    createText();
    createButton_start();
    createPlate();
    createDong();
  }
  
  function drawHammerGroup() {
    //人kanji
    markerRoot2 = new THREE.Group();
    markerRoot2.name = "Hammer MarkerRoot";
    scene.add(markerRoot2);
    markerControls2 = new THREEx.ArMarkerControls(arToolkitContext, markerRoot2, {
      type: "pattern",
      patternUrl: "data/kanji.patt",
      changeMatrixMode: "modelViewMatrix",
    });
  
    smoothedRoot_ham = new THREE.Group();
    smoothedRoot_ham.name = "Hammer SmmoothedRoot";
    scene.add(smoothedRoot_ham);
    smoothedControls_ham = new THREEx.ArSmoothedControls(smoothedRoot_ham, {
      lerpPosition: 0.8,
      lerpQuaternion: 0.8,
      lerpScale: 1,
    });
  
    createHammer();
    createChips();
  }
  
  Chip = function () {
    material_chip = new THREE.MeshPhongMaterial({
      color: Colors.pink,
      shininess: 0,
      specular: 0xffffff,
      flatShading: THREE.FlatShading,
    });
    this.mesh = new THREE.Mesh(
      new THREE.CubeGeometry(0.1, 0.1, 0.1),
      material_chip
    );
    this.mesh.castShadow = true;
  };
  
  var Dong = function () {
    material_dong = new THREE.MeshPhongMaterial({
      color: Colors.red,
      flatShading: THREE.FlatShading,
    });
    this.flag_s = true;
    this.flag_e = true;
    this.mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius_dong, radius_dong, 0.1, 20, 20),
      material_dong
    );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.rotation.set((Math.PI / 180) * 90, 0, 0);
  };
  
  Dong.prototype.move_on = function () {
    var _this = this;
    var _p = this.mesh.parent;
    var speed = 2;
  
    TweenMax.to(this.mesh.position, speed, {
      x: target_pos.x,
      delay: Math.random() * 0.1,
      ease: Power0.easeInOut,
      onUpdate: function () {
        //console.log("dong pos_x is ", _this.mesh.position.x);
        if (
          _this.mesh.position.x + dongHolder.mesh.position.x - target.position.x <
          radius_target + radius_dong
        ) {
          if (_this.flag_s) {
            inTarget += 1;
            _this.flag_s = false;
            console.log("set flag s to false");
          }
        } else {
        }
        console.log("inTarget is ", inTarget);
        if (inTarget > 0) {
          font_beat.visible = true;
        } else {
          font_beat.visible = false;
        }
      },
      onComplete: function () {
        inTarget = inTarget - 1;
        if (inTarget > 0) {
          font_beat.visible = true;
        } else {
          font_beat.visible = false;
        }
        if (_p) _p.remove(_this.mesh);
      },
    });
  };
  
  Chip.prototype.splash = function (pos, scale) {
    var _this = this;
    var _p = this.mesh.parent;
    this.mesh.scale.set(scale, scale, scale);
  
    var targetX = pos.x + 1 + Math.random() * 2;
    var targetY = pos.y + 2 - Math.random();
    var targetZ = pos.z + 5 + Math.random() * 2;
  
    var speed = 1;
  
    //TweenMax.to(element,second,size):scale the element to size in second
    TweenMax.to(this.mesh.rotation, speed, {
      x: Math.random() * 12,
      y: Math.random() * 12,
      z: Math.random() * 12,
    });
    TweenMax.to(this.mesh.scale, speed, { x: 0.1, y: 0.1, z: 0.1 });
    TweenMax.to(this.mesh.position, speed, {
      y: targetY,
      x: targetX,
      z: targetZ,
      delay: Math.random() * 0.1,
      ease: Power2.easeOut,
      onComplete: function () {
        if (_p) _p.remove(_this.mesh);
      },
    });
  };
  
  ChipHolder = function () {
    this.mesh = new THREE.Object3D();
    this.mesh.position = smoothedRoot_ham.position;
    this.mesh.position.z = smoothedRoot_ham.position.z - 2;
  };
  
  DongHolder = function () {
    this.mesh = new THREE.Object3D();
    this.mesh.position.y = 3;
    this.mesh.position.z = 0.2;
    this.mesh.position.x = 2;
  };
  
  function sleep(time) {
    return new Promise((resolve) => {
      setTimeout(resolve, time);
    });
  }
  DongHolder.prototype.spawnDong = async function () {
    console.log("spawnDong ing...");
    let dongList = [1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1];
    for (var i = 0; i < dongList.length; i++) {
      if (dongList[i] == 1) {
        var dong = new Dong();
        this.mesh.add(dong.mesh);
        dong.move_on();
      }
      await sleep(1000);
    }
  };
  
  ChipHolder.prototype.spawnChip = function (pos, scale) {
    //   var nChip = 1 + Math.floor(Math.random() * 10);
    var nChip = 4;
    for (var i = 0; i < nChip; i++) {
      var chip;
      chip = new Chip();
      this.mesh.add(chip.mesh);
      chip.mesh.visible = true;
  
      chip.splash(pos, scale);
    }
  };
  
  var Drum = function () {
    this.mesh = new THREE.Object3D();
  
    material_drum = new THREE.MeshPhongMaterial({
      color: drum_color,
      flatShading: THREE.FlatShading,
    });
  
    var drum1 = new THREE.Mesh(
      new THREE.CubeGeometry(drum_sideLen, drum_sideLen, drum_sideLen, 2, 2, 3),
      material_drum
    );
    drum1.castShadow = true;
    drum1.receiveShadow = true;
  
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
      new THREE.CubeGeometry(ham_sideLen, ham_sideLen, ham_len),
      material_hummer
    );
    hammer1.castShadow = true;
    hammer1.receiveShadow = true;
    this.mesh.add(hammer1);
    // scene.add(hammer);
  };
  
  var Button_start = function () {
    this.mesh = new THREE.Object3D();
    var material = new THREE.MeshPhongMaterial({
      color: Colors.red,
      flatShading: THREE.FlatShading,
    });
    var mesh = new THREE.Mesh(
      new THREE.CubeGeometry(btnS_x, btnS_y, btnS_z),
      material
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.mesh.add(mesh);
  };
  
  Button_start.prototype.transform = function () {
    var _this = this;
    var _p = this.mesh.parent;
    var speed = 0.5;
    TweenMax.to(this.mesh.scale, speed, {
      y: 0.3,
      ease: Power2.easeOut,
      onComplete: function () {
        if (_p) _p.remove(_this.mesh);
        dongHolder.spawnDong();
      },
    });
  };
  
  var Plate = function () {
    this.mesh = new THREE.Group();
    var material_plate = new THREE.MeshPhongMaterial({
      color: Colors.brownDark,
      flatShading: THREE.FlatShading,
    });
    var plate1 = new THREE.Mesh(
      new THREE.CubeGeometry(5, 1, 0.1),
      material_plate
    );
  
    var material_plate = new THREE.MeshPhongMaterial({
      color: Colors.grey,
      flatShading: THREE.FlatShading,
    });
  
    target = new THREE.Mesh(
      new THREE.CylinderGeometry(radius_target, radius_target, 0.1, 20, 20),
      material_plate
    );
  
    var material_num = new THREE.MeshPhongMaterial({
      color: Colors.red,
      flatShading: THREE.FlatShading,
    });
    var material_score = new THREE.MeshPhongMaterial({
      color: Colors.white,
      flatShading: THREE.FlatShading,
    });
  
    var num_text = "000";
    var beat_text = "Beat!";
    var loader = new THREE.FontLoader();
  
    loader.load("font/helvetiker_regular.typeface.json", function (response) {
      // var fontConfig_score = {
      //   font: response,
      //   size: 0.15,
      //   height: 0.1,
      // };
      // var fontConfig_combo = {
      //   font: response,
      //   size: 0.25,
      //   height: 0.1,
      // };
      var fontConfig_beat = {
        font: response,
        size: 0.4,
        height: 0.1,
      };
  
      // //score num
      // var fontGeo_score = new THREE.TextGeometry(
      //   score.toString(),
      //   fontConfig_score
      // );
      // fontGeo_score.computeBoundingBox();
      // var font_score = new THREE.Mesh(fontGeo_score, material_score);
      // font_score.position.set(-2.3, 3.2, 0.2);
      // smoothedRoot_drum.add(font_score);
      // //combo num
      // var fontGeo_combo = new THREE.TextGeometry(
      //   combo.toString(),
      //   fontConfig_combo
      // );
      // fontGeo_combo.computeBoundingBox();
      // var font_combo = new THREE.Mesh(fontGeo_combo, material_num);
      // font_combo.position.set(-2.2, 2.9, 0.2);
      // smoothedRoot_drum.add(font_combo);
      //beat
      var fontGeo_beat = new THREE.TextGeometry(beat_text, fontConfig_beat);
      fontGeo_beat.computeBoundingBox();
      font_beat = new THREE.Mesh(fontGeo_beat, material_num);
      font_beat.position.set(-2, 1.5, 0.2);
      font_beat.rotation.set(0, 0, (Math.PI / 180) * 30);
      font_beat.visible = false;
      smoothedRoot_drum.add(font_beat);
    });
  
    //   let score_text = new THREE.TextSprite({
    //     text: "test",
    //     fontFamily: "Arial, Helvetica, sans-serif",
    //     fontSize: 30,
    //     color: Colors.red,
    //   });
    //   score_text.position.set(-2, 0, 0.3);
    //   smoothedRoot_drum.add(score_text);
    //  var num = new THREE.Mesh(geometry, material_num);
  
    //  num.position.set(-1.8, 0, 0.1);
  
    target.position.set(-1.5, 0, 0.1);
    target.rotation.set((Math.PI / 180) * 90, 0, 0);
  
    plate1.castShadow = true;
    plate1.receiveShadow = true;
    target.castShadow = true;
    target.receiveShadow = true;
    this.mesh.add(plate1);
    this.mesh.add(target);
  
    //  this.mesh.add(num);
  };
  
  function createDrum() {
    drum = new Drum();
    drum.mesh.position.y = 0;
    smoothedRoot_drum.add(drum.mesh);
  }
  
  function createHammer() {
    hammer = new Hammer();
    hammer.mesh.position.y = 0;
    smoothedRoot_ham.add(hammer.mesh);
  }
  
  function createPlate() {
    plate = new Plate();
    plate.mesh.position.y = 3;
    smoothedRoot_drum.add(plate.mesh);
  }
  
  function createText() {
    var canvas1 = document.createElement("canvas");
    var context = canvas1.getContext("2d");
    //context1.fillRect(50, 50, 100, 100);
    context.clearRect(0, 0, canvas1.width, canvas1.height);
  
    context.fillStyle = "rgba(44, 62, 80, 0.5)";
  
    context.fillRect(0, 0, canvas1.width, canvas1.height);
  
    context.textAlign = "start";
  
    context.font = "Bold 50px Microsoft YaHei";
  
    context.fillStyle = "rgba(255, 255, 255, 1.0)";
    context.fillText("Hello, world!", 10, 50);
  
    canvas1.setAttribute("width", 2);
    canvas1.setAttribute("height", 2);
  
    var texture1 = new THREE.CanvasTexture(canvas1);
  
    var material1 = new THREE.MeshBasicMaterial({
      map: texture1,
      //transparent: true,
      // side: THREE.DoubleSide,
    });
    //material1.transparent = true;
    var mesh1 = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(canvas1.width, canvas1.height),
      material1
    );
    texture1.needsUpdate = true;
    mesh1.name = "test_Text";
    mesh1.castShadow = true;
    mesh1.receiveShadow = true;
    mesh1.position.set(-1, 2, 0.3);
    smoothedRoot_drum.add(mesh1);
  }
  
  function createButton_start() {
    button_start = new Button_start();
    button_start.mesh.position.y = 1.5;
    //button_start.mesh.position.z = 1;
    smoothedRoot_drum.add(button_start.mesh);
  }
  
  function createChips() {
    chipHolder = new ChipHolder();
    smoothedRoot_ham.add(chipHolder.mesh);
  }
  
  function createDong() {
    dongHolder = new DongHolder();
    smoothedRoot_drum.add(dongHolder.mesh);
  }
  
  function detectDrum_Ham(smoothedRoot_drum, smoothedRoot_ham) {
    if (
      distance_x < drum_sideLen / 2 + ham_len / 2 &&
      distance_y < drum_sideLen / 2 + ham_sideLen / 2 &&
      distance_z < drum_sideLen / 2 + ham_sideLen / 2
    ) {
      return true;
    } else {
      return false;
    }
  }
  
  function detectBtnS_Ham() {
    distance_x = Math.abs(
      smoothedRoot_drum.position.x +
        button_start.mesh.position.x -
        smoothedRoot_ham.position.x
    );
    distance_y = Math.abs(
      smoothedRoot_drum.position.y +
        button_start.mesh.position.y -
        smoothedRoot_ham.position.y
    );
    distance_z = Math.abs(
      smoothedRoot_drum.position.z +
        button_start.mesh.position.z -
        smoothedRoot_ham.position.z
    );
  
    if (
      distance_x < btnS_x / 2 + ham_len / 2 &&
      distance_y < btnS_y / 2 + ham_sideLen / 2 &&
      distance_z < btnS_z / 2 + ham_sideLen / 2
    ) {
      return true;
    } else {
      return false;
    }
  }
  
  function update() {
    distance_x = Math.abs(
      smoothedRoot_drum.position.x - smoothedRoot_ham.position.x
    );
    distance_y = Math.abs(
      smoothedRoot_drum.position.y - smoothedRoot_ham.position.y
    );
    distance_z = Math.abs(
      smoothedRoot_drum.position.z - smoothedRoot_ham.position.z
    );
  
    if (markerControls1.object3d.visible && markerControls2.object3d.visible) {
      if (detectDrum_Ham(smoothedRoot_drum, smoothedRoot_ham)) {
        beat += 1;
        console.log("Bingo!");
        if (beat == 1) {
          chipHolder.spawnChip(smoothedRoot_ham.position, 1);
        }
        if (inTarget > 0) {
          console.log("get point!");
          score += 1;
          combo += 1;
        } else {
          combo = 0;
        }
      } else {
        beat = 0;
      }
  
      if (detectBtnS_Ham()) {
        button_start.transform();
      }
    }
  
    // update artoolkit on every frame
    if (arToolkitSource.ready !== false)
      //source is image/video/webcam
      arToolkitContext.update(arToolkitSource.domElement);
    smoothedControls_drum.update(markerRoot1);
    smoothedControls_ham.update(markerRoot2);
  }
  
  function render() {
    //scene.scale.set(0.5, 0.5, 0.5);
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
    newTime = new Date().getTime();
    deltaTime = newTime - oldTime;
    oldTime = newTime;
    //console.log("delta time is ", deltaTime);
    document.addEventListener("mousemove", handleMouseMove, false);
    requestAnimationFrame(animate);
    //   deltaTime = clock.getDelta();
    //   totalTime += deltaTime;
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
  