import { GCGData, ProcessedGCGData, SectionData } from '@/types/gcg';

const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

const generateAspekColors = (count: number): string[] => {
  const existingColors = [
    '#cab89aff', // coklat
    '#fcbe62ff', // kuning
    '#B4EBE6',   // biru muda
    '#ACE1AF',   // hijau muda
    '#88AB8E',   // hijau
    '#c5d8d2ff', // abu muda
  '#ffefaeff',   // aspek 7: kuning soft tapi lebih tegas
  '#cba4f7',   // aspek 8: ungu soft tapi lebih tegas
  '#ffb3b3',   // aspek 9: merah soft tapi lebih tegas
  ];

  // Hue dari warna utama dan warna custom di atas
  const mainHues = [180, 120, 90, 50, 270, 0]; // hijau, biru, kuning, ungu, merah
  const hueTolerance = 25;

  if (count <= existingColors.length) {
    return existingColors.slice(0, count);
  }

  const colors = [...existingColors];
  let generated = 0;
  let hue = 0;
  while (generated < count - existingColors.length) {
    // Pastikan hue baru tidak mirip dengan mainHues
    const isSimilar = mainHues.some(mainHue => {
      const diff = Math.abs(hue - mainHue);
      return diff < hueTolerance || Math.abs(diff - 360) < hueTolerance;
    });
    if (!isSimilar) {
      colors.push(`hsl(${hue}, 70%, 80%)`);
      generated++;
    }
    hue += 30;
    if (hue >= 360) hue = hue - 360;
  }
  return colors;
};

export const processGCGData = (data: GCGData[]): ProcessedGCGData[] => {
  // Group data by year
  const yearGroups = data.reduce((acc, row) => {
    if (!acc[row.Tahun]) {
      acc[row.Tahun] = [];
    }
    acc[row.Tahun].push(row);
    return acc;
  }, {} as Record<number, GCGData[]>);

  const processedData: ProcessedGCGData[] = [];

  Object.entries(yearGroups).forEach(([year, rows]) => {
    const yearNum = parseInt(year);
    
    // Find total score (Level 4)
    const level4Row = rows.find(row => row.Level === 4);
    if (!level4Row) return;
    
    const totalScore = level4Row.Skor;
  const penilai = level4Row.Penilai;
  const penjelasan = level4Row.Penjelasan;
  const jenisPenilaian = level4Row.Jenis_Penilaian;
    
    // Check if has Level 2 data
    const hasLevel2Data = rows.some(row => row.Level === 2);
    
    // Find Level 3 rows for sections
    const level3Rows = rows.filter(row => row.Level === 3);
    if (level3Rows.length === 0) return;
    
    // Get unique sections (excluding empty values) - reversed order for proper display
    const uniqueSections = [...new Set(
      level3Rows
        .map(row => row.Section)
        .filter(section => section && section.trim() !== '')
    )].sort((a, b) => romanNumerals.indexOf(a) - romanNumerals.indexOf(b));
    
    const aspekColors = generateAspekColors(uniqueSections.length);
    
    const totalCapaian = level3Rows.reduce((sum, row) => sum + Math.abs(row.Capaian), 0);
    const baseHeight = 0.07 * totalScore; // 5% of total score
    const remainingHeight = totalScore - (baseHeight * uniqueSections.length);
    
    const sections: SectionData[] = uniqueSections.map((sectionName, index) => {
      const sectionRow = level3Rows.find(row => row.Section === sectionName);
      const capaian = sectionRow ? sectionRow.Capaian : 0;
      const absCapaian = Math.abs(capaian);
      
      const additionalHeight = totalCapaian > 0 ? (absCapaian / totalCapaian) * remainingHeight : 0;
      const height = baseHeight + additionalHeight;
      
      // Get bobot, skor, and jumlah_parameter from level 3 data
      const bobot = sectionRow?.Bobot;
      const skor = sectionRow?.Skor;
      const jumlah_parameter = sectionRow?.Jumlah_Parameter;
      
      return {
        name: sectionName,
        romanNumeral: sectionName,
        capaian,
        height,
        color: aspekColors[index % aspekColors.length],
        bobot,
        skor,
        jumlah_parameter
      };
    });
    
    processedData.push({
      year: yearNum,
      totalScore,
      sections,
      hasLevel2Data,
      penilai,
      penjelasan,
      jenisPenilaian
    });
  });
  
  return processedData.sort((a, b) => a.year - b.year);
};

// Legacy support - Interface for table-based processing
interface PenilaianRow {
  id: string;
  no?: string;
  aspek: string;
  deskripsi: string;
  jumlah_parameter?: number;
  bobot: number;
  skor: number;
  capaian: number;
  penjelasan: string;
}

// Function to convert from dashboard data API to GCGChart format
export const processGCGDataFromAPI = (apiData: any): ProcessedGCGData[] => {
  if (!apiData?.years_data) return [];
  
  const processedData: ProcessedGCGData[] = [];
  
  Object.entries(apiData.years_data).forEach(([yearStr, yearData]: [string, any]) => {
    const year = parseInt(yearStr);
    
    if (!yearData?.data || !Array.isArray(yearData.data)) return;
    
    // Find total score from the data
    const totalRowData = yearData.data.find((row: any) => row.type === 'total');
    const totalScore = totalRowData?.skor || 0;
    
    // Find penilai and general info
    const penilai = yearData.auditor || 'Unknown';
    const penjelasan = yearData.penjelasan || '';
    
    // Process sections (aspects I-VI)
    const aspectRows = yearData.data.filter((row: any) => row.type === 'subtotal');
    const sections: SectionData[] = [];
    
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
    const aspekColors = [
      '#cab89aff', // I
      '#fcbe62ff', // II  
      '#B4EBE6',   // III
      '#ACE1AF',   // IV
      '#88AB8E',   // V
      '#c5d8d2ff', // VI
    ];
    
    romanNumerals.forEach((roman, index) => {
      const aspectRow = aspectRows.find((row: any) => row.section === roman);
      
      if (aspectRow) {
        const capaian = aspectRow.capaian || 0;
        
        sections.push({
          name: `Aspek ${roman}`,
          romanNumeral: roman,
          capaian: capaian,
          height: Math.max(capaian, 0.1), // Ensure minimum height for visibility
          color: aspekColors[index],
          bobot: aspectRow.bobot || 0,
          skor: aspectRow.skor || 0,
          jumlah_parameter: aspectRow.jumlah_parameter || 0,
          penjelasan: aspectRow.penjelasan || ''
        });
      }
    });
    
    processedData.push({
      year,
      totalScore,
      sections,
      hasLevel2Data: true, // Assume we have detailed data
      penilai,
      penjelasan
    });
  });
  
  return processedData.sort((a, b) => a.year - b.year);
};

// Function to convert from table data to GCGChart format
export const processGCGDataFromTable = (
  tableData: PenilaianRow[], 
  selectedYear: number, 
  auditor: string,
  jenisAsesmen: string
): ProcessedGCGData[] => {
  if (!tableData || tableData.length === 0) return [];
  
  // Group data by aspek (I-VI)
  const aspectGroups: Record<string, PenilaianRow[]> = {};
  tableData.forEach(row => {
    if (row.aspek && ['I', 'II', 'III', 'IV', 'V', 'VI'].includes(row.aspek)) {
      if (!aspectGroups[row.aspek]) {
        aspectGroups[row.aspek] = [];
      }
      aspectGroups[row.aspek].push(row);
    }
  });
  
  const sections: SectionData[] = [];
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const aspekColors = [
    '#cab89aff', // I
    '#fcbe62ff', // II  
    '#B4EBE6',   // III
    '#ACE1AF',   // IV
    '#88AB8E',   // V
    '#c5d8d2ff', // VI
  ];
  
  let totalScore = 0;
  
  romanNumerals.forEach((roman, index) => {
    const aspectRows = aspectGroups[roman] || [];
    
    if (aspectRows.length > 0) {
      // Calculate totals for this aspect
      const totalBobot = aspectRows.reduce((sum, row) => sum + (row.bobot || 0), 0);
      const totalSkor = aspectRows.reduce((sum, row) => sum + (row.skor || 0), 0);
      const capaian = totalBobot > 0 ? (totalSkor / totalBobot) * 100 : 0;
      
      // Get penjelasan - use the most common or first one
      const penjelasan = aspectRows[0]?.penjelasan || '';
      
      sections.push({
        name: `Aspek ${roman}`,
        romanNumeral: roman,
        capaian: capaian,
        height: Math.max(capaian, 0.1), // Ensure minimum height for visibility
        color: aspekColors[index],
        bobot: totalBobot,
        skor: totalSkor,
        jumlah_parameter: aspectRows.reduce((sum, row) => sum + (row.jumlah_parameter || 0), 0),
        penjelasan: penjelasan
      });
      
      totalScore += totalSkor;
    } else {
      // Create empty section for missing aspects
      sections.push({
        name: `Aspek ${roman}`,
        romanNumeral: roman,
        capaian: 0,
        height: 0.1,
        color: aspekColors[index],
        bobot: 0,
        skor: 0,
        jumlah_parameter: 0,
        penjelasan: '-'
      });
    }
  });
  
  return [{
    year: selectedYear,
    totalScore,
    sections,
    hasLevel2Data: true,
    penilai: auditor,
    penjelasan: jenisAsesmen
  }];
};