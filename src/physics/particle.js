import { Position } from './position.js';

export class Particle extends Position {
  constructor(
    pos = new Position([Math.random(), Math.random()]),
    spin = []
  ) {
    super(pos);
    this.spin = spin;
  }

  draw(ctx, w, h, colors=(_) => [0,0,0]) {
    const color = colors(this);
    ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    ctx.fillRect(
      this.pos[0] * (w - this.particleSize),
      this.pos[1] * (h - this.particleSize),
      this.particleSize, this.particleSize);
  }

  // average spin delta from -1 to 1
  delta(other) {
    let sum = 0;
    for (let i = 0; i < this.dimensions.length; i++) {
      sum += ((this.spin[i] - other.spin[i]) / 2) ** 2;
      //spinDelta += (Math.abs(this.spin[i] - other.spin[i]) / 2
    }
    return sum / this.dimensions.length * 2 - 1;
  }

  // euclidean distance
  distance(other) {
    return Math.sqrt(
      (other.pos[0] - this.pos[0]) ** 2 +
      (other.pos[1] - this.pos[1]) ** 2);
  }

  move(offset) {
    this.pos[0] += offset[0];
    this.pos[1] += offset[1];
  }

  clone() {
    return new Particle(this.pos, this.spin);
  }
}
