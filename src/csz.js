// only what is needed
// bare metal no sugar
"use strict";

class Util {
  // spin delta 0-1
  static spinDist(a, b) {
    //return (a - b) ** 2
    return Math.abs(a - b)
  }

  // euclidean distance
  static distance(a, b) {
    return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2)
  }

  // radial direction
  static direction(a, b) {
    return Math.atan2(b[1] - a[1], b[0] - a[0])
  }

  // any list to 0-1 vector
  static encode(list, fill=0) {
    let vector = []
    for (let str of list) {
      if (str == "") {
        vector.push(fill)
        continue;
      }
      let value = parseFloat(str)
      vector.push(value)
    }
    return vector
  }

  // wrap around range
  static wrap(value, range) {
    if (value < 0) {
      return value + range
    }
    return value % range
  }

  // collide with walls
  static collideBounds(value) {
    if (value < 0) { return 0 }
    if (value > 1) { return 1 }
    return value
  }

  // repel from walls
  static wallForce(value) {
    let leftForce = 1 / value ** 2
    let rightForce = 1 / (1 - value) ** 2
    return (leftForce - rightForce)
  }
}

class CSZ {
  constructor(speed = 0.0001) {
    this.dimensions = []
    this.particles = []
    this.data = []
    this.columnMins = []
    this.columnRanges = []
    this.speed = speed
    this.onReady = () => {}
    this.color = [() => 0, () => 0, () => 0]
    this.particleSize = 10
    this.maxDelta = 0.01 // dampening factor
    this.antigravity = 0.00001 // particle repulsion force
    this.wallRepel = 0.000001 // wall repulsion force
  }

  // assumes header line exists
  importCSV(file) {
    console.info("importing csv", file);
    const reader = new FileReader();
    reader.onload = () => {
      let lines = reader.result.split("\n");
      // parse headers
      this.dimensions = lines.shift().split(",");
      this.columnMins = Array(this.dimensions.length).fill(null);
      this.columnRanges = Array(this.dimensions.length).fill(null);
      // parse data
      for (let line of lines) {
        this.addLine(line)
      }
      // normalize data
      this.prepare();
    }
    reader.readAsText(file);
  }

  addLine(line) {
    const list = line.split(',')

    // verify line length
    if (list.length != this.dimensions.length) {
      console.error("line length mismatch", list.length, this.dimensions.length, line)
      return
    }

    // add particle
    let spins = Util.encode(list)
    this.particles.push({
      pos: [Math.random(), Math.random()],
      spin: spins
    })
    this.data.push(list)
  }

  prepare() {
    // determine column spin ranges
    for (let i = 0; i < this.dimensions.length; i++) {
      for (let particle of this.particles) {
        let spins = particle.spin
        let min = this.columnMins[i]
        let maxRange = this.columnRanges[i]
        // check min
        if (min == null || spins[i] < min) {
          this.columnMins[i] = spins[i]
        }
        // check max
        if (maxRange == null || min + spins[i] > maxRange) {
          this.columnRanges[i] = min + spins[i]
        }
      }
    }
    // softmax columns
    for (let i = 0; i < this.dimensions.length; i++) {
      let range = this.columnRanges[i]
      if (range == 0) { continue }
      let min = this.columnMins[i]
      for (let particle of this.particles) {
        // normalize spin to range 0, 1
        let spin = (particle.spin[i] - min) / range
        // adjust range to -1, 1
        particle.spin[i] = spin * 2 - 1
      }
    }
    // callback
    this.onReady();
  }

  // attract similar particles, repel opposite
  // NOTE might be able to do this with dot product (or something faster)
  tick() {
    // compute deltas
    let deltas = []
    for (let i = 0; i < this.particles.length; i++) {
      let particleA = this.particles[i]
      for (let j = i + 1; j < this.particles.length; j++) {
        if (deltas[j] == null) { deltas[j] = [0, 0] }
        if (deltas[i] == null) { deltas[i] = [0, 0] }
        // insert/add delta
        let particleB = this.particles[j]
        let spin = this.react(particleA, particleB)
        // distance and direction
        let dist = Util.distance(particleA.pos, particleB.pos)
        let dir = Util.direction(particleA.pos, particleB.pos)
        // apply forces
        let delta = (1 / dist) * (spin + this.antigravity)
        // clip to -this.maxDelta, this.maxDelta
        if (delta > this.maxDelta) { delta = this.maxDelta }
        if (delta < -this.maxDelta) { delta = -this.maxDelta }
        // component distances
        let distX = Math.cos(dir) * delta
        let distY = Math.sin(dir) * delta
        deltas[i][0] -= distX
        deltas[i][1] -= distY
        deltas[j][0] += distX
        deltas[j][1] += distY
      }
    }

    // apply deltas
    for (let i = 0; i < this.particles.length; i++) {
      let particle = this.particles[i]
      let [x, y] = deltas[i]
      // add delta
      particle.pos[0] += x * this.speed
      particle.pos[1] += y * this.speed
      // provide walls
      let apply = (pos) => Util.collideBounds(
        pos + Util.wallForce(pos) * this.wallRepel
      )
      particle.pos[0] = apply(particle.pos[0])
      particle.pos[1] = apply(particle.pos[1])
    }
  }

  colorColumn(column, rgbIdx) {
    let columnIdx = this.dimensions.indexOf(column)
    if (columnIdx == -1) {
      console.error("column not found", columnIdx, column, this.dimensions)
      return
    }
    this.color[rgbIdx] = (particle) => (particle.spin[columnIdx] + 1) / 2 * 255
  }

  render(ctx) {
    let width = document.body.clientWidth
    let height = document.body.clientHeight
    console.debug("rendering particle count: ", this.particles.length);
    // draw particles
    for (let particle of this.particles) {
      ctx.fillStyle = `rgb(
        ${this.color[0](particle)}, 
        ${this.color[1](particle)},
        ${this.color[2](particle)}
      )`
      ctx.fillRect(
        particle.pos[0] * (width - this.particleSize),
        particle.pos[1] * (height - this.particleSize),
        this.particleSize, this.particleSize);
    }
  }

  react(particleA, particleB) {
    let spinDelta = 0;
    for (let i = 0; i < this.dimensions.length; i++) {
      let spinA = particleA.spin[i]
      let spinB = particleB.spin[i]
      spinDelta += Util.spinDist(spinA, spinB)
    }
    return spinDelta / this.dimensions.length * 2 - 1
  }
}
