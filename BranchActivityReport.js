import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
} from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

import {
  getAllCodes,
  getAllCalls,
  getAllUsers,
  getAllBranches,
  getCodeById,
  getUserById,
  getBranchById,
  initData,
  getAllCodeMappings,
} from './DynamicDataApi';

const screenWidth = Dimensions.get('window').width;

const safeNumber = (value) => {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
};

const CodePerformanceReport = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [mappedData, setMappedData] = useState([]);
  const [callData, setCallData] = useState([]);
  const [reportData, setReportData] = useState({
    codeActivations: [],
    branchActivations: [],
    userActivations: [],
    timelineData: { labels: [], datasets: [{ data: [] }] },
    statusCounts: { active: 0, inactive: 0 },
    averageDuration: 0,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const success = await initData();
      const result = await getAllCodeMappings();
      if (result && result.mappedData) {
        setMappedData(result.mappedData);
      }
      if (!success) {
        Alert.alert('Error', 'Failed to load data from server.');
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (mappedData.length > 0) {
      generateReportData();
    }
  }, [mappedData]);

  const generateReportData = async () => {
  // Get all data first
  const callsData = await getAllCalls();
  const usersData = await getAllUsers();
  const branchesData = await getAllBranches();
  const codesData = await getAllCodes();
  
  // Set the call data state
  setCallData(callsData);
  
  // Use the local callsData variable instead of callData state
  //console.log("CallData", "-------------------", callsData);
  
  // Check if we have data
  if (!callsData || callsData.length === 0) {
    console.log("No call data available");
    return;
  }

  // 1. Code Activations
  const codeCountMap = {};
  callsData.forEach((call) => {
    if (!codeCountMap[call.code_id]) {
      codeCountMap[call.code_id] = 0;
    }
    codeCountMap[call.code_id]++;
  });

  const codeActivations = Object.keys(codeCountMap).map((id) => {
    const code = getCodeById(id);
    return {
      id: id,
      name: code ? code.code_name : `Unknown (${id})`,
      color: code ? code.code_color : '#000000',
      purpose: code ? code.code_purpose : 'Unknown',
      count: codeCountMap[id],
    };
  });

  // 2. Branch Activations
  const branchCountMap = {};
  callsData.forEach((call) => {
    const mapping = mappedData.find(
      (item) => String(item.codeid) === String(call.code_id)
    );
    if (mapping) {
      if (!branchCountMap[mapping.branchid]) {
        branchCountMap[mapping.branchid] = 0;
      }
      branchCountMap[mapping.branchid]++;
    }
  });

  const branchActivations = Object.keys(branchCountMap).map((branchId) => {
    const branch = getBranchById(safeNumber(branchId));
    return {
      id: branchId,
      name: branch ? branch.name : `Unknown (${branchId})`,
      location: branch ? branch.location : 'Unknown',
      count: branchCountMap[branchId],
    };
  });

  // 3. User Activations
  const userCountMap = {};
  callsData.forEach((call) => {
    if (!userCountMap[call.performed_by_user_id]) {
      userCountMap[call.performed_by_user_id] = 0;
    }
    userCountMap[call.performed_by_user_id]++;
  });

  const userActivations = Object.keys(userCountMap).map((id) => {
    const user = getUserById(safeNumber(id));
    return {
      id: id,
      name: user ? `${user.first_name} ${user.last_name}` : `Unknown (${id})`,
      count: userCountMap[id],
    };
  });

  // 4. Timeline Data
  const monthlyData = {};
  callsData.forEach((call) => {
    const date = new Date(call.created_at);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = 0;
    }
    monthlyData[monthKey]++;
  });

  const timelineLabels = Object.keys(monthlyData).sort();
  const timelineData = {
    labels: timelineLabels.map((month) => {
      const [year, m] = month.split('-');
      return `${m}/${year.slice(2)}`;
    }),
    datasets: [
      {
        data: timelineLabels.map((month) => monthlyData[month]),
        color: (opacity = 1) => `rgba(71, 136, 241, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // 5. Status Counts
  const statusCounts = {
    active: callsData.filter((call) => call.status === 'ACTIVE').length,
    inactive: callsData.filter((call) => call.status === 'INACTIVE').length,
  };

  // 6. Average Duration
  const totalDuration = callsData.reduce((acc, call) => {
    const d = safeNumber(call.duration);
    return acc + d;
  }, 0);

  const averageDuration =
    callsData.length > 0 ? totalDuration / callsData.length : 0;

  setReportData({
    codeActivations,
    branchActivations,
    userActivations,
    timelineData,
    statusCounts,
    averageDuration,
  });
};
  const isEmpty = (arr) => !arr || arr.length === 0;

  const renderOverviewTab = () => {
    const { codeActivations, statusCounts, averageDuration, timelineData } =
      reportData;

    const pieChartData = codeActivations.slice(0, 5).map((code) => ({
      name: code.name,
      count: code.count,
      color: code.color,
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));

    const progressData = {
      labels: ['Active', 'Inactive'],
      data: [
        statusCounts.active /
          (statusCounts.active + statusCounts.inactive || 1),
        statusCounts.inactive /
          (statusCounts.active + statusCounts.inactive || 1),
      ],
      colors: ['#4CAF50', '#F44336'],
    };

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Emergency Code Activations</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {statusCounts.active + statusCounts.inactive}
            </Text>
            <Text style={styles.statLabel}>Total Activations</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{codeActivations.length}</Text>
            <Text style={styles.statLabel}>Code Types</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {averageDuration.toFixed(2)}s
            </Text>
            <Text style={styles.statLabel}>Avg Duration</Text>
          </View>
        </View>

        {!isEmpty(timelineData.labels) && (
          <>
            <Text style={styles.chartTitle}>Timeline</Text>
            <LineChart
              data={timelineData}
              width={screenWidth - 40}
              height={220}
              yAxisSuffix=""
              chartConfig={chartConfig()}
              bezier
              style={chartStyle()}
            />
          </>
        )}

        {!isEmpty(pieChartData) && (
          <>
            <Text style={styles.chartTitle}>Top Codes</Text>
            <PieChart
              data={pieChartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig()}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              style={chartStyle()}
            />
          </>
        )}
      </View>
    );
  };

  const chartConfig = () => ({
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(71, 136, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  });

  const chartStyle = () => ({
    marginVertical: 8,
    borderRadius: 16,
  });

  const renderCodesTab = () => {
  const { codeActivations } = reportData;

  const barData = {
    labels: codeActivations.slice(0, 5).map(code => code.name.substring(0, 6)),
    datasets: [
      {
        data: codeActivations.slice(0, 5).map(code => code.count)
      }
    ]
  };

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Code Type Analysis</Text>

      <BarChart
        data={barData}
        width={screenWidth - 40}
        height={220}
        yAxisSuffix=""
        fromZero
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(71, 136, 241, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          barPercentage: 0.5,
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />

      <Text style={styles.chartTitle}>Code Activation Details</Text>

      {codeActivations.length === 0 ? (
        <Text style={styles.emptyStateText}>No code activation data.</Text>
      ) : (
        codeActivations.map((code) => (
          <View key={code.id} style={styles.itemBox}>
            <View style={[styles.colorDot, { backgroundColor: code.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{code.name}</Text>
              <Text style={styles.itemSubtitle}>Purpose: {code.purpose}</Text>
            </View>
            <Text style={styles.itemCount}>{code.count}</Text>
          </View>
        ))
      )}
    </View>
  );
};
const renderUsersTab = () => {
  const { userActivations } = reportData;

  const barData = {
    labels: userActivations.slice(0, 5).map(user => user.name.split(' ')[0]),
    datasets: [
      {
        data: userActivations.slice(0, 5).map(user => user.count)
      }
    ]
  };

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>User Activation Performance</Text>

      <BarChart
        data={barData}
        width={screenWidth - 40}
        height={220}
        fromZero
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(138, 43, 226, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          barPercentage: 0.5,
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />

      <Text style={styles.chartTitle}>User Activation Details</Text>

      {userActivations.length === 0 ? (
        <Text style={styles.emptyStateText}>No user activation data.</Text>
      ) : (
        userActivations.map((user) => (
          <View key={user.id} style={styles.itemBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{user.name}</Text>
            </View>
            <Text style={styles.itemCount}>{user.count}</Text>
          </View>
        ))
      )}
    </View>
  );
};

const renderBranchesTab = () => {
  const { branchActivations } = reportData;

  const barData = {
    labels: branchActivations.slice(0, 5).map(branch => branch.name.substring(0, 6)),
    datasets: [
      {
        data: branchActivations.slice(0, 5).map(branch => branch.count)
      }
    ]
  };

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Branch Activation Analysis</Text>

      <BarChart
        data={barData}
        width={screenWidth - 40}
        height={220}
        fromZero
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(34, 139, 34, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          barPercentage: 0.5,
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />

      <Text style={styles.chartTitle}>Branch Activation Details</Text>

      {branchActivations.length === 0 ? (
        <Text style={styles.emptyStateText}>No branch activation data.</Text>
      ) : (
        branchActivations.map((branch) => (
          <View key={branch.id} style={styles.itemBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{branch.name}</Text>
              <Text style={styles.itemSubtitle}>Location: {branch.location}</Text>
            </View>
            <Text style={styles.itemCount}>{branch.count}</Text>
          </View>
        ))
      )}
    </View>
  );
};


 const renderActiveTab = () => {
  switch (activeTab) {
    case 'overview':
      return renderOverviewTab();
    case 'codes':
      return renderCodesTab();
    case 'branches':
      return renderBranchesTab();
    case 'users':
      return renderUsersTab();
    default:
      return renderOverviewTab();
  }
};


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Code Performance Report</Text>
      </View>

      <View style={styles.tabBar}>
        {['overview', 'codes', 'branches', 'users'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab && styles.activeTabButtonText,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E88E5" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          renderActiveTab()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: { backgroundColor: '#1E88E5', padding: 16, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTabButton: { borderBottomWidth: 3, borderBottomColor: '#1E88E5' },
  tabButtonText: { fontSize: 14, fontWeight: '500', color: '#666' },
  activeTabButtonText: { color: '#1E88E5', fontWeight: 'bold' },
  content: { flex: 1 },
  loadingContainer: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  tabContent: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  chartTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: '#333' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 8, marginHorizontal: 5, elevation: 2, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#1E88E5', marginBottom: 5 },
  statLabel: { fontSize: 12, color: '#666', textAlign: 'center' },
  emptyStateText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 20 },
  itemBox: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#fff',
  padding: 15,
  borderRadius: 8,
  marginBottom: 10,
  elevation: 2,
},
colorDot: {
  width: 12,
  height: 12,
  borderRadius: 6,
  marginRight: 10,
},
itemTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#333',
},
itemSubtitle: {
  fontSize: 12,
  color: '#666',
  marginTop: 2,
},
itemCount: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#1E88E5',
},

});

export default CodePerformanceReport;
