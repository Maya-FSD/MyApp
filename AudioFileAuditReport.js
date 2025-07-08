import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { Picker } from '@react-native-picker/picker';
import dataManager, { 
  addEventListener, 
  removeEventListener, 
} from './DynamicDataApi';

import * as DynamicDataApi from './DynamicDataApi';

const { width } = Dimensions.get('window');

const AudioFileAuditReport = () => {
  const [audioData, setAudioData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('TODAY');
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));  

  const [selectedAudioId, setSelectedAudioId] = useState('');
  const [sound, setSound] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [isDownloading, setIsDownloading] = useState(false);

  // Time filter options with enhanced styling data
  const timeFilters = [
    {
      value: 'TODAY',
      label: 'Today',
      icon: '⏰',    
      color: '#2196F3',
      bgColor: '#E3F2FD'
    },   
    {
      value: 'THIS_WEEK',
      label: 'This Week',
      icon: '📆',
      color: '#4CAF50',
      bgColor: '#E8F5E8'
    },
    {
      value: 'THIS_MONTH',
      label: 'This Month',
      icon: '📊',
      color: '#9C27B0',
      bgColor: '#F3E5F5'
    },
    {
      value: 'THIS_YEAR',
      label: 'This Year',
      icon: '🗓️',
      color: '#FF9800',
      bgColor: '#FFF3E0'
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        console.log('🎵 AudioReport: Loading audio data...');
        
        const result = await dataManager.getAudioAudits();
        setAudioData(result);
        
        console.log('🎵 AudioReport: Data loaded successfully');
      } catch (error) {
        console.error('🎵 AudioReport: Error loading data:', error);
        Alert.alert('Error', 'Failed to load audio data');
      } finally {
        setDataLoading(false);
      }
    };

    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const handleAudioUpdate = (newData) => {
      console.log('🎵 AudioReport: Received real-time update');
      setAudioData(newData);
    };

    addEventListener('audioAuditsUpdated', handleAudioUpdate);
    fetchData();

    return () => {
      removeEventListener('audioAuditsUpdated', handleAudioUpdate);
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const filterByTime = (dateString) => {
    if (!dateString) return false;
    const createdDate = new Date(dateString);
    const now = new Date();

    switch (timeFilter) {
      case 'TODAY':
        return createdDate.toDateString() === now.toDateString();
      case 'THIS_WEEK':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return createdDate >= startOfWeek && createdDate <= endOfWeek;
      case 'THIS_MONTH':
        return (
          createdDate.getMonth() === now.getMonth() &&
          createdDate.getFullYear() === now.getFullYear()
        );
      case 'THIS_YEAR':
        return createdDate.getFullYear() === now.getFullYear();
      case 'ALL':
      default:
        return true;
    }
  };

  const filteredData = audioData.filter((item) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      item.status?.toUpperCase() === statusFilter.toUpperCase();

    const matchesSearch = item.filename
      .toLowerCase()
      .includes(searchText.toLowerCase());

    const matchesTime = filterByTime(item.created_at);

    return matchesStatus && matchesSearch && matchesTime;
  });

  const playAudio = async (audioUrl, itemId) => {
    try {
      setIsLoading(true);

      if (currentPlayingId === itemId && sound && isPaused) {
        await sound.playAsync();
        setIsPaused(false);
        setIsLoading(false);
        return;
      }

      if (sound && currentPlayingId !== itemId) {
        await sound.unloadAsync();
        setSound(null);
        setCurrentPlayingId(null);
        setIsPaused(false);
      }

      if (currentPlayingId !== itemId) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, progressUpdateIntervalMillis: 100, positionMillis: 0 },
          onPlaybackStatusUpdate
        );

        setSound(newSound);
        setCurrentPlayingId(itemId);
        setIsPaused(false);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio file');
      setIsLoading(false);
      setIsPaused(false);
    }
  };

  const pauseAudio = async () => {
    try {
      if (sound && playbackStatus.isLoaded && playbackStatus.isPlaying) {
        await sound.pauseAsync();
        setIsPaused(true);
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };

  const stopAudio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        setIsPaused(false);
        setCurrentPlayingId(null);
        setPlaybackStatus({});
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    setPlaybackStatus(status);

    if (status.didJustFinish) {
      setCurrentPlayingId(null);
      setIsPaused(false);
      setTimeout(() => {
        if (sound) {
          sound.unloadAsync();
          setSound(null);
        }
      }, 100);
    }

    if (status.isLoaded) {
      setIsPaused(!status.isPlaying && currentPlayingId !== null);
    }
  };

  const togglePlayPause = async (audioUrl, itemId) => {
    if (currentPlayingId === itemId && sound) {
      if (isPaused || !playbackStatus.isPlaying) {
        await playAudio(audioUrl, itemId);
      } else {
        await pauseAudio();
      }
    } else {
      await playAudio(audioUrl, itemId);
    }
  };

  const handleRefresh = async () => {
    try {
      setDataLoading(true);
      console.log('🔄 AudioReport: Refreshing data...');
      
      const result = await dataManager.getAudioAudits(true);
      setAudioData(result);
      
      Alert.alert('Success', 'Data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setDataLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return '#4CAF50';
      case 'DEACTIVATED':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  // Animate modal
  const openTimePickerModal = () => {
    setShowTimePickerModal(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeTimePickerModal = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowTimePickerModal(false);
    });
  };

  const selectTimeFilter = (filterValue) => {
    setTimeFilter(filterValue);
    closeTimePickerModal();
  };

  const getSelectedTimeFilter = () => {
    return timeFilters.find(filter => filter.value === timeFilter) || timeFilters[0];
  };



  // Render Time Picker Modal
  const renderTimePickerModal = () => {
    const selectedFilter = getSelectedTimeFilter();

    return (
      <Modal
        visible={showTimePickerModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeTimePickerModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={closeTimePickerModal}
          />
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                }],
                opacity: slideAnim,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🕐 Select Time Range</Text>
              <TouchableOpacity 
                onPress={closeTimePickerModal}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.timeFiltersList}>
              {timeFilters.map((filter, index) => (
                <TouchableOpacity
                  key={filter.value}
                  onPress={() => selectTimeFilter(filter.value)}
                  style={[
                    styles.timeFilterCard,
                    { backgroundColor: filter.value === timeFilter ? filter.bgColor : '#FFFFFF' },
                    index === timeFilters.length - 1 && { marginBottom: 0 }
                  ]}
                >
                  <View style={styles.timeFilterContent}>
                    <View style={[
                      styles.timeFilterIcon,
                      { backgroundColor: filter.color }
                    ]}>
                      <Text style={styles.timeFilterIconText}>{filter.icon}</Text>
                    </View>
                    <View style={styles.timeFilterTextContainer}>
                      <Text style={[
                        styles.timeFilterLabel,
                        { color: filter.value === timeFilter ? filter.color : '#1976D2' }
                      ]}>
                        {filter.label}
                      </Text>
                      <Text style={styles.timeFilterDescription}>
                        {filter.description}
                      </Text>
                    </View>
                    {filter.value === timeFilter && (
                      <View style={[styles.checkmark, { backgroundColor: filter.color }]}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.selectedFilterText}>
                Selected: {selectedFilter.label}
              </Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  if (dataLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading Audio Data...</Text>
        <Text style={styles.loadingSubText}>
          This may take a moment on first load
        </Text>
      </View>
    );
  }

  const selectedTimeFilter = getSelectedTimeFilter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>🔊 Audio File Audit</Text>
      
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          📊 Total Files: {audioData.length} | Filtered: {filteredData.length}
        </Text>
      </View>

      <TextInput
        placeholder="🔍 Search by filename"
        value={searchText}
        onChangeText={setSearchText}
        style={styles.searchInput}
        placeholderTextColor="#9E9E9E"
      />

      {/* Enhanced Time Filter Section */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>📅 Time Filter:</Text>
        <TouchableOpacity 
          style={[styles.timeFilterButton, { backgroundColor: selectedTimeFilter.bgColor }]}
          onPress={openTimePickerModal}
        >
          <View style={[styles.timeFilterSelectedIcon, { backgroundColor: selectedTimeFilter.color }]}>
            <Text style={styles.timeFilterSelectedIconText}>{selectedTimeFilter.icon}</Text>
          </View>
          <View style={styles.timeFilterSelectedTextContainer}>
            <Text style={[styles.timeFilterSelectedLabel, { color: selectedTimeFilter.color }]}>
              {selectedTimeFilter.label}
            </Text>
            <Text style={styles.timeFilterSelectedDescription}>
              {selectedTimeFilter.description}
            </Text>
          </View>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <Text style={styles.filterTitle}>⚙️ Status Filter:</Text>
      <View style={styles.filterRow}>
        {['ALL', 'ACTIVE', 'DEACTIVATED'].map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setStatusFilter(status)}
            style={[
              styles.filterButton,
              statusFilter === status && styles.selectedFilter,
            ]}
          >
            <Text style={[
              styles.filterText,
              statusFilter === status && styles.selectedFilterText
            ]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>🎧 Select Audio File:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedAudioId}
            onValueChange={(itemValue) => setSelectedAudioId(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="🎧 Choose an audio file..." value="" />
            {filteredData.map((item, index) => (
              <Picker.Item
                key={item.id}
                label={`${item.filename.toUpperCase()}`}
                value={item.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.audioControls}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => {
            const selectedItem = filteredData.find(
              (item) => item.id === selectedAudioId
            );
            if (selectedItem) {
              togglePlayPause(selectedItem.link, selectedItem.id);
            } else {
              Alert.alert('Please select an audio file.');
            }
          }}
          disabled={isLoading}
        >
          <Text style={styles.playButtonText}>
            {isLoading ? '⏳' : '▶️'} Play/Pause
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stopButton}
          onPress={stopAudio}
        >
          <Text style={styles.stopButtonText}>⏹️ Stop</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => {
         const selectedItem = filteredData.find(
    (item) => item.id === selectedAudioId
  );
  if (selectedItem) {    
    DynamicDataApi.downloadAudioFile(
      selectedItem.link,
      selectedItem.filename,
      selectedItem.id,
      setIsDownloading,
      setDownloadProgress
    );
  } else {
    Alert.alert('Please select an audio file to download.');
  }
          }}
          disabled={isDownloading}
        >
          <Text style={styles.downloadButtonText}>
            {isDownloading ? '📥' : '⬇️'} Download
          </Text>
        </TouchableOpacity>
      </View>

      {Object.keys(downloadProgress).length > 0 && (
        <View style={styles.downloadProgressContainer}>
          <Text style={styles.downloadProgressText}>
            📥 Downloading: {downloadProgress[Object.keys(downloadProgress)[0]]}%
          </Text>
          <View style={styles.downloadProgressBar}>
            <View
              style={[
                styles.downloadProgressFill,
                {
                  width: `${downloadProgress[Object.keys(downloadProgress)[0]]}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      {(currentPlayingId && playbackStatus.isLoaded) && (
        <View style={styles.progressContainer}>
          <Text style={styles.nowPlayingText}>🎵 Now Playing</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(playbackStatus.positionMillis /
                    playbackStatus.durationMillis) *
                    100 || 0}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {formatDuration(playbackStatus.positionMillis / 1000)} /{' '}
            {formatDuration(playbackStatus.durationMillis / 1000)}
          </Text>
        </View>
      )}

      {renderTimePickerModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    padding: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976D2',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#BBDEFB',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    flex: 1,
  },
  refreshButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#424242',
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBDEFB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
    marginTop: 8,
  },
  timeFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeFilterSelectedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timeFilterSelectedIconText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  timeFilterSelectedTextContainer: {
    flex: 1,
  },
  timeFilterSelectedLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeFilterSelectedDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selectedFilter: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1976D2',
  },
  selectedFilterText: {
    color: '#FFFFFF',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  picker: {
    height: 50,
  },
  audioControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  stopButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  pauseButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  recordButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  disabledButtonText: {
    color: '#666666',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  audioSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: 16,
  },
  timeDisplay: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginVertical: 8,
  },
  volumeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  volumeIcon: {
    marginHorizontal: 8,
  },
  progressContainer: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  downloadContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  downloadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  downloadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  downloadPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    minWidth: 50,
    textAlign: 'right',
  },
  downloadProgressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  downloadProgressContainer :{
color: '#2196F3',
  },
  downloadProgressText : {
    color: 'black',
    fontWeight: 'bold',
  },
  downloadProgressFill: {
    height: 8,
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  downloadStatus: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
  },
  downloadSpeed: {
    fontSize: 11,
    color: '#999999',
    marginTop: 4,
  },
  downloadComplete: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  downloadCompleteText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  downloadError: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 1,
  },
  downloadErrorText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
export default AudioFileAuditReport;
