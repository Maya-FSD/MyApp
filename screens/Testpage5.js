import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Card, ButtonGroup } from '@rneui/themed'; // Import ButtonGroup from RNEUI
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const barData = {
  labels: ['NH NICS', 'NH MSH', 'NH HSR', 'NH SHIM', 'NH Mys'],
  datasets: [
    {
      data: [7, 5, 4, 4, 6],
    },
  ],
};

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(0, 0, 139, ${opacity})`, // Dark Blue for bars
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};

const Testpage5 = () => {
  const [selectedIndex, setSelectedIndex] = useState(0); // State to manage selected filter

  const buttons = ['Yesterday', 'Today', 'All Codes', 'Resp.']; // Filter options for ButtonGroup

  return (
    <ScrollView style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Card containerStyle={styles.summaryCard}>
          <Text style={styles.summaryValue}>32</Text>
          <Text style={styles.summaryLabel}>Total Codes</Text>
        </Card>
        <Card containerStyle={styles.summaryCard}>
          <Text style={styles.summaryHighlight}>NH NICS</Text>
          <Text style={styles.summaryLabel}>Most Active Unit</Text>
        </Card>
        <Card containerStyle={styles.summaryCard}>
          <Text style={styles.summaryHighlight}>NH HSR</Text>
          <Text style={styles.summaryLabel}>Least Active Unit</Text>
        </Card>
      </View>

      {/* Bar Chart */}
      <Card containerStyle={styles.chartCard}>
        <Text style={styles.chartTitle}>Codes</Text>
        <BarChart
          data={barData}
          width={screenWidth - 60}
          height={220}
          chartConfig={chartConfig}
          fromZero
          showValuesOnTopOfBars
          withInnerLines={true}
          withCustomBarColorFromData
          flatColor
          style={{ borderRadius: 8 }}
        />

        {/* Button Group for Filters */}
        <ButtonGroup
          buttons={buttons}
          selectedIndex={selectedIndex}
          onPress={(index) => setSelectedIndex(index)}
          containerStyle={styles.buttonGroup}
        />
      </Card>

      {/* Table */}
      <Card containerStyle={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Unit</Text>
          <Text style={styles.tableHeaderText}>Activated Codes</Text>
          <Text style={styles.tableHeaderText}>Deactivated Codes</Text>
          <Text style={styles.tableHeaderText}>Resolution %</Text>
          <Text style={styles.tableHeaderText}>Avg. Time</Text>
        </View>

        {[ // Example data for table
          ['NH NICS', '10', '7', '70%', '10 min'],
          ['NH MSH', '5', '4', '80%', '8 min'],
          ['NH HSR', '4', '2', '50%', '15 min'],
          ['NH SHIM', '6', '6', '100%', '5 min'],
          ['NH Mys', '7', '5', '71%', '12 min'],
        ].map((row, index) => (
          <View key={index} style={styles.tableRow}>
            {row.map((cell, i) => (
              <Text key={i} style={styles.tableCell}>{cell}</Text>
            ))}
          </View>
        ))}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    padding: 10,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  summaryHighlight: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  chartCard: {
    borderRadius: 12,
    marginTop: 16,
    paddingBottom: 16,
    marginRight:10,
    width:'95%',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 1,
    color: '#1f2937',
  },
  buttonGroup: {
    marginTop: 12,
    marginBottom: 16,
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
    fontSize: 10,
    width: '22%',
    color: '#1f2937',
    alignItems:'center',
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
  tableText: {
    fontSize: 8,
    width: '33%',
    color: '#1f2937',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#1f2937',
    textAlign: 'center',
  },
});

export default Testpage5;
