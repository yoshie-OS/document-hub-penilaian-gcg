import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useUser } from '@/contexts/UserContext';
import { useDirektorat } from '@/contexts/DireksiContext';
import { useFileUpload } from '@/contexts/FileUploadContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useDocumentMetadata } from '@/contexts/DocumentMetadataContext';
import { useYear } from '@/contexts/YearContext';

import { useStrukturPerusahaan } from '@/contexts/StrukturPerusahaanContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Calendar, 
  Building2, 
  Users, 
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Download
} from 'lucide-react';

interface FileUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  checklistId?: number;
  checklistDescription?: string;
  aspect?: string;
  trigger?: React.ReactNode;
  prefillData?: {
    checklistId?: number;
    aspek?: string;
    deskripsi?: string;
    direktorat?: string;
    subdirektorat?: string; // Changed to lowercase to match UploadFormData
    divisi?: string;
    tahun?: number;
  };
}

interface UploadFormData {
  // Basic Information
  title: string;
  documentNumber: string;
  documentDate: string;
  description: string;
  
  // GCG Classification
  gcgPrinciple: string;
  documentType: string;
  documentCategory: string;
  
  // Organizational Information
  direktorat: string;
  subdirektorat: string;
  division: string;
  divisionSuggestion: string;
  
  // File Information
  file: File | null;
  fileName: string;
  fileSize: number;
  
  // Additional Metadata
  status: string;
  confidentiality: string;
  
  // Checklist Information
  selectedChecklistId: number | null;
  
  // Year (auto-filled)
  year: number;
}

// Ultra-optimized Input Component with debouncing
const OptimizedInput = memo(({ 
  id, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  className = "",
  type = "text"
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  className?: string;
  type?: string;
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  // Debounce the onChange callback
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 150); // 150ms debounce

    return () => clearTimeout(timeoutId);
  }, [localValue, onChange, value]);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
  <Input
    id={id}
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    placeholder={placeholder}
    required={required}
      className={className}
    />
  );
});

// Ultra-optimized Textarea Component with debouncing
const OptimizedTextarea = memo(({ 
  id, 
  value, 
  onChange, 
  placeholder, 
  rows = 3, 
  className = "" 
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  className?: string;
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  // Debounce the onChange callback
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 200); // 200ms debounce for textarea

    return () => clearTimeout(timeoutId);
  }, [localValue, onChange, value]);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
  <Textarea
    id={id}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    placeholder={placeholder}
    rows={rows}
      className={className}
    />
  );
});

// Ultra-optimized Select Component
const OptimizedSelect = memo(({ 
  value, 
  onValueChange, 
  placeholder, 
  children, 
  disabled = false 
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <Select value={value} onValueChange={onValueChange} disabled={disabled}>
    <SelectTrigger>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {children}
    </SelectContent>
  </Select>
));

// Ultra-optimized Badge Component
const OptimizedBadge = memo(({ 
  variant, 
  className, 
  onClick, 
  children 
}: {
  variant: "default" | "secondary";
  className: string;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Badge variant={variant} className={className} onClick={onClick}>
    {children}
  </Badge>
));

// Ultra-optimized Checkbox Component
const OptimizedCheckbox = memo(({ 
  id, 
  checked, 
  onCheckedChange 
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
));

// Memoized form sections to prevent unnecessary re-renders
const FileUploadSection = memo(({ 
  selectedFile, 
  isDragOver, 
  onFileChange, 
  onDragOver, 
  onDragLeave, 
  onDrop, 
  onRemoveFile, 
  formatFileSize 
}: {
  selectedFile: File | null;
  isDragOver: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemoveFile: () => void;
  formatFileSize: (bytes: number) => string;
}) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
      Upload File
    </h3>
    
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragOver 
          ? 'border-blue-500 bg-blue-50' 
          : selectedFile 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 bg-gray-50'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {selectedFile ? (
        <div className="space-y-4">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
          <div>
            <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
            <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onRemoveFile}
          >
            Ganti File
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Upload className="w-12 h-12 text-gray-400 mx-auto" />
          <div>
            <p className="text-lg font-medium text-gray-900">
              Drag and drop file di sini, atau klik untuk memilih
            </p>
            <p className="text-sm text-gray-600">
              Format yang didukung: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (Maksimal 10MB)
            </p>
          </div>
          <Input
            type="file"
            onChange={onFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            className="hidden"
            id="file-upload"
            key={`file-input-${selectedFile ? selectedFile.name : 'empty'}`}
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              const fileInput = document.getElementById('file-upload') as HTMLInputElement;
              if (fileInput) {
                fileInput.click();
              }
            }}
          >
            Pilih File
          </Button>
        </div>
      )}
    </div>
  </div>
));

const BasicInfoSection = memo(({ 
  formData, 
  onInputChange,
  userRole
}: {
  formData: UploadFormData;
  onInputChange: (field: keyof UploadFormData, value: string) => void;
  userRole?: string;
}) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
      Informasi Dasar Dokumen
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="title">
          Judul Dokumen {userRole !== 'admin' && <span className="text-red-500">*</span>}
        </Label>
        <OptimizedInput
          id="title"
          value={formData.title}
          onChange={(value) => onInputChange('title', value)}
          placeholder="Masukkan judul dokumen"
          required={userRole !== 'admin'}
        />
        {userRole === 'admin' && (
          <p className="text-xs text-gray-500">Field ini opsional untuk Admin</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="documentNumber">Nomor Dokumen</Label>
        <OptimizedInput
          id="documentNumber"
          value={formData.documentNumber}
          onChange={(value) => onInputChange('documentNumber', value)}
          placeholder="Contoh: AI/RPT/2024/001"
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="description">Deskripsi/Catatan</Label>
      <OptimizedTextarea
        id="description"
        value={formData.description}
        onChange={(value) => onInputChange('description', value)}
        placeholder="Deskripsi singkat tentang dokumen ini"
        rows={3}
      />
    </div>
  </div>
));

const GCGClassificationSection = memo(({ 
  formData, 
  onSelectChange, 
  gcgPrinciples, 
  documentTypes, 
  documentCategories,
  userRole
}: {
  formData: UploadFormData;
  onSelectChange: (field: keyof UploadFormData, value: string) => void;
  gcgPrinciples: string[];
  documentTypes: string[];
  documentCategories: string[];
  userRole?: string;
}) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
      Klasifikasi GCG
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="gcgPrinciple">
          Prinsip GCG {userRole !== 'admin' && <span className="text-red-500">*</span>}
        </Label>
        <OptimizedSelect 
          value={formData.gcgPrinciple} 
          onValueChange={(value) => onSelectChange('gcgPrinciple', value)}
          placeholder="Pilih prinsip GCG"
        >
          {gcgPrinciples.map(principle => (
            <SelectItem key={principle} value={principle}>{principle}</SelectItem>
          ))}
        </OptimizedSelect>
        {userRole === 'admin' && (
          <p className="text-xs text-gray-500">Field ini opsional untuk Admin</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="documentType">
          Jenis Dokumen {userRole !== 'admin' && <span className="text-red-500">*</span>}
        </Label>
        <OptimizedSelect 
          value={formData.documentType} 
          onValueChange={(value) => onSelectChange('documentType', value)}
          placeholder="Pilih jenis dokumen"
        >
          {documentTypes.map(type => (
            <SelectItem key={type} value={type}>{type}</SelectItem>
          ))}
        </OptimizedSelect>
        {userRole === 'admin' && (
          <p className="text-xs text-gray-500">Field ini opsional untuk Admin</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="documentCategory">Kategori Dokumen</Label>
        <OptimizedSelect 
          value={formData.documentCategory} 
          onValueChange={(value) => onSelectChange('documentCategory', value)}
          placeholder="Pilih kategori"
        >
          {documentCategories.map(category => (
            <SelectItem key={category} value={category}>{category}</SelectItem>
          ))}
        </OptimizedSelect>
      </div>
    </div>
  </div>
));

const OrganizationalSection = memo(({ 
  formData, 
  onSelectChange, 
  onInputChange, 
  customDivision, 
  onCustomDivisionChange,
  direktoratSuggestions, 
  subdirektoratSuggestions, 
  divisionSuggestions,
  userRole
}: {
  formData: UploadFormData;
  onSelectChange: (field: keyof UploadFormData, value: string) => void;
  onInputChange: (field: keyof UploadFormData, value: string) => void;
  customDivision: string;
  onCustomDivisionChange: (value: string) => void;
  direktoratSuggestions: string[];
  subdirektoratSuggestions: string[];
  divisionSuggestions: string[];
  userRole?: string;
}) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
      Informasi Organisasi
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
          <Label htmlFor="direktorat">
            Direktorat {userRole !== 'admin' && <span className="text-red-500">*</span>}
          </Label>
          <OptimizedSelect 
            value={formData.direktorat} 
            onValueChange={(value) => onSelectChange('direktorat', value)}
            placeholder={direktoratSuggestions.length > 0 ? "Pilih direktorat" : "Belum ada data direktorat tahun ini"}
            disabled={direktoratSuggestions.length === 0}
          >
            {direktoratSuggestions.length > 0 ? (
              direktoratSuggestions.map(direktorat => (
                <SelectItem key={direktorat} value={direktorat}>{direktorat}</SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>Tidak ada data direktorat</SelectItem>
            )}
          </OptimizedSelect>
          {userRole === 'admin' && (
            <p className="text-xs text-gray-500">Field ini opsional untuk Admin</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="subdirektorat">
            Subdirektorat
          </Label>
          <OptimizedSelect 
            value={formData.subdirektorat} 
            onValueChange={(value) => onSelectChange('subdirektorat', value)}
            placeholder={subdirektoratSuggestions.length > 0 ? "Pilih subdirektorat" : "Belum ada data subdirektorat"}
            disabled={subdirektoratSuggestions.length === 0}
          >
            {subdirektoratSuggestions.length > 0 ? (
              subdirektoratSuggestions.map(subdirektorat => (
                <SelectItem key={subdirektorat} value={subdirektorat}>{subdirektorat}</SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>Tidak ada data subdirektorat</SelectItem>
            )}
          </OptimizedSelect>
          {userRole === 'admin' && (
            <p className="text-xs text-gray-500">Field ini opsional untuk Admin</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="division">
            Divisi {userRole !== 'admin' && <span className="text-red-500">*</span>}
          </Label>
          <div className="space-y-2">
            <OptimizedSelect 
              value={formData.division} 
              onValueChange={(value) => onSelectChange('division', value)}
              placeholder={divisionSuggestions.length > 0 ? "Pilih divisi" : "Belum ada data divisi tahun ini"}
              disabled={divisionSuggestions.length === 0}
            >
              {divisionSuggestions.length > 0 ? (
                divisionSuggestions.map(division => (
                  <SelectItem key={division} value={division}>{division}</SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>Tidak ada data divisi</SelectItem>
              )}
            </OptimizedSelect>
            {userRole !== 'admin' && (
              <div className="space-y-2">
                <Label htmlFor="customDivision">Atau ketik divisi manual</Label>
                <OptimizedInput
                  id="customDivision"
                  value={customDivision}
                  onChange={onCustomDivisionChange}
                  placeholder="Ketik nama divisi jika tidak ada di daftar"
                />
              </div>
            )}
            {userRole === 'admin' && (
              <p className="text-xs text-gray-500">Field ini opsional untuk Admin</p>
            )}
          </div>
        </div>
    </div>
  </div>
));

const DocumentManagementSection = memo(({ 
  formData, 
  onSelectChange, 
  documentStatuses, 
  confidentialityLevels 
}: {
  formData: UploadFormData;
  onSelectChange: (field: keyof UploadFormData, value: string) => void;
  documentStatuses: Array<{value: string, label: string}>;
  confidentialityLevels: Array<{value: string, label: string}>;
}) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
      Pengelolaan Dokumen
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="status">Status Dokumen</Label>
        <OptimizedSelect 
          value={formData.status} 
          onValueChange={(value) => onSelectChange('status', value)}
          placeholder="Pilih status"
        >
          {documentStatuses.map(status => (
            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
          ))}
        </OptimizedSelect>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confidentiality">Tingkat Kerahasiaan</Label>
        <OptimizedSelect 
          value={formData.confidentiality} 
          onValueChange={(value) => onSelectChange('confidentiality', value)}
          placeholder="Pilih tingkat kerahasiaan"
        >
          {confidentialityLevels.map(level => (
            <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
          ))}
        </OptimizedSelect>
      </div>
    </div>
  </div>
));

const ChecklistSection = memo(({ 
  formData, 
  onChecklistSelection, 
  onAspectFilterChange, 
  selectedAspectFilter, 
  getAvailableChecklistItems, 
  getUniqueAspects,
  isLoading = false
}: {
  formData: UploadFormData;
  onChecklistSelection: (item: any, checked: boolean) => void;
  onAspectFilterChange: (aspect: string) => void;
  selectedAspectFilter: string;
  getAvailableChecklistItems: any[];
  getUniqueAspects: string[];
  isLoading?: boolean;
}) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                      Pilih Dokumen GCG (Opsional)
    </h3>
    <div className="space-y-2">
      <p className="text-sm text-gray-600">
                        Pilih satu dokumen GCG yang sesuai dengan dokumen yang akan diupload. 
        Dokumen GCG yang sudah digunakan di tahun ini tidak akan muncul di daftar.
      </p>
      
      {/* Aspect Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Filter berdasarkan Aspek:</Label>
        <div className="flex flex-wrap gap-2">
          <OptimizedBadge
            variant={!selectedAspectFilter ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => onAspectFilterChange('')}
          >
            Semua
          </OptimizedBadge>
          {getUniqueAspects.map((aspect) => (
            <OptimizedBadge
              key={aspect}
              variant={selectedAspectFilter === aspect ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => onAspectFilterChange(aspect)}
            >
              {aspect.replace(/^Aspek\s+/i, '')}
            </OptimizedBadge>
          ))}
        </div>
      </div>
      
      <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2">
        {(() => {
          // Show loading state
          if (isLoading) {
            return (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Memuat checklist GCG...</p>
              </div>
            );
          }
          
          // Check if checklist data is available
          if (!getAvailableChecklistItems || getAvailableChecklistItems.length === 0) {
            return (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Checklist GCG Belum Tersedia
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Checklist GCG untuk tahun {formData.year} belum tersedia atau belum dibuat.
                </p>
                <div className="space-y-2 text-xs text-gray-500">
                  <p>• Pastikan tahun buku sudah dipilih dengan benar</p>
                  <p>• Checklist GCG harus dibuat terlebih dahulu di menu "Pengaturan Baru" → "Kelola Dokumen"</p>
                  <p>• Atau gunakan menu "Pengaturan Baru" → "Kelola Dokumen" untuk setup checklist</p>
                </div>
              </div>
            );
          }
          
          const filteredItems = getAvailableChecklistItems.filter(item => !selectedAspectFilter || item.aspek === selectedAspectFilter);
          return filteredItems.length > 0 ? (
            filteredItems.slice(0, 50).map((item) => (
              <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                <OptimizedCheckbox
                  id={`checklist-${item.id}`}
                  checked={formData.selectedChecklistId === item.id}
                  onCheckedChange={(checked) => onChecklistSelection(item, checked)}
                />
                <Label htmlFor={`checklist-${item.id}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900 flex-1">
                      {item.deskripsi}
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {item.aspek.replace(/^Aspek\s+/i, '')}
                    </Badge>
                  </div>
                </Label>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">
              {selectedAspectFilter 
                ? `Tidak ada checklist tersedia untuk ${selectedAspectFilter.replace(/^Aspek\s+/i, '')}`
                : `Semua dokumen GCG untuk tahun ini sudah digunakan`
              }
            </p>
          );
        })()}
      </div>
      
      {/* Selected Checklist Info */}
      {formData.selectedChecklistId && (() => {
        const selectedItem = getAvailableChecklistItems.find(item => item.id === formData.selectedChecklistId);
        return selectedItem ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Checklist Terpilih
              </span>
            </div>
            <div className="text-sm text-green-700">
              <div className="font-medium">{selectedItem.aspek}</div>
              <div>{selectedItem.deskripsi}</div>
            </div>
          </div>
        ) : null;
      })()}
    </div>
  </div>
));

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  isOpen,
  onOpenChange,
  checklistId,
  checklistDescription,
  aspect,
  trigger,
  prefillData
}) => {
  const { user } = useUser();
  const { direktorat, getAllSubdirektorat } = useDirektorat();
  const { uploadFile } = useFileUpload();
  const { selectedYear } = useYear();
  const { checklist } = useChecklist();
  const { documents, addDocument } = useDocumentMetadata();
  const { toast } = useToast();
  // Klasifikasi data removed - using hardcoded options instead
  const gcgPrinciples = ['Transparansi', 'Akuntabilitas', 'Responsibilitas', 'Independensi', 'Kewajaran', 'Kepatuhan'];
  const documentTypes = ['Dokumen Internal', 'Dokumen Eksternal', 'Laporan', 'SOP', 'Kebijakan', 'Prosedur'];
  const documentCategories = ['GCG', 'Operasional', 'Keuangan', 'SDM', 'Teknologi', 'Lainnya'];

  // Form state - optimized with useReducer pattern
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    documentNumber: '',
    documentDate: '',
    description: '',
    gcgPrinciple: '',
    documentType: '',
    documentCategory: '',
    direktorat: '',
    subdirektorat: '',
    division: '',
    divisionSuggestion: '',
    file: null,
    fileName: '',
    fileSize: 0,
    status: 'draft',
    confidentiality: 'public',
    selectedChecklistId: null,
    year: selectedYear || new Date().getFullYear()
  });

  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customDivision, setCustomDivision] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedAspectFilter, setSelectedAspectFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Memoized constants to prevent re-creation
  const confidentialityLevels = useMemo(() => [
    { value: 'public', label: 'Publik' },
    { value: 'confidential', label: 'Rahasia' }
  ], []);

  const documentStatuses = useMemo(() => [
    { value: 'draft', label: 'Draft' },
    { value: 'review', label: 'Dalam Review' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'final', label: 'Final' },
    { value: 'archived', label: 'Diarsipkan' }
  ], []);

  // Reset and auto-fill form when dialog opens with checklist data
  useEffect(() => {
    if (isOpen) {
      // Only reset form data if it's a new checklist or first time opening
      const shouldReset = !formData.selectedChecklistId || 
                         (checklistId && formData.selectedChecklistId !== checklistId);
      
      if (shouldReset) {
        // Reset form data
        setFormData({
          title: '',
          documentNumber: '',
          documentDate: '',
          description: '',
          gcgPrinciple: '',
          documentType: '',
          documentCategory: '',
          direktorat: '',
          subdirektorat: '',
          division: '',
          divisionSuggestion: '',
          file: null,
          fileName: '',
          fileSize: 0,
          status: 'draft',
          confidentiality: 'public',
          selectedChecklistId: null,
          year: selectedYear || new Date().getFullYear()
        });
      
        // Reset file state only if it's a new checklist
        setSelectedFile(null);
        setCustomDivision('');
        setSelectedAspectFilter('');
      }
      
      // Auto-fill form when checklist data is provided
      if (checklistId && checklistDescription && aspect) {
        setFormData(prev => ({
          ...prev,
          title: checklistDescription,
          description: checklistDescription,
          gcgPrinciple: getPrincipleFromAspect(aspect),
          documentCategory: getCategoryFromAspect(aspect),
          selectedChecklistId: checklistId,
          year: selectedYear || new Date().getFullYear()
        }));
      }
      
      // Auto-fill form when prefillData is provided
      if (prefillData) {
        setFormData(prev => ({
          ...prev,
          title: prefillData.deskripsi || prev.title,
          description: prefillData.deskripsi || prev.description,
          direktorat: prefillData.direktorat || prev.direktorat,
          subdirektorat: prefillData.subdirektorat || prev.subdirektorat,
          division: prefillData.divisi || prev.division,
          selectedChecklistId: prefillData.checklistId || prev.selectedChecklistId,
          year: prefillData.tahun || selectedYear || new Date().getFullYear()
        }));
      }

      // Auto-fill organizational info for admin users
      if (user?.role === 'admin') {
        setFormData(prev => ({
          ...prev,
          direktorat: user?.direktorat || prev.direktorat,
          subdirektorat: user?.subDirektorat || user?.subDirektorat || prev.subdirektorat,
          division: user?.divisi || prev.division,
        }));
      }
    }
  }, [isOpen, checklistId, checklistDescription, aspect, selectedYear, prefillData, user, formData.selectedChecklistId]);

  // Update year when selectedYear changes
  useEffect(() => {
    if (selectedYear) {
      setFormData(prev => ({ ...prev, year: selectedYear }));
      
      // Set loading state when year changes
      setIsLoading(true);
      
      // Simulate loading delay to ensure data is updated
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedYear]);

  // Get available checklist items (not used in current year) with sorting - memoized
  const getAvailableChecklistItems = useMemo(() => {
    if (!selectedYear) return [];
    
    // Ensure checklist data exists
    if (!checklist || checklist.length === 0) {
      console.log('FileUploadDialog: No checklist data available');
      return [];
    }
    
    // Get used checklist IDs for current year
    const usedChecklistIds = new Set(
      documents
        .filter(doc => doc.year === selectedYear && doc.checklistId)
        .map(doc => doc.checklistId)
    );
    
    // Filter available items
    const availableItems = checklist.filter(item => !usedChecklistIds.has(item.id));
    
    console.log('FileUploadDialog: Available checklist items', {
      selectedYear,
      totalChecklist: checklist.length,
      usedItems: usedChecklistIds.size,
      availableItems: availableItems.length
    });
    
    // Sort by aspect using the same logic as getUniqueAspects
    const existingAspects = [
      'Aspek Komitmen',
      'Aspek RUPS', 
      'Aspek Dewan Komisaris',
      'Aspek Direktorat',
      'Aspek Pengungkapan'
    ];
    
    return availableItems.sort((a, b) => {
      const aIndex = existingAspects.indexOf(a.aspek);
      const bIndex = existingAspects.indexOf(b.aspek);
      
      // If both are existing aspects, sort by priority
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one is existing, put it first
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // If neither is existing, sort alphabetically
      return a.aspek.localeCompare(b.aspek);
    });
  }, [documents, checklist, selectedYear]);

  // Ambil saran divisi dari localStorage sesuai tahun buku - memoized
  const getDivisionSuggestionsByYear = useMemo(() => {
    if (!selectedYear) return [];
    
    try {
      const divisiData = localStorage.getItem('divisi');
      if (!divisiData) return [];
      
      const divisiList = JSON.parse(divisiData);
      if (!Array.isArray(divisiList)) return [];
      
      const filtered = divisiList
        .filter((d: any) => d && d.tahun === selectedYear && d.nama)
        .map((d: any) => String(d.nama))
        .filter(Boolean);
      
      return Array.from(new Set(filtered)).sort();
    } catch (error) {
      console.error('Error parsing divisi data:', error);
      return [];
    }
  }, [selectedYear]);

  // Get unique aspects for sorting - existing aspects first, new ones last
  const getUniqueAspects = useMemo(() => {
    // Get all aspects from all checklist items
    const allAspects = checklist.map(item => item.aspek);
    const uniqueAspects = [...new Set(allAspects)];
    
    // Define existing aspects in order
    const existingAspects = [
      'Aspek Komitmen',
      'Aspek RUPS', 
      'Aspek Dewan Komisaris',
      'Aspek Direktorat',
      'Aspek Pengungkapan'
    ];
    
    // Separate existing and new aspects
    const existing = uniqueAspects.filter(aspect => existingAspects.includes(aspect));
    const newAspects = uniqueAspects.filter(aspect => !existingAspects.includes(aspect));
    
    // Sort existing aspects by priority order
    const sortedExisting = existing.sort((a, b) => {
      const aIndex = existingAspects.indexOf(a);
      const bIndex = existingAspects.indexOf(b);
      return aIndex - bIndex;
    });
    
    // Sort new aspects alphabetically
    const sortedNew = newAspects.sort((a, b) => a.localeCompare(b));
    
    // Return existing first, then new
    return [...sortedExisting, ...sortedNew];
  }, [checklist]);

  // Helper functions - memoized to prevent re-creation
  const getPrincipleFromAspect = useCallback((aspect: string): string => {
    if (aspect.includes('Komitmen')) return 'Transparansi';
    if (aspect.includes('RUPS')) return 'Akuntabilitas';
    if (aspect.includes('Dewan Komisaris')) return 'Independensi';
    if (aspect.includes('Direktorat')) return 'Responsibilitas';
    if (aspect.includes('Pengungkapan')) return 'Kesetaraan';
    return 'Transparansi';
  }, []);

  const getCategoryFromAspect = useCallback((aspect: string): string => {
    if (aspect.includes('Komitmen')) return 'Code of Conduct';
    if (aspect.includes('RUPS')) return 'Risalah Rapat';
    if (aspect.includes('Dewan Komisaris')) return 'Risalah Rapat Komisaris';
    if (aspect.includes('Direktorat')) return 'Laporan Manajemen';
    if (aspect.includes('Pengungkapan')) return 'Laporan Tahunan';
    return 'Lainnya';
  }, []);

  // Optimized event handlers with useCallback
  const handleInputChange = useCallback((field: keyof UploadFormData, value: string) => {
    // Use functional update to prevent stale closures
    setFormData(prev => {
      // Only update if value actually changed
      if (prev[field] === value) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const handleSelectChange = useCallback((field: keyof UploadFormData, value: string) => {
    // Use functional update to prevent stale closures
    setFormData(prev => {
      // Only update if value actually changed
      if (prev[field] === value) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileChange called with event:', e);
    console.log('Files in input:', e.target.files);
    
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.size, file.type);
      validateAndSetFile(file);
    } else {
      console.log('No file selected');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  }, []);

  const handleAspectFilterChange = useCallback((aspect: string) => {
    setSelectedAspectFilter(aspect);
  }, []);

  const handleChecklistSelection = useCallback((item: any, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        selectedChecklistId: item.id,
        title: prev.title || item.deskripsi,
        description: prev.description || item.deskripsi,
        gcgPrinciple: getPrincipleFromAspect(item.aspek),
        documentCategory: getCategoryFromAspect(item.aspek)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedChecklistId: null
      }));
    }
  }, [getPrincipleFromAspect, getCategoryFromAspect]);

  const handleCustomDivisionChange = useCallback((value: string) => {
    setCustomDivision(value);
    setFormData(prev => ({ ...prev, division: value }));
  }, []);

  const validateAndSetFile = useCallback((file: File) => {
    console.log('validateAndSetFile called with:', file);
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran file maksimal 10MB",
        variant: "destructive"
      });
      return false;
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Format file tidak didukung",
        description: "Format yang didukung: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX",
        variant: "destructive"
      });
      return false;
    }

    // Set file state first
    setSelectedFile(file);
    
    // Then update form data
    setFormData(prev => {
      const updated = {
        ...prev,
        file: file,
        fileName: file.name,
        fileSize: file.size
      };
      console.log('Form data updated:', updated);
      return updated;
    });
    
    console.log('File successfully set:', file.name);
    return true;
  }, [toast, setSelectedFile, setFormData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "File belum dipilih",
        description: "Silakan pilih file yang akan diupload",
        variant: "destructive"
      });
      return;
    }

    // For admin users, only file is required
    if (user?.role === 'admin') {
      // Only validate file selection for admin
      if (!selectedFile) {
        toast({
          title: "File belum dipilih",
          description: "Silakan pilih file yang akan diupload",
          variant: "destructive"
        });
        return;
      }
    } else {
      // For superadmin, validate required fields
      if (!formData.title) {
        toast({
          title: "Data tidak lengkap",
          description: "Judul dokumen wajib diisi",
          variant: "destructive"
        });
        return;
      }

      if (!formData.gcgPrinciple) {
        toast({
          title: "Data tidak lengkap",
          description: "Prinsip GCG wajib diisi",
          variant: "destructive"
        });
        return;
      }

      if (!formData.documentType) {
        toast({
          title: "Data tidak lengkap",
          description: "Jenis dokumen wajib diisi",
          variant: "destructive"
        });
        return;
      }

      if (user?.role === 'superadmin' && (!formData.direktorat || !formData.division)) {
        toast({
          title: "Data tidak lengkap",
          description: "Direktorat dan divisi wajib diisi untuk Super Admin",
          variant: "destructive"
        });
        return;
      }
    }

    setIsUploading(true);

    try {
      // Get selected checklist item (if any)
      const selectedChecklist = formData.selectedChecklistId 
        ? checklist.find(item => item.id === formData.selectedChecklistId)
        : null;
      
      // Upload file using context
      uploadFile(
        selectedFile,
        selectedYear,
        formData.selectedChecklistId || 0,
        selectedChecklist?.deskripsi || '',
        selectedChecklist?.aspek || ''
      );

      // Document metadata will be added via context below

      toast({
        title: "Upload berhasil",
        description: "Dokumen berhasil diupload dan metadata telah disimpan",
      });

      // Use context uploadFile first to ensure data consistency
      if (uploadFile && selectedFile) {
        uploadFile(
          selectedFile,
          formData.year,
          formData.selectedChecklistId || undefined,
          formData.description,
          formData.documentCategory
        );
      }
      
      // Add document metadata to DocumentMetadataContext
      if (addDocument) {
        addDocument({
          fileName: selectedFile.name,
          title: formData.title || selectedChecklist?.deskripsi || 'Dokumen GCG',
          documentNumber: formData.documentNumber || '',
          documentDate: formData.documentDate || new Date().toISOString().split('T')[0],
          description: formData.description || selectedChecklist?.deskripsi || '',
          gcgPrinciple: formData.gcgPrinciple || 'Aspek GCG',
          documentType: formData.documentType || 'Dokumen GCG',
          documentCategory: formData.documentCategory || 'GCG',
          direktorat: formData.subdirektorat || user?.direktorat || '', // Use subdirektorat for admin
          subdirektorat: formData.subdirektorat || user?.subDirektorat || user?.subDirektorat || '',
          division: formData.division || user?.divisi || '',
          status: formData.status || 'draft',
          confidentiality: formData.confidentiality || 'public',
          fileSize: selectedFile.size,
          year: formData.year,
          uploadedBy: user?.name || 'Unknown',
          checklistId: formData.selectedChecklistId,
          checklistDescription: formData.description,
          aspect: formData.documentCategory
        });
      }
      
      // Dispatch events to notify other components
      window.dispatchEvent(new CustomEvent('fileUploaded'));
      window.dispatchEvent(new CustomEvent('documentsUpdated'));
      window.dispatchEvent(new CustomEvent('assignmentsUpdated'));
      
      // Dispatch additional events for better synchronization
      window.dispatchEvent(new CustomEvent('uploadedFilesChanged'));
      window.dispatchEvent(new CustomEvent('checklistAssignmentsChanged'));
      
      // Force localStorage update to trigger storage event (backup)
      const currentFiles = localStorage.getItem('uploadedFiles');
      const filesList = currentFiles ? JSON.parse(currentFiles) : [];
      filesList.push({
        id: Date.now(),
        fileName: formData.fileName,
        fileSize: formData.fileSize,
        year: formData.year,
        checklistId: formData.selectedChecklistId,
        aspect: formData.documentCategory,
        uploadDate: new Date().toISOString()
      });
      localStorage.setItem('uploadedFiles', JSON.stringify(filesList));

      // Reset form
      setFormData({
        title: '',
        documentNumber: '',
        documentDate: '',
        description: '',
        gcgPrinciple: '',
        documentType: '',
        documentCategory: '',
        direktorat: '',
        subdirektorat: '',
        division: '',
        divisionSuggestion: '',
        file: null,
        fileName: '',
        fileSize: 0,
        status: 'draft',
        confidentiality: 'public',
        selectedChecklistId: null,
        year: selectedYear || new Date().getFullYear()
      });
      setSelectedFile(null);
      setCustomDivision('');
      setSelectedAspectFilter('');
      
      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload gagal",
        description: "Terjadi kesalahan saat upload dokumen",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, formData, user, selectedYear, checklist, uploadFile, addDocument, toast, onOpenChange]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setFormData(prev => ({ ...prev, file: null, fileName: '', fileSize: 0 }));
  }, []);

  // Get data from context
  const { direktorat: direktoratData, subdirektorat: subdirektoratData, divisi: divisiData } = useStrukturPerusahaan();
  
  // Transform object arrays to string arrays for suggestions
  const direktoratSuggestions = useMemo(() => {
    if (!direktoratData || !Array.isArray(direktoratData)) return [];
    if (!selectedYear) return [];
    
    try {
      return direktoratData
        .filter(item => item && item.tahun === selectedYear && item.nama)
        .map(item => String(item.nama))
        .filter(Boolean);
    } catch (error) {
      console.error('Error processing direktorat data:', error);
      return [];
    }
  }, [direktoratData, selectedYear]);
  
  const subdirektoratSuggestions = useMemo(() => {
    if (!subdirektoratData || !Array.isArray(subdirektoratData)) return [];
    if (!selectedYear) return [];
    
    try {
      return subdirektoratData
        .filter(item => item && item.tahun === selectedYear && item.nama)
        .map(item => String(item.nama))
        .filter(Boolean);
    } catch (error) {
      console.error('Error processing subdirektorat data:', error);
      return [];
    }
  }, [subdirektoratData, selectedYear]);
  
  // Ultra-optimized memoized values with lazy loading
  const divisionSuggestions = useMemo(() => {
    if (!selectedYear) return [];
    
    try {
      const fromYear = getDivisionSuggestionsByYear;
      const divisiNames = divisiData
        ?.filter(item => item && item.tahun === selectedYear && item.nama)
        .map(item => String(item.nama))
        .filter(Boolean) || [];
      const merged = Array.from(new Set([...(fromYear || []), ...divisiNames]));
      return merged;
    } catch (error) {
      console.error('Error processing division data:', error);
      return [];
    }
  }, [getDivisionSuggestionsByYear, divisiData, selectedYear]);

  // Lazy load heavy computations only when needed
  const memoizedChecklistItems = useMemo(() => {
    if (!selectedAspectFilter && getAvailableChecklistItems.length > 100) {
      return getAvailableChecklistItems.slice(0, 50);
    }
    return getAvailableChecklistItems;
  }, [getAvailableChecklistItems, selectedAspectFilter]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <span>Upload Dokumen GCG</span>
          </DialogTitle>
          <DialogDescription>
            Lengkapi metadata dokumen untuk memastikan pengelolaan yang baik
          </DialogDescription>
          
          {/* Debug Info - hanya tampil di development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 bg-gray-100 border border-gray-300 rounded text-xs">
              <div className="font-medium text-gray-700 mb-1">Debug Info:</div>
              <div className="space-y-1 text-gray-600">
                <div>Selected Year: {selectedYear || 'Not set'}</div>
                <div>Checklist Count: {checklist?.length || 0}</div>
                <div>Available Items: {getAvailableChecklistItems?.length || 0}</div>
                <div>Documents Count: {documents?.length || 0}</div>
                <div>Direktorat: {direktoratSuggestions?.length || 0} suggestions</div>
                <div>Subdirektorat: {subdirektoratSuggestions?.length || 0} suggestions</div>
                <div>Divisi: {divisionSuggestions?.length || 0} suggestions</div>
              </div>
            </div>
          )}
          
          {checklistId && checklistDescription && aspect && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Checklist Terpilih:</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-green-700 font-medium">{aspect}</div>
                  <div className="text-xs text-green-600 truncate max-w-xs" title={checklistDescription}>
                    {checklistDescription}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Section */}
            <FileUploadSection
              selectedFile={selectedFile}
              isDragOver={isDragOver}
              onFileChange={handleFileChange}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              onRemoveFile={handleRemoveFile}
              formatFileSize={formatFileSize}
            />

            {/* Year Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Tahun Buku</span>
              </div>
              <p className="text-blue-700">
                Dokumen akan dikategorikan untuk tahun buku: <strong>{formData.year}</strong>
              </p>
            </div>

            {/* Basic Information */}
            <BasicInfoSection
              formData={formData}
              onInputChange={handleInputChange}
              userRole={user?.role}
            />

            {/* GCG Classification */}
            <GCGClassificationSection
              formData={formData}
              onSelectChange={handleSelectChange}
              gcgPrinciples={gcgPrinciples}
              documentTypes={documentTypes}
              documentCategories={documentCategories}
              userRole={user?.role}
            />

            {/* Organizational Information */}
            <OrganizationalSection
              formData={formData}
              onSelectChange={handleSelectChange}
              onInputChange={handleInputChange}
              customDivision={customDivision}
              onCustomDivisionChange={handleCustomDivisionChange}
              direktoratSuggestions={direktoratSuggestions}
              subdirektoratSuggestions={subdirektoratSuggestions}
              divisionSuggestions={divisionSuggestions}
              userRole={user?.role}
            />

            {/* Document Management */}
            <DocumentManagementSection
              formData={formData}
              onSelectChange={handleSelectChange}
              documentStatuses={documentStatuses}
              confidentialityLevels={confidentialityLevels}
            />

            {/* Checklist Selection - Only show if no checklist is pre-selected */}
            {!checklistId && (
              <ChecklistSection
                formData={formData}
                onChecklistSelection={handleChecklistSelection}
                onAspectFilterChange={handleAspectFilterChange}
                selectedAspectFilter={selectedAspectFilter}
                getAvailableChecklistItems={getAvailableChecklistItems}
                getUniqueAspects={getUniqueAspects}
                isLoading={isLoading}
              />
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isUploading}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isUploading || !selectedFile}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mengupload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Dokumen
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog; 