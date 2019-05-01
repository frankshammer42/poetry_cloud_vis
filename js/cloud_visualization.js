//TODO: Add User interactions
//TODO: Add Image Particles
//TODO: Add Character References
//Set Up Variables----------------------------------------------------------------------
let container, stats;
let camera, scene, renderer;
let maxParticleCount = 300;
let r = 500;
let rHalf = r / 2;
let offset = 50;
//Group Variables
let particles_counts = [];
let particles_point_clouds = []; //Particles geometries for characters
let particles_positions = []; //to get and update positions for particles
let particles_data = []; //to store speed connections and maybe other things for runtime
let clouds_points_connections = []; //Line geometries for characters
let lines_positions = []; //to get and update positions for lines
let lines_colors = []; //to get and update colors alpha for lines
let character_groups = []; //Groups collectives for easy manipulation
//Store data related to user input
let total_characters = 3;
//Development variable
let drawline = true;
let debug_start_num = 20;
//User Control Variable---------------------------------------------------------------
let raycaster;
let mouse;
let characters_in_scene = [];
let current_character_index_to_control = null;


//Main Loop------------------------------------------------------
init();
animate();
document.addEventListener("keydown", onDocumentKeyDown, false);
document.addEventListener("mousemove", onMouseMove, false);


//Event Related Functions----------------------------------------------------------------
function onDocumentKeyDown(event){
    let key_code = event.which;
    if (key_code === 32){
        reset_scene();
    }
    //Get Input From User
    if (key_code === 13){
        let characters = document.getElementById("characters_input").value;
        console.log(characters);
        if (characters.length >= 0){
            // reset_scene();
            for (let i=0; i<characters.length; i++){
                let query_info= {use_name: true, name: characters[i], id: i};
                get_character(query_info, i);
            }
            document.getElementById("characters_input").value = "";
            total_characters += characters.length;
        }
    }
}

function onMouseMove(event){
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}

function submitTransform() {
    let position_x = extractNumber(document.getElementById("position_x").value);
    let position_y = extractNumber(document.getElementById("position_y").value);
    let position_z = extractNumber(document.getElementById("position_z").value);
    let rotation_x = extractNumber(document.getElementById("rotation_x").value);
    let rotation_y = extractNumber(document.getElementById("rotation_y").value);
    let rotation_z = extractNumber(document.getElementById("rotation_z").value);
    document.getElementById("position_x").value = "";
    document.getElementById("position_y").value = "";
    document.getElementById("position_z").value = "";
    document.getElementById("rotation_x").value = "";
    document.getElementById("rotation_y").value = "";
    document.getElementById("rotation_z").value = "";
    if (current_character_index_to_control !== null){
        character_groups[current_character_index_to_control].position.x = position_x;
        character_groups[current_character_index_to_control].position.y = position_y;
        character_groups[current_character_index_to_control].position.z = position_z;
        character_groups[current_character_index_to_control].rotation.x = rotation_x;
        character_groups[current_character_index_to_control].rotation.y = rotation_y;
        character_groups[current_character_index_to_control].rotation.z = rotation_z;
    }
}

function extractNumber(input){
    let result = parseFloat(input);
    if (isNaN(result)){
        return 0;
    }
    else{
        return result;
    }
}
//-------------------------------------------------------------------------------------------------------

function reset_scene(){
    console.log("Reset the Scene");
    for( let i = scene.children.length - 1; i >= 0; i--) {
        let obj = scene.children[i];
        scene.remove(obj);
    }
    //Reset all the global variables
    particles_counts = [];
    particles_point_clouds = [];
    particles_positions = [];
    particles_data = [];
    clouds_points_connections = [];
    lines_positions = [];
    lines_colors = [];
    character_groups = [];
    total_characters = 0;
    characters_in_scene = [];
}

//Index is for applying offset to display on screen
function get_character(query_info, index){
    console.log("Start Getting character from database");
    let character_query = "";
    if (query_info.use_name){
        character_query = 'https://poetrycloud.herokuapp.com/api/characters/name/'+ query_info.name;
    }
    else{
        character_query = 'https://poetrycloud.herokuapp.com/api/characters/id/'+ query_info.id;
    }
    "use strict";
    let flattend_particle_positions;
    let particleCount;
    let current_group;
    let linePositions;
    let lineColors;
    let linesMesh;
    let particles;
    let particlePositions;
    let particlesData = [];
    let pointCloud; //current point cloud for the character

    let request = new XMLHttpRequest();
    request.open('GET', character_query, false);  // `false` makes the request synchronous
    request.send(null);
    console.log(JSON.parse(request.responseText).data.name);
    if (request.status === 200) {
        flattend_particle_positions = JSON.parse(request.responseText).data.inks;
        if (query_info.use_name){
            characters_in_scene.push(query_info.name);
        }
    }

    particleCount = flattend_particle_positions.length / 3;
    particles_counts.push(particleCount);

    current_group = new THREE.Group();
    scene.add( current_group );

    let segments = maxParticleCount * maxParticleCount;

    linePositions = new Float32Array( segments * 3 );
    lineColors = new Float32Array( segments * 3 );

    let pMaterial = new THREE.PointsMaterial( {
        color: 0xffffff,
        size: 3,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
    } );

    let step = 1;
    particles = new THREE.BufferGeometry();
    // Previously it is the maxParticleCount
    particlePositions = new Float32Array( particleCount * 3  );


    // Previously it is the max particle count
    let dir_list = [-1, 1];
    let random_y_offset = Math.floor(Math.random()*200);
    let dir = dir_list[Math.floor(Math.random()*2)];
    for ( let i = 0; i < particleCount; i+=step) {

        //TODO: Modify the server side to account for parametric difference
        let y = 100 - flattend_particle_positions[i * 3] + dir*random_y_offset;
        let x = flattend_particle_positions[i * 3 + 1] + index*offset;
        // let z = flattend_particle_positions[i * 3 + 2];
        // let z = Math.floor(Math.random()*2);
        let z = 0;
        particlePositions[ i * 3     ] = x;
        particlePositions[ i * 3 + 1 ] = y;
        particlePositions[ i * 3 + 2 ] = z;
    }
    particles_positions.push(particlePositions);


    let shape_holder_efficient = 10;
    let vel_scale = 2;
    for (let i=0; i < particleCount; i++){
        let dir = dir_list[Math.floor(Math.random()*2)];
        if (i%shape_holder_efficient === 0){
            let vel = new THREE.Vector3(dir*(Math.random() * vel_scale) * 0.1, dir*(Math.random() * vel_scale) * 0.1,  dir*(Math.random() * vel_scale) * 0.1);
            // console.log(vel);
            particlesData.push( {
                // velocity: new THREE.Vector3( -1 + Math.random() * 2, -1 + Math.random() * 2,  -1 + Math.random() * 2 ),
                // velocity: new THREE.Vector3(0, 0, 0),
                velocity: vel,
                // velocity: new THREE.Vector3(dir*Math.floor(Math.random() * vel_scale), dir*Math.floor(Math.random() * vel_scale), dir*Math.floor(Math.random() * vel_scale)),
                // velocity: new THREE.Vector3( -1 + Math.random() * 2, -1 + Math.random() * 2,  -1 + Math.random() * 2 ),
                numConnections: 0
            } );
        }
        else{
            particlesData.push( {
                // velocity: new THREE.Vector3( -1 + Math.random() * 2, -1 + Math.random() * 2,  -1 + Math.random() * 2 ),
                // velocity: new THREE.Vector3(0, 0, 0),
                // velocity: new THREE.Vector3(dir*Math.floor(Math.random() * vel_scale), dir*Math.floor(Math.random() * vel_scale), dir*Math.floor(Math.random() * vel_scale)),
                velocity: new THREE.Vector3(0,0,dir*(Math.random() * vel_scale) * 0.5),
                numConnections: 0
            } );
        }
    }
    particles_data.push(particlesData);


    particles.setDrawRange( 0, particleCount);
    particles.addAttribute( 'position', new THREE.BufferAttribute(particlePositions, 3 ).setDynamic( true ) );
    particles.computeBoundingSphere();
    // create the particle system
    pointCloud = new THREE.Points( particles, pMaterial );
    particles_point_clouds.push(pointCloud);
    current_group.add( pointCloud );
    // let  axesHelper = new THREE.AxesHelper( 100 );
    // group.add( axesHelper );

    lines_positions.push(linePositions);
    lines_colors.push(lineColors);
    let geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( linePositions, 3 ).setDynamic( true ) );
    geometry.addAttribute( 'color', new THREE.BufferAttribute( lineColors, 3 ).setDynamic( true ) );
    geometry.computeBoundingSphere();
    geometry.setDrawRange( 0, 0 );
    let material = new THREE.LineBasicMaterial( {
        vertexColors: THREE.VertexColors,
        blending: THREE.AdditiveBlending,
        transparent: true
    } );
    if (drawline){
        linesMesh = new THREE.LineSegments( geometry, material );
        clouds_points_connections.push(linesMesh);
        current_group.add(linesMesh);
    }
    // current_group.rotation.x = Math.floor(Math.random() * 5);
    current_group.rotation.y = Math.floor(Math.random() * 5);
    // current_group.rotation.z = Math.floor(Math.random() * 5);
    character_groups.push(current_group);
}

//Helper function for animation
function update_character(index){
    "use strict";
    let vertexpos = 0;
    let colorpos = 0;
    let numConnected = 0;
    let particlesData = particles_data[index];
    let particlePositions = particles_positions[index];
    let linePositions = lines_positions[index];
    let lineColors = lines_colors[index];
    let particleCount = particles_counts[index];


    for ( let i = 0; i < particleCount; i++ )
        particlesData[ i ].numConnections = 0;

    for ( let i = 0; i < particleCount; i++ ) {

        // get the particle
        let particleData = particlesData[i];

        particlePositions[ i * 3     ] += particleData.velocity.x;
        particlePositions[ i * 3 + 1 ] += particleData.velocity.y;
        particlePositions[ i * 3 + 2 ] += particleData.velocity.z;

        let bounding_efficient = 3;
        if ( particlePositions[ i * 3 ] - offset*i < -rHalf/bounding_efficient || particlePositions[ i * 3 ] - offset*i> rHalf/bounding_efficient )
            particleData.velocity.x = -particleData.velocity.x;

        if ( particlePositions[ i * 3 + 1 ] < -rHalf/bounding_efficient || particlePositions[ i * 3 + 1 ] > rHalf/bounding_efficient)
            particleData.velocity.y = -particleData.velocity.y;

        if ( particlePositions[ i * 3 + 2 ]  < -rHalf/bounding_efficient || particlePositions[ i * 3 + 2 ]  > rHalf/bounding_efficient)
            particleData.velocity.z = -particleData.velocity.z;


        // Check collision
        for ( let j = i + 1; j < particleCount; j++ ) {

            let particleDataB = particlesData[ j ];

            let dx = particlePositions[ i * 3     ] - particlePositions[ j * 3     ];
            let dy = particlePositions[ i * 3 + 1 ] - particlePositions[ j * 3 + 1 ];
            let dz = particlePositions[ i * 3 + 2 ] - particlePositions[ j * 3 + 2 ];
            let dist = Math.sqrt( dx * dx + dy * dy + dz * dz );

            let threshold = 10;
            if ( dist < threshold) {

                particleData.numConnections++;
                particleDataB.numConnections++;

                let alpha = 1.0 - (dist / threshold);

                linePositions[ vertexpos++ ] = particlePositions[ i * 3     ];
                linePositions[ vertexpos++ ] = particlePositions[ i * 3 + 1 ];
                linePositions[ vertexpos++ ] = particlePositions[ i * 3 + 2 ];

                linePositions[ vertexpos++ ] = particlePositions[ j * 3     ];
                linePositions[ vertexpos++ ] = particlePositions[ j * 3 + 1 ];
                linePositions[ vertexpos++ ] = particlePositions[ j * 3 + 2 ];

                lineColors[ colorpos++ ] = alpha;
                lineColors[ colorpos++ ] = alpha;
                lineColors[ colorpos++ ] = alpha;

                lineColors[ colorpos++ ] = alpha;
                lineColors[ colorpos++ ] = alpha;
                lineColors[ colorpos++ ] = alpha;

                numConnected++;
            }
        }
    }
    if (drawline){
        clouds_points_connections[index].geometry.setDrawRange( 0, numConnected * 2 );
        clouds_points_connections[index].geometry.attributes.position.needsUpdate = true;
        clouds_points_connections[index].geometry.attributes.color.needsUpdate = true;
    }
    particles_point_clouds[index].geometry.attributes.position.needsUpdate = true;

}

function init() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    container = document.getElementById( 'container' );
    camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 4000 );
    // camera.position.z = 1750;
    camera.position.z = 500;

    let controls = new THREE.OrbitControls( camera, container );

    scene = new THREE.Scene();
    // for (let i=debug_start_num; i<20+total_characters; i++){
    //     let query_info= {use_name: false, name: "", id: i};
    //     get_character(query_info, i-debug_start_num);
    // }
    let query_info= {use_name: true, name: "旺", id: ""};
    get_character(query_info, 0);
    query_info= {use_name: true, name: "天", id: ""};
    get_character(query_info, 1);
    query_info= {use_name: true, name: "下", id: ""};
    get_character(query_info, 2);

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    container.appendChild( renderer.domElement );

    stats = new Stats();
    container.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    for (let i=0; i<total_characters; i++){
        update_character(i);
    }
    requestAnimationFrame( animate );
    stats.update();
    render();
}

function render() {
    if (character_groups.length > 0){
        raycaster.setFromCamera( mouse, camera );
        for (let i=0; i<character_groups.length; i++){
            let intersects = raycaster.intersectObjects(character_groups[i].children, true);
            if (intersects.length > 0){
                document.getElementById("zi_info").textContent = "Control Transform of " + characters_in_scene[i];
                document.getElementById("zi_x_position").textContent = character_groups[i].position.x;
                document.getElementById("zi_y_position").textContent = character_groups[i].position.y;
                document.getElementById("zi_z_position").textContent = character_groups[i].position.z;
                document.getElementById("zi_x_rotation").textContent = character_groups[i].rotation.x;
                document.getElementById("zi_y_rotation").textContent = character_groups[i].rotation.y;
                document.getElementById("zi_z_rotation").textContent = character_groups[i].rotation.z;
                current_character_index_to_control = i;
            }
        }
    }
    let time = Date.now() * 0.001;
    // group.rotation.y = time * 0.1;
    renderer.render( scene, camera );
}

