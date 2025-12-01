export interface GCGData {
  Tahun: number;
  Skor: number;
  Level: number;
  Section: string;
  Capaian: number;
  Bobot?: number;
  Jumlah_Parameter?: number;
  Penjelasan?: string;
  Penilai?: string;
  No?: string | number;
  Deskripsi?: string;
  Jenis_Penilaian?: string;
}

export interface ProcessedGCGData {
  year: number;
  totalScore: number;
  sections: SectionData[];
  hasLevel2Data: boolean;
  penilai?: string;
  penjelasan?: string;
  jenisPenilaian?: string;
}

export interface SectionData {
  name: string;
  romanNumeral: string;
  capaian: number;
  height: number;
  color: string;
  bobot?: number;
  skor?: number;
  jumlah_parameter?: number;
  penjelasan?: string;
}

export interface ChartData {
  year: number;
  totalScore: number;
  sections: SectionData[];
}