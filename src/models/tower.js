class Tower {
    constructor(position) {
        this.position = position;
        this.disks = [];
        this.geometry = new THREE.BoxGeometry(1, 5, 1);
        this.material = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown color for wood
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(position.x, position.y, position.z);
    }

    addDisk(disk) {
        this.disks.push(disk);
        this.updateTower();
    }

    removeDisk() {
        const disk = this.disks.pop();
        this.updateTower();
        return disk;
    }

    updateTower() {
        // Update the position of the disks on the tower
        for (let i = 0; i < this.disks.length; i++) {
            const disk = this.disks[i];
            disk.mesh.position.y = this.position.y + (i * 0.5); // Adjust the height based on the disk index
        }
    }

    getMesh() {
        return this.mesh;
    }
}