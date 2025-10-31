export default {
  editor: {
    label: {
      en: "Flow Canvas",
    },
  },
  properties: {
    // === DATA CONFIGURATION ===
    nodeTypes: {
      label: { en: "Node Types (JSON Config)" },
      type: "Array",
      section: "settings",
      options: {
        item: {
          type: "Object",
          options: {
            item: {
              id: { type: "Text", label: { en: "ID" } },
              label: { type: "Text", label: { en: "Label" } },
              icon: { type: "Text", label: { en: "Icon (Emoji)" } },
              color: { type: "Color", label: { en: "Color" } },
              calculationType: {
                type: "TextSelect",
                label: { en: "Calculation Type" },
                options: {
                  choices: [
                    { value: "fixed", label: "Fixed Value" },
                    { value: "percentage", label: "Percentage" },
                    { value: "multiply", label: "Multiply" },
                    { value: "add", label: "Add" },
                    { value: "subtract", label: "Subtract" },
                  ],
                },
              },
              defaultValue: { type: "Number", label: { en: "Default Value" } },
            },
          },
        },
      },
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

    initialNodes: {
      label: { en: "Initial Nodes (API Input)" },
      type: "Array",
      section: "settings",
      options: {
        item: {
          type: "Object",
          options: {
            item: {
              typeId: { type: "Text", label: { en: "Node Type ID" } },
              x: { type: "Number", label: { en: "X Position" } },
              y: { type: "Number", label: { en: "Y Position" } },
              value: { type: "Number", label: { en: "Initial Value" } },
            },
          },
        },
      },
      defaultValue: [],
      bindable: true,
    },

    initialEdges: {
      label: { en: "Initial Edges (API Input)" },
      type: "Array",
      section: "settings",
      options: {
        item: {
          type: "Object",
          options: {
            item: {
              source: { type: "Text", label: { en: "Source Node ID" } },
              target: { type: "Text", label: { en: "Target Node ID" } },
            },
          },
        },
      },
      defaultValue: [],
      bindable: true,
    },

    // === API CONFIGURATION ===
    enableAutoSave: {
      label: { en: "Auto-save on Change" },
      type: "OnOff",
      section: "settings",
      defaultValue: false,
    },

    autoSaveDelay: {
      label: { en: "Auto-save Delay (ms)" },
      type: "Number",
      section: "settings",
      defaultValue: 1000,
      hidden: (content) => !content.enableAutoSave,
    },

    // === FEATURES ===
    showMiniMap: {
      label: { en: "Show Mini Map" },
      type: "OnOff",
      section: "settings",
      defaultValue: true,
    },

    showControls: {
      label: { en: "Show Controls" },
      type: "OnOff",
      section: "settings",
      defaultValue: true,
    },

    enableNodeDeletion: {
      label: { en: "Enable Node Deletion" },
      type: "OnOff",
      section: "settings",
      defaultValue: true,
    },

    enableEdgeDeletion: {
      label: { en: "Enable Edge Deletion" },
      type: "OnOff",
      section: "settings",
      defaultValue: true,
    },

    // === CANVAS STYLING ===
    canvasBackgroundColor: {
      label: { en: "Canvas Background" },
      type: "Color",
      section: "style",
      defaultValue: "#fafafa",
    },

    gridColor: {
      label: { en: "Grid Color" },
      type: "Color",
      section: "style",
      defaultValue: "#e5e7eb",
    },

    gridSize: {
      label: { en: "Grid Size (px)" },
      type: "Number",
      section: "style",
      defaultValue: 20,
    },

    showGrid: {
      label: { en: "Show Grid" },
      type: "OnOff",
      section: "style",
      defaultValue: true,
    },

    // === NODE STYLING ===
    nodeBackgroundColor: {
      label: { en: "Node Background" },
      type: "Color",
      section: "style",
      defaultValue: "#ffffff",
    },

    nodeBorderColor: {
      label: { en: "Node Border" },
      type: "Color",
      section: "style",
      defaultValue: "#e5e7eb",
    },

    nodeBorderRadius: {
      label: { en: "Node Border Radius (px)" },
      type: "Number",
      section: "style",
      defaultValue: 12,
    },

    nodeShadow: {
      label: { en: "Node Shadow" },
      type: "TextSelect",
      section: "style",
      options: {
        choices: [
          { value: "none", label: "None" },
          { value: "sm", label: "Small" },
          { value: "md", label: "Medium" },
          { value: "lg", label: "Large" },
          { value: "xl", label: "Extra Large" },
        ],
      },
      defaultValue: "md",
    },

    nodeWidth: {
      label: { en: "Node Width (px)" },
      type: "Number",
      section: "style",
      defaultValue: 280,
    },

    // === CONNECTION STYLING ===
    connectionColor: {
      label: { en: "Connection Line Color" },
      type: "Color",
      section: "style",
      defaultValue: "#b1b1b7",
    },

    connectionWidth: {
      label: { en: "Connection Line Width" },
      type: "Number",
      section: "style",
      defaultValue: 2,
    },

    connectionStyle: {
      label: { en: "Connection Style" },
      type: "TextSelect",
      section: "style",
      options: {
        choices: [
          { value: "bezier", label: "Curved (Bezier)" },
          { value: "straight", label: "Straight" },
        ],
      },
      defaultValue: "bezier",
    },

    connectionHoverColor: {
      label: { en: "Connection Hover Color" },
      type: "Color",
      section: "style",
      defaultValue: "#2563eb",
    },

    // === CANVAS SIZE ===
    canvasHeight: {
      label: { en: "Canvas Height (px)" },
      type: "Number",
      section: "style",
      defaultValue: 800,
    },

    canvasWidth: {
      label: { en: "Canvas Width (px)" },
      type: "Number",
      section: "style",
      defaultValue: 1200,
    },
  },
};
