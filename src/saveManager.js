const defaultState = {
  started : false, // started this save slot
  worldX : 0, // last world position (when safe)
  worldY : 0,
  safeX : 0, // last safe position in level
  safeY : 0,
  facing : -1, // should be -1 (left) or 1 (right)
  pickups : {},
  finished : false, // finished the game using this save slot
};

let activeSlotNumber = -1;
let activeState = {...defaultState};
let saveSlots = [
  {...defaultState},
  {...defaultState}
];
let didInit = false;

export default {
  init : () => {
    if (didInit) {
      return;
    }
    const savedString = window.localStorage.getItem('saveSlots');
    if (savedString) {
      const parsedSlots = JSON.parse(savedString);
      if (parsedSlots && Array.isArray(parsedSlots)) {
        // todo: further validation? 
        // (could iterate over keys, making sure they match and their value types match the defaultState?)
        saveSlots = parsedSlots;
      }
    }
    activeSlotNumber = -1;
    activeState = null;
    didInit = true;
  },
  exitCurrentSlot : () => {
    activeSlotNumber = -1;
    activeState = null;
  },
  saveState : () => {
    window.localStorage.setItem('saveSlots', JSON.stringify(saveSlots));
  },
  getSlots : () => {
    return saveSlots;
  },
  resetSlot : (index) => {
    saveSlots[index] = {...defaultState};
  },
  loadSlot : (index) => {
    activeSlotNumber = index;
    activeState = saveSlots[index];
    return {...activeState};
  },
  getSlotNumber : () => {
    return activeSlotNumber;
  },
  getState : () => {
    return activeState ? {...activeState} : null;
  },
  markActiveSlotAsStarted : () => {
    activeState = {...activeState, started : true};
  },
  setSavedPosition : (worldX, worldY, safeX, safeY, facing) => {
    if (activeState) {
      activeState = {...activeState, worldX, worldY, safeX, safeY, facing};
      saveSlots[activeSlotNumber] = activeState;
      return true;
    } else {
      console.warn("can't update state -- no slot has been loaded yet");
      return false;
    }
  },
  setPickup : (pickupId, didPickUp) => {
    if (activeState) {
      let updatedPickups = {...activeState.pickups};
      updatedPickups[pickupId] = didPickUp;
      activeState = {...activeState, pickups : updatedPickups};
      saveSlots[activeSlotNumber] = activeState;
      return true;
    } else {
      console.warn("can't update state -- no slot has been loaded yet");
      return false;
    }
  },
  didPickUp : (pickupId) => {
    if (activeState) {
      return activeState.pickups[pickupId];
    }
    throw new Error("no slot has been loaded");
  },
  markActiveSlotAsFinished : () => {
    activeState = {...activeState, finished : true};
  }
}