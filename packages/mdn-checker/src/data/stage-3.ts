// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export default {
  "array-from-async": [
    '{"name":"Array.fromAsync()","type":"javascript-static-method"}',
  ],
  "array-grouping": [
    '{"name":"Map.groupBy()","type":"javascript-static-method"}',
    '{"name":"Object.groupBy()","type":"javascript-static-method"}',
  ],
  "arraybuffer-transfer": [
    '{"name":"ArrayBuffer.prototype.detached","type":"javascript-instance-accessor-property"}',
    '{"name":"ArrayBuffer.prototype.transfer()","type":"javascript-instance-method"}',
    '{"name":"ArrayBuffer.prototype.transferToFixedLength()","type":"javascript-instance-method"}',
  ],
  "iterator-helpers": [
    '{"name":"Iterator.prototype.drop()","type":"javascript-instance-method"}',
    '{"name":"Iterator.prototype.every()","type":"javascript-instance-method"}',
    '{"name":"Iterator.prototype.filter()","type":"javascript-instance-method"}',
    '{"name":"Iterator.prototype.find()","type":"javascript-instance-method"}',
    '{"name":"Iterator.prototype.flatMap()","type":"javascript-instance-method"}',
    '{"name":"Iterator.prototype.forEach()","type":"javascript-instance-method"}',
    '{"name":"Iterator.from()","type":"javascript-static-method"}',
    '{"name":"Iterator() constructor","type":"javascript-constructor"}',
    '{"name":"Iterator.prototype.map()","type":"javascript-instance-method"}',
    '{"name":"Iterator.prototype.reduce()","type":"javascript-instance-method"}',
    '{"name":"Iterator.prototype.some()","type":"javascript-instance-method"}',
    '{"name":"Iterator.prototype.take()","type":"javascript-instance-method"}',
    '{"name":"Iterator.prototype.toArray()","type":"javascript-instance-method"}',
  ],
  "regexp-legacy-features": [
    '{"name":"RegExp.input ($_)","type":"javascript-static-accessor-property"}',
    '{"name":"RegExp.lastMatch ($&)","type":"javascript-static-accessor-property"}',
    '{"name":"RegExp.lastParen ($+)","type":"javascript-static-accessor-property"}',
    '{"name":"RegExp.leftContext ($`)","type":"javascript-static-accessor-property"}',
    '{"name":"RegExp.$1, …, RegExp.$9","type":"javascript-static-accessor-property"}',
    '{"name":"RegExp.rightContext ($\')","type":"javascript-static-accessor-property"}',
  ],
  resizablearraybuffer: [
    '{"name":"ArrayBuffer.prototype.maxByteLength","type":"javascript-instance-accessor-property"}',
    '{"name":"ArrayBuffer.prototype.resizable","type":"javascript-instance-accessor-property"}',
    '{"name":"ArrayBuffer.prototype.resize()","type":"javascript-instance-method"}',
    '{"name":"SharedArrayBuffer.prototype.grow()","type":"javascript-instance-method"}',
    '{"name":"SharedArrayBuffer.prototype.growable","type":"javascript-instance-accessor-property"}',
    '{"name":"SharedArrayBuffer.prototype.maxByteLength","type":"javascript-instance-accessor-property"}',
  ],
} as Record<string, string[]>;
