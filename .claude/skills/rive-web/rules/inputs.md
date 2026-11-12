---
name: inputs
description: Reading and writing Rive state machine inputs - Boolean, Number, and Trigger
metadata:
  tags: rive, web, inputs, state-machine, control
---

# State Machine Inputs

Inputs are variables that control state machine behavior. Set them from JavaScript to drive transitions.

## Input Types

| Type | Description | Usage |
|------|-------------|-------|
| **Boolean** | true/false toggle | Switch states on/off |
| **Number** | Numeric value | Progress, levels, sliders |
| **Trigger** | One-shot event | Clicks, completions |

## Getting Inputs

Access inputs after the animation loads:

```typescript
const rive = new Rive({
  src: 'animation.riv',
  canvas: canvasElement,
  stateMachines: 'State Machine',
  autoplay: true,
  onLoad: () => {
    // Get all inputs for a state machine
    const inputs = rive.stateMachineInputs('State Machine');

    console.log('Available inputs:', inputs.map(i => ({
      name: i.name,
      type: i.type,
    })));
  },
});
```

## Finding Specific Inputs

```typescript
// By name
const inputs = rive.stateMachineInputs('State Machine');
const isActive = inputs.find(i => i.name === 'isActive');
const progress = inputs.find(i => i.name === 'progress');
const onClick = inputs.find(i => i.name === 'onClick');
```

## Boolean Inputs

Toggle between two states:

```typescript
const isActive = inputs.find(i => i.name === 'isActive');

if (isActive) {
  // Read current value
  console.log('Is active:', isActive.value);

  // Set value
  isActive.value = true;

  // Toggle
  isActive.value = !isActive.value;
}
```

### Example: Dark Mode Toggle

```typescript
const darkMode = inputs.find(i => i.name === 'isDarkMode');

function toggleDarkMode() {
  if (darkMode) {
    darkMode.value = !darkMode.value;
    document.body.classList.toggle('dark', darkMode.value);
  }
}
```

## Number Inputs

Set numeric values for transitions or blends:

```typescript
const progress = inputs.find(i => i.name === 'progress');

if (progress) {
  // Read current value
  console.log('Progress:', progress.value);

  // Set value (usually 0-100 or 0-1 depending on setup)
  progress.value = 75;
}
```

### Example: Scroll-Linked Animation

```typescript
const scrollProgress = inputs.find(i => i.name === 'scrollProgress');

window.addEventListener('scroll', () => {
  const scrollPercent = window.scrollY /
    (document.body.scrollHeight - window.innerHeight);

  if (scrollProgress) {
    // Map to 0-100 range
    scrollProgress.value = scrollPercent * 100;
  }
});
```

### Example: Slider Control

```typescript
const slider = document.getElementById('slider') as HTMLInputElement;
const level = inputs.find(i => i.name === 'level');

slider.addEventListener('input', () => {
  if (level) {
    level.value = parseInt(slider.value);
  }
});
```

## Trigger Inputs

Fire one-shot events:

```typescript
const onClick = inputs.find(i => i.name === 'onClick');

if (onClick) {
  // Fire the trigger
  onClick.fire();
}
```

### Example: Button Click

```typescript
const buttonTrigger = inputs.find(i => i.name === 'buttonClick');

document.getElementById('submit').addEventListener('click', () => {
  buttonTrigger?.fire();
});
```

### Example: Success Animation

```typescript
const successTrigger = inputs.find(i => i.name === 'showSuccess');
const errorTrigger = inputs.find(i => i.name === 'showError');

async function submitForm() {
  try {
    await api.submit();
    successTrigger?.fire();
  } catch {
    errorTrigger?.fire();
  }
}
```

## Complete Example: Interactive Form

```typescript
import { Rive } from '@rive-app/canvas';

class FormAnimation {
  private rive: Rive;
  private inputs: {
    isFocused: any;
    isValid: any;
    progress: any;
    submit: any;
    success: any;
    error: any;
  } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.rive = new Rive({
      src: 'form-animation.riv',
      canvas,
      stateMachines: 'Form State Machine',
      autoplay: true,
      onLoad: () => this.cacheInputs(),
    });
  }

  private cacheInputs() {
    const all = this.rive.stateMachineInputs('Form State Machine');

    this.inputs = {
      isFocused: all.find(i => i.name === 'isFocused'),
      isValid: all.find(i => i.name === 'isValid'),
      progress: all.find(i => i.name === 'progress'),
      submit: all.find(i => i.name === 'submit'),
      success: all.find(i => i.name === 'success'),
      error: all.find(i => i.name === 'error'),
    };
  }

  focus() {
    if (this.inputs?.isFocused) {
      this.inputs.isFocused.value = true;
    }
  }

  blur() {
    if (this.inputs?.isFocused) {
      this.inputs.isFocused.value = false;
    }
  }

  validate(isValid: boolean) {
    if (this.inputs?.isValid) {
      this.inputs.isValid.value = isValid;
    }
  }

  setProgress(percent: number) {
    if (this.inputs?.progress) {
      this.inputs.progress.value = Math.max(0, Math.min(100, percent));
    }
  }

  submit() {
    this.inputs?.submit?.fire();
  }

  showSuccess() {
    this.inputs?.success?.fire();
  }

  showError() {
    this.inputs?.error?.fire();
  }

  destroy() {
    this.rive.cleanup();
  }
}

// Usage
const form = new FormAnimation(canvas);

inputElement.addEventListener('focus', () => form.focus());
inputElement.addEventListener('blur', () => form.blur());
inputElement.addEventListener('input', () => {
  form.validate(inputElement.checkValidity());
});

submitButton.addEventListener('click', async () => {
  form.submit();
  try {
    await api.submit();
    form.showSuccess();
  } catch {
    form.showError();
  }
});
```

## TypeScript Type Safety

Create typed input helpers:

```typescript
interface InputValue {
  value: boolean | number;
  fire?: () => void;
}

function getInput(
  rive: Rive,
  smName: string,
  inputName: string
): InputValue | null {
  const inputs = rive.stateMachineInputs(smName);
  return inputs?.find(i => i.name === inputName) ?? null;
}

// Usage
const isActive = getInput(rive, 'SM', 'isActive');
if (isActive) {
  isActive.value = true;
}
```

## Best Practices

1. **Cache inputs** - Get inputs once in onLoad, not every time you need them
2. **Check for null** - Inputs might not exist if name is wrong
3. **Use descriptive names** - Match JavaScript code to Rive editor naming
4. **Validate ranges** - Clamp number values to expected ranges
5. **Debounce frequent updates** - Don't flood number inputs on scroll/mousemove

## Common Pitfalls

**Accessing inputs before load**
```typescript
// Bad: inputs not ready
const rive = new Rive({...});
const input = rive.stateMachineInputs('SM'); // undefined!

// Good: wait for onLoad
const rive = new Rive({
  onLoad: () => {
    const input = rive.stateMachineInputs('SM');
  }
});
```

**Wrong input name**
```typescript
// Bad: case sensitive, exact match required
const input = inputs.find(i => i.name === 'isactive');  // Wrong case

// Good: match exactly from Rive editor
const input = inputs.find(i => i.name === 'isActive');
```

**Setting value on trigger**
```typescript
// Bad: triggers don't have values
const trigger = inputs.find(i => i.name === 'onClick');
trigger.value = true;  // Doesn't work!

// Good: use fire() for triggers
trigger.fire();
```

**Not checking input exists**
```typescript
// Bad: crashes if input missing
inputs.find(i => i.name === 'missing').value = true;

// Good: null check
const input = inputs.find(i => i.name === 'maybe');
if (input) {
  input.value = true;
}
// Or optional chaining
inputs.find(i => i.name === 'maybe')?.fire?.();
```
