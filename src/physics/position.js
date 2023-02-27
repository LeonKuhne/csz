export class Position {
  constructor(pos = []) {
    this.pos = pos;
  }
  // euclidean distance
  distance(other) {
    return Math.sqrt(
      (other.pos[0] - this.pos[0]) ** 2 +
      (other.pos[1] - this.pos[1]) ** 2);
  }
  direction(other) {
    return Math.atan2(other.pos[1] - this.pos[1], other.pos[0] - this.pos[0]);
  }
  move(offset) {
    this.pos[0] += offset[0];
    this.pos[1] += offset[1];
  }
}
