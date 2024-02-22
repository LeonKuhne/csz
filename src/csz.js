import { Engine } from "https://dot.leonk.dev/src/engine.js"
import { Particle } from "https://dot.leonk.dev/src/particle.js"
import { Util } from "./util.js"

export class CSZ {
  constructor(canvas, fps = 10, tps = 60) {
    this.engine = new Engine(canvas, fps, tps)
    this.engine.screenFill = 1/3
    this.engine.minInteractionDistance = 1
    this.spinCurve = 5
    const spinFunc = Particle.SpinDelta
    Particle.SpinDelta = (a, b) => Math.pow(spinFunc(a, b), this.spinCurve)
    this.dimensions = []
    this.data = []
    this.columnMins = []
    this.columnRanges = []
    this.onReady = () => {}
    this.columnColors = []
    this.onUpdate = () => {}
  }

  // assumes header line exists
  importCSV(file) {
    console.info("importing csv", file);
    const reader = new FileReader();
    reader.onload = () => {
      this.onUpdate({name: file.name})
      this.importText(reader.result)
    }
    reader.readAsText(file);
  }

  importURL(url) {
    console.info(`importing url`, url);
    fetch(url)
      .then(response => response.text())
      .then(data => {
        this.onUpdate({name: url})
        this.importText(data)
      })
  }

  embed(text) {
    this.reset()
    this.importJSONURL(`http://localhost:5000/embeddings?text=${text}`, "embeddings")
  }

  reset() {
    // reset particles/data
    this.engine.particles = []
    this.data = []
    this.dimensions = []
  }

  importJSONURL(url, key=null) {
    console.info(`importing json url`, url)
    fetch(url)
      .then(response => response.json())
      .then(data => key ? data[key] : data)
      .then(data => {
        if (data.length == 0) { console.error("no data found", data); return }
        this.dimensions = Object.keys(data[0])
        // import data
        this.onUpdate({name: key || url})
        data.forEach(values => this.importVector(values))
        this.onReady()
      })
  }

  importVector(values) {
    // normalize values from -1,1 to 0-1 using sigmoid
    for (let i = 0; i < values.length; i++) {
      values[i] = 1 / (1 + Math.exp(-values[i]))
    }
    this.engine.add(values)
    this.data.push(values)
  }

  importText(text) {
    let lines = text.split("\n");
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
        color.push(Math.floor(colorValue * 255))
      }
      return color
    }
  }

  run() { this.engine.run() }
}
