export class DuckPhysicsSystem {
  constructor() {
    this.gravity = 0.5;
    this.terminalVelocity = 15;
    this.windStrength = 0.02;
  }

  update(duck, dt) {
    const step = dt / 16.67;
    duck.velocityY = Math.min(
      duck.velocityY + this.gravity * step,
      this.terminalVelocity
    );

    duck.velocityX += (Math.random() - 0.5) * this.windStrength * step;
    duck.velocityX *= 0.99;

    duck.y += duck.velocityY * step;
    duck.x += duck.velocityX * step;

    duck.rotation += duck.rotationSpeed * step;
    duck.rotationSpeed += (Math.random() - 0.5) * 0.1;
    duck.rotationSpeed *= 0.95;

    duck.shadowY = duck.y + 40;

    if (duck.scale < 1 && !duck.despawning) {
      duck.scale = Math.min(duck.scale + 0.08 * step, 1);
    }

    if (duck.despawning) {
      duck.scale *= 0.9;
      duck.rotationSpeed += 5 * step;
    }
  }
}
