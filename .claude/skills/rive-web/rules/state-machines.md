---
name: state-machines
description: Working with Rive state machines - playing, pausing, and managing states
metadata:
  tags: rive, web, state-machine, playback, control
---

# State Machines

State machines are the heart of interactive Rive animations. They control transitions between animation states based on inputs and events.

## Playing State Machines

### At Load Time

```typescript
const rive = new Rive({
  src: 'animation.riv',
  canvas: canvasElement,
  stateMachines: 'State Machine 1',  // Name from Rive editor
  autoplay: true,
});
```

### Multiple State Machines

```typescript
const rive = new Rive({
  src: 'animation.riv',
  canvas: canvasElement,
  stateMachines: ['UI State', 'Background Effects'],
  autoplay: true,
});
```

### After Load

```typescript
const rive = new Rive({
  src: 'animation.riv',
  canvas: canvasElement,
  onLoad: () => {
    // Play state machine manually
    rive.play('State Machine 1');
  },
});
```

## Playback Control

### Play and Pause

```typescript
// Play
rive.play();                    // Play all
rive.play('State Machine 1');   // Play specific

// Pause
rive.pause();                   // Pause all
rive.pause('State Machine 1');  // Pause specific

// Stop (resets to initial state)
rive.stop();
rive.stop('State Machine 1');
```

### Checking State

```typescript
// Is anything playing?
const isPlaying = rive.isPlaying;

// Is specific state machine playing?
const states = rive.playingStateMachineNames;
const isSMPlaying = states.includes('State Machine 1');
```

## State Change Callbacks

React to state transitions:

```typescript
const rive = new Rive({
  src: 'animation.riv',
  canvas: canvasElement,
  stateMachines: 'State Machine 1',
  autoplay: true,
  onStateChange: (event) => {
    // event.data is array of current state names
    console.log('Current states:', event.data);

    if (event.data.includes('Success')) {
      handleSuccess();
    }
  },
});
```

## Getting State Machine Instance

Access the state machine for advanced control:

```typescript
rive.onLoad = () => {
  // Get the state machine instance
  const stateMachine = rive.stateMachineInputs('State Machine 1');

  // stateMachine is array of inputs
  // Use for reading/writing input values
};
```

## Switching State Machines

```typescript
// Stop current and start new
rive.stop('State Machine 1');
rive.play('State Machine 2');

// Or reset entirely
rive.reset({
  stateMachines: 'State Machine 2',
  autoplay: true,
});
```

## Pointer Events

State machines can respond to pointer events automatically:

```typescript
// Enable pointer events on the canvas
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Forward to Rive
  rive.pointerMove(x, y);
});

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  rive.pointerDown(e.clientX - rect.left, e.clientY - rect.top);
});

canvas.addEventListener('mouseup', (e) => {
  const rect = canvas.getBoundingClientRect();
  rive.pointerUp(e.clientX - rect.left, e.clientY - rect.top);
});
```

## Touch Events

```typescript
canvas.addEventListener('touchstart', (e) => {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  rive.pointerDown(touch.clientX - rect.left, touch.clientY - rect.top);
});

canvas.addEventListener('touchmove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  rive.pointerMove(touch.clientX - rect.left, touch.clientY - rect.top);
});

canvas.addEventListener('touchend', (e) => {
  const rect = canvas.getBoundingClientRect();
  const touch = e.changedTouches[0];
  rive.pointerUp(touch.clientX - rect.left, touch.clientY - rect.top);
});
```

## Complete Example

```typescript
import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';

class InteractiveButton {
  private rive: Rive;
  private canvas: HTMLCanvasElement;

  constructor(canvasId: string, riveSrc: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;

    this.rive = new Rive({
      src: riveSrc,
      canvas: this.canvas,
      layout: new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
      }),
      stateMachines: 'Button State Machine',
      autoplay: true,
      onLoad: () => this.setupEvents(),
      onStateChange: (e) => this.handleStateChange(e),
    });
  }

  private setupEvents() {
    // Pointer events for hover/click
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.rive.pointerMove(e.clientX - rect.left, e.clientY - rect.top);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.rive.pointerDown(e.clientX - rect.left, e.clientY - rect.top);
    });

    this.canvas.addEventListener('mouseup', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.rive.pointerUp(e.clientX - rect.left, e.clientY - rect.top);
    });

    this.canvas.addEventListener('mouseleave', () => {
      // Reset hover state
      this.rive.pointerUp(0, 0);
    });
  }

  private handleStateChange(event: any) {
    const states = event.data;

    if (states.includes('Pressed')) {
      console.log('Button pressed!');
    }

    if (states.includes('Hovered')) {
      this.canvas.style.cursor = 'pointer';
    } else {
      this.canvas.style.cursor = 'default';
    }
  }

  public disable() {
    this.rive.pause();
  }

  public enable() {
    this.rive.play();
  }

  public destroy() {
    this.rive.cleanup();
  }
}
```

## Mixing State Machines and Animations

```typescript
// Play both state machine and simple animation
const rive = new Rive({
  src: 'animation.riv',
  canvas: canvasElement,
  stateMachines: 'Interactive',
  animations: 'Background Loop',
  autoplay: true,
});
```

## Best Practices

1. **Use state machines for interaction** - Easier than managing animation transitions manually
2. **Name state machines clearly** - Use descriptive names in Rive editor
3. **Forward pointer events** - Enable hover and click behaviors
4. **Listen for state changes** - React to transitions in your app
5. **Handle edge cases** - Mouse leaving canvas, touch cancel, etc.

## Common Pitfalls

**Wrong state machine name**
```typescript
// Bad: typo or wrong name
rive.play('StateMachine1');  // Case sensitive!

// Good: match exactly from Rive editor
rive.play('State Machine 1');
```

**Not forwarding pointer events**
```typescript
// Bad: hover/click won't work
const rive = new Rive({
  stateMachines: 'Hover Button',
  autoplay: true,
});

// Good: forward pointer events
canvas.addEventListener('mousemove', ...);
canvas.addEventListener('mousedown', ...);
// etc.
```

**Playing before load**
```typescript
// Bad: state machine not ready
const rive = new Rive({...});
rive.play('State Machine'); // May fail

// Good: use autoplay or onLoad
const rive = new Rive({
  stateMachines: 'State Machine',
  autoplay: true,
  // or
  onLoad: () => rive.play('State Machine'),
});
```
