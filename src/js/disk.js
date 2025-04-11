class Disk {
    constructor(size, index, scene) {
        this.size = size;
        this.index = index;
        this.scene = scene;
        
        // Calculate dimensions based on size
        this.radius = 0.5 + (size * 0.25);
        this.height = 0.3;
        
        // Create the disk mesh
        const geometry = new THREE.CylinderGeometry(this.radius, this.radius, this.height, 32);
        
        // Create material with color based on size
        const hue = (index * 0.15) % 1;
        const color = new THREE.Color().setHSL(hue, 1, 0.5);
        
        const material = new THREE.MeshPhongMaterial({ 
            color: color,
            specular: 0x333333,
            shininess: 30,
            flatShading: false
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.disk = this;
        
        // Add to scene
        scene.add(this.mesh);
    }
    
    // Position the disk at a specific height on a tower
    positionOnTower(tower, level) {
        // Add a vertical offset to ensure disks sit on top of the base
        // Update baseOffset to account for common base (0.3) + tower base (0.3) = 0.6 total
        const baseOffset = 0.6; // Updated height offset for disks to sit on top of the base
        const yPosition = baseOffset + (level * this.height) + (this.height / 2);
        this.mesh.position.set(tower.position.x, yPosition, tower.position.z);
    }
    
    // Animate the disk movement from one tower to another
    moveTo(targetTower, targetLevel, duration = 1) {
        const startPosition = this.mesh.position.clone();
        const midPointHeight = startPosition.y + 3; // Arc height
        
        // Use the same updated offset for consistency when calculating target position
        const baseOffset = 0.6; // Updated height offset
        const targetY = baseOffset + (targetLevel * this.height) + (this.height / 2);
        const targetPosition = new THREE.Vector3(targetTower.position.x, targetY, targetTower.position.z);
        
        return new Promise((resolve) => {
            // First move up
            new Animation(
                (progress) => {
                    const y = THREE.MathUtils.lerp(startPosition.y, midPointHeight, progress);
                    this.mesh.position.y = y;
                },
                duration / 2,
                () => {
                    // Then move horizontally and down
                    new Animation(
                        (progress) => {
                            const x = THREE.MathUtils.lerp(startPosition.x, targetPosition.x, progress);
                            const z = THREE.MathUtils.lerp(startPosition.z, targetPosition.z, progress);
                            const y = THREE.MathUtils.lerp(midPointHeight, targetPosition.y, progress);
                            this.mesh.position.set(x, y, z);
                        },
                        duration / 2,
                        resolve
                    );
                }
            );
        });
    }
    
    // Remove from scene
    remove() {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}
