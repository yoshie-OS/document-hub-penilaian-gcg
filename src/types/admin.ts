// Admin Dashboard Integration Types
export interface ChecklistAssignment {
  id: number;
  aspek: string;
  deskripsi: string;
  assignedTo: string; // subdirektorat admin
  assignedBy: string; // superadmin
  assignedDate: Date;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  tahun: number;
  requiredDocuments: string[];
  format: 'pdf' | 'doc' | 'xlsx';
  maxSize: number; // MB
  validationRules: string[];
}

export interface DocumentSubmission {
  id: number;
  checklistId: number;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  uploadedBy: string; // admin name
  subdirektorat: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'revision_required';
  notes: string;
  version: number;
  fileUrl: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewDate?: Date;
}

export interface AdminProgress {
  subdirektorat: string;
  totalAssigned: number;
  completed: number;
  pending: number;
  overdue: number;
  lastUpdate: Date;
  performance: number; // percentage
  tahun: number;
}

export interface SupportRequest {
  id: number;
  checklistId: number;
  requestType: 'clarification' | 'extension' | 'support' | 'feedback';
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  responseFrom?: string; // superadmin
  responseMessage?: string;
  responseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: number;
  type: 'assignment' | 'deadline' | 'feedback' | 'support' | 'system';
  title: string;
  message: string;
  recipient: string; // subdirektorat atau 'all'
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface DashboardStats {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  overdueAssignments: number;
  overallProgress: number;
  recentSubmissions: DocumentSubmission[];
  upcomingDeadlines: ChecklistAssignment[];
  supportRequests: SupportRequest[];
}
