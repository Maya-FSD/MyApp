import React from 'react';
import { View, ScrollView, Text, StyleSheet, Dimensions, TextInput } from 'react-native';
import { Card, Icon } from '@rneui/themed';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const data = {
  labels: ['Blue', 'Orange', 'Yellow', 'Yellow', 'Red', 'Not Deactivated'],
  datasets: [
    {
      data: [2, 2, 3, 2, 1, 4],
      colors: [
        () => '#1f2937',
        () => '#1f2937',
        () => '#1f2937',
        () => '#1f2937',
        () => '#1f2937',
        () => '#ef4444',
      ],
    },
  ],
};

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};

const Testpage4 = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Code Activation vs Deactivation Report</Text>
      <Text style={styles.sectionTitle}>Overview</Text>
      {/* CARD ROWS */}
      <View style={styles.cardRow}>
        <Card containerStyle={styles.card}>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Total Activated Codes</Text>
            <Text style={[styles.cardValue, { color: '#10b981' }]}>10</Text>
          </View>
          <View style={styles.iconBottomRight}>
            <Icon name="check-circle" type="feather" color="#10b981" size={28} />
          </View>
        </Card>

        <Card containerStyle={styles.card}>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Total Deactivated Codes</Text>
            <Text style={[styles.cardValue, { color: '#ef4444' }]}>9</Text>
          </View>
          <View style={styles.iconBottomRight}>
            <Icon name="x-circle" type="feather" color="#ef4444" size={28} />
          </View>
        </Card>
      </View>

      <View style={styles.cardRow}>
        <Card containerStyle={styles.card}>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Not Deactivated Codes</Text>
            <Text style={[styles.cardValue, { color: '#f59e0b' }]}>1</Text>
          </View>
          <View style={styles.iconBottomRight}>
            <Icon name="alert-triangle" type="feather" color="#f59e0b" size={28} />
          </View>
        </Card>

        <Card containerStyle={styles.card}>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Click to see complete Report</Text>
            <Text style={[styles.cardValue, { color: '#f59e0b' }]}></Text>
          </View>
          <View style={styles.iconBottomRight}>
            <Icon name="eye" type="feather" color="#3b82f6" size={28} />
          </View>
        </Card>
      </View>

      {/* ACTIVITY CHART */}
      <Text style={styles.sectionTitle}>ACTIVITY</Text>
      <BarChart
        data={data}
        width={screenWidth - 30}
        height={220}
        fromZero
        chartConfig={chartConfig}
        showBarTops
        withCustomBarColorFromData
        flatColor
        style={{ marginVertical: 8, borderRadius: 12 }}
      />

      {/* LAST 5 CODES */}
      <Text style={styles.sectionTitle}>Last 5 Codes</Text>
      <TextInput style={styles.searchBar} placeholder="Search" />

      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Code Name</Text>
        <Text style={styles.tableHeaderText}>Activated</Text>
        <Text style={styles.tableHeaderText}>Deactivated</Text>
      </View>

      {['Code Blue', 'Code Orange', 'Code Yellow', 'Code Red'].map((code, index) => (
        <View key={index} style={styles.tableRow}>
          <Text style={styles.tableText}>{code}</Text>
          <Text style={styles.tableText}>06-04-2025 05:55</Text>
          <Text style={styles.tableText}>06-04-2025 05:55</Text>
        </View>
      ))}

      <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
        <Icon
          name="download"
          type="feather"
          color="#1f2937"
          onPress={() => alert('Download clicked!')}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#1f2937',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    width:'90%',
  },
  card: {
    width: '47%',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
    minHeight: 75,
  },
  cardTextContainer: {
    paddingBottom: 10,
    paddingTop: 1,
  },
  iconBottomRight: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1f2937',
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
    marginLeft:10,
    color: '#1f2937',
  },
  searchBar: {
    height: 40,
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontWeight: '600',
    fontSize: 14,
    width: '33%',
    color: '#1f2937',
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
    fontSize: 13,
    width: '33%',
    color: '#1f2937',
  },
});

export default Testpage4;
