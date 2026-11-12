---
name: callbacks
description: Handling Rive events and callbacks in React components
metadata:
  tags: rive, react, callbacks, events, state-change
---

# Callbacks and Events

Handle Rive lifecycle events and state machine transitions in React.

## Load Callbacks

### onLoad

Called when animation is ready:

```tsx
function AnimationWithLoad() {
  const [isReady, setIsReady] = useState(false);

  const { rive, RiveComponent } = useRive({
    src: 'animation.riv',
    stateMachines: 'State Machine',
    autoplay: true,
    onLoad: () => {
      setIsReady(true);
      console.log('Animation loaded!');
    },
  });

  return (
    <div>
      {!isReady && <div className="loading">Loading...</div>}
      <RiveComponent style={{ opacity: isReady ? 1 : 0 }} />
    </div>
  );
}
```

### onLoadError

Handle loading failures:

```tsx
function SafeAnimation() {
  const [error, setError] = useState<string | null>(null);

  const { RiveComponent } = useRive({
    src: 'animation.riv',
    autoplay: true,
    onLoadError: (e) => {
      console.error('Load error:', e);
      setError('Failed to load animation');
    },
  });

  if (error) {
    return <div className="error">{error}</div>;
  }

  return <RiveComponent />;
}
```

## Playback Callbacks

```tsx
function PlaybackTracking() {
  const [status, setStatus] = useState('idle');

  const { RiveComponent } = useRive({
    src: 'animation.riv',
    autoplay: true,
    onPlay: () => setStatus('playing'),
    onPause: () => setStatus('paused'),
    onStop: () => setStatus('stopped'),
    onLoop: () => console.log('Animation looped'),
  });

  return (
    <div>
      <RiveComponent />
      <span>Status: {status}</span>
    </div>
  );
}
```

## State Change Callback

React to state machine transitions:

```tsx
function StateTracking() {
  const [currentStates, setCurrentStates] = useState<string[]>([]);

  const { RiveComponent } = useRive({
    src: 'interactive.riv',
    stateMachines: 'State Machine',
    autoplay: true,
    onStateChange: (event) => {
      // event.data is array of current state names
      setCurrentStates(event.data);
    },
  });

  return (
    <div>
      <RiveComponent />
      <div>
        Current states: {currentStates.join(', ')}
      </div>
    </div>
  );
}
```

### Using State Changes for App Logic

```tsx
function InteractiveForm() {
  const [formState, setFormState] = useState<'idle' | 'success' | 'error'>('idle');

  const { rive, RiveComponent } = useRive({
    src: 'form-feedback.riv',
    stateMachines: 'Feedback',
    autoplay: true,
    onStateChange: (event) => {
      const states = event.data;

      if (states.includes('Success')) {
        setFormState('success');
        // Trigger next action
        setTimeout(() => navigateToNext(), 1500);
      } else if (states.includes('Error')) {
        setFormState('error');
      }
    },
  });

  const submit = useStateMachineInput(rive, 'Feedback', 'submit');
  const success = useStateMachineInput(rive, 'Feedback', 'success');
  const error = useStateMachineInput(rive, 'Feedback', 'error');

  const handleSubmit = async () => {
    submit?.fire();

    try {
      await api.submitForm();
      success?.fire();
    } catch {
      error?.fire();
    }
  };

  return (
    <div>
      <RiveComponent />
      <button onClick={handleSubmit} disabled={formState !== 'idle'}>
        Submit
      </button>
    </div>
  );
}
```

## Rive Events

Handle custom events fired from state machines:

```tsx
function EventHandling() {
  const { rive, RiveComponent } = useRive({
    src: 'animation.riv',
    stateMachines: 'State Machine',
    autoplay: true,
  });

  useEffect(() => {
    if (!rive) return;

    const handleRiveEvent = (event: any) => {
      const eventName = event.data.name;
      const properties = event.data.properties;

      console.log('Rive event:', eventName, properties);

      switch (eventName) {
        case 'ButtonClicked':
          handleButtonClick();
          break;
        case 'AnimationComplete':
          handleComplete();
          break;
      }
    };

    rive.on('riveevent', handleRiveEvent);

    return () => {
      rive.off('riveevent', handleRiveEvent);
    };
  }, [rive]);

  return <RiveComponent />;
}
```

## Complete Example: Animated Button

```tsx
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useState, useCallback } from 'react';

interface AnimatedButtonProps {
  onClick: () => Promise<void>;
  children: React.ReactNode;
}

function AnimatedButton({ onClick, children }: AnimatedButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { rive, RiveComponent } = useRive({
    src: '/animations/button.riv',
    stateMachines: 'Button',
    autoplay: true,
    onStateChange: (event) => {
      // Track animation state for UI updates
      if (event.data.includes('Complete')) {
        // Reset after animation
        setTimeout(() => setState('idle'), 500);
      }
    },
  });

  const isHovered = useStateMachineInput(rive, 'Button', 'isHovered');
  const isPressed = useStateMachineInput(rive, 'Button', 'isPressed');
  const triggerSuccess = useStateMachineInput(rive, 'Button', 'success');
  const triggerError = useStateMachineInput(rive, 'Button', 'error');
  const triggerLoading = useStateMachineInput(rive, 'Button', 'loading');

  const handleClick = useCallback(async () => {
    if (state !== 'idle') return;

    setState('loading');
    triggerLoading?.fire();

    try {
      await onClick();
      setState('success');
      triggerSuccess?.fire();
    } catch {
      setState('error');
      triggerError?.fire();
    }
  }, [onClick, state, triggerLoading, triggerSuccess, triggerError]);

  return (
    <button
      className="animated-button"
      onClick={handleClick}
      onMouseEnter={() => isHovered && (isHovered.value = true)}
      onMouseLeave={() => isHovered && (isHovered.value = false)}
      onMouseDown={() => isPressed && (isPressed.value = true)}
      onMouseUp={() => isPressed && (isPressed.value = false)}
      disabled={state !== 'idle'}
    >
      <RiveComponent
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      />
      <span className="button-text">{children}</span>
    </button>
  );
}
```

## useCallback for Stable Callbacks

Prevent unnecessary re-renders:

```tsx
function OptimizedCallbacks() {
  const handleLoad = useCallback(() => {
    console.log('Loaded');
  }, []);

  const handleStateChange = useCallback((event: any) => {
    console.log('State:', event.data);
  }, []);

  const { RiveComponent } = useRive({
    src: 'animation.riv',
    autoplay: true,
    onLoad: handleLoad,
    onStateChange: handleStateChange,
  });

  return <RiveComponent />;
}
```

## Best Practices

1. **Stable callback references** - Use useCallback for callbacks passed to useRive
2. **Check rive before adding listeners** - rive is null before load
3. **Cleanup event listeners** - Return cleanup function from useEffect
4. **Handle all states** - Consider loading, error, and success states
5. **Debounce frequent updates** - Don't update state on every frame

## Common Pitfalls

**Recreating callbacks**
```tsx
// Bad: new function every render
const { RiveComponent } = useRive({
  onLoad: () => console.log('Loaded'), // Recreated each render
});

// Good: stable reference
const handleLoad = useCallback(() => console.log('Loaded'), []);
const { RiveComponent } = useRive({
  onLoad: handleLoad,
});
```

**Missing cleanup for event listeners**
```tsx
// Bad: memory leak
useEffect(() => {
  rive?.on('riveevent', handler);
}, [rive]);

// Good: cleanup
useEffect(() => {
  if (!rive) return;
  rive.on('riveevent', handler);
  return () => rive.off('riveevent', handler);
}, [rive]);
```

**State updates after unmount**
```tsx
// Bad: might update unmounted component
onStateChange: (event) => {
  setStates(event.data); // Could cause warning if unmounted
}

// Good: check mounted state
const mounted = useRef(true);
useEffect(() => () => { mounted.current = false }, []);

onStateChange: (event) => {
  if (mounted.current) {
    setStates(event.data);
  }
}
```
