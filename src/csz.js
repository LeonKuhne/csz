import { Physics } from "./physics/physics.js";
import { Util } from "./util.js";

export class CSZ {
  constructor(canvas, speed = 0.0001) {
    this.physics = new Physics(canvas)
    this.dimensions = []
    this.data = []
    this.columnMins = []
    this.columnRanges = []
    this.speed = speed
    this.onReady = () => {}
    this.color = [() => 0, () => 0, () => 0]
    this.maxDelta = 0.01 // dampening factor
    this.antigravity = 0.00001 // particle repulsion force
    this.wrap = false
    this.spaceDepth = 0
    this.centerGravity = 0.0001
    this.batchSize = 100
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
    if (line == "") { return }
    const list = line.split(',')

    // verify line length
    if (list.length != this.dimensions.length) {
      console.error("line length mismatch", list.length, this.dimensions.length, line)
      return
    }

    // add particle
    let spins = Util.encode(list)
    this.physics.add(spins)
    this.data.push(list)
  }

  prepare() {
    // determine column spin ranges
    for (let i = 0; i < this.dimensions.length; i++) {
      for (let particle of this.physics.particles) {
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
      for (let particle of this.physics.particles) {
        // normalize spin to range 0, 1
        let spin = (particle.spin[i] - min) / range
        // adjust range to -1, 1
        particle.spin[i] = spin * 2 - 1
      }
    }
    // callback
    this.onReady();
  }

  colorColumn(column, rgbIdx) {
    let columnIdx = this.dimensions.indexOf(column)
    if (columnIdx == -1) {
      console.error("column not found", columnIdx, column, this.dimensions)
      return
    }
    this.color[rgbIdx] = (particle) => (particle.spin[columnIdx] + 1) / 2 * 255
  }

  run() {
    this.physics.run()
  }
}
