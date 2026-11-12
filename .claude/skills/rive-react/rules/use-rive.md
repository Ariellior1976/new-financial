---
name: use-rive
description: Using the useRive hook and RiveComponent in React applications
metadata:
  tags: rive, react, useRive, hooks, components
---

# useRive Hook

The `useRive` hook is the primary way to integrate Rive animations in React.

## Basic Usage

```tsx
import { useRive } from '@rive-app/react-canvas';

function Animation() {
  const { RiveComponent } = useRive({
    src: 'animation.riv',
    autoplay: true,
  });

  return <RiveComponent />;
}
```

## Hook Options

```tsx
interface UseRiveOptions {
  // Source
  src?: string;           // URL to .riv file
  buffer?: ArrayBuffer;   // Raw .riv data

  // Content
  artboard?: string;      // Artboard name
  stateMachines?: string | string[];
  animations?: string | string[];
  autoplay?: boolean;

  // Layout
  layout?: Layout;

  // Callbacks
  onLoad?: () => void;
  onLoadError?: (e: Error) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onLoop?: () => void;
  onStateChange?: (event: Event) => void;

  // Advanced
  shouldDisableRiveListeners?: boolean;
}
```

## Hook Return Value

```tsx
const {
  RiveComponent,  // React component to render
  rive,          // Rive instance (or null before load)
  canvas,        // Canvas ref
} = useRive(options);
```

## Styling the Component

```tsx
function StyledAnimation() {
  const { RiveComponent } = useRive({
    src: 'animation.riv',
    autoplay: true,
  });

  return (
    <RiveComponent
      style={{ width: '400px', height: '300px' }}
      className="my-animation"
    />
  );
}
```

## Responsive Sizing

```tsx
function ResponsiveAnimation() {
  const { RiveComponent } = useRive({
    src: 'animation.riv',
    autoplay: true,
  });

  return (
    <div style={{ width: '100%', aspectRatio: '16/9' }}>
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
```

## With State Machines

```tsx
function InteractiveAnimation() {
  const { RiveComponent } = useRive({
    src: 'interactive.riv',
    stateMachines: 'Button State',
    autoplay: true,
  });

  // Pointer events are automatically forwarded
  return <RiveComponent style={{ width: '200px', height: '60px' }} />;
}
```

## Accessing the Rive Instance

```tsx
function ControlledAnimation() {
  const { rive, RiveComponent } = useRive({
    src: 'animation.riv',
    stateMachines: 'Controls',
    autoplay: true,
  });

  const play = () => rive?.play();
  const pause = () => rive?.pause();
  const stop = () => rive?.stop();

  return (
    <>
      <RiveComponent />
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
      <button onClick={stop}>Stop</button>
    </>
  );
}
```

## Using State Machine Inputs

```tsx
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

function InputExample() {
  const { rive, RiveComponent } = useRive({
    src: 'form.riv',
    stateMachines: 'Form',
    autoplay: true,
  });

  // Get inputs by name
  const isValid = useStateMachineInput(rive, 'Form', 'isValid');
  const progress = useStateMachineInput(rive, 'Form', 'progress');
  const submit = useStateMachineInput(rive, 'Form', 'submit');

  const handleValidation = (valid: boolean) => {
    if (isValid) isValid.value = valid;
  };

  const handleProgress = (value: number) => {
    if (progress) progress.value = value;
  };

  const handleSubmit = () => {
    submit?.fire();
  };

  return (
    <>
      <RiveComponent />
      <button onClick={() => handleValidation(true)}>Mark Valid</button>
      <input
        type="range"
        min="0"
        max="100"
        onChange={(e) => handleProgress(+e.target.value)}
      />
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
}
```

## Layout Control

```tsx
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

function LayoutExample() {
  const { RiveComponent } = useRive({
    src: 'animation.riv',
    layout: new Layout({
      fit: Fit.Cover,
      alignment: Alignment.Center,
    }),
    autoplay: true,
  });

  return <RiveComponent style={{ width: '100%', height: '100vh' }} />;
}
```

## Loading from Buffer

```tsx
function BufferExample() {
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    fetch('/animation.riv')
      .then((res) => res.arrayBuffer())
      .then(setBuffer);
  }, []);

  const { RiveComponent } = useRive(
    buffer ? { buffer, autoplay: true } : null
  );

  if (!buffer) return <div>Loading...</div>;

  return <RiveComponent />;
}
```

## Conditional Rendering

```tsx
function ConditionalAnimation({ showAnimation }: { showAnimation: boolean }) {
  // useRive handles cleanup automatically on unmount
  const { RiveComponent } = useRive({
    src: 'animation.riv',
    autoplay: true,
  });

  if (!showAnimation) return null;

  return <RiveComponent />;
}
```

## Multiple Animations

```tsx
function MultipleAnimations() {
  const animation1 = useRive({
    src: 'hero.riv',
    autoplay: true,
  });

  const animation2 = useRive({
    src: 'background.riv',
    autoplay: true,
  });

  return (
    <div className="stack">
      <animation2.RiveComponent className="background" />
      <animation1.RiveComponent className="foreground" />
    </div>
  );
}
```

## Error Handling

```tsx
function SafeAnimation() {
  const [error, setError] = useState<Error | null>(null);

  const { RiveComponent } = useRive({
    src: 'animation.riv',
    autoplay: true,
    onLoadError: (e) => setError(e),
  });

  if (error) {
    return <div className="fallback">Animation failed to load</div>;
  }

  return <RiveComponent />;
}
```

## Best Practices

1. **Let React handle cleanup** - useRive cleans up on unmount automatically
2. **Style the component** - Set width/height via style prop
3. **Use useStateMachineInput** - Type-safe input access
4. **Check for null** - rive instance is null before load
5. **Responsive containers** - Use CSS for responsive sizing

## Common Pitfalls

**Not styling the component**
```tsx
// Bad: no size, animation won't show
<RiveComponent />

// Good: explicit size
<RiveComponent style={{ width: '300px', height: '200px' }} />
```

**Accessing rive before load**
```tsx
// Bad: rive is null initially
const { rive } = useRive({...});
rive.play(); // Crash!

// Good: null check
rive?.play();
```

**Creating Layout in render**
```tsx
// Bad: creates new Layout every render
function Animation() {
  const { RiveComponent } = useRive({
    layout: new Layout({ fit: Fit.Cover }), // New object each render
  });
}

// Good: stable reference
const layout = useMemo(() => new Layout({ fit: Fit.Cover }), []);
function Animation() {
  const { RiveComponent } = useRive({ layout });
}
```
