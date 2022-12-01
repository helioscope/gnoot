/** @param {Phaser.Types.Tilemaps.TiledObject} obj @param {String} propertyName */
export function getObjectCustomProperty(obj, propertyName) {
  if (!Array.isArray(obj.properties)) {
    console.warn("tiled object appears to be missing custom properties -- this may break things", obj.name);
  }
  let propertyEntry = obj.properties.find((prop)=>prop.name === propertyName);
  if (propertyEntry) {
    return propertyEntry.value;
  }
  return null;
}

/** @param {Number} id @param {Phaser.Tilemaps.ObjectLayer} objectLayer  */
export function findReferencedObject(id, objectLayer) {
  return (objectLayer.objects.find((obj) => obj.id == id));
}