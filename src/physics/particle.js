import { Position } from './position.js'

export class Particle extends Position {
  // spin can be either a number or a list of numbers
  // pos only 2 dimensions currently supported
  constructor(
    spin = 0.5,
    pos = [Math.random(), Math.random()],
  ) {
    super(pos)
    this.spin = spin
    this.size = 10
    this.maxDelta = 0.1
  }

  draw(ctx, w, h, color=(_) => [150,150,150]) {
    ctx.fillStyle = `rgb(${color(this).join(',')})`
    ctx.fillRect(
      this.x * (w - this.size),
      this.y * (h - this.size),
      this.size, this.size)
  }

  // compute delta of spin between two spin values
  static spinAttraction(a, b) {
    //return b - a
    return a > b ? Math.pow((a-b), 2) : Math.pow((b-a), 2)
    //return ((this.spin[i] - other.spin[i]) / 2) ** 2
    //return (Math.abs(this.spin[i] - other.spin[i]) / 2
  }

  // aka. repulsion/attraction force (-1, 1)
  spinDelta(other) { 
    let sum = 0
    for (let i = 0; i < this.spin.length; i++) {
      sum += Particle.spinAttraction(this.spin[i], other.spin[i])
    }
    return sum / this.spin.length
  }

  wrap(range=1) {
    for (let i = 0; i < this.pos.length; i++) {
      if (this.pos[i] < 0) { this.pos[i] += range }
      else { this.pos[i] %= range }
    }
  }

  collideBounds(range=1) {
    for (let i = 0; i < this.pos.length; i++) {
      if (this.pos[i] < 0) { this.pos[i] = 0 }
      else if (this.pos[i] > range) { this.pos[i] = range }
    }
  }

  copy() {
    return new Particle(this.spin, this.pos)
  }
}
