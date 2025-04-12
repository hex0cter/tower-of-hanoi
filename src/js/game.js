// This file contains the main game logic for the Tower of Hanoi 3D game.
// It includes the rules of the game, user interaction handling, and game state management.

class Game {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.towers = [];
    this.disks = [];
    this.selectedTower = null;
    this.diskCount = 3;
    this.isAnimating = false;
    this.moveCount = 0;
    this.isGameComplete = false;

    // Dragging state variables
    this.isDragging = false;
    this.draggedDisk = null;
    this.draggedTower = null;
    this.dragPlane = null;
    this.originalDiskPosition = null;
    this.mouseOffset = new THREE.Vector3();

    // Raycaster for mouse interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Bind methods
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.update = this.update.bind(this);

    // Setup event listeners for drag and drop (mouse events)
    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("mouseup", this.handleMouseUp);

    // Setup event listeners for touch devices
    window.addEventListener("touchstart", this.handleTouchStart, {
      passive: false,
    });
    window.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    window.addEventListener("touchend", this.handleTouchEnd, {
      passive: false,
    });

    this.resetButton = document.getElementById("reset-button");
    this.diskSlider = document.getElementById("disk-slider");
    this.diskValue = document.getElementById("disk-value");
    this.moveCounter = document.getElementById("move-counter");

    this.resetButton.addEventListener("click", () => this.resetGame());
    this.diskSlider.addEventListener("input", () => {
      const newValue = parseInt(this.diskSlider.value);
      this.diskValue.textContent = newValue;
      this.diskCount = newValue;
      this.resetGame();
    });

    // Create a drag plane for calculating mouse position in 3D space
    const planeGeometry = new THREE.PlaneGeometry(50, 50);
    const planeMaterial = new THREE.MeshBasicMaterial({
      visible: false,
      side: THREE.DoubleSide,
    });
    this.dragPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.dragPlane.rotation.x = Math.PI / 2; // Horizontal plane
    scene.add(this.dragPlane);

    // Initial setup
    this.setupTowers();
    this.createDisks();
  }

  setupTowers() {
    // Clear existing towers
    for (const tower of this.towers) {
      tower.remove();
    }

    // Create three towers
    const spacing = 4;
    this.towers = [];

    // Add a common base plate for all towers
    const baseWidth = spacing * 4; // Wider base to accommodate all towers
    const baseDepth = 3; // Deeper base for better visual appearance
    const baseHeight = 0.5;
    const baseGeometry = new THREE.BoxGeometry(
      baseWidth,
      baseHeight,
      baseDepth
    );
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Brown wood color
      roughness: 0.7,
      metalness: 0.2,
    });

    this.commonBase = new THREE.Mesh(baseGeometry, baseMaterial);
    this.commonBase.position.set(0, 0.3, 0); // Lift base 0.3 units from the ground
    this.commonBase.castShadow = true;
    this.commonBase.receiveShadow = true;
    this.scene.add(this.commonBase);

    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * spacing;
      const position = new THREE.Vector3(
        x,
        this.commonBase.position.y + baseHeight / 2,
        0
      );
      this.towers.push(new Tower(this.scene, position, i));
    }
  }

  createDisks() {
    // Clear existing disks
    for (const disk of this.disks) {
      disk.remove();
    }

    this.disks = [];

    // Reset towers
    for (const tower of this.towers) {
      tower.clear();
    }

    // Create new disks and place them on the first tower
    for (let i = this.diskCount - 1; i >= 0; i--) {
      const disk = new Disk(i, i, this.scene);
      this.disks.push(disk);
      this.towers[0].addDisk(disk);
    }

    // Reset move counter
    this.moveCount = 0;
    this.updateMoveCounter();
    this.isGameComplete = false;
  }

  resetGame() {
    // Clean up existing confetti if any
    const congratOverlay = document.getElementById("congratulations-overlay");
    const confettiElements = document.querySelectorAll(".confetti");
    confettiElements.forEach((element) => element.remove());

    // Reset game state
    this.isGameComplete = false;
    this.createDisks();
  }

  handleMouseDown(event) {
    if (this.isAnimating || this.isGameComplete) return;

    // Calculate mouse position in normalized device coordinates
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Cast a ray from the camera to the mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // First check for intersections with disks
    const diskMeshes = this.disks.map((disk) => disk.mesh);
    const diskIntersects = this.raycaster.intersectObjects(diskMeshes);

    if (diskIntersects.length > 0) {
      const clickedDiskMesh = diskIntersects[0].object;
      const clickedDisk = clickedDiskMesh.userData.disk;

      // Find which tower the disk belongs to
      let sourceTower = null;
      for (const tower of this.towers) {
        if (
          tower.disks.includes(clickedDisk) &&
          clickedDisk === tower.getTopDisk()
        ) {
          sourceTower = tower;
          break;
        }
      }

      // Only allow dragging the top disk of any tower
      if (sourceTower) {
        // Start dragging
        this.isDragging = true;
        this.draggedDisk = clickedDisk;
        this.draggedTower = sourceTower;
        this.originalDiskPosition = clickedDiskMesh.position.clone();

        // Calculate mouse offset from disk center
        const intersectionPoint = diskIntersects[0].point;
        this.mouseOffset.copy(intersectionPoint).sub(clickedDiskMesh.position);
        this.mouseOffset.y = 0; // Only allow horizontal dragging

        // Position drag plane at the disk's height
        this.dragPlane.position.y = clickedDiskMesh.position.y;

        // Remove disk from tower for dragging
        sourceTower.removeTopDisk();

        // Visual feedback - make the disk slightly transparent while dragging
        clickedDiskMesh.material.transparent = true;
        clickedDiskMesh.material.opacity = 0.7;

        // Move disk slightly higher while dragging
        clickedDiskMesh.position.y += 1;

        event.preventDefault();
      }
    } else {
      // For backwards compatibility, allow tower clicking too
      const towerIntersects = this.raycaster.intersectObjects(
        this.towers.map((tower) => tower.clickArea)
      );

      if (towerIntersects.length > 0) {
        const clickedTower = towerIntersects[0].object.userData.tower;
        this.handleTowerClick(clickedTower);
      }
    }
  }

  handleMouseMove(event) {
    if (!this.isDragging || !this.draggedDisk) return;

    // Update mouse position
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Cast ray to the drag plane
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.dragPlane);

    if (intersects.length > 0) {
      // Calculate new position for the disk
      const newPosition = intersects[0].point.clone().sub(this.mouseOffset);

      // Keep the disk at the same height and only move horizontally
      newPosition.y = this.draggedDisk.mesh.position.y;

      // Update disk position
      this.draggedDisk.mesh.position.copy(newPosition);
    }
  }

  handleMouseUp(event) {
    if (!this.isDragging || !this.draggedDisk) return;

    // Find the closest tower to the disk
    let closestTower = null;
    let minDistance = Infinity;

    for (const tower of this.towers) {
      const distance = Math.abs(
        this.draggedDisk.mesh.position.x - tower.position.x
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestTower = tower;
      }
    }

    // Check if the disk can be added to the closest tower
    if (closestTower && closestTower.canAddDisk(this.draggedDisk)) {
      // Valid move, add disk to the new tower
      closestTower.addDisk(this.draggedDisk);

      // Increment move counter
      this.moveCount++;
      this.updateMoveCounter();

      // Check for win condition
      this.checkWinCondition();
    } else {
      // Invalid move, return disk to original tower
      this.draggedTower.addDisk(this.draggedDisk);
    }

    // Reset disk appearance
    this.draggedDisk.mesh.material.transparent = false;
    this.draggedDisk.mesh.material.opacity = 1.0;

    // Reset dragging state
    this.isDragging = false;
    this.draggedDisk = null;
    this.draggedTower = null;
    this.originalDiskPosition = null;
  }

  async handleTowerClick(tower) {
    if (this.selectedTower === null) {
      // No tower selected yet, try to select this one
      if (tower.disks.length === 0) return; // Can't select empty tower

      this.selectedTower = tower;
      this.highlightSelectedTower(true);
    } else {
      // Tower already selected, try to move disk
      if (tower === this.selectedTower) {
        // Deselect if clicking the same tower
        this.highlightSelectedTower(false);
        this.selectedTower = null;
        return;
      }

      const diskToMove = this.selectedTower.getTopDisk();

      if (diskToMove && tower.canAddDisk(diskToMove)) {
        this.highlightSelectedTower(false);
        this.isAnimating = true;

        // Remove disk from current tower
        this.selectedTower.removeTopDisk();

        // Animate disk movement
        await diskToMove.moveTo(tower, tower.disks.length);

        // Add disk to new tower
        tower.addDisk(diskToMove);

        // Increment move counter
        this.moveCount++;
        this.updateMoveCounter();

        // Check for win condition
        this.checkWinCondition();

        this.isAnimating = false;
      }

      this.selectedTower = null;
    }
  }

  highlightSelectedTower(highlight) {
    if (!this.selectedTower) return;

    const emissiveIntensity = highlight ? 0.5 : 0;
    const emissiveColor = highlight ? 0x00ff00 : 0x000000;

    this.selectedTower.rod.material.emissive = new THREE.Color(emissiveColor);
    this.selectedTower.rod.material.emissiveIntensity = emissiveIntensity;
  }

  updateMoveCounter() {
    if (this.moveCounter) {
      this.moveCounter.textContent = this.moveCount;
    }
  }

  checkWinCondition() {
    // Game is won when all disks are on the last tower
    if (this.towers[2].disks.length === this.diskCount) {
      this.isGameComplete = true;

      // Display congratulation screen after a short delay
      setTimeout(() => {
        // Get DOM elements
        const congratOverlay = document.getElementById(
          "congratulations-overlay"
        );
        const finalMoveCount = document.getElementById("final-move-count");
        const minMovesElement = document.getElementById("min-moves");
        const efficiencyElement = document.getElementById("efficiency");
        const playAgainBtn = document.getElementById("play-again-btn");
        const nextLevelBtn = document.getElementById("next-level-btn");

        // Calculate minimum possible moves for the puzzle (2^n - 1)
        const minMoves = Math.pow(2, this.diskCount) - 1;

        // Calculate efficiency percentage (min moves / actual moves) * 100
        const efficiency = Math.min(
          100,
          Math.round((minMoves / this.moveCount) * 100)
        );

        // Update stats
        finalMoveCount.textContent = this.moveCount;
        minMovesElement.textContent = minMoves;
        efficiencyElement.textContent = efficiency + "%";

        // Show congratulation overlay with animation
        congratOverlay.classList.add("visible");

        // Create and display confetti
        this.createConfetti();

        // Function to handle play again action
        const playAgainAction = () => {
          congratOverlay.classList.remove("visible");
          this.resetGame();
        };

        // Function to handle next level action
        const nextLevelAction = () => {
          congratOverlay.classList.remove("visible");
          // Increase disk count by 1 for next level (up to max 8)
          const newDiskCount = Math.min(8, this.diskCount + 1);
          this.diskCount = newDiskCount;

          // Update disk slider UI
          const diskSlider = document.getElementById("disk-slider");
          const diskValue = document.getElementById("disk-value");
          if (diskSlider && diskValue) {
            diskSlider.value = newDiskCount;
            diskValue.textContent = newDiskCount;
          }

          // Reset the game with new disk count
          this.resetGame();
        };

        // Remove any existing event listeners (to prevent duplicates)
        playAgainBtn.removeEventListener("click", playAgainAction);
        nextLevelBtn.removeEventListener("click", nextLevelAction);
        playAgainBtn.removeEventListener("touchend", playAgainAction);
        nextLevelBtn.removeEventListener("touchend", nextLevelAction);

        // Set up click event listeners for desktop
        playAgainBtn.addEventListener("click", playAgainAction);
        nextLevelBtn.addEventListener("click", nextLevelAction);

        // Add touch event listeners for mobile
        playAgainBtn.addEventListener("touchend", (e) => {
          e.preventDefault(); // Prevent default behavior
          playAgainAction();
        });

        nextLevelBtn.addEventListener("touchend", (e) => {
          e.preventDefault(); // Prevent default behavior
          nextLevelAction();
        });
      }, 500);
    }
  }

  createConfetti() {
    const congratOverlay = document.getElementById("congratulations-overlay");
    const colors = [
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
      "#ffffff",
    ];
    const confettiCount = 150;

    // Create confetti pieces
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";

      // Random position, color, size and rotation
      const posX = Math.random() * window.innerWidth;
      const posY = -20 - Math.random() * 100; // Start above the viewport
      const size = 5 + Math.random() * 10;
      const color = colors[Math.floor(Math.random() * colors.length)];

      confetti.style.left = posX + "px";
      confetti.style.top = posY + "px";
      confetti.style.width = size + "px";
      confetti.style.height = size + "px";
      confetti.style.backgroundColor = color;
      confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

      // Add to DOM
      congratOverlay.appendChild(confetti);

      // Animate falling
      const duration = 1500 + Math.random() * 3000;
      const delay = Math.random() * 3000;

      confetti.style.transition = `all ${duration}ms ease-in ${delay}ms`;

      // Trigger animation on next frame
      setTimeout(() => {
        confetti.style.top = window.innerHeight + 50 + "px";
        confetti.style.transform = `rotate(${Math.random() * 360 * 3}deg)`;

        // Remove after animation completes
        setTimeout(() => {
          confetti.remove();
        }, duration + delay);
      }, 10);
    }
  }

  update() {
    // Nothing to update in the game logic every frame currently
    // This method could be used for animations, etc.
  }

  // Touch event handlers
  handleTouchStart(event) {
    if (this.isAnimating || this.isGameComplete) return;

    // Prevent default to avoid scrolling
    event.preventDefault();

    if (event.touches.length !== 1) return;

    const touch = event.touches[0];

    // Calculate touch position in normalized device coordinates
    this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

    // Cast a ray from the camera to the touch position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // First check for intersections with disks
    const diskMeshes = this.disks.map((disk) => disk.mesh);
    const diskIntersects = this.raycaster.intersectObjects(diskMeshes);

    if (diskIntersects.length > 0) {
      const clickedDiskMesh = diskIntersects[0].object;
      const clickedDisk = clickedDiskMesh.userData.disk;

      // Find which tower the disk belongs to
      let sourceTower = null;
      for (const tower of this.towers) {
        if (
          tower.disks.includes(clickedDisk) &&
          clickedDisk === tower.getTopDisk()
        ) {
          sourceTower = tower;
          break;
        }
      }

      // Only allow dragging the top disk of any tower
      if (sourceTower) {
        // Start dragging
        this.isDragging = true;
        this.draggedDisk = clickedDisk;
        this.draggedTower = sourceTower;
        this.originalDiskPosition = clickedDiskMesh.position.clone();

        // Calculate touch offset from disk center
        const intersectionPoint = diskIntersects[0].point;
        this.mouseOffset.copy(intersectionPoint).sub(clickedDiskMesh.position);
        this.mouseOffset.y = 0; // Only allow horizontal dragging

        // Position drag plane at the disk's height
        this.dragPlane.position.y = clickedDiskMesh.position.y;

        // Remove disk from tower for dragging
        sourceTower.removeTopDisk();

        // Visual feedback - make the disk slightly transparent while dragging
        clickedDiskMesh.material.transparent = true;
        clickedDiskMesh.material.opacity = 0.7;

        // Move disk slightly higher while dragging
        clickedDiskMesh.position.y += 1;
      }
    } else {
      // For backwards compatibility, allow tower touching too
      const towerIntersects = this.raycaster.intersectObjects(
        this.towers.map((tower) => tower.clickArea)
      );

      if (towerIntersects.length > 0) {
        const clickedTower = towerIntersects[0].object.userData.tower;
        this.handleTowerClick(clickedTower);
      }
    }
  }

  handleTouchMove(event) {
    if (!this.isDragging || !this.draggedDisk) return;

    // Prevent default to avoid scrolling
    event.preventDefault();

    if (event.touches.length !== 1) return;

    const touch = event.touches[0];

    // Update touch position
    this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

    // Cast ray to the drag plane
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.dragPlane);

    if (intersects.length > 0) {
      // Calculate new position for the disk
      const newPosition = intersects[0].point.clone().sub(this.mouseOffset);

      // Keep the disk at the same height and only move horizontally
      newPosition.y = this.draggedDisk.mesh.position.y;

      // Update disk position
      this.draggedDisk.mesh.position.copy(newPosition);
    }
  }

  handleTouchEnd(event) {
    // Prevent default behavior
    event.preventDefault();

    if (!this.isDragging || !this.draggedDisk) return;

    // Find the closest tower to the disk
    let closestTower = null;
    let minDistance = Infinity;

    for (const tower of this.towers) {
      const distance = Math.abs(
        this.draggedDisk.mesh.position.x - tower.position.x
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestTower = tower;
      }
    }

    // Check if the disk can be added to the closest tower
    if (closestTower && closestTower.canAddDisk(this.draggedDisk)) {
      // Valid move, add disk to the new tower
      closestTower.addDisk(this.draggedDisk);

      // Increment move counter
      this.moveCount++;
      this.updateMoveCounter();

      // Check for win condition
      this.checkWinCondition();
    } else {
      // Invalid move, return disk to original tower
      this.draggedTower.addDisk(this.draggedDisk);
    }

    // Reset disk appearance
    this.draggedDisk.mesh.material.transparent = false;
    this.draggedDisk.mesh.material.opacity = 1.0;

    // Reset dragging state
    this.isDragging = false;
    this.draggedDisk = null;
    this.draggedTower = null;
    this.originalDiskPosition = null;
  }

  // Helper method for testing - move a disk from one tower to another
  moveDiskBetweenTowers(sourceTowerIndex, targetTowerIndex) {
    const sourceTower = this.towers[sourceTowerIndex];
    const targetTower = this.towers[targetTowerIndex];

    if (sourceTower && targetTower) {
      const diskToMove = sourceTower.getTopDisk();

      if (diskToMove && targetTower.canAddDisk(diskToMove)) {
        // Remove disk from source tower
        sourceTower.removeTopDisk();

        // Add disk to target tower
        targetTower.addDisk(diskToMove);

        // Increment move counter
        this.moveCount++;
        this.updateMoveCounter();

        // Check for win condition
        this.checkWinCondition();

        return true;
      }
    }

    return false;
  }

  // Helper method to solve Tower of Hanoi automatically
  async solveAutomatically() {
    // Define recursive solution function
    const moveDisks = async (n, source, target, auxiliary) => {
      if (n === 1) {
        // Move a single disk directly
        this.moveDiskBetweenTowers(source, target);
        // Add a small delay to visualize the solution
        await new Promise((resolve) => setTimeout(resolve, 800));
        return;
      }

      // Move n-1 disks from source to auxiliary using target as auxiliary
      await moveDisks(n - 1, source, auxiliary, target);

      // Move the largest disk from source to target
      this.moveDiskBetweenTowers(source, target);

      // Add a small delay to visualize the solution
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Move n-1 disks from auxiliary to target using source as auxiliary
      await moveDisks(n - 1, auxiliary, target, source);
    };

    // Solve the puzzle
    await moveDisks(this.diskCount, 0, 2, 1);
  }

  // Resize handler
  handleResize() {
    // Nothing specific to resize for the game logic
  }

  // Cleanup
  dispose() {
    window.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("touchstart", this.handleTouchStart);
    window.removeEventListener("touchmove", this.handleTouchMove);
    window.removeEventListener("touchend", this.handleTouchEnd);
    this.resetButton.removeEventListener("click", () => this.resetGame());
    this.diskSlider.removeEventListener("input", () => {});

    // Remove all towers and disks
    for (const tower of this.towers) {
      tower.remove();
    }
    for (const disk of this.disks) {
      disk.remove();
    }

    // Remove the drag plane
    this.scene.remove(this.dragPlane);
    this.dragPlane.geometry.dispose();
    this.dragPlane.material.dispose();
  }
}
