import Phaser from 'phaser';
import saveManager from './saveManager';
import { pickupLocations } from './worldMapConfig';


// Honestly, doing this screen in HTML seems better in many ways (ease of styling, built-in accessibility, etc)
// but I wanted to explore more features of Phaser for the jam (and try keeping it similarly low-res).

// note: the layout here is kinda brittle if you plan to add many more save slots

const SCREEN_WIDTH = 480;
const SCREEN_HEIGHT = 320;

const LOAD_BUTTON_WIDTH = 80;
const LOAD_BUTTON_HEIGHT = 60;

const ERASE_BUTTON_WIDTH = 50;
const ERASE_BUTTON_HEIGHT = 16;

const LABEL_STYLING = {fontFamily: 'Arial, sans-serif', color: 'black', align: 'center', resolution: 4, fixedWidth: LOAD_BUTTON_WIDTH};
const LABEL_HEADER_STYLING = {...LABEL_STYLING, fontSize: '20px', fixedHeight: 24};
const LABEL_BODY_STYLING = {...LABEL_STYLING, fontSize: '10px', fixedHeight: 12};

const BACKGROUND_COLOR = 0xFFFFFF;

const BUTTON_BG_COLOR = 0xFFFFFF;
const BUTTON_BG_COLOR_HIGHLIGHT = 0xDADADA;

const BUTTON_OUTLINE_COLOR = 0x000000;
const BUTTON_OUTLINE_COLOR_HIGHLIGHT = 0x000000;

export default class LoadSaveScene extends Phaser.Scene {
  constructor() {
    super('LoadSaveScene');

    this.activeButton = null;
    /** @type Phaser.GameObjects.Text[] */
    this.slotDescriptions = [];
    this.onTriggerLoad = (loadIndex) => {console.warn('no load handler provided')};
    this.buttonSound = null;
  }

  create() {
    let slots = saveManager.getSlots();
    let bg = this.add.rectangle(0,0, SCREEN_WIDTH, SCREEN_HEIGHT, BACKGROUND_COLOR).setOrigin(0,0).setDepth(0);
    let padding = 12;
    let layoutLeft = Math.floor((SCREEN_WIDTH - (slots.length * (LOAD_BUTTON_WIDTH + padding)) + padding) * 0.5);
    let layoutTop = Math.floor((SCREEN_HEIGHT - LOAD_BUTTON_HEIGHT) * 0.5);
    // let title = this.add.text(0,40, "gnoot", {...LABEL_HEADER_STYLING, fontSize: '12px', fixedWidth: SCREEN_WIDTH});
    let help = this.add.text(0,100, "pick a save slot:", {...LABEL_HEADER_STYLING, fontSize: '9px', fixedWidth: SCREEN_WIDTH});

    // title.setAlpha(0.25);

    let buttonOffsetIncrement = LOAD_BUTTON_WIDTH + padding;
    slots.forEach((slotData, index) => {
      this.createSaveSlotButton(layoutLeft + index * buttonOffsetIncrement, layoutTop, index, slotData);
    });

    this.cameras.main.setBounds(0,0, 480,320);
    this.cameras.main.setZoom(2, 2);

    this.buttonSound = this.sound.add('loader-button-press', {volume: 0.3});
  }

  generateSlotText(slotData) {
    if (slotData.finished) {
      return "complete";
    } else if (slotData.started) {
      let pickupDict = slotData.pickups;
      let pickupCount = Object.keys(pickupDict).reduce((total, pickupKey) => pickupDict[pickupKey] ? total + 1 : total, 0);
      return `${Math.floor(100 * pickupCount / pickupLocations.length)}%`;
    } else {
      return "new game";
    }
  }

  createSaveSlotButton(x, y, slotIndex, slotData) {
    let btn = this.add.rectangle(x,y, LOAD_BUTTON_WIDTH, LOAD_BUTTON_HEIGHT, BUTTON_BG_COLOR).setOrigin(0,0);
    let btnHead = this.add.text(x,y + 10, String(slotIndex + 1), LABEL_HEADER_STYLING).setOrigin(0,0);
    let btnDesc = this.add.text(x,y + 40, this.generateSlotText(slotData), LABEL_BODY_STYLING).setOrigin(0,0);

    this.slotDescriptions[slotIndex] = btnDesc;

    btn.depth = 10;
    btnHead.depth = 11;
    btnDesc.depth = 11;

    btn.isStroked = true;
    btn.setStrokeStyle(1, BUTTON_OUTLINE_COLOR);

    this.createButtonInteraction(btn, this.onPressLoadButton.bind(this), slotIndex);

    this.createEraseButton(x + (LOAD_BUTTON_WIDTH - ERASE_BUTTON_WIDTH) * 0.5, y + LOAD_BUTTON_HEIGHT + 4, slotIndex);
  }

  createEraseButton(x, y, slotIndex) {
    let btn = this.add.rectangle(x,y, ERASE_BUTTON_WIDTH, ERASE_BUTTON_HEIGHT, BUTTON_BG_COLOR).setOrigin(0,0);
    let btnDesc = this.add.text(x,y+2, "erase", {...LABEL_BODY_STYLING, fixedWidth: ERASE_BUTTON_WIDTH}).setOrigin(0,0);

    btn.depth = 10;
    btnDesc.depth = 11;

    btn.isStroked = true;
    btn.setStrokeStyle(1, BUTTON_OUTLINE_COLOR);

    this.createButtonInteraction(btn, this.onPressEraseButton.bind(this), slotIndex);
  }

  createButtonInteraction(buttonRect, callback, callbackData) {
    buttonRect.setInteractive();
    buttonRect.on('pointerover', () => {
      buttonRect.fillColor = BUTTON_BG_COLOR_HIGHLIGHT;
      buttonRect.strokeColor = BUTTON_OUTLINE_COLOR_HIGHLIGHT;
    });

    buttonRect.on('pointerout', () => {
      buttonRect.fillColor = BUTTON_BG_COLOR;
      buttonRect.strokeColor = BUTTON_OUTLINE_COLOR;
    });

    buttonRect.on('pointerdown', () => {
      // could do "down" state styling here)
      this.activeButton = buttonRect;
      this.input.once('pointerup', () => {
        this.resetActiveButton();
      });
    })

    buttonRect.on('pointerup', () => {
      if (this.activeButton == buttonRect) {
        this.buttonSound.play();
        callback(callbackData);
      }
    });
  }

  refreshButtons() {
    let slots = saveManager.getSlots();
    slots.forEach((slotData, index) => {
      this.slotDescriptions[index].setText(this.generateSlotText(slotData));
    });
  }

  onPressLoadButton(slotIndex) {
    if (saveManager.getSlots()[slotIndex].finished !== true) {
      this.exit();
      setTimeout(()=>{
        this.onTriggerLoad(slotIndex);
      }, 500)
    }
  }

  onPressEraseButton(slotIndex) {
    if (saveManager.getSlots()[slotIndex].started) {
      // todo: don't use window.confirm (if anyone other than me actually uses this feature...)
      if (window.confirm("Are you sure you want to erase the data in this slot?")) {
        saveManager.resetSlot(slotIndex);
        saveManager.saveState();
        this.refreshButtons();
        this.resetActiveButton();
      }
    }
  }

  resetActiveButton() {
    if (this.activeButton) {
      this.activeButton.fillColor = BUTTON_BG_COLOR;
      this.activeButton.strokeColor = BUTTON_OUTLINE_COLOR;
      this.activeButton = null;
    }
  }

  exit() {
    this.input.stopPropagation();
    this.scene.setActive(false);
    this.scene.setVisible(false);
    this.scene.sendToBack();
    this.resetActiveButton();
  }

  enter() {
    this.scene.setActive(true);
    this.scene.setVisible(true);
    this.refreshButtons();
    this.scene.bringToTop();
  }
}