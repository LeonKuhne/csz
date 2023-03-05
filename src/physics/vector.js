import { Position } from "./position.js"

export class Vector {
  constructor(start, end) {
    this.start = start
    this.end = end
    this.delta = new Position([0, 0])
  }

  add(distance, direction) {
    this.delta.slide(new Position([
      Math.cos(direction) * distance,
      Math.sin(direction) * distance,
    ]))
    return this
  }

  gravitate(strength) {
    const distance = this.start.distance(this.end)
    const direction = this.end.direction(this.start)
    const gravity = strength * (1 - distance ** 2)
    this.add(gravity, direction)
    return this
  }

  attract(spaces=0) {
    // attract to surrounding spaces
    for (let x = -spaces; x <= spaces; x++) {
      for (let y = -spaces; y <= spaces; y++) {
        const space = this.end.copy().slide(new Position([x, y]))
        const distance = this.start.distance(space)
        const direction = this.start.direction(space)
        const repulsionForce = 1 - this.start.spinDelta(space) * 2
        const delta = (1-distance)**2 * repulsionForce
        this.add(delta, direction)
      }
    }
    return this
  }
}