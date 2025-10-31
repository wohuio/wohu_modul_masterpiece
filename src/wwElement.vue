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
      <g :transform="`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`">
        <!-- Edges -->
        <g class="edges-layer">
          <path
            v-for="edge in edges"
            :key="`${edge.source}-${edge.target}`"
            :d="getEdgePath(edge)"
            :stroke="content.connectionColor || '#b1b1b7'"
            :stroke-width="content.connectionWidth || 2"
            fill="none"
            class="react-flow-edge"
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
              <label>Value</label>
              <input
                type="number"
                v-model.number="node.data.value"
                @input="onNodeDataChange(node)"
                class="node-input"
              />
            </div>
            <div class="node-result">
              <span>Result</span>
              <strong>{{ formatValue(node.data.result || 0) }}</strong>
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

      // UI
      showNodeMenu: false,
      isLocked: false,
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
    'content.initialEdges': {
      handler(newEdges) {
        if (newEdges && newEdges.length > 0) {
          this.loadEdgesFromAPI(newEdges);
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
          id: apiNode.id || `node-${this.nextNodeId++}`,
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
          },
        };
      });
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
          calculationType: nodeType.calculationType,
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
        this.connectingFrom = node.id;
        this.connectingFromType = 'source';
      }
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
      this.connectingFrom = null;
      this.connectingFromType = null;
    },

    // === EDGE RENDERING ===
    getEdgePath(edge) {
      const sourceNode = this.nodes.find(n => n.id === edge.source);
      const targetNode = this.nodes.find(n => n.id === edge.target);

      if (!sourceNode || !targetNode) return '';

      const sourceX = sourceNode.position.x + 280;
      const sourceY = sourceNode.position.y + 70;
      const targetX = targetNode.position.x;
      const targetY = targetNode.position.y + 70;

      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const offset = Math.abs(dx) * 0.5;

      return `M ${sourceX} ${sourceY} C ${sourceX + offset} ${sourceY}, ${targetX - offset} ${targetY}, ${targetX} ${targetY}`;
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
            result = value;
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
        }

        node.data.result = result;
      });
    },

    formatValue(val) {
      return typeof val === 'number' ? val.toFixed(2) : '0.00';
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
  margin-bottom: 12px;

  label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  .node-input {
    width: 100%;
    padding: 8px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 14px;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
}

.node-result {
  padding: 10px 12px;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #86efac;

  span {
    font-size: 11px;
    font-weight: 600;
    color: #059669;
    text-transform: uppercase;
  }

  strong {
    font-size: 16px;
    font-weight: 700;
    color: #059669;
  }
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
</style>
