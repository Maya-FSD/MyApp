import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { ButtonGroup } from '@rneui/themed';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getuserAudit1 , getCode1} from './ApidataDynamic';

const screenWidth = Dimensions.get('window').width;

const CodeActivationSummaryReport = () => {
  const [codesData, setCodesData] = useState([]);
  const [callData, setCallData] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const timeRanges = ['Today', 'This Week', 'This Month', 'This Year'];

  const getStartDateFromRange = () => {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    switch (selectedIndex) {
      case 0: return today; // Today
      case 1: return new Date(today.setDate(today.getDate() - today.getDay())); // Week start (Sunday)
      case 2: return new Date(today.getFullYear(), today.getMonth(), 1); // First of the month
      case 3: return new Date(today.getFullYear(), 0, 1); // First of the year
      default: return today;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const codes = await getCode1();
        const calls = await getuserAudit1();
        setCodesData(codes);
        setCallData(calls);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  
  const filteredCalls = callData.filter(call => {
    if (!call.created_at) return false;
    const createdDate = new Date(call.created_at);
    return createdDate >= getStartDateFromRange();
  });
  const prepareCodeActivationData = (codesData, callData) => {
    const codeActivationCount = {};
    
    codesData.forEach(code => {
      codeActivationCount[code.id] = 0;
    });
    
    callData.forEach(call => {
      const callCodeId = call.code_id;
      if (codeActivationCount.hasOwnProperty(callCodeId)) {
        codeActivationCount[callCodeId] += 1;
      }
    });
    
    const results = Object.keys(codeActivationCount).map(id => {
      const codeDetails = codesData.find(code => code.id.toString() === id);
      return {
        id,
        count: codeActivationCount[id],
        name: codeDetails?.code_name || `Code ${id}`,
        color: codeDetails?.code_color || '#cccccc',
        purpose: codeDetails?.code_purpose || '',
      };
    });
    
    return results;
  };

  const prepareActivationStatusData = (callData) => {
    const active = callData.filter(call => call.status === 'ACTIVE').length;
    const inactive = callData.filter(call => call.status === 'DEACTIVATED').length;
    return [
      { 
        name: 'Active', 
        value: active, 
        color: '#4CAF50', 
        legendFontColor: '#7F7F7F', 
        legendFontSize: 12 
      },
      { 
        name: 'Deactivated', 
        value: inactive, 
        color: '#F44336', 
        legendFontColor: '#7F7F7F', 
        legendFontSize: 12 
      }
    ];
  };

  const prepareActivationByDateData = (callData) => {
    const activationsByDate = {};
    
    callData.forEach(call => {
      try {
        const date = new Date(call.created_at);
        const dateKey = date.toISOString().split('T')[0];
        activationsByDate[dateKey] = (activationsByDate[dateKey] || 0) + 1;
      } catch (e) {
        console.warn('Invalid date format:', call.created_at);
      }
    });

    const sortedDates = Object.keys(activationsByDate).sort();
    const formattedLabels = sortedDates.map(date => {
      const [year, month, day] = date.split('-');
      return `${parseInt(month)}/${parseInt(day)}`;
    });

    return {
      labels: formattedLabels,
      datasets: [{
        data: sortedDates.map(date => activationsByDate[date]),
        color: (opacity = 1) => `rgba(65, 105, 225, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Loading data...</Text>
      </View>
    );
  }

  const codeActivationData = prepareCodeActivationData(codesData, filteredCalls);
const activationStatusData = prepareActivationStatusData(filteredCalls);
const activationByDateData = prepareActivationByDateData(filteredCalls);


  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
      fontFamily: 'Arial',
    },
    propsForBackgroundLines: {
      strokeWidth: 0.5,
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Code Activation Summary Report</Text>
            <ButtonGroup
            buttons={timeRanges}
            selectedIndex={selectedIndex}
            onPress={setSelectedIndex}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={{ backgroundColor: '#4a90e2' }}
            textStyle={{ fontSize: 12 }}
          />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{codesData.length}</Text>
            <Text style={styles.statLabel}>Total Codes</Text>
          </View>
      <View style={styles.statItem}>
  <Text style={styles.statValue}>{filteredCalls.length}</Text>
  <Text style={styles.statLabel}>Total Activations</Text>
</View>
<View style={styles.statItem}>
  <Text style={styles.statValue}>{activationStatusData[0].value}</Text>
  <Text style={styles.statLabel}>Active Codes</Text>
</View>

        </View>

        {/* Code Activation Frequency */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Code Activation Frequency</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <BarChart
              data={{
                labels: codeActivationData.map(item => 
                  item.name.length > 10 
                    ? `${item.name.substring(0, 8)}...`.toUpperCase() 
                    : item.name.toUpperCase()
                ),
                datasets: [{ data: codeActivationData.map(item => item.count) }]
              }}
              width={Math.max(screenWidth, codeActivationData.length * 60)}
              height={240}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                fillShadowGradient: '#4a90e2',
                fillShadowGradientOpacity: 1,
              }}
              style={styles.chartStyle}
              verticalLabelRotation={45}
              fromZero={true}
            />
          </ScrollView>
        </View>

        {/* Activations by Date - PHONE OPTIMIZED */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Activations by Date</Text>
          <LineChart
            data={activationByDateData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(65, 105, 225, ${opacity})`,
              propsForLabels: {
                fontSize: 9,
                rotation: -45,
                textAnchor: 'start',
                dx: 5,
                dy: 15,
              },
              formatXLabel: (value) => value || ''
            }}
            bezier
            style={styles.chartStyle}
            withDots={true}
            withShadow={false}
          />
          <Text style={styles.dateLegend}>
            Dates show as Month/Day (e.g. 1/15 = January 15)
          </Text>
        </View>

        {/* Activation Status Distribution */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Activation Status Distribution</Text>
          <PieChart
            data={activationStatusData}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chartStyle}
            absolute
          />
        </View>

        {/* Top Code Activations */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Top Code Activations</Text>
          {codeActivationData
            .sort((a, b) => b.count - a.count)
            .map((item) => (
              <View key={item.id} style={styles.codeDetailItem}>
                <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                <View style={styles.codeDetailContent}>
                  <Text style={styles.codeDetailName}>
                    {item.name.toUpperCase()} - {item.purpose}
                  </Text>
                  <Text style={styles.codeDetailCount}>
                    {item.count} activation{item.count !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#888" />
              </View>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7'
  },
  scrollContainer: {
    paddingBottom: 20
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerContainer: {
    backgroundColor: '#4a90e2',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center'
  },
  subHeader: {
    fontSize: 14,
    color: 'white',
    marginTop: 5
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a90e2'
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center'
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333'
  },
  chartStyle: {
    borderRadius: 10,
    marginLeft: 5
  },
  dateLegend: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic'
  },
  codeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12
  },
  codeDetailContent: {
    flex: 1
  },
  codeDetailName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  codeDetailCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  }
});

export default CodeActivationSummaryReport;