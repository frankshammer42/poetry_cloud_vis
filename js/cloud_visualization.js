//TODO: Turn down particle speed
//TODO: Add Modal Image
//TODO: Need to add user input guides
//TODO: Don't Allow user to move camera when in progress

/*
Press R to Reset the Scene
Press Space to Move to next character
 */

//Set Up Variables----------------------------------------------------------------------
let container, stats;
let camera, scene, renderer;
let maxParticleCount = 300;
let r = 800;
let rHalf = r / 2;
let imgr = 20;
let imgRhalf = imgr/2;
let offset = 100; //Space between characters
//Group Variables
let particles_counts = [];
let particles_point_clouds = []; //Particles geometries for characters
let particles_positions = []; //to get and update positions for particles
let particles_data = []; //to store speed connections and maybe other things for runtime
let clouds_points_connections = []; //Line geometries for characters
let lines_positions = []; //to get and update positions for lines
let lines_colors = []; //to get and update colors alpha for lines
let character_groups = []; //Groups collectives for easy manipulation
//Store data related to user input----------------------------------------------------
let total_characters = 3;
//Development variable
let drawline = true;
let debug_start_num = 20;
let randome_position = false;
let cameraMovementTestTarget = new THREE.Vector3(40, 50 ,60);
//User Control Variable---------------------------------------------------------------
let raycaster;
let mouse;
let characters_in_scene = [];
let current_character_index_to_control = null;
let controls;
//Variable for Image------------------------------------------------------------------
let img_color_raw_data = "";
let img_particle_count = 0;
let img_particles_positions = [];
let img_particles_colors = [];
let img_particles_update_positions = [];
let img_lines_positions;
let img_lines_colors;
let img_line_mesh;
let img_point_cloud;
let img_data = []; //Store Velocity or other attributes related to the movements
let img_group;
//Camera Movement Tween Variable
let cameraPositionTween;
let cameraLookAtTween;
let cameraMovmentTime = 4000;
let characterIndexToMove = 0;
let prevCharacterIndexToMove = 0; //To Make a whole trip
let indexMapToArrayIndex = {};
//Trip Variable
let allTheWords = ["我爷爷", "在南方", "父亲", "一百分", "不一样"];
let currentTripProgress =  0;
let currentOffset = 0;
//Background Variable
let backgroundMesh;
let backgroundScene;
let backgroundCamera;



//Main Loop------------------------------------------------------
init();
animate();
document.addEventListener("keydown", onDocumentKeyDown, false);
document.addEventListener("mousemove", onMouseMove, false);
document.addEventListener("click", onMouseClick, false);


//Event Related Functions----------------------------------------------------------------
function onDocumentKeyDown(event){
    let key_code = event.which;
    if (key_code === 82){
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
                get_character(query_info, total_characters, 0);
            }
            document.getElementById("characters_input").value = "";
            total_characters += characters.length;
            console.log(total_characters);
        }
    }
    if (key_code === 32){
        if (character_groups.length === total_characters){
            moveToCharacter(characterIndexToMove);
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

function onMouseClick(event){
    let x = document.getElementById("myAudio");
    x.play();
    console.log("yep");
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

//Scene Related Function-------------------------------------------------------------------------------------------------------
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
    characterIndexToMove = 0;
    indexMapToArrayIndex = {};
    prevCharacterIndexToMove = 0;
}

function get_image(){
    let img = document.getElementById('memory_image');
    let canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
    for(let i = 0; i<img.width; i++){
        for(let j=0; j<img.height; j++){
            let position_data_to_add = [j, i, 0];
            let color_data = canvas.getContext('2d').getImageData(i, j, 1, 1).data;
            let color_data_to_add = [color_data[0], color_data[1], color_data[2]];
            img_particles_positions = img_particles_positions.concat(position_data_to_add);
            img_particles_colors = img_particles_colors.concat(color_data_to_add);
        }
    }
    // Add image particles to the scene
    let particleCount;
    let linePositions;
    let lineColors;
    let linesMesh;
    let particles;
    let particlePositions;
    let particleColors;
    let pointCloud; //current point cloud for the character

    particleCount = img_particles_positions.length / 3;
    img_particle_count = particleCount;
    img_group = new THREE.Group();
    scene.add(img_group);

    let segments = maxParticleCount * maxParticleCount;

    img_lines_positions = new Float32Array( segments * 3 );
    img_lines_colors = new Float32Array( segments * 3 );

    let pMaterial = new THREE.PointsMaterial( {
        vertexColors: THREE.VertexColors,
        size: 3,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
    } );

    let step = 1;
    particles = new THREE.BufferGeometry();
    particlePositions = new Float32Array( particleCount * 3);
    particleColors = new Float32Array(particleCount * 3);

    for ( let i = 0; i < particleCount; i+=step) {

        let y = 100 - img_particles_positions[i * 3];
        let x = img_particles_positions[i * 3 + 1];
        // let z = flattend_particle_positions[i * 3 + 2];
        // let z = Math.floor(Math.random()*2);
        let peak = 10;
        particlePositions[ i * 3     ] = x - img.width/2;
        particlePositions[ i * 3 + 1 ] = y;
        particlePositions[ i * 3 + 2 ] = Math.floor(10*Math.random());
        let r = img_particles_colors[i*3]/255;
        let g = img_particles_colors[i*3+1]/255;
        let b = img_particles_colors[i*3+2]/255;
        particleColors[ i * 3     ] = r;
        particleColors[ i * 3 + 1 ] = g;
        particleColors[ i * 3 + 2 ] = b;
    }

    img_particles_update_positions = particlePositions;
    let dir_list = [1, -1];
    let shape_holder_efficient = 10;
    let vel_scale = 2;
    for (let i=0; i < particleCount; i++){
        let dir = dir_list[Math.floor(Math.random()*2)];
        img_data.push( {
            velocity: new THREE.Vector3(0,0,dir*(Math.random() * vel_scale) * 0.5),
            numConnections: 0
        } );
        // }
    }

    particles.setDrawRange( 0, particleCount);
    particles.addAttribute( 'position', new THREE.BufferAttribute(particlePositions, 3 ).setDynamic( true ) );
    particles.addAttribute( 'color', new THREE.BufferAttribute(particleColors, 3 ).setDynamic( true ) );
    particles.computeBoundingSphere();
    // create the particle system
    pointCloud = new THREE.Points( particles, pMaterial );
    img_point_cloud = pointCloud;
/*    for (let i=0; i<particleCount; i++){
        let color = THREE.Color(particleColors[i*3], particleColors[i*3+1], particleColors[i*3+2]);
        pointCloud.geometry.colors[i] = color;
    }*/
    img_group.add( pointCloud );

    let geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( img_lines_positions, 3 ).setDynamic( true ) );
    geometry.addAttribute( 'color', new THREE.BufferAttribute( img_lines_colors, 3 ).setDynamic( true ) );
    geometry.computeBoundingSphere();
    geometry.setDrawRange( 0, 0 );
    let material = new THREE.LineBasicMaterial( {
        vertexColors: THREE.VertexColors,
        blending: THREE.AdditiveBlending,
        transparent: true
    } );
    if (drawline){
        linesMesh = new THREE.LineSegments( geometry, material );
        img_line_mesh = linesMesh;
        img_group.add(linesMesh);
    }
    img_group.scale.set(2,2,2);


}

function update_image(){
    "use strict";
    // img_group.rotation.x += 0.01;
    // img_group.rotation.y += 0.01;
    // img_group.rotation.z += 0.01;
    let vertexpos = 0;
    let colorpos = 0;
    let numConnected = 0;
    let particlesData = img_data;
    let particlePositions = img_particles_update_positions;
    // let linePositions = lines_positions[index];
    // let lineColors = lines_colors[index];
    let particleCount = img_particle_count;


    for ( let i = 0; i < particleCount; i++ )
        particlesData[ i ].numConnections = 0;

    for ( let i = 0; i < particleCount; i++) {

        // get the particle
        let particleData = particlesData[i];

        particlePositions[i * 3] += particleData.velocity.x;
        particlePositions[i * 3 + 1] += particleData.velocity.y;
        particlePositions[i * 3 + 2] += particleData.velocity.z;

        let bounding_efficient = 1;
        if (particlePositions[i * 3] - offset * i < -imgRhalf / bounding_efficient || particlePositions[i * 3] - offset * i > imgRhalf / bounding_efficient)
            particleData.velocity.x = -particleData.velocity.x;

        if (particlePositions[i * 3 + 1] < -imgRhalf / bounding_efficient || particlePositions[i * 3 + 1] > imgRhalf / bounding_efficient)
            particleData.velocity.y = -particleData.velocity.y;

        if (particlePositions[i * 3 + 2] < -imgRhalf / bounding_efficient || particlePositions[i * 3 + 2] > imgRhalf / bounding_efficient)
            particleData.velocity.z = -particleData.velocity.z;
    }
    img_point_cloud.geometry.attributes.position.needsUpdate  = true;
}

//Index is for applying offset to display on screen
function get_character(query_info, index, tripOffset){
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

    // let request = new XMLHttpRequest();
    // request.open('GET', character_query, false);  // `false` makes the request synchronous
    // request.send(null);
    // console.log(JSON.parse(request.responseText).data.name);
    axios.get(character_query)
        .then(function (response) {
            // handle success
            console.log(response.data.data.name);
            flattend_particle_positions = response.data.data.inks;
            if (query_info.use_name) {
                characters_in_scene.push(query_info.name);
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
                    let y = 0;
                    y = 100 - flattend_particle_positions[i * 3];
                    // let x = flattend_particle_positions[i * 3 + 1] + index*offset;
                    let x = flattend_particle_positions[i * 3 + 1];
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
                if (randome_position){
                    // current_group.position.y += dir*random_y_offset;
                    // current_group.rotation.y = Math.floor(Math.random() * 5);
                    current_group.rotation.y = Math.PI/4;
                }
                // current_group.rotation.z = Math.floor(Math.random() * 5);
                // current_group.position.x += index*offset + tripOffset*offset;
                // current_group.position.z -= (index*offset) + tripOffset*offset;
                // current_group.position.y += (index*offset) + tripOffset*offset;
                current_group.position.x += index*offset;
                current_group.position.z -= (index*offset);
                current_group.position.y += (index*offset);
                character_groups.push(current_group);
                indexMapToArrayIndex[index] = character_groups.length - 1;
            }
        });

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
        clouds_points_connections[index].geometry.computeBoundingSphere()
    }
    particles_point_clouds[index].geometry.attributes.position.needsUpdate = true;

}

function changeSceneBackground(currentIndex){
    scene.background = null;
    let file_name = "imgs/" + currentIndex.toString() + ".jpg";
    let texture  = new THREE.TextureLoader().load(file_name);
    scene.background = texture;
}

function moveToCharacter(characterIndex){
    console.log(characterIndex);
    let arrayIndex = indexMapToArrayIndex[characterIndex];
    if (character_groups.length !== total_characters){
        return;
    }

    if (characterIndex >= total_characters){
        return;
    }
    let deepTripPosition = null;
    if (characterIndex > 0){
        //MOve deep into the words
        let target = new THREE.Vector3(3,3,3);
        let prevArrayIndex = indexMapToArrayIndex[characterIndex-1];
        character_groups[prevArrayIndex].getWorldPosition(target);
        deepTripPosition = new TWEEN.Tween( controls.object.position )
        .to( {
            x: target.x + 50,
            y: target.y + 50,
            // z: target.z + 250
            z: target.z + 110
        }, cameraMovmentTime)
        .easing( TWEEN.Easing.Linear.None ).onUpdate( function () {
            console.log("whatever man");
        } );
        let startTarget = new THREE.Vector3(controls.target.x, controls.target.y, controls.target.z);
        let deeptripLookAt = new TWEEN.Tween(startTarget)
            .onStart(function(){
                deepTripPosition.start();
            })
            .to( {
                x: target.x + 50,
                y: target.y + 50,
                z: 0,
            }, cameraMovmentTime)
            .easing( TWEEN.Easing.Linear.None ).onUpdate( function () {
                controls.target.set(startTarget.x, startTarget.y, 0);
            } )
            .onComplete( function () {
                // camera.lookAt(new THREE.Vector3(0,0,0));
            } ).start();
        // Start to move to next
        target = new THREE.Vector3(3,3,3);
        character_groups[arrayIndex].getWorldPosition(target);
        cameraPositionTween = new TWEEN.Tween( controls.object.position )
            .to( {
                x: target.x + 50,
                y: target.y + 50,
                // z: target.z + 250
                z: target.z + 240
            }, cameraMovmentTime)
            .easing( TWEEN.Easing.Linear.None ).onUpdate( function () {
                console.log("whatever man");
            } )
            .onComplete( function () {
            } );
        startTarget = new THREE.Vector3(controls.target.x, controls.target.y, controls.target.z);
        cameraLookAtTween = new TWEEN.Tween(startTarget)
            .onStart(function(){
               cameraPositionTween.start();
            })
            .to( {
                x: target.x + 50,
                y: target.y + 50,
                z: 0,
            }, cameraMovmentTime)
            .easing( TWEEN.Easing.Linear.None ).onUpdate( function () {
                controls.target.set(startTarget.x, startTarget.y, 0);
            } )
            .onComplete( function () {
                // camera.lookAt(new THREE.Vector3(0,0,0));
                characterIndexToMove += 1;
                if (characterIndex === total_characters-1){
                    currentTripProgress += 1;
                    if (currentTripProgress < allTheWords.length){
                        setTimeout(changeSceneBackground, 3000, currentTripProgress);
                        setTimeout(reset_scene, 3000);
                        setTimeout(sceneResetCamera, 3500);
                        setTimeout(get_characters, 7000, allTheWords[currentTripProgress]);
                    }

                }
            } );
        deeptripLookAt.chain(cameraLookAtTween);
    }
    else {
        let target = new THREE.Vector3(3,3,3);
        character_groups[arrayIndex].getWorldPosition(target);
        cameraPositionTween = new TWEEN.Tween( controls.object.position )
            .to( {
                x: target.x + 50,
                y: target.y + 50,
                // z: target.z + 250
                z: target.z + 250
            }, cameraMovmentTime)
            .easing( TWEEN.Easing.Linear.None ).onUpdate( function () {
            } )
            .onComplete( function () {
            } )
            .start();

        let startTarget = new THREE.Vector3(controls.target.x, controls.target.y, controls.target.z);
        cameraLookAtTween = new TWEEN.Tween(startTarget)
            .to( {
                x: target.x + 50,
                y: target.y + 50,
                z: 0,
            }, cameraMovmentTime)
            .easing( TWEEN.Easing.Linear.None ).onUpdate( function () {
                controls.target.set(startTarget.x, startTarget.y, 0);
            } )
            .onComplete( function () {
                // camera.lookAt(new THREE.Vector3(0,0,0));
                characterIndexToMove += 1;
            } )
            .start();
    }
}

function sceneResetCamera(){
    controls.reset();
    controls.object.position.set(Math.floor(Math.random()*300), Math.floor(Math.random()*300), Math.floor(Math.random()*300));
}


function get_characters(characters_to_get){
    let chars_array = characters_to_get.split("");
    total_characters = chars_array.length;
    for (let i=0; i<currentTripProgress; i++){
        console.log("wtf");
        if (i < allTheWords.length){
            console.log(allTheWords[i].length);
            currentOffset += allTheWords[i].length-1;
        }
    }
    for (let i = 0; i<chars_array.length; i++){
        let query_info= {use_name: true, name: chars_array[i], id: ""};
        get_character(query_info, i, currentOffset);
    }
}


function init() {
    // let x = document.getElementById("myAudio");
    // x.play();
    //Background
    let texture  = new THREE.TextureLoader().load('imgs/0.jpg');
    // backgroundMesh = new THREE.Mesh(
    //     new THREE.PlaneGeometry(2, 2, 0),
    //     new THREE.MeshBasicMaterial({
    //         map: texture
    //     })
    // );
    //
    // backgroundMesh.material.depthTest = false;
    // backgroundMesh.material.depthWrite = false;
    //
    // backgroundScene = new THREE.Scene();
    // backgroundCamera = new THREE.Camera();
    // backgroundScene.add( backgroundCamera );
    // backgroundScene.add( backgroundMesh );

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    container = document.getElementById( 'container' );
    camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 4000 );
    // camera.position.z = 1750;
    camera.position.z = 500;

    controls = new THREE.OrbitControls( camera, container );
    // controls = new THREE.TrackballControls( camera, container);
    // controls.rotateSpeed = 0.5;
    // controls.minDistance = 500;
    // controls.maxDistance = 6000;
    // controls.noZoom = false;
    // controls.noPan = false;
    controls.addEventListener( 'change', render );
    scene = new THREE.Scene();
    scene.background = texture;
    // Camera Movement
    // for (let i=debug_start_num; i<20+total_characters; i++){
    //     let query_info= {use_name: false, name: "", id: i};
    //     get_character(query_info, i-debug_start_num);
    // }

    // let query_info= {use_name: true, name: "我", id: ""};
    // get_character(query_info, 0);
    // query_info= {use_name: true, name: "的", id: ""};
    // get_character(query_info, 1);
    // query_info= {use_name: true, name: "爷", id: ""};
    // get_character(query_info, 2);
    // query_info= {use_name: true, name: "爷", id: ""};
    // get_character(query_info, 3);
    // get_characters(allTheWords[0]);
    get_characters(allTheWords[currentTripProgress]);
    // total_characters = 3;


    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    container.appendChild( renderer.domElement );

    // stats = new Stats();
    // container.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    // let distance = 50;
    // console.log(camera.position);
    // let currentLookAt = (new THREE.Vector3( 0, 0, -distance)).applyQuaternion( camera.quaternion ).add( camera.position );
    // console.log(currentLookAt);
    // console.log("--------------");
    if (character_groups.length === total_characters){
        for (let i=0; i<total_characters; i++){
            update_character(i);
        }
    }
    if (prevCharacterIndexToMove !== characterIndexToMove){
        moveToCharacter(characterIndexToMove);
        prevCharacterIndexToMove = characterIndexToMove;
    }

    TWEEN.update();
    controls.update(); // controls.update();
    // update_image();
    requestAnimationFrame( animate );
    // stats.update();
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
            }
        }
    }
    let time = Date.now() * 0.001;
    // group.rotation.y = time * 0.1;
    // load img texture
    // renderer.clear();
    // renderer.render( backgroundScene, backgroundCamera);
    renderer.render( scene, camera );
}


