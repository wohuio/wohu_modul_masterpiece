# Flow Canvas - WeWeb Custom Element

A powerful, fully customizable flow-based calculation canvas for WeWeb.

## Features

✅ **100% JSON Configurable** - Define node types, colors, calculations via JSON/API
✅ **Native Canvas API** - Smooth connection lines with grid background
✅ **HTML/CSS Nodes** - Perfect usability and styling control
✅ **Drag & Drop** - Move nodes and create connections intuitively
✅ **Live Calculations** - Real-time value propagation through the flow
✅ **Modern UI** - Clean, professional interface

## Development

```bash
npm install
npm run serve
```

Then add the element in WeWeb editor using `https://localhost:8080/`

## Configuration

All visual and functional aspects are configurable through WeWeb properties:

### Node Types (JSON)
Define custom node types with:
- `id`: Unique identifier
- `label`: Display name
- `icon`: Emoji or icon
- `color`: Header color
- `calculationType`: fixed, percentage, multiply, add, subtract
- `defaultValue`: Initial value

### Styling
- Canvas background, grid size, grid color
- Node styling (background, border, radius)
- Connection styling (color, width, bezier/straight)

### Calculation Types
- **fixed**: Returns the node's value
- **percentage**: Adds percentage to input (e.g., +10%)
- **multiply**: Multiplies input by value
- **add**: Adds value to input
- **subtract**: Subtracts value from input

## Technology

- Native HTML5 Canvas API (no external libraries!)
- Vue.js 3
- WeWeb Custom Element API
