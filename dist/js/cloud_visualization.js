"use strict";

//Set Up Variables
var container = void 0,
    stats = void 0;
var camera = void 0,
    scene = void 0,
    renderer = void 0;
var maxParticleCount = 300;
var r = 200;
var rHalf = r / 2;
var offset = 100;
//Group Variables
var particles_counts = [];
var particles_point_clouds = []; //Particles geometries for characters
var particles_positions = []; //to get and update positions for particles
var particles_data = []; //to store speed connections and maybe other things for runtime
var clouds_points_connections = []; //Line geometries for characters
var lines_positions = []; //to get and update positions for lines
var lines_colors = []; //to get and update colors alpha for lines
var character_groups = []; //Groups collectives for easy manipulation

//Main Loop
init();
animate();

//Index is for applying offset to display on screen
function get_character(query_info, index) {
    console.log("Start Getting character from database");
    var character_query = "";
    if (query_info.use_name) {
        character_query = 'http://localhost:3000/api/characters/name/' + query_info.name;
    } else {
        character_query = 'http://localhost:3000/api/characters/id/' + query_info.id;
    }
    "use strict";
    var flattend_particle_positions = void 0;
    var particleCount = void 0;
    var current_group = void 0;
    var linePositions = void 0;
    var lineColors = void 0;
    var linesMesh = void 0;
    var particles = void 0;
    var particlePositions = void 0;
    var particlesData = [];
    var pointCloud = void 0; //current point cloud for the character

    var request = new XMLHttpRequest();
    request.open('GET', character_query, false); // `false` makes the request synchronous
    request.send(null);

    if (request.status === 200) {
        flattend_particle_positions = JSON.parse(request.responseText).data.inks;
    }

    particleCount = flattend_particle_positions.length / 3;
    particles_counts.push(particleCount);

    current_group = new THREE.Group();
    scene.add(current_group);

    var segments = maxParticleCount * maxParticleCount;

    linePositions = new Float32Array(segments * 3);
    lineColors = new Float32Array(segments * 3);

    var pMaterial = new THREE.PointsMaterial({
        color: 0x000000,
        size: 3,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
    });

    particles = new THREE.BufferGeometry();
    // Previously it is the maxParticleCount
    particlePositions = new Float32Array(particleCount * 3);

    // Previously it is the max particle count
    for (var i = 0; i < particleCount; i++) {

        //TODO: Modify the server side to account for parametric difference
        var y = 100 - flattend_particle_positions[i * 3];
        var x = flattend_particle_positions[i * 3 + 1] + index * offset;
        var z = flattend_particle_positions[i * 3 + 2];
        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;
    }
    particles_positions.push(particlePositions);

    for (var _i = 0; _i < particleCount; _i++) {
        particlesData.push({
            // velocity: new THREE.Vector3( -1 + Math.random() * 2, -1 + Math.random() * 2,  -1 + Math.random() * 2 ),
            // velocity: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(0, 0, (-1 + Math.random() * 2) * 0.2),
            numConnections: 0
        });
    }
    particles_data.push(particlesData);

    particles.setDrawRange(0, particleCount);
    particles.addAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setDynamic(true));
    particles.computeBoundingSphere();
    // create the particle system
    pointCloud = new THREE.Points(particles, pMaterial);
    particles_point_clouds.push(pointCloud);
    current_group.add(pointCloud);
    // let  axesHelper = new THREE.AxesHelper( 100 );
    // group.add( axesHelper );

    lines_positions.push(linePositions);
    lines_colors.push(lineColors);
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(linePositions, 3).setDynamic(true));
    geometry.addAttribute('color', new THREE.BufferAttribute(lineColors, 3).setDynamic(true));
    geometry.computeBoundingSphere();
    geometry.setDrawRange(0, 0);
    var material = new THREE.LineBasicMaterial({
        vertexColors: THREE.VertexColors,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    linesMesh = new THREE.LineSegments(geometry, material);
    clouds_points_connections.push(linesMesh);
    current_group.add(linesMesh);
    character_groups.push(current_group);
}

//Helper function for animation
function update_character(index) {
    "use strict";

    var vertexpos = 0;
    var colorpos = 0;
    var numConnected = 0;
    var particlesData = particles_data[index];
    var particlePositions = particles_positions[index];
    var linePositions = lines_positions[index];
    var lineColors = lines_colors[index];
    var particleCount = particles_counts[index];

    for (var i = 0; i < particleCount; i++) {
        particlesData[i].numConnections = 0;
    }for (var _i2 = 0; _i2 < particleCount; _i2++) {

        // get the particle
        var particleData = particlesData[_i2];

        particlePositions[_i2 * 3] += particleData.velocity.x;
        particlePositions[_i2 * 3 + 1] += particleData.velocity.y;
        particlePositions[_i2 * 3 + 2] += particleData.velocity.z;

        if (particlePositions[_i2 * 3 + 1] < -rHalf || particlePositions[_i2 * 3 + 1] - index * offset > rHalf) particleData.velocity.y = -particleData.velocity.y;

        if (particlePositions[_i2 * 3] - index * offset < -rHalf || particlePositions[_i2 * 3] - index * offset > rHalf) particleData.velocity.x = -particleData.velocity.x;

        if (particlePositions[_i2 * 3 + 2] < -rHalf || particlePositions[_i2 * 3 + 2] > rHalf) particleData.velocity.z = -particleData.velocity.z;

        // Check collision
        for (var j = _i2 + 1; j < particleCount; j++) {

            var particleDataB = particlesData[j];

            var dx = particlePositions[_i2 * 3] - particlePositions[j * 3];
            var dy = particlePositions[_i2 * 3 + 1] - particlePositions[j * 3 + 1];
            var dz = particlePositions[_i2 * 3 + 2] - particlePositions[j * 3 + 2];
            var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            var threshold = 15;
            if (dist < threshold) {

                particleData.numConnections++;
                particleDataB.numConnections++;

                var alpha = 1.0 - dist / threshold;

                linePositions[vertexpos++] = particlePositions[_i2 * 3];
                linePositions[vertexpos++] = particlePositions[_i2 * 3 + 1];
                linePositions[vertexpos++] = particlePositions[_i2 * 3 + 2];

                linePositions[vertexpos++] = particlePositions[j * 3];
                linePositions[vertexpos++] = particlePositions[j * 3 + 1];
                linePositions[vertexpos++] = particlePositions[j * 3 + 2];

                lineColors[colorpos++] = alpha;
                lineColors[colorpos++] = alpha;
                lineColors[colorpos++] = alpha;

                lineColors[colorpos++] = alpha;
                lineColors[colorpos++] = alpha;
                lineColors[colorpos++] = alpha;

                numConnected++;
            }
        }
    }
    clouds_points_connections[index].geometry.setDrawRange(0, numConnected * 2);
    clouds_points_connections[index].geometry.attributes.position.needsUpdate = true;
    clouds_points_connections[index].geometry.attributes.color.needsUpdate = true;
    particles_point_clouds[index].geometry.attributes.position.needsUpdate = true;
}

function init() {
    container = document.getElementById('container');
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 4000);
    // camera.position.z = 1750;
    camera.position.z = 500;

    var controls = new THREE.OrbitControls(camera, container);

    scene = new THREE.Scene();
    for (var i = 169; i < 176; i++) {
        var query_info = { use_name: false, name: "", id: i };
        get_character(query_info, i - 169);
    }

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    container.appendChild(renderer.domElement);

    stats = new Stats();
    container.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    for (var i = 0; i < 7; i++) {
        update_character(i);
    }
    requestAnimationFrame(animate);
    stats.update();
    render();
}

function render() {

    var time = Date.now() * 0.001;

    // group.rotation.y = time * 0.1;
    renderer.render(scene, camera);
}
//# sourceMappingURL=cloud_visualization.js.map