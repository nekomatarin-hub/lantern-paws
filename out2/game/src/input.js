// Lantern Paws — keyboard and pointer state, gathered in one place.
// The world reads `moveX/moveY` (a unit-ish vector), `dashPressed` (an edge,
// consumed by the world) and the pointer target while the pointer is held.

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
};

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.dashQueued = false;
    this.pointerDown = false;
    this.pointerX = 0;
    this.pointerY = 0;
    this.confirmQueued = false;
    this.pauseQueued = false;
    this.muteQueued = false;

    window.addEventListener('keydown', (e) => {
      if (KEYMAP[e.code]) {
        this.keys.add(KEYMAP[e.code]);
        e.preventDefault();
      }
      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (!e.repeat) this.dashQueued = true;
        e.preventDefault();
      }
      if (e.code === 'Enter') this.confirmQueued = true;
      if (e.code === 'KeyP' || e.code === 'Escape') this.pauseQueued = true;
      if (e.code === 'KeyM') this.muteQueued = true;
    });
    window.addEventListener('keyup', (e) => {
      if (KEYMAP[e.code]) this.keys.delete(KEYMAP[e.code]);
    });
    window.addEventListener('blur', () => this.keys.clear());

    const setPointer = (e) => {
      const rect = canvas.getBoundingClientRect();
      // The canvas backing store is a fixed 1280x720 stage; map the CSS
      // pointer position back into stage coordinates.
      this.pointerX = ((e.clientX - rect.left) / rect.width) * 1280;
      this.pointerY = ((e.clientY - rect.top) / rect.height) * 720;
    };
    canvas.addEventListener('pointerdown', (e) => {
      setPointer(e);
      this.pointerDown = true;
      this.confirmQueued = true;
    });
    canvas.addEventListener('pointermove', (e) => {
      if (this.pointerDown) setPointer(e);
    });
    window.addEventListener('pointerup', () => { this.pointerDown = false; });
    canvas.addEventListener('pointerleave', () => { this.pointerDown = false; });
  }

  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('left')) x -= 1;
    if (this.keys.has('right')) x += 1;
    if (this.keys.has('up')) y -= 1;
    if (this.keys.has('down')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = Math.SQRT1_2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  takeDash() {
    const was = this.dashQueued;
    this.dashQueued = false;
    return was;
  }

  takeConfirm() {
    const was = this.confirmQueued;
    this.confirmQueued = false;
    return was;
  }

  takePause() {
    const was = this.pauseQueued;
    this.pauseQueued = false;
    return was;
  }

  takeMute() {
    const was = this.muteQueued;
    this.muteQueued = false;
    return was;
  }
}
