import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import axiosHelper from '../../utils/apiHelper';
import { Card, Icon } from '@rneui/themed';
import { BarChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import moment from 'moment';
import {getAllCodeAudit, getAllBranches} from './DynamicDataApi';

const screenWidth = Dimensions.get('window').width;

const FrequencyReport = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [codesCount, setCodesCount] = useState(0);
  const [branchesData, setBranchesData] = useState([]);
  const [codeMappingData, setCodeMappingData] = useState([]);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [] }]
  });
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostActiveUnit, setMostActiveUnit] = useState('');
  const [leastActiveUnit, setLeastActiveUnit] = useState('');

  // Updated filter buttons
  const buttons = ['This Day', 'This Week', 'This Month', 'This Year'];

  // Fetch branches data
  const fetchBranches = async () => {
    try {
      const response = await getAllBranches();
      const filtered = response.filter(item => item.name);
      const mappedData = filtered.map(item => ({
        id: item.id,
        filename: item.name,
      }));
      setBranchesData(mappedData);
      setCodesCount(mappedData.length);
      console.log(codesCount);
      
      return mappedData;
    } catch (error) {
      console.error('Error fetching branches:', error);
      return [];
    }
  };

   const fetchCodeMappingWithAudits = async () => {
    try {
      console.log("inside frequency");
      const response = await getAllCodeAudit();
      setCodeMappingData(response);
      return response;
    } catch (error) {
      console.error('Error fetching code mapping with audits:', error);
      return [];
    }
  };

    // Process data for chart and table
const processData = (branches, codeMapping) => {
  const branchCodeCounts = {};
  
  // Initialize branch counts
  branches.forEach(branch => {
    branchCodeCounts[branch.id] = {
      name: branch.filename,
      totalCodes: 0,
      activeCodes: 0,
      inactiveCodes: 0,
      totalActiveTime: 0,      // accumulate active durations
      totalInactiveTime: 0,    // accumulate inactive durations
      codeDetails: {}
    };
  });

  // Count codes per branch and sum resolution times
  codeMapping.forEach(mapping => {
    const b = branchCodeCounts[mapping.branch_id];
    if (!b) return;

    b.totalCodes++;

    const rawStatus = mapping.status;
    const status = rawStatus
      ? rawStatus.toString().toUpperCase().trim()
      : '';
    const duration = typeof mapping.timeres === 'number'
      ? mapping.timeres
      : Number(mapping.timeres) || 0;

    if (status === 'ACTIVE') {
      b.activeCodes++;
      b.totalActiveTime += duration;
    } else {
      // treat everything else as inactive
      b.inactiveCodes++;
      b.totalInactiveTime += duration;
      if (!['DEACTIVATED','INACTIVE','DISABLED'].includes(status)) {
        console.log(`Unknown status "${rawStatus}" → counting as inactive`);
      }
    }

    // Count by tsl_code_name
    const codeName = mapping.tsl_code_name || 'Unknown Code';
    b.codeDetails[codeName] = (b.codeDetails[codeName] || 0) + 1;
  });

  // Convert to array and sort by total codes
  const sortedBranches = Object.values(branchCodeCounts)
    .filter(branch => branch.totalCodes > 0)
    .sort((a, b) => b.totalCodes - a.totalCodes);

  // Top 10 for chart
  const topBranches = sortedBranches.slice(0, 10);
  const chartLabels = topBranches.map(b =>
    b.name.length > 10 ? b.name.slice(0, 10) + '...' : b.name
  );
  const chartValues = topBranches.map(b => b.totalCodes);
  setChartData({
    labels: chartLabels,
    datasets: [{ data: chartValues }]
  });

  // Prepare table rows including avg times
  const tableRows = sortedBranches.map(branch => {
    const resolutionPercent = Math.round(
      (branch.activeCodes / branch.totalCodes) * 100
    );

    // Calculate averages
    const avgActiveTime = branch.activeCodes > 0
      ? Math.round(branch.totalActiveTime / branch.activeCodes)
      : 0;
    const avgInactiveTime = branch.inactiveCodes > 0
      ? Math.round(branch.totalInactiveTime / branch.inactiveCodes)
      : 0;

    const totalavgTime =   avgActiveTime +avgInactiveTime;

    // Badge coloring
    let badgeColor = '#10b981'; // green default
    if (resolutionPercent < 60) badgeColor = '#ef4444';
    else if (resolutionPercent < 80) badgeColor = '#fbbf24';

    return [
      branch.name,
      branch.activeCodes.toString(),
      branch.inactiveCodes.toString(),
      `${resolutionPercent}%`,
      `${avgActiveTime} min`,     // new column: avg active time
      `${avgInactiveTime} min`,   // new column: avg inactive time
      `${totalavgTime} min`, 
      badgeColor
    ];
  });

  setTableData(tableRows);
  console.log("sorted", sortedBranches);

  // Most/least active units
  if (sortedBranches.length === 1) {
    setMostActiveUnit(sortedBranches[0].name);
    setLeastActiveUnit('No other branches are active');
  } else if (sortedBranches.length > 1) {
    setMostActiveUnit(sortedBranches[0].name);
    setLeastActiveUnit(sortedBranches[sortedBranches.length - 1].name);
  }
};


  // Updated filter data based on selected time range
  const filterDataByTimeRange = (codeMapping, timeRange) => {
    if (timeRange === 'This Year') return codeMapping;
    
    const now = moment();
    return codeMapping.filter(item => {
      const itemDate = moment(item.createdat || item.created_at);
      switch (timeRange) {
        case 'This Day':
          return itemDate.isSame(now, 'day');
        case 'This Week':
          return itemDate.isSame(now, 'week');
        case 'This Month':
          return itemDate.isSame(now, 'month');
        case 'This Year':
          return itemDate.isSame(now, 'year');
        default:
          return true;
      }
    });
  };

  // Handle export functionality
  const handleExport = async () => {
    try {
      const header = 'Branch Name,Active Codes,Inactive Codes,Resolution %,Avg Time\n';
      const rows = tableData.map(row => 
        `${row[0]},${row[1]},${row[2]},${row[3]},${row[4]}`
      ).join('\n');
      
      const csv = header + rows;
      const fileName = `frequency_report_${moment().format('YYYY-MM-DD')}.csv`;
      const uri = FileSystem.documentDirectory + fileName;

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

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [branches, codeMapping] = await Promise.all([
          fetchBranches(),
          fetchCodeMappingWithAudits() // Using the updated function
        ]);
        
        if (branches.length > 0 && codeMapping.length > 0) {
          processData(branches, codeMapping);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update data when filter changes
  useEffect(() => {
    if (branchesData.length > 0 && codeMappingData.length > 0) {
      const selectedFilter = buttons[selectedIndex];
      const filteredCodeMapping = filterDataByTimeRange(codeMappingData, selectedFilter);
      processData(branchesData, filteredCodeMapping);
    }
  }, [selectedIndex, branchesData, codeMappingData]);

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading frequency report...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Card containerStyle={styles.summaryCard}>
          <Icon name="code" type="font-awesome" size={24} color="#2563eb" />
          <Text style={styles.summaryValue}>{codesCount}</Text>
          <Text style={styles.summaryLabel}>Total Branches</Text>
        </Card>
        <Card containerStyle={styles.summaryCard}>
          <Icon name="trending-up" type="feather" size={24} color="#10b981" />
          <Text style={styles.summaryHighlight} numberOfLines={2}>
            {mostActiveUnit || 'N/A'}
          </Text>
          <Text style={styles.summaryLabel}>Most Active Unit</Text>
        </Card>
        <Card containerStyle={styles.summaryCard}>
          <Icon name="trending-down" type="feather" size={24} color="#ef4444" />
          <Text style={styles.summaryHighlight} numberOfLines={2}>
            {leastActiveUnit || 'N/A'}
          </Text>
          <Text style={styles.summaryLabel}>Least Active Unit</Text>
        </Card>
      </View>

      {/* Chart with Filter */}
      <Card containerStyle={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Code Distribution by Branch</Text>
          <Icon
            name="download"
            type="feather"
            onPress={handleExport}
            color="#2563eb"
            containerStyle={{ paddingRight: 10 }}
          />
        </View>

        {chartData.labels.length > 0 ? (
          <BarChart
            data={chartData}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            fromZero
            showValuesOnTopOfBars
            withInnerLines={true}
            style={{ borderRadius: 8 }}
          />
        ) : (
          <Text style={styles.noDataText}>No data available for chart</Text>
        )}

        {/* Horizontal Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {buttons.map((btn, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.filterButton,
                selectedIndex === index && styles.filterButtonSelected,
              ]}
              onPress={() => setSelectedIndex(index)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedIndex === index && styles.filterTextSelected,
                ]}
              >
                {btn}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>

      {/* Table */}
      <Card containerStyle={styles.tableCard}>
        <ScrollView horizontal>
          <View style={{ minWidth: 600 }}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Branch Name</Text>
              <Text style={styles.tableHeaderText}>Active</Text>
              <Text style={styles.tableHeaderText}>Deactivated</Text>
              <Text style={styles.tableHeaderText}>Resolution %</Text>
              <Text style={styles.tableHeaderText}>Avg. Time</Text>
            </View>

            {tableData.length > 0 ? (
              tableData.map((row, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell} numberOfLines={2}>{row[0]}</Text>
                  <Text style={styles.tableCell}>{row[1]}</Text>
                  <Text style={styles.tableCell}>{row[2]}</Text>
                  <Text style={[styles.badge, { backgroundColor: row[7] }]}>{row[3]}</Text>
                  <Text style={styles.tableCell}>{row[6]}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No data available</Text>
            )}
          </View>
        </ScrollView>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 20,
    marginHorizontal: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  summaryHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
    textAlign: 'center',
  },
  chartCard: {
    borderRadius: 12,
    marginTop: 16,
    paddingBottom: 16,
    marginRight: 10,
    width: '95%',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 4,
  },
  noDataText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    padding: 20,
  },
  filterRow: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    paddingLeft: 4,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonSelected: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    fontSize: 13,
    color: '#1f2937',
  },
  filterTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  tableCard: {
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 2,
  },
  tableHeaderText: {
    fontWeight: '600',
    fontSize: 12,
    width: 110,
    color: '#1f2937',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tableCell: {
    width: 110,
    fontSize: 12,
    color: '#1f2937',
    textAlign: 'center',
  },
  badge: {
    width: 110,
    fontSize: 12,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 12,
    overflow: 'hidden',
    color: '#fff',
    textAlign: 'center',
    alignSelf: 'center',
  },
});

export default FrequencyReport;