// Graph Data Service - Maps GCG document metadata to graph structure
import { GraphNode, GraphEdge, GraphData } from '@/types/graph';
import { DocumentMetadata as BaseDocumentMetadata } from '@/contexts/DocumentMetadataContext';

// Extended DocumentMetadata interface for graph service
interface DocumentMetadata extends BaseDocumentMetadata {
  gcgPrinciple?: string;
  documentType?: string;
  direksi?: string;
}
// Simple fallback function for seed data
const initializeDocumentMetadata = (): DocumentMetadata[] => {
  return [
    {
      id: '1',
      title: 'Pedoman Good Corporate Governance 2024',
      documentNumber: 'GCG-001/2024',
      documentDate: '2024-01-15',
      description: 'Pedoman pelaksanaan Good Corporate Governance tahun 2024',
      direktorat: 'Direktorat Utama',
      subdirektorat: 'Sub Direktorat Governance',
      division: 'Divisi Compliance',
      fileName: 'pedoman-gcg-2024.pdf',
      fileSize: 2048576,
      fileUrl: '/uploads/pedoman-gcg-2024.pdf',
      status: 'published',
      confidentiality: 'Internal',
      year: 2024,
      uploadedBy: 'admin@example.com',
      uploadDate: '2024-01-15T10:00:00Z',
      checklistId: 1,
      checklistDescription: 'Implementasi GCG',
      aspect: 'ASPEK I. Komitmen',
      gcgPrinciple: 'Transparency',
      documentType: 'Kebijakan',
      direksi: 'Direktorat Utama'
    }
  ];
};

// Get document data from localStorage or initialize with seed data
const getDocumentData = (): DocumentMetadata[] => {
  try {
    const savedData = localStorage.getItem('documentMetadata');
    if (savedData) {
      const parsedData: BaseDocumentMetadata[] = JSON.parse(savedData);
      // Extend with default values for graph fields
      return parsedData.map(doc => ({
        ...doc,
        gcgPrinciple: (doc as any).gcgPrinciple || 'Transparency',
        documentType: (doc as any).documentType || 'Kebijakan',
        direksi: (doc as any).direksi || 'Non Direktorat'
      }));
    }
    return initializeDocumentMetadata();
  } catch (error) {
    console.error('Error loading document data:', error);
    return initializeDocumentMetadata();
  }
};

class GraphDataService {
  private createNodeId(type: string, identifier: string): string {
    return `${type}-${identifier.replace(/[^a-zA-Z0-9]/g, '-')}`;
  }

  private getDocumentStatusMapping(status: string): 'processed' | 'processing' | 'failed' | 'unprocessed' {
    // Map DocumentMetadata status to graph status
    switch (status) {
      case 'published': return 'processed';
      case 'draft': return 'processing';
      case 'rejected': return 'failed';
      case 'pending': return 'processing';
      default: return 'unprocessed';
    }
  }

  private getDocumentTypeMapping(documentType: string): string {
    // Normalize document types for graph visualization
    switch (documentType.toLowerCase()) {
      case 'kebijakan': return 'policy';
      case 'laporan': return 'report';
      case 'risalah': return 'minutes';
      case 'dokumentasi': return 'documentation';
      default: return documentType.toLowerCase();
    }
  }

  public async generateGraphData(): Promise<GraphData> {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    
    // Get document data
    const documents = getDocumentData();
    const publishedDocs = documents.filter(d => d.status === 'published');
    
    // Root node - GCG Document Hub
    const rootId = 'gcg-hub-root';
    nodes.push({
      id: rootId,
      label: 'GCG Document Hub',
      type: 'root',
      status: 'processed',
      metadata: {
        totalDocuments: documents.length,
        publishedDocuments: publishedDocs.length,
        totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
        description: 'Sistem manajemen dokumen Good Corporate Governance'
      }
    });

    // Create year clusters
    const years = [...new Set(documents.map(d => d.year))].sort((a, b) => b - a);
    const yearNodes = new Map<number, string>();
    
    years.forEach(year => {
      const yearId = this.createNodeId('year', year.toString());
      yearNodes.set(year, yearId);
      
      const yearDocs = documents.filter(d => d.year === year);
      const publishedCount = yearDocs.filter(d => d.status === 'published').length;
      
      nodes.push({
        id: yearId,
        label: `${year}`,
        type: 'year',
        status: publishedCount === yearDocs.length ? 'processed' : 'processing',
        metadata: {
          year,
          totalDocuments: yearDocs.length,
          publishedDocuments: publishedCount,
          totalSize: yearDocs.reduce((sum, doc) => sum + doc.fileSize, 0),
          description: `Dokumen GCG tahun ${year}`
        }
      });
      
      edges.push({
        from: rootId,
        to: yearId,
        type: 'hierarchy'
      });
    });

    // Create GCG Principle clusters
    const principles = [...new Set(documents.map(d => d.gcgPrinciple))];
    const principleNodes = new Map<string, string>();
    
    principles.forEach(principle => {
      const principleId = this.createNodeId('principle', principle);
      principleNodes.set(principle, principleId);
      
      const principleDocs = documents.filter(d => d.gcgPrinciple === principle);
      const publishedCount = principleDocs.filter(d => d.status === 'published').length;
      
      nodes.push({
        id: principleId,
        label: principle,
        type: 'principle',
        status: publishedCount === principleDocs.length ? 'processed' : 'processing',
        metadata: {
          principle,
          totalDocuments: principleDocs.length,
          publishedDocuments: publishedCount,
          description: `Prinsip GCG: ${principle}`
        }
      });
      
      edges.push({
        from: rootId,
        to: principleId,
        type: 'hierarchy'
      });
    });

    // Create Aspect clusters
    const aspects = [...new Set(documents.filter(d => d.aspect).map(d => d.aspect!))];
    const aspectNodes = new Map<string, string>();
    
    aspects.forEach(aspect => {
      const aspectId = this.createNodeId('aspect', aspect);
      aspectNodes.set(aspect, aspectId);
      
      const aspectDocs = documents.filter(d => d.aspect === aspect);
      const publishedCount = aspectDocs.filter(d => d.status === 'published').length;
      
      nodes.push({
        id: aspectId,
        label: aspect.replace('ASPEK ', ''),
        type: 'aspect',
        status: publishedCount === aspectDocs.length ? 'processed' : 'processing',
        metadata: {
          aspect,
          totalDocuments: aspectDocs.length,
          publishedDocuments: publishedCount,
          description: aspect
        }
      });
      
      edges.push({
        from: rootId,
        to: aspectId,
        type: 'hierarchy'
      });
    });

    // Create Direktorat clusters
    const direktorats = [...new Set(documents.map(d => d.direksi))].filter(d => d !== 'Non Direktorat');
    const direktoratNodes = new Map<string, string>();
    
    direktorats.forEach(direksi => {
      const direktoratId = this.createNodeId('direktorat', direksi);
      direktoratNodes.set(direksi, direktoratId);
      
      const direktoratDocs = documents.filter(d => d.direksi === direksi);
      const publishedCount = direktoratDocs.filter(d => d.status === 'published').length;
      
      nodes.push({
        id: direktoratId,
        label: direksi.replace('Direktorat ', ''),
        type: 'direktorat',
        status: publishedCount === direktoratDocs.length ? 'processed' : 'processing',
        metadata: {
          direksi,
          totalDocuments: direktoratDocs.length,
          publishedDocuments: publishedCount,
          description: direksi
        }
      });
      
      edges.push({
        from: rootId,
        to: direktoratId,
        type: 'hierarchy'
      });
    });

    // Create document nodes (limit to most important ones initially to reduce clutter)
    const importantDocs = documents
      .filter(doc => doc.status === 'published') // Only show published documents
      .sort((a, b) => b.fileSize - a.fileSize) // Sort by file size (larger = more important)
      .slice(0, 20); // Limit to 20 most important documents
    
    importantDocs.forEach(doc => {
      const docId = this.createNodeId('document', doc.id);
      
      nodes.push({
        id: docId,
        label: doc.title.length > 25 ? doc.title.substring(0, 25) + '...' : doc.title,
        type: 'document',
        status: this.getDocumentStatusMapping(doc.status),
        metadata: {
          ...doc,
          documentType: this.getDocumentTypeMapping(doc.documentType),
          sizeFormatted: `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB`
        }
      });
      
      // Connect to year
      const yearId = yearNodes.get(doc.year);
      if (yearId) {
        edges.push({
          from: yearId,
          to: docId,
          type: 'hierarchy'
        });
      }
      
      // Connect to principle
      const principleId = principleNodes.get(doc.gcgPrinciple);
      if (principleId) {
        edges.push({
          from: principleId,
          to: docId,
          type: 'reference'
        });
      }
      
      // Connect to aspect if available
      if (doc.aspect) {
        const aspectId = aspectNodes.get(doc.aspect);
        if (aspectId) {
          edges.push({
            from: aspectId,
            to: docId,
            type: 'reference'
          });
        }
      }
      
      // Connect to direktorat if not "Non Direktorat"
      if (doc.direksi !== 'Non Direktorat') {
        const direktoratId = direktoratNodes.get(doc.direksi);
        if (direktoratId) {
          edges.push({
            from: direktoratId,
            to: docId,
            type: 'dependency'
          });
        }
      }
    });

    // Create cross-references for documents with same checklistId (only for important docs)
    this.createChecklistRelations(importantDocs, nodes, edges);

    return { nodes, edges };
  }

  private createChecklistRelations(documents: DocumentMetadata[], nodes: GraphNode[], edges: GraphEdge[]) {
    // Group documents by checklistId to create cross-references
    const checklistGroups = new Map<number, DocumentMetadata[]>();
    
    documents.forEach(doc => {
      if (doc.checklistId) {
        if (!checklistGroups.has(doc.checklistId)) {
          checklistGroups.set(doc.checklistId, []);
        }
        checklistGroups.get(doc.checklistId)!.push(doc);
      }
    });
    
    // Create cross-reference edges for documents with same checklist
    checklistGroups.forEach((docs, checklistId) => {
      if (docs.length > 1) {
        // Connect documents with same checklist across different years
        for (let i = 0; i < docs.length; i++) {
          for (let j = i + 1; j < docs.length; j++) {
            const doc1Id = this.createNodeId('document', docs[i].id);
            const doc2Id = this.createNodeId('document', docs[j].id);
            
            edges.push({
              from: doc1Id,
              to: doc2Id,
              type: 'reference'
            });
          }
        }
      }
    });
  }

  public async getNodeDetails(nodeId: string): Promise<GraphNode | null> {
    const graphData = await this.generateGraphData();
    return graphData.nodes.find(node => node.id === nodeId) || null;
  }

  public async getFilteredData(filters: {
    year?: string;
    status?: string;
    type?: string;
    search?: string;
  }): Promise<GraphData> {
    const fullData = await this.generateGraphData();
    
    let filteredNodes = fullData.nodes;
    
    if (filters.year && filters.year !== 'all') {
      filteredNodes = filteredNodes.filter(node => 
        node.metadata?.year?.toString() === filters.year ||
        node.type === 'root' ||
        (node.type === 'year' && node.label === filters.year)
      );
    }
    
    if (filters.status && filters.status !== 'all') {
      filteredNodes = filteredNodes.filter(node => 
        node.status === filters.status || 
        node.type === 'root' ||
        ['year', 'principle', 'aspect', 'direktorat'].includes(node.type)
      );
    }
    
    if (filters.type && filters.type !== 'all') {
      // Map filter types to our new node types
      const typeMapping: { [key: string]: string[] } = {
        'document': ['document'],
        'principle': ['principle'],
        'aspect': ['aspect'],
        'direktorat': ['direktorat'],
        'year': ['year']
      };
      
      const allowedTypes = typeMapping[filters.type] || [filters.type];
      filteredNodes = filteredNodes.filter(node => 
        allowedTypes.includes(node.type) || 
        node.type === 'root'
      );
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredNodes = filteredNodes.filter(node => 
        node.label.toLowerCase().includes(searchTerm) ||
        node.metadata?.title?.toLowerCase().includes(searchTerm) ||
        node.metadata?.description?.toLowerCase().includes(searchTerm) ||
        node.metadata?.documentNumber?.toLowerCase().includes(searchTerm) ||
        node.type === 'root'
      );
    }
    
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = fullData.edges.filter(edge => 
      filteredNodeIds.has(edge.from) && filteredNodeIds.has(edge.to)
    );
    
    return { nodes: filteredNodes, edges: filteredEdges };
  }
}

export const graphDataService = new GraphDataService();
export default GraphDataService;

// Export types for use in components
export type { DocumentMetadata };