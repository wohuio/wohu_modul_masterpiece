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
                    { value: "formula", label: "Custom Formula" },
                    { value: "advanced", label: "Advanced Multi-Step" },
                  ],
                },
                defaultValue: "fixed",
              },
              calculationSteps: {
                type: "Array",
                label: { en: "Calculation Steps (Advanced Mode)" },
                options: {
                  item: {
                    type: "Object",
                    options: {
                      item: {
                        type: {
                          type: "TextSelect",
                          label: { en: "Step Type" },
                          options: {
                            choices: [
                              { value: "formula", label: "Formula" },
                              { value: "condition", label: "If/Else Condition" },
                              { value: "aggregate", label: "Aggregate Function" },
                              { value: "variable", label: "Set Variable" },
                            ],
                          },
                          defaultValue: "formula",
                        },
                        name: { type: "Text", label: { en: "Step Name / Variable" }, defaultValue: "" },
                        formula: { type: "Text", label: { en: "Formula / Expression" }, defaultValue: "" },
                        condition: { type: "Text", label: { en: "Condition (for if/else)" }, defaultValue: "" },
                        trueValue: { type: "Text", label: { en: "True Value" }, defaultValue: "" },
                        falseValue: { type: "Text", label: { en: "False Value" }, defaultValue: "" },
                        aggregateType: {
                          type: "TextSelect",
                          label: { en: "Aggregate Type" },
                          options: {
                            choices: [
                              { value: "sum", label: "Sum" },
                              { value: "avg", label: "Average" },
                              { value: "min", label: "Minimum" },
                              { value: "max", label: "Maximum" },
                              { value: "count", label: "Count" },
                            ],
                          },
                          defaultValue: "sum",
                        },
                        description: { type: "Text", label: { en: "Description" }, defaultValue: "" },
                      },
                    },
                  },
                },
                defaultValue: [],
              },
              formula: {
                type: "Text",
                label: { en: "Custom Formula (use 'input' and 'value')" },
                defaultValue: "input + value",
              },
              defaultValue: { type: "Number", label: { en: "Default Value" }, defaultValue: 0 },
              description: { type: "Text", label: { en: "Description (optional)" }, defaultValue: "" },
              notes: { type: "Text", label: { en: "Notes (optional)" }, defaultValue: "" },
              minValue: { type: "Number", label: { en: "Min Value (optional)" } },
              maxValue: { type: "Number", label: { en: "Max Value (optional)" } },
              unit: { type: "Text", label: { en: "Unit (€, %, etc.)" }, defaultValue: "" },
              category: { type: "Text", label: { en: "Category" }, defaultValue: "" },
            },
          },
        },
      },
      defaultValue: [
        {
          id: "basis",
          label: "Basis-Preis",
          icon: "💰",
          color: "#10b981",
          calculationType: "fixed",
          defaultValue: 1000,
          description: "Startpreis",
          unit: "€",
          category: "input"
        },
        {
          id: "rabatt",
          label: "Rabatt",
          icon: "🏷️",
          color: "#ef4444",
          calculationType: "formula",
          formula: "input * (1 - value / 100)",
          defaultValue: 10,
          description: "Rabatt in Prozent",
          unit: "%",
          category: "calculation"
        },
        {
          id: "steuer",
          label: "MwSt",
          icon: "🏛️",
          color: "#3b82f6",
          calculationType: "formula",
          formula: "input * (1 + value / 100)",
          defaultValue: 19,
          description: "Mehrwertsteuer",
          unit: "%",
          category: "calculation"
        },
        {
          id: "versand",
          label: "Versand",
          icon: "🚚",
          color: "#f59e0b",
          calculationType: "formula",
          formula: "input + value",
          defaultValue: 5.99,
          description: "Versandkosten",
          unit: "€",
          category: "calculation"
        },
        {
          id: "provision",
          label: "Provision",
          icon: "💳",
          color: "#8b5cf6",
          calculationType: "formula",
          formula: "input * (value / 100)",
          defaultValue: 3.5,
          description: "Payment Fee",
          unit: "%",
          category: "calculation"
        },
        {
          id: "gesamt",
          label: "Gesamt",
          icon: "✅",
          color: "#059669",
          calculationType: "fixed",
          defaultValue: 0,
          description: "Endpreis",
          unit: "€",
          category: "result"
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
