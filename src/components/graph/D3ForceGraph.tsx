import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphEdge, GraphData, DEFAULT_GRAPH_CONFIG } from '@/types/graph';

interface D3ForceGraphProps {
  data: GraphData;
  width: number;
  height: number;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  selectedNodeId?: string;
}

interface D3Node extends d3.SimulationNodeDatum, GraphNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node>, GraphEdge {
  source: D3Node;
  target: D3Node;
}

const D3ForceGraph: React.FC<D3ForceGraphProps> = ({
  data,
  width,
  height,
  onNodeClick,
  onNodeHover,
  selectedNodeId
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);

  // Get node color based on type and status
  const getNodeColor = (node: GraphNode): string => {
    const config = DEFAULT_GRAPH_CONFIG;
    
    // Primary color by type
    let baseColor = config.colors.nodes[node.type as keyof typeof config.colors.nodes] || config.colors.nodes.file;
    
    // Modify based on status
    switch (node.status) {
      case 'failed':
        return config.colors.status.failed;
      case 'processing':
        return config.colors.status.processing;
      case 'unprocessed':
        return config.colors.status.unprocessed;
      default:
        return baseColor;
    }
  };

  // Get node radius based on type and metadata
  const getNodeRadius = (node: GraphNode): number => {
    const config = DEFAULT_GRAPH_CONFIG;
    
    switch (node.type) {
      case 'root':
        return 18;
      case 'year':
        return 14;
      case 'principle':
        return 12;
      case 'aspect':
        return 12;
      case 'direktorat':
        return 10;
      case 'document':
        // Size based on file size or importance
        const fileSize = node.metadata?.fileSize || 0;
        if (fileSize > 3000000) return 8; // Large files (>3MB)
        if (fileSize > 1000000) return 7; // Medium files (1-3MB)
        return 6; // Small files (<1MB)
      default:
        return config.node?.defaultRadius || 6;
    }
  };

  // Get edge color and style
  const getEdgeStyle = (edge: GraphEdge) => {
    const config = DEFAULT_GRAPH_CONFIG;
    
    switch (edge.type) {
      case 'hierarchy':
        return {
          stroke: config.colors.edges.hierarchy,
          strokeWidth: 1.5, // Reduced from 2
          strokeOpacity: 0.5, // Slightly more transparent
          strokeDasharray: 'none'
        };
      case 'reference':
        return {
          stroke: config.colors.edges.reference,
          strokeWidth: 1, // Reduced from 1.5
          strokeOpacity: 0.3, // More transparent
          strokeDasharray: '4,4' // Smaller dash pattern
        };
      case 'dependency':
        return {
          stroke: config.colors.edges.dependency,
          strokeWidth: 0.8, // Reduced from 1
          strokeOpacity: 0.25, // More transparent
          strokeDasharray: '2,2' // Smaller dash pattern
        };
      default:
        return {
          stroke: '#999',
          strokeWidth: 1,
          strokeOpacity: 0.6,
          strokeDasharray: 'none'
        };
    }
  };

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) {
      console.log('D3ForceGraph: Missing SVG ref or no nodes', { 
        svgRef: !!svgRef.current, 
        nodesLength: data.nodes.length 
      });
      return;
    }
    
    console.log('D3ForceGraph: Starting render with', data.nodes.length, 'nodes');

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    // Prepare data
    const nodes: D3Node[] = data.nodes.map(d => ({ ...d }));
    const links: D3Link[] = data.edges.map(d => ({
      ...d,
      source: nodes.find(n => n.id === d.from)!,
      target: nodes.find(n => n.id === d.to)!
    })).filter(d => d.source && d.target);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        const { transform } = event;
        setTransform(transform);
        g.attr('transform', transform);
      });

    svg.call(zoom);

    // Create hierarchical positioning forces
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Define cluster positions for each node type
    const clusterPositions = {
      root: { x: centerX, y: centerY },
      year: { x: centerX, y: centerY - 120 },
      principle: { x: centerX - 200, y: centerY },
      aspect: { x: centerX + 200, y: centerY },
      direktorat: { x: centerX, y: centerY + 120 },
      document: { x: centerX, y: centerY + 200 }
    };

    // Create main group
    const g = svg.append('g');
    
    // Add cluster background circles for visual organization
    const clusterBackgrounds = g.append('g').attr('class', 'cluster-backgrounds');
    
    Object.entries(clusterPositions).forEach(([type, pos]) => {
      if (type === 'root') return; // Skip root cluster background
      
      const radius = type === 'document' ? 100 : 80;
      const color = type === 'year' ? '#EFF6FF' : 
                   type === 'principle' ? '#FEF3C7' :
                   type === 'aspect' ? '#ECFDF5' :
                   type === 'direktorat' ? '#EEF2FF' : '#F9FAFB';
      
      clusterBackgrounds.append('circle')
        .attr('cx', pos.x)
        .attr('cy', pos.y)
        .attr('r', radius)
        .attr('fill', color)
        .attr('stroke', '#E5E7EB')
        .attr('stroke-width', 1)
        .attr('opacity', 0.3);
    });
    
    // Create simulation with hierarchical forces
    const simulation = d3.forceSimulation<D3Node>(nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(links)
        .id(d => d.id)
        .distance(d => {
          // Hierarchical distances - closer within same type
          const source = d.source as D3Node;
          const target = d.target as D3Node;
          if (source.type === target.type) return 60;
          if (d.type === 'hierarchy') return 100;
          if (d.type === 'reference') return 120;
          return 150;
        })
        .strength(0.6)
      )
      .force('charge', d3.forceManyBody()
        .strength(d => {
          // Stronger repulsion for cluster centers
          switch (d.type) {
            case 'root': return -800;
            case 'year':
            case 'principle': 
            case 'aspect':
            case 'direktorat': return -500;
            case 'document': return -200;
            default: return -300;
          }
        })
      )
      .force('center', d3.forceCenter(centerX, centerY))
      .force('collision', d3.forceCollide()
        .radius(d => getNodeRadius(d) + 15) // More spacing between nodes
        .strength(0.8)
      )
      // Clustering forces - attract nodes to their type clusters
      .force('cluster', () => {
        nodes.forEach(node => {
          if (!node.x || !node.y) return;
          
          const cluster = clusterPositions[node.type as keyof typeof clusterPositions];
          if (!cluster) return;
          
          const strength = node.type === 'document' ? 0.05 : 0.1;
          const dx = cluster.x - node.x;
          const dy = cluster.y - node.y;
          
          node.vx = (node.vx || 0) + dx * strength;
          node.vy = (node.vy || 0) + dy * strength;
        });
      })
      // Radial positioning for same-type nodes
      .force('radial', d3.forceRadial(
        d => {
          switch (d.type) {
            case 'root': return 0;
            case 'year': return 80;
            case 'principle': 
            case 'aspect': return 120;
            case 'direktorat': return 140;
            case 'document': return 180;
            default: return 100;
          }
        },
        centerX,
        centerY
      ).strength(0.3));

    simulationRef.current = simulation;

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => getEdgeStyle(d).stroke)
      .attr('stroke-width', d => getEdgeStyle(d).strokeWidth)
      .attr('stroke-opacity', d => getEdgeStyle(d).strokeOpacity)
      .attr('stroke-dasharray', d => getEdgeStyle(d).strokeDasharray)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        // Highlight the edge on hover
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke-opacity', 0.8)
          .attr('stroke-width', Math.max(getEdgeStyle(d).strokeWidth * 1.3, 2)); // Subtle thickening
      })
      .on('mouseleave', function(event, d) {
        // Reset the edge
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke-opacity', getEdgeStyle(d).strokeOpacity)
          .attr('stroke-width', getEdgeStyle(d).strokeWidth);
      });

    // Create nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', d => selectedNodeId === d.id ? '#8B5CF6' : '#fff') 
      .attr('stroke-width', d => selectedNodeId === d.id ? 3 : 1.5)
      .style('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, D3Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d);
      })
      .on('mouseenter', (event, d) => {
        onNodeHover?.(d);
        
        // Highlight the hovered node
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('r', getNodeRadius(d) * 1.5);
        
        // Find connected edges
        const connectedEdges = links.filter(link => 
          (link.source as D3Node).id === d.id || (link.target as D3Node).id === d.id
        );
        
        // Highlight connected edges
        link
          .transition()
          .duration(150)
          .attr('stroke-opacity', (linkData) => {
            const isConnected = connectedEdges.some(edge => 
              edge === linkData || 
              ((edge.source as D3Node).id === (linkData.source as D3Node).id && 
               (edge.target as D3Node).id === (linkData.target as D3Node).id)
            );
            return isConnected ? 0.8 : 0.1; // Highlight connected, dim others
          })
          .attr('stroke-width', (linkData) => {
            const isConnected = connectedEdges.some(edge => 
              edge === linkData || 
              ((edge.source as D3Node).id === (linkData.source as D3Node).id && 
               (edge.target as D3Node).id === (linkData.target as D3Node).id)
            );
            const originalWidth = getEdgeStyle(linkData).strokeWidth;
            return isConnected ? Math.max(originalWidth * 1.5, 2) : originalWidth; // Modest thickening, max 2px
          });
        
        // Dim non-connected nodes
        node
          .transition()
          .duration(150)
          .attr('opacity', (nodeData) => {
            if (nodeData.id === d.id) return 1; // Keep hovered node fully visible
            
            const isConnected = connectedEdges.some(edge => 
              (edge.source as D3Node).id === nodeData.id || 
              (edge.target as D3Node).id === nodeData.id
            );
            return isConnected ? 1 : 0.3; // Dim non-connected nodes
          });
        
        // Highlight/dim node labels
        labels
          .transition()
          .duration(150)
          .attr('opacity', (nodeData) => {
            if (nodeData.id === d.id) return 1; // Keep hovered node label fully visible
            
            const isConnected = connectedEdges.some(edge => 
              (edge.source as D3Node).id === nodeData.id || 
              (edge.target as D3Node).id === nodeData.id
            );
            return isConnected ? 1 : 0.2; // Dim non-connected labels more than nodes
          })
          .attr('font-weight', (nodeData) => {
            if (nodeData.id === d.id) return 'bold'; // Make hovered label bold
            
            const isConnected = connectedEdges.some(edge => 
              (edge.source as D3Node).id === nodeData.id || 
              (edge.target as D3Node).id === nodeData.id
            );
            return isConnected ? 'bold' : 'normal'; // Bold for connected, normal for others
          });
      })
      .on('mouseleave', (event, d) => {
        onNodeHover?.(null);
        
        // Reset the hovered node
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('r', getNodeRadius(d));
        
        // Reset all edges to original state
        link
          .transition()
          .duration(150)
          .attr('stroke-opacity', (linkData) => getEdgeStyle(linkData).strokeOpacity)
          .attr('stroke-width', (linkData) => getEdgeStyle(linkData).strokeWidth);
        
        // Reset all nodes to full opacity
        node
          .transition()
          .duration(150)
          .attr('opacity', 1);
        
        // Reset all node labels to original state
        labels
          .transition()
          .duration(150)
          .attr('opacity', 1)
          .attr('font-weight', 'normal');
      });

    // Add cluster labels
    const clusterLabels = g.append('g').attr('class', 'cluster-labels');
    
    const clusterLabelData = [
      { type: 'year', label: 'TAHUN', pos: clusterPositions.year },
      { type: 'principle', label: 'PRINSIP GCG', pos: clusterPositions.principle },
      { type: 'aspect', label: 'ASPEK', pos: clusterPositions.aspect },
      { type: 'direktorat', label: 'DIREKTORAT', pos: clusterPositions.direktorat },
      { type: 'document', label: 'DOKUMEN', pos: clusterPositions.document }
    ];
    
    clusterLabels.selectAll('text')
      .data(clusterLabelData)
      .join('text')
      .text(d => d.label)
      .attr('x', d => d.pos.x)
      .attr('y', d => d.pos.y - 100)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#6B7280')
      .attr('opacity', 0.7)
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Create labels for important nodes
    const labels = g.append('g')
      .selectAll('text')
      .data(nodes.filter(d => ['root', 'year', 'principle', 'aspect', 'direktorat'].includes(d.type)))
      .join('text')
      .text(d => d.label)
      .attr('font-size', d => {
        switch (d.type) {
          case 'root': return '16px';
          case 'year': return '12px';
          case 'principle': return '11px';
          case 'aspect': return '10px';
          case 'direktorat': return '9px';
          default: return '10px';
        }
      })
      .attr('font-weight', d => d.type === 'root' ? 'bold' : 'normal')
      .attr('fill', '#333')
      .attr('text-anchor', 'middle')
      .attr('dy', d => getNodeRadius(d) + 15)
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as D3Node).x!)
        .attr('y1', d => (d.source as D3Node).y!)
        .attr('x2', d => (d.target as D3Node).x!)
        .attr('y2', d => (d.target as D3Node).y!);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      labels
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, width, height, selectedNodeId, onNodeClick, onNodeHover]);

  // Update node selection styling
  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('circle')
      .filter(function() { return d3.select(this).datum(); }) // Only process circles with data
      .attr('stroke', (d: any) => selectedNodeId === d?.id ? '#8B5CF6' : '#fff')
      .attr('stroke-width', (d: any) => selectedNodeId === d?.id ? 3 : 1.5);
  }, [selectedNodeId, data.nodes.length]);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-full"
      >
        {/* Background for zoom/pan */}
        <rect
          width={width}
          height={height}
          fill="transparent"
          style={{ cursor: 'grab' }}
        />
      </svg>
      
      {/* Controls overlay */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg p-2 shadow-lg">
        <div className="text-xs text-gray-600 space-y-1">
          <div>🎯 <strong>Klik</strong>: Pilih node</div>
          <div>🖱️ <strong>Drag</strong>: Pindah node</div>
          <div>✨ <strong>Hover</strong>: Lihat koneksi</div>
          <div>🔍 <strong>Scroll</strong>: Zoom</div>
          <div>✋ <strong>Pan</strong>: Drag background</div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
        <div className="text-xs space-y-2">
          <div className="font-medium">Jenis Node:</div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
            <span>Hub GCG</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Tahun</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Prinsip GCG</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Aspek</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span>Direktorat</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            <span>Dokumen</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default D3ForceGraph;