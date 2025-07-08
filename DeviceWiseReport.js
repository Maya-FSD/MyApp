import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Icon } from '@rneui/themed';
import { BarChart } from 'react-native-chart-kit';
import moment from 'moment';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAllCalls } from './DynamicDataApi';

const screenWidth = Dimensions.get('window').width;

const DeviceWiseReport = () => {
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [deviceList, setDeviceList] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [callData, setCallData] = useState([]);
  const [errorTrends, setErrorTrends] = useState([]);
  const [avgCallDuration, setAvgCallDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  const timeRanges = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'this_week' },
    { label: 'This Month', value: 'this_month' },
    { label: 'This Year', value: 'this_year' },
  ];

  const filterDataByTimeRange = (data, timeRange) => {
    const now = moment();
    return data.filter(item => {
      const itemDate = moment(item.created_at);
      switch (timeRange) {
        case 'today':
          return itemDate.isSame(now, 'day');
        case 'this_week':
          return itemDate.isSame(now, 'week');
        case 'this_month':
          return itemDate.isSame(now, 'month');
        case 'this_year':
          return itemDate.isSame(now, 'year');
        default:
          return true;
      }
    });
  };

  const createDeviceDisplayName = (deviceInfo, deviceIndex) => {
    // Extract device name and version from device_info
    // Handle cases like "okhttp/4.12.0", "okhttp/4.9.2"
    const parts = deviceInfo.split('/');
    if (parts.length >= 2) {
      const deviceName = parts[0];
      const version = parts[1];
      return `Device${deviceIndex + 1}[${deviceName}/${version}]`;
    }
    return `Device${deviceIndex + 1}[${deviceInfo}]`;
  };

  useEffect(() => {
    const fetchCallData = async () => {
      try {
        const callsData = await getAllCalls(); 
        setCallData(callsData);
        
        // Filter data with device_info
        const data = callsData.filter(item => item.device_info);
        setReportData(data);
        
        // Get unique devices with display names
        const uniqueDevices = [...new Set(data.map(item => item.device_info))];
        const deviceOptions = uniqueDevices.map((device, index) => ({
          original: device,
          display: createDeviceDisplayName(device, index)
        }));
        
        setDeviceList(deviceOptions);
      } catch (error) {
        console.error('Error fetching call data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCallData();
  }, []);

  useEffect(() => {
    // Filter data by time range first
    const timeFilteredData = filterDataByTimeRange(reportData, selectedTimeRange);
    setFilteredData(timeFilteredData);
    
    if (selectedDevice) {
      const deviceFilteredData = timeFilteredData.filter(item => item.device_info === selectedDevice);
      
      const errors = deviceFilteredData.map(item => item.error_message);
      setErrorTrends(errors);

      const avg = deviceFilteredData.reduce((sum, item) => sum + parseFloat(item.duration || 0), 0) / deviceFilteredData.length;
      setAvgCallDuration(avg || 0);
    }
  }, [selectedDevice, selectedTimeRange, reportData]);

  const exportCSV = async () => {
    const filtered = filteredData.filter(item => item.device_info === selectedDevice);
    const deviceIndex = deviceList.findIndex(device => device.original === selectedDevice);
    const header = 'Device,IP Address,Error Message,Duration,Date\n';
    const rows = filtered.map(item =>
      `${createDeviceDisplayName(item.device_info, deviceIndex)},${item.ip_address || 'N/A'},${item.error_message || 'None'},${item.duration},${moment(item.created_at).format('YYYY-MM-DD HH:mm:ss')}`
    ).join('\n');

    const csv = header + rows;
    const fileName = `device_report_${selectedTimeRange}_${moment().format('YYYY-MM-DD')}.csv`;
    const uri = FileSystem.documentDirectory + fileName;

    try {
      await FileSystem.writeAsStringAsync(uri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Error', 'Sharing is not available on this device.');
        return;
      }

      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Export failed', error);
      Alert.alert('Error', 'Failed to export CSV.');
    }
  };

  const getSelectedDeviceDisplayName = () => {
    const deviceObj = deviceList.find(device => device.original === selectedDevice);
    return deviceObj ? deviceObj.display : selectedDevice;
  };

  if (loading) {
    return <Text style={{ padding: 20 }}>Loading device report...</Text>;
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.header}>
          <Icon name="device-hub" type="material" size={30} color="#FF5722" />
          <Text style={styles.title}>Device-Wise Report</Text>
        </View>

        {/* Time Range Picker */}
        <Text style={styles.filterTitle}>Select Time Range</Text>
        <Picker
          selectedValue={selectedTimeRange}
          style={styles.picker}
          onValueChange={(value) => setSelectedTimeRange(value)}
        >
          {timeRanges.map((range) => (
            <Picker.Item key={range.value} label={range.label} value={range.value} />
          ))}
        </Picker>

        {/* Device Picker */}
        <Text style={styles.filterTitle}>Select Device</Text>
        <Picker
          selectedValue={selectedDevice}
          style={styles.picker}
          onValueChange={(value) => setSelectedDevice(value)}
        >
          <Picker.Item label="Select Device" value="" />
          {deviceList.map((device, index) => (
            <Picker.Item key={index} label={device.display} value={device.original} />
          ))}
        </Picker>

        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Summary for {timeRanges.find(r => r.value === selectedTimeRange)?.label}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Calls:</Text>
            <Text style={styles.summaryValue}>{filteredData.length}</Text>
          </View>
          {selectedDevice && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Device Calls:</Text>
                <Text style={styles.summaryValue}>
                  {filteredData.filter(item => item.device_info === selectedDevice).length}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Avg Duration:</Text>
                <Text style={styles.summaryValue}>{avgCallDuration.toFixed(2)}s</Text>
              </View>
            </>
          )}
        </View>

        {/* Device Usage Chart */}
        {selectedDevice && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Total Calls by {getSelectedDeviceDisplayName()}</Text>
            <BarChart
              data={{
                labels: [getSelectedDeviceDisplayName()],
                datasets: [{ 
                  data: [filteredData.filter(item => item.device_info === selectedDevice).length] 
                }]
              }}
              width={screenWidth - 40}
              height={220}
              fromZero
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              }}
              style={{ marginVertical: 10, borderRadius: 16 }}
            />
          </View>
        )}

        {/* Error Trends */}
        {selectedDevice && errorTrends.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Error Messages for {getSelectedDeviceDisplayName()}</Text>
            <BarChart
              data={{
                labels: errorTrends.map((_, i) => `#${i + 1}`),
                datasets: [{ data: errorTrends.map(err => err ? 1 : 0) }]
              }}
              width={screenWidth - 40}
              height={220}
              fromZero
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 87, 34, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              }}
              style={{ marginVertical: 10, borderRadius: 16 }}
            />
          </View>
        )}

        {/* IP Address List */}
        {selectedDevice && (
          <View style={styles.ipSection}>
            <Text style={styles.chartTitle}>IP Addresses for {getSelectedDeviceDisplayName()}</Text>
            <View style={styles.ipList}>
              {[...new Set(filteredData
                .filter(item => item.device_info === selectedDevice && item.ip_address)
                .map(item => item.ip_address)
              )].map((ip, index) => (
                <View key={index} style={styles.ipItem}>
                  <Icon name="computer" type="material" size={16} color="#2196F3" />
                  <Text style={styles.ipText}>{ip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CSV Download */}
        {selectedDevice && (
          <TouchableOpacity style={styles.downloadButton} onPress={exportCSV}>
            <Icon name="download" type="material" size={25} color="#fff" />
            <Text style={styles.downloadText}>Download CSV</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

export default DeviceWiseReport;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 20,
  },
  summarySection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  chartSection: {
    marginBottom: 30,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsSection: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsValue: {
    fontSize: 16,
    color: '#333',
  },
  ipSection: {
    marginBottom: 20,
  },
  ipList: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  ipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ipText: {
    fontSize: 14,
    marginLeft: 10,
    color: '#333',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5722',
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 10,
  },
  downloadText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
});