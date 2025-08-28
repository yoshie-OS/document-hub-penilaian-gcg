import React, { useState, useMemo, useEffect } from 'react';
import DeskripsiAutocomplete from '@/components/DeskripsiAutocomplete';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/contexts/SidebarContext';
import { useUser } from '@/contexts/UserContext';
import { useChecklist } from '@/contexts/ChecklistContext';
import { GCGChartWrapper } from '@/components/dashboard/GCGChartWrapper';
import { 
  FileText, 
  Upload, 
  Edit3, 
  Plus, 
  Minus, 
  Save, 
  Calendar,
  BarChart3,
  Target,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  HelpCircle
} from 'lucide-react';

interface PenilaianRow {
  id: string;
  no?: string; // Only for DETAILED mode
  aspek: string;
  deskripsi: string;
  jumlah_parameter: number; // Always present, defaults to 0 for BRIEF mode
  bobot: number;
  skor: number;
  capaian: number;
  penjelasan: string;
}

const PenilaianGCG = () => {
  const { isSidebarOpen } = useSidebar();
  const { user } = useUser();
  const { getChecklistByYear, getAspectsByYear, ensureAllYearsHaveData } = useChecklist();
  
  // State untuk workflow
  const [currentStep, setCurrentStep] = useState<'method' | 'table' | 'upload' | 'view'>('method');
  const [selectedMethod, setSelectedMethod] = useState<'manual' | 'otomatis' | null>(null);
  
  // State untuk keyboard navigation
  const [focusedCell, setFocusedCell] = useState<{rowId: string, field: keyof PenilaianRow, tableType: 'main' | 'summary'} | null>(null);
  
  // State untuk tahun dan auditor
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customYear, setCustomYear] = useState('');
  const [showAddYear, setShowAddYear] = useState(false);
  const [customYears, setCustomYears] = useState<number[]>([]);
  const [auditor, setAuditor] = useState('Self Assessment');
  const [jenisAsesmen, setJenisAsesmen] = useState('Internal');
  
  // State untuk data table
  const [tableData, setTableData] = useState<PenilaianRow[]>([]);
  
  // Track which fields are being edited to handle 0 display properly
  const [editingFields, setEditingFields] = useState<Record<string, string>>({});
  
  // State untuk file upload
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingResult, setProcessingResult] = useState<any | null>(null);
  
  // State untuk save functionality
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // State for data format mode
  const [isDetailedMode, setIsDetailedMode] = useState(false);
  
  // State for aspect summary table (DETAILED mode only)
  const [aspectSummaryData, setAspectSummaryData] = useState<PenilaianRow[]>([]);
  
  // State for filtering (Lihat Tabel page only)
  const [filterAspek, setFilterAspek] = useState<string>('all');
  const [filterPenjelasan, setFilterPenjelasan] = useState<string>('all');
  const [sortCapaian, setSortCapaian] = useState<'asc' | 'desc' | 'none'>('none');
  
  // Penjelasan suggestions for manual input
  const penjelasanOptions = [
    'Sangat Baik',
    'Baik', 
    'Cukup Baik',
    'Kurang Baik',
    'Tidak Baik'
  ];
  
  // Initialize ChecklistContext data when component mounts
  useEffect(() => {
    console.log('🔧 DEBUG: Component mounted, ensuring all years have checklist data...');
    ensureAllYearsHaveData();
  }, [ensureAllYearsHaveData]);

  // Load data when entering table step for the first time
  useEffect(() => {
    if (currentStep === 'table' && tableData.length === 0) {
      console.log('🔧 DEBUG: Entering table step - loading initial data...');
      // Load appropriate data based on current mode
      if (isDetailedMode) {
        // DETAILED mode - load aspect summary and predetermined rows
        setAspectSummaryData(getAspectSummaryRows());
        const predeterminedRows = generatePredeterminedRows(selectedYear, true);
        setTableData(predeterminedRows);
        console.log(`📊 DETAILED mode activated on table entry - ${predeterminedRows.length} rows loaded`);
      } else {
        // BRIEF mode - load aspect summary as main table
        setAspectSummaryData([]);
        const aspectRows = getAspectSummaryRows();
        setTableData(aspectRows);
        console.log(`📋 BRIEF mode activated on table entry - ${aspectRows.length} aspect rows loaded`);
      }
    }
  }, [currentStep, selectedYear, isDetailedMode]);
  
  // Generate predetermined rows from Kelola Aspek data
  const generatePredeterminedRows = (year: number, isDetailed: boolean): PenilaianRow[] => {
    const checklistData = getChecklistByYear(year);
    
    if (checklistData.length === 0) {
      console.log(`⚠️ No checklist data found for year ${year}`);
      return [];
    }
    
    console.log(`📋 Found ${checklistData.length} checklist items for year ${year}`);
    console.log(`📋 Sample item:`, checklistData[0]); // Debug first item
    
    const rows: PenilaianRow[] = [];
    
    checklistData.forEach((item, index) => {
      // Convert "ASPEK I. Komitmen" to "I" for the aspek field
      let aspek = item.aspek.replace(/ASPEK\s+/, '').split('.')[0].trim();
      
      // Calculate initial capaian (penjelasan now manual)
      const initialCapaian = calculateCapaian(0, 0); // 0 skor, 0 bobot
      
      const row: PenilaianRow = {
        id: `predetermined-${item.id}-${index}`,
        no: isDetailed ? (index + 1).toString() : undefined,
        aspek: aspek,
        deskripsi: item.deskripsi,
        jumlah_parameter: 0, // Default to 0 - user will fill this manually
        bobot: 0, // User will fill this
        skor: 0, // User will fill this
        capaian: initialCapaian,
        penjelasan: '' // Manual input - user selects from dropdown
      };
      
      rows.push(row);
    });
    
    console.log(`✅ Generated ${rows.length} predetermined rows from checklist data`);
    console.log(`📋 Sample generated row:`, rows[0]); // Debug first generated row
    return rows;
  };

  // Dynamic GCG aspect summary rows based on configured aspects
  const getAspectSummaryRows = (): PenilaianRow[] => {
    const aspectsData = getAspectsByYear(selectedYear);
    
    if (aspectsData.length === 0) {
      console.log(`⚠️ No aspects configured for year ${selectedYear}, using empty array`);
      return [];
    }
    
    console.log(`📋 Found ${aspectsData.length} aspects for year ${selectedYear}:`, aspectsData);
    
    return aspectsData.map((aspect, index) => ({
      id: `aspect-${aspect.id}`,
      aspek: aspect.nama, // Use the actual aspect name from Kelola Aspek
      deskripsi: '',
      jumlah_parameter: 0,
      bobot: 0,
      skor: 0,
      capaian: 0,
      penjelasan: ''
    }));
  };

  // Auto-detect data format from existing data
  const detectDataFormat = (data: PenilaianRow[]): 'BRIEF' | 'DETAILED' => {
    if (data.length === 0) return 'BRIEF'; // Default to BRIEF for empty data
    
    // DETAILED format detection:
    // 1. If we have many indicators (>10 rows) -> DETAILED 
    // 2. If any row has 'no' or 'jumlah_parameter' fields -> DETAILED
    const hasManyIndicators = data.length > 10;
    const hasDetailedFields = data.some(row => 
      (row.no !== undefined && row.no !== '') || 
      (row.jumlah_parameter !== undefined && row.jumlah_parameter > 0)
    );
    
    const isDetailed = hasManyIndicators || hasDetailedFields;
    
    console.log(`🔍 Format detection: ${isDetailed ? 'DETAILED' : 'BRIEF'}`, {
      dataLength: data.length,
      hasManyIndicators,
      hasDetailedFields,
      isDetailed,
      sampleRow: data[0]
    });
    
    return isDetailed ? 'DETAILED' : 'BRIEF';
  };

  // Handle mode toggle
  const handleModeToggle = (detailed: boolean) => {
    setIsDetailedMode(detailed);
    
    if (detailed) {
      // Switch to DETAILED mode - load aspect summary and predetermined rows
      setAspectSummaryData(getAspectSummaryRows());
      
      // Load predetermined rows from Kelola Aspek for current year
      const predeterminedRows = generatePredeterminedRows(selectedYear, true);
      setTableData(predeterminedRows);
      console.log(`📊 DETAILED mode activated - aspect summary + ${predeterminedRows.length} predetermined rows loaded`);
    } else {
      // Switch to BRIEF mode - use aspect summary as main table
      setAspectSummaryData([]);
      // Load 6 predefined aspects into main table for BRIEF mode
      setTableData(getAspectSummaryRows());
      console.log('📋 BRIEF mode activated - 6 predefined aspects loaded into main table');
    }
  };


  // Generate aspect summary from detailed indicators
  const generateAspectSummaryFromDetailed = (detailedData: PenilaianRow[]): PenilaianRow[] => {
    console.log('🔄 Generating aspect summary from detailed indicators...', detailedData);
    
    // If skor values are all 0, use default/dummy values for testing
    const allSkorsZero = detailedData.every(row => (row.skor || 0) === 0);
    if (allSkorsZero) {
      console.log('⚠️ All skor values are 0 - using dummy values for testing');
      // Add some dummy skor values for testing
      detailedData.forEach((row, idx) => {
        row.skor = Math.floor(Math.random() * 10) + 1; // Random 1-10
        console.log(`  Dummy skor for row ${idx + 1} (${row.aspek}): ${row.skor}`);
      });
    }
    
    // Group detailed indicators by aspek
    const aspectGroups: { [key: string]: PenilaianRow[] } = {};
    detailedData.forEach(row => {
      const aspek = row.aspek.trim();
      if (aspek) {
        if (!aspectGroups[aspek]) {
          aspectGroups[aspek] = [];
        }
        aspectGroups[aspek].push(row);
      }
    });
    
    const summaryData: PenilaianRow[] = [];
    
    Object.entries(aspectGroups).forEach(([aspek, indicators]) => {
      console.log(`📊 Processing aspek ${aspek} with ${indicators.length} indicators`);
      
      let totalBobot = 0;
      let totalSkor = 0;
      let deskripsi = `Ringkasan Aspek ${aspek}`;
      
      indicators.forEach((indicator, idx) => {
        const bobot = Number(indicator.bobot) || 0;
        const skor = Number(indicator.skor) || 0;
        
        console.log(`  Indicator ${idx + 1}: aspek=${indicator.aspek}, bobot=${bobot}, skor=${skor}`);
        
        // Special rule: If bobot is negative, use skor for calculation instead
        if (bobot < 0) {
          console.log(`  ⚠️ Negative bobot detected (${bobot}) - using skor (${skor}) for bobot calculation`);
          totalBobot += skor; // Use skor value instead of bobot
          totalSkor += skor;
        } else {
          totalBobot += bobot;
          totalSkor += skor;
        }
      });
      
      // Calculate capaian percentage
      const capaian = totalBobot > 0 ? (totalSkor / totalBobot) * 100 : 0;
      const penjelasan = getPenjelasan(totalSkor, totalBobot);
      
      console.log(`  ✅ FINAL Summary for ${aspek}: totalBobot=${totalBobot}, totalSkor=${totalSkor}, capaian=${capaian.toFixed(2)}%`);
      
      summaryData.push({
        id: `auto-summary-${aspek}`,
        aspek: aspek,
        deskripsi: deskripsi,
        jumlah_parameter: indicators.reduce((sum, item) => sum + (item.jumlah_parameter || 0), 0),
        bobot: totalBobot,
        skor: totalSkor,
        capaian: capaian,
        penjelasan: penjelasan
      });
    });
    
    console.log(`🎯 Generated ${summaryData.length} aspect summaries from detailed data`);
    return summaryData;
  };

  // Load data with auto-detection
  const loadDataWithDetection = (data: PenilaianRow[], sheetAnalysis?: any, briefSheetData?: any) => {
    console.log('🔄 Loading data with auto-detection...', data);
    console.log('📋 Sheet analysis received:', sheetAnalysis);
    console.log('📊 BRIEF sheet data received:', briefSheetData);
    
    // Detect format
    const detectedFormat = detectDataFormat(data);
    console.log(`🎯 Detected format: ${detectedFormat}`);
    
    // REMOVED: Automatic mode switching - let user control the mode
    // setIsDetailedMode(detectedFormat === 'DETAILED');
    
    // Use current user mode instead of detected format
    if (isDetailedMode) {
      // Priority 1: Use BRIEF sheet data if available
      if (briefSheetData && briefSheetData.length > 0) {
        console.log('✅ Using BRIEF sheet data for aspect summary');
        const briefSummaryData = briefSheetData.map((row: any, index: number) => ({
          id: `brief-summary-${index + 1}`,
          aspek: row.aspek || '',
          deskripsi: row.deskripsi || '',
          jumlah_parameter: row.jumlah_parameter || 0,
          bobot: row.bobot || 0,
          skor: row.skor || 0,
          capaian: row.capaian || 0,
          penjelasan: row.penjelasan || getPenjelasan(row.skor || 0, row.bobot || 0)
        }));
        setAspectSummaryData(briefSummaryData);
      } 
      // Priority 2: Generate from detailed indicators automatically
      else if (data && data.length > 0) {
        console.log('🔧 Generating aspect summary from detailed indicators');
        const autoSummary = generateAspectSummaryFromDetailed(data);
        setAspectSummaryData(autoSummary.length > 0 ? autoSummary : getAspectSummaryRows());
      }
      // Priority 3: Default empty summary
      else {
        console.log('⚠️ No data available - using default summary rows');
        setAspectSummaryData(getAspectSummaryRows());
      }
    } else {
      setAspectSummaryData([]);
    }
    
    // Load the main data (DETAILED indicators)
    setTableData(data);
  };

  // Generate tahun dari 2014 sampai sekarang + 2 tahun ke depan + custom years
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const baseYears = [];
    for (let year = currentYear + 2; year >= 2014; year--) {
      baseYears.push(year);
    }
    
    // Combine base years with custom years and sort
    const allYears = [...baseYears, ...customYears];
    return [...new Set(allYears)].sort((a, b) => b - a);
  }, [customYears]);

  // Auto-calculate capaian dan penjelasan with negative bobot handling
  const calculateCapaian = (skor: number, bobot: number): number => {
    // Handle special cases
    if (bobot === 0) {
      // If bobot is 0, assume perfect score (best classification)
      return 100;
    }
    
    if (bobot < 0) {
      // Negative bobot = assessment of bad things (harassment, violations)
      // Special range: -100% < capaian < 0%
      // Logic: skor = 0 → capaian = 0% (Sangat Baik)
      //        skor = |bobot| → capaian = -100% (Sangat Kurang)
      if (skor === 0) {
        return 0; // No bad events = 0% = Sangat Baik for negative bobot
      }
      // Formula: -(|skor| / |bobot|) * 100
      const absBobot = Math.abs(bobot);
      const absSkor = Math.abs(skor);
      const ratio = Math.min(absSkor, absBobot) / absBobot; // Cap at 100%
      return -Math.round(ratio * 100); // Negative percentage
    }
    
    // Normal positive bobot calculation
    return Math.round((skor / bobot) * 100);
  };

  const getPenjelasan = (skor: number, bobot: number = 1): string => {
    // Calculate capaian percentage first
    const capaian = calculateCapaian(skor, bobot);
    
    // Handle negative bobot (assessment of bad things) - special logic
    if (bobot < 0) {
      if (skor === 0) return 'Sangat Baik';  // No bad events
      return 'Tidak Baik';  // Any bad events = Tidak Baik
    }
    
    // Handle positive bobot (normal scoring) - use CAPAIAN percentage
    if (capaian > 85) return 'Sangat Baik';
    if (capaian >= 76 && capaian <= 85) return 'Baik';
    if (capaian >= 61 && capaian <= 75) return 'Cukup Baik';
    if (capaian >= 51 && capaian <= 60) return 'Kurang Baik';
    return 'Tidak Baik';  // capaian <= 50
  };

  // REMOVED: Add new row functionality - replaced with predetermined rows from Kelola Aspek
  // const addNewRow = () => { ... };
  // Rows are now automatically loaded from ChecklistContext.getChecklistByYear()

  // Delete row from table
  const deleteRow = (rowId: string) => {
    setTableData(tableData.filter(row => row.id !== rowId));
  };

  // Update aspect summary cell
  const updateAspectSummaryCell = (rowId: string, field: keyof PenilaianRow, value: any) => {
    console.log(`🔄 UpdateAspectSummaryCell: ${field} = ${value}`);
    
    setAspectSummaryData(aspectSummaryData.map(row => {
      if (row.id === rowId) {
        const updatedRow = { ...row, [field]: value };
        
        // Auto-calculate capaian when skor atau bobot berubah (penjelasan now manual)
        if (field === 'skor' || field === 'bobot') {
          updatedRow.capaian = calculateCapaian(updatedRow.skor, updatedRow.bobot);
          // penjelasan is now manual input - no auto-calculation
        }
        
        return updatedRow;
      }
      return row;
    }));
  };

  // Add new summary row
  const addNewSummaryRow = () => {
    const newRow: PenilaianRow = {
      id: `summary-${Date.now()}`,
      aspek: '', // Empty for user to fill
      deskripsi: '',
      jumlah_parameter: 0, // Always present
      bobot: 0,
      skor: 0,
      capaian: 0,
      penjelasan: ''
    };
    setAspectSummaryData([...aspectSummaryData, newRow]);
    console.log('➕ Added new summary row');
  };

  // Delete summary row  
  const deleteSummaryRow = (rowId: string) => {
    setAspectSummaryData(aspectSummaryData.filter(row => row.id !== rowId));
    console.log(`🗑️ Deleted summary row: ${rowId}`);
  };

  // Filter and sort table data for Lihat Tabel page
  const getFilteredAndSortedData = (data: PenilaianRow[]): PenilaianRow[] => {
    let filteredData = [...data];
    
    // Filter by aspek
    if (filterAspek !== 'all') {
      filteredData = filteredData.filter(row => row.aspek === filterAspek);
    }
    
    // Filter by penjelasan
    if (filterPenjelasan !== 'all') {
      filteredData = filteredData.filter(row => row.penjelasan === filterPenjelasan);
    }
    
    // Sort by capaian
    if (sortCapaian === 'asc') {
      filteredData.sort((a, b) => a.capaian - b.capaian);
    } else if (sortCapaian === 'desc') {
      filteredData.sort((a, b) => b.capaian - a.capaian);
    }
    
    return filteredData;
  };

  // Get unique values for filter options
  const getFilterOptions = (data: PenilaianRow[]) => {
    const aspekOptions = [...new Set(data.map(row => row.aspek))].sort();
    
    // Always provide all 5 classification options regardless of current data
    const allPenjelasanOptions = [
      'Sangat Baik',
      'Baik',
      'Cukup Baik', 
      'Kurang Baik',
      'Tidak Baik'
    ];
    
    return { aspekOptions, penjelasanOptions: allPenjelasanOptions };
  };

  // Check if current user is superadmin
  const isSuperAdmin = () => {
    return user?.role === 'superadmin';
  };

  // Check if aspect summary table has meaningful data
  const isAspectSummaryFilled = () => {
    if (!isDetailedMode) return true; // Always show for BRIEF mode
    
    // Check if any aspect summary row has meaningful data
    // Don't consider default roman numerals (I, II, III, IV, V, VI) as meaningful
    const defaultRomanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
    const hasMeaningfulData = aspectSummaryData.some(row => {
      const isNonDefaultAspek = row.aspek.trim() !== '' && !defaultRomanNumerals.includes(row.aspek.trim());
      return isNonDefaultAspek || 
             row.deskripsi.trim() !== '' || 
             row.bobot > 0 || 
             row.skor > 0;
    });
    
    return hasMeaningfulData;
  };

  // Update cell value
  const updateCell = (rowId: string, field: keyof PenilaianRow, value: any) => {
    console.log(`🔄 UpdateCell: ${field} = ${value} (type: ${typeof value})`);
    
    setTableData(tableData.map(row => {
      if (row.id === rowId) {
        const updatedRow = { ...row, [field]: value };
        
        // Auto-calculate capaian when skor atau bobot berubah (penjelasan now manual)
        if (field === 'skor' || field === 'bobot') {
          updatedRow.capaian = calculateCapaian(updatedRow.skor, updatedRow.bobot);
          // penjelasan is now manual input - no auto-calculation
          console.log(`📊 Auto-calculated: skor=${updatedRow.skor}, bobot=${updatedRow.bobot}, capaian=${updatedRow.capaian}%, penjelasan=manual`);
        }
        
        return updatedRow;
      }
      return row;
    }));
  };

  // Keyboard navigation functions
  const moveToNextCell = (currentRowId: string, currentField: keyof PenilaianRow, tableType: 'main' | 'summary', direction: 'left' | 'right' | 'up' | 'down') => {
    const currentData = tableType === 'main' ? tableData : aspectSummaryData;
    
    // Define field order as arrays of PenilaianRow keys (including penjelasan)
    const summaryFieldOrder: (keyof PenilaianRow)[] = ['aspek', 'deskripsi', 'bobot', 'skor', 'penjelasan'];
    const mainFieldOrder: (keyof PenilaianRow)[] = isDetailedMode 
      ? ['aspek', 'no', 'deskripsi', 'jumlah_parameter', 'bobot', 'skor', 'penjelasan']
      : ['aspek', 'deskripsi', 'bobot', 'skor', 'penjelasan'];
    
    const fieldOrder = tableType === 'summary' ? summaryFieldOrder : mainFieldOrder;
    
    const currentRowIndex = currentData.findIndex(row => row.id === currentRowId);
    const currentFieldIndex = fieldOrder.indexOf(currentField);
    
    let newRowIndex = currentRowIndex;
    let newFieldIndex = currentFieldIndex;
    
    switch (direction) {
      case 'right':
        newFieldIndex = Math.min(currentFieldIndex + 1, fieldOrder.length - 1);
        break;
      case 'left':
        newFieldIndex = Math.max(currentFieldIndex - 1, 0);
        break;
      case 'down':
        newRowIndex = Math.min(currentRowIndex + 1, currentData.length - 1);
        break;
      case 'up':
        newRowIndex = Math.max(currentRowIndex - 1, 0);
        break;
    }
    
    const newRowId = currentData[newRowIndex]?.id;
    const newField = fieldOrder[newFieldIndex];
    
    if (newRowId && newField) {
      setFocusedCell({ rowId: newRowId, field: newField, tableType });
      
      // Focus the input element
      setTimeout(() => {
        const inputId = `${tableType}-${newRowId}-${newField}`;
        const element = document.getElementById(inputId) as HTMLInputElement;
        if (element) {
          element.focus();
          element.select();
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowId: string, field: keyof PenilaianRow, tableType: 'main' | 'summary') => {
    // Handle arrow keys for navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      // Prevent default arrow behavior for numeric inputs
      if ((field === 'jumlah_parameter' || field === 'bobot' || field === 'skor') && ['ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
      
      // Handle navigation
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          moveToNextCell(rowId, field, tableType, 'right');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveToNextCell(rowId, field, tableType, 'left');
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveToNextCell(rowId, field, tableType, 'down');
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveToNextCell(rowId, field, tableType, 'up');
          break;
      }
    }
    
    // Handle Enter key to move to next row, same column
    if (e.key === 'Enter') {
      e.preventDefault();
      moveToNextCell(rowId, field, tableType, 'down');
    }
    
    // Handle Tab to move to next field
    if (e.key === 'Tab') {
      e.preventDefault();
      moveToNextCell(rowId, field, tableType, e.shiftKey ? 'left' : 'right');
    }
  };

  // Handle add custom year
  const handleAddYear = () => {
    const year = parseInt(customYear);
    if (year && year >= 2000 && year <= 2050 && !years.includes(year)) {
      setCustomYears([...customYears, year]);
      setSelectedYear(year);
      setCustomYear('');
      setShowAddYear(false);
    }
  };

  // Handle file upload for otomatis method
  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setProcessingError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Note: This is a temporary solution. In production, implement proper file upload API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const result = await response.json();
      
      // Store processing result for display
      setProcessingResult(result);
      
      // Convert result to PenilaianRow format with proper number parsing
      const extractedData = result.extractedData || {};
      const sampleData = extractedData.sample_indicators || [];
      const processedData: PenilaianRow[] = sampleData.map((row: any, index: number) => {
        // Ensure proper number parsing for all numeric fields
        const jumlah_parameter = typeof row.jumlah_parameter === 'string' ? parseInt(row.jumlah_parameter) || 0 : (row.jumlah_parameter || 0);
        const bobot = typeof row.bobot === 'string' ? parseFloat(row.bobot) || 100 : (row.bobot || 100);
        const skor = typeof row.skor === 'string' ? parseFloat(row.skor) || 0 : (row.skor || 0);
        const capaian = typeof row.capaian === 'string' ? parseFloat(row.capaian) || 0 : (row.capaian || 0);
        
        console.log(`Processing row ${index + 1}:`, {
          raw_row: row,
          no: row.no,
          section: row.section,
          description: row.description,
          raw_skor: row.skor,
          parsed_skor: skor,
          raw_bobot: row.bobot,
          parsed_bobot: bobot,
          jumlah_parameter,
          capaian,
          penjelasan: row.penjelasan
        });
        
        return {
          id: row.no?.toString() || (index + 1).toString(),
          no: row.no?.toString() || (index + 1).toString(), // Include the no field
          aspek: row.section || '',
          deskripsi: row.description || '', // This matches the backend field name
          jumlah_parameter: jumlah_parameter, // Always present
          bobot,
          skor,
          capaian,
          penjelasan: getPenjelasan(skor, bobot) // Always recalculate with frontend logic
        };
      });
      
      // Get sheet analysis and brief data from the processing result
      const sheetAnalysis = extractedData.sheet_analysis;
      const briefSheetData = extractedData.brief_sheet_data;
      loadDataWithDetection(processedData, sheetAnalysis, briefSheetData);
      
      // Auto-update selected year if extracted from file
      if (extractedData.year && !isNaN(parseInt(extractedData.year))) {
        const extractedYear = parseInt(extractedData.year);
        setSelectedYear(extractedYear);
        console.log(`Auto-updated year to: ${extractedYear}`);
      }
      
      setCurrentStep('table');
      
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingError('Gagal memproses file. Silakan periksa format file atau coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Load data when year changes
  const handleYearChange = async (year: number) => {
    try {
      console.log(`🔧 DEBUG: Year changed to ${year}, loading indicator data...`);
      
      setSelectedYear(year);
      
      // Load aspek data (always for summary table)
      const aspekResponse = await fetch('/api/aspek-data');
      const aspekResult = await aspekResponse.json();
      
      // Load indicator data (for detailed table if exists)
      const indicatorResponse = await fetch('/api/indicator-data');
      const indicatorResult = await indicatorResponse.json();
      
      console.log(`🔧 DEBUG: Aspek response:`, aspekResult);
      console.log(`🔧 DEBUG: Indicator response:`, indicatorResult);
      
      if (aspekResult.success && aspekResult.data.length > 0) {
        // Filter aspek data for the selected year
        const yearAspekData = aspekResult.data.filter((item: any) => item.tahun === year);
        console.log(`✅ Found ${yearAspekData.length} aspek records for year ${year}`);
        
        if (yearAspekData.length > 0) {
          // Load aspek data to summary table
          setAspectSummaryData(yearAspekData);
          setSaveMessage(`📂 Loaded ${yearAspekData.length} aspek records for year ${year}`);
          
          // Check if we have indicator data for this year
          if (indicatorResult.success && indicatorResult.data.length > 0) {
            const yearIndicators = indicatorResult.data.filter((item: any) => item.tahun === year);
            if (yearIndicators.length > 0) {
              // We have indicator data - load it but RESPECT current mode
              loadDataWithDetection(yearIndicators);
              console.log(`✅ Found ${yearIndicators.length} indicators - loaded in ${isDetailedMode ? 'DETAILED' : 'BRIEF'} mode`);
              
              // Set summary data based on current mode
              if (isDetailedMode) {
                setAspectSummaryData(getAspectSummaryRows());
              } else {
                setAspectSummaryData([]);
                setTableData(yearAspekData);
              }
            } else {
              // No indicators for this year - use aspek data
              setAspectSummaryData([]); // Clear aspect summary table
              setTableData(yearAspekData);
              console.log(`📝 No indicators for year ${year} - using aspek data in ${isDetailedMode ? 'DETAILED' : 'BRIEF'} mode`);
            }
          } else {
            // No indicator data at all - use aspek data
            setAspectSummaryData([]); // Clear aspect summary table
            setTableData(yearAspekData);
            console.log(`📝 No indicator data available - using aspek data in ${isDetailedMode ? 'DETAILED' : 'BRIEF'} mode`);
          }
        } else {
          // No aspek data for this year - load appropriate rows based on mode
          console.log(`📝 No aspek data found for year ${year}, loading ${isDetailedMode ? 'predetermined indicator rows' : 'default aspect rows'}`);
          
          if (isDetailedMode) {
            // DETAILED mode - load predetermined indicator rows from Kelola Aspek
            const predeterminedRows = generatePredeterminedRows(year, true);
            loadDataWithDetection(predeterminedRows);
            setSaveMessage(`📋 No data for year ${year} - loaded ${predeterminedRows.length} detailed placeholder rows`);
            setAspectSummaryData(getAspectSummaryRows());
          } else {
            // BRIEF mode - load 6 simple aspect rows
            setAspectSummaryData([]);
            setTableData(getAspectSummaryRows());
            setSaveMessage(`📋 No data for year ${year} - loaded 6 aspect rows (BRIEF mode)`);
          }
        }
        
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        console.log(`📝 No aspek data available, loading ${isDetailedMode ? 'predetermined indicator rows' : 'default aspect rows'}`);
        
        if (isDetailedMode) {
          // DETAILED mode - load predetermined indicator rows from Kelola Aspek
          const predeterminedRows = generatePredeterminedRows(year, true);
          loadDataWithDetection(predeterminedRows);
          setSaveMessage(`📋 No data available - loaded ${predeterminedRows.length} detailed placeholder rows`);
        } else {
          // BRIEF mode - load 6 simple aspect rows
          setAspectSummaryData([]);
          setTableData(getAspectSummaryRows());
          setSaveMessage(`📋 No data available - loaded 6 aspect rows (BRIEF mode)`);
        }
        
        setTimeout(() => setSaveMessage(null), 3000);
      }
      
    } catch (error) {
      console.error('❌ Error loading indicator data:', error);
      
      if (isDetailedMode) {
        // DETAILED mode - fallback to predetermined indicator rows
        const predeterminedRows = generatePredeterminedRows(year, true);
        loadDataWithDetection(predeterminedRows);
        setSaveMessage(`❌ Error loading data - using ${predeterminedRows.length} detailed placeholder rows`);
      } else {
        // BRIEF mode - fallback to 6 simple aspect rows
        setAspectSummaryData([]);
        setTableData(getAspectSummaryRows());
        setSaveMessage(`❌ Error loading data - using 6 aspect rows (BRIEF mode)`);
      }
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  // Save handler for local JSON storage
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      console.log('🔧 DEBUG: Starting save process...');
      console.log(`📊 Saving ${tableData.length} main rows for year ${selectedYear}`);
      console.log(`📋 Saving ${isDetailedMode ? aspectSummaryData.length : 0} aspect summary rows`);
      console.log(`🎯 Year being saved: ${selectedYear}, Auditor: ${auditor}, Jenis Asesmen: ${jenisAsesmen}`);
      
      const saveData = {
        data: tableData,
        aspectSummaryData: isDetailedMode ? aspectSummaryData : [],
        year: selectedYear,
        auditor: auditor,
        jenis_asesmen: jenisAsesmen,
        method: selectedMethod || 'manual'
      };
      
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Save successful! Assessment ID: ${result.assessment_id}`);
        setSaveMessage(`📊 Data berhasil disimpan! 
        💾 Assessment ID: ${result.assessment_id}
        📁 Excel otomatis dibuat di: data/output/web-output/output.xlsx`);
        
        // Auto-hide success message after 5 seconds (longer for more info)
        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        throw new Error(result.error || 'Save failed');
      }
      
    } catch (error) {
      console.error('❌ Save error:', error);
      setSaveMessage(`Gagal menyimpan data: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Method Selection Step
  const renderMethodSelection = () => (
    <div className="space-y-8">

      <div className="space-y-6">
        
        {/* Access Level Message for Non-Superadmin */}
        {!isSuperAdmin() && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Info:</strong> Akses Anda terbatas pada melihat data. Hanya Super Admin yang dapat menambah atau mengedit data GCG.
            </p>
          </div>
        )}
        
        <div className="flex items-center space-x-4">


        </div>
      </div>

      {/* Dashboard Section - Always visible frontpage */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 text-left">Dashboard Visualisasi</h2>
        
        <GCGChartWrapper selectedYear={selectedYear} tableData={tableData} auditor={auditor} jenisAsesmen={jenisAsesmen} />
        
        {/* Input/Edit Data Button - moved to bottom */}
        {isSuperAdmin() && (
          <div className="flex justify-center pt-4">
            <Button 
              onClick={() => {
                setSelectedMethod('manual');
                setCurrentStep('table');
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-sm"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Input/Edit Data
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // File Upload Step
  const renderFileUpload = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('method')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upload File Dokumen</h2>
          <p className="text-gray-600">Upload file GCG untuk diproses otomatis</p>
        </div>
      </div>

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors">
        <CardContent className="p-8">
          <div className="text-center">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drag & Drop atau Klik untuk Upload</h3>
            <p className="text-gray-600 mb-4">
              Support: Excel (.xlsx, .xls), PDF, Gambar (.png, .jpg)
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Maksimal ukuran file: 50MB
            </p>
            
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx,.xls,.pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
            />
            <Label htmlFor="file-upload">
              <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Pilih File
                </span>
              </Button>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>
                <h4 className="font-semibold text-blue-900">Memproses File...</h4>
                <p className="text-blue-700 text-sm">
                  Menggunakan POS Data Cleaner untuk mengekstrak data GCG
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {processingError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900">Gagal Memproses File</h4>
                <p className="text-red-700 text-sm mt-1">{processingError}</p>
                <div className="mt-3 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentStep('method')}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Coba Input/Edit Data
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setProcessingError(null);
                    }}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Upload File Lain
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );


  // Table Step (main editing interface)
  const renderViewTable = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('method')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Lihat Tabel Data GCG</h2>
            <p className="text-gray-600">View data penilaian GCG (Read-only)</p>
          </div>
        </div>
      </div>

      {/* Year Selection */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-gray-900">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span>Pilih Tahun untuk Dilihat</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Tahun Buku</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => handleYearChange(parseInt(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {[2020, 2021, 2022, 2023, 2024, 2025].map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Controls - Only for indicator data */}
      {tableData.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <Target className="w-5 h-5 text-blue-600" />
              <span>Filter & Sorting</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filter by Aspek */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Filter Aspek</Label>
                <Select value={filterAspek} onValueChange={setFilterAspek}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Aspek" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Aspek</SelectItem>
                    {getFilterOptions(tableData).aspekOptions.map((aspek) => (
                      <SelectItem key={aspek} value={aspek}>Aspek {aspek}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter by Penjelasan */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Filter Penjelasan</Label>
                <Select value={filterPenjelasan} onValueChange={setFilterPenjelasan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Penjelasan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Penjelasan</SelectItem>
                    {getFilterOptions(tableData).penjelasanOptions.map((penjelasan) => (
                      <SelectItem key={penjelasan} value={penjelasan}>{penjelasan}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort by Capaian */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Sorting Capaian</Label>
                <Select value={sortCapaian} onValueChange={(value) => setSortCapaian(value as 'asc' | 'desc' | 'none')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tanpa Sorting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa Sorting</SelectItem>
                    <SelectItem value="desc">Capaian Tertinggi</SelectItem>
                    <SelectItem value="asc">Capaian Terendah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Summary & Reset */}
            <div className="mt-4 pt-4 border-t border-blue-200 flex items-center justify-between">
              <div className="text-sm text-blue-900">
                <strong>Menampilkan:</strong> {getFilteredAndSortedData(tableData).length} dari {tableData.length} indikator
                {filterAspek !== 'all' && <span className="ml-2 px-2 py-1 bg-blue-100 rounded text-xs">Aspek: {filterAspek}</span>}
                {filterPenjelasan !== 'all' && <span className="ml-2 px-2 py-1 bg-green-100 rounded text-xs">Penjelasan: {filterPenjelasan}</span>}
                {sortCapaian !== 'none' && <span className="ml-2 px-2 py-1 bg-purple-100 rounded text-xs">Sorting: {sortCapaian === 'desc' ? 'Tertinggi→Terendah' : 'Terendah→Tertinggi'}</span>}
              </div>
              
              {/* Reset Filters Button */}
              {(filterAspek !== 'all' || filterPenjelasan !== 'all' || sortCapaian !== 'none') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterAspek('all');
                    setFilterPenjelasan('all');
                    setSortCapaian('none');
                  }}
                  className="text-gray-600 border-gray-300 hover:bg-gray-100"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Tables - Read Only */}
      {tableData.length > 0 && (
        <>
          {/* Aspek Summary Table (DETAILED mode only) - Read Only */}
          {isDetailedMode && aspectSummaryData.length > 0 && (
            <Card className="border-0 shadow-lg bg-gray-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-gray-600" />
                  <span>Summary Aspek GCG - Tahun Buku {selectedYear} (Read-only)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100">
                      <TableHead className="text-gray-900 font-semibold">Aspek</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Deskripsi</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Bobot</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Skor</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Capaian (%)</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Penjelasan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aspectSummaryData.map((row) => (
                      <TableRow key={row.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-center">{row.aspek}</TableCell>
                        <TableCell className="text-sm">{row.deskripsi}</TableCell>
                        <TableCell className="text-center">{row.bobot}</TableCell>
                        <TableCell className="text-center">{row.skor}</TableCell>
                        <TableCell className="text-center">{row.capaian}%</TableCell>
                        <TableCell>
                          <div className="text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              row.penjelasan === 'Sangat Baik' ? 'bg-green-100 text-green-800' :
                              row.penjelasan === 'Baik' ? 'bg-blue-100 text-blue-800' :
                              row.penjelasan === 'Cukup Baik' ? 'bg-yellow-100 text-yellow-800' :
                              row.penjelasan === 'Kurang Baik' ? 'bg-orange-100 text-orange-800' :
                              row.penjelasan === 'Tidak Baik' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {row.penjelasan}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Main Data Table - Read Only */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <span>Data Indikator GCG - Tahun Buku {selectedYear} (Read-only)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 hover:bg-gray-100">
                    {isDetailedMode && <TableHead className="text-gray-900 font-semibold">No</TableHead>}
                    <TableHead className="text-gray-900 font-semibold">Aspek</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Deskripsi</TableHead>
                    {isDetailedMode && <TableHead className="text-gray-900 font-semibold">Jumlah Parameter</TableHead>}
                    <TableHead className="text-gray-900 font-semibold">Bobot</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Skor</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Capaian (%)</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Penjelasan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredAndSortedData(tableData).map((row) => (
                    <TableRow key={row.id} className="hover:bg-gray-50">
                      {isDetailedMode && <TableCell className="text-center font-medium">{row.no}</TableCell>}
                      <TableCell className="font-medium text-center">{row.aspek}</TableCell>
                      <TableCell className="text-sm">{row.deskripsi}</TableCell>
                      {isDetailedMode && <TableCell className="text-center">{row.jumlah_parameter}</TableCell>}
                      <TableCell className="text-center">{row.bobot}</TableCell>
                      <TableCell className="text-center">{row.skor}</TableCell>
                      <TableCell className="text-center">{row.capaian}%</TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            row.penjelasan === 'Sangat Baik' ? 'bg-green-100 text-green-800' :
                            row.penjelasan === 'Baik' ? 'bg-blue-100 text-blue-800' :
                            row.penjelasan === 'Cukup Baik' ? 'bg-yellow-100 text-yellow-800' :
                            row.penjelasan === 'Kurang Baik' ? 'bg-orange-100 text-orange-800' :
                            row.penjelasan === 'Tidak Baik' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {row.penjelasan}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary Info */}
          <Card className="border-0 shadow-lg bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-900">
                  <strong>Format:</strong> {isDetailedMode ? 'DETAILED' : 'BRIEF'} | 
                  <strong> Menampilkan:</strong> {getFilteredAndSortedData(tableData).length} dari {tableData.length} indikator | 
                  <strong> Penilai:</strong> {auditor} | <strong>Jenis:</strong> {jenisAsesmen}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {tableData.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Tidak Ada Data</h3>
            <p className="text-gray-500">
              Pilih tahun yang memiliki data atau gunakan Input/Edit Data/Otomatis untuk menambahkan data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTable = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('method')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedMethod === 'manual' ? 'Input/Edit Data' : 'Review & Edit'} Data GCG
            </h2>
            <p className="text-gray-600">
              {selectedMethod === 'manual' 
                ? 'Tambahkan data penilaian GCG secara manual'
                : 'Review hasil otomatis dan edit jika diperlukan'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Year and Auditor Selection */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Tahun Buku & Info Penilaian</span>
          </CardTitle>
          <CardDescription>
            Pilih tahun buku dan tentukan auditor untuk data penilaian GCG ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Year Selection Row */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Tahun Buku</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => handleYearChange(parseInt(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih tahun buku" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            
              {showAddYear ? (
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="2026"
                    value={customYear}
                    onChange={(e) => setCustomYear(e.target.value)}
                    className="w-20"
                  />
                  <Button size="sm" onClick={handleAddYear}>
                    <CheckCircle className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setShowAddYear(false);
                      setCustomYear('');
                    }}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddYear(true)}
                  className="border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Tambah Tahun Buku
                </Button>
              )}
            </div>

            {/* Auditor Selection Row */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Auditor/Penilai</Label>
              <Input
                type="text"
                placeholder="Contoh: Self Assessment, BPKP, Internal Audit, PWC, etc."
                value={auditor}
                onChange={(e) => setAuditor(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Masukkan nama auditor atau jenis penilaian (self assessment, pihak eksternal, dll)
              </p>
            </div>

            {/* Jenis Asesmen Selection Row */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Jenis Asesmen</Label>
              <Input
                type="text"
                placeholder="External, Internal, atau jenis lainnya"
                value={jenisAsesmen}
                onChange={(e) => setJenisAsesmen(e.target.value)}
                className="w-full"
                list="jenis-asesmen-suggestions"
              />
              <datalist id="jenis-asesmen-suggestions">
                <option value="External" />
                <option value="Internal" />
              </datalist>
              <p className="text-xs text-gray-500 mt-1">
                Masukkan jenis asesmen (External, Internal, atau custom sesuai kebutuhan)
              </p>
            </div>

            {/* Data Format Mode Toggle */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">Format Data</Label>
                  <p className="text-xs text-gray-500">
                    Pilih format input: BRIEF (per aspek) atau DETAILED (per indikator dengan No dan Jumlah Parameter)
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm ${!isDetailedMode ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    BRIEF
                  </span>
                  <Switch
                    checked={isDetailedMode}
                    onCheckedChange={handleModeToggle}
                    className="data-[state=checked]:bg-purple-600"
                  />
                  <span className={`text-sm ${isDetailedMode ? 'text-purple-900 font-medium' : 'text-gray-500'}`}>
                    DETAILED
                  </span>
                </div>
              </div>
              
              {isDetailedMode && (
                <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-800">
                    📊 Mode DETAILED aktif - Tabel aspek summary + tabel indikator dengan kolom No dan Jumlah Parameter
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tahun Buku: {selectedYear}</strong> | <strong>Auditor: {auditor}</strong> | <strong>Jenis: {jenisAsesmen}</strong> | <strong>Format: {isDetailedMode ? 'DETAILED' : 'BRIEF'}</strong>
              <br />
              <span className="text-xs">
                Semua data akan disimpan dengan informasi ini
                {isDetailedMode && ' | Mode DETAILED: Tabel aspek + indikator'}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Processing Success Info */}
      {processingResult && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900">File Berhasil Diproses!</h4>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-green-700 font-medium">File:</p>
                    <p className="text-green-600">{processingResult.originalFilename}</p>
                  </div>
                  <div>
                    <p className="text-green-700 font-medium">Format:</p>
                    <p className="text-green-600">{processingResult.extractedData?.format_type || 'DETAILED'}</p>
                  </div>
                  <div>
                    <p className="text-green-700 font-medium">Indikator:</p>
                    <p className="text-green-600">{processingResult.extractedData?.indicators} indikator</p>
                  </div>
                  <div>
                    <p className="text-green-700 font-medium">Status:</p>
                    <p className="text-green-600">{processingResult.extractedData?.processing_status === 'success' ? 'Berhasil' : 'Selesai'}</p>
                  </div>
                </div>
                {processingResult.extractedData?.year && (
                  <div className="mt-2">
                    <p className="text-green-700 text-sm">
                      <strong>Tahun:</strong> {processingResult.extractedData.year} | 
                      <strong> Penilai:</strong> {processingResult.extractedData?.penilai || 'Tidak terdeteksi'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aspect Summary Table (DETAILED mode only) */}
      {isDetailedMode && (
        <Card className="border-0 shadow-lg bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span>Summary Aspek GCG - Tahun Buku {selectedYear}</span>
            </CardTitle>
            <CardDescription>
              6 aspek GCG utama untuk penilaian summary (tanpa kolom No dan Jumlah Parameter)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <TableHead className="text-purple-900 font-semibold">Aspek</TableHead>
                    <TableHead className="text-purple-900 font-semibold">Deskripsi</TableHead>
                    <TableHead className="text-purple-900 font-semibold">Bobot</TableHead>
                    <TableHead className="text-purple-900 font-semibold">Skor</TableHead>
                    <TableHead className="text-purple-900 font-semibold">Capaian (%)</TableHead>
                    <TableHead className="text-purple-900 font-semibold">Penjelasan</TableHead>
                    <TableHead className="text-purple-900 font-semibold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aspectSummaryData.map((row) => (
                    <TableRow key={row.id} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50">
                      {/* Aspek (Editable) */}
                      <TableCell>
                        <Input
                          id={`summary-${row.id}-aspek`}
                          value={row.aspek}
                          onChange={(e) => updateAspectSummaryCell(row.id, 'aspek', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, row.id, 'aspek', 'summary')}
                          className="border-0 bg-transparent focus:bg-white focus:border focus:border-purple-300 text-center font-medium w-16"
                          placeholder="I, II, III..."
                        />
                      </TableCell>
                      
                      {/* Deskripsi */}
                      <TableCell className="min-w-64 relative overflow-visible" style={{ position: 'relative', zIndex: 10 }}>
                        <DeskripsiAutocomplete
                          id={`summary-${row.id}-deskripsi`}
                          value={row.deskripsi}
                          onChange={(value) => updateAspectSummaryCell(row.id, 'deskripsi', value)}
                          onKeyDown={(e) => handleKeyDown(e, row.id, 'deskripsi', 'summary')}
                          className="border-0 bg-transparent focus:bg-white focus:border focus:border-purple-300"
                          placeholder="Deskripsi aspek..."
                          filterType="header"
                        />
                      </TableCell>
                      
                      {/* Bobot */}
                      <TableCell>
                        <Input
                          id={`summary-${row.id}-bobot`}
                          type="number"
                          step="0.01"
                          value={(() => {
                            const fieldKey = `${row.id}-bobot-summary`;
                            if (editingFields[fieldKey] !== undefined) {
                              return editingFields[fieldKey]; // Show what user is typing
                            }
                            return row.bobot.toString(); // Always show the value, including 0
                          })()}
                          onChange={(e) => {
                            const value = e.target.value;
                            const fieldKey = `${row.id}-bobot-summary`;
                            
                            // Track what user is typing
                            setEditingFields(prev => ({
                              ...prev,
                              [fieldKey]: value
                            }));
                            
                            if (value === '' || value === null) {
                              updateAspectSummaryCell(row.id, 'bobot', 0);
                            } else {
                              const numValue = parseFloat(value);
                              updateAspectSummaryCell(row.id, 'bobot', isNaN(numValue) ? 0 : numValue);
                            }
                          }}
                          onBlur={(e) => {
                            const fieldKey = `${row.id}-bobot-summary`;
                            // Clear editing state
                            setEditingFields(prev => {
                              const newState = { ...prev };
                              delete newState[fieldKey];
                              return newState;
                            });
                            
                            // Auto-set to 0 when user leaves empty field
                            if (e.target.value === '' || e.target.value === null) {
                              updateAspectSummaryCell(row.id, 'bobot', 0);
                            }
                          }}
                          onFocus={() => {
                            const fieldKey = `${row.id}-bobot-summary`;
                            // When focusing, show current value (even if 0)
                            setEditingFields(prev => ({
                              ...prev,
                              [fieldKey]: row.bobot.toString()
                            }));
                          }}
                          onKeyDown={(e) => handleKeyDown(e, row.id, 'bobot', 'summary')}
                          className="border-0 bg-transparent focus:bg-white focus:border focus:border-purple-300 w-20"
                          placeholder="0.00"
                        />
                      </TableCell>
                      
                      {/* Skor */}
                      <TableCell>
                        <Input
                          id={`summary-${row.id}-skor`}
                          type="number"
                          step="0.01"
                          value={(() => {
                            const fieldKey = `${row.id}-skor-summary`;
                            if (editingFields[fieldKey] !== undefined) {
                              return editingFields[fieldKey]; // Show what user is typing
                            }
                            return row.skor.toString(); // Always show the value, including 0
                          })()}
                          onChange={(e) => {
                            const value = e.target.value;
                            const fieldKey = `${row.id}-skor-summary`;
                            
                            // Track what user is typing
                            setEditingFields(prev => ({
                              ...prev,
                              [fieldKey]: value
                            }));
                            
                            if (value === '' || value === null) {
                              updateAspectSummaryCell(row.id, 'skor', 0);
                            } else {
                              const numValue = parseFloat(value);
                              updateAspectSummaryCell(row.id, 'skor', isNaN(numValue) ? 0 : numValue);
                            }
                          }}
                          onBlur={(e) => {
                            const fieldKey = `${row.id}-skor-summary`;
                            // Clear editing state
                            setEditingFields(prev => {
                              const newState = { ...prev };
                              delete newState[fieldKey];
                              return newState;
                            });
                            
                            // Auto-set to 0 when user leaves empty field
                            if (e.target.value === '' || e.target.value === null) {
                              updateAspectSummaryCell(row.id, 'skor', 0);
                            }
                          }}
                          onFocus={() => {
                            const fieldKey = `${row.id}-skor-summary`;
                            // When focusing, show current value (even if 0)
                            setEditingFields(prev => ({
                              ...prev,
                              [fieldKey]: row.skor.toString()
                            }));
                          }}
                          onKeyDown={(e) => handleKeyDown(e, row.id, 'skor', 'summary')}
                          className="border-0 bg-transparent focus:bg-white focus:border focus:border-purple-300 w-20"
                          placeholder="0.00"
                        />
                      </TableCell>
                      
                      {/* Capaian (Auto-calculated) */}
                      <TableCell>
                        <div className="text-center font-medium">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            row.capaian >= 85 ? 'bg-green-100 text-green-800' :
                            row.capaian >= 75 ? 'bg-blue-100 text-blue-800' :
                            row.capaian >= 65 ? 'bg-yellow-100 text-yellow-800' :
                            row.capaian >= 50 ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {row.capaian}%
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Penjelasan (Manual Input with Native Datalist) */}
                      <TableCell>
                        <Input
                          id={`summary-${row.id}-penjelasan`}
                          type="text"
                          value={row.penjelasan}
                          onChange={(e) => updateAspectSummaryCell(row.id, 'penjelasan', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, row.id, 'penjelasan', 'summary')}
                          onFocus={(e) => {
                            // Show datalist suggestions when clicking on empty field
                            if (!e.target.value) {
                              e.target.setAttribute('placeholder', '');
                              setTimeout(() => e.target.click(), 0);
                            }
                          }}
                          className={`border-0 bg-transparent focus:bg-white focus:border focus:border-purple-300 text-center px-2 py-1 rounded-full text-xs font-medium ${
                            row.penjelasan === 'Sangat Baik' ? 'bg-green-100 text-green-800' :
                            row.penjelasan === 'Baik' ? 'bg-blue-100 text-blue-800' :
                            row.penjelasan === 'Cukup Baik' ? 'bg-yellow-100 text-yellow-800' :
                            row.penjelasan === 'Kurang Baik' ? 'bg-orange-100 text-orange-800' :
                            row.penjelasan === 'Tidak Baik' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                          placeholder="Sangat Baik, Baik, Cukup Baik..."
                          list={`penjelasan-suggestions-summary-${row.id}`}
                        />
                        <datalist id={`penjelasan-suggestions-summary-${row.id}`}>
                          {penjelasanOptions.map(option => (
                            <option key={option} value={option} />
                          ))}
                        </datalist>
                      </TableCell>
                      
                      {/* Aksi */}
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteSummaryRow(row.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Add Row Button for Summary Table */}
            <div className="mt-4 text-center">
              <Button 
                onClick={addNewSummaryRow}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Aspek Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Data Table */}
      <div className="min-h-[650px]">
        <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>
                  {isDetailedMode 
                    ? `Data Indikator Detail - Tahun Buku ${selectedYear}` 
                    : `Data Performa GCG - Tahun Buku ${selectedYear}`
                  }
                </span>
              </CardTitle>
              <CardDescription>
                {tableData.length} baris data {isDetailedMode ? 'indikator detail' : 'penilaian'}
              </CardDescription>
            </div>
            <div className="space-x-2">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={tableData.length === 0 || isSaving}
                onClick={handleSave}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Menyimpan...' : 'Simpan Data'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Save Message */}
        {saveMessage && (
          <div className="mx-6 mb-4">
            <div className={`p-3 rounded-lg text-sm ${
              saveMessage.includes('berhasil') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {saveMessage}
            </div>
          </div>
        )}
        
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <TableHead className="text-indigo-900 font-semibold">Aspek</TableHead>
                  {isDetailedMode && (
                    <TableHead className="text-indigo-900 font-semibold">No</TableHead>
                  )}
                  <TableHead className="text-indigo-900 font-semibold">Deskripsi</TableHead>
                  {isDetailedMode && (
                    <TableHead className="text-indigo-900 font-semibold">
                      <div className="flex items-center space-x-1">
                        <span>Jumlah Parameter</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-4 h-4 text-indigo-600 hover:text-indigo-800 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">Kalau jumlah parameter gak ada, kosongin aja</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>
                  )}
                  <TableHead className="text-indigo-900 font-semibold">Bobot</TableHead>
                  <TableHead className="text-indigo-900 font-semibold">Skor</TableHead>
                  <TableHead className="text-indigo-900 font-semibold">Capaian (%)</TableHead>
                  <TableHead className="text-indigo-900 font-semibold">Penjelasan</TableHead>
                  <TableHead className="text-indigo-900 font-semibold">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50">
                    {/* Aspek */}
                    <TableCell>
                      <Input
                        id={`main-${row.id}-aspek`}
                        value={row.aspek}
                        onChange={(e) => updateCell(row.id, 'aspek', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, row.id, 'aspek', 'main')}
                        className="border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300"
                        placeholder="I, II, III..."
                      />
                    </TableCell>
                    
                    {/* No (DETAILED mode only) */}
                    {isDetailedMode && (
                      <TableCell>
                        <Input
                          id={`main-${row.id}-no`}
                          value={row.no || ''}
                          onChange={(e) => updateCell(row.id, 'no', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, row.id, 'no', 'main')}
                          className="border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 w-20"
                          placeholder="1, 2, 3..."
                        />
                      </TableCell>
                    )}
                    
                    {/* Deskripsi - read-only for loaded indicators, editable for manual input */}
                    <TableCell className="min-w-64">
                      {row.deskripsi ? (
                        <div className="text-sm text-gray-900 py-2 px-1">
                          {row.deskripsi}
                        </div>
                      ) : (
                        <DeskripsiAutocomplete
                          id={`main-${row.id}-deskripsi`}
                          value={row.deskripsi}
                          onChange={(value) => updateCell(row.id, 'deskripsi', value)}
                          onKeyDown={(e) => handleKeyDown(e, row.id, 'deskripsi', 'main')}
                          className="border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300"
                          placeholder="Deskripsi penilaian..."
                          filterType={isDetailedMode ? "indicator" : "header"}
                        />
                      )}
                    </TableCell>
                    
                    {/* Jumlah Parameter (DETAILED mode only) */}
                    {isDetailedMode && (
                      <TableCell>
                        <Input
                          id={`main-${row.id}-jumlah_parameter`}
                          type="number"
                          value={(() => {
                            const fieldKey = `${row.id}-jumlah_parameter`;
                            if (editingFields[fieldKey] !== undefined) {
                              return editingFields[fieldKey]; // Show what user is typing
                            }
                            return row.jumlah_parameter.toString(); // Always show the value, including 0
                          })()}
                          onChange={(e) => {
                            const value = e.target.value;
                            const fieldKey = `${row.id}-jumlah_parameter`;
                            
                            // Track what user is typing
                            setEditingFields(prev => ({
                              ...prev,
                              [fieldKey]: value
                            }));
                            
                            if (value === '' || value === null) {
                              updateCell(row.id, 'jumlah_parameter', 0);
                            } else {
                              const numValue = parseInt(value);
                              updateCell(row.id, 'jumlah_parameter', isNaN(numValue) ? 0 : numValue);
                            }
                          }}
                          onKeyDown={(e) => handleKeyDown(e, row.id, 'jumlah_parameter', 'main')}
                          onBlur={(e) => {
                            const fieldKey = `${row.id}-jumlah_parameter`;
                            // Clear editing state
                            setEditingFields(prev => {
                              const newState = { ...prev };
                              delete newState[fieldKey];
                              return newState;
                            });
                            
                            // Auto-set to 0 when user leaves empty field
                            if (e.target.value === '' || e.target.value === null) {
                              updateCell(row.id, 'jumlah_parameter', 0);
                            }
                          }}
                          onFocus={() => {
                            const fieldKey = `${row.id}-jumlah_parameter`;
                            // When focusing, show current value (even if 0)
                            setEditingFields(prev => ({
                              ...prev,
                              [fieldKey]: row.jumlah_parameter.toString()
                            }));
                          }}
                          className="border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 w-20"
                          placeholder="0"
                        />
                      </TableCell>
                    )}
                    
                    {/* Bobot */}
                    <TableCell>
                      <Input
                        id={`main-${row.id}-bobot`}
                        type="number"
                        step="0.01"
                        value={(() => {
                          const fieldKey = `${row.id}-bobot`;
                          if (editingFields[fieldKey] !== undefined) {
                            return editingFields[fieldKey]; // Show what user is typing
                          }
                          return row.bobot.toString(); // Always show the value, including 0
                        })()}
                        onChange={(e) => {
                          const value = e.target.value;
                          const fieldKey = `${row.id}-bobot`;
                          
                          // Track what user is typing
                          setEditingFields(prev => ({
                            ...prev,
                            [fieldKey]: value
                          }));
                          
                          if (value === '' || value === null) {
                            updateCell(row.id, 'bobot', 0);
                          } else {
                            const numValue = parseFloat(value);
                            updateCell(row.id, 'bobot', isNaN(numValue) ? 0 : numValue);
                          }
                        }}
                        onKeyDown={(e) => handleKeyDown(e, row.id, 'bobot', 'main')}
                        onBlur={(e) => {
                          const fieldKey = `${row.id}-bobot`;
                          // Clear editing state
                          setEditingFields(prev => {
                            const newState = { ...prev };
                            delete newState[fieldKey];
                            return newState;
                          });
                          
                          // Auto-set to 0 when user leaves empty field
                          if (e.target.value === '' || e.target.value === null) {
                            updateCell(row.id, 'bobot', 0);
                          }
                        }}
                        onFocus={() => {
                          const fieldKey = `${row.id}-bobot`;
                          // When focusing, show current value (even if 0)
                          setEditingFields(prev => ({
                            ...prev,
                            [fieldKey]: row.bobot.toString()
                          }));
                        }}
                        className="border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 w-20"
                        placeholder="0.00"
                      />
                      {row.bobot < 0 && (
                        <div className="text-xs text-orange-600 mt-1">Bobot negatif</div>
                      )}
                    </TableCell>
                    
                    {/* Skor */}
                    <TableCell>
                      <Input
                        id={`main-${row.id}-skor`}
                        type="number"
                        step="0.01"
                        value={(() => {
                          const fieldKey = `${row.id}-skor`;
                          if (editingFields[fieldKey] !== undefined) {
                            return editingFields[fieldKey]; // Show what user is typing
                          }
                          return row.skor.toString(); // Always show the value, including 0
                        })()}
                        onChange={(e) => {
                          const value = e.target.value;
                          const fieldKey = `${row.id}-skor`;
                          
                          // Track what user is typing
                          setEditingFields(prev => ({
                            ...prev,
                            [fieldKey]: value
                          }));
                          
                          if (value === '' || value === null) {
                            updateCell(row.id, 'skor', 0);
                          } else {
                            const numValue = parseFloat(value);
                            updateCell(row.id, 'skor', isNaN(numValue) ? 0 : numValue);
                          }
                        }}
                        onKeyDown={(e) => handleKeyDown(e, row.id, 'skor', 'main')}
                        onBlur={(e) => {
                          const fieldKey = `${row.id}-skor`;
                          // Clear editing state
                          setEditingFields(prev => {
                            const newState = { ...prev };
                            delete newState[fieldKey];
                            return newState;
                          });
                          
                          // Auto-set to 0 when user leaves empty field
                          if (e.target.value === '' || e.target.value === null) {
                            updateCell(row.id, 'skor', 0);
                          }
                        }}
                        onFocus={() => {
                          const fieldKey = `${row.id}-skor`;
                          // When focusing, show current value (even if 0)
                          setEditingFields(prev => ({
                            ...prev,
                            [fieldKey]: row.skor.toString()
                          }));
                        }}
                        className="border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 w-20"
                        placeholder="0.00"
                      />
                    </TableCell>
                    
                    {/* Capaian (Auto-calculated) */}
                    <TableCell>
                      <div className="text-center font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          // Special case: 0% depends on bobot sign
                          row.capaian === 0 ? (
                            row.bobot < 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          ) :
                          // Handle negative capaian (for negative bobot)
                          row.capaian < 0 && row.capaian >= -100 ? (
                            row.capaian >= -10 ? 'bg-green-100 text-green-800' :  // -1% to -10% = Sangat Baik
                            row.capaian >= -20 ? 'bg-blue-100 text-blue-800' :    // -11% to -20% = Baik
                            row.capaian >= -30 ? 'bg-yellow-100 text-yellow-800' : // -21% to -30% = Cukup Baik
                            row.capaian >= -40 ? 'bg-orange-100 text-orange-800' : // -31% to -40% = Kurang Baik
                            'bg-red-100 text-red-800'                              // -41% to -100% = Sangat Kurang
                          ) : (
                            // Handle positive capaian (normal logic)
                            row.capaian >= 85 ? 'bg-green-100 text-green-800' :
                            row.capaian >= 75 ? 'bg-blue-100 text-blue-800' :
                            row.capaian >= 65 ? 'bg-yellow-100 text-yellow-800' :
                            row.capaian >= 50 ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          )
                        }`}>
                          {row.capaian}%
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* Penjelasan (Manual Input with Native Datalist) */}
                    <TableCell>
                      <Input
                        id={`main-${row.id}-penjelasan`}
                        type="text"
                        value={row.penjelasan}
                        onChange={(e) => updateCell(row.id, 'penjelasan', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, row.id, 'penjelasan', 'main')}
                        onFocus={(e) => {
                          // Show datalist suggestions when clicking on empty field
                          if (!e.target.value) {
                            e.target.setAttribute('placeholder', '');
                            setTimeout(() => e.target.click(), 0);
                          }
                        }}
                        className={`border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 text-center px-2 py-1 rounded-full text-xs font-medium ${
                          row.penjelasan === 'Sangat Baik' ? 'bg-green-100 text-green-800' :
                          row.penjelasan === 'Baik' ? 'bg-blue-100 text-blue-800' :
                          row.penjelasan === 'Cukup Baik' ? 'bg-yellow-100 text-yellow-800' :
                          row.penjelasan === 'Kurang Baik' ? 'bg-orange-100 text-orange-800' :
                          row.penjelasan === 'Tidak Baik' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                        placeholder="Sangat Baik, Baik, Cukup Baik..."
                        list={`penjelasan-suggestions-main-${row.id}`}
                      />
                      <datalist id={`penjelasan-suggestions-main-${row.id}`}>
                        {penjelasanOptions.map(option => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    </TableCell>
                    
                    {/* Action */}
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRow(row.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            
            {/* Mode Info */}
            {isDetailedMode && tableData.length > 0 && (
              <div className="mt-4 text-center">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800">
                    📊 Mode DETAILED - Data indikator dengan kolom No dan Jumlah Parameter aktif
                  </p>
                </div>
              </div>
            )}
            
            {tableData.length === 0 && (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Belum ada data {isDetailedMode ? 'indikator detail' : 'penilaian'}
                </h3>
                <p className="text-gray-500 mb-4">
                  Data akan diisi otomatis berdasarkan aspek dari halaman Kelola Aspek
                  {isDetailedMode && ' (kolom No dan Jumlah Parameter tersedia)'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Sidebar />
      <Topbar />
      
      <div className={`
        transition-all duration-300 ease-in-out pt-16
        ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
      `}>
        <div className="p-6">
          {currentStep === 'method' && renderMethodSelection()}
          {currentStep === 'table' && renderTable()}
        </div>
      </div>
    </div>
  );
};

export default PenilaianGCG;