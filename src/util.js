export class Util {
  // any list to 0-1 vector
  static encode(list, fill = 0) {
    let vector = [];
    for (let str of list) {
      if (str == "") {
        vector.push(fill);
        continue;
      }
      let value = parseFloat(str);
      vector.push(value);
    }
    return vector;
  }

  // wrap around range
  static wrap(value, range) {
    if (value < 0) {
      return value + range;
    }
    return value % range;
  }

  // collide with walls
  static collideBounds(value) {
    if (value < 0) { return 0; }
    if (value > 1) { return 1; }
    return value;
  }

  // repel from walls
  static wallForce(value) {
    let leftForce = 1 / value ** 2;
    let rightForce = 1 / (1 - value) ** 2;
    return (leftForce - rightForce);
  }
}
