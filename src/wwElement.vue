<template>
  <div class="react-flow-container" ref="container">
    <!-- Background -->
    <svg class="react-flow-background" :style="backgroundStyle">
      <pattern
        id="pattern-dots"
        x="0"
        y="0"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="2" cy="2" r="1" :fill="content.gridColor || '#e5e7eb'" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#pattern-dots)" />
    </svg>

    <!-- Canvas (Edges) -->
    <svg
      class="react-flow-edges"
      :style="edgesStyle"
      @mousedown="onPaneMouseDown"
      @mousemove="onPaneMouseMove"
      @mouseup="onPaneMouseUp"
      @wheel="onPaneWheel"
    >
      <!-- Define arrow markers -->
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" :fill="content.connectionColor || '#b1b1b7'" />
        </marker>
        <marker
          id="arrowhead-hover"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" :fill="content.connectionHoverColor || '#2563eb'" />
        </marker>
      </defs>

      <g :transform="`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`">
        <!-- Edges -->
        <g class="edges-layer">
          <g v-for="edge in edges" :key="`${edge.source}-${edge.target}`">
            <!-- Full path line -->
            <path
              :d="getEdgePath(edge)"
              :stroke="content.connectionColor || '#b1b1b7'"
              :stroke-width="content.connectionWidth || 2"
              fill="none"
              class="react-flow-edge"
              @click="onEdgeClick(edge)"
              style="cursor: pointer;"
            />
            <!-- Arrow marker at midpoint -->
            <path
              :d="getArrowPath(edge)"
              :fill="content.connectionColor || '#b1b1b7'"
              class="edge-arrow"
              @click="onEdgeClick(edge)"
              style="cursor: pointer;"
            />
          </g>
          <!-- Temporary connection line while dragging -->
          <path
            v-if="connectingFrom && tempConnectionPos"
            :d="getTempConnectionPath()"
            :stroke="content.connectionColor || '#b1b1b7'"
            :stroke-width="content.connectionWidth || 2"
            stroke-dasharray="5,5"
            fill="none"
            class="react-flow-edge-temp"
            marker-end="url(#arrowhead)"
          />
        </g>
      </g>
    </svg>

    <!-- Nodes Layer -->
    <div
      class="react-flow-nodes"
      :style="{
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        transformOrigin: '0 0',
        ...nodeStyle
      }"
    >
      <div
        v-for="node in nodes"
        :key="node.id"
        class="react-flow-node"
        :class="[`node-type-${node.type}`, { selected: node.id === selectedNode }]"
        :style="{
          transform: `translate(${node.position.x}px, ${node.position.y}px)`,
        }"
        @mousedown="onNodeMouseDown($event, node)"
        @dblclick.stop="openNodePopup(node)"
      >
        <!-- Node Content -->
        <div class="node-content">
          <div class="node-header" :style="{ backgroundColor: node.color || '#3b82f6' }">
            <span class="node-icon">{{ node.icon || '📊' }}</span>
            <span class="node-label">{{ node.label || 'Node' }}</span>
            <button class="node-delete" @click.stop="deleteNode(node.id)" title="Delete">×</button>
          </div>

          <div class="node-body">
            <div class="node-field">
              <label>Calculation Type</label>
              <select
                v-model="node.data.calculationType"
                @change="onNodeDataChange(node)"
                @click.stop
                class="node-select"
              >
                <option value="fixed">Fixed Value</option>
                <option value="percentage">Percentage</option>
                <option value="multiply">Multiply</option>
                <option value="add">Add</option>
                <option value="subtract">Subtract</option>
                <option value="formula">Custom Formula</option>
              </select>
            </div>

            <div v-if="node.data.calculationType === 'formula'" class="node-field">
              <label>Formula (use: input, value)</label>
              <input
                type="text"
                v-model="node.data.formula"
                @input="onNodeDataChange(node)"
                @click.stop
                placeholder="input * value + 10"
                class="node-input node-formula"
              />
              <div class="formula-hint">Examples: input + value, input * 2, (input + value) / 2</div>
            </div>

            <div class="node-field">
              <label>Value</label>
              <input
                type="number"
                v-model.number="node.data.value"
                :min="node.data.minValue"
                :max="node.data.maxValue"
                @input="onNodeDataChange(node)"
                @click.stop
                class="node-input"
              />
            </div>

            <div v-if="node.data.description" class="node-field">
              <label>Info</label>
              <div class="node-description">{{ node.data.description }}</div>
            </div>

            <div class="node-field node-result-field">
              <label>Result</label>
              <strong class="node-result-value">{{ formatValue(node.data.result || 0) }}</strong>
            </div>
          </div>
        </div>

        <!-- Handles -->
        <div
          v-if="node.type !== 'output'"
          class="node-handle handle-target"
          :style="{ backgroundColor: node.color || '#3b82f6' }"
          @mousedown.stop="onHandleMouseDown($event, node, 'target')"
          @mouseup.stop="onHandleMouseUp($event, node, 'target')"
        ></div>
        <div
          v-if="node.type !== 'input'"
          class="node-handle handle-source"
          :style="{ backgroundColor: node.color || '#3b82f6' }"
          @mousedown.stop="onHandleMouseDown($event, node, 'source')"
          @mouseup.stop="onHandleMouseUp($event, node, 'source')"
        ></div>

        <!-- Toolbar on hover -->
        <div v-if="node.id === hoveredNode" class="node-toolbar">
          <button @click.stop="duplicateNode(node)" title="Duplicate">⎘</button>
          <button @click.stop="deleteNode(node.id)" title="Delete">🗑</button>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div v-if="content.showControls !== false" class="react-flow-controls">
      <button @click="zoomIn" class="control-btn" title="Zoom In">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
        </svg>
      </button>
      <button @click="zoomOut" class="control-btn" title="Zoom Out">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M19 13H5v-2h14v2z" fill="currentColor"/>
        </svg>
      </button>
      <button @click="fitView" class="control-btn" title="Fit View">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm16 0h-2v4h-4v2h6v-6z" fill="currentColor"/>
        </svg>
      </button>
      <button @click="toggleLock" class="control-btn" :class="{ active: isLocked }" title="Lock/Unlock">
        <svg v-if="isLocked" viewBox="0 0 24 24" width="16" height="16">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="16" height="16">
          <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z" fill="currentColor"/>
        </svg>
      </button>
    </div>

    <!-- Mini Map -->
    <div v-if="content.showMiniMap !== false" class="react-flow-minimap">
      <svg viewBox="0 0 200 150" class="minimap-svg">
        <rect width="200" height="150" fill="#f8f9fa" />
        <g
          v-for="node in nodes"
          :key="`mini-${node.id}`"
          :transform="`translate(${(node.position.x * 200) / (canvasWidth || 1200)}, ${(node.position.y * 150) / (canvasHeight || 800)})`"
        >
          <rect
            width="15"
            height="10"
            :fill="node.color || '#3b82f6'"
            rx="1"
          />
        </g>
        <!-- Viewport indicator -->
        <rect
          :x="(-viewport.x * 200) / ((canvasWidth || 1200) * viewport.zoom)"
          :y="(-viewport.y * 150) / ((canvasHeight || 800) * viewport.zoom)"
          :width="(200 / viewport.zoom)"
          :height="(150 / viewport.zoom)"
          fill="none"
          stroke="#2563eb"
          stroke-width="2"
        />
      </svg>
    </div>

    <!-- Add Node Button -->
    <button class="add-node-btn" @click="showNodeMenu = !showNodeMenu">
      + Add Node
    </button>

    <!-- Node Menu -->
    <div v-if="showNodeMenu" class="node-menu">
      <div class="menu-header">
        <h3>Add Node</h3>
        <button @click="showNodeMenu = false">×</button>
      </div>
      <div
        v-for="nodeType in nodeTypes"
        :key="nodeType.id"
        class="menu-item"
        :style="{ borderLeftColor: nodeType.color }"
        @click="addNode(nodeType)"
      >
        <span class="menu-icon">{{ nodeType.icon }}</span>
        <div class="menu-info">
          <div class="menu-label">{{ nodeType.label }}</div>
          <div class="menu-desc">{{ nodeType.calculationType }}</div>
        </div>
      </div>
    </div>

    <!-- Node Details Popup -->
    <div v-if="popupNode" class="node-popup-overlay" @click="closeNodePopup">
      <div class="node-popup" @click.stop>
        <div class="popup-header" :style="{ backgroundColor: popupNode.color || '#3b82f6' }">
          <span class="popup-icon">{{ popupNode.icon }}</span>
          <h3>{{ popupNode.label }}</h3>
          <button class="popup-close" @click="closeNodePopup">×</button>
        </div>

        <div class="popup-body">
          <div class="popup-section">
            <h4>General</h4>

            <div class="popup-field">
              <label>Label</label>
              <input
                type="text"
                v-model="popupNode.label"
                @input="onPopupChange"
                class="popup-input"
              />
            </div>

            <div class="popup-field">
              <label>Category</label>
              <input
                type="text"
                v-model="popupNode.data.category"
                @input="onPopupChange"
                placeholder="e.g., Revenue, Cost, Tax"
                class="popup-input"
              />
            </div>

            <div class="popup-field">
              <label>Unit</label>
              <input
                type="text"
                v-model="popupNode.data.unit"
                @input="onPopupChange"
                placeholder="€, %, kg, etc."
                class="popup-input"
              />
            </div>
          </div>

          <div class="popup-section">
            <h4>Calculation</h4>

            <div class="popup-field">
              <label>Type</label>
              <select
                v-model="popupNode.data.calculationType"
                @change="onPopupChange"
                class="popup-select"
              >
                <option value="fixed">Fixed Value</option>
                <option value="percentage">Percentage</option>
                <option value="multiply">Multiply</option>
                <option value="add">Add</option>
                <option value="subtract">Subtract</option>
                <option value="formula">Custom Formula</option>
                <option value="advanced">Advanced Multi-Step</option>
              </select>
            </div>

            <div v-if="popupNode.data.calculationType === 'formula'" class="popup-field">
              <label>Formula</label>
              <textarea
                v-model="popupNode.data.formula"
                @input="onPopupChange"
                placeholder="input * value + 10"
                class="popup-textarea"
                rows="3"
              ></textarea>
            </div>

            <!-- Advanced Multi-Step Calculation Builder -->
            <div v-if="popupNode.data.calculationType === 'advanced'" class="advanced-calc-builder">
              <div class="builder-header">
                <label>Calculation Steps</label>
                <button @click="addCalculationStep" class="btn-add-step">+ Add Step</button>
              </div>

              <div v-if="!popupNode.data.calculationSteps || popupNode.data.calculationSteps.length === 0" class="empty-steps">
                No calculation steps defined. Click "Add Step" to create your first step.
              </div>

              <div v-for="(step, index) in popupNode.data.calculationSteps" :key="index" class="calc-step">
                <div class="step-header">
                  <span class="step-number">Step {{ index + 1 }}</span>
                  <button @click="removeCalculationStep(index)" class="btn-remove-step">×</button>
                </div>

                <div class="step-body">
                  <div class="popup-field">
                    <label>Step Type</label>
                    <select v-model="step.type" @change="onPopupChange" class="popup-select">
                      <option value="formula">Formula</option>
                      <option value="condition">If/Else Condition</option>
                      <option value="aggregate">Aggregate Function</option>
                      <option value="variable">Set Variable</option>
                    </select>
                  </div>

                  <div class="popup-field">
                    <label>Variable Name (optional, stores result)</label>
                    <input
                      type="text"
                      v-model="step.name"
                      @input="onPopupChange"
                      placeholder="e.g., tax, discount, total"
                      class="popup-input"
                    />
                  </div>

                  <!-- Formula Step -->
                  <div v-if="step.type === 'formula' || step.type === 'variable'" class="popup-field">
                    <label>Formula</label>
                    <textarea
                      v-model="step.formula"
                      @input="onPopupChange"
                      placeholder="e.g., input * 1.19, sqrt(value), round(result * 100) / 100"
                      class="popup-textarea"
                      rows="2"
                    ></textarea>
                    <div class="formula-hint">
                      <strong>Math:</strong> abs, ceil, floor, round, sqrt, pow, min, max, sin, cos, tan, log, exp<br>
                      <strong>Percent:</strong> percent(val, %), addPercent(val, %), subtractPercent(val, %), percentOf(part, whole), percentChange(old, new)
                    </div>
                  </div>

                  <!-- Condition Step -->
                  <div v-if="step.type === 'condition'">
                    <div class="popup-field">
                      <label>Condition (JavaScript expression)</label>
                      <input
                        type="text"
                        v-model="step.condition"
                        @input="onPopupChange"
                        placeholder="e.g., input > 1000, value >= 0, result < max(inputs)"
                        class="popup-input"
                      />
                    </div>
                    <div class="popup-field-group">
                      <div class="popup-field">
                        <label>If True</label>
                        <input
                          type="text"
                          v-model="step.trueValue"
                          @input="onPopupChange"
                          placeholder="e.g., input * 0.9"
                          class="popup-input"
                        />
                      </div>
                      <div class="popup-field">
                        <label>If False</label>
                        <input
                          type="text"
                          v-model="step.falseValue"
                          @input="onPopupChange"
                          placeholder="e.g., input"
                          class="popup-input"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Aggregate Step -->
                  <div v-if="step.type === 'aggregate'" class="popup-field">
                    <label>Aggregate Type</label>
                    <select v-model="step.aggregateType" @change="onPopupChange" class="popup-select">
                      <option value="sum">Sum of all inputs</option>
                      <option value="avg">Average of inputs</option>
                      <option value="min">Minimum value</option>
                      <option value="max">Maximum value</option>
                      <option value="count">Count of inputs</option>
                    </select>
                  </div>

                  <div class="popup-field">
                    <label>Description</label>
                    <input
                      type="text"
                      v-model="step.description"
                      @input="onPopupChange"
                      placeholder="Explain what this step does"
                      class="popup-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="popup-field">
              <label>Value</label>
              <input
                type="number"
                v-model.number="popupNode.data.value"
                @input="onPopupChange"
                class="popup-input"
              />
            </div>

            <div class="popup-field-group">
              <div class="popup-field">
                <label>Min Value</label>
                <input
                  type="number"
                  v-model.number="popupNode.data.minValue"
                  @input="onPopupChange"
                  class="popup-input"
                />
              </div>
              <div class="popup-field">
                <label>Max Value</label>
                <input
                  type="number"
                  v-model.number="popupNode.data.maxValue"
                  @input="onPopupChange"
                  class="popup-input"
                />
              </div>
            </div>
          </div>

          <div class="popup-section">
            <h4>Documentation</h4>

            <div class="popup-field">
              <label>Description</label>
              <textarea
                v-model="popupNode.data.description"
                @input="onPopupChange"
                placeholder="Short description of this node"
                class="popup-textarea"
                rows="2"
              ></textarea>
            </div>

            <div class="popup-field">
              <label>Notes</label>
              <textarea
                v-model="popupNode.data.notes"
                @input="onPopupChange"
                placeholder="Additional notes, comments, or documentation"
                class="popup-textarea"
                rows="4"
              ></textarea>
            </div>
          </div>

          <div class="popup-result">
            <label>Current Result</label>
            <div class="result-value">{{ formatValue(popupNode.data.result || 0) }}</div>
          </div>
        </div>

        <div class="popup-footer">
          <button @click="closeNodePopup" class="btn-primary">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ReactFlowCanvas",
  props: {
    content: { type: Object, required: true },
  },
  emits: ['trigger-event'],
  data() {
    return {
      nodes: [],
      edges: [],
      nextNodeId: 1,
      selectedNode: null,
      hoveredNode: null,

      // Viewport
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },

      // Panning
      isPanning: false,
      panStart: { x: 0, y: 0 },

      // Dragging
      draggingNode: null,
      dragOffset: { x: 0, y: 0 },

      // Connecting
      connectingFrom: null,
      connectingFromType: null,
      tempConnectionPos: null,

      // UI
      showNodeMenu: false,
      isLocked: false,
      popupNode: null,
    };
  },
  computed: {
    canvasWidth() {
      return this.content.canvasWidth || 1200;
    },
    canvasHeight() {
      return this.content.canvasHeight || 800;
    },
    nodeTypes() {
      return this.content.nodeTypes || [];
    },
    backgroundStyle() {
      return {
        backgroundColor: this.content.canvasBackgroundColor || '#fafafa',
      };
    },
    edgesStyle() {
      return {
        pointerEvents: this.isLocked ? 'none' : 'all',
      };
    },
    nodeStyle() {
      const shadow = this.content.nodeShadow || 'md';
      const shadows = {
        none: 'none',
        sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
        md: '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
        lg: '0 10px 30px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)',
        xl: '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.08)',
      };
      return {
        '--node-width': `${this.content.nodeWidth || 280}px`,
        '--node-bg': this.content.nodeBackgroundColor || '#ffffff',
        '--node-border': this.content.nodeBorderColor || '#e5e7eb',
        '--node-radius': `${this.content.nodeBorderRadius || 12}px`,
        '--node-shadow': shadows[shadow],
        '--connection-hover': this.content.connectionHoverColor || '#2563eb',
      };
    },
  },
  watch: {
    'content.initialNodes': {
      handler(newNodes) {
        if (newNodes && newNodes.length > 0) {
          this.loadNodesFromAPI(newNodes);
        }
      },
      deep: true,
      immediate: true,
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initCanvas();
      this.loadInitialData();
    });

    // Node hover tracking
    document.addEventListener('mouseover', this.onNodeHover);
  },
  beforeUnmount() {
    document.removeEventListener('mouseover', this.onNodeHover);
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
  },
  methods: {
    // === INITIALIZATION ===
    initCanvas() {
      // Initialize with default viewport
      this.viewport = {
        x: 50,
        y: 50,
        zoom: 1,
      };
    },

    loadInitialData() {
      // Load from API if provided
      if (this.content.initialNodes && this.content.initialNodes.length > 0) {
        this.loadNodesFromAPI(this.content.initialNodes);
      } else if (this.nodes.length === 0 && this.nodeTypes.length > 0) {
        // Add demo node
        this.addNode(this.nodeTypes[0], 100, 100);
      }

      if (this.content.initialEdges && this.content.initialEdges.length > 0) {
        this.loadEdgesFromAPI(this.content.initialEdges);
      }
    },

    // === API INPUT ===
    loadNodesFromAPI(apiNodes) {
      this.nodes = apiNodes.map((apiNode, index) => {
        const nodeType = this.nodeTypes.find(t => t.id === apiNode.typeId) || this.nodeTypes[0];
        return {
          id: apiNode.id || `node-${index}`,
          type: apiNode.typeId || nodeType?.id,
          label: nodeType?.label || 'Node',
          icon: nodeType?.icon || '📊',
          color: nodeType?.color || '#3b82f6',
          position: {
            x: apiNode.x || 100 + index * 100,
            y: apiNode.y || 100 + index * 50,
          },
          data: {
            value: apiNode.value !== undefined ? apiNode.value : (nodeType?.defaultValue || 0),
            result: apiNode.value !== undefined ? apiNode.value : (nodeType?.defaultValue || 0),
            calculationType: nodeType?.calculationType || 'fixed',
            formula: nodeType?.formula || 'input + value',
            calculationSteps: nodeType?.calculationSteps || [],
            description: nodeType?.description || '',
            notes: nodeType?.notes || '',
            minValue: nodeType?.minValue,
            maxValue: nodeType?.maxValue,
            unit: nodeType?.unit || '',
            category: nodeType?.category || '',
          },
        };
      });

      // Update nextNodeId to be after loaded nodes
      this.nextNodeId = this.nodes.length;

      // Load edges after nodes are created
      if (this.content.initialEdges && this.content.initialEdges.length > 0) {
        this.loadEdgesFromAPI(this.content.initialEdges);
      }

      this.calculate();
      this.emitFlowData();
    },

    loadEdgesFromAPI(apiEdges) {
      this.edges = apiEdges.map(edge => ({
        source: edge.source,
        target: edge.target,
      }));
      this.calculate();
    },

    // === API OUTPUT ===
    emitFlowData() {
      const outputData = {
        nodes: this.nodes.map(n => ({
          id: n.id,
          type: n.type,
          label: n.label,
          icon: n.icon,
          color: n.color,
          position: { x: n.position.x, y: n.position.y },
          value: n.data.value,
          result: n.data.result,
          calculationType: n.data.calculationType,
        })),
        edges: this.edges.map(e => ({
          source: e.source,
          target: e.target,
        })),
      };

      // Emit for WeWeb workflows
      this.$emit('trigger-event', {
        name: 'flow-updated',
        event: outputData,
      });

      // Auto-save if enabled
      if (this.content.enableAutoSave) {
        this.scheduleAutoSave(outputData);
      }

      return outputData;
    },

    scheduleAutoSave(data) {
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout);
      }
      this.autoSaveTimeout = setTimeout(() => {
        this.$emit('trigger-event', {
          name: 'auto-save',
          event: data,
        });
      }, this.content.autoSaveDelay || 1000);
    },

    // === NODE MANAGEMENT ===
    addNode(nodeType, x = null, y = null) {
      const node = {
        id: `node-${this.nextNodeId++}`,
        type: nodeType.id,
        label: nodeType.label,
        icon: nodeType.icon,
        color: nodeType.color,
        position: {
          x: x !== null ? x : 150 + Math.random() * 200,
          y: y !== null ? y : 100 + Math.random() * 200,
        },
        data: {
          value: nodeType.defaultValue || 0,
          result: nodeType.defaultValue || 0,
          calculationType: nodeType.calculationType || 'fixed',
          formula: nodeType.formula || 'input + value',
          calculationSteps: nodeType.calculationSteps || [],
          description: nodeType.description || '',
          notes: nodeType.notes || '',
          minValue: nodeType.minValue,
          maxValue: nodeType.maxValue,
          unit: nodeType.unit || '',
          category: nodeType.category || '',
        },
      };

      this.nodes.push(node);
      this.showNodeMenu = false;
      this.calculate();
      this.emitFlowData();
    },

    deleteNode(nodeId) {
      if (!this.content.enableNodeDeletion) return;

      this.nodes = this.nodes.filter(n => n.id !== nodeId);
      this.edges = this.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
      this.calculate();
      this.emitFlowData();
    },

    duplicateNode(node) {
      const newNode = {
        ...node,
        id: `node-${this.nextNodeId++}`,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        data: { ...node.data },
      };
      this.nodes.push(newNode);
      this.emitFlowData();
    },

    onNodeDataChange(node) {
      this.calculate();
      this.emitFlowData();
    },

    onNodeHover(e) {
      const nodeEl = e.target.closest('.react-flow-node');
      if (nodeEl) {
        const nodeId = this.nodes.find(n => {
          const el = nodeEl;
          return el.querySelector('.node-label')?.textContent === n.label;
        })?.id;
        this.hoveredNode = nodeId;
      } else {
        this.hoveredNode = null;
      }
    },

    // === DRAGGING ===
    onNodeMouseDown(e, node) {
      if (this.isLocked) return;
      if (e.target.classList.contains('node-input')) return;

      this.draggingNode = node;
      this.selectedNode = node.id;

      const nodeEl = e.currentTarget;
      const rect = nodeEl.getBoundingClientRect();
      const containerRect = this.$refs.container.getBoundingClientRect();

      this.dragOffset = {
        x: (e.clientX - rect.left) / this.viewport.zoom,
        y: (e.clientY - rect.top) / this.viewport.zoom,
      };

      document.addEventListener('mousemove', this.onNodeMouseMove);
      document.addEventListener('mouseup', this.onNodeMouseUp);
    },

    onNodeMouseMove(e) {
      if (!this.draggingNode) return;

      const containerRect = this.$refs.container.getBoundingClientRect();
      const x = (e.clientX - containerRect.left - this.viewport.x) / this.viewport.zoom - this.dragOffset.x;
      const y = (e.clientY - containerRect.top - this.viewport.y) / this.viewport.zoom - this.dragOffset.y;

      this.draggingNode.position.x = x;
      this.draggingNode.position.y = y;
    },

    onNodeMouseUp() {
      this.draggingNode = null;
      document.removeEventListener('mousemove', this.onNodeMouseMove);
      document.removeEventListener('mouseup', this.onNodeMouseUp);
    },

    // === PANNING ===
    onPaneMouseDown(e) {
      if (e.target.classList.contains('react-flow-edges')) {
        this.isPanning = true;
        this.panStart = {
          x: e.clientX - this.viewport.x,
          y: e.clientY - this.viewport.y,
        };
        e.currentTarget.style.cursor = 'grabbing';
      }
    },

    onPaneMouseMove(e) {
      if (this.isPanning) {
        this.viewport.x = e.clientX - this.panStart.x;
        this.viewport.y = e.clientY - this.panStart.y;
      }
    },

    onPaneMouseUp(e) {
      this.isPanning = false;
      e.currentTarget.style.cursor = 'grab';
    },

    // === ZOOM ===
    onPaneWheel(e) {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      const newZoom = Math.min(Math.max(this.viewport.zoom + delta, 0.1), 2);

      // Zoom towards mouse position
      const containerRect = this.$refs.container.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      const scaleDiff = newZoom - this.viewport.zoom;
      this.viewport.x -= (mouseX - this.viewport.x) * (scaleDiff / this.viewport.zoom);
      this.viewport.y -= (mouseY - this.viewport.y) * (scaleDiff / this.viewport.zoom);
      this.viewport.zoom = newZoom;
    },

    zoomIn() {
      this.viewport.zoom = Math.min(this.viewport.zoom + 0.1, 2);
    },

    zoomOut() {
      this.viewport.zoom = Math.max(this.viewport.zoom - 0.1, 0.1);
    },

    fitView() {
      if (this.nodes.length === 0) return;

      const padding = 50;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      this.nodes.forEach(node => {
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + 280);
        maxY = Math.max(maxY, node.position.y + 140);
      });

      const width = maxX - minX;
      const height = maxY - minY;

      const containerRect = this.$refs.container.getBoundingClientRect();
      const scaleX = (containerRect.width - padding * 2) / width;
      const scaleY = (containerRect.height - padding * 2) / height;
      const zoom = Math.min(scaleX, scaleY, 1);

      this.viewport.zoom = zoom;
      this.viewport.x = -minX * zoom + padding;
      this.viewport.y = -minY * zoom + padding;
    },

    toggleLock() {
      this.isLocked = !this.isLocked;
    },

    // === CONNECTIONS ===
    onHandleMouseDown(e, node, type) {
      if (this.isLocked) return;
      if (type === 'source') {
        e.stopPropagation();
        this.connectingFrom = node.id;
        this.connectingFromType = 'source';
        this.tempConnectionPos = { x: e.clientX, y: e.clientY };

        // Add global listeners for connection dragging
        document.addEventListener('mousemove', this.onConnectionDrag);
        document.addEventListener('mouseup', this.onConnectionEnd);
      }
    },

    onConnectionDrag(e) {
      if (this.connectingFrom) {
        const containerRect = this.$refs.container.getBoundingClientRect();
        this.tempConnectionPos = {
          x: (e.clientX - containerRect.left - this.viewport.x) / this.viewport.zoom,
          y: (e.clientY - containerRect.top - this.viewport.y) / this.viewport.zoom,
        };
      }
    },

    onConnectionEnd(e) {
      document.removeEventListener('mousemove', this.onConnectionDrag);
      document.removeEventListener('mouseup', this.onConnectionEnd);
      this.connectingFrom = null;
      this.connectingFromType = null;
      this.tempConnectionPos = null;
    },

    onHandleMouseUp(e, node, type) {
      if (this.connectingFrom && type === 'target' && this.connectingFrom !== node.id) {
        // Check if edge already exists
        const exists = this.edges.some(e => e.source === this.connectingFrom && e.target === node.id);
        if (!exists) {
          // Create edge
          this.edges.push({
            source: this.connectingFrom,
            target: node.id,
          });
          this.calculate();
          this.emitFlowData();
        }
      }
      // Clean up
      document.removeEventListener('mousemove', this.onConnectionDrag);
      document.removeEventListener('mouseup', this.onConnectionEnd);
      this.connectingFrom = null;
      this.connectingFromType = null;
      this.tempConnectionPos = null;
    },

    // === EDGE RENDERING ===
    getEdgePath(edge) {
      const sourceNode = this.nodes.find(n => n.id === edge.source);
      const targetNode = this.nodes.find(n => n.id === edge.target);

      if (!sourceNode || !targetNode) return '';

      const nodeWidth = this.content.nodeWidth || 280;
      const sourceX = sourceNode.position.x + nodeWidth;
      const sourceY = sourceNode.position.y + 70;
      const targetX = targetNode.position.x;
      const targetY = targetNode.position.y + 70;

      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const offset = Math.abs(dx) * 0.5;

      // Full bezier curve path
      return `M ${sourceX} ${sourceY} C ${sourceX + offset} ${sourceY}, ${targetX - offset} ${targetY}, ${targetX} ${targetY}`;
    },

    getArrowPath(edge) {
      const sourceNode = this.nodes.find(n => n.id === edge.source);
      const targetNode = this.nodes.find(n => n.id === edge.target);

      if (!sourceNode || !targetNode) return '';

      const nodeWidth = this.content.nodeWidth || 280;
      const sourceX = sourceNode.position.x + nodeWidth;
      const sourceY = sourceNode.position.y + 70;
      const targetX = targetNode.position.x;
      const targetY = targetNode.position.y + 70;

      const dx = targetX - sourceX;
      const offset = Math.abs(dx) * 0.5;

      // Calculate midpoint on cubic bezier curve (t=0.5)
      const cp1x = sourceX + offset;
      const cp1y = sourceY;
      const cp2x = targetX - offset;
      const cp2y = targetY;

      const t = 0.5;
      const midX = Math.pow(1-t, 3) * sourceX + 3 * Math.pow(1-t, 2) * t * cp1x + 3 * (1-t) * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * targetX;
      const midY = Math.pow(1-t, 3) * sourceY + 3 * Math.pow(1-t, 2) * t * cp1y + 3 * (1-t) * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * targetY;

      // Calculate tangent angle at midpoint for arrow rotation
      // Derivative of cubic bezier at t=0.5
      const dx_dt = -3 * Math.pow(1-t, 2) * sourceX + 3 * (Math.pow(1-t, 2) - 2*t*(1-t)) * cp1x + 3 * (2*t*(1-t) - Math.pow(t, 2)) * cp2x + 3 * Math.pow(t, 2) * targetX;
      const dy_dt = -3 * Math.pow(1-t, 2) * sourceY + 3 * (Math.pow(1-t, 2) - 2*t*(1-t)) * cp1y + 3 * (2*t*(1-t) - Math.pow(t, 2)) * cp2y + 3 * Math.pow(t, 2) * targetY;
      const angle = Math.atan2(dy_dt, dx_dt);

      // Arrow size
      const arrowSize = 9;
      const arrowWidth = 6;

      // Calculate arrow points
      const tipX = midX;
      const tipY = midY;
      const baseLeftX = tipX - arrowSize * Math.cos(angle) - arrowWidth/2 * Math.sin(angle);
      const baseLeftY = tipY - arrowSize * Math.sin(angle) + arrowWidth/2 * Math.cos(angle);
      const baseRightX = tipX - arrowSize * Math.cos(angle) + arrowWidth/2 * Math.sin(angle);
      const baseRightY = tipY - arrowSize * Math.sin(angle) - arrowWidth/2 * Math.cos(angle);

      return `M ${tipX} ${tipY} L ${baseLeftX} ${baseLeftY} L ${baseRightX} ${baseRightY} Z`;
    },

    getTempConnectionPath() {
      if (!this.connectingFrom || !this.tempConnectionPos) return '';

      const sourceNode = this.nodes.find(n => n.id === this.connectingFrom);
      if (!sourceNode) return '';

      const nodeWidth = this.content.nodeWidth || 280;
      const sourceX = sourceNode.position.x + nodeWidth;
      const sourceY = sourceNode.position.y + 70;
      const targetX = this.tempConnectionPos.x;
      const targetY = this.tempConnectionPos.y;

      const dx = targetX - sourceX;
      const offset = Math.abs(dx) * 0.5;

      return `M ${sourceX} ${sourceY} C ${sourceX + offset} ${sourceY}, ${targetX - offset} ${targetY}, ${targetX} ${targetY}`;
    },

    // === EDGE DELETION ===
    onEdgeClick(edge) {
      if (!this.content.enableEdgeDeletion) return;
      if (this.isLocked) return;

      const confirmed = confirm('Delete this connection?');
      if (confirmed) {
        this.deleteEdge(edge);
      }
    },

    deleteEdge(edge) {
      const index = this.edges.findIndex(
        e => e.source === edge.source && e.target === edge.target
      );
      if (index !== -1) {
        this.edges.splice(index, 1);
        this.calculate();
        this.emitFlowData();
      }
    },

    // === CALCULATION ===
    calculate() {
      const graph = {};
      this.nodes.forEach(n => {
        graph[n.id] = {
          node: n,
          inputs: this.edges.filter(e => e.target === n.id).map(e => e.source),
        };
      });

      const visited = new Set();
      const sorted = [];

      const visit = (id) => {
        if (visited.has(id)) return;
        visited.add(id);
        const inputs = graph[id]?.inputs || [];
        inputs.forEach(inputId => visit(inputId));
        sorted.push(id);
      };

      Object.keys(graph).forEach(id => visit(id));

      sorted.forEach(id => {
        const { node, inputs } = graph[id];
        if (!node) return;

        let inputValue = node.data.value;

        if (inputs.length > 0) {
          inputValue = inputs.reduce((sum, fromId) => {
            const fromNode = graph[fromId]?.node;
            return sum + (fromNode?.data?.result || 0);
          }, 0);
        }

        let result = inputValue;
        const value = node.data.value;

        switch (node.data.calculationType) {
          case 'fixed':
            // Fixed: Pass through input if connected, otherwise use own value
            result = inputs.length > 0 ? inputValue : value;
            break;
          case 'percentage':
            result = inputValue + (inputValue * value / 100);
            break;
          case 'multiply':
            result = inputValue * value;
            break;
          case 'add':
            result = inputValue + value;
            break;
          case 'subtract':
            result = inputValue - value;
            break;
          case 'formula':
            try {
              // Safe formula evaluation
              const input = inputValue;
              // Use Function constructor for safe evaluation
              const formulaFunc = new Function('input', 'value', `return ${node.data.formula || 'input'}`);
              result = formulaFunc(input, value);
              // Check if result is valid number
              if (isNaN(result) || !isFinite(result)) {
                result = 0;
                console.error('Formula returned invalid result:', node.data.formula);
              }
            } catch (error) {
              console.error('Formula error:', error.message, 'Formula:', node.data.formula);
              result = 0;
            }
            break;
          case 'advanced':
            result = this.executeAdvancedCalculation(node, inputValue, value, inputs);
            break;
        }

        node.data.result = result;
      });
    },

    // === ADVANCED CALCULATIONS ===
    executeAdvancedCalculation(node, inputValue, value, inputs) {
      try {
        const steps = node.data.calculationSteps || [];
        if (steps.length === 0) return inputValue;

        // Context with all available variables and functions
        const context = {
          input: inputValue,
          value: value,
          result: inputValue,
          // Math functions
          abs: Math.abs,
          ceil: Math.ceil,
          floor: Math.floor,
          round: Math.round,
          sqrt: Math.sqrt,
          pow: Math.pow,
          min: Math.min,
          max: Math.max,
          // Advanced math
          sin: Math.sin,
          cos: Math.cos,
          tan: Math.tan,
          log: Math.log,
          exp: Math.exp,
          // Percentage helper functions
          percent: (val, percentage) => val * (percentage / 100),
          addPercent: (val, percentage) => val + (val * percentage / 100),
          subtractPercent: (val, percentage) => val - (val * percentage / 100),
          percentOf: (part, whole) => (part / whole) * 100,
          percentChange: (oldVal, newVal) => ((newVal - oldVal) / oldVal) * 100,
          // Input array for aggregate functions
          inputs: inputs.map(fromId => {
            const fromNode = this.nodes.find(n => n.id === fromId);
            return fromNode?.data?.result || 0;
          }),
        };

        // Execute each step
        for (const step of steps) {
          try {
            switch (step.type) {
              case 'formula':
                // Execute formula and store in variable or result
                const formula = step.formula || 'result';
                const formulaFunc = new Function(...Object.keys(context), `return ${formula}`);
                const formulaResult = formulaFunc(...Object.values(context));

                if (step.name) {
                  context[step.name] = formulaResult;
                } else {
                  context.result = formulaResult;
                }
                break;

              case 'variable':
                // Set a variable
                const varFormula = step.formula || '0';
                const varFunc = new Function(...Object.keys(context), `return ${varFormula}`);
                const varValue = varFunc(...Object.values(context));
                context[step.name || 'temp'] = varValue;
                break;

              case 'condition':
                // If/Else condition
                const condition = step.condition || 'true';
                const condFunc = new Function(...Object.keys(context), `return ${condition}`);
                const condResult = condFunc(...Object.values(context));

                const valueToUse = condResult ? (step.trueValue || 'result') : (step.falseValue || 'result');
                const condValueFunc = new Function(...Object.keys(context), `return ${valueToUse}`);
                const condValue = condValueFunc(...Object.values(context));

                if (step.name) {
                  context[step.name] = condValue;
                } else {
                  context.result = condValue;
                }
                break;

              case 'aggregate':
                // Aggregate function on inputs
                const aggType = step.aggregateType || 'sum';
                let aggResult = 0;

                switch (aggType) {
                  case 'sum':
                    aggResult = context.inputs.reduce((sum, val) => sum + val, 0);
                    break;
                  case 'avg':
                    aggResult = context.inputs.length > 0
                      ? context.inputs.reduce((sum, val) => sum + val, 0) / context.inputs.length
                      : 0;
                    break;
                  case 'min':
                    aggResult = context.inputs.length > 0 ? Math.min(...context.inputs) : 0;
                    break;
                  case 'max':
                    aggResult = context.inputs.length > 0 ? Math.max(...context.inputs) : 0;
                    break;
                  case 'count':
                    aggResult = context.inputs.length;
                    break;
                }

                if (step.name) {
                  context[step.name] = aggResult;
                } else {
                  context.result = aggResult;
                }
                break;
            }
          } catch (stepError) {
            console.error(`Step error in "${step.name || step.type}":`, stepError.message);
          }
        }

        // Validate final result
        const finalResult = context.result;
        if (isNaN(finalResult) || !isFinite(finalResult)) {
          console.error('Advanced calculation returned invalid result');
          return 0;
        }

        return finalResult;
      } catch (error) {
        console.error('Advanced calculation error:', error.message);
        return 0;
      }
    },

    formatValue(val) {
      return typeof val === 'number' ? val.toFixed(2) : '0.00';
    },

    // === POPUP ===
    openNodePopup(node) {
      this.popupNode = node;
    },

    closeNodePopup() {
      this.popupNode = null;
    },

    onPopupChange() {
      this.calculate();
      this.emitFlowData();
    },

    // === ADVANCED CALCULATION BUILDER ===
    addCalculationStep() {
      if (!this.popupNode.data.calculationSteps) {
        this.popupNode.data.calculationSteps = [];
      }
      this.popupNode.data.calculationSteps.push({
        type: 'formula',
        name: '',
        formula: '',
        condition: '',
        trueValue: '',
        falseValue: '',
        aggregateType: 'sum',
        description: '',
      });
    },

    removeCalculationStep(index) {
      this.popupNode.data.calculationSteps.splice(index, 1);
      this.onPopupChange();
    },
  },
};
</script>

<style scoped lang="scss">
.react-flow-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  overflow: hidden;
  background: #fafafa;
}

.react-flow-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.react-flow-edges {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.react-flow-edge {
  stroke-linecap: round;
  transition: stroke 0.2s, stroke-width 0.2s;

  &:hover {
    stroke: var(--connection-hover, #2563eb) !important;
    stroke-width: 3;
  }
}

.react-flow-edge-temp {
  stroke-linecap: round;
  opacity: 0.6;
  pointer-events: none;
}

.react-flow-nodes {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  pointer-events: none;
}

.react-flow-node {
  position: absolute;
  width: var(--node-width, 280px);
  pointer-events: all;
  cursor: move;
  background: var(--node-bg, #ffffff);
  border: 1px solid var(--node-border, #e5e7eb);
  border-radius: var(--node-radius, 12px);
  box-shadow: var(--node-shadow);
  transition: box-shadow 0.2s, transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  &.selected {
    box-shadow:
      0 0 0 2px var(--connection-hover, #2563eb),
      0 8px 24px rgba(37, 99, 235, 0.2);
  }
}

.node-content {
  position: relative;
}

.node-header {
  padding: 14px 16px;
  background: #3b82f6;
  color: white;
  border-radius: calc(var(--node-radius, 12px) - 1px) calc(var(--node-radius, 12px) - 1px) 0 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 14px;
}

.node-icon {
  font-size: 20px;
}

.node-label {
  flex: 1;
}

.node-delete {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #ef4444;
    transform: rotate(90deg);
  }
}

.node-body {
  padding: 16px;
}

.node-field {
  margin-bottom: 14px;

  label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  .node-input,
  .node-select {
    width: 100%;
    padding: 8px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 14px;
    transition: all 0.2s;
    background: white;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  .node-select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
  }

  .node-formula {
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 12px;
  }
}

.formula-hint {
  margin-top: 4px;
  font-size: 10px;
  color: #9ca3af;
  font-style: italic;
}

.node-type-badge {
  display: inline-block;
  padding: 6px 10px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #93c5fd;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #1e40af;
  text-transform: capitalize;
}

.node-description {
  padding: 8px 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  font-style: italic;
}

.node-result-field {
  margin-bottom: 0;
}

.node-result-value {
  display: block;
  padding: 10px 12px;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border: 1px solid #86efac;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #059669;
  text-align: center;
}

.node-handle {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid white;
  background: #3b82f6;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
  z-index: 10;

  &:hover {
    transform: scale(1.4);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }

  &.handle-target {
    top: 50%;
    left: -7px;
    transform: translateY(-50%);
  }

  &.handle-source {
    top: 50%;
    right: -7px;
    transform: translateY(-50%);
  }
}

.node-toolbar {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  background: white;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  button {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: background 0.2s;

    &:hover {
      background: #f3f4f6;
    }
  }
}

.react-flow-controls {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: white;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;

  .control-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    transition: all 0.2s;

    &:hover {
      background: #f3f4f6;
      color: #111827;
    }

    &.active {
      background: #3b82f6;
      color: white;
    }
  }
}

.react-flow-minimap {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 200px;
  height: 150px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 10;

  .minimap-svg {
    width: 100%;
    height: 100%;
  }
}

.add-node-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  z-index: 10;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  }
}

.node-menu {
  position: absolute;
  top: 70px;
  right: 20px;
  width: 280px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 11;
  max-height: 400px;
  overflow-y: auto;

  .menu-header {
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
    }

    button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6b7280;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: background 0.2s;

      &:hover {
        background: #f3f4f6;
      }
    }
  }

  .menu-item {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
    border-left: 4px solid;
    transition: background 0.2s;

    &:hover {
      background: #f9fafb;
    }

    &:last-child {
      border-bottom: none;
    }

    .menu-icon {
      font-size: 24px;
    }

    .menu-info {
      flex: 1;

      .menu-label {
        font-size: 14px;
        font-weight: 600;
        color: #111827;
      }

      .menu-desc {
        font-size: 12px;
        color: #6b7280;
      }
    }
  }
}

// === POPUP MODAL ===
.node-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.node-popup {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: popupSlideIn 0.3s ease-out;
}

@keyframes popupSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popup-header {
  padding: 20px 24px;
  border-radius: 16px 16px 0 0;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  background: #3b82f6;

  .popup-icon {
    font-size: 28px;
  }

  h3 {
    flex: 1;
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }

  .popup-close {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 28px;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.popup-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;

  &:last-of-type {
    border-bottom: none;
  }

  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
  }
}

.popup-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
  }
}

.popup-field-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.popup-input,
.popup-select,
.popup-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: white;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
}

.popup-textarea {
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
}

.popup-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.popup-result {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #10b981;
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
  }

  .result-value {
    font-size: 24px;
    font-weight: 700;
    color: #10b981;
  }
}

.popup-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-primary {
  padding: 10px 24px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

// === ADVANCED CALCULATION BUILDER ===
.advanced-calc-builder {
  margin-top: 12px;
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.builder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  label {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
  }
}

.btn-add-step {
  padding: 6px 12px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #059669;
    transform: translateY(-1px);
  }
}

.empty-steps {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
}

.calc-step {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 12px;
  overflow: hidden;

  &:last-child {
    margin-bottom: 0;
  }
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;

  .step-number {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.btn-remove-step {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 20px;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.step-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .popup-field {
    margin-bottom: 0;
  }
}
</style>
