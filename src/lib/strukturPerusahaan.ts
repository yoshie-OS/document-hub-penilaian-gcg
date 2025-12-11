// Utility functions untuk mengakses data struktur perusahaan berdasarkan tahun
// NOTE: These utilities now accept data as parameters instead of reading from localStorage
// Consumers should use StrukturPerusahaanContext to get data

export interface StrukturPerusahaanData {
  id: number;
  nama: string;
  tahun: number;
  createdAt: Date;
  isActive: boolean;
  kategori?: string;
}

/**
 * Filter direktorat data by year
 * @param data - Array of direktorat data from Context
 * @param year - Year to filter by
 * @returns Filtered and sorted array of direktorat names
 */
export const getDirektoratByYear = (data: StrukturPerusahaanData[], year: number): string[] => {
  try {
    if (!data || !Array.isArray(data)) return [];

    return Array.from(
      new Set(
        data
          .filter((d) => d.tahun === year && d.isActive)
          .map((d) => String(d.nama))
      )
    ).sort();
  } catch (error) {
    console.error('Error filtering direktorat data:', error);
    return [];
  }
};

/**
 * Filter subdirektorat data by year
 * @param data - Array of subdirektorat data from Context
 * @param year - Year to filter by
 * @returns Filtered and sorted array of subdirektorat names
 */
export const getSubDirektoratByYear = (data: StrukturPerusahaanData[], year: number): string[] => {
  try {
    if (!data || !Array.isArray(data)) return [];

    return Array.from(
      new Set(
        data
          .filter((d) => d.tahun === year && d.isActive)
          .map((d) => String(d.nama))
      )
    ).sort();
  } catch (error) {
    console.error('Error filtering subdirektorat data:', error);
    return [];
  }
};

/**
 * Filter divisi data by year
 * @param data - Array of divisi data from Context
 * @param year - Year to filter by
 * @returns Filtered and sorted array of divisi names
 */
export const getDivisiByYear = (data: StrukturPerusahaanData[], year: number): string[] => {
  try {
    if (!data || !Array.isArray(data)) return [];

    return Array.from(
      new Set(
        data
          .filter((d) => d.tahun === year && d.isActive)
          .map((d) => String(d.nama))
      )
    ).sort();
  } catch (error) {
    console.error('Error filtering divisi data:', error);
    return [];
  }
};

/**
 * Get all struktur perusahaan data filtered by year
 * @param direktorat - Direktorat data from Context
 * @param subdirektorat - Subdirektorat data from Context
 * @param divisi - Divisi data from Context
 * @param year - Year to filter by
 * @returns Object containing filtered direktorat, subdirektorat, and divisi data
 */
export const getStrukturPerusahaanByYear = (
  direktorat: StrukturPerusahaanData[],
  subdirektorat: StrukturPerusahaanData[],
  divisi: StrukturPerusahaanData[],
  year: number
) => {
  return {
    direktorat: getDirektoratByYear(direktorat, year),
    subdirektorat: getSubDirektoratByYear(subdirektorat, year),
    divisi: getDivisiByYear(divisi, year)
  };
};

/**
 * Get latest year from provided data
 * @param data - Array of struktur perusahaan data
 * @returns Latest year or null if no data
 */
export const getLatestYearFromData = (data: StrukturPerusahaanData[]): number | null => {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const allYears = data.map(item => item.tahun);
    return Math.max(...allYears);
  } catch (error) {
    console.error('Error getting latest year:', error);
    return null;
  }
};

/**
 * Get all available years from provided data
 * @param data - Array of struktur perusahaan data
 * @returns Sorted array of years (descending)
 */
export const getAvailableYearsFromData = (data: StrukturPerusahaanData[]): number[] => {
  try {
    if (!data || !Array.isArray(data)) return [];

    const allYears = data.map(item => item.tahun);
    return Array.from(new Set(allYears)).sort((a, b) => b - a);
  } catch (error) {
    console.error('Error getting available years:', error);
    return [];
  }
};

/**
 * Trigger update event for struktur perusahaan changes
 * This will notify all components listening for struktur perusahaan updates
 */
export const triggerStrukturPerusahaanUpdate = () => {
  window.dispatchEvent(new CustomEvent('strukturPerusahaanUpdate', {
    detail: { type: 'strukturPerusahaanUpdate', timestamp: Date.now() }
  }));
};
