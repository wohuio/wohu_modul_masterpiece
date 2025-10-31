<template>
  <div class="flow-canvas-container" :style="containerStyle">
    <!-- Background Canvas for Grid and Connections -->
    <canvas
      ref="backgroundCanvas"
      class="background-canvas"
      :width="canvasWidth"
      :height="canvasHeight"
      @mousedown="onCanvasMouseDown"
      @mousemove="onCanvasMouseMove"
      @mouseup="onCanvasMouseUp"
    ></canvas>

    <!-- Nodes Layer (HTML/CSS) -->
    <div class="nodes-layer">
      <div
        v-for="node in nodes"
        :key="node.id"
        class="flow-node"
        :style="getNodeStyle(node)"
        @mousedown="startDragNode($event, node)"
      >
        <!-- Node Header -->
        <div class="node-header" :style="{ backgroundColor: node.color }">
          <span class="node-icon">{{ node.icon }}</span>
          <span class="node-label">{{ node.label }}</span>
          <button class="node-delete" @click.stop="deleteNode(node.id)">×</button>
        </div>

        <!-- Node Body -->
        <div class="node-body">
          <div class="node-value">
            <label>Value:</label>
            <input
              type="number"
              v-model.number="node.value"
              @input="recalculate"
              class="node-input"
            />
          </div>
          <div class="node-result">
            <span>Result:</span>
            <strong>{{ formatNumber(node.calculatedValue) }}</strong>
          </div>
        </div>

        <!-- Connection Handles -->
        <div
          class="node-handle node-handle-input"
          :style="{ backgroundColor: node.color }"
          @mousedown.stop="startConnection($event, node.id, 'input')"
          @mouseup.stop="endConnection($event, node.id, 'input')"
        ></div>
        <div
          class="node-handle node-handle-output"
          :style="{ backgroundColor: node.color }"
          @mousedown.stop="startConnection($event, node.id, 'output')"
          @mouseup.stop="endConnection($event, node.id, 'output')"
        ></div>
      </div>
    </div>

    <!-- Add Node Button (Floating) -->
    <button class="add-node-btn" @click="showNodePalette = !showNodePalette">
      + Add Node
    </button>

    <!-- Node Type Palette -->
    <div v-if="showNodePalette" class="node-palette">
      <div class="palette-header">
        <h3>Add Node</h3>
        <button @click="showNodePalette = false">×</button>
      </div>
      <div
        v-for="nodeType in nodeTypes"
        :key="nodeType.id"
        class="palette-item"
        :style="{ borderLeftColor: nodeType.color }"
        @click="addNode(nodeType)"
      >
        <span class="palette-icon">{{ nodeType.icon }}</span>
        <div class="palette-info">
          <div class="palette-label">{{ nodeType.label }}</div>
          <div class="palette-type">{{ nodeType.calculationType }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "FlowCanvas",
  props: {
    content: {
      type: Object,
      required: true,
    },
  },
  emits: ['trigger-event'],
  data() {
    return {
      nodes: [],
      connections: [],
      nextNodeId: 1,

      // Dragging state
      draggingNode: null,
      dragOffset: { x: 0, y: 0 },

      // Connection state
      connectingFrom: null,
      connectingFromHandle: null,
      tempConnectionEnd: null,

      // UI state
      showNodePalette: false,

      // Canvas context
      ctx: null,
    };
  },
  computed: {
    containerStyle() {
      return {
        backgroundColor: this.content.canvasBackgroundColor || '#ffffff',
        width: `${this.canvasWidth}px`,
        height: `${this.canvasHeight}px`,
      };
    },
    canvasWidth() {
      return this.content.canvasWidth || 1200;
    },
    canvasHeight() {
      return this.content.canvasHeight || 800;
    },
    nodeTypes() {
      return this.content.nodeTypes || [];
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initCanvas();
      this.loadInitialNodes();
    });
  },
  methods: {
    initCanvas() {
      const canvas = this.$refs.backgroundCanvas;
      if (!canvas) return;

      this.ctx = canvas.getContext('2d');
      this.drawGrid();
      this.drawConnections();
    },

    drawGrid() {
      if (!this.content.showGrid || !this.ctx) return;

      const ctx = this.ctx;
      const gridSize = this.content.gridSize || 20;
      const gridColor = this.content.gridColor || '#e5e7eb';

      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x <= this.canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.canvasHeight);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= this.canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvasWidth, y);
        ctx.stroke();
      }
    },

    drawConnections() {
      if (!this.ctx) return;

      // Redraw grid first
      this.drawGrid();

      const ctx = this.ctx;
      const connectionColor = this.content.connectionColor || '#94a3b8';
      const connectionWidth = this.content.connectionWidth || 2;
      const connectionStyle = this.content.connectionStyle || 'bezier';

      ctx.strokeStyle = connectionColor;
      ctx.lineWidth = connectionWidth;

      // Draw all connections
      this.connections.forEach(conn => {
        const fromNode = this.nodes.find(n => n.id === conn.from);
        const toNode = this.nodes.find(n => n.id === conn.to);

        if (!fromNode || !toNode) return;

        const startX = fromNode.x + 250; // Node width
        const startY = fromNode.y + 60; // Middle of node
        const endX = toNode.x;
        const endY = toNode.y + 60;

        ctx.beginPath();

        if (connectionStyle === 'bezier') {
          const cp1x = startX + 100;
          const cp1y = startY;
          const cp2x = endX - 100;
          const cp2y = endY;

          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
        } else {
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
        }

        ctx.stroke();
      });

      // Draw temporary connection while dragging
      if (this.connectingFrom && this.tempConnectionEnd) {
        const fromNode = this.nodes.find(n => n.id === this.connectingFrom);
        if (fromNode) {
          ctx.strokeStyle = connectionColor;
          ctx.setLineDash([5, 5]);

          const startX = fromNode.x + 250;
          const startY = fromNode.y + 60;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(this.tempConnectionEnd.x, this.tempConnectionEnd.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    },

    loadInitialNodes() {
      const initialNodes = this.content.initialNodes || [];
      initialNodes.forEach(nodeData => {
        this.addNode(nodeData.type, nodeData.x, nodeData.y, nodeData.value);
      });
    },

    addNode(nodeType, x = null, y = null, value = null) {
      const node = {
        id: this.nextNodeId++,
        ...nodeType,
        x: x !== null ? x : 100 + Math.random() * 300,
        y: y !== null ? y : 100 + Math.random() * 300,
        value: value !== null ? value : nodeType.defaultValue,
        calculatedValue: value !== null ? value : nodeType.defaultValue,
      };

      this.nodes.push(node);
      this.showNodePalette = false;
      this.recalculate();

      this.$emit('trigger-event', {
        name: 'node-added',
        event: { node }
      });
    },

    deleteNode(nodeId) {
      this.nodes = this.nodes.filter(n => n.id !== nodeId);
      this.connections = this.connections.filter(
        c => c.from !== nodeId && c.to !== nodeId
      );
      this.drawConnections();
      this.recalculate();
    },

    getNodeStyle(node) {
      return {
        left: `${node.x}px`,
        top: `${node.y}px`,
        backgroundColor: this.content.nodeBackgroundColor || '#ffffff',
        border: `1px solid ${this.content.nodeBorderColor || '#e5e7eb'}`,
        borderRadius: `${this.content.nodeBorderRadius || 8}px`,
      };
    },

    // === DRAG & DROP ===
    startDragNode(event, node) {
      this.draggingNode = node;
      const rect = event.currentTarget.getBoundingClientRect();
      this.dragOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      document.addEventListener('mousemove', this.onDragNode);
      document.addEventListener('mouseup', this.stopDragNode);
    },

    onDragNode(event) {
      if (!this.draggingNode) return;

      const container = this.$el.getBoundingClientRect();
      this.draggingNode.x = event.clientX - container.left - this.dragOffset.x;
      this.draggingNode.y = event.clientY - container.top - this.dragOffset.y;

      this.drawConnections();
    },

    stopDragNode() {
      this.draggingNode = null;
      document.removeEventListener('mousemove', this.onDragNode);
      document.removeEventListener('mouseup', this.stopDragNode);
    },

    // === CONNECTIONS ===
    startConnection(event, nodeId, handleType) {
      if (handleType === 'output') {
        this.connectingFrom = nodeId;
        this.connectingFromHandle = 'output';
      }
    },

    endConnection(event, nodeId, handleType) {
      if (handleType === 'input' && this.connectingFrom && this.connectingFrom !== nodeId) {
        // Create connection
        this.connections.push({
          from: this.connectingFrom,
          to: nodeId,
        });
        this.recalculate();
      }

      this.connectingFrom = null;
      this.connectingFromHandle = null;
      this.tempConnectionEnd = null;
      this.drawConnections();
    },

    onCanvasMouseDown() {},

    onCanvasMouseMove(event) {
      if (this.connectingFrom) {
        const rect = this.$refs.backgroundCanvas.getBoundingClientRect();
        this.tempConnectionEnd = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
        this.drawConnections();
      }
    },

    onCanvasMouseUp() {
      this.connectingFrom = null;
      this.tempConnectionEnd = null;
      this.drawConnections();
    },

    // === CALCULATION ENGINE ===
    recalculate() {
      // Build dependency graph
      const graph = {};
      this.nodes.forEach(n => {
        graph[n.id] = {
          node: n,
          inputs: this.connections.filter(c => c.to === n.id).map(c => c.from),
        };
      });

      // Topological sort
      const visited = new Set();
      const sorted = [];

      const visit = (id) => {
        if (visited.has(id)) return;
        visited.add(id);

        const inputs = graph[id]?.inputs || [];
        inputs.forEach(inputId => visit(inputId));
        sorted.push(id);
      };

      Object.keys(graph).forEach(id => visit(parseInt(id)));

      // Calculate values
      sorted.forEach(id => {
        const nodeData = graph[id];
        if (!nodeData) return;

        const node = nodeData.node;
        const inputs = nodeData.inputs;

        let inputValue = node.value;

        // Sum all inputs
        if (inputs.length > 0) {
          inputValue = inputs.reduce((sum, fromId) => {
            const fromNode = this.nodes.find(n => n.id === fromId);
            return sum + (fromNode?.calculatedValue || 0);
          }, 0);
        }

        // Apply calculation based on type
        switch (node.calculationType) {
          case 'fixed':
            node.calculatedValue = node.value;
            break;
          case 'percentage':
            node.calculatedValue = inputValue + (inputValue * node.value / 100);
            break;
          case 'multiply':
            node.calculatedValue = inputValue * node.value;
            break;
          case 'add':
            node.calculatedValue = inputValue + node.value;
            break;
          case 'subtract':
            node.calculatedValue = inputValue - node.value;
            break;
          default:
            node.calculatedValue = inputValue;
        }
      });

      this.$emit('trigger-event', {
        name: 'calculation-updated',
        event: {
          nodes: this.nodes.map(n => ({
            id: n.id,
            value: n.value,
            calculatedValue: n.calculatedValue,
          })),
        },
      });
    },

    formatNumber(num) {
      return num?.toFixed(2) || '0.00';
    },
  },
};
</script>

<style scoped lang="scss">
.flow-canvas-container {
  position: relative;
  overflow: hidden;
  display: block;
  min-height: 600px;
}

.background-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto;
}

.nodes-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.flow-node {
  position: absolute;
  width: 250px;
  pointer-events: auto;
  cursor: move;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
}

.node-header {
  padding: 12px 16px;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px 8px 0 0;
  font-weight: 600;
  font-size: 14px;
}

.node-icon {
  font-size: 18px;
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
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.node-body {
  padding: 16px;
}

.node-value {
  margin-bottom: 12px;

  label {
    display: block;
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .node-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
  }
}

.node-result {
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 4px;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    color: #6b7280;
  }

  strong {
    color: #10b981;
    font-size: 15px;
  }
}

.node-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  cursor: pointer;
  z-index: 10;

  &:hover {
    transform: scale(1.3);
  }
}

.node-handle-input {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
}

.node-handle-output {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
}

.add-node-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  z-index: 100;

  &:hover {
    background: #2563eb;
  }
}

.node-palette {
  position: absolute;
  bottom: 80px;
  right: 20px;
  width: 280px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 100;
  max-height: 500px;
  overflow-y: auto;
}

.palette-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
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
    border-radius: 4px;

    &:hover {
      background: #f3f4f6;
    }
  }
}

.palette-item {
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
}

.palette-icon {
  font-size: 24px;
}

.palette-info {
  flex: 1;
}

.palette-label {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}

.palette-type {
  font-size: 12px;
  color: #6b7280;
}
</style>
