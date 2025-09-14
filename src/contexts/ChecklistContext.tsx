import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface ChecklistGCG {
  id: number;
  aspek: string;
  deskripsi: string;
  pic?: string;
  tahun?: number;
  rowNumber?: number; // Stable row number for file storage
}

export interface Aspek {
  id: number;
  nama: string;
  tahun: number;
}

interface ChecklistContextType {
  checklist: ChecklistGCG[];
  aspects: Aspek[];
  getChecklistByYear: (year: number) => ChecklistGCG[];
  getAspectsByYear: (year: number) => Promise<Aspek[]>;
  addChecklist: (aspek: string, deskripsi: string, pic: string, year: number) => Promise<void>;
  editChecklist: (id: number, aspek: string, deskripsi: string, pic: string, year: number) => Promise<void>;
  deleteChecklist: (id: number, year: number) => Promise<void>;
  addAspek: (nama: string, year: number) => Promise<void>;
  editAspek: (id: number, newNama: string, year: number) => void;
  deleteAspek: (id: number, year: number) => Promise<void>;
  initializeYearData: (year: number) => void;
  ensureAllYearsHaveData: () => void;
  ensureAspectsForAllYears: () => void;
  useDefaultChecklistData: (year: number) => Promise<void>;
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export const ChecklistProvider = ({ children }: { children: ReactNode }) => {
  const [checklist, setChecklist] = useState<ChecklistGCG[]>([]);
  const [aspects, setAspects] = useState<Aspek[]>([]);

  // Load data from Supabase first, fallback to localStorage
  useEffect(() => {
    console.log('ChecklistContext: useEffect triggered - starting data load');
    
    // Load fresh data from Supabase while preserving user authentication
    
    const loadDataFromSupabase = async () => {
      try {
        console.log('ChecklistContext: loadDataFromSupabase function called');
        // Load aspects from Supabase
        const aspectsResponse = await fetch('http://localhost:5000/api/config/aspects');
        if (aspectsResponse.ok) {
          const aspectsData = await aspectsResponse.json();
          if (aspectsData.aspects && Array.isArray(aspectsData.aspects)) {
            const mappedAspects = aspectsData.aspects.map((item: any) => ({
              id: item.id || Date.now() + Math.random(),
              nama: item.nama,
              tahun: item.tahun
            }));
            setAspects(mappedAspects);
            // REMOVED localStorage.setItem for multi-user support
            console.log('ChecklistContext: Loaded aspects from Supabase', mappedAspects.length);
          }
        } else {
          console.error('ChecklistContext: Failed to load aspects from Supabase');
          // DISABLED: loadAspectsFromLocalStorage(); // Force fresh start
          setAspects([]);
        }

        // Load checklist from Supabase API
        console.log('ChecklistContext: Fetching checklist from API...');
        const checklistResponse = await fetch('http://localhost:5000/api/config/checklist');
        if (checklistResponse.ok) {
          const checklistData = await checklistResponse.json();
          console.log('ChecklistContext: Raw API response:', checklistData.checklist?.length || 0, 'items');
          if (checklistData.checklist && Array.isArray(checklistData.checklist)) {
            const mappedChecklist = checklistData.checklist
              .filter((item: any) => {
                // Filter out corrupted data where deskripsi is null/invalid
                if (!item.deskripsi && item.aspek && item.aspek.includes('deskripsi')) {
                  // This is corrupted data - try to extract from the aspek field
                  try {
                    const parsedData = JSON.parse(item.aspek.replace(/'/g, '"'));
                    const isValid = parsedData.deskripsi && parsedData.tahun;
                    console.log('ChecklistContext: Corrupted item recovery - valid:', isValid, 'desc:', parsedData.deskripsi?.substring(0, 30));
                    return isValid;
                  } catch (e) {
                    console.error('ChecklistContext: Failed to parse corrupted item:', e);
                    return false;
                  }
                }
                const isValidNormal = item.deskripsi && item.tahun;
                console.log('ChecklistContext: Normal item - valid:', isValidNormal, 'desc:', item.deskripsi?.substring(0, 30));
                return isValidNormal;
              })
              .map((item: any) => {
                // Handle corrupted data by extracting from aspek field
                if (!item.deskripsi && item.aspek && item.aspek.includes('deskripsi')) {
                  try {
                    const parsedData = JSON.parse(item.aspek.replace(/'/g, '"'));
                    console.log('ChecklistContext: Recovering corrupted data:', parsedData.deskripsi.substring(0, 50));
                    return {
                      id: item.id,
                      aspek: parsedData.aspek || '',
                      deskripsi: parsedData.deskripsi || '',
                      pic: parsedData.pic || '',
                      tahun: parsedData.tahun,
                      rowNumber: item.rowNumber
                    };
                  } catch (e) {
                    console.error('ChecklistContext: Failed to recover corrupted data:', e);
                    return null;
                  }
                }
                // Normal data mapping
                return {
                  id: item.id,
                  aspek: item.aspek || '',
                  deskripsi: item.deskripsi || '',
                  pic: item.pic || '',
                  tahun: item.tahun,
                  rowNumber: item.rowNumber
                };
              })
              .filter(Boolean); // Remove null items
            
            setChecklist(mappedChecklist);
            // Save fresh data to localStorage for next load
            // REMOVED localStorage.setItem for multi-user support - data stays in Supabase only
            console.log('ChecklistContext: Loaded checklist from Supabase', mappedChecklist.length);
          }
        } else {
          console.error('ChecklistContext: Failed to load checklist from Supabase');
          setChecklist([]); // Start with empty instead of localStorage
        }

      } catch (error) {
        console.error('ChecklistContext: Error loading from Supabase', error);
        // Set empty data instead of localStorage fallback for multi-user support
        setChecklist([]);
        setAspects([]);
      }
    };

    const loadFromLocalStorage = () => {
      const data = localStorage.getItem("checklistGCG");
      const aspectsData = localStorage.getItem("aspects");
      
      if (data && aspectsData) {
        try {
          const parsedData = JSON.parse(data);
          const parsedAspects = JSON.parse(aspectsData);
          
          // Pastikan data valid
          if (Array.isArray(parsedData) && Array.isArray(parsedAspects)) {
            // Check for old timestamp-based IDs and clear if found
            const hasOldTimestampIds = parsedData.some(item => 
              item.id && item.id > 1000000000 // Timestamp IDs are much larger than year+row format
            );
            
            if (hasOldTimestampIds) {
              console.warn('ChecklistContext: Found old timestamp-based IDs in localStorage, clearing cache');
              localStorage.removeItem("checklistGCG");
              localStorage.removeItem("aspects");
              // Fallback to Supabase load
              loadDataFromSupabase();
              return;
            }
            
            setChecklist(parsedData);
            setAspects(parsedAspects);
            console.log('ChecklistContext: Initialized from localStorage', { checklist: parsedData.length, aspects: parsedAspects.length });
            
            // Clean up any duplicate aspects
            setTimeout(() => cleanupDuplicateAspects(), 100);
          }
        } catch (error) {
          console.error('ChecklistContext: Error parsing localStorage data', error);
          // Fallback to default data
          initializeDefaultData();
        }
      } else {
        // Initialize with default data
        initializeDefaultData();
      }
    };

    const loadAspectsFromLocalStorage = () => {
      const aspectsData = localStorage.getItem("aspects");
      if (aspectsData) {
        try {
          const parsedAspects = JSON.parse(aspectsData);
          if (Array.isArray(parsedAspects)) {
            setAspects(parsedAspects);
            console.log('ChecklistContext: Loaded aspects from localStorage fallback');
          }
        } catch (error) {
          console.error('ChecklistContext: Error parsing aspects from localStorage', error);
        }
      }
    };

    const loadChecklistFromLocalStorage = () => {
      const data = localStorage.getItem("checklistGCG");
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          if (Array.isArray(parsedData)) {
            // Check for old timestamp-based IDs and clear if found
            const hasOldTimestampIds = parsedData.some(item => 
              item.id && item.id > 1000000000 // Timestamp IDs are much larger than year+row format
            );
            
            if (hasOldTimestampIds) {
              console.warn('ChecklistContext: Found old timestamp-based IDs, clearing cache and reloading from backend');
              localStorage.removeItem("checklistGCG");
              localStorage.removeItem("aspects");
              loadDataFromSupabase();
              return;
            }
            
            setChecklist(parsedData);
            console.log('ChecklistContext: Loaded checklist from localStorage');
          }
        } catch (error) {
          console.error('ChecklistContext: Error parsing checklist from localStorage', error);
        }
      }
    };

    loadDataFromSupabase();
  }, []);

    // Helper function untuk initialize default data - FRESH START
  const initializeDefaultData = () => {
    // Start with completely empty data
    const defaultData: ChecklistGCG[] = [];
    const defaultAspects: Aspek[] = [];
    
    // Initialize with empty data - will be loaded from Supabase
    setChecklist(defaultData);
    setAspects(defaultAspects);
    console.log('ChecklistContext: Initialized with FRESH START - no default data');
  };

  // Listen for updates from PengaturanBaru
  useEffect(() => {
    const handleChecklistUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'checklistUpdated') {
        const updatedData = event.detail.data;
        console.log('ChecklistContext: Received checklistUpdated event', updatedData);
        
        // Pastikan data valid sebelum update
        if (Array.isArray(updatedData) && updatedData.length > 0) {
          setChecklist(updatedData);
          // Data updated from Supabase
          console.log('ChecklistContext: Data updated from PengaturanBaru', updatedData);
        }
      }
    };

    const handleAspectsUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'aspectsUpdated') {
        const updatedAspects = event.detail.data;
        setAspects(updatedAspects);
        console.log('ChecklistContext: Aspects updated from PengaturanBaru', updatedAspects);
      }
    };

    // Listen for year data cleanup events
    const handleYearDataCleaned = (event: CustomEvent) => {
      if (event.detail?.type === 'yearRemoved') {
        const removedYear = event.detail.year;
        console.log(`ChecklistContext: Year ${removedYear} data cleaned up, refreshing local state`);
        
        // Refresh data from localStorage to ensure consistency
        const storedChecklist = localStorage.getItem('checklistGCG');
        if (storedChecklist) {
          try {
            const parsed = JSON.parse(storedChecklist);
            setChecklist(parsed);
          } catch (error) {
            console.error('ChecklistContext: Error refreshing checklist after year cleanup', error);
          }
        }
        
        const storedAspects = localStorage.getItem('aspects');
        if (storedAspects) {
          try {
            const parsed = JSON.parse(storedAspects);
            setAspects(parsed);
          } catch (error) {
            console.error('ChecklistContext: Error refreshing aspects after year cleanup', error);
          }
        }
      }
    };

    window.addEventListener('checklistUpdated', handleChecklistUpdate as EventListener);
    window.addEventListener('aspectsUpdated', handleAspectsUpdate as EventListener);
    window.addEventListener('yearDataCleaned', handleYearDataCleaned as EventListener);
    
    return () => {
      window.removeEventListener('checklistUpdated', handleChecklistUpdate as EventListener);
      window.removeEventListener('aspectsUpdated', handleAspectsUpdate as EventListener);
      window.removeEventListener('yearDataCleaned', handleYearDataCleaned as EventListener);
    };
  }, []);

  // Effect untuk memantau perubahan di localStorage dan sync dengan state
  useEffect(() => {
    const handleStorageChange = () => {
      const storedData = localStorage.getItem("checklistGCG");
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (Array.isArray(parsedData) && JSON.stringify(parsedData) !== JSON.stringify(checklist)) {
            console.log('ChecklistContext: localStorage changed, updating state', {
              stored: parsedData.length,
              current: checklist.length
            });
            setChecklist(parsedData);
          }
        } catch (error) {
          console.error('ChecklistContext: Error parsing localStorage change', error);
        }
      }
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    
    // Also check localStorage periodically for changes
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [checklist]);

  const getChecklistByYear = (year: number): ChecklistGCG[] => {
    // Use data from state (loaded from Supabase) instead of localStorage
    console.log('ChecklistContext: getChecklistByYear called', {
      year,
      totalItems: checklist.length,
      itemsForYear: checklist.filter(item => item.tahun === year).length
    });
    return checklist.filter(item => item.tahun === year);
  };

  const getAspectsByYear = useCallback(async (year: number): Promise<Aspek[]> => {
    // Return empty array if year is invalid
    if (!year || year === null || year === undefined || isNaN(year)) {
      console.warn('getAspectsByYear called with invalid year:', year);
      return [];
    }
    
    try {
      // Fetch aspects from Supabase API
      const response = await fetch(`http://localhost:5000/api/config/aspects?year=${year}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.aspects || [];
    } catch (error) {
      console.error('Error fetching aspects from API:', error);
      // Fallback to localStorage for offline functionality
      const storedData = localStorage.getItem("aspects");
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (Array.isArray(parsedData)) {
            return parsedData.filter(aspek => aspek.tahun === year);
          }
        } catch (parseError) {
          console.error('Error parsing stored data:', parseError);
        }
      }
      return [];
    }
  }, []); // Fixed: Empty dependency array prevents infinite re-creation

  const initializeYearData = (year: number) => {
    const existingData = checklist.filter(item => item.tahun === year);
    const existingAspects = aspects.filter(aspek => aspek.tahun === year);
    
    if (existingData.length === 0) {
      // Initialize with empty data for the new year - FRESH START
      console.log(`ChecklistContext: Year ${year} initialized with empty data`);
      // No default data - user must add manually
    }
    
    if (existingAspects.length === 0) {
      // Initialize aspects for the new year - FRESH START
      console.log(`ChecklistContext: Year ${year} aspects initialized with empty data`);
      // No default aspects - user must add manually
    }
  };

  const addChecklist = async (aspek: string, deskripsi: string, pic: string, year: number) => {
    try {
      // Save to Supabase API
      const response = await fetch('http://localhost:5000/api/config/checklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aspek: aspek,
          deskripsi: deskripsi,
          pic: pic,
          tahun: year
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('ChecklistContext: Successfully saved checklist to Supabase');
    } catch (error) {
      console.error('ChecklistContext: Failed to save checklist to Supabase:', error);
    }

    // Calculate next stable row number for this year
    const yearItems = checklist.filter(item => item.tahun === year);
    const maxRowNumber = yearItems.reduce((max, item) => 
      Math.max(max, item.rowNumber || 0), 0
    );
    const nextRowNumber = maxRowNumber + 1;
    
    const newChecklist = { 
      id: Date.now(), 
      aspek, 
      deskripsi, 
      tahun: year,
      rowNumber: nextRowNumber 
    };
    const updated = [...checklist, newChecklist];
    setChecklist(updated);
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('checklistUpdated', {
      detail: { type: 'checklistUpdated', data: updated }
    }));
  };

  const editChecklist = async (id: number, aspek: string, deskripsi: string, pic: string, year: number) => {
    try {
      // Update in Supabase API
      const response = await fetch(`http://localhost:5000/api/config/checklist/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aspek: aspek,
          deskripsi: deskripsi,
          pic: pic,
          tahun: year
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('ChecklistContext: Successfully updated checklist in Supabase');
    } catch (error) {
      console.error('ChecklistContext: Failed to update checklist in Supabase:', error);
    }

    const updated = checklist.map((c) => (c.id === id ? { ...c, aspek, deskripsi, pic, tahun: year } : c));
    setChecklist(updated);
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('checklistUpdated', {
      detail: { type: 'checklistUpdated', data: updated }
    }));
  };

  const deleteChecklist = async (id: number, year: number) => {
    try {
      // Delete from Supabase API
      const response = await fetch(`http://localhost:5000/api/config/checklist/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('ChecklistContext: Successfully deleted checklist from Supabase');
    } catch (error) {
      console.error('ChecklistContext: Failed to delete checklist from Supabase:', error);
    }

    const updated = checklist.filter((c) => c.id !== id);
    setChecklist(updated);
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('checklistUpdated', {
      detail: { type: 'checklistUpdated', data: updated }
    }));
  };

  const addAspek = async (nama: string, year: number) => {
    // Validate year parameter
    if (!year || year === null || year === undefined || isNaN(year)) {
      console.warn('addAspek called with invalid year:', year);
      throw new Error('Invalid year provided');
    }
    
    try {
      // Add aspect via API
      const response = await fetch('http://localhost:5000/api/config/aspects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama: nama,
          tahun: year
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Trigger update event
        window.dispatchEvent(new CustomEvent('aspectsUpdated', {
          detail: { type: 'aspectsUpdated', data: result.aspect }
        }));
      } else {
        throw new Error(result.error || 'Failed to add aspect');
      }
    } catch (error) {
      console.error('Error adding aspect via API:', error);
      // Fallback to localStorage
      const newAspek = { 
        id: Date.now(), 
        nama, 
        tahun: year 
      };
      const updated = [...aspects, newAspek];
      setAspects(updated);
      // REMOVED localStorage.setItem for multi-user support
      
      // Trigger update event
      window.dispatchEvent(new CustomEvent('aspectsUpdated', {
        detail: { type: 'aspectsUpdated', data: updated }
      }));
      
      throw error; // Re-throw so UI can handle the error
    }
  };

  const editAspek = (id: number, newNama: string, year: number) => {
    const updated = aspects.map((a) => 
      a.id === id ? { ...a, nama: newNama } : a
    );
    setAspects(updated);
    // REMOVED localStorage.setItem for multi-user support
    
    // Update checklist items that use this aspect
    const updatedChecklist = checklist.map(item => 
      item.aspek === aspects.find(a => a.id === id)?.nama && item.tahun === year
        ? { ...item, aspek: newNama }
        : item
    );
    setChecklist(updatedChecklist);
    // REMOVED localStorage.setItem for multi-user support
    
    // Trigger update events
    window.dispatchEvent(new CustomEvent('aspectsUpdated', {
      detail: { type: 'aspectsUpdated', data: updated }
    }));
    window.dispatchEvent(new CustomEvent('checklistUpdated', {
      detail: { type: 'checklistUpdated', data: updatedChecklist }
    }));
  };

  const deleteAspek = async (id: number, year: number) => {
    const aspekToDelete = aspects.find(a => a.id === id);
    if (!aspekToDelete) return;
    
    try {
      // Delete from Supabase API
      const response = await fetch(`http://localhost:5000/api/config/aspects/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('ChecklistContext: Successfully deleted aspect from Supabase');
    } catch (error) {
      console.error('ChecklistContext: Failed to delete aspect from Supabase:', error);
    }
    
    // Remove aspect from aspects list
    const updatedAspects = aspects.filter(a => a.id !== id);
    setAspects(updatedAspects);
    localStorage.setItem("aspects", JSON.stringify(updatedAspects));
    
    // IMPORTANT: Don't delete checklist items, just remove the aspect reference
    // This ensures checklist items remain but without the deleted aspect
    const updatedChecklist = checklist.map(item => 
      item.aspek === aspekToDelete.nama && item.tahun === year
        ? { ...item, aspek: '' } // Set to empty string instead of deleting
        : item
    );
    setChecklist(updatedChecklist);
    // REMOVED localStorage.setItem for multi-user support
    
    // Trigger update events
    window.dispatchEvent(new CustomEvent('aspectsUpdated', {
      detail: { type: 'aspectsUpdated', data: updatedAspects }
    }));
    window.dispatchEvent(new CustomEvent('checklistUpdated', {
      detail: { type: 'checklistUpdated', data: updatedChecklist }
    }));
  };

  const ensureAllYearsHaveData = useCallback(() => {
    // Implementation for ensuring all years have data
    const years = [2024, 2025]; // Get from YearContext if available
    years.forEach(year => {
      initializeYearData(year);
    });
  }, []);

  // Function to make aspects available for all years (DISABLED to prevent duplication)
  const ensureAspectsForAllYears = useCallback(() => {
    // DISABLED: This function was causing aspect duplication
    // The generatePredeterminedRows function now gets ALL aspects regardless of year
    console.log('ChecklistContext: ensureAspectsForAllYears disabled to prevent duplication');
    return;
  }, [aspects]);

  // Cleanup function to remove duplicate aspects
  const cleanupDuplicateAspects = useCallback(() => {
    const allAspects = JSON.parse(localStorage.getItem('aspects') || '[]');
    if (allAspects.length === 0) return;

    // Remove duplicates based on nama (aspect name)
    const uniqueAspects: Aspek[] = [];
    const seenNames = new Set<string>();

    allAspects.forEach((aspect: Aspek) => {
      if (!seenNames.has(aspect.nama)) {
        seenNames.add(aspect.nama);
        uniqueAspects.push(aspect);
      }
    });

    if (uniqueAspects.length !== allAspects.length) {
      console.log(`ChecklistContext: Removing ${allAspects.length - uniqueAspects.length} duplicate aspects`);
      console.log(`ChecklistContext: Cleaned up from ${allAspects.length} to ${uniqueAspects.length} aspects`);
      
      setAspects(uniqueAspects);
      // REMOVED localStorage.setItem for multi-user support
    }
  }, []);

  // Function to load default checklist data (same pattern as StrukturPerusahaanContext)
  const useDefaultChecklistData = async (year: number) => {
    try {
      console.log(`ChecklistContext: Loading default checklist data for year ${year}`);
      
      // Import DEFAULT_CHECKLIST_ITEMS from the component
      const DEFAULT_CHECKLIST_ITEMS = [
        "Pedoman Tata Kelola Perusahaan yang Baik/CoCG",
        "Pedoman Perilaku/CoC",
        "Penetapan Direksi sbg Penanggungjawab GCG dan SK Penunjukan Tim Komite Pemantau GCG (Bila ada)",
        "Board Manual",
        "Pedoman Pengendalian Gratifikasi",
        "Pedoman WBS",
        "Peraturan Disiplin Pegawai",
        "PKB Terupdate",
        "Dokumentasi Sosialisasi CoCG, CoC dan panduan pelaksanaan CoC kepada Organ perusahaan",
        "Pernyataan Kepatuhan kepada CoC Tahun 2022 dan sebelumnya",
        "Program penguatan kepemimpinan, kompetensi, dan etika kepemimpinan",
        "Uraian Jabatan/Job Description (JD) Dewan Komisaris dan Direksi",
        "Pakta Integritas / Letter of Undertaking (LoU) Direksi dan Dewan Komisaris (periode 2023 dan 2024)",
        "Pakta Integritas / Letter of Undertaking (LoU) Komite yang berada di bawah Dewan Komisaris Tahun 2023 dan 2024",
        "Pakta Integritas / Letter of Undertaking (LoU) Seluruh Karyawan Tahun 2023 dan 2024",
        "Laporan Penerapan GCG",
        "Surat Pernyataan Tanggung Jawab atas Laporan Pelaksanaan GCG",
        "Struktur organisasi Dewan Komisaris",
        "Piagam (Board Charter) Dewan Komisaris",
        "Surat Keputusan Anggota Dewan Komisaris",
        "Laporan Pelaksanaan Tugas Dewan Komisaris",
        "Jadwal dan Risalah Rapat Dewan Komisaris dan Rapat Gabungan dengan Direksi Tahun 2023 dan 2024",
        "Form Laporan Keberadaan Dewan Komisaris Tahun 2023 dan 2024",
        "Struktur organisasi Direksi",
        "Piagam (Board Charter) Direksi",
        "Surat Keputusan Anggota Direksi",
        "Laporan Pelaksanaan Tugas Direksi",
        "Jadwal dan Risalah Rapat Direksi Tahun 2023 dan 2024",
        "Laporan Keberadaan Direksi Tahun 2023 dan 2024",
        "Piagam Komite Audit",
        "Struktur organisasi Komite Audit",
        "SK Komite Audit",
        "Laporan Pelaksanaan Tugas Komite Audit",
        "Jadwal dan Risalah Rapat Komite Audit Tahun 2023 dan 2024",
        "Piagam Komite Nominasi dan Remunerasi",
        "Struktur organisasi Komite Nominasi dan Remunerasi",
        "SK Komite Nominasi dan Remunerasi",
        "Laporan Pelaksanaan Tugas Komite Nominasi dan Remunerasi",
        "Jadwal dan Risalah Rapat Komite Nominasi dan Remunerasi Tahun 2023 dan 2024",
        "Piagam Komite Lain (Bila ada)",
        "Struktur Organisasi Komite Lain (Bila ada)",
        "SK Komite Lain (Bila ada)",
        "Laporan Pelaksanaan Tugas Komite Lain (Bila ada)",
        "Jadwal dan Risalah Rapat Komite Lain (Bila ada) Tahun 2023 dan 2024",
        "Profil Anggota Dewan Komisaris, Direksi, dan Komite",
        "Kompetensi Dewan Komisaris, Direksi, dan Komite",
        "Laporan Indeks Kepuasan Pemangku Kepentingan",
        "Program pelatihan dan peningkatan kompetensi untuk Dewan Komisaris, Direksi, dan Komite yang berada di bawah Dewan Komisaris",
        "Laporan Keterbatasan Akses Dewan Komisaris dan Komite terhadap Informasi (jika ada)",
        "Piagam Satuan Pengawasan Intern (SPI)",
        "Struktur Organisasi SPI",
        "SK Ketua dan Anggota SPI",
        "Uraian tugas dan tanggung jawab SPI",
        "Laporan Pelaksanaan Tugas SPI",
        "Jadwal dan Risalah Rapat SPI Tahun 2023 dan 2024",
        "Rencana Kerja dan Anggaran (RKA) SPI",
        "Dokumen hasil audit internal dan eksternal",
        "Bukti tindak lanjut hasil audit internal dan eksternal",
        "Piagam Sekretaris Perusahaan",
        "SK Sekretaris Perusahaan",
        "Uraian tugas dan tanggung jawab Sekretaris Perusahaan",
        "Program kerja Sekretaris Perusahaan Tahun 2023 dan 2024",
        "Laporan pelaksanaan tugas Sekretaris Perusahaan",
        "Kebijakan Manajemen Risiko",
        "Daftar profil risiko tahun 2024",
        "Pedoman Manajemen Risiko",
        "Laporan penerapan manajemen risiko secara berkelanjutan",
        "Pedoman Sistem Pengendalian Internal",
        "Piagam Audit Internal",
        "Kebijakan dan prosedur tentang Anti Fraud",
        "Kebijakan mengenai whistleblowing system (WBS)",
        "Laporan penanganan WBS",
        "Pedoman pengelolaan benturan kepentingan",
        "Pedoman Pengendalian Gratifikasi",
        "Laporan pengendalian gratifikasi",
        "Kebijakan dan prosedur transaksi yang mengandung benturan kepentingan",
        "Kebijakan dan prosedur terkait transaksi dengan pihak berelasi",
        "Laporan transaksi dengan pihak berelasi",
        "Kebijakan Manajemen Komplain",
        "Laporan pengelolaan komplain",
        "Kebijakan Perlindungan Konsumen",
        "Laporan perlindungan konsumen",
        "Kebijakan Manajemen Keberlanjutan",
        "Laporan Keberlanjutan",
        "Program dan Pelaksanaan CSR",
        "Laporan Pelaksanaan CSR",
        "Pedoman Penyelenggaraan Rapat Dewan Komisaris",
        "Pedoman Penyelenggaraan Rapat Direksi",
        "Piagam Komite-Komite di bawah Dewan Komisaris",
        "Daftar anggota Komite-Komite di bawah Dewan Komisaris",
        "Laporan pelaksanaan tugas Komite-Komite di bawah Dewan Komisaris",
        "Laporan Rapat Gabungan Dewan Komisaris dan Direksi",
        "Laporan Keberadaan Dewan Komisaris, Direksi, dan Komite di bawah Dewan Komisaris",
        "Kebijakan Perekrutan dan Seleksi Dewan Komisaris",
        "Kebijakan Perekrutan dan Seleksi Direksi",
        "Kebijakan Penilaian Kinerja Dewan Komisaris dan Direksi",
        "Laporan Penilaian Kinerja Dewan Komisaris dan Direksi",
        "Laporan Remunerasi Dewan Komisaris dan Direksi",
        "Laporan Keterbukaan Informasi Perusahaan",
        "Kebijakan Komunikasi dengan Pemegang Saham",
        "Laporan Komunikasi dengan Pemegang Saham",
        "Kebijakan Pengelolaan Informasi dan Pengungkapan Informasi Publik",
        "Laporan Pengungkapan Informasi Publik",
        "Kebijakan Pengelolaan Website Perusahaan",
        "Laporan Pengelolaan Website Perusahaan",
        "Kebijakan Pemanfaatan Teknologi Informasi",
        "Laporan Pemanfaatan Teknologi Informasi",
        "Kebijakan Perlindungan Data Pribadi",
        "Laporan Perlindungan Data Pribadi",
        "Kebijakan Lingkungan Hidup",
        "Laporan Lingkungan Hidup",
        "Program Pengelolaan Lingkungan Hidup",
        "Laporan Kepatuhan terhadap Peraturan Lingkungan Hidup",
        "Kebijakan Kesehatan dan Keselamatan Kerja (K3)",
        "Laporan Pelaksanaan K3",
        "Program Pelaksanaan K3",
        "Laporan Kepatuhan terhadap Peraturan K3",
        "Kebijakan Hak Asasi Manusia (HAM)",
        "Laporan Pelaksanaan HAM",
        "Program Pelaksanaan HAM",
        "Kebijakan Pengadaan Barang dan Jasa",
        "Laporan Pengadaan Barang dan Jasa",
        "Kebijakan Manajemen Keuangan",
        "Laporan Keuangan",
        "Kebijakan Perencanaan Strategis",
        "Rencana Strategis Perusahaan",
        "Kebijakan Manajemen Kinerja",
        "Laporan Manajemen Kinerja",
        "Kebijakan Manajemen SDM",
        "Kebijakan Remunerasi Karyawan",
        "Laporan Remunerasi Karyawan",
        "Kebijakan Pendidikan dan Pelatihan",
        "Laporan Pendidikan dan Pelatihan",
        "Program Pendidikan dan Pelatihan",
        "Kebijakan Kesejahteraan Karyawan",
        "Laporan Kesejahteraan Karyawan",
        "Kebijakan Hubungan Industrial",
        "Laporan Hubungan Industrial",
        "Kebijakan Pemberdayaan Karyawan",
        "Laporan Pemberdayaan Karyawan",
        "Kebijakan Keberagaman dan Inklusi",
        "Laporan Keberagaman dan Inklusi",
        "Kebijakan Pensiun",
        "Laporan Pensiun",
        "Kebijakan Keselamatan dan Keamanan",
        "Laporan Keselamatan dan Keamanan",
        "Kebijakan Pengelolaan Aset",
        "Laporan Pengelolaan Aset",
        "Kebijakan Manajemen Proyek",
        "Laporan Manajemen Proyek",
        "Kebijakan Teknologi Informasi",
        "Laporan Teknologi Informasi",
        "Kebijakan Inovasi",
        "Laporan Inovasi",
        "Kebijakan Manajemen Mutu",
        "Laporan Manajemen Mutu",
        "Kebijakan Pemasaran",
        "Laporan Pemasaran",
        "Kebijakan Penjualan",
        "Laporan Penjualan",
        "Kebijakan Pelayanan Pelanggan",
        "Laporan Pelayanan Pelanggan",
        "Kebijakan Riset dan Pengembangan",
        "Laporan Riset dan Pengembangan",
        "Kebijakan Kemitraan",
        "Laporan Kemitraan",
        "Kebijakan Komunikasi",
        "Laporan Komunikasi",
        "Kebijakan Hubungan Masyarakat",
        "Laporan Hubungan Masyarakat",
        "Kebijakan Hubungan Investor",
        "Laporan Hubungan Investor",
        "Kebijakan Kepatuhan",
        "Laporan Kepatuhan",
        "Kebijakan Hukum",
        "Laporan Hukum",
        "Kebijakan Etika",
        "Laporan Etika",
        "Kebijakan Integritas",
        "Laporan Integritas",
        "Kebijakan Anti-Korupsi",
        "Laporan Anti-Korupsi",
        "Kebijakan Anti-Pencucian Uang",
        "Laporan Anti-Pencucian Uang",
        "Kebijakan Manajemen Reputasi",
        "Laporan Manajemen Reputasi",
        "Kebijakan Manajemen Krisis",
        "Laporan Manajemen Krisis",
        "Kebijakan Keberlanjutan Bisnis",
        "Laporan Keberlanjutan Bisnis",
        "Kebijakan Keamanan Siber",
        "Laporan Keamanan Siber",
        "Kebijakan Perlindungan Data",
        "Laporan Perlindungan Data",
        "Kebijakan Pengelolaan Risiko",
        "Laporan Pengelolaan Risiko",
        "Kebijakan Pengendalian Internal",
        "Laporan Pengendalian Internal",
        "Kebijakan Audit Internal",
        "Laporan Audit Internal",
        "Kebijakan Anti-Fraud",
        "Laporan Anti-Fraud",
        "Kebijakan WBS",
        "Laporan WBS",
        "Kebijakan Anti-Gratifikasi",
        "Laporan Anti-Gratifikasi",
        "Kebijakan Benturan Kepentingan",
        "Laporan Benturan Kepentingan",
        "Kebijakan Pihak Berelasi",
        "Laporan Pihak Berelasi",
        "Kebijakan Komplain",
        "Laporan Komplain",
        "Kebijakan Pelindungan Konsumen",
        "Laporan Perlindungan Konsumen",
        "Kebijakan CSR",
        "Laporan CSR",
        "Kebijakan Lingkungan",
        "Laporan Lingkungan",
        "Kebijakan K3",
        "Laporan K3",
        "Kebijakan HAM",
        "Laporan HAM",
        "Kebijakan Pengadaan",
        "Laporan Pengadaan",
        "Kebijakan Keuangan",
        "Laporan Keuangan",
        "Kebijakan Manajemen",
        "Laporan Manajemen",
        "Kebijakan SDM",
        "Laporan SDM",
        "Kebijakan Remunerasi",
        "Laporan Remunerasi",
        "Kebijakan Pelatihan",
        "Laporan Pelatihan",
        "Kebijakan Kesejahteraan",
        "Laporan Kesejahteraan",
        "Kebijakan Industrial",
        "Laporan Industrial",
        "Kebijakan Pemberdayaan",
        "Laporan Pemberdayaan",
        "Kebijakan Keberagaman",
        "Laporan Keberagaman",
        "Kebijakan Pensiun",
        "Laporan Pensiun",
        "Kebijakan Keamanan",
        "Laporan Keamanan",
        "Kebijakan Aset",
        "Laporan Aset",
        "Kebijakan Proyek",
        "Laporan Proyek",
        "Kebijakan TI",
        "Laporan TI",
        "Annual Report",
        "Penghargaan di bidang CSR, bidang publikasi dan keterbukaan Informasi",
        "Penghargaan-penghargaan lainnya yang diperoleh perusahaan selama tahun 2024",
        "Dekom/Direksi/Manajemen Kunci menjadi Pembicara mewakili Perusahaan"
      ];

      // Clear existing data for this year to avoid duplicates
      const existingData = checklist.filter(item => item.tahun !== year);

      // Create new checklist items from default data
      let counter = 1;
      const newItems: ChecklistGCG[] = DEFAULT_CHECKLIST_ITEMS.map((deskripsi, index) => ({
        id: Date.now() + index,
        aspek: '',
        deskripsi,
        tahun: year,
        rowNumber: counter++
      }));

      // Update local state immediately
      const updatedChecklist = [...existingData, ...newItems];
      setChecklist(updatedChecklist);

      // Save to backend via batch API
      const response = await fetch('http://localhost:5000/api/config/checklist/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: newItems.map(item => ({
            aspek: item.aspek,
            deskripsi: item.deskripsi,
            tahun: item.tahun,
            rowNumber: item.rowNumber
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save default checklist data');
      }

      console.log(`ChecklistContext: Successfully loaded ${newItems.length} default checklist items for year ${year}`);
      
      // Reload the data from Supabase to refresh the context
      setTimeout(async () => {
        try {
          const checklistResponse = await fetch('http://localhost:5000/api/config/checklist');
          if (checklistResponse.ok) {
            const checklistData = await checklistResponse.json();
            if (checklistData.checklist && Array.isArray(checklistData.checklist)) {
              const mappedChecklist = checklistData.checklist
                .filter((item: any) => item.deskripsi && item.tahun)
                .map((item: any) => ({
                  id: item.id,
                  aspek: item.aspek || '',
                  deskripsi: item.deskripsi || '',
                  tahun: item.tahun,
                  rowNumber: item.rowNumber
                }));
              
              setChecklist(mappedChecklist);
              console.log(`ChecklistContext: Refreshed checklist data after default load: ${mappedChecklist.length} items`);
            }
          }
        } catch (refreshError) {
          console.error('ChecklistContext: Error refreshing data after default load', refreshError);
        }
      }, 1000); // Wait 1 second for Supabase sync
      
    } catch (error) {
      console.error('ChecklistContext: Error loading default checklist data', error);
      throw error;
    }
  };

  return (
    <ChecklistContext.Provider value={{ 
      checklist, 
      aspects,
      getChecklistByYear,
      getAspectsByYear,
      addChecklist, 
      editChecklist, 
      deleteChecklist,
      addAspek,
      editAspek,
      deleteAspek,
      initializeYearData,
      ensureAllYearsHaveData,
      ensureAspectsForAllYears,
      useDefaultChecklistData
    }}>
      {children}
    </ChecklistContext.Provider>
  );
};

export const useChecklist = () => {
  const ctx = useContext(ChecklistContext);
  if (!ctx) throw new Error("useChecklist must be used within ChecklistProvider");
  return ctx;
}; 