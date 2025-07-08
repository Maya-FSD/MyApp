import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator, 
  Alert,
  RefreshControl,
  ScrollView 
} from 'react-native';
import { Icon } from '@rneui/themed';
import { LineChart } from 'react-native-chart-kit';
import moment from 'moment';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import {  getAllCalls  as getuserAudit1} from './DynamicDataApi';

const screenWidth = Dimensions.get("window").width;

const TriggerReport = () => {
  const [triggerData, setTriggerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Today');

  const dateRanges = {
    'Today': {
      start: moment().startOf('day').toDate(),
      end: moment().endOf('day').toDate()
    },
    'This Week': {
      start: moment().startOf('week').toDate(),
      end: moment().endOf('week').toDate()
    },
    'This Month': {
      start: moment().startOf('month').toDate(),
      end: moment().endOf('month').toDate()
    },
    'This Year': {
      start: moment().startOf('year').toDate(),
      end: moment().endOf('year').toDate()
    }
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const callData = await getuserAudit1();
      const filtered = callData.filter(item => item.action === 'CODE_TRIGGER');
      setTriggerData(filtered);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load trigger data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Set default to today's date range
    const todayRange = dateRanges['Today'];
    setStartDate(todayRange.start);
    setEndDate(todayRange.end);
  }, []);

  const handleTabPress = (tabName) => {
    setSelectedTab(tabName);
    const range = dateRanges[tabName];
    setStartDate(range.start);
    setEndDate(range.end);
  };

  const filteredData = useMemo(() => {
    return triggerData.filter(item => {
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [triggerData, startDate, endDate]);

  const { dates, counts, durations } = useMemo(() => {
    const groupedData = filteredData.reduce((acc, trigger) => {
      try {
        const date = moment(trigger.created_at).startOf('day').format('YYYY-MM-DD');
        if (!acc[date]) acc[date] = { count: 0, duration: 0 };
        acc[date].count += 1;
        acc[date].duration += parseFloat(trigger.duration || 0);
      } catch (error) {
        console.warn('Error processing trigger:', trigger, error);
      }
      return acc;
    }, {});

    const sortedDates = Object.keys(groupedData).sort();
    return {
      dates: sortedDates,
      counts: sortedDates.map(date => groupedData[date].count),
      durations: sortedDates.map(date => groupedData[date].duration)
    };
  }, [filteredData]);

  const exportCSV = async () => {
    try {
      if (dates.length === 0) {
        Alert.alert('No Data', 'There is no data to export');
        return;
      }

      const header = 'Date,Trigger Count,Total Duration (sec)\n';
      const rows = dates.map((date, index) => 
        `${date},${counts[index]},${durations[index].toFixed(2)}`
      ).join('\n');

      const csvString = header + rows;
      const fileUri = FileSystem.documentDirectory + `trigger_report_${moment().format('YYYYMMDD_HHmmss')}.csv`;

      await FileSystem.writeAsStringAsync(fileUri, csvString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Share Trigger Report',
        UTI: 'public.comma-separated-values-text'
      });
    } catch (err) {
      console.error('CSV export error:', err);
      Alert.alert('Error', 'Failed to export CSV');
    }
  };

  const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);

  const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      setSelectedTab('Custom'); // Switch to custom when manual date is selected
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      setSelectedTab('Custom'); // Switch to custom when manual date is selected
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Loading Trigger Report...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="alarm" type="material" size={30} color="#FF5722" />
        <Text style={styles.title}>Trigger Report</Text>
        <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
        </TouchableOpacity>
      </View>

      {/* Date Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContentContainer}
      >
        {Object.keys(dateRanges).map((tabName) => (
          <TouchableOpacity
            key={tabName}
            style={[
              styles.tab,
              selectedTab === tabName && styles.activeTab
            ]}
            onPress={() => handleTabPress(tabName)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tabName && styles.activeTabText
            ]}>
              {tabName}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'Custom' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('Custom')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'Custom' && styles.activeTabText
          ]}>
            Custom
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Date Picker - Only show when Custom tab is selected */}
      {selectedTab === 'Custom' && (
        <View style={styles.dateFilterContainer}>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              From: {moment(startDate).format('MMM D, YYYY')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              To: {moment(endDate).format('MMM D, YYYY')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onStartDateChange}
          maximumDate={new Date()}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={onEndDateChange}
          minimumDate={startDate}
          maximumDate={new Date()}
        />
      )}

      <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={false}>
        {dates.length > 0 ? (
          <>
            <LineChart
            data={{
              labels: dates.map(date => moment(date).format('MMM D')),
              datasets: [{ data: counts }],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 87, 34, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              propsForLabels: {
                fontSize: 10,
              },
              propsForVerticalLabels: {
                rotation: -90,
                dx: -4,
                dy: 0,
                yOffset: 10
              },
              propsForHorizontalLabels: {
                rotation: -45,
                dx: -6,
                dy: 5,
                width: 60,
                yOffset: 10
              }
            }}
            bezier
            style={styles.chart}
            fromZero
            withHorizontalLabels={true}
            withVerticalLabels={true}
            segments={4}
            yAxisInterval={1}
            xLabelsOffset={-10}
            yLabelsOffset={5}
          />

          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              Total Triggers: {counts.reduce((a, b) => a + b, 0)}
            </Text>
            <Text style={styles.summaryText}>
              Total Duration: {totalDuration.toFixed(2)} seconds
            </Text>
            <Text style={styles.summaryText}>
              Period: {selectedTab !== 'Custom' ? selectedTab : `${moment(startDate).format('MMM D, YYYY')} - ${moment(endDate).format('MMM D, YYYY')}`}
            </Text>
          </View>

            <FlatList
              data={dates}
              keyExtractor={(item) => item}
              scrollEnabled={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={fetchData}
                  colors={['#FF5722']}
                />
              }
              renderItem={({ item, index }) => (
                <View style={styles.triggerCard}>
                  <Text style={styles.date}>{moment(item).format('MMMM D, YYYY')}</Text>
                  <View style={styles.triggerDetails}>
                    <Text style={styles.triggerCount}>Triggers: {counts[index]}</Text>
                    <Text style={styles.triggerDuration}>
                      Duration: {durations[index].toFixed(2)} secs
                    </Text>
                  </View>
                </View>
              )}
            />
          </>
        ) : (
          <View style={styles.emptyContainer}>         
            <Text style={styles.emptyText}>
              No Trigger data found for {selectedTab !== 'Custom' ? selectedTab.toLowerCase() : 'selected date range'}
            </Text>
            <TouchableOpacity onPress={fetchData} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.downloadButton} 
        onPress={exportCSV}
        disabled={dates.length === 0}
      >
        <Icon name="download" type="material" size={25} color="white" />
        <Text style={styles.downloadText}>Export as CSV</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  refreshButton: {
    padding: 5,
  },
  tabContainer: {
    marginBottom: 15,
    maxHeight: 50,
  },
  tabContentContainer: {
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  tabText: {
    color: '#666',
    fontWeight: '400',
    fontSize: 11,
    textAlign: 'center',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '500',
  },
  dateFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  dateButton: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    minHeight: 36,
  },
  dateButtonText: {
    color: '#FF5722',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 10,
    marginBottom: 15,
    paddingRight: 20,
    backgroundColor: 'white',
    elevation: 2,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 3,
  },
  triggerCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  triggerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  triggerCount: {
    fontSize: 14,
    color: '#FF5722',
  },
  triggerDuration: {
    fontSize: 14,
    color: '#4CAF50',
  },
  downloadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 15,
    elevation: 2,
    opacity: 1,
  },
  downloadText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FF5722',
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  contentScrollView: {
    flex: 1,
  },
});

export default TriggerReport;