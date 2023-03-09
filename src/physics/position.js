export class Position {
  constructor(pos = []) {
    this.pos = pos;
  }

  // euclidean distance
  distance(other) {
    return Math.sqrt(
      Math.pow((other.x - this.x), 2) +
      Math.pow((other.y - this.y), 2))
  }

  direction(other) {
    return Math.atan2(other.y - this.y, other.x - this.x)
  }

  slide(offset) {
    for (let i = 0; i < this.pos.length; i++) {
      this.pos[i] += offset.pos[i]
    }
    return this
  }

  slideMany(offsets) {
    for (let offset of offsets) {
      this.slide(offset)
    }
    return this
  }

  scale(factor) {
    for (let i = 0; i < this.pos.length; i++) {
      this.pos[i] *= factor
    }
    return this
  }

  copy() {
    return new Position(this.pos)
  }

  get x() { return this.pos[0] }
  get y() { return this.pos[1] }
}
