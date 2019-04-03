//TODO: Experiment with Asynchronous call
//TODO: Convert all things to local coordinates using class
//TODO: Add User interactions
//TODO: Add Image Particles
//TODO: Camera Movements
//TODO: Make Separate Modules
//TODO: Load Separate Textures on the particles <- this shit looks whack af
//TODO: Input Validation
//TODO: Create Slider to control offset and other variables for experimentation
//Set Up Variables
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
let total_characters = 4;
//Development variable
let drawline = true;

//Main Loop
init();
animate();
document.addEventListener("keydown", onDocumentKeyDown, false);


function onDocumentKeyDown(event){
    let key_code = event.which;
    if (key_code === 82){
        reset_scene();
    }
    //Get Input From User
    if (key_code === 13){
        let characters = document.getElementById("characters_input").value;
        console.log(characters);
        if (characters.length > 0){
            reset_scene();
            for (let i=0; i<characters.length; i++){
                let query_info= {use_name: true, name: characters[i], id: i};
                get_character(query_info, i);
            }
            document.getElementById("characters_input").value = "";
            total_characters = characters.length;
        }
    }
}

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
    container = document.getElementById( 'container' );
    camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 4000 );
    // camera.position.z = 1750;
    camera.position.z = 500;

    let controls = new THREE.OrbitControls( camera, container );

    scene = new THREE.Scene();
    // for (let i=169; i<173; i++){
    //     let query_info= {use_name: false, name: "", id: i};
    //     get_character(query_info, i-169);
    // }
    let query_info= {use_name: true, name: "喜", id: ""};
    get_character(query_info, 0);
    query_info= {use_name: true, name: "欢", id: ""};
    get_character(query_info, 1);
    query_info= {use_name: true, name: "养", id: ""};
    get_character(query_info, 2);
    query_info= {use_name: true, name: "狗", id: ""};
    get_character(query_info, 3);


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
    // update_character(0);
    requestAnimationFrame( animate );
    stats.update();
    render();
}

function render() {

    let time = Date.now() * 0.001;

    // group.rotation.y = time * 0.1;
    renderer.render( scene, camera );

}

