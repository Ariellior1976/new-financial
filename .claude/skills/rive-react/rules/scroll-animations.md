---
name: scroll-animations
description: Implementing scroll-based and parallax animations with Rive in React
metadata:
  tags: rive, react, scroll, parallax, animation, intersection
---

# Scroll-Based Animations

Drive Rive animations with scroll position for parallax effects and scroll-triggered sequences.

## Basic Scroll Progress

Map scroll position to a state machine number input:

```tsx
import { useRive } from '@rive-app/react-canvas';
import { useEffect, useRef } from 'react';

function ScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { rive, RiveComponent } = useRive({
    src: '/scroll-animation.riv',
    stateMachines: 'ScrollMachine',
    autoplay: true,
  });

  useEffect(() => {
    if (!rive) return;

    const progressInput = rive.stateMachineInputs('ScrollMachine')
      ?.find(i => i.name === 'scrollProgress');

    const handleScroll = () => {
      if (!containerRef.current || !progressInput) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate progress: 0 when entering viewport, 100 when leaving
      const progress = Math.max(0, Math.min(100,
        ((windowHeight - rect.top) / (windowHeight + rect.height)) * 100
      ));

      progressInput.value = progress;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, [rive]);

  return (
    <div ref={containerRef} style={{ height: '200vh' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
        <RiveComponent style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
```

## Sticky Scroll Scene

Full-screen animation that plays as user scrolls through:

```tsx
function StickyScrollScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { rive, RiveComponent } = useRive({
    src: '/story.riv',
    stateMachines: 'Timeline',
    autoplay: true,
  });

  useEffect(() => {
    if (!rive) return;

    const timeline = rive.stateMachineInputs('Timeline')
      ?.find(i => i.name === 'progress');

    const handleScroll = () => {
      if (!containerRef.current || !timeline) return;

      const container = containerRef.current;
      const scrollTop = window.scrollY - container.offsetTop;
      const scrollHeight = container.scrollHeight - window.innerHeight;

      // 0-100 based on scroll through container
      const progress = Math.max(0, Math.min(100,
        (scrollTop / scrollHeight) * 100
      ));

      timeline.value = progress;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [rive]);

  return (
    <div ref={containerRef} style={{ height: '300vh' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        width: '100%',
      }}>
        <RiveComponent style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
```

## Intersection Observer Trigger

Play animation when element enters viewport:

```tsx
function ScrollTriggered() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  const { rive, RiveComponent } = useRive({
    src: '/reveal.riv',
    stateMachines: 'Reveal',
    autoplay: false, // Don't autoplay
  });

  useEffect(() => {
    if (!containerRef.current || hasPlayed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && rive) {
          rive.play();
          setHasPlayed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 } // Trigger at 50% visibility
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [rive, hasPlayed]);

  return (
    <div ref={containerRef}>
      <RiveComponent style={{ width: '400px', height: '300px' }} />
    </div>
  );
}
```

## Parallax Layers

Multiple animations at different scroll speeds:

```tsx
function ParallaxScene() {
  const { rive: bgRive, RiveComponent: BgComponent } = useRive({
    src: '/background.riv',
    stateMachines: 'Parallax',
    autoplay: true,
  });

  const { rive: fgRive, RiveComponent: FgComponent } = useRive({
    src: '/foreground.riv',
    stateMachines: 'Parallax',
    autoplay: true,
  });

  useEffect(() => {
    const bgProgress = bgRive?.stateMachineInputs('Parallax')
      ?.find(i => i.name === 'scroll');
    const fgProgress = fgRive?.stateMachineInputs('Parallax')
      ?.find(i => i.name === 'scroll');

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const normalized = scrollY / maxScroll;

      // Background moves slower (0.3x)
      if (bgProgress) bgProgress.value = normalized * 30;
      // Foreground moves faster (1x)
      if (fgProgress) fgProgress.value = normalized * 100;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [bgRive, fgRive]);

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <BgComponent style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
      <FgComponent style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
    </div>
  );
}
```

## Debounced Scroll Handler

Prevent performance issues with rapid scroll events:

```tsx
function useScrollProgress(rive: any, stateMachine: string, inputName: string) {
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!rive) return;

    const input = rive.stateMachineInputs(stateMachine)
      ?.find((i: any) => i.name === inputName);

    const handleScroll = () => {
      if (rafRef.current) return; // Skip if pending

      rafRef.current = requestAnimationFrame(() => {
        if (!input) return;

        const scrollY = window.scrollY;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        input.value = (scrollY / maxScroll) * 100;

        rafRef.current = undefined;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [rive, stateMachine, inputName]);
}

// Usage
function OptimizedScroll() {
  const { rive, RiveComponent } = useRive({
    src: '/animation.riv',
    stateMachines: 'Scroll',
    autoplay: true,
  });

  useScrollProgress(rive, 'Scroll', 'progress');

  return <RiveComponent style={{ width: '100%', height: '100vh' }} />;
}
```

## Horizontal Scroll

Drive animation with horizontal scroll:

```tsx
function HorizontalScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { rive, RiveComponent } = useRive({
    src: '/horizontal.riv',
    stateMachines: 'HScroll',
    autoplay: true,
  });

  useEffect(() => {
    if (!rive || !scrollRef.current) return;

    const progress = rive.stateMachineInputs('HScroll')
      ?.find(i => i.name === 'progress');

    const container = scrollRef.current;

    const handleScroll = () => {
      if (!progress) return;
      const scrollLeft = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      progress.value = (scrollLeft / maxScroll) * 100;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [rive]);

  return (
    <div
      ref={scrollRef}
      style={{
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        width: '100%',
      }}
    >
      <div style={{ width: '300vw', height: '100vh', display: 'inline-block' }}>
        <RiveComponent style={{ width: '100vw', height: '100%', position: 'sticky', left: 0 }} />
      </div>
    </div>
  );
}
```

## Best Practices

1. **Use passive listeners** - `{ passive: true }` for scroll events
2. **Debounce with RAF** - Use requestAnimationFrame to batch updates
3. **Sticky positioning** - Keep animation visible during scroll
4. **Clean up observers** - Always disconnect IntersectionObserver
5. **Calculate once** - Cache DOM measurements outside scroll handler

## Common Pitfalls

**Recalculating layout in scroll handler**
```tsx
// Bad: forces layout recalculation every scroll
const handleScroll = () => {
  const height = container.offsetHeight; // Layout thrashing
  // ...
};

// Good: cache measurements
const height = useRef(0);
useEffect(() => {
  height.current = container.offsetHeight;
}, []);
```

**Missing passive flag**
```tsx
// Bad: can block scrolling
window.addEventListener('scroll', handleScroll);

// Good: passive for performance
window.addEventListener('scroll', handleScroll, { passive: true });
```

**Not cleaning up RAF**
```tsx
// Bad: RAF can fire after unmount
useEffect(() => {
  const raf = requestAnimationFrame(update);
  return () => {}; // Missing cleanup!
}, []);

// Good: cancel pending RAF
useEffect(() => {
  const raf = requestAnimationFrame(update);
  return () => cancelAnimationFrame(raf);
}, []);
```
