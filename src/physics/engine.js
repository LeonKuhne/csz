import { Particle } from './particle.js'
import { Position } from './position.js'
import { Vector } from './vector.js'

// particle engine
export class Engine {
  constructor(canvas, fps = 60, tps = 60) {
    this.particles = []
    this.drawDelay = 1000 / fps
    this.tickDelay = 1000 / tps
    this.canvas = canvas
    this.batchSize = 100
    this.spaceDepth = 0 // simulate this many mirrored neighboring spaces
    this.speed = 0.0001
    this.wrap = false
    this.centerGravity = 0.0
    this.color = (_) => [255,255,255] // color particles
    this.antigravity = 0.00001
  }

  add(spin) {
    this.particles.push(new Particle(spin))
  }

  run() {
    // draw
    const ctx = this.canvas.getContext('2d')
    const draw = () => {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.draw(ctx, this.canvas.width, this.canvas.height)
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
    for (let particle of this.particles) {
      particle.draw(ctx, w, h, this.color)
    }
  }

  // attract similar particles, repel opposite
  // NOTE might be able to do this with dot product (or something faster)
  tick() {
    // compute deltas
    let deltas = {}
    const center = new Particle(0, [0.5, 0.5])
    // random i, random j
    const rand = () => Math.floor(Math.random() * this.particles.length)
    for (let batch = 0; batch < this.batchSize; batch++) {
      let [i, j] = [rand(), rand()]
      if (i == j) { continue }
      if (deltas[i] == null) { deltas[i] = new Position([0, 0]) }
      if (deltas[j] == null) { deltas[j] = new Position([0, 0]) }
      deltas[i]
        .slide(new Vector(this.particles[i], this.particles[j])
          .attract(this.spaceDepth)
          .gravitate(this.antigravity)
          .delta
        )
        .slide(new Vector(this.particles[i], center)
          .gravitate(this.centerGravity)
          .delta
        )
    }
    // move
    for (let [i, delta] of Object.entries(deltas)) {
      let particle = this.particles[i]
        .slide(delta.scale(this.speed))
      this.wrap ? particle.wrap() : particle.collideBounds()
    }
  }
}