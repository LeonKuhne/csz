export class Util {
  // strings to floats 
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

  // repel from walls
  static wallForce(value) {
    let leftForce = 1 / value ** 2;
    let rightForce = 1 / (1 - value) ** 2;
    return (leftForce - rightForce);
  }
}
