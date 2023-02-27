import { Particle } from './Particle.js';

export class Physics {
  constructor(canvas, fps = 60, tps = 60) {
    this.particles = []
    this.particleSize = 10
    this.drawDelay = 1000 / fps
    this.tickDelay = 1000 / tps
    this.canvas = canvas
  }

  add() {
    this.particles.push(new Particle())
  }

  run() {
    // draw
    const ctx = this.canvas.getContext('2d')
    const draw = () => {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.draw(ctx)
      setTimeout(() => requestAnimationFrame(draw), this.drawDelay)
    }
    requestAnimationFrame(draw)
    // run
    const run = () => {
      this.tick()
      setTimeout(run, this.tickDelay)
    }
    // dispatch
    run()
  }

  draw(ctx, w, h) {
    console.debug(`drawing particles (${this.particles.length})`);
    // draw particles
    for (let particle of this.particles) {
      particle.draw(ctx, w, h)
    }
  }

  // attract similar particles, repel opposite
  // NOTE might be able to do this with dot product (or something faster)
  tick() {
    // compute deltas
    let deltas = {}
    // random i, random j
    const rand = () => Math.floor(Math.random() * this.physics.particles.length)
    for (let batch = 0; batch < this.batchSize; batch++) {
      let [i, j] = [rand(), rand()]
      if (i == j) { continue }
      if (deltas[i] == null) { deltas[i] = [0, 0] }
      if (deltas[j] == null) { deltas[j] = [0, 0] }
      let particleA = this.particles[i]
      let particleB = this.particles[j]

      // loop surrounding spaces
      for (let x = -this.spaceDepth; x <= this.spaceDepth; x++) {
        for (let y = -this.spaceDepth; y <= this.spaceDepth; y++) {
          // compute deltas
          let [distX, distY] = this.attract(particleA, particleB, new Position([x, y]))
          deltas[i][0] -= distX
          deltas[i][1] -= distY
        }
      }
    }

    // apply deltas
    for (let [i, delta] of Object.entries(deltas)) {
      let particle = this.particles[i]
      let [x, y] = delta
      // add delta
      particle.pos[0] += x * this.speed
      particle.pos[1] += y * this.speed
      // border type
      if (this.wrap == true) {
        particle.pos[0] = Util.wrap(particle.pos[0], 1)
        particle.pos[1] = Util.wrap(particle.pos[1], 1)
      } else {
        particle.pos[0] = Util.collideBounds(particle.pos[0])
        particle.pos[1] = Util.collideBounds(particle.pos[1])
      }
    }
  }

  attract(particleA, particleB, space=new Position([0, 0])) {
    let spin = this.react(particleA, particleB)
    const pos = particleB.clone().move(space)
    // attract to particle
    let dist = particleA.distance(pos)
    let dir = particleA.direction(pos)
    let delta = (1 / dist) * (spin + this.antigravity)
    // attract towards center
    const center = [0.5, 0.5]
    let distToCenter = particleA.clone().distanceTo([0.5, 0.5], space)
    let dirToCenter = Util.direction(particleA.pos, [0.5, 0.5], space)
    let centerDelta = distToCenter ** 2 * this.centerGravity
    // clip to -this.maxDelta, this.maxDelta
    if (delta > this.maxDelta) { delta = this.maxDelta }
    if (delta < -this.maxDelta) { delta = -this.maxDelta }
    // component distances
    let distX = Math.cos(dir) * delta - Math.cos(dirToCenter) * centerDelta
    let distY = Math.sin(dir) * delta - Math.sin(dirToCenter) * centerDelta
    return [distX, distY]
  }

  react(particleA, particleB) {
    let spinDelta = 0;
    for (let i = 0; i < this.dimensions.length; i++) {
      spinDelta += particleA.spin[i].delta(particleB.spin[i])
    }
    return spinDelta / this.dimensions.length * 2 - 1
  }
}