/**
 * Dispatches the following CustomEvents on the element:
 * - `gestures-swipestart`: Fired when movement exceeds the swipeThreshold.
 * - `gestures-swipemove`: Fired continuously during a swipe.
 * - `gestures-swipeend`: Fired on pointer up after a swipe.
 * - `gestures-tap`: Fired on a single tap.
 * - `gestures-doubletap`: Fired on a double tap.
 */

/**
 * this engine also allows for complex gestures like:
 * being able to detect a swipe that starts in one direction and ends in another,
 * or a swipe that starts in one direction and ends in the same direction.
 * and extensions if you want to add more complex gestures.
 */



// ---EAZY: GestureHandler.ts - A premium feeling BASIC, gesture detection engine. ---

/** With a Baic state machine Helper. */

type GestureState = "IDLE" | "PENDING" | "PANNING";

export type GestureDirection = "up" | "down" | "left" | "right";

/** Configuration options for the gesture handler. */
export interface GestureConfig {
  swipeThreshold: number;
  tapThreshold: number;
  doubleTapTimeout: number;
  minFlickVelocity: number; // Min velocity (pixels/ms) a lower value allows for slower, more deliberate swipes.
  historySize: number;  // Number of pointer evernts to keep for velocity calculation.
  ignoreTapOn: string;
}

// --- EVENT DETAIL TYPES ---
export interface SwipeStartEventDetail {
  x: number;
  y: number;
}
export interface SwipeMoveEventDetail {
  deltaX: number;
  deltaY: number;
}
export interface SwipeEndEventDetail {
  direction: GestureDirection;
  velocity: number;
  totalDeltaX: number;
  totalDeltaY: number;
}
export interface TapEventDetail {
  x: number;
  y: number;
  target: EventTarget | null;
}

// --- DEFAULT CONFIGURATION ---
const DEFAULT_CONFIG: GestureConfig = {
  swipeThreshold: 20, // A lower threshold makes it feel more responsive.
  tapThreshold: 10,
  doubleTapTimeout: 300,
  minFlickVelocity: 0.5,
  historySize: 5,
  // ignoreTapOn: 'a, button, .clickable-icon, .clickable-text, input, textarea, .is-active',
  ignoreTapOn: 'a, button, input, textarea, .clickable-icon, .clickable-text'
  // ignoreTapOn: 'a, button, input, textarea',
};


// --- GESTURE HANDLER CLASS ---
export class GestureHandler {
  private element: HTMLElement;
  private config: GestureConfig;

  // State Machine
  private state: GestureState = "IDLE";
  private pointerId: number | null = null; // *** THIS is to reliably track the pointer
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private lastTapTime = 0;
  private lastMoveX = 0;
  private lastMoveY = 0;

  // History for velocity calculation
  private history: { x: number; y: number; t: number }[] = [];

  // Bound listeners for easy add/remove
  private onPointerDown_ = this.onPointerDown.bind(this);
  private onPointerMove_ = this.onPointerMove.bind(this);
  private onPointerUp_ = this.onPointerUp.bind(this);
  private onPointerCancel_ = this.onPointerCancel.bind(this);

  constructor(element: HTMLElement, config: Partial<GestureConfig> = {}) {
    this.element = element;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeListeners();
  }

  private initializeListeners(): void {
    this.element.addEventListener("pointerdown", this.onPointerDown_);
  }

  public destroy(): void {
    // Ensure we clean up any active gesture listeners
    this.reset();
    this.element.removeEventListener("pointerdown", this.onPointerDown_);
  }

  private onPointerDown(event: PointerEvent): void {
    // Only respond to primary pointers (e.g., first finger, left mouse button)
    if (!event.isPrimary || this.state !== "IDLE") return;

    event.stopPropagation();  // remeber to use this every where nessary


    this.pointerId = event.pointerId;
    this.element.setPointerCapture(this.pointerId);


    this.element.addEventListener("pointermove", this.onPointerMove_);
    this.element.addEventListener("pointerup", this.onPointerUp_);
    this.element.addEventListener("pointercancel", this.onPointerCancel_);
    
    this.state = "PENDING";
    this.startX = this.lastMoveX = event.clientX;
    this.startY = this.lastMoveY = event.clientY;
    this.startTime = event.timeStamp;
    this.history = [{ x: this.startX, y: this.startY, t: this.startTime }];
  }

  private onPointerMove(event: PointerEvent): void {
    if (this.state === "IDLE") return;

    const { clientX, clientY, timeStamp } = event;
    const totalDeltaX = clientX - this.startX;
    const totalDeltaY = clientY - this.startY;
    const totalDistance = Math.hypot(totalDeltaX, totalDeltaY);

    // Add to history for velocity calculation
    this.history.push({ x: clientX, y: clientY, t: timeStamp });
    if (this.history.length > this.config.historySize) {
      this.history.shift();
    }
    
    // If we were PENDING, check if we've moved enough to start a PAN
    if (this.state === "PENDING" && totalDistance > this.config.swipeThreshold) {
      this.state = "PANNING";
      this.dispatch<SwipeStartEventDetail>("gestures-swipestart", { x: this.startX, y: this.startY });
    }

    // If we are PANNING, dispatch move events
    if (this.state === "PANNING") {
      this.dispatch<SwipeMoveEventDetail>("gestures-swipemove", {
        deltaX: clientX - this.lastMoveX,
        deltaY: clientY - this.lastMoveY,
      });
    }

    this.lastMoveX = clientX;
    this.lastMoveY = clientY;
  }

  private onPointerUp(event: PointerEvent): void {
    if (this.state === "IDLE" || event.pointerId !== this.pointerId) return;

    const { clientX, clientY, timeStamp } = event;

    if (this.state === "PANNING") {
      const totalDeltaX = clientX - this.startX;
      const totalDeltaY = clientY - this.startY;
      const totalDistance = Math.hypot(totalDeltaX, totalDeltaY);

      // If the user swipes far but returns near the start, it's not a swipe.
      if (totalDistance < this.config.swipeThreshold) {
        this.reset();
        return;
      }
      
      const lastPoint = this.history[this.history.length - 1];
      const firstRelevantPoint = this.history[0];
      const velocityDuration = lastPoint.t - firstRelevantPoint.t;
      const velocityDistance = Math.hypot(lastPoint.x - firstRelevantPoint.x, lastPoint.y - firstRelevantPoint.y);
      const velocity = velocityDuration > 0 ? velocityDistance / velocityDuration : 0;

      const direction: GestureDirection = Math.abs(totalDeltaX) > Math.abs(totalDeltaY)
        ? (totalDeltaX > 0 ? "right" : "left")
        : (totalDeltaY > 0 ? "down" : "up");

      this.dispatch<SwipeEndEventDetail>("gestures-swipeend", {
        direction,
        velocity,
        totalDeltaX,
        totalDeltaY,
      });
      this.lastTapTime = 0; // A swipe cancels any pending double-tap

    } else if (this.state === "PENDING") {
      const totalDistance = Math.hypot(clientX - this.startX, clientY - this.startY);

      // Check for tap threshold and if the target is an interactive element
      if (totalDistance < this.config.tapThreshold) {

        // If it's NOT an ignored element, we fire our own custom tap events.
        const now = performance.now();
        if (now - this.lastTapTime < this.config.doubleTapTimeout) {
          this.dispatch<TapEventDetail>("doubletap", { x: event.clientX, y: event.clientY, target: event.target });
          this.lastTapTime = 0;
        } else {
          this.dispatch<TapEventDetail>("tap", { x: event.clientX, y: event.clientY, target: event.target });
          this.lastTapTime = now;
        }
      }
    }

    this.reset();
  }

  private onPointerCancel(event: PointerEvent): void {
    this.lastTapTime = 0;
    this.reset();
  }

  private reset(): void {
    if (this.state === "IDLE") return;

    // *** FIX: Use the stored pointerId to release capture reliably ***
    if (this.pointerId !== null && this.element.hasPointerCapture(this.pointerId)) {
        this.element.releasePointerCapture(this.pointerId);
    }
    this.pointerId = null;

    this.element.removeEventListener("pointermove", this.onPointerMove_);
    this.element.removeEventListener("pointerup", this.onPointerUp_);
    this.element.removeEventListener("pointercancel", this.onPointerCancel_);
    
    this.state = "IDLE";
    this.history = [];
  }

  private dispatch<T>(eventName: string, detail: T): void {
    this.element.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      composed: true,
      detail,
    }));
  }
}