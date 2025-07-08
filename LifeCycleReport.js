import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions
} from 'react-native';
import { BarChart, StackedBarChart } from 'react-native-chart-kit';
import moment from 'moment';
import { 
  getuserAudit1, 
  getBranches1, 
  getUsers1, 
  getCustomers1, 
  getCode1,
  getAllCodeMappings,
} from './ApidataDynamic';

const screenWidth = Dimensions.get('window').width;
const dateRanges = ['Today', 'This Week', 'This Month', 'This Year'];

const LifeCycleReport = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState('Today');
  const [activeTab, setActiveTab] = useState('summary');
  const [data, setData] = useState({
    calls: [],
    branches: [],
    users: [],
    tenants: [],
    codes: [],
    mappings: [],
    statusCounts: { ACTIVE: 0, DEACTIVATED: 0 }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [calls, branches, users, tenants, codes, mappings] = await Promise.all([
        getuserAudit1(),
        getBranches1(),
        getUsers1(),
        getCustomers1(),
        getCode1(),
        getAllCodeMappings()
      ]);

      const statusCounts = { ACTIVE: 0, DEACTIVATED: 0 };
      calls.forEach(item => {
        const status = item.status?.toUpperCase();
        if (status && statusCounts.hasOwnProperty(status)) {
          statusCounts[status]++;
        }
      });

      setData({ calls, branches, users, tenants, codes, mappings, statusCounts });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => { fetchData(); }, []);

  const getFilteredCalls = () => {
    const now = moment();
    return data.calls.filter(call => {
      const date = moment(call.created_at);
      switch (selectedRange) {
        case 'Today': return date.isSame(now, 'day');
        case 'This Week': return date.isSame(now, 'week');
        case 'This Month': return date.isSame(now, 'month');
        case 'This Year': return date.isSame(now, 'year');
        default: return true;
      }
    });
  };

  const filteredCalls = getFilteredCalls();

  const getTimelineData = () => {
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayLabels = ['Morning', 'Afternoon', 'Evening'];

    let labels = [];
    let dataMap = {};

    switch (selectedRange) {
      case 'This Month':
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        dataMap = { 'Week 1': 0, 'Week 2': 0, 'Week 3': 0, 'Week 4': 0 };
        filteredCalls.forEach((item) => {
          const week = Math.ceil(moment(item.created_at).date() / 7);
          dataMap[`Week ${week}`] += 1;        
        });
        break;
      case 'This Week':
        labels = weekLabels;
        dataMap = Object.fromEntries(labels.map((day) => [day, 0]));
        filteredCalls.forEach((item) => {
          const day = moment(item.created_at).format('ddd');
          dataMap[day] = (dataMap[day] || 0) + 1;
        });
        break;
      case 'This Year':
        labels = monthLabels;
        dataMap = Object.fromEntries(labels.map((m) => [m, 0]));
        filteredCalls.forEach((item) => {
          const month = moment(item.created_at).format('MMM');
          dataMap[month] = (dataMap[month] || 0) + 1;
        });
        break;
      case 'Today':
        labels = dayLabels;
        dataMap = { Morning: 0, Afternoon: 0, Evening: 0 };
        filteredCalls.forEach((item) => {
          const hour = moment(item.created_at).hour();
          if (hour < 12) dataMap.Morning += 1;
          else if (hour < 17) dataMap.Afternoon += 1;
          else dataMap.Evening += 1;
        });
    }

    return { labels, datasets: [{ data: labels.map((label) => dataMap[label] || 0) }] };
  };

  const timelineData = getTimelineData();
  const totalCalls = filteredCalls.length;

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(71, 136, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    propsForLabels: { fontSize: 12, fontWeight: '500' },
    propsForBackgroundLines: { strokeWidth: 0.5, strokeDasharray: '5,5' },
    fillShadowGradient: '#4788F1',
    fillShadowGradientOpacity: 0.3,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    barRadius: 4
  };

  const statusColors = { ACTIVE: '#4CAF50', DEACTIVATED: '#F44336' };
  const getStatusCounts = (calls) => {
    const counts = { ACTIVE: 0, DEACTIVATED: 0 };
    calls.forEach(item => {
      const status = item.status?.toUpperCase();
      if (status && counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });
    return counts;
  };

   const getFilteredData = () => {
    const now = moment();
    const filtered = data.calls.filter(call => {
      const date = moment(call.created_at);
      switch (selectedRange) {
        case 'Today': return date.isSame(now, 'day');
        case 'This Week': return date.isSame(now, 'week');
        case 'This Month': return date.isSame(now, 'month');
        case 'This Year': return date.isSame(now, 'year');
        default: return true;
      }
    });
    
    return {
      filteredCalls1: filtered,
      filteredStatusCounts: getStatusCounts(filtered),
      totalFilteredCalls: filtered.length
    };
  };

const { filteredCalls1, filteredStatusCounts, totalFilteredCalls } = getFilteredData();

  // Status distribution data using filtered counts
  const renderHorizontalStatusDistribution = () => {
    const total = Object.values(filteredStatusCounts).reduce((sum, count) => sum + count, 0);
    
    return (
      <View style={styles.horizontalStatusContainer}>
        <Text style={styles.sectionTitle}>Status Distribution</Text>
        <View style={styles.barContainer}>
          {Object.entries(filteredStatusCounts).map(([status, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <View key={status} style={styles.statusBarWrapper}>
                <Text style={styles.statusLabel}>
                  {status}: {count} ({percentage.toFixed(1)}%)
                </Text>
                <View style={styles.barBackground}>
                  <View 
                    style={[
                      styles.barFill,
                      { 
                        width: `${percentage}%`,
                        backgroundColor: statusColors[status] || '#9E9E9E'
                      }
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

 //const statusDistributionData = getStatusDistributionData();

  const renderSummaryTab = () => (
    <>
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Calls</Text>
          <Text style={styles.cardValue}>{totalCalls}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Branches</Text>
          <Text style={styles.cardValue}>{data.branches.length}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Users</Text>
          <Text style={styles.cardValue}>{data.users.length}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tenants</Text>
          <Text style={styles.cardValue}>{data.tenants.length}</Text>
        </View>
      </View>

        {renderHorizontalStatusDistribution()}

      <Text style={styles.sectionTitle}>Activity Timeline</Text>
      <View style={styles.chartContainer}>
        <BarChart
          data={timelineData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          style={styles.chartStyle}
        />
      </View>
    </>
  );
const renderItem = ({ item }) => {
    switch (activeTab) {
      case 'branches':
        return (
          <View style={styles.listItem}>
            <Text style={styles.listItemTitle}>{item.name}</Text>
            <Text style={styles.listItemSubtitle}>{item.location}</Text>
          </View>
        );
      case 'users':
        return (
          <View style={styles.listItem}>
            <Text style={styles.listItemTitle}>{item.first_name}</Text>
            <Text style={styles.listItemSubtitle}>{item.phone}</Text>
          </View>
        );
      case 'tenants':
        return (
          <View style={styles.listItem}>
            <Text style={styles.listItemTitle}>{item.customer_name}</Text>
            <Text style={styles.listItemSubtitle}>{item.city}</Text>
          </View>
        );
      case 'codes':
        return (
          <View style={styles.listItem}>
            <Text style={styles.listItemTitle}>{item.code_name}</Text>
            <Text style={styles.listItemSubtitle}>{item.code_purpose}</Text>
          </View>
        );
      case 'activations':
        return (
          <View style={styles.listItem}>
            <Text style={styles.listItemTitle}>Code: {item.code_id}</Text>
            <Text style={styles.listItemSubtitle}>
              {moment(item.created_at).format('MMM D, YYYY h:mm A')}
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  const getData = () => {
    switch (activeTab) {
      case 'branches': return data.branches;
      case 'users': return data.users;
      case 'tenants': return data.tenants;
      case 'codes': return data.codes;
      case 'activations': return filteredCalls.slice(0, 10);
      default: return [];
    }
  };

  const renderContent = () => {
    if (activeTab === 'summary') {
      return renderSummaryTab();
    }

  return (
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>
          {`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} `}
          {activeTab !== 'activations' && `(${getData().length})`}
        </Text>
        <FlatList
          data={getData()}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          ListHeaderComponent={<View style={{ height: 10 }} />}
          ListFooterComponent={<View style={{ height: 20 }} />}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Life Cycle Report</Text>

        <View style={styles.filterContainer}>
          {dateRanges.map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.filterButton,
                selectedRange === range && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedRange(range)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedRange === range && styles.activeFilterButtonText,
              ]}>
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContainer}>
          {['summary', 'branches', 'users', 'tenants', 'codes', 'activations'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabButtonText,
                activeTab === tab && styles.activeTabButtonText,
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1E88E5" style={styles.loader} />
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={renderContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          ListEmptyComponent={null}
          keyExtractor={() => 'dummy'}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  headerContainer: { padding: 15 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#1E88E5', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10, paddingHorizontal: 15 },
  cardContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 15 },
  card: { backgroundColor: '#ffffff', width: (screenWidth - 60) / 2, marginBottom: 12, padding: 14, borderRadius: 12 },
  cardTitle: { fontSize: 14, color: '#999' },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#1E88E5' },
  chartContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 15, marginHorizontal: 15 },
  chartStyle: { borderRadius: 12, paddingRight: 16 },
  listContainer: { flex: 1, backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 15, marginBottom: 15 },
  listItem: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  listItemTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  listItemSubtitle: { fontSize: 14, color: '#666', marginBottom: 4 },
  filterContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  filterButton: { borderWidth: 1, borderColor: '#1E88E5', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 10 },
  activeFilterButton: { backgroundColor: '#1E88E5' },
  filterButtonText: { color: '#1E88E5', fontSize: 12 },
  activeFilterButtonText: { color: '#fff', fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15 },
  tabButton: { backgroundColor: '#E3F2FD', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8 },
  activeTabButton: { backgroundColor: '#1E88E5' },
  tabButtonText: { color: '#1E88E5', fontSize: 12, textAlign: 'center' },
  activeTabButtonText: { color: '#fff', fontWeight: 'bold' },
    horizontalStatusContainer: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
      marginHorizontal: 15
    },
    barContainer: {
      marginTop: 10
    },
    statusBarWrapper: {
      marginBottom: 12
    },
    statusLabel: {
      fontSize: 14,
      color: '#333',
      marginBottom: 4
    },
    barBackground: {
      height: 10,
      backgroundColor: '#eee',
      borderRadius: 5,
      overflow: 'hidden'
    },
    barFill: {
      height: '100%',
      borderRadius: 5
    },
  loader: { marginTop: 50 }
});

export default LifeCycleReport;