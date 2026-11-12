---
name: layout
description: Layout, Fit, and Alignment options for positioning Rive animations in React
metadata:
  tags: rive, react, layout, fit, alignment, responsive
---

# Layout Configuration

Control how Rive animations fit and align within their container.

## Layout Object

```tsx
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

function LayoutExample() {
  const { RiveComponent } = useRive({
    src: '/animation.riv',
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    autoplay: true,
  });

  return <RiveComponent style={{ width: '100%', height: '400px' }} />;
}
```

## Fit Options

How the animation scales to fit the container:

| Fit | Description | Use When |
|-----|-------------|----------|
| `Fit.Cover` | Scale to cover container, may crop | Background animations, hero sections |
| `Fit.Contain` | Scale to fit entirely, may letterbox | Icons, illustrations with full visibility |
| `Fit.Fill` | Stretch to fill (distorts aspect ratio) | Rarely - only when distortion is acceptable |
| `Fit.FitWidth` | Scale to match container width | Horizontal banners, headers |
| `Fit.FitHeight` | Scale to match container height | Sidebars, vertical layouts |
| `Fit.None` | No scaling, use original size | Pixel-perfect animations |
| `Fit.ScaleDown` | Scale down only if larger than container | Prevent oversized animations |

### Fit Examples

```tsx
// Cover: fills container, crops if needed
const coverLayout = new Layout({
  fit: Fit.Cover,
  alignment: Alignment.Center,
});

// Contain: shows entire animation, may have empty space
const containLayout = new Layout({
  fit: Fit.Contain,
  alignment: Alignment.Center,
});

// FitWidth: matches container width, height adjusts
const widthLayout = new Layout({
  fit: Fit.FitWidth,
  alignment: Alignment.TopCenter,
});

// ScaleDown: only shrinks if too large
const scaleDownLayout = new Layout({
  fit: Fit.ScaleDown,
  alignment: Alignment.Center,
});
```

## Alignment Options

Where the animation positions within the container:

| Alignment | Position |
|-----------|----------|
| `Alignment.Center` | Center of container |
| `Alignment.TopLeft` | Top-left corner |
| `Alignment.TopCenter` | Top edge, centered horizontally |
| `Alignment.TopRight` | Top-right corner |
| `Alignment.CenterLeft` | Left edge, centered vertically |
| `Alignment.CenterRight` | Right edge, centered vertically |
| `Alignment.BottomLeft` | Bottom-left corner |
| `Alignment.BottomCenter` | Bottom edge, centered horizontally |
| `Alignment.BottomRight` | Bottom-right corner |

### Alignment Examples

```tsx
// Logo in top-left
const logoLayout = new Layout({
  fit: Fit.Contain,
  alignment: Alignment.TopLeft,
});

// Character at bottom
const characterLayout = new Layout({
  fit: Fit.Contain,
  alignment: Alignment.BottomCenter,
});

// Background covering everything
const bgLayout = new Layout({
  fit: Fit.Cover,
  alignment: Alignment.Center,
});
```

## Common Patterns

### Full-Screen Background

```tsx
function BackgroundAnimation() {
  const layout = useMemo(() => new Layout({
    fit: Fit.Cover,
    alignment: Alignment.Center,
  }), []);

  const { RiveComponent } = useRive({
    src: '/background.riv',
    layout,
    autoplay: true,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
```

### Responsive Icon

```tsx
function ResponsiveIcon() {
  const layout = useMemo(() => new Layout({
    fit: Fit.Contain,
    alignment: Alignment.Center,
  }), []);

  const { RiveComponent } = useRive({
    src: '/icon.riv',
    layout,
    autoplay: true,
  });

  return (
    <div style={{ width: '48px', height: '48px' }}>
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
```

### Header Banner

```tsx
function HeaderBanner() {
  const layout = useMemo(() => new Layout({
    fit: Fit.FitWidth,
    alignment: Alignment.TopCenter,
  }), []);

  const { RiveComponent } = useRive({
    src: '/banner.riv',
    layout,
    autoplay: true,
  });

  return (
    <header style={{ width: '100%', height: '200px', overflow: 'hidden' }}>
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </header>
  );
}
```

### Sidebar Character

```tsx
function SidebarCharacter() {
  const layout = useMemo(() => new Layout({
    fit: Fit.FitHeight,
    alignment: Alignment.BottomRight,
  }), []);

  const { RiveComponent } = useRive({
    src: '/character.riv',
    layout,
    autoplay: true,
  });

  return (
    <aside style={{ width: '300px', height: '100vh' }}>
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </aside>
  );
}
```

## Dynamic Layout

Change layout based on state or viewport:

```tsx
function DynamicLayout() {
  const [isExpanded, setIsExpanded] = useState(false);

  const layout = useMemo(() => new Layout({
    fit: isExpanded ? Fit.Contain : Fit.Cover,
    alignment: Alignment.Center,
  }), [isExpanded]);

  const { RiveComponent } = useRive({
    src: '/animation.riv',
    layout,
    autoplay: true,
  });

  return (
    <div onClick={() => setIsExpanded(!isExpanded)}>
      <RiveComponent style={{ width: '300px', height: '200px' }} />
    </div>
  );
}
```

## Responsive Layout with Media Queries

```tsx
function ResponsiveLayout() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const layout = useMemo(() => new Layout({
    fit: isMobile ? Fit.FitWidth : Fit.Contain,
    alignment: isMobile ? Alignment.TopCenter : Alignment.Center,
  }), [isMobile]);

  const { RiveComponent } = useRive({
    src: '/animation.riv',
    layout,
    autoplay: true,
  });

  return <RiveComponent style={{ width: '100%', height: '100%' }} />;
}
```

## Best Practices

1. **Memoize Layout** - Create Layout with useMemo to prevent recreating each render
2. **Match container styling** - Ensure container has explicit width/height
3. **Consider aspect ratio** - Use `aspectRatio` CSS for containers
4. **Test all viewports** - Check how Fit behaves at different sizes
5. **Use Cover for backgrounds** - Ensures no empty space

## Common Pitfalls

**Creating Layout in render**
```tsx
// Bad: new Layout every render
function Animation() {
  const { RiveComponent } = useRive({
    layout: new Layout({ fit: Fit.Cover }), // Recreated!
  });
}

// Good: memoize
function Animation() {
  const layout = useMemo(() => new Layout({ fit: Fit.Cover }), []);
  const { RiveComponent } = useRive({ layout });
}
```

**Missing container dimensions**
```tsx
// Bad: container has no size
<div>
  <RiveComponent /> {/* Animation won't show */}
</div>

// Good: explicit dimensions
<div style={{ width: '300px', height: '200px' }}>
  <RiveComponent style={{ width: '100%', height: '100%' }} />
</div>
```

**Using Fill unnecessarily**
```tsx
// Bad: distorts animation
const layout = new Layout({ fit: Fit.Fill });

// Good: use Cover to fill without distortion
const layout = new Layout({ fit: Fit.Cover });
```
