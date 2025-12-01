// Graph Types for Data Swamp Explorer

export interface GraphNode {
  id: string;
  label: string;
  type: 'root' | 'year' | 'principle' | 'aspect' | 'direktorat' | 'document';
  status: 'processed' | 'processing' | 'failed' | 'unprocessed';
  metadata?: {
    // Document metadata (from DocumentMetadata interface)
    title?: string;
    documentNumber?: string;
    documentDate?: string;
    description?: string;
    gcgPrinciple?: string;
    documentType?: string;
    documentCategory?: string;
    direksi?: string;
    division?: string;
    fileName?: string;
    fileSize?: number;
    sizeFormatted?: string;
    status?: string;
    confidentiality?: string;
    year?: number;
    uploadedBy?: string;
    uploadDate?: string;
    checklistId?: number;
    checklistDescription?: string;
    aspect?: string;
    
    // Aggregate metadata (for parent nodes)
    totalDocuments?: number;
    publishedDocuments?: number;
    totalSize?: number;
    principle?: string;
    
    // Position for graph layout
    x?: number;
    y?: number;
    fx?: number; // Fixed position
    fy?: number; // Fixed position
  };
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'hierarchy' | 'reference' | 'dependency';
  metadata?: {
    strength?: number;
    distance?: number;
    label?: string;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphLayout {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface GraphFilters {
  year?: string;
  status?: string;
  type?: string;
  search?: string;
}

export interface GraphViewState {
  selectedNode: GraphNode | null;
  hoveredNode: GraphNode | null;
  zoom: number;
  panX: number;
  panY: number;
  filters: GraphFilters;
}

// Node styling
export interface NodeStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number;
  opacity: number;
}

// Edge styling
export interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  opacity: number;
  strokeDasharray?: string;
}

// Graph visualization config
export interface GraphConfig {
  node: {
    defaultRadius: number;
    selectedRadius: number;
    hoveredRadius: number;
    minRadius: number;
    maxRadius: number;
  };
  edge: {
    defaultWidth: number;
    selectedWidth: number;
    defaultOpacity: number;
    selectedOpacity: number;
  };
  layout: {
    linkDistance: number;
    linkStrength: number;
    chargeStrength: number;
    collisionRadius: number;
    alphaDecay: number;
    velocityDecay: number;
  };
  colors: {
    nodes: {
      root: string;
      year: string;
      principle: string;
      aspect: string;
      direktorat: string;
      document: string;
    };
    status: {
      processed: string;
      processing: string;
      failed: string;
      unprocessed: string;
    };
    edges: {
      hierarchy: string;
      reference: string;
      dependency: string;
    };
  };
}

// Default graph configuration
export const DEFAULT_GRAPH_CONFIG: GraphConfig = {
  node: {
    defaultRadius: 8,
    selectedRadius: 12,
    hoveredRadius: 10,
    minRadius: 4,
    maxRadius: 20
  },
  edge: {
    defaultWidth: 1.5,
    selectedWidth: 3,
    defaultOpacity: 0.6,
    selectedOpacity: 0.9
  },
  layout: {
    linkDistance: 80,
    linkStrength: 0.8,
    chargeStrength: -200,
    collisionRadius: 15,
    alphaDecay: 0.0228,
    velocityDecay: 0.4
  },
  colors: {
    nodes: {
      root: '#8B5CF6',      // Purple
      year: '#3B82F6',      // Blue  
      principle: '#F59E0B', // Orange
      aspect: '#10B981',    // Green
      direktorat: '#6366F1',// Indigo
      document: '#6B7280'   // Gray
    },
    status: {
      processed: '#10B981', // Green
      processing: '#F59E0B', // Yellow/Orange
      failed: '#EF4444',     // Red
      unprocessed: '#6B7280' // Gray
    },
    edges: {
      hierarchy: '#6B7280',  // Gray
      reference: '#3B82F6',  // Blue
      dependency: '#8B5CF6'  // Purple
    }
  }
};

export type NodeType = GraphNode['type'];
export type EdgeType = GraphEdge['type'];
export type StatusType = GraphNode['status'];