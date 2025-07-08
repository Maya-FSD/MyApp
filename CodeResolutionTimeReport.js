import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Alert, ScrollView } from 'react-native';
import { Icon, ButtonGroup } from '@rneui/themed';
import { BarChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
  getAllBranches as getBranches1,
  getAllCalls as getuserAudit1,
  getAllCodeMappings
} from './DynamicDataApi';

const screenWidth = Dimensions.get('window').width;

const CodeResolutionTimeReport = () => {
  const [codeData, setCodeData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const timeRanges = ['Today', 'This Week', 'This Month', 'This Year'];

  const getStartDateFromRange = (index) => {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    switch (index) {
      case 0: return today; // Today
      case 1: { // This Week
        const day = today.getDay();
        return new Date(today.setDate(today.getDate() - day));
      }
      case 2: return new Date(today.getFullYear(), today.getMonth(), 1); // This Month
      case 3: return new Date(today.getFullYear(), 0, 1); // This Year
      default: return today;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const codeMappingResponse = await getAllCodeMappings();
      const branchResponse = await getBranches1();
      const auditResponse = await getuserAudit1();

      setCodeData(codeMappingResponse.mappedData || []);
      setBranches(branchResponse || []);
      setAuditData(auditResponse || []);

      setLoading(false);
    };

    fetchData();
  }, []);

  

  const calculateAverageResolutionTime = (branchId) => {
    const startDate = getStartDateFromRange(selectedIndex);

    const tslCodeIds = codeData
      .filter(mapping => mapping.branchid === branchId)
      .map(mapping => String(mapping.tsl_code_id));

    const audits = auditData.filter(audit =>
      tslCodeIds.includes(String(audit.conf_id)) &&
      !isNaN(parseFloat(audit.duration)) &&
      new Date(audit.created_at) >= startDate
    );

    const total = audits.reduce((sum, a) => sum + parseFloat(a.duration), 0);
    return audits.length ? (total / audits.length).toFixed(2) : '0.00';
  };

  const chartData = {
    labels: branches.map(b => b.name.length > 10 ? b.name.slice(0, 10) + '...' : b.name),
    datasets: [
      {
        data: branches.map(b => parseFloat(calculateAverageResolutionTime(b.id))),
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  const exportCSV = async () => {
    const header = 'Branch,Average Resolution Time (seconds)\n';
    const rows = branches.map(branch =>
      `${branch.name},${calculateAverageResolutionTime(branch.id)}`
    ).join('\n');

    const csvString = header + rows;
    const fileUri = FileSystem.documentDirectory + 'code_resolution_time_report.csv';

    try {
      await FileSystem.writeAsStringAsync(fileUri, csvString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device.');
        return;
      }

      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('CSV Export Error:', error);
      Alert.alert('Error', 'Failed to export CSV.');
    }
  };

  const renderHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="timeline" type="material" size={30} color="#4CAF50" />
        <Text style={styles.title}>Code Resolution Time Report</Text>
      </View>

      {/* Time Range Selector */}
      <ButtonGroup
        buttons={timeRanges}
        selectedIndex={selectedIndex}
        onPress={setSelectedIndex}
        containerStyle={styles.buttonGroup}
        selectedButtonStyle={{ backgroundColor: '#4CAF50' }}
        textStyle={{ fontSize: 12 }}
        selectedTextStyle={{ color: 'white', fontWeight: 'bold' }}
      />

      {/* Chart */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <BarChart
          data={chartData}
          width={Math.max(screenWidth, branches.length * 80)} // dynamic width
          height={260}
          chartConfig={chartConfig}
          verticalLabelRotation={45}
          style={styles.chart}
          fromZero
          showBarTops={true}
        />
      </ScrollView>
    </View>
  );

  const renderFooter = () => (
    <TouchableOpacity style={styles.downloadButton} onPress={exportCSV}>
      <Icon name="download" type="material" size={25} color="white" />
      <Text style={styles.downloadText}>Download CSV</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <Text style={{ padding: 20 }}>Loading resolution report...</Text>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={branches}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => (
          <View style={styles.branchCard}>
            <Text style={styles.branchName}>{item.name}</Text>
            <Text style={styles.resolutionTime}>
              Avg. Resolution Time: {calculateAverageResolutionTime(item.id)} sec
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

export default CodeResolutionTimeReport;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonGroup: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  chart: {
    borderRadius: 12,
    marginBottom: 20,
    marginLeft: 20,
  },
  branchCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  branchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resolutionTime: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 5,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
    marginHorizontal: 20,
  },
  downloadText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
});