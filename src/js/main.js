// Main entry point for the Tower of Hanoi 3D game

// Global variables
let scene, camera, renderer, game, controls;
let ambientLight, directionalLight;
let cloudParticles = [];

// Initialize the game
function init() {
  // Create the scene
  scene = new THREE.Scene();

  // Create a colorful gradient background for kids with more blue
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#87cefa"); // Light sky blue at the top
  gradient.addColorStop(0.4, "#1e90ff"); // Dodger blue in the middle
  gradient.addColorStop(0.8, "#bde6ff"); // Light blue near bottom
  gradient.addColorStop(1, "#ffd26f"); // Light orange/gold at horizon
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const backgroundTexture = new THREE.CanvasTexture(canvas);
  scene.background = backgroundTexture;

  // Create the camera with responsive positioning
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  
  // Set camera position based on screen size
  adjustCameraForScreenSize();

  // Create the renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById("game-container").appendChild(renderer.domElement);

  // Create a more vibrant lighting setup
  ambientLight = new THREE.AmbientLight(0x6688cc, 0.7); // Blueish ambient light
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(0xffffbb, 1.2); // Warm sunlight
  directionalLight.position.set(5, 10, 7);
  directionalLight.castShadow = true;

  // Configure shadow properties
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -15;
  directionalLight.shadow.camera.right = 15;
  directionalLight.shadow.camera.top = 15;
  directionalLight.shadow.camera.bottom = -15;

  scene.add(directionalLight);

  // Create a soft spotlight to enhance shadows and dimension
  const spotLight = new THREE.SpotLight(0xffffff, 0.7);
  spotLight.position.set(-10, 15, 0);
  spotLight.castShadow = false; // Disable shadow casting for the spotlight
  spotLight.angle = Math.PI / 6;
  scene.add(spotLight);

  // Create a realistic wooden table instead of just a floor
  createRealisticTable();

  // Add decorative elements around the scene
  addDecorativeElements();

  // Add instructions
  const instructionsElement = document.createElement("div");
  instructionsElement.className = "instructions";
  instructionsElement.innerHTML = `
        <h3>How to play:</h3>
        <ul>
            <li>Drag disks with your mouse</li>
            <li>Drop them on another tower</li>
            <li>You cannot place larger disks on smaller ones</li>
            <li>Try to move all disks to the right tower</li>
        </ul>
    `;
  document.body.appendChild(instructionsElement);

  // Initialize the game
  game = new Game(scene, camera);
  
  // Add event listener for the Test Game button
  const testButton = document.getElementById("test-button");
  if (testButton) {
    testButton.addEventListener("click", () => {
      // Make sure we reset the game first to start from the beginning
      game.resetGame();
      // Then solve the puzzle automatically
      game.solveAutomatically();
    });
    
    // Also add a touch event for mobile devices
    testButton.addEventListener("touchend", (e) => {
      e.preventDefault(); // Prevent default behavior
      game.resetGame();
      game.solveAutomatically();
    });
  }

  // Event listener for window resize
  window.addEventListener("resize", onWindowResize, false);

  // Start the animation loop
  animate();
}

// Function to adjust camera position and field of view based on screen size
function adjustCameraForScreenSize() {
  // Base values
  let cameraZ = 15;
  let cameraY = 10;
  let cameraLookY = 2;
  
  // For mobile devices (portrait mode)
  if (window.innerWidth < 768) {
    // Adjust for mobile - bring elements closer
    cameraZ = 13;
    cameraY = 8;
    
    // Further adjustments for very small screens
    if (window.innerWidth < 480) {
      cameraZ = 11;
      cameraY = 7;
    }
  }
  
  // For tablets in landscape mode
  else if (window.innerWidth < 1024 && window.innerWidth > window.innerHeight) {
    cameraZ = 14;
    cameraY = 9;
  }
  
  // Set camera position and target
  camera.position.set(0, cameraY, cameraZ);
  camera.lookAt(0, cameraLookY, 0);
}

// Create a realistic wooden table with responsive sizing
function createRealisticTable() {
  // Calculate table size based on screen width
  // Use smaller table for mobile devices
  const baseTableSize = 30;
  const tableSize = window.innerWidth < 768 ? baseTableSize * 0.7 : baseTableSize;

  // Create a kid-friendly playground-style base instead of wooden table
  const tableTopGeometry = new THREE.BoxGeometry(tableSize, 1, tableSize);

  // Create a colorful playground texture with a single unified background
  const playgroundCanvas = document.createElement("canvas");
  playgroundCanvas.width = 1024; // Increased resolution for better quality
  playgroundCanvas.height = 1024;
  const playgroundCtx = playgroundCanvas.getContext("2d");

  // Create colorful base with a radial gradient for more unified appearance
  const centerX = playgroundCanvas.width / 2;
  const centerY = playgroundCanvas.height / 2;
  const radius = playgroundCanvas.width * 0.7;

  // Create a radial gradient that spreads from the center outward
  const gradient = playgroundCtx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    radius
  );
  gradient.addColorStop(0, "#ffeb3b"); // Yellow at center
  gradient.addColorStop(0.4, "#4caf50"); // Green in middle
  gradient.addColorStop(0.7, "#29b6f6"); // Light blue
  gradient.addColorStop(1, "#ff8a65"); // Coral orange at edges

  playgroundCtx.fillStyle = gradient;
  playgroundCtx.fillRect(0, 0, playgroundCanvas.width, playgroundCanvas.height);

  // Create textures
  const playgroundTexture = new THREE.CanvasTexture(playgroundCanvas);
  playgroundTexture.wrapS = THREE.RepeatWrapping;
  playgroundTexture.wrapT = THREE.RepeatWrapping;
  // Use just 1 repeat to avoid visible seams
  playgroundTexture.repeat.set(1, 1);

  // Create material for the top of the playground board
  const tableTopMaterial = new THREE.MeshStandardMaterial({
    map: playgroundTexture,
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  // Create the playground board mesh
  const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial);
  tableTop.position.y = -0.1;
  tableTop.receiveShadow = true;
  tableTop.castShadow = true;
  scene.add(tableTop);

  // Create colorful edge borders - scale down for mobile
  const borderSize = 0.8;
  const borderHeight = 1.2;
  const createBorder = (width, depth, x, z, color) => {
    const borderGeometry = new THREE.BoxGeometry(width, borderHeight, depth);
    const borderMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.1,
    });

    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.set(x, borderHeight / 2 - 0.1, z);
    border.castShadow = true;
    border.receiveShadow = true;
    scene.add(border);
  };

  // Add colorful borders around the playground - like safety bumpers
  createBorder(
    tableSize + borderSize * 2,
    borderSize,
    0,
    -(tableSize / 2 + borderSize / 2),
    0xe91e63
  ); // Front - Pink
  createBorder(
    tableSize + borderSize * 2,
    borderSize,
    0,
    tableSize / 2 + borderSize / 2,
    0x9c27b0
  ); // Back - Purple
  createBorder(
    borderSize,
    tableSize,
    -(tableSize / 2 + borderSize / 2),
    0,
    0x3f51b5
  ); // Left - Blue
  createBorder(
    borderSize,
    tableSize,
    tableSize / 2 + borderSize / 2,
    0,
    0x4caf50
  ); // Right - Green

  // Create rounded corners (quarter cylinders)
  const cornerRadius = borderSize;
  const createCorner = (x, z, rotationY, color) => {
    const cornerGeometry = new THREE.CylinderGeometry(
      cornerRadius,
      cornerRadius,
      borderHeight,
      16,
      1,
      false,
      0,
      Math.PI / 2
    );
    const cornerMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.1,
    });

    const corner = new THREE.Mesh(cornerGeometry, cornerMaterial);
    corner.position.set(x, borderHeight / 2 - 0.1, z);
    corner.rotation.y = rotationY;
    corner.castShadow = true;
    corner.receiveShadow = true;
    scene.add(corner);
  };

  const halfSize = tableSize / 2 + borderSize / 2;
  createCorner(-halfSize, -halfSize, 0, 0xffeb3b); // Front Left - Yellow
  createCorner(halfSize, -halfSize, Math.PI / 2, 0xff9800); // Front Right - Orange
  createCorner(halfSize, halfSize, Math.PI, 0xf44336); // Back Right - Red
  createCorner(-halfSize, halfSize, -Math.PI / 2, 0x2196f3); // Back Left - Light Blue

  // Add fun playground supports instead of table legs
  const legPositions = [
    { x: tableSize / 2 - 2, z: tableSize / 2 - 2 },
    { x: -(tableSize / 2 - 2), z: tableSize / 2 - 2 },
    { x: tableSize / 2 - 2, z: -(tableSize / 2 - 2) },
    { x: -(tableSize / 2 - 2), z: -(tableSize / 2 - 2) },
  ];

  const legColors = [0xf44336, 0x4caf50, 0x2196f3, 0xffeb3b]; // Red, Green, Blue, Yellow

  for (let i = 0; i < legPositions.length; i++) {
    // Create fun, twisted support legs
    const points = [];
    const height = 5;
    const segments = 10;
    const twistRadius = 0.3;
    const pos = legPositions[i];

    for (let j = 0; j <= segments; j++) {
      const y = (j / segments) * -height;
      const twist = Math.sin((j / segments) * Math.PI * 3) * twistRadius;
      points.push(new THREE.Vector3(twist, y, twist));
    }

    const legGeometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      segments * 2,
      0.4,
      8,
      false
    );

    const legMaterial = new THREE.MeshStandardMaterial({
      color: legColors[i],
      roughness: 0.7,
      metalness: 0.3,
    });

    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(pos.x, 0, pos.z);
    leg.castShadow = true;
    scene.add(leg);

    // Add decorative sphere at the bottom of each leg
    const sphereGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: legColors[(i + 1) % 4],
      roughness: 0.5,
      metalness: 0.5,
    });

    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(pos.x, -height, pos.z);
    sphere.castShadow = true;
    scene.add(sphere);
  }

  // Add fun decorations that kids would enjoy
  // Only add decorations for larger screens to reduce complexity on mobile
  if (window.innerWidth >= 768) {
    addPlaygroundDecorItems(tableSize);
  } else {
    // For mobile, add fewer decorative items
    addSimplifiedPlaygroundDecor(tableSize);
  }
}

// Add kid-friendly decorative items to the playground
function addPlaygroundDecorItems(tableSize) {
  // Create a carousel of small toy animals near one corner
  const carouselGroup = new THREE.Group();
  const carouselRadius = 2;
  carouselGroup.position.set(tableSize / 2 - 4, 0.5, tableSize / 2 - 4);

  // Create the carousel base
  const baseGeometry = new THREE.CylinderGeometry(
    carouselRadius,
    carouselRadius * 1.2,
    0.3,
    16
  );
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xe91e63, // Pink
    roughness: 0.7,
    metalness: 0.3,
  });

  const baseDisc = new THREE.Mesh(baseGeometry, baseMaterial);
  carouselGroup.add(baseDisc);

  // Add central pole
  const poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0xffc107, // Amber
    roughness: 0.6,
    metalness: 0.4,
  });

  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.y = 1.5;
  carouselGroup.add(pole);

  // Add top disc
  const topGeometry = new THREE.CylinderGeometry(
    carouselRadius * 0.8,
    carouselRadius * 0.8,
    0.2,
    16
  );
  const topDisc = new THREE.Mesh(topGeometry, baseMaterial);
  topDisc.position.y = 3;
  carouselGroup.add(topDisc);

  // Add toy animals on the carousel
  const animalColors = [0xff5722, 0x8bc34a, 0x9c27b0, 0x03a9f4, 0xffeb3b];
  const animalCount = 5;

  for (let i = 0; i < animalCount; i++) {
    const angle = (i / animalCount) * Math.PI * 2;
    const x = Math.cos(angle) * carouselRadius * 0.7;
    const z = Math.sin(angle) * carouselRadius * 0.7;

    // Animal body
    const bodyGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: animalColors[i],
      roughness: 0.8,
      metalness: 0.1,
    });

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, 1.0, z);

    // Animal head
    const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(x * 1.1, 1.4, z * 1.1);

    // Animal support pole
    const supportGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8);
    const supportMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.5,
    });

    const support = new THREE.Mesh(supportGeometry, supportMaterial);
    support.position.set(x, 0.2, z);

    carouselGroup.add(body);
    carouselGroup.add(head);
    carouselGroup.add(support);
  }

  scene.add(carouselGroup);

  // Add a spinning top toy in another corner
  const topGroup = new THREE.Group();
  topGroup.position.set(-tableSize / 2 + 4, 0.5, -tableSize / 2 + 4);

  // Create the spinning top base
  const spinTopGeometry = new THREE.ConeGeometry(
    1.5,
    2,
    16,
    1,
    false,
    0,
    Math.PI * 2
  );

  // Create colorful segments on the spinning top
  const spinTopColors = [];
  const spinPositions = spinTopGeometry.attributes.position.array;

  for (let i = 0; i < spinPositions.length; i += 3) {
    // Get position and calculate angle
    const x = spinPositions[i];
    const z = spinPositions[i + 2];

    // Calculate angle from x,z
    const angle = Math.atan2(z, x);
    const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);

    // Determine segment color (6 segments)
    const segmentColors = [
      0xff0000, 0xff9900, 0xffff00, 0x00cc00, 0x0099ff, 0x9900ff,
    ];
    const segment = Math.floor(normalizedAngle * 6) % 6;
    const color = new THREE.Color(segmentColors[segment]);

    spinTopColors.push(color.r, color.g, color.b);
  }

  spinTopGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(spinTopColors, 3)
  );

  const spinTopMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.6,
    metalness: 0.3,
  });

  const spinTop = new THREE.Mesh(spinTopGeometry, spinTopMaterial);
  spinTop.rotation.x = Math.PI;
  spinTop.position.y = 1;
  topGroup.add(spinTop);

  // Add handle for the top
  const handleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
  const handleMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.5,
  });

  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.y = 2;
  topGroup.add(handle);

  scene.add(topGroup);

  // Add colorful building blocks in another corner
  const blocksGroup = new THREE.Group();
  blocksGroup.position.set(tableSize / 2 - 5, 0.5, -tableSize / 2 + 5);

  const blockColors = [0xff5252, 0xffff00, 0x4caf50, 0x2196f3, 0x9c27b0];

  // Create a tower of blocks
  for (let i = 0; i < 5; i++) {
    const blockSize = 0.8 - i * 0.05;
    const blockGeometry = new THREE.BoxGeometry(
      blockSize,
      blockSize,
      blockSize
    );
    const blockMaterial = new THREE.MeshStandardMaterial({
      color: blockColors[i],
      roughness: 0.8,
      metalness: 0.1,
    });

    const block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.position.y = 0.4 + i * blockSize;

    // Add slight rotation to each block for a playful look
    block.rotation.y = Math.PI * 0.1 * i;

    blocksGroup.add(block);
  }

  scene.add(blocksGroup);

  // Add a rainbow arc
  const rainbowGroup = new THREE.Group();
  rainbowGroup.position.set(-tableSize / 2 + 5, 0, tableSize / 2 - 5);

  const rainbowColors = [
    0xff0000, // Red
    0xff7f00, // Orange
    0xffff00, // Yellow
    0x00ff00, // Green
    0x0000ff, // Blue
    0x4b0082, // Indigo
    0x9400d3, // Violet
  ];

  // Create rainbow arcs
  for (let i = 0; i < rainbowColors.length; i++) {
    const arcRadius = 2.5 - i * 0.25;
    const arcThickness = 0.15;

    // Create arc geometry (semi-circle)
    const arcCurve = new THREE.EllipseCurve(
      0,
      0, // Center x, y
      arcRadius,
      arcRadius, // x radius, y radius
      0,
      Math.PI, // Start angle, end angle
      false, // Clockwise
      0 // Rotation
    );

    const arcPoints = arcCurve.getPoints(16);
    const arcGeometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        arcPoints.map((p) => new THREE.Vector3(p.x, 0, p.y))
      ),
      20, // Segments
      arcThickness, // Tube radius
      8, // Radial segments
      false // Closed
    );

    const arcMaterial = new THREE.MeshStandardMaterial({
      color: rainbowColors[i],
      roughness: 0.6,
      metalness: 0.3,
    });

    const arc = new THREE.Mesh(arcGeometry, arcMaterial);
    arc.rotation.y = Math.PI / 2; // Rotate to face correct direction
    arc.position.y = arcThickness + i * arcThickness * 2;

    rainbowGroup.add(arc);
  }

  scene.add(rainbowGroup);
}

// Add decorative elements to make the scene more kid-friendly
function addDecorativeElements() {
  // Create realistic volumetric clouds
  createRealisticClouds();

  // Create hot air balloon instead of regular balloons
  createHotAirBalloon();
}

// Create realistic volumetric clouds using particle systems
function createRealisticClouds() {
  const cloudCount = 5;
  const particlesPerCloud = 20;

  for (let c = 0; c < cloudCount; c++) {
    // Create a cloud group
    const cloudGroup = new THREE.Group();

    // Set cloud group position
    const cloudX = Math.random() * 50 - 25;
    const cloudY = Math.random() * 5 + 12;
    const cloudZ = Math.random() * 30 - 30;
    cloudGroup.position.set(cloudX, cloudY, cloudZ);

    // Create cloud core and particles
    const cloudSize = Math.random() * 4 + 5;

    // Create main blob geometry for the cloud core - using brighter white material
    const coreGeometry = new THREE.SphereGeometry(cloudSize * 0.5, 16, 16);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xcccccc, // Add some self-illumination to make clouds brighter
      emissiveIntensity: 0.3,
      roughness: 0.7, // Lower roughness for softer appearance
      metalness: 0,
      transparent: true,
      opacity: 0.9,
    });

    // Add main core to cloud
    const cloudCore = new THREE.Mesh(coreGeometry, coreMaterial);
    cloudGroup.add(cloudCore);

    // Add additional blobs to create fluffy appearance
    for (let i = 0; i < particlesPerCloud; i++) {
      // Create smaller, varied spheres around the main core
      const size = cloudSize * (0.3 + Math.random() * 0.4);
      const blobGeometry = new THREE.SphereGeometry(size, 8, 8);
      const blobMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xefefef, // Add emissive property to make clouds glow
        emissiveIntensity: 0.2 + Math.random() * 0.3,
        roughness: 0.65,
        metalness: 0,
        transparent: true,
        opacity: 0.7 + Math.random() * 0.3,
      });

      const blob = new THREE.Mesh(blobGeometry, blobMaterial);

      // Position the blob around the core
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * cloudSize * 0.8;
      const height = (Math.random() - 0.5) * cloudSize * 0.6;

      blob.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );

      // Add a slight random rotation
      blob.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      cloudGroup.add(blob);
    }

    // Add entire cloud group to scene
    scene.add(cloudGroup);

    // Store reference for animation
    cloudParticles.push(cloudGroup);
  }
}

// Create a detailed hot air balloon that people can travel in
function createHotAirBalloon() {
  // Create a group to hold all balloon parts
  const balloonGroup = new THREE.Group();

  // ---------- BALLOON ENVELOPE (TOP PART) ----------
  // Balloon colors - bright, alternating panels
  const balloonColors = [
     0xff2d00, // Red
    0xff9500, // Orange
    0xffea00, // Yellow
    0x4caf50, // Green
    0x2196f3, // Blue
    0x9c27b0, // Purple
  ];

  // Create the balloon envelope (main balloon part)
  const balloonRadius = 6;
  const balloonGeometry = new THREE.SphereGeometry(balloonRadius, 32, 32);
  // Adjust the geometry to make it more balloon-shaped (taller than wide)
  balloonGeometry.scale(1, 1.3, 1);

  // Material for the balloon with vertical stripes
  const verticalSegments = 16;
  const colors = [];
  const positions = balloonGeometry.attributes.position;

  // Assign colors based on the x position to create vertical panels
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    // Calculate angle around y-axis
    const angle = Math.atan2(z, x);
    const normalizedAngle = (angle + Math.PI) / (2 * Math.PI); // 0 to 1

    // Determine panel index based on angle
    const panelIndex =
      Math.floor(normalizedAngle * balloonColors.length) % balloonColors.length;
    const color = new THREE.Color(balloonColors[panelIndex]);

    colors.push(color.r, color.g, color.b);
  }

  // Add color attribute to the geometry
  balloonGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
  );

  const balloonMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
  balloon.position.y = 18; // Position the balloon high in the sky
  balloonGroup.add(balloon);

  // ---------- BALLOON SKIRT (BOTTOM PART) ----------
  // Create the tapering bottom part (skirt)
  const skirtShape = new THREE.Shape();
  const skirtRadius = balloonRadius * 0.7;
  const skirtHeight = balloonRadius * 0.5;

  // Define the skirt shape as a tapered curve
  skirtShape.moveTo(-skirtRadius, 0);
  skirtShape.quadraticCurveTo(
    -skirtRadius * 0.8,
    -skirtHeight * 0.3,
    -skirtRadius * 0.5,
    -skirtHeight
  );
  skirtShape.lineTo(skirtRadius * 0.5, -skirtHeight);
  skirtShape.quadraticCurveTo(
    skirtRadius * 0.8,
    -skirtHeight * 0.3,
    skirtRadius,
    0
  );
  skirtShape.closePath();

  // Extrude the shape to create a 3D object
  const extrudeSettings = {
    steps: 1,
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.2,
    bevelSegments: 3,
  };

  const skirtGeometry = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(skirtRadius * 0.7, 0),
      new THREE.Vector2(skirtRadius, -skirtHeight * 0.3),
      new THREE.Vector2(skirtRadius * 0.5, -skirtHeight),
    ],
    32
  );

  const skirtMaterial = new THREE.MeshStandardMaterial({
    color: 0xf44336, // Red color
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const skirt = new THREE.Mesh(skirtGeometry, skirtMaterial);
  skirt.position.y = balloon.position.y - balloonRadius * 1.1;
  skirt.rotation.x = Math.PI; // Flip it to match the balloon shape
  balloonGroup.add(skirt);

  // ---------- PASSENGER BASKET ----------
  // Create the passenger basket - now using cylinder shape
  const basketRadius = balloonRadius * 0.5;
  const basketHeight = balloonRadius * 0.5;

  // Create a cylinder geometry for the basket
  const basketGeometry = new THREE.CylinderGeometry(
    basketRadius, // top radius
    basketRadius, // bottom radius
    basketHeight, // height
    16, // radial segments (more segments = smoother circle)
    3, // height segments
    true // open-ended (we'll add separate top and bottom)
  );

  const basketMaterial = new THREE.MeshStandardMaterial({
    color: 0x8d6e63, // Brown wood color
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const basket = new THREE.Mesh(basketGeometry, basketMaterial);
  basket.position.y = skirt.position.y - skirtHeight - basketHeight / 2;
  balloonGroup.add(basket);

  // Add basket bottom (circular)
  const basketBottomGeometry = new THREE.CircleGeometry(basketRadius, 16);
  const basketBottom = new THREE.Mesh(basketBottomGeometry, basketMaterial);
  basketBottom.position.y = basket.position.y - basketHeight / 2;
  basketBottom.rotation.x = Math.PI / 2;
  balloonGroup.add(basketBottom);

  // Add weave texture to the basket sides
  const basketDetailGeometry = new THREE.CylinderGeometry(
    basketRadius * 1.01,
    basketRadius * 1.01,
    basketHeight,
    32,
    8,
    true
  );

  // Create the weave pattern material
  const basketDetailMaterial = new THREE.MeshStandardMaterial({
    color: 0x8d6e63,
    roughness: 0.9,
    metalness: 0.0,
    wireframe: true,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
  });

  const basketDetail = new THREE.Mesh(
    basketDetailGeometry,
    basketDetailMaterial
  );
  basketDetail.position.copy(basket.position);
  balloonGroup.add(basketDetail);

  // Add horizontal rings to create wicker basket appearance
  for (let i = 0; i <= 3; i++) {
    const ringGeometry = new THREE.TorusGeometry(
      basketRadius * 1.01,
      0.05,
      8,
      24
    );

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x6d4c41,
      roughness: 0.7,
      metalness: 0.1,
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.y =
      basket.position.y - basketHeight / 2 + (i * basketHeight) / 3;
    ring.rotation.x = Math.PI / 2;
    balloonGroup.add(ring);
  }

  // ---------- CONNECTING ROPES ----------
  // Create ropes connecting the balloon to the basket
  const ropeCount = 8;
  const ropePoints = [];

  for (let i = 0; i < ropeCount; i++) {
    const angle = (i / ropeCount) * Math.PI * 2;
    const x = Math.cos(angle) * skirtRadius * 0.8;
    const z = Math.sin(angle) * skirtRadius * 0.8;

    // Connect from skirt bottom to basket top edge
    const ropeGeometry = new THREE.BufferGeometry();
    const points = [];

    // Calculate points around the basket edge
    const basketAngle = (i / ropeCount) * Math.PI * 2;
    const basketX = Math.cos(basketAngle) * basketRadius * 0.9;
    const basketZ = Math.sin(basketAngle) * basketRadius * 0.9;

    // Top point (at skirt)
    points.push(x, skirt.position.y - skirtHeight / 2, z);

    // Add some curve to the rope
    points.push(x * 0.8, skirt.position.y - skirtHeight * 1.5, z * 0.8);

    // Bottom point (at basket rim)
    points.push(basketX, basket.position.y + basketHeight / 2, basketZ);

    ropeGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    );

    const ropeMaterial = new THREE.LineBasicMaterial({
      color: 0x5d4037,
      linewidth: 2,
    });

    const rope = new THREE.Line(ropeGeometry, ropeMaterial);
    balloonGroup.add(rope);

    // Store points for potential buffer geometry line
    ropePoints.push(...points);
  }

  // ---------- PEOPLE IN BASKET ----------
  // Add simple figures to represent people in the basket
  const createPerson = (x, z, color) => {
    const personGroup = new THREE.Group();

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac }); // Skin tone
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.25;
    personGroup.add(head);

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = -0.2;
    personGroup.add(body);

    // Position the person in the basket
    personGroup.position.set(x, basket.position.y + basketHeight / 4, z);
    return personGroup;
  };

  // Add two people with different colored clothes
  balloonGroup.add(createPerson(-basketRadius / 2, 0, 0x2196f3)); // Blue person
  balloonGroup.add(createPerson(basketRadius / 2, 0, 0xff9800)); // Orange person

  // ---------- ANIMATION PROPERTIES ----------
  // Add animation properties
  balloonGroup.userData.floatSpeed = 0.0004;
  balloonGroup.userData.floatOffset = Math.random() * Math.PI * 2;
  balloonGroup.userData.rotationSpeed = 0.0002;

  // Position the balloon much further in the scene and lower
  balloonGroup.position.set(15, -2, -45); // Lowered Y position and moved further back

  // Scale down the balloon to simulate distance
  balloonGroup.scale.set(0.8, 0.8, 0.8);

  // Add the balloon group to the scene
  scene.add(balloonGroup);

  // Store balloon group for animation
  window.hotAirBalloon = balloonGroup;
}

// Handle window resize
function onWindowResize() {
  // Update camera aspect ratio
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  // Adjust camera position for new screen size
  adjustCameraForScreenSize();
  
  // Update renderer size
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (game) {
    game.handleResize();
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Animate clouds - more organic movement
  cloudParticles.forEach((cloud, index) => {
    // Add gentle bobbing motion
    cloud.position.y += Math.sin((Date.now() + index * 1000) / 2000) * 0.005;

    // Slow horizontal drift
    cloud.position.x += 0.01 + index * 0.002;

    // Reset position when cloud moves out of view
    if (cloud.position.x > 30) {
      cloud.position.x = -30;
      cloud.position.z = Math.random() * 30 - 30;
      cloud.position.y = Math.random() * 5 + 12;
    }
  });

  // Animate balloons
  if (window.hotAirBalloon) {
    const { floatSpeed, floatOffset, rotationSpeed } =
      window.hotAirBalloon.userData;

    // Gentle floating motion using sine wave
    window.hotAirBalloon.position.y +=
      Math.sin(Date.now() * floatSpeed + floatOffset) * 0.01;

    // Gentle swaying motion
    window.hotAirBalloon.rotation.y += rotationSpeed;
  }

  if (game) {
    game.update();

    // Update tower highlighting based on dragging state
    if (game.isDragging && game.draggedDisk) {
      // Highlight valid towers for dropping
      for (const tower of game.towers) {
        if (tower.canAddDisk(game.draggedDisk)) {
          // Calculate distance to this tower
          const distance = Math.abs(
            game.draggedDisk.mesh.position.x - tower.position.x
          );

          // Highlight intensity based on proximity (closer = brighter)
          const maxDistance = 8;
          const normalizedDistance =
            Math.min(distance, maxDistance) / maxDistance;
          const intensity = 0.5 * (1 - normalizedDistance);

          // Highlight valid tower
          tower.rod.material.emissive = new THREE.Color(0x00ff00);
          tower.rod.material.emissiveIntensity = intensity;
        } else {
          // Reset non-valid towers
          tower.rod.material.emissive = new THREE.Color(0x000000);
          tower.rod.material.emissiveIntensity = 0;
        }
      }
    }
  }

  renderer.render(scene, camera);
}

// Simplified decoration function for mobile devices
function addSimplifiedPlaygroundDecor(tableSize) {
  // Add just one or two simple decorations for mobile devices
  // Add a rainbow arc as it's colorful and compact
  const rainbowGroup = new THREE.Group();
  rainbowGroup.position.set(-tableSize / 3, 0, -tableSize / 3);
  rainbowGroup.scale.set(0.6, 0.6, 0.6); // Scale down for mobile

  const rainbowColors = [
    0xff0000, // Red
    0xff7f00, // Orange
    0xffff00, // Yellow
    0x00ff00, // Green
    0x0000ff, // Blue
    0x4b0082, // Indigo
    0x9400d3, // Violet
  ];

  // Create rainbow arcs - fewer segments for better performance
  for (let i = 0; i < rainbowColors.length; i++) {
    const arcRadius = 2.5 - i * 0.25;
    const arcThickness = 0.15;

    // Create arc geometry with fewer points for better mobile performance
    const arcCurve = new THREE.EllipseCurve(
      0, 0,           // Center x, y
      arcRadius, arcRadius, // x radius, y radius
      0, Math.PI,    // Start angle, end angle
      false,         // Clockwise
      0              // Rotation
    );

    const arcPoints = arcCurve.getPoints(12); // Fewer points for mobile
    const arcGeometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        arcPoints.map(p => new THREE.Vector3(p.x, 0, p.y))
      ),
      12,           // Fewer segments
      arcThickness,  // Tube radius
      6,            // Fewer radial segments
      false         // Closed
    );

    const arcMaterial = new THREE.MeshStandardMaterial({
      color: rainbowColors[i],
      roughness: 0.6,
      metalness: 0.3,
    });

    const arc = new THREE.Mesh(arcGeometry, arcMaterial);
    arc.rotation.y = Math.PI / 2;
    arc.position.y = arcThickness + i * arcThickness * 2;

    rainbowGroup.add(arc);
  }

  scene.add(rainbowGroup);
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', init);
