class Disk {
    constructor(size, color) {
        this.size = size;
        this.color = color;
        this.geometry = new THREE.BoxGeometry(size, 0.2, 0.1);
        this.material = new THREE.MeshStandardMaterial({ color: color });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }

    render(position) {
        this.mesh.position.set(position.x, position.y, position.z);
        return this.mesh;
    }
}