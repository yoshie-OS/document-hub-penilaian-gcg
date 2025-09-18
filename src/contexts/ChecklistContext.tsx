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
  deletingAspectIds: Set<number>;
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
  console.log('ChecklistProvider: Component initialized');
  const [checklist, setChecklist] = useState<ChecklistGCG[]>([]);
  const [aspects, setAspects] = useState<Aspek[]>([]);
  const [deletingAspectIds, setDeletingAspectIds] = useState<Set<number>>(new Set());

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
        const checklistResponse = await fetch('http://localhost:5000/api/config/checklist', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'same-origin'
        });

        console.log('ChecklistContext: Response status:', checklistResponse.status, checklistResponse.statusText);
        console.log('ChecklistContext: Response headers:', Object.fromEntries(checklistResponse.headers.entries()));

        if (checklistResponse.ok) {
          try {
            // Use .json() instead of .text() + JSON.parse()
            const checklistData = await checklistResponse.json();
            console.log('ChecklistContext: Successfully parsed JSON, items count:', checklistData.checklist?.length || 0);

            if (checklistData.checklist && Array.isArray(checklistData.checklist)) {
              console.log('ChecklistContext: Raw checklist data from API:', checklistData.checklist);

              // Debug each item before filtering
              checklistData.checklist.forEach((item: any, index: number) => {
                console.log(`ChecklistContext: Item ${index + 1}:`, {
                  id: item.id,
                  deskripsi: item.deskripsi,
                  tahun: item.tahun,
                  aspek: item.aspek,
                  hasItem: !!item,
                  hasDeskripsi: !!item.deskripsi,
                  hasTahun: !!item.tahun,
                  deskripsiType: typeof item.deskripsi,
                  tahunType: typeof item.tahun,
                  deskripsiLength: item.deskripsi?.length,
                  willPassFilter: !!(item && item.deskripsi && item.tahun)
                });
              });

              // Simplified mapping - remove complex filtering logic that might cause issues
              const mappedChecklist = checklistData.checklist
                .filter((item: any) => {
                  // Simple validation - must have deskripsi and tahun
                  const passes = item && item.deskripsi && item.tahun;
                  if (!passes) {
                    console.warn('ChecklistContext: Item filtered out:', {
                      item,
                      reason: !item ? 'no item' : !item.deskripsi ? 'no deskripsi' : 'no tahun'
                    });
                  }
                  return passes;
                })
                .map((item: any) => ({
                  id: item.id,
                  aspek: item.aspek || '',
                  deskripsi: item.deskripsi || '',
                  pic: item.pic || '',
                  tahun: item.tahun,
                  rowNumber: item.rowNumber
                }));

              console.log('ChecklistContext: Final mapped checklist:', {
                originalCount: checklistData.checklist.length,
                filteredCount: mappedChecklist.length,
                itemsWithPIC: mappedChecklist.map(item => ({ id: item.id, pic: item.pic, deskripsi: item.deskripsi }))
              });

              setChecklist(mappedChecklist);
              // Save fresh data to localStorage for next load
              localStorage.setItem("checklistGCG", JSON.stringify(mappedChecklist));
              console.log('ChecklistContext: Loaded checklist from Supabase', mappedChecklist.length);
            }
          } catch (parseError) {
            console.error('ChecklistContext: JSON parse error:', parseError);
            console.error('ChecklistContext: Failed response details:', {
              url: checklistResponse.url,
              status: checklistResponse.status,
              statusText: checklistResponse.statusText,
              headers: Object.fromEntries(checklistResponse.headers.entries())
            });
            setChecklist([]);
          }
        } else {
          console.error('ChecklistContext: Failed to load checklist from Supabase', {
            status: checklistResponse.status,
            statusText: checklistResponse.statusText,
            url: checklistResponse.url
          });
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

        // Validate that updatedAspects is an array before setting
        if (Array.isArray(updatedAspects)) {
          setAspects(updatedAspects);
          console.log('ChecklistContext: Aspects updated from PengaturanBaru', updatedAspects);
        } else {
          console.error('ChecklistContext: Invalid aspects data from PengaturanBaru:', updatedAspects);
          // Keep existing aspects array instead of corrupting it
        }
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

    // REMOVED: Periodic localStorage polling that was causing PIC assignment conflicts
    // const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      // clearInterval(interval); // No longer needed
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

      const result = await response.json();

      // Handle file transfer feedback
      if (result.files_transferred) {
        console.log('ChecklistContext: ✅ Files successfully transferred to new PIC directory');

        // Dispatch transfer success event for UI feedback
        window.dispatchEvent(new CustomEvent('fileTransferSuccess', {
          detail: {
            checklistId: id,
            message: result.message || 'Files transferred successfully',
            transferredFiles: true
          }
        }));
      } else if (result.transfer_errors && result.transfer_errors.length > 0) {
        console.warn('ChecklistContext: ⚠️ File transfer had errors:', result.transfer_errors);

        // Dispatch transfer error event for UI feedback
        window.dispatchEvent(new CustomEvent('fileTransferError', {
          detail: {
            checklistId: id,
            errors: result.transfer_errors,
            warning: result.warning || 'Some files failed to transfer'
          }
        }));
      }

      console.log('ChecklistContext: Successfully updated checklist in Supabase');
    } catch (error) {
      console.error('ChecklistContext: Failed to update checklist in Supabase:', error);

      // Dispatch general error event
      window.dispatchEvent(new CustomEvent('fileTransferError', {
        detail: {
          checklistId: id,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          warning: 'Failed to update checklist and transfer files'
        }
      }));

      throw error; // Re-throw to let calling component handle it
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
    console.log('ChecklistContext: deleteAspek called with:', { id, year, currentlyDeleting: Array.from(deletingAspectIds) });

    // Prevent double-clicks
    if (deletingAspectIds.has(id)) {
      console.log('ChecklistContext: Delete already in progress for aspect:', id);
      return;
    }

    // Safety check: ensure aspects is an array
    if (!Array.isArray(aspects)) {
      console.error('ChecklistContext: aspects is not an array:', aspects);
      return;
    }

    console.log('ChecklistContext: Current aspects array:', aspects.length, 'items');

    const aspekToDelete = aspects.find(a => a.id === id);
    console.log('ChecklistContext: Found aspect to delete:', aspekToDelete);

    // Mark as deleting (do this regardless of local cache state)
    console.log('ChecklistContext: Marking aspect as deleting:', id);
    setDeletingAspectIds(prev => {
      const newSet = new Set(prev).add(id);
      console.log('ChecklistContext: Updated deleting set:', Array.from(newSet));
      return newSet;
    });

    try {
      // Delete from Supabase API - try this regardless of local cache state
      const response = await fetch(`http://localhost:5000/api/config/aspects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('ChecklistContext: Aspect not found on server (404):', id);
          // Don't throw error for 404 - aspect may have been already deleted
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        console.log('ChecklistContext: Successfully deleted aspect from Supabase');
      }

      // Only update local state if the aspect was found in local cache
      if (aspekToDelete) {
        // Remove aspect from aspects list
        // Safety check again before filtering
        if (!Array.isArray(aspects)) {
          console.error('ChecklistContext: aspects is not an array during filter operation:', aspects);
          return;
        }

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
      } else {
        console.warn('ChecklistContext: Aspect was not in local cache, but deletion may have succeeded on server');
      }
    } catch (error) {
      console.error('ChecklistContext: Error during aspect deletion:', error);
      // Don't re-throw - just log the error and continue to finally block

    } finally {
      // Always remove from deleting set
      console.log('ChecklistContext: Cleaning up deletion state for aspect:', id);
      setDeletingAspectIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        console.log('ChecklistContext: Cleanup - deleting set now:', Array.from(newSet));
        return newSet;
      });
      console.log('ChecklistContext: deleteAspek completed for:', id);
    }
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
  "Panduan pelaksanaan CoC :",
  "Pedoman Pengendalian Gratifikasi",
  "Pedoman WBS",
  "Peraturan Disiplin Pegawai",
  "PKB Terupdate",
  "Dokumentasi Sosialisasi CoCG, CoC dan panduan pelaksanaan CoC kepada Organ perusahaan",
  "Pernyataan Kepatuhan kepada CoC Tahun 2022 dan sebelumnya",
  "Program penguatan penerapan CoC (role model, champion team)",
  "Program pengenalan (orientasi) karyawan baru",
  "Laporan Self Assesment GCG tahun 2023",
  "TL AoI GCG",
  "Annual Report Tahun 2024, Jika belum tersedia maka tahun sebelumnya (Muatan terkait Assesment/self assessment GCG)",
  "Kontrak Manajemen atau KPI terkait GCG",
  "Pedoman LHKPN",
  "Sosialisas/Reminder penyampaian LHKPN",
  "Laporan LHKPN Periodik dengan tahun pelaporan 2024",
  "Sanksi terhadap Wajib Lapor yg tidak menyampaikan LHKPN",
  "Pedoman Pengendalian Gratifikasi",
  "Komunikasi dan Sosialisasi Gratifikasi kepada organ Perusahaan",
  "Pendistribusian ketentuan dan perangkat Pengendalian Gratifikasi",
  "Desiminasi Pengendalian Gratifikasi kepada Stakeholders",
  "Annual Report (Muatan terkait Pengendalian Gratifikasi)",
  "SK Unit Pengendalian Gratifikasi",
  "Rencana Kerja Pengendalian Gratifikasi",
  "Laporan Pelaksanaan Pengendalian Gratifikasi",
  "Peninjauan dan penyempurnaan perangkat pendukung gratifikasi",
  "Kebijakan WBS",
  "Rencana Kerja penerapan WBS",
  "Sosialisasi WBS kepada Organ perusahaan",
  "Sosialisasi WBS kepada Stakeholders",
  "Annual Report (terkait muatan WBS)",
  "Publikasi WBS di media di media lain (website, majalah)",
  "Sarana/Media pendukung WBS",
  "Dokumentasi Penanganan/TL atas WBS yang diterima",
  "Laporan WBS (termasuk evaluasi atas pelaksanaan WBS)",
  "Jumlah Pemenuhan Data Aspek I. Komitmen",
  "Pedoman pengangkatan dan pemberhentian Direksi",
  "SK Pengangkatan dan Pemberhentian Direksi",
  "CV Direksi",
  "Anggaran Dasar",
  "Pedoman pengangkatan dan pemberhentian Dekom",
  "SK Pengangkatan dan Pemberhentian Dekom",
  "Pedoman pengangkatan dan pemberhentian Dekom",
  "SK Pengangkatan dan Pemberhentian Dekom",
  "CV Komisaris",
  "Risalah RUPS RJPP terupdate",
  "Dokumen Pelaksanaan RUPS RKAP Tahun 2025 (Undangan, Daftar Hadir, Paparan, Notula, Risalah, termasuk bagian yg tidak terpisahkan dari Risalah RUPS nya)",
  "Dokumen Pelaksanaan RUPS Risalah RUPS RKAP Tahun 2024 (Undangan, Daftar Hadir, Paparan, Notula, Risalah, termasuk bagian yg tidak terpisahkan dari Risalah RUPS nya)",
  "Surat Persetujuan RUPS atas aksi korporasi Perusahaan",
  "Dokumen Pelaksanaan RUPS Laporan Tahunan 2023 (Undangan, Daftar Hadir, Paparan, Notula, Risalah, termasuk bagian yg tidak terpisahkan dari Risalah RUPS nya)",
  "Surat Persetujuan RUPS atas Remunerasi Direksi dan Dekom",
  "Surat Penetapan auditor eksternal untuk Laporan Keuangan Tahun 2023",
  "Jumlah Pemenuhan Data Aspek II. PS",
  "Board Manual",
  "Program pengenalan untuk Komisaris Baru (jika Pada Tahun 2024 terdapat pergantian)",
  "Kebijakan-kebijakan (SK) yang dikeluarkan Dekom",
  "Program Pengembangan Pengetahuan bagi Komisaris dan Laporan kegiatannya.",
  "Tanggapan Dewan Komisaris atas :",
  "- Laporan Manajemen Trw I, II, III, IV 2024",
  "- RJPP",
  "- RKAP 2025 dan RKAP 2024",
  "- Laporan Tahunan 2024 (Jika belum tersedia maka digunakan tahun sebelumnya)",
  "SK Pembagian Tugas Komisaris",
  "Laporan Pengawasan Dewan Komisaris Trw I, II, III, IV 2024 dan Laporan Pengawasan Dekom Tahun 2023",
  "Program Kerja dan Rencana Anggaran Dekom 2024 dan 2025",
  "Persetujuan Komisaris atas tindakan direksi & Pakta Integritas",
  "Dokumentasi Pengusulan calon Auditor Eksternal kepada RUPS.",
  "Pernyataan Komisaris tidak memiliki benturan kepentingan dan hal-hal yang dapat menimbulkan benturan kepentingan",
  "Tata Tertib Rapat Komisaris",
  "Surat kuasa untuk anggota dekom yang tidak hadir dalam rapat",
  "SK Pengangkatan Sekretaris Komisaris",
  "Uraian Tugas Sekretariat Komisaris",
  "Surat-surat Dewan Komisaris Kepada Pemegang Saham",
  "Surat-surat Dewan Komisaris kepada Direksi",
  "Surat-surat Pemegang Saham kepada Dewan Komisaris",
  "Agenda Surat Masuk dan Keluar Komisaris",
  "Undangan & agenda Rapat Internal Komisaris",
  "Undangan & agenda Rapat Komisaris yang Mengundang Direksi",
  "Risalah Rapat Internal Komisaris",
  "Risalah rapat Gabungan Komisaris",
  "SK Pengangkatan & Pemberhentian anggota Komite Audit dan Komite Komisaris Lainnya",
  "Uraian Tugas Komite Audit dan Komite Komisaris lainnya",
  "CV Anggota Komite Audit dan Komite Komisaris lainnya",
  "Komite Audit Charter dan Charter Komite Komisaris Lainnya",
  "Program Kerja & anggaran Komite Audit dan Komite Komisaris Lainnya",
  "Risalah Rapat Komite Audit dan Komite Komisaris lainnya",
  "Laporan Komite Audit dan Komite Komisaris lainnya kepada Dewan Komisaris (Triwulanan dan Tahunan)",
  "Jumlah Pemenuhan Data Aspek III. Dekom",
  "Program Pengenalan untuk Direksi Baru",
  "Program Pengembangan Pengetahuan bagi Direksi",
  "SK Struktur Organisasi",
  "Kajian mengenai Struktur Organisasi Perusahaan",
  "Kebijakan Persyaratan jabatan/job specification untuk semua jabatan",
  "Pedoman Penyusunan SOP",
  "Daftar SOP\n(Bisnis Utama)",
  "Daftar Reviu SOP",
  "Mekanisme pengambilan keputusan",
  "Pedoman Penyusunan RJPP",
  "Draft RJPP",
  "RJPP terakhir",
  "Pedoman Penyusunan RKAP",
  "RKAP tahun 2024 dan perubahannya, RKAP 2025",
  "Kebijakan SDM/Sistem Pola Karir perusahaan dan  Kebijakan pengembangan SDM/Diklat",
  "Data jumlah pegawai dirinci menurut unit kerja, jabatan, dan level pendidikan (pusat dan cabang)",
  "Database Kompetensi",
  "Daftar Urut Kepangkatan",
  "Laporan Assessment Pejabat satu level (manajemen kunci) di bawah Direksi",
  "Rencana promosi/suksesi (manajemen kunci)",
  "Laporan mengenai Rencana Suksesi Bagi Manajer Senior dari Direksi ke Komisaris",
  "Mekanisme dalam merespon setiap usulan peluang bisnis",
  "Dokumentasi usulan peluang bisnis tahun 2024",
  "Surat-surat Direksi kepada Pemegang Saham",
  "Surat-surat Pemegang Saham kepada Direksi",
  "Surat-surat Direksi kepada Dewan Komisaris",
  "Mekanisme dalam membahas isu-isu terkini tentang perubahan lingkungan bisnis",
  "Mekanisme persetujuan program di luar RKAP",
  "FS atas program/kegiatan yang membutuhkan investasi dan hutang",
  "Pedoman Penilaian Kinerja",
  "Indikator Kinerja sampai tingkat unit kerja",
  "Kontrak Kinerja setiap jabatan dalam Struktur Organisasi",
  "Laporan berkala pencapaian kinerja setiap jabatan dalam Struktur Organisasi",
  "Laporan Manajemen (Triwulan I, II, III dan Tahunan)",
  "Uraian tugas dan tanggungjawab Direksi dan manajemen di bawahnya",
  "Laporan pelaksanaan sistem manajemen kinerja secara tertulis dari Direksi kepada Komisaris \n(Laporan manajemen)",
  "Pengusulan insentif kinerja Direksi",
  "Kebijakan Teknologi Informasi",
  "IT Master Plan (dan Penjabarannya)",
  "SK Pengelolaan TI",
  "Audit atas Pengelolaan TI",
  "Laporan Pelaksanaan Teknologi informasiI Kepada Komisaris",
  "Kebijakan Manajemen Mutu",
  "Ketentuan/kebijakan Standar Pelayanan Minimal (SPM)",
  "Pencapaian SPM",
  "Laporan keluhan pelanggan atas produk",
  "Tindak lanjut atas keluhan pelanggan",
  "Laporan evaluasi sistem pengendalian mutu produk",
  "Kebijakan kompensasi bila mutu tidak terpenuhi",
  "Kebijakan Pengadaan Barang dan Jasa",
  "Laporan Pengadaan Barang dan Jasa",
  "Rencana Pengadaan Barang dan Jasa (termasuk HPS nya)",
  "SOP Pengadaan Barang dan Jasa",
  "Pengumuman pengadaan Barang dan Jasa",
  "Laporan audit atas pelaksanaan barang dan jasa",
  "Kebijakan Reward & Punishment",
  "Kebijakan Pengembangan SDM/Diklat",
  "Praktek talent pool Tahun 2024",
  "Program Pendidikan dan pelatihan",
  "Manual/aplikasi sistem penilaian kinerja",
  "Laporan Pelaksanaan Program Pendidikan dan pelatihan",
  "Laporan Evaluasi pasca pendidikan dan pelatihan",
  "Kebijakan/Program perlindungan keselamatan pekerja (K3)",
  "Rencana program K3",
  "Laporan Pelaksanaan Program K3",
  "Laporan Evaluasi dan tindak lanjut program K3",
  "Kebijakan/SOP untuk job placement",
  "Kebijakan skema remunerasi karyawan dan pemenuhan hak-hak kesejahteraan karyawan (lama dan update)",
  "Program reward untuk prestasi (unit dan individu)",
  "Kebijakan Subsidiary Governance/Tata Kelola Anak Perusahaan",
  "Proses Pengangkatan Direksi/Komisaris anak perusahaan",
  "Kebijakan/pedoman akuntansi, penyusunan LK dan management letter (lama dan update)",
  "Laporan Hasil Audit atas LK, Laporan Kepatuhan, Laporan Pengendalian Intern, Laporan Kinerja Tahun 2023 dan Tahun 2024 serta LK unaudited Tahun 2024 (jika LAI Tahun 2024 belum tersedia)",
  "Cascading atas asersi terhadap LK kepada tingkatan di bawah Direksi.",
  "Kebijakan Manajemen Risiko",
  "Rencana Kerja penerapan Manajemen Risiko (program kerja)",
  "Laporan pelaksanaan program MR ( evaluasi dan pemantauan)",
  "Laporan Pelaksanaan Manajemen Risiko Kepada Komisaris",
  "Kebijakan Sistem Pengendalian Intern",
  "Asersi/pernyataan Direksi mengenai efektifitas pengendalian internal Perusahaan",
  "Evaluasi atas pengendalian Internal Perusahaan",
  "Laporan Pelaksanaan Tindak Lanjut atas Rekomendasi Hasil Audit dari Auditor Eksternal dan Internal yang disampaikan oleh Direksi ke Komisaris",
  "Rencana Pelaksanaan Tindak Lanjut hasil audit",
  "Mekanisme untuk menjaga kepatuhan perusahaan terhadap perjanjian dan komitmen perusahaan dengan pihak ketiga.",
  "SK tentang Fungsi/struktur menjaga kepatuhan.",
  "Laporan Telaahan terhadap peraturan perundang-undangan yang baru",
  "Kajian hukum (legal opinion) atas rencana tindakan dan permasalahan yang terjadi terkait dengan kesesuaian hukum atau ketentuan yang berlaku.",
  "Evaluasi kajian risiko dan legal (risk and legal review) atas rencana inisiatif bisnis, kebijakan dan rencana kerjasama yang akan dilakukan oleh perusahaan.",
  "Laporan penyelesaian kasus litigasi dan non litigasi",
  "Kebijakan mengenai hak dan kewajiban Konsumen",
  "SOP/mekanisme penanganan keluhan pelanggan",
  "Program untuk mengkomunikasi produk kepada pelanggan",
  "Realisasi pengkomunikasian produk kepada pelanggan",
  "Rencana pelaksanaan penanganan keluhan pelanggan",
  "Laporan pelaksanaan keluhan pelanggan dan tindak lanjutnya",
  "Tindak Lanjut laporan survei kepuasan pelanggan",
  "Kebijakan mengenai hak dan kewajiban Pemasok",
  "Laporan Hasil Penilaian/Assessment Pemasok",
  "Tindak lanjut rekomendasi assessment pemasok",
  "Rekapitulasi pembayaran kepada tiap pemasok (memuat pembayaran seharusnya dan realisasi pembayaran)",
  "Kebijakan mengenai hak dan kewajiban Kreditur",
  "Rekapitulasi informasi kreditur",
  "Rekapitulasi pembayaran kepada bank/kreditur",
  "Rekapitulasi penyampaian SPT bulanan dan tahunan",
  "Rekapitulasi pembayaran pajak (pph karyawan badan PPN masa dan rampung dan PBB)",
  "Kebijakan Hak dan Kewajiban Pegawai/Perjanjian Kerja Bersama (PKB)",
  "Laporan Hasil Pengukuran Kepuasan Karyawan",
  "Rencana dan tindak lanjut hasil survei kepuasan karyawan",
  "Kebijakan/Mekanisme baku untuk menindaklanjuti keluhan-keluhan stakeholders.",
  "Mekanisme penanganan keluhan stakeholder (pemasok, karyawan, dll)",
  "Trend Dividen, Aset, KPI, Tk Kesehatan 3 tahun terakhir",
  "Kebijakan Kesehatan dan Keselamatan Kerja (K3)",
  "Kebijakan mengenai tanggung jawab sosial perusahaan (CSR)",
  "Laporan penanganan keluhan stakeholder",
  "Unit penanggung jawab sosial, lingkungan perusahaan dan usaha kecil",
  "Indikator Kinerja Pengelolaan PKBL/CSR",
  "Evaluasi Pencapaian Indikator PKBL/CSR",
  "Program penanganan keadaan darurat",
  "Rencana Kerja CSR, PKBL",
  "Pelaporan CSR, PKBL",
  "Pernyataan Direksi tidak memiliki benturan kepentingan dan hal-hal yang dapat menimbulkan benturan kepentingan",
  "Kebijakan mengenai benturan kepentingan",
  "Pakta Integritas Direksi atas setiap usulan tindakan direksi yang perlu mendapat persetujuan Dekom dan Pemegang Saham",
  "Usulan tindakan direksi yang perlu mendapat persetujuan Dekom dan PS",
  "Daftar Khusus, daftar kepemilikan saham Direksi dan Dewan Komisaris beserta keluarganya di perusahaan lain",
  "Surat Pengantar penyampaian Laporan Manajemen Triwulanan dan Tahunan kepada Pemegang Saham.",
  "Surat Pengantar penyampaian Laporan Manajemen Triwulanan dan Tahunan kepada Dewan Komisaris.",
  "Tata Tertib Rapat Direksi",
  "Rencana Rapat Direksi",
  "Undangan, Agenda & Risalah Risalah Rapat Direksi",
  "SPI Charter",
  "Masukan atas Draft IAC dari Dewan Komisaris (cq Komite Audit)",
  "Struktur Organisasi SPI",
  "SK Pengangkatan Kepala SPI",
  "CV Kepala SPI & seluruh personil SPI",
  "Pedoman Audit SPI",
  "Laporan Pelaksanaan Tugas SPI Kepada Dirut",
  "Laporan Pelatihan SDM SPI",
  "Analisis beban kerja/kebutuhan tenaga SPI",
  "Expedisi laporan audit SPI",
  "Manual Pengawasan SPI",
  "Pedoman Kendali Mutu Audit",
  "Program Penjaminan Kualitas Fungsi Auditor Internal",
  "Program Kerja SPI (PKPT)",
  "Masukan Komite Audit atas Draft Program Kerja Audit Tahunan",
  "Laporan pencapaian Program Kerja Audit Tahunan",
  "Rekomendasi SPI terhadap peningkatan proses tata kelola perusahaan",
  "Rekomendasi SPI terhadap peningkatan pengelolaan risiko",
  "Rekomendasi SPI terhadap pengendalian internal perusahaan",
  "Evaluasi terhadap keselarasan kegiatan operasional terhadap sasaran dan tujuan organisasi dan rekomendasinya.",
  "Masukan yang diberikan SPI atas prosedur dan pengendalian proses-proses bisnis perusahaan.",
  "Masukan yang diberikan SPI tentang upaya pencapaian strategi bisnis perusahaan.",
  "Pedoman Pemantauan Tindak lanjut hasil audit",
  "Laporan Hasil Audit SPI",
  "Laporan Hasil Tindak Lanjut Hasil Audit",
  "Evaluasi atas pelaksanaan tugas SPI",
  "CV Sekretaris Perusahaan",
  "Struktur Organisasi Sekretaris Perusahaan",
  "SK Pengangkatan Sekretaris Perusahaan",
  "Program Kerja Sekretaris Perusahaan",
  "Laporan Kepatuhan thd Peraturan yang berlaku dan Pengendalian Intern",
  "Evaluasi atas pelaksanaan tugas Sekretaris Perusahaan oleh Direksi",
  "Laporan Pelaksanaan Tugas Sekper Kepada Direksi",
  "Laporan/hasil telaah tingkat kepatuhan perusahaan kepada peraturan perundang-undangan yang berlaku.",
  "Dokumentasi Pra RUPS RKAP",
  "Dokumentasi Pra RUPS Laporan Tahunan",
  "Jumlah Pemenuhan Data Aspek IV. Direksi",
  "Kebijakan Pengendalian informasi perusahaan/Protokol Informasi",
  "Pelaporan Pelaksanaan KIP",
  "Kebijakan pengelolaan website perusahaan",
  "Majalah internal, bulletin dan tabloid perusahaan",
  "Rencana kegiatan dengan stakeholders",
  "Laporan Pelaksanaan kegiatan dengan stakeholders",
  "Mekanisme Update website dan portal BUMN",
  "Annual Report",
  "Penghargaan di bidang CSR, bidang publikasi dan keterbukaan Informasi",
  "Jumlah Pemenuhan Data",
  "Penghargaan-penghargaan lainnya yang diperoleh perusahaan selama tahun 2024",
  "Dekom/Direksi/Manajemen Kunci menjadi Pembicara mewakili Perusahaan",
  "Jumlah Pemenuhan Data",
  "T O T A L",
  "Data Tambahan Suplemen:",
  "ASET",
  "Kebijakan/ Prosedur Manajemen Aset",
  "Laporan Profile Asset Perusahaan (mencakup aset yang digunakan dan aset idle/tidak produktif) Tahun 2024",
  "Rencana aksi atas aset idle/tidak produktif",
  "Daftar aset Bantuan Pemerintah yang belum Ditetapkan statusnya (BPYBDS) sampai dengan Tahun 2024",
  "Laporan penggunaan dana Penyertaan Modal Negara (PMN) sampai dengan Tahun 2024",
  "Daftar investasi terhambat/terhenti/mangkrak (sampai dengan Tahun 2024, jika ada)",
  "KINERJA",
  "Laporan Keuangan Hasil Audit Tahun 2022, 2023,2024 (3 tahun terakhir)",
  "KPI direksi perusahaan selama 5 tahun.",
  "Tingkat kematangan penerapan manajemen risiko selama 5 tahun (berdasarkan penilaian mandiri atau pihak eksternal) beserta Area of Improvementnya."
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

  console.log('ChecklistProvider: Rendering with checklist data:', checklist.length, 'items');

  return (
    <ChecklistContext.Provider value={{
      checklist,
      aspects,
      deletingAspectIds,
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