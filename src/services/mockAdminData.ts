import { 
  ChecklistAssignment, 
  DocumentSubmission, 
  AdminProgress, 
  SupportRequest, 
  Notification,
  DashboardStats 
} from '@/types/admin';

// Mock data untuk checklist assignments
export const mockChecklistAssignments: ChecklistAssignment[] = [
  // Tahun 2024 - Direktorat Keuangan
  {
    id: 1,
    aspek: 'ASPEK I. Komitmen',
    deskripsi: 'Dokumen komitmen manajemen terhadap GCG',
    assignedTo: 'Direktorat Keuangan',
    assignedBy: 'Super Admin',
    assignedDate: new Date('2024-01-15'),
    dueDate: new Date('2024-03-31'),
    priority: 'high',
    status: 'pending',
    tahun: 2024,
    requiredDocuments: ['Surat Komitmen Direksi', 'Kebijakan GCG', 'Struktur Organisasi'],
    format: 'pdf',
    maxSize: 10,
    validationRules: ['File harus PDF', 'Maksimal 10MB', 'Harus ditandatangani']
  },
  {
    id: 2,
    aspek: 'ASPEK I. Komitmen',
    deskripsi: 'Struktur organisasi dan tata kelola',
    assignedTo: 'Direktorat Keuangan',
    assignedBy: 'Super Admin',
    assignedDate: new Date('2024-01-15'),
    dueDate: new Date('2024-03-31'),
    priority: 'medium',
    status: 'in_progress',
    tahun: 2024,
    requiredDocuments: ['Struktur Organisasi', 'Job Description', 'SOP'],
    format: 'pdf',
    maxSize: 15,
    validationRules: ['File harus PDF', 'Maksimal 15MB', 'Harus lengkap']
  },
  {
    id: 3,
    aspek: 'ASPEK II. RUPS',
    deskripsi: 'Dokumen Rapat Umum Pemegang Saham',
    assignedTo: 'Direktorat Keuangan',
    assignedBy: 'Super Admin',
    assignedDate: new Date('2024-01-20'),
    dueDate: new Date('2024-04-30'),
    priority: 'high',
    status: 'pending',
    tahun: 2024,
    requiredDocuments: ['Notulen RUPS', 'Laporan Keuangan', 'Dokumen RUPS'],
    format: 'pdf',
    maxSize: 20,
    validationRules: ['File harus PDF', 'Maksimal 20MB', 'Harus resmi']
  },
  {
    id: 4,
    aspek: 'ASPEK III. Dewan Komisaris',
    deskripsi: 'Dokumen kinerja dan laporan dewan komisaris',
    assignedTo: 'Direktorat Keuangan',
    assignedBy: 'Super Admin',
    assignedDate: new Date('2024-01-25'),
    dueDate: new Date('2024-05-31'),
    priority: 'medium',
    status: 'pending',
    tahun: 2024,
    requiredDocuments: ['Laporan Kinerja DK', 'Rencana Kerja DK', 'Evaluasi DK'],
    format: 'pdf',
    maxSize: 12,
    validationRules: ['File harus PDF', 'Maksimal 12MB', 'Harus periodik']
  },
  {
    id: 5,
    aspek: 'ASPEK IV. Direksi',
    deskripsi: 'Dokumen kinerja dan laporan direksi',
    assignedTo: 'Direktorat Keuangan',
    assignedBy: 'Super Admin',
    assignedDate: new Date('2024-01-30'),
    dueDate: new Date('2024-06-30'),
    priority: 'high',
    status: 'pending',
    tahun: 2024,
    requiredDocuments: ['Laporan Kinerja Direksi', 'Rencana Kerja Direksi', 'Evaluasi Direksi'],
    format: 'pdf',
    maxSize: 15,
    validationRules: ['File harus PDF', 'Maksimal 15MB', 'Harus komprehensif']
  },
  {
    id: 6,
    aspek: 'ASPEK V. Pengungkapan',
    deskripsi: 'Dokumen pengungkapan informasi perusahaan',
    assignedTo: 'Direktorat Keuangan',
    assignedBy: 'Super Admin',
    assignedDate: new Date('2024-02-01'),
    dueDate: new Date('2024-07-31'),
    priority: 'medium',
    status: 'pending',
    tahun: 2024,
    requiredDocuments: ['Laporan Keberlanjutan', 'Laporan ESG', 'Pengungkapan Risiko'],
    format: 'pdf',
    maxSize: 25,
    validationRules: ['File harus PDF', 'Maksimal 25MB', 'Harus transparan']
  },
  
  // Tahun 2023 - Direktorat Keuangan
  {
    id: 7,
    aspek: 'ASPEK I. Komitmen',
    deskripsi: 'Dokumen komitmen manajemen terhadap GCG 2023',
    assignedTo: 'Direktorat Keuangan',
    assignedBy: 'Super Admin',
    assignedDate: new Date('2023-01-15'),
    dueDate: new Date('2023-03-31'),
    priority: 'high',
    status: 'completed',
    tahun: 2023,
    requiredDocuments: ['Surat Komitmen Direksi 2023', 'Kebijakan GCG 2023'],
    format: 'pdf',
    maxSize: 10,
    validationRules: ['File harus PDF', 'Maksimal 10MB', 'Harus ditandatangani']
  },
  {
    id: 8,
    aspek: 'ASPEK II. RUPS',
    deskripsi: 'Dokumen RUPS 2023',
    assignedTo: 'Direktorat Keuangan',
    assignedBy: 'Super Admin',
    assignedDate: new Date('2023-01-20'),
    dueDate: new Date('2023-04-30'),
    priority: 'high',
    status: 'completed',
    tahun: 2023,
    requiredDocuments: ['Notulen RUPS 2023', 'Laporan Keuangan 2023'],
    format: 'pdf',
    maxSize: 20,
    validationRules: ['File harus PDF', 'Maksimal 20MB', 'Harus resmi']
  },
  
  // Tahun 2022 - Direktorat Keuangan
  {
    id: 9,
    aspek: 'ASPEK I. Komitmen',
    deskripsi: 'Dokumen komitmen manajemen terhadap GCG 2022',
    assignedTo: 'Direktorat Keuangan',
    assignedBy: 'Super Admin',
    assignedDate: new Date('2022-01-15'),
    dueDate: new Date('2022-03-31'),
    priority: 'high',
    status: 'completed',
    tahun: 2022,
    requiredDocuments: ['Surat Komitmen Direksi 2022', 'Kebijakan GCG 2022'],
    format: 'pdf',
    maxSize: 10,
    validationRules: ['File harus PDF', 'Maksimal 10MB', 'Harus ditandatangani']
  },
  
  // Direktorat Lain - Tahun 2024
  {
    id: 10,
    aspek: 'ASPEK I. Komitmen',
    deskripsi: 'Dokumen komitmen manajemen terhadap GCG',
    assignedTo: 'Direktorat SDM',
    assignedBy: 'Super Admin',
    assignedDate: new Date('2024-01-15'),
    dueDate: new Date('2024-03-31'),
    priority: 'high',
    status: 'pending',
    tahun: 2024,
    requiredDocuments: ['Surat Komitmen Direksi SDM', 'Kebijakan GCG SDM'],
    format: 'pdf',
    maxSize: 10,
    validationRules: ['File harus PDF', 'Maksimal 10MB', 'Harus ditandatangani']
  },
  {
    id: 11,
    aspek: 'ASPEK II. RUPS',
    deskripsi: 'Dokumen RUPS Direktorat SDM',
    assignedTo: 'Direktorat SDM',
    assignedBy: 'Super Admin',
    assignedDate: new Date('2024-01-20'),
    dueDate: new Date('2024-04-30'),
    priority: 'medium',
    status: 'completed',
    tahun: 2024,
    requiredDocuments: ['Notulen RUPS SDM', 'Laporan Keuangan SDM'],
    format: 'pdf',
    maxSize: 20,
    validationRules: ['File harus PDF', 'Maksimal 20MB', 'Harus resmi']
  }
];

// Mock data untuk document submissions
export const mockDocumentSubmissions: DocumentSubmission[] = [
  // Tahun 2024 - Direktorat Keuangan
  {
    id: 1,
    checklistId: 2,
    fileName: 'Struktur_Organisasi_Direktorat_Keuangan_2024.pdf',
    fileSize: 8.5,
    uploadDate: new Date('2024-02-15'),
    uploadedBy: 'John Doe',
    subdirektorat: 'Direktorat Keuangan',
    status: 'pending_review',
    notes: 'Struktur organisasi terbaru sesuai restrukturisasi 2024',
    version: 1,
    fileUrl: '/uploads/struktur_organisasi.pdf'
  },
  {
    id: 2,
    checklistId: 1,
    fileName: 'Surat_Komitmen_Direksi_GCG_2024.pdf',
    fileSize: 5.2,
    uploadDate: new Date('2024-02-20'),
    uploadedBy: 'John Doe',
    subdirektorat: 'Direktorat Keuangan',
    status: 'approved',
    notes: 'Surat komitmen resmi dari direksi utama',
    version: 1,
    fileUrl: '/uploads/komitmen_direksi.pdf',
    reviewNotes: 'Dokumen sudah sesuai dan lengkap',
    reviewedBy: 'Super Admin',
    reviewDate: new Date('2024-02-22')
  },
  
  // Tahun 2023 - Direktorat Keuangan
  {
    id: 3,
    checklistId: 7,
    fileName: 'Surat_Komitmen_Direksi_GCG_2023.pdf',
    fileSize: 4.8,
    uploadDate: new Date('2023-03-15'),
    uploadedBy: 'John Doe',
    subdirektorat: 'Direktorat Keuangan',
    status: 'approved',
    notes: 'Surat komitmen direksi tahun 2023',
    version: 1,
    fileUrl: '/uploads/komitmen_direksi_2023.pdf',
    reviewNotes: 'Dokumen sudah disetujui',
    reviewedBy: 'Super Admin',
    reviewDate: new Date('2023-03-20')
  },
  {
    id: 4,
    checklistId: 8,
    fileName: 'Notulen_RUPS_2023.pdf',
    fileSize: 12.5,
    uploadDate: new Date('2023-04-20'),
    uploadedBy: 'John Doe',
    subdirektorat: 'Direktorat Keuangan',
    status: 'approved',
    notes: 'Notulen RUPS tahun 2023',
    version: 1,
    fileUrl: '/uploads/notulen_rups_2023.pdf',
    reviewNotes: 'Dokumen sudah disetujui',
    reviewedBy: 'Super Admin',
    reviewDate: new Date('2023-04-25')
  },
  
  // Tahun 2022 - Direktorat Keuangan
  {
    id: 5,
    checklistId: 9,
    fileName: 'Surat_Komitmen_Direksi_GCG_2022.pdf',
    fileSize: 5.1,
    uploadDate: new Date('2022-03-10'),
    uploadedBy: 'John Doe',
    subdirektorat: 'Direktorat Keuangan',
    status: 'approved',
    notes: 'Surat komitmen direksi tahun 2022',
    version: 1,
    fileUrl: '/uploads/komitmen_direksi_2022.pdf',
    reviewNotes: 'Dokumen sudah disetujui',
    reviewedBy: 'Super Admin',
    reviewDate: new Date('2022-03-15')
  },
  
  // Direktorat SDM - Tahun 2024
  {
    id: 6,
    checklistId: 10,
    fileName: 'Surat_Komitmen_Direksi_SDM_2024.pdf',
    fileSize: 4.9,
    uploadDate: new Date('2024-02-10'),
    uploadedBy: 'Jane Smith',
    subdirektorat: 'Direktorat SDM',
    status: 'pending_review',
    notes: 'Surat komitmen direksi SDM tahun 2024',
    version: 1,
    fileUrl: '/uploads/komitmen_direksi_sdm.pdf'
  },
  {
    id: 7,
    checklistId: 11,
    fileName: 'Notulen_RUPS_SDM_2024.pdf',
    fileSize: 11.8,
    uploadDate: new Date('2024-03-15'),
    uploadedBy: 'Jane Smith',
    subdirektorat: 'Direktorat SDM',
    status: 'approved',
    notes: 'Notulen RUPS Direktorat SDM tahun 2024',
    version: 1,
    fileUrl: '/uploads/notulen_rups_sdm.pdf',
    reviewNotes: 'Dokumen sudah disetujui',
    reviewedBy: 'Super Admin',
    reviewDate: new Date('2024-03-20')
  }
];

// Mock data untuk admin progress
export const mockAdminProgress: AdminProgress[] = [
  {
    subdirektorat: 'Direktorat Keuangan',
    totalAssigned: 6,
    completed: 1,
    pending: 4,
    overdue: 1,
    lastUpdate: new Date('2024-02-25'),
    performance: 17, // 1/6 * 100
    tahun: 2024
  }
];

// Mock data untuk support requests
export const mockSupportRequests: SupportRequest[] = [
  {
    id: 1,
    checklistId: 3,
    requestType: 'clarification',
    message: 'Mohon penjelasan lebih detail mengenai format dokumen RUPS yang diminta',
    priority: 'medium',
    status: 'open',
    createdAt: new Date('2024-02-18'),
    updatedAt: new Date('2024-02-18')
  },
  {
    id: 2,
    checklistId: 4,
    requestType: 'extension',
    message: 'Mohon perpanjangan waktu untuk submission dokumen dewan komisaris',
    priority: 'high',
    status: 'in_progress',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-22')
  }
];

// Mock data untuk notifications
export const mockNotifications: Notification[] = [
  // Tahun 2024
  {
    id: 1,
    type: 'assignment',
    title: 'Assignment Baru',
    message: 'Anda mendapat assignment baru untuk ASPEK I. Komitmen',
    recipient: 'Direktorat Keuangan',
    isRead: false,
    createdAt: new Date('2024-01-15'),
    actionUrl: '/admin/dashboard',
    priority: 'high'
  },
  {
    id: 2,
    type: 'deadline',
    title: 'Deadline Mendekati',
    message: 'Deadline untuk ASPEK II. RUPS akan berakhir dalam 2 bulan',
    recipient: 'Direktorat Keuangan',
    isRead: false,
    createdAt: new Date('2024-02-25'),
    actionUrl: '/admin/dashboard',
    priority: 'medium'
  },
  {
    id: 3,
    type: 'feedback',
    title: 'Feedback Dokumen',
    message: 'Dokumen Surat Komitmen Direksi telah disetujui',
    recipient: 'Direktorat Keuangan',
    isRead: true,
    createdAt: new Date('2024-02-22'),
    actionUrl: '/admin/dashboard',
    priority: 'low'
  },
  
  // Tahun 2023
  {
    id: 4,
    type: 'assignment',
    title: 'Assignment 2023 Selesai',
    message: 'Semua assignment untuk tahun 2023 telah selesai',
    recipient: 'Direktorat Keuangan',
    isRead: true,
    createdAt: new Date('2023-12-31'),
    actionUrl: '/admin/dashboard',
    priority: 'low'
  },
  
  // Tahun 2022
  {
    id: 5,
    type: 'assignment',
    title: 'Assignment 2022 Selesai',
    message: 'Semua assignment untuk tahun 2022 telah selesai',
    recipient: 'Direktorat Keuangan',
    isRead: true,
    createdAt: new Date('2022-12-31'),
    actionUrl: '/admin/dashboard',
    priority: 'low'
  },
  
  // Notifikasi untuk semua direktorat
  {
    id: 6,
    type: 'system',
    title: 'Update Sistem',
    message: 'Sistem GCG telah diupdate ke versi terbaru',
    recipient: 'all',
    isRead: false,
    createdAt: new Date('2024-02-28'),
    actionUrl: '/admin/dashboard',
    priority: 'medium'
  }
];

// Generate dashboard stats
export const generateDashboardStats = (subdirektorat: string, tahun: number): DashboardStats => {
  const assignments = mockChecklistAssignments.filter(
    item => item.assignedTo === subdirektorat && item.tahun === tahun
  );
  
  const submissions = mockDocumentSubmissions.filter(
    item => item.subdirektorat === subdirektorat
  );
  
  const supportRequests = mockSupportRequests.filter(
    item => mockChecklistAssignments.find(
      assignment => assignment.id === item.checklistId && assignment.assignedTo === subdirektorat
    )
  );

  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(item => item.status === 'completed').length;
  const pendingAssignments = assignments.filter(item => item.status === 'pending' || item.status === 'in_progress').length;
  const overdueAssignments = assignments.filter(item => 
    item.status !== 'completed' && new Date() > item.dueDate
  ).length;
  
  const overallProgress = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  const upcomingDeadlines = assignments
    .filter(item => item.status !== 'completed' && new Date() <= item.dueDate)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5);

  return {
    totalAssignments,
    completedAssignments,
    pendingAssignments,
    overdueAssignments,
    overallProgress,
    recentSubmissions: submissions.slice(-5),
    upcomingDeadlines,
    supportRequests: supportRequests.slice(-3)
  };
};

// Helper functions
export const getAssignmentsBySubdirektorat = (subdirektorat: string, tahun: number) => {
  return mockChecklistAssignments.filter(
    item => item.assignedTo === subdirektorat && item.tahun === tahun
  );
};

export const getSubmissionsByChecklist = (checklistId: number) => {
  return mockDocumentSubmissions.filter(item => item.checklistId === checklistId);
};

export const getNotificationsBySubdirektorat = (subdirektorat: string) => {
  return mockNotifications.filter(
    item => item.recipient === subdirektorat || item.recipient === 'all'
  );
};
