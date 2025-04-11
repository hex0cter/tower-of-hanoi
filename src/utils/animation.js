class Animation {
    constructor(updateFunc, duration = 1, onComplete = null) {
        this.updateFunc = updateFunc;
        this.duration = duration * 1000; // Convert to milliseconds
        this.onComplete = onComplete;
        this.startTime = performance.now();
        this.active = true;
        
        // Start the animation
        Animation.animations.push(this);
        
        // Start animation loop if not already running
        if (!Animation.loopStarted) {
            Animation.startLoop();
        }
    }
    
    update(currentTime) {
        if (!this.active) return false;
        
        const elapsed = currentTime - this.startTime;
        let progress = Math.min(elapsed / this.duration, 1);
        
        // Apply easing function for smoother motion
        progress = Animation.easeInOutQuad(progress);
        
        // Call the update function with the current progress
        this.updateFunc(progress);
        
        // Check if animation is complete
        if (progress >= 1) {
            this.active = false;
            if (this.onComplete) {
                this.onComplete();
            }
            return false;
        }
        
        return true;
    }
    
    // Easing function for smoother animation
    static easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    
    static updateAnimations(currentTime) {
        for (let i = Animation.animations.length - 1; i >= 0; i--) {
            if (!Animation.animations[i].update(currentTime)) {
                Animation.animations.splice(i, 1);
            }
        }
        
        // Stop the loop if no animations are active
        if (Animation.animations.length === 0) {
            Animation.loopStarted = false;
            cancelAnimationFrame(Animation.frameId);
        } else {
            Animation.frameId = requestAnimationFrame(Animation.updateAnimations);
        }
    }
    
    static startLoop() {
        Animation.loopStarted = true;
        Animation.frameId = requestAnimationFrame(Animation.updateAnimations);
    }
}

// Static properties
Animation.animations = [];
Animation.loopStarted = false;
Animation.frameId = null;
