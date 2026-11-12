---
name: loading
description: Loading and initializing Rive animations on the web
metadata:
  tags: rive, web, loading, initialization, canvas
---

# Loading Rive Animations

The Rive class is the main entry point for loading and controlling animations.

## Basic Loading

```typescript
import { Rive } from '@rive-app/canvas';

const rive = new Rive({
  src: 'path/to/animation.riv',
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  autoplay: true,
});
```

## Constructor Options

```typescript
interface RiveOptions {
  // Required
  canvas: HTMLCanvasElement;

  // Source (one of these)
  src?: string;           // URL to .riv file
  buffer?: ArrayBuffer;   // Raw .riv data

  // Playback
  autoplay?: boolean;     // Start immediately (default: false)
  stateMachines?: string | string[];  // State machine(s) to play
  animations?: string | string[];     // Animation(s) to play

  // Artboard
  artboard?: string;      // Artboard name (default: first)

  // Layout
  layout?: Layout;        // Fit and alignment

  // Callbacks
  onLoad?: () => void;
  onLoadError?: (error: Error) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onLoop?: () => void;
  onStateChange?: (event: StateChangeEvent) => void;
  onAdvance?: (event: AdvanceEvent) => void;
}
```

## Loading from Different Sources

### From URL

```typescript
const rive = new Rive({
  src: '/animations/button.riv',
  canvas: canvasElement,
  autoplay: true,
});
```

### From ArrayBuffer

```typescript
// Fetch the file yourself
const response = await fetch('/animations/button.riv');
const buffer = await response.arrayBuffer();

const rive = new Rive({
  buffer: buffer,
  canvas: canvasElement,
  autoplay: true,
});
```

### From CDN

```typescript
const rive = new Rive({
  src: 'https://cdn.example.com/animations/hero.riv',
  canvas: canvasElement,
  autoplay: true,
});
```

## Specifying Artboard

If your .riv file has multiple artboards:

```typescript
const rive = new Rive({
  src: 'multi-artboard.riv',
  canvas: canvasElement,
  artboard: 'Mobile',  // Use specific artboard
  autoplay: true,
});
```

## Playing Content

### State Machines (Recommended)

```typescript
const rive = new Rive({
  src: 'interactive.riv',
  canvas: canvasElement,
  stateMachines: 'State Machine 1',  // Single
  autoplay: true,
});

// Or multiple
const rive = new Rive({
  src: 'interactive.riv',
  canvas: canvasElement,
  stateMachines: ['SM1', 'SM2'],     // Multiple
  autoplay: true,
});
```

### Simple Animations

For non-interactive animations:

```typescript
const rive = new Rive({
  src: 'simple.riv',
  canvas: canvasElement,
  animations: 'Idle',    // Animation name from Rive
  autoplay: true,
});
```

## Layout Options

Control how the animation fits the canvas:

```typescript
import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';

const rive = new Rive({
  src: 'animation.riv',
  canvas: canvasElement,
  layout: new Layout({
    fit: Fit.Contain,           // How to scale
    alignment: Alignment.Center, // Where to position
  }),
  autoplay: true,
});
```

### Fit Options

| Fit | Description |
|-----|-------------|
| `Fit.Cover` | Scale to fill, may crop |
| `Fit.Contain` | Scale to fit, may letterbox |
| `Fit.Fill` | Stretch to fill exactly |
| `Fit.FitWidth` | Fit to canvas width |
| `Fit.FitHeight` | Fit to canvas height |
| `Fit.None` | No scaling (1:1) |
| `Fit.ScaleDown` | Like Contain, but never scale up |

### Alignment Options

| Alignment | Description |
|-----------|-------------|
| `Alignment.Center` | Center in canvas |
| `Alignment.TopLeft` | Top-left corner |
| `Alignment.TopCenter` | Top center |
| `Alignment.TopRight` | Top-right corner |
| `Alignment.CenterLeft` | Center left |
| `Alignment.CenterRight` | Center right |
| `Alignment.BottomLeft` | Bottom-left corner |
| `Alignment.BottomCenter` | Bottom center |
| `Alignment.BottomRight` | Bottom-right corner |

## Callbacks

### onLoad

Called when animation is ready:

```typescript
const rive = new Rive({
  src: 'animation.riv',
  canvas: canvasElement,
  onLoad: () => {
    // Safe to access inputs, play, etc.
    const inputs = rive.stateMachineInputs('State Machine');
    console.log('Loaded with inputs:', inputs);
  },
});
```

### onLoadError

Handle loading failures:

```typescript
const rive = new Rive({
  src: 'animation.riv',
  canvas: canvasElement,
  onLoadError: (error) => {
    console.error('Failed to load:', error);
    // Show fallback content
  },
});
```

### onStateChange

React to state machine transitions:

```typescript
const rive = new Rive({
  src: 'animation.riv',
  canvas: canvasElement,
  stateMachines: 'State Machine',
  onStateChange: (event) => {
    console.log('States:', event.data);
    // event.data is array of current state names
  },
  autoplay: true,
});
```

## Resizing

Update canvas size dynamically:

```typescript
function resizeCanvas() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Notify Rive of resize
  rive.resizeDrawingSurfaceToCanvas();
}

window.addEventListener('resize', resizeCanvas);
```

## Cleanup

Always cleanup when removing the animation:

```typescript
// When component unmounts or animation is no longer needed
rive.cleanup();
```

## Complete Example

```typescript
import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';

class RiveAnimation {
  private rive: Rive | null = null;

  async init(canvasId: string, src: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;

    if (!canvas) {
      throw new Error(`Canvas ${canvasId} not found`);
    }

    // Size canvas to container
    const container = canvas.parentElement;
    canvas.width = container?.clientWidth ?? 800;
    canvas.height = container?.clientHeight ?? 600;

    this.rive = new Rive({
      src,
      canvas,
      layout: new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
      }),
      stateMachines: 'State Machine 1',
      autoplay: true,
      onLoad: () => this.onLoaded(),
      onLoadError: (e) => this.onError(e),
      onStateChange: (e) => this.onStateChange(e),
    });
  }

  private onLoaded() {
    console.log('Animation ready');
  }

  private onError(error: Error) {
    console.error('Load failed:', error);
  }

  private onStateChange(event: any) {
    console.log('State:', event.data);
  }

  destroy() {
    this.rive?.cleanup();
    this.rive = null;
  }
}
```

## Best Practices

1. **Always use onLoad** - Don't access inputs before animation loads
2. **Cleanup on unmount** - Prevents memory leaks
3. **Handle errors** - Provide fallback for failed loads
4. **Use state machines** - Prefer over manual animations
5. **Resize handling** - Call `resizeDrawingSurfaceToCanvas()` on resize

## Common Pitfalls

**Accessing inputs before load**
```typescript
// Bad: inputs not ready yet
const rive = new Rive({...});
const inputs = rive.stateMachineInputs('SM'); // undefined!

// Good: wait for onLoad
const rive = new Rive({
  onLoad: () => {
    const inputs = rive.stateMachineInputs('SM'); // Ready
  }
});
```

**Forgetting cleanup**
```typescript
// Bad: memory leak
useEffect(() => {
  const rive = new Rive({...});
}, []);

// Good: cleanup on unmount
useEffect(() => {
  const rive = new Rive({...});
  return () => rive.cleanup();
}, []);
```

**Wrong canvas size**
```typescript
// Bad: canvas has no size
<canvas id="rive"></canvas>

// Good: size canvas appropriately
<canvas id="rive" width="400" height="300"></canvas>
// Or set via JS
canvas.width = 400;
canvas.height = 300;
```
