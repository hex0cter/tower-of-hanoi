class Tower {
    constructor(scene, position, index) {
      this.scene = scene;
      this.position = position;
      this.index = index;
      this.disks = [];
      this.baseHeight = 0.2; // Increased height from ground

      // Create the tower rod
      const rodHeight = 5;
      const rodRadius = 0.2;
      const rodGeometry = new THREE.CylinderGeometry(
        rodRadius,
        rodRadius,
        rodHeight,
        16
      );
      const rodMaterial = new THREE.MeshPhongMaterial({
        color: 0x8b4513, // Wood brown
        specular: 0x222222,
        shininess: 10,
      });

      this.rod = new THREE.Mesh(rodGeometry, rodMaterial);
      this.rod.position.copy(position);
      this.rod.position.y = rodHeight / 2 + this.baseHeight;
      this.rod.castShadow = true;
      this.rod.receiveShadow = false; // Changed to false - rods should only cast shadows, not receive them
      scene.add(this.rod);

      // Create smaller base connectors instead of full bases
      // These are just decorative elements that sit on top of the common base
      const baseWidth = 1.5;
      const baseDepth = 1.5;
      const baseHeight = 0.3; // Taller base for better visibility
      const baseGeometry = new THREE.CylinderGeometry(
        baseWidth / 2,
        baseWidth / 2,
        baseHeight,
        16
      );
      const baseMaterial = new THREE.MeshPhongMaterial({
        color: 0x6d4c41, // Slightly darker brown for contrast
        specular: 0x222222,
        shininess: 15,
      });

      this.base = new THREE.Mesh(baseGeometry, baseMaterial);
      this.base.position.copy(position);
      this.base.position.y = baseHeight / 2;
      this.base.castShadow = true;
      this.base.receiveShadow = true;
      this.base.userData.tower = this;
      scene.add(this.base);

      // Create clickable area for tower selection
      const clickAreaGeometry = new THREE.CylinderGeometry(
        1.5,
        1.5,
        rodHeight,
        16
      );
      const clickAreaMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.0,
        wireframe: false,
      });

      this.clickArea = new THREE.Mesh(clickAreaGeometry, clickAreaMaterial);
      this.clickArea.position.copy(position);
      this.clickArea.position.y = rodHeight / 2 + this.baseHeight;
      this.clickArea.userData.tower = this;
      scene.add(this.clickArea);
    }
    
    // Add a disk to the top of this tower
    addDisk(disk) {
        const level = this.disks.length;
        this.disks.push(disk);
        disk.positionOnTower(this, level);
    }
    
    // Remove the top disk from the tower
    removeTopDisk() {
        if (this.disks.length === 0) return null;
        return this.disks.pop();
    }
    
    // Get the top disk without removing it
    getTopDisk() {
        if (this.disks.length === 0) return null;
        return this.disks[this.disks.length - 1];
    }
    
    // Check if a disk can be placed on this tower
    canAddDisk(disk) {
        if (this.disks.length === 0) return true;
        return this.getTopDisk().size > disk.size;
    }
    
    // Clear all disks from the tower
    clear() {
        this.disks = [];
    }
    
    // Remove tower and base from scene
    remove() {
        this.scene.remove(this.rod);
        this.scene.remove(this.base);
        this.scene.remove(this.clickArea);
        this.rod.geometry.dispose();
        this.rod.material.dispose();
        this.base.geometry.dispose();
        this.base.material.dispose();
        this.clickArea.geometry.dispose();
        this.clickArea.material.dispose();
    }
}
