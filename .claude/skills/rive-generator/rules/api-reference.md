---
name: api-reference
description: RiveFile class API reference
metadata:
  tags: rive, generator, api
---

# RiveFile API Reference

## Constructor

```typescript
const riv = new RiveFile();
// Automatically creates Backboard (required)
```

## Methods

### addArtboard(options)

Create the main canvas for the animation.

```typescript
const artboard = riv.addArtboard({
  name: string,      // Artboard name
  width: number,     // Canvas width in pixels
  height: number,    // Canvas height in pixels
  originX?: number,  // Origin X (default: 0)
  originY?: number,  // Origin Y (default: 0)
});
// Returns: artboard ID (number)
```

### addShape(parentId, options)

Add a shape container. Shapes hold paths (Ellipse, Rectangle) and paints (Fill, Stroke).

```typescript
const shape = riv.addShape(artboard, {
  name?: string,  // Shape name
  x?: number,     // X position (center of shape)
  y?: number,     // Y position (center of shape)
});
// Returns: shape ID (number)
```

### addEllipse(parentId, options)

Add an ellipse/circle path to a shape.

```typescript
riv.addEllipse(shape, {
  name?: string,   // Path name
  width: number,   // Ellipse width
  height: number,  // Ellipse height (same as width for circle)
  x?: number,      // Offset X
  y?: number,      // Offset Y
});
```

### addRectangle(parentId, options)

Add a rectangle path to a shape.

```typescript
riv.addRectangle(shape, {
  name?: string,
  width: number,
  height: number,
  x?: number,
  y?: number,
  cornerRadius?: number,  // Rounded corners
});
```

### addFill(parentId, options)

Add a fill paint to a shape.

```typescript
const fill = riv.addFill(shape, {
  name?: string,
  isVisible?: boolean,
  fillRule?: number,  // 0=nonZero, 1=evenOdd
});
// Returns: fill ID (number)
```

### addStroke(parentId, options)

Add a stroke paint to a shape.

```typescript
const stroke = riv.addStroke(shape, {
  name?: string,
  thickness?: number,  // Stroke width
  cap?: number,        // 0=butt, 1=round, 2=square
  join?: number,       // 0=miter, 1=round, 2=bevel
});
// Returns: stroke ID (number)
```

### addSolidColor(parentId, color, name?)

Add a solid color to a Fill or Stroke.

```typescript
riv.addSolidColor(fill, hex('#3498db'), 'Blue');
// color: ARGB number (use hex() or rgba() helpers)
```

### export()

Export to .riv binary format.

```typescript
const buffer = riv.export();
writeFileSync('output/my-file.riv', buffer);
```

## Color Helpers

```typescript
import { hex, rgba } from './src/rive-file.ts';

hex('#3498db')        // Parse hex color
hex('#ff5733')        // Orange
rgba(52, 152, 219, 255)  // Blue with full opacity
rgba(255, 0, 0, 128)     // Semi-transparent red
```

## Complete Example

```typescript
import { writeFileSync } from 'fs';
import { RiveFile, hex } from './src/rive-file.ts';

const riv = new RiveFile();

// Artboard
const artboard = riv.addArtboard({
  name: 'Logo',
  width: 500,
  height: 500,
});

// Circle
const circle = riv.addShape(artboard, { x: 250, y: 250 });
riv.addEllipse(circle, { width: 200, height: 200 });
const circleFill = riv.addFill(circle);
riv.addSolidColor(circleFill, hex('#e74c3c'));

// Rectangle behind
const rect = riv.addShape(artboard, { x: 250, y: 400 });
riv.addRectangle(rect, { width: 300, height: 50, cornerRadius: 10 });
const rectFill = riv.addFill(rect);
riv.addSolidColor(rectFill, hex('#2ecc71'));

writeFileSync('output/logo.riv', riv.export());
```
