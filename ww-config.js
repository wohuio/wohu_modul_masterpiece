export default {
  editor: {
    label: {
      en: "Flow Canvas",
    },
  },
  properties: {
    // JSON Configuration for node types
    nodeTypes: {
      label: { en: "Node Types (JSON Config)" },
      type: "Array",
      defaultValue: [
        {
          id: "base",
          label: "Base Value",
          icon: "💰",
          color: "#10b981",
          calculationType: "fixed",
          defaultValue: 100
        },
        {
          id: "percentage",
          label: "Percentage",
          icon: "📊",
          color: "#3b82f6",
          calculationType: "percentage",
          defaultValue: 10
        },
        {
          id: "multiplier",
          label: "Multiplier",
          icon: "✖️",
          color: "#8b5cf6",
          calculationType: "multiply",
          defaultValue: 1.5
        }
      ],
      bindable: true,
    },

    // Initial nodes on canvas
    initialNodes: {
      label: { en: "Initial Nodes" },
      type: "Array",
      defaultValue: [],
      bindable: true,
    },

    // Canvas styling
    canvasBackgroundColor: {
      label: { en: "Canvas Background" },
      type: "Color",
      defaultValue: "#ffffff",
    },

    gridColor: {
      label: { en: "Grid Color" },
      type: "Color",
      defaultValue: "#e5e7eb",
    },

    gridSize: {
      label: { en: "Grid Size (px)" },
      type: "Number",
      defaultValue: 20,
    },

    showGrid: {
      label: { en: "Show Grid" },
      type: "OnOff",
      defaultValue: true,
    },

    // Node styling
    nodeBackgroundColor: {
      label: { en: "Node Background" },
      type: "Color",
      defaultValue: "#ffffff",
    },

    nodeBorderColor: {
      label: { en: "Node Border" },
      type: "Color",
      defaultValue: "#e5e7eb",
    },

    nodeBorderRadius: {
      label: { en: "Node Border Radius (px)" },
      type: "Number",
      defaultValue: 8,
    },

    // Connection styling
    connectionColor: {
      label: { en: "Connection Line Color" },
      type: "Color",
      defaultValue: "#94a3b8",
    },

    connectionWidth: {
      label: { en: "Connection Line Width" },
      type: "Number",
      defaultValue: 2,
    },

    connectionStyle: {
      label: { en: "Connection Style" },
      type: "TextSelect",
      options: {
        choices: [
          { value: "bezier", label: "Curved (Bezier)" },
          { value: "straight", label: "Straight" },
        ],
      },
      defaultValue: "bezier",
    },

    // Canvas size
    canvasHeight: {
      label: { en: "Canvas Height (px)" },
      type: "Number",
      defaultValue: 800,
    },

    canvasWidth: {
      label: { en: "Canvas Width (px)" },
      type: "Number",
      defaultValue: 1200,
    },
  },
};
