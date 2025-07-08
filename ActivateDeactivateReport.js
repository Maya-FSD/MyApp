import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { getJoinedAuditCodeMapping } from './ApidataDynamic';
import moment from 'moment';

const screenWidth = Dimensions.get('window').width;
const dateRanges = ['Today', 'This Week', 'This Month', 'This Year'];

const ActivateDeactivateReport = () => {
  const [pieData, setPieData] = useState([]);
  const [groupedBarData, setGroupedBarData] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRange, setSelectedRange] = useState('Today');
  const [loading, setLoading] = useState(true);
  const [allRecords, setAllRecords] = useState([]);

  useEffect(() => {
    fetchData();
  }, [selectedRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const joined = await getJoinedAuditCodeMapping();
      const filtered = filterByDateRange(joined);

      setAllRecords(joined);
      setRecentRecords(filtered);

      const pieCounts = calculateFilteredPieCounts(filtered);
      updatePieChartData(pieCounts);

      const grouped = groupByCodeStatus(filtered);
      updateGroupedBarChart(grouped);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByDateRange = (records) => {
    const now = moment();
    return records.filter(record => {
      if (!record.audit_time) return false;
      const recordDate = moment(record.audit_time);

      switch (selectedRange) {
        case 'Today': return recordDate.isSame(now, 'day');
        case 'This Week': return recordDate.isSame(now, 'week');
        case 'This Month': return recordDate.isSame(now, 'month');
        case 'This Year': return recordDate.isSame(now, 'year');
        default: return true;
      }
    });
  };

  const calculateFilteredPieCounts = (records) => {
    const counts = { ACTIVE: 0, DEACTIVATED: 0 };
    records.forEach(record => {
      const status = record.audit_status;
      if (status && counts[status] !== undefined) {
        counts[status]++;
      }
    });
    return counts;
  };

  const groupByCodeStatus = (filteredRecords) => {
    const result = {};
    filteredRecords.forEach(record => {
      const codeId = record.vconnect_code_id;
      const codeName = record.tsl_code_name || 'Unknown';
      const status = record.audit_status;
      const color = '#1E88E5';

      if (!result[codeId]) {
        result[codeId] = {
          name: codeName,
          colorname: color,
          ACTIVE: 0,
          DEACTIVATED: 0
        };
      }

      if (status === 'ACTIVE') result[codeId].ACTIVE++;
      else if (status === 'DEACTIVATED') result[codeId].DEACTIVATED++;
    });
    return result;
  };

  const updatePieChartData = (counts) => {
    setPieData([
      {
        name: 'ACTIVE',
        count: counts.ACTIVE,
        color: '#28a745',
        legendFontColor: '#000',
        legendFontSize: 14,
      },
      {
        name: 'DEACTIVATED',
        count: counts.DEACTIVATED,
        color: '#dc3545',
        legendFontColor: '#000',
        legendFontSize: 14,
      },
    ]);
  };

  const updateGroupedBarChart = (statusCountsByCode) => {
    const labels = [];
    const activeCounts = [];
    const deactivatedCounts = [];
    const colors = [];

    Object.entries(statusCountsByCode).forEach(([codeId, data]) => {
      labels.push(data.name);
      colors.push(data.colorname);
      activeCounts.push(data.ACTIVE);
      deactivatedCounts.push(data.DEACTIVATED);
    });

    setGroupedBarData({
      labels,
      datasets: [
        {
          label: 'ACTIVE',
          data: activeCounts,
          color: '#28a745',
        },
        {
          label: 'DEACTIVATED',
          data: deactivatedCounts,
          color: '#dc3545',
        },
      ],
      colors
    });
  };

  const handleSearch = (text) => {
    setSearchTerm(text);
    if (text === '') {
      setRecentRecords(filterByDateRange(allRecords));
    } else {
      const filtered = allRecords.filter((item) =>
        Object.values(item).some((val) =>
          val?.toString().toLowerCase().includes(text.toLowerCase())
        )
      );
      setRecentRecords(filtered);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Dashboard Report</Text>

      {/* Date Range Filter */}
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

      {loading ? (
        <ActivityIndicator size="large" color="#1E88E5" style={styles.loader} />
      ) : (
        <>
          <Text style={styles.subHeader}>Call Status Distribution</Text>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={screenWidth - 20}
              height={220}
              chartConfig={chartConfig}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={{ color: 'gray' }}>No data available</Text>
          )}

          <Text style={styles.subHeader}>Code-Wise Status Counts</Text>
          {groupedBarData ? (
            groupedBarData.datasets.map((set, index) => (
              <View key={index}>
                <Text style={{ fontWeight: '600', marginBottom: 4 }}>{set.label}</Text>
                <BarChart
                  data={{
                    labels: groupedBarData.labels,
                    datasets: [
                      {
                        data: set.data,
                      },
                    ],
                  }}
                  width={screenWidth - 20}
                  height={200}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1, index) =>
                      groupedBarData.colors[index] || set.color,
                  }}
                  verticalLabelRotation={45}
                  fromZero
                  showValuesOnTopOfBars
                />
              </View>
            ))
          ) : (
            <Text style={{ color: 'gray' }}>No chart data</Text>
          )}

          <Text style={styles.subHeader}>Recent Records</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search records..."
            value={searchTerm}
            onChangeText={handleSearch}
          />

          <ScrollView horizontal style={{ marginBottom: 20 }}>
  <View>
    {/* Table Header with fixed column names */}
    <View style={styles.tableHeader}>
      <Text style={styles.tableHeaderCell}>Code Name</Text>
      <Text style={styles.tableHeaderCell}>Status</Text>
      <Text style={styles.tableHeaderCell}>Created Time</Text>
    </View>

    {/* Last 5 records sorted by time (descending) */}
    {recentRecords
      .sort((a, b) => new Date(b.audit_time) - new Date(a.audit_time))
      .slice(0, 5)
      .map((record, rowIndex) => (
        <View key={rowIndex} style={styles.tableRow}>
          <Text style={styles.tableCell}>{record.tsl_code_name}</Text>
          <Text style={styles.tableCell}>{record.audit_status}</Text>
          <Text style={styles.tableCell}>
            {moment(record.audit_time).format('DD-MM-YYYY hh:mm A')}
          </Text>
        </View>
      ))}
  </View>
</ScrollView>
        </>
      )}
    </ScrollView>
  );
};

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  barPercentage: 0.5,
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 8,
    marginBottom: 10,
    borderRadius: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ddd',
    padding: 5,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    width: 120,
    padding: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  tableCell: {
    width: 120,
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#1E88E5',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  activeFilterButton: {
    backgroundColor: '#1E88E5',
  },
  filterButtonText: {
    color: '#1E88E5',
    fontSize: 12,
  },
  activeFilterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 50,
  },
});

export default ActivateDeactivateReport;
