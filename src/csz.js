import { Engine } from "./physics/engine.js";
import { Util } from "./util.js";

export class CSZ {
  constructor(canvas, fps = 60, tps = 60) {
    this.engine = new Engine(canvas, fps, tps)
    this.dimensions = []
    this.data = []
    this.columnMins = []
    this.columnRanges = []
    this.onReady = () => {}
    this.columnColors = []
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
    let values = Util.encode(list)
    this.engine.add(values)
    this.data.push(list)
  }

  prepare() {
    // determine column spin ranges
    for (let i = 0; i < this.dimensions.length; i++) {
      for (let particle of this.engine.particles) {
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
      for (let particle of this.engine.particles) {
        // normalize spin to range 0, 1
        let spin = (particle.spin[i] - min) / range
        particle.spin[i] = spin
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
    this.columnColors[rgbIdx] = columnIdx
    this.engine.color = (particle) => {
      let color = []
      for (let i = 0; i < 3; i++) {
        const colorValue = i < this.columnColors.length 
          ? particle.spin[this.columnColors[i]] : 0
        color.push(colorValue * 255)
      }
      return color
    }
  }

  run() { this.engine.run() }
}
