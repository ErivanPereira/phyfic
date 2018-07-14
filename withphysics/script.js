var world;
var fixedTimeStep = 1 / 60;
var maxSubSteps = 3;
var mass = 50;
var lastTime;

var camera, scene, renderer, controls;
var geometry, material, mesh;
var container, camera, scene, renderer, cannonDebugRenderer;
var materialPhysics;
// To be synced
var meshes = [];
var bodies = [];

// if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

initCannon();
initThree();
addPlane();
animate();

function initThree() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x000000, 500, 10000 );

    // camera
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.5, 10000 );
    camera.position.set(0, 3, 20);
    camera.up.set(0,1,0);
    camera.lookAt(new THREE.Vector3(0,0,0));
    scene.add(camera);

    material = new THREE.MeshLambertMaterial( { color: 0x777777 } );

    // lights
    scene.add( new THREE.AmbientLight( 0x111111 ) );
    var light = new THREE.DirectionalLight( 0xffffff, 1.75 );
    var d = 20;
    light.position.set( 40, 20, 30 );
    scene.add( light );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( scene.fog.color );

    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );

    // controls = new THREE.TrackballControls( camera, renderer.domElement );

    cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world);
    keyboard = new THREEx.KeyboardState();

    addBox(0, 5, 0, 0.5, 1, 0.5);

    area = [[1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1]];

    for(var i=0;i<8;i++){
        for(var j=0;j<8;j++){
            if(area[j][i] == 1){
                addBox(i-4, 5, j-4, 1, 1, 1);
            }
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    // controls.screen.width = window.innerWidth;
    // controls.screen.height = window.innerHeight;
}

var ang = 0;
var aux = 0;

function animate(time) {
    requestAnimationFrame( animate );

    if(time && lastTime){
        var dt = time - lastTime;
        world.step(fixedTimeStep, dt / 1000, maxSubSteps);
    }

    updateMeshPositions();
    cannonDebugRenderer.update();
    // controls.update();
    var relativeCameraOffset = new THREE.Vector3(0,10,-10);
    var cameraOffset = relativeCameraOffset.applyMatrix4( meshes[0].matrixWorld );

    camera.position.x = cameraOffset.x;
    camera.position.y = cameraOffset.y;
    camera.position.z = cameraOffset.z;
    camera.lookAt(meshes[0].position);
    
    if ( keyboard.pressed("up")   )  bodies[0].velocity.set( Math.sin(ang) *  4 , bodies[0].velocity.y, Math.cos(ang) *  4 );
    if ( keyboard.pressed("down") )  bodies[0].velocity.set( Math.sin(ang) * -4 , bodies[0].velocity.y, Math.cos(ang) * -4 );
    if ( keyboard.pressed("left") ){
        ang -= 0.1;
        bodies[0].quaternion.setFromEuler(0, ang, 0);
    }
    if ( keyboard.pressed("right")){
        ang += 0.1;
        bodies[0].quaternion.setFromEuler(0, ang, 0);
    }
    if ( keyboard.pressed("space") && check() )  bodies[0].velocity.set( bodies[0].velocity.x , 4, bodies[0].velocity.z );

    renderer.render(scene, camera);
    lastTime = time;
}

function check(){
    for(var i=0; i<world.contacts.length; i++){
        var c = world.contacts[i];
        if(c.bi === bodies[0] || c.bj === bodies[0]){
            return true;
        }
    }
    return false;
}

function updateMeshPositions(){
    for(var i=0; i !== meshes.length; i++){
        meshes[i].position.copy(bodies[i].position);
        meshes[i].quaternion.copy(bodies[i].quaternion);
    }
}

function initCannon(){
    world = new CANNON.World();
    world.gravity.set(0,-10,0);
    world.broadphase = new CANNON.NaiveBroadphase();
}

function addPlane(){
    // Physics
    var shape = new CANNON.Plane();
    var body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    world.addBody(body);
    bodies.push(body);

    // Graphics
    geometry = new THREE.PlaneGeometry( 10, 10, 1, 1 );
    mesh = new THREE.Mesh( geometry, material );
    mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI / 2);
    scene.add(mesh);
    meshes.push(mesh);
}

function addBox(x,y,z,l,a,c){
    // Physics
    var shape = new CANNON.Box(new CANNON.Vec3(l/2,a/2,c/2));
    var body = new CANNON.Body({ mass: mass , fixedRotation: true });
    body.addShape(shape);
    body.position.set(x,y,z);
    world.addBody(body);
    bodies.push(body);

    // Graphics
    var cubeGeo = new THREE.BoxGeometry( l, a, c, 10, 10 );
    cubeMesh = new THREE.Mesh(cubeGeo, material);
    meshes.push(cubeMesh);
    scene.add(cubeMesh);
}

function addSphere(){
    // Physics
    var body = new CANNON.Body({ mass: mass , fixedRotation: true });
    var shape = new CANNON.Sphere(0.5);
    body.addShape(shape);
    body.position.set(-1,5,0);
    world.addBody(body);
    bodies.push(body);

    // Graphics
    var sphereGeo = new THREE.SphereGeometry(0.5, 20, 20);
    sphereMesh = new THREE.Mesh(sphereGeo, material);
    meshes.push(sphereMesh);
    scene.add(sphereMesh);
}