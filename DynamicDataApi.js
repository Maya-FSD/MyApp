import axiosHelper from '../../utils/apiHelper';

import {  Alert  } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

// ==========================================
// CENTRALIZED DATA MANAGER - SINGLETON PATTERN
// ==========================================

class DataManager {
  constructor() {
    if (DataManager.instance) {
      return DataManager.instance;
    }

    // Initialize data storage
    this.data = {
      users: [],
      calls: [],  // user-audits
      codes: [],
      branches: [],
      customers: [],
      codeMappings: [],
      audioAudits: [],
      chartData: null,
    };

    // Loading states
    this.loadingStates = {
      users: false,
      calls: false,
      codes: false,
      branches: false,
      customers: false,
      codeMappings: false,
      audioAudits: false,
      chartData: false,
    };

    // Cache timestamps
    this.lastFetched = {};
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Event listeners for real-time updates
    this.listeners = {};

    // Loading promises to prevent duplicate calls
    this.loadingPromises = {};

    DataManager.instance = this;
  }

  // ==========================================
  // EVENT SYSTEM - FOR REAL-TIME UPDATES
  // ==========================================
  
  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // ==========================================
  // CACHE MANAGEMENT
  // ==========================================

  isCacheValid(key) {
    const lastFetch = this.lastFetched[key];
    return lastFetch && (Date.now() - lastFetch) < this.CACHE_DURATION;
  }

  updateCache(key, data) {
    this.data[key] = data;
    this.lastFetched[key] = Date.now();
    this.emit(`${key}Updated`, data);
  }

  clearCache(key = null) {
    if (key) {
      delete this.lastFetched[key];
      this.data[key] = key === 'chartData' ? null : [];
    } else {
      this.lastFetched = {};
      Object.keys(this.data).forEach(k => {
        this.data[k] = k === 'chartData' ? null : [];
      });
    }
  }

  // ==========================================
  // SMART API FETCHERS - PREVENT DUPLICATE CALLS
  // ==========================================

  async fetchWithCache(key, apiCall, forceRefresh = false) {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && this.isCacheValid(key)) {
      console.log(`📦 Using cached ${key}`);
      return this.data[key];
    }

    // If already loading, return the existing promise
    if (this.loadingStates[key] && this.loadingPromises[key]) {
      console.log(`⏳ ${key} already loading, waiting...`);
      return this.loadingPromises[key];
    }

    // Start loading
    this.loadingStates[key] = true;
    console.log(`🌐 Fetching ${key} from API`);

    this.loadingPromises[key] = apiCall()
      .then(data => {
        this.updateCache(key, data);
        return data;
      })
      .catch(error => {
        console.error(`Error fetching ${key}:`, error);
        return key === 'chartData' ? null : [];
      })
      .finally(() => {
        this.loadingStates[key] = false;
        delete this.loadingPromises[key];
      });

    return this.loadingPromises[key];
  }

  // ==========================================
  // API METHODS - SINGLE SOURCE OF TRUTH
  // ==========================================

  async getUsers(forceRefresh = false) {
    return this.fetchWithCache('users', async () => {
      const res = await axiosHelper.get('auth/users');
      return res;
    }, forceRefresh);
  }

  async getCalls(forceRefresh = false) {
    return this.fetchWithCache('calls', async () => {
      const res = await axiosHelper.get('vconnect/user-audits');
      return res;
    }, forceRefresh);
  }

  async getCodes(forceRefresh = false) {
    return this.fetchWithCache('codes', async () => {
      const res = await axiosHelper.get('vconnect/codes');
      return res;
    }, forceRefresh);
  }

  async getBranches(forceRefresh = false) {
    return this.fetchWithCache('branches', async () => {
      const res = await axiosHelper.get('vconnect/branches');
      return res;
    }, forceRefresh);
  }

  async getAuditCodeMappings(forceRefresh = false) {
    return this.fetchWithCache('codeAuditMappings', async () => {
      const res = await axiosHelper.get('vconnect/code-mapping');     
      return  res ;
    }, forceRefresh);
  }

  async getCustomers(forceRefresh = false) {
    return this.fetchWithCache('customers', async () => {
      const res = await axiosHelper.get('auth/customers');
      return res;
    }, forceRefresh);
  }

  async getCodeMappings(forceRefresh = false) {
    return this.fetchWithCache('codeMappings', async () => {
      const res = await axiosHelper.get('vconnect/code-mapping');
      const filtered = res.filter(item => item.tsl_code_name);
      const mappedData = filtered.map(item => ({
        branchid: item.branch_id,
        codeid: item.vconnect_code_id,
        tsl_code_id : item.tsl_code_id, // Keep original data
      }));
      return { res, mappedData };
    }, forceRefresh);
  }


  async getChartData(forceRefresh = false) {
    return this.fetchWithCache('chartData', async () => {
      const response = await axiosHelper.get('vconnect/branches');
      const recommended = response.filter(item => item.name);
      const branchnameandlocation = recommended.map(item => ({
        branch_id: item.id,
        branchname: item.name,
        branchlocation: item.location,
      }));
      return { branchnameandlocation };
    }, forceRefresh);
  }

  // ==========================================
  // PROCESSED DATA METHODS
  // ==========================================

  async getAudioAudits(forceRefresh = false) {
    return this.fetchWithCache('audioAudits', async () => {
      // Ensure dependencies are loaded
      const [calls, codes] = await Promise.all([
        this.getCalls(forceRefresh),
        this.getCodes(forceRefresh)
      ]);

      // Create code map
      const codeMap = codes.reduce((map, code) => {
        const id = code?.id?.toString();
        if (id) {
          map[id] = {
            name: code.code_name || `Code ${id}`,
            purpose: code.code_purpose || `Code ${id}`,
            color: code.code_color || '#cccccc',
          };
        }
        return map;
      }, {});

      // Filter and map audio data
      const filtered = calls.filter(
        item => item.file_name || item.fileName || item.filename
      );

      const mappedData = filtered.map((item, index) => {
        const codeId = item.code_id?.toString();
        const codeInfo = codeMap[codeId];

        const displayName = codeInfo 
          ? `${codeInfo.name.toUpperCase()} [${index + 1}]`
          : `${(item.file_name || item.fileName || item.filename).toUpperCase()} [${index + 1}]`;

        return {
          id: item.id,
          filename: displayName,
          duration: item.duration,
          status: item.status?.trim().toUpperCase(),
          link: `https://vconnect-alert.winzetech.com/uploads/audio/recordings/${item.file_name}`,
          created_at: item.created_at,
          code_id: codeId,
          code_color: codeInfo?.color || '#cccccc',
          code_purpose: codeInfo?.purpose || '',
        };
      });

      return mappedData;
    }, forceRefresh);
  }

async getCodeAuditDetails(forceRefresh = false) {
  console.log("Fetching calls and codes...");
  const [callsRes, codesRes] = await Promise.all([
    this.getCalls(forceRefresh),
    this.getAuditCodeMappings(forceRefresh)
  ]);

  const calls = callsRes?.data || callsRes || [];
  const codes = codesRes?.data || codesRes || [];

  // 1) Build map keyed by tsl_code_id
  const codeMap = (codes || []).reduce((map, code, idx) => {
    const tslId = code?.tsl_code_id;
    if (tslId != null) {
      const key = tslId.toString();
      map[key] = {
        branch_id: code.branch_id ?? null,
        tsl_code_name: code.tsl_code_name ?? '',
        status: code.status ?? '',
        created_at: code.created_at ?? null,
        tsl_code_id: tslId
      };
    } else {
      console.warn(`Skipping invalid code at index ${idx}: missing tsl_code_id`, code);
    }
    return map;
  }, {});

  // 2) Join calls CONF_ID → codeMap[tsl_code_id]
  const joinedData = calls
    .map(call => {
      const confId = call?.conf_id;
      if (confId != null) {
        const key = confId.toString();
        const codeInfo = codeMap[key];
        if (codeInfo) {
          return {
            branch_id:     codeInfo.branch_id,
            tsl_code_name: codeInfo.tsl_code_name,
            status:        codeInfo.status,
            created_at:    call.created_at , // keep the call’s timestamp
            timeres: call.duration,
          };
        }
      }
      return null;
    })
    .filter(item => item !== null)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

 // console.log("from api––", joinedData.length);
  return joinedData;
}



async getDashboardData(forceRefresh = false) {
    // Ensure dependencies are loaded
    const [calls, codes] = await Promise.all([
      this.getCalls(forceRefresh),
      this.getCodes(forceRefresh)
    ]);

    const codeMap = codes.reduce((map, code) => {
      const id = code?.id?.toString();
      if (id) {
        map[id] = {
          name: code.code_purpose || `Code ${id}`,
          color: code.code_color || '#cccccc',
          codealert: code.code_name || 'Code Empty'
        };
      }
      return map;
    }, {});

    const countsResult = {};
    const sortedCalls = [...calls]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(call => {
        const codeId = call.code_id?.toString();
        const codeDetails = codeId ? codeMap[codeId] : null;
        
        return {
          code_name: codeDetails?.codealert.toUpperCase() || 'Unknown Code',
          status: call.status,
          created_at: call.created_at,
          _code_color: codeDetails?.color
        };
      });

    const seenStatuses = new Set();

    calls.forEach(call => {
      const codeId = call?.code_id?.toString();
      const status = call?.status?.toUpperCase();
      
      if (!codeId || !status) return;
      
      seenStatuses.add(codeId);
      
      if (!countsResult[codeId]) {
        countsResult[codeId] = {
          name: codeMap[codeId]?.name || `Code ${codeId}`,
          colorname: codeMap[codeId]?.color || '#cccccc',
          colorcode: codeMap[codeId]?.codealert || 'Code Empty',
          counts: { ACTIVE: 0, DEACTIVATED: 0, INACTIVE: 0 }
        };
      }
      
      if (countsResult[codeId].counts.hasOwnProperty(status)) {
        countsResult[codeId].counts[status]++;
      }
    });

    return {
      statusCountsByCode: countsResult,
      recentRecords: sortedCalls.slice(0, 5),
      seenStatuses: Array.from(seenStatuses)
    };
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  async initializeAllData(forceRefresh = false) {
    try {
      //console.log('🚀 Initializing all data...');
      
      const results = await Promise.allSettled([
        this.getUsers(forceRefresh),
        this.getCalls(forceRefresh),
        this.getCodes(forceRefresh),
        this.getBranches(forceRefresh),
        this.getCustomers(forceRefresh),
        this.getCodeMappings(forceRefresh),
        this.getChartData(forceRefresh)
      ]);

      const stats = {
        users: this.data.users.length,
        calls: this.data.calls.length,
        codes: this.data.codes.length,
        branches: this.data.branches.length,
        customers: this.data.customers.length,
        codeMappings: this.data.codeMappings.res?.length || 0,
        failures: results.filter(r => r.status === 'rejected').length
      };

      console.log('✅ Data initialization complete:', stats);
      this.emit('allDataInitialized', stats);
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing data:', error);
      return false;
    }
  }

  async refreshAllData() {
    console.log('🔄 Refreshing all data...');
    this.clearCache();
    return this.initializeAllData(true);
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  getCodeById(id) {
    return this.data.codes.find(code => code.id === id) || null;
  }

  getUserById(id) {
    return this.data.users.find(user => user.id === id) || null;
  }

  getBranchById(id) {
    return this.data.branches.find(branch => branch.id === id) || null;
  }

  getCustomerById(id) {
    return this.data.customers.find(customer => customer.id === id) || null;
  }

  getActivationsByCodeId(codeId) {
    return this.data.calls.filter(call => call.code_id === codeId);
  }

  async getCodesByBranch(branchId, forceRefresh = false) {
    const cacheKey = `branch-codes-${branchId}`;
    
    return this.fetchWithCache(cacheKey, async () => {
      try {
        const res = await axiosHelper.get(`vconnect/branch-codes/${branchId}`);
        return res || [];
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.warn(`No codes found for branch ID ${branchId}`);
          return [];
        }
        throw error;
      }
    }, forceRefresh);
  }

  // ==========================================
  // STATUS AND DEBUG INFO
  // ==========================================

  getStatus() {
    return {
      loadingStates: { ...this.loadingStates },
      dataSizes: {
        users: this.data.users.length,
        calls: this.data.calls.length,
        codes: this.data.codes.length,
        branches: this.data.branches.length,
        customers: this.data.customers.length,
        audioAudits: this.data.audioAudits.length,
      },
      cacheAges: Object.keys(this.lastFetched).reduce((acc, key) => {
        acc[key] = this.lastFetched[key] ? 
          Math.floor((Date.now() - this.lastFetched[key]) / 1000) + 's' : 'never';
        return acc;
      }, {}),
      listenerCounts: Object.keys(this.listeners).reduce((acc, key) => {
        acc[key] = this.listeners[key]?.length || 0;
        return acc;
      }, {})
    };
  }
}

// ==========================================
// SINGLETON INSTANCE EXPORT
// ==========================================

const dataManager = new DataManager();



export const downloadAudioFile = async (audioUrl, filename, itemId, setIsDownloading, setDownloadProgress) => {
  try {
      setIsDownloading(true);
    setDownloadProgress({ [itemId]: 0 });

    // 1. Validate URL first
    if (!audioUrl || !audioUrl.startsWith('http')) {
      throw new Error('Invalid audio URL provided');
    }

    console.log("📡 Checking URL accessibility...");
    try {
      const response = await fetch(audioUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`URL not accessible (HTTP ${response.status})`);
      }
      console.log("✅ URL is accessible");
    } catch (error) {
      throw new Error(`Cannot access URL: ${error.message}`);
    }

    // 2. Request permissions - MEDIA LIBRARY IS KEY
    console.log("🔒 Requesting permissions...");
    
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Media library permission denied - required to save files to your device');
    }

    console.log("✅ Media library permissions granted");

    // 3. Prepare filename - preserve original extension
    const getFileExtension = (filename) => {
      const lastDotIndex = filename.lastIndexOf('.');
      return lastDotIndex > 0 ? filename.substring(lastDotIndex) : '.mp3';
    };

    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const originalExtension = getFileExtension(filename);
    const nameWithoutExtension = cleanFilename.replace(/\.[^/.]+$/, '');
    const finalFilename = `${nameWithoutExtension}${originalExtension}`;
    
    // Use cache directory for temporary download
    const tempDownloadPath = `${FileSystem.cacheDirectory}${finalFilename}`;
    
    console.log("📁 Temp download path:", tempDownloadPath);
    console.log("📁 Final filename:", finalFilename);

    // 4. Create download resumable with progress tracking
    const downloadResumable = FileSystem.createDownloadResumable(
      audioUrl,
      tempDownloadPath,
      {
        headers: {
          'User-Agent': 'VconnectWeb/1.0',
        },
      },
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesExpectedToWrite > 0
          ? (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
          : 0;
        
        const roundedProgress = Math.round(progress);
        console.log(`📊 Download progress: ${roundedProgress}%`);
        setDownloadProgress({ [itemId]: roundedProgress });
      }
    );

    console.log("⬇️ Starting download...");
    const downloadResult = await downloadResumable.downloadAsync();

    if (!downloadResult || !downloadResult.uri) {
      throw new Error('Download failed - no file created');
    }

    console.log("✅ Download completed:", downloadResult.uri);

    // 5. Verify file exists and has content
    const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
    if (!fileInfo.exists || fileInfo.size === 0) {
      throw new Error('Downloaded file is empty or doesn\'t exist');
    }

    console.log("📊 File size:", fileInfo.size, "bytes");

    // 6. SAVE TO DEVICE MEDIA LIBRARY (This makes it accessible!)
    console.log("💾 Saving to device media library...");
    
    try {
      // Create asset in media library - this makes it accessible to file managers
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      console.log("✅ Asset created in media library:", asset.id);
      
      // Try to organize into Music/Downloads album
      try {
        let album = await MediaLibrary.getAlbumAsync('Music');
        if (!album) {
          // Create Music album if it doesn't exist
          album = await MediaLibrary.createAlbumAsync('Music', asset);
          console.log("✅ Created Music album");
        } else {
          // Add to existing Music album
          await MediaLibrary.addAssetsToAlbumAsync([asset], album);
          console.log("✅ Added to Music album");
        }
      } catch (albumError) {
        console.log("⚠️ Album organization failed, but file is saved to media library:", albumError.message);
      }
      
      // Clean up temporary file
      try {
        await FileSystem.deleteAsync(downloadResult.uri);
        console.log("🗑️ Cleaned up temporary file");
      } catch (cleanupError) {
        console.log("⚠️ Cleanup failed:", cleanupError.message);
      }
      
      // Success message with clear instructions
      Alert.alert(
        'Download Complete! 🎉',
        `"${finalFilename}" has been saved to your device.\n\n📁 You can find it in:\n• Music apps (like Google Play Music)\n• File managers under "Audio" or "Music"\n• Media galleries\n\nFile size: ${(fileInfo.size / 1024).toFixed(2)} KB`,
        [
          { 
            text: 'OK',
            onPress: () => console.log("✅ Download notification acknowledged")
          }
        ]
      );
      
    } catch (mediaLibraryError) {
      console.error('❌ MediaLibrary save failed:', mediaLibraryError);
      
      // Fallback: Keep file in app folder and offer share option
      Alert.alert(
        'Download Complete! 📁',
        `"${finalFilename}" has been downloaded.\n\nFile size: ${(fileInfo.size / 1024).toFixed(2)} KB\n\nNote: File is saved in app storage. Use the share button to save it to your preferred location.`,
        [
          { 
            text: 'OK',
            onPress: () => console.log("✅ Download notification acknowledged")
          },
          {
            text: 'Share Now',
            onPress: () => shareFile(downloadResult.uri)
          }
        ]
      );
    }

    console.log("🎉 Download process completed successfully");

  } catch (error) {
    console.error('❌ Download error:', error);
    
    // Provide specific error messages
    let errorMessage = 'Failed to download the audio file';
    if (error.message.includes('permission')) {
      errorMessage = 'Permission denied. Please allow media access in your device settings:\n\nSettings > Apps > [Your App] > Permissions > Storage/Media';
    } else if (error.message.includes('URL')) {
      errorMessage = 'Audio file URL is not accessible. Please try again later.';
    } else if (error.message.includes('network')) {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.message.includes('media library')) {
      errorMessage = 'Cannot save to device media library. Please check permissions in Settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    Alert.alert(
      'Download Failed ❌',
      errorMessage,
      [
        { text: 'OK' },
        { 
          text: 'Retry', 
          onPress: () => downloadAudioFile(audioUrl, filename, itemId, setIsDownloading, setDownloadProgress)
        }
      ]
    );
  } finally {
    setIsDownloading(false);
    setDownloadProgress({});
  }
};

// Share function for fallback
const shareFile = async (filePath) => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'audio/mp3',
        dialogTitle: 'Save Audio File',
      });
    } else {
      Alert.alert('Share not available', 'Sharing is not available on this device.');
    }
  } catch (error) {
    console.error('Share error:', error);
    Alert.alert('Share Error', 'Failed to share the file.');
  }
};

// ==========================================
// CONVENIENCE FUNCTIONS (BACKWARD COMPATIBILITY)
// ==========================================

export const getAllUsers = () => dataManager.getUsers();
export const getAllCalls = () => dataManager.getCalls();
export const getAllCodes = () => dataManager.getCodes();
export const getAllBranches = () => dataManager.getBranches();
export const getAllCustomers = () => dataManager.getCustomers();
export const getAllCodeMappings = () => dataManager.getCodeMappings();
export const getAllAudioAudit = () => dataManager.getAudioAudits();
export const getAllCodeAudit = () => dataManager.getCodeAuditDetails();
export const getChartdata = () => dataManager.getChartData();
export const getDashboardData = () => dataManager.getDashboardData();
export const getCodesByBranch = (branchId) => dataManager.getCodesByBranch(branchId);

// Data access helpers
export const getCodeById = (id) => dataManager.getCodeById(id);
export const getUserById = (id) => dataManager.getUserById(id);
export const getBranchById = (id) => dataManager.getBranchById(id);
export const getCustomerById = (id) => dataManager.getCustomerById(id);
export const getActivationsByCodeId = (codeId) => dataManager.getActivationsByCodeId(codeId);

// Initialization and management
export const initData = () => dataManager.initializeAllData();
export const refreshAllData = () => dataManager.refreshAllData();
export const clearCache = () => dataManager.clearCache();
export const getDataStatus = () => dataManager.getStatus();

// Event system
export const addEventListener = (event, callback) => dataManager.addEventListener(event, callback);
export const removeEventListener = (event, callback) => dataManager.removeEventListener(event, callback);

// Direct access to data manager for advanced usage
export default dataManager;