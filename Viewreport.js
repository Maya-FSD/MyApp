import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Platform, Linking } from 'react-native';
import { Card, Icon } from '@rneui/themed';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import {
  getAllCodes as getCode1,
  getAllCalls as   getuserAudit1,  
  getAllUsers
} from "./DynamicDataApi";

const Viewreport = () => {
  const [counts, setCounts] = useState({
    ACTIVE: 0,
    DEACTIVATED: 0,
  });
   const [timeRange, setTimeRange] = useState('Today');
  const [filteredCallData, setFilteredCallData] = useState([]);
    const timeRanges = ['Today', 'Week', 'Month', 'Year'];
  const [callData, setCallData] = useState([]);
  const [codesData, setCodesData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [recentDeactivated, setRecentDeactivated] = useState([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const scrollViewRef = useRef();

useEffect(() => {
  const fetchData = async () => {
    const calls = await getuserAudit1();
    setCallData(calls);
    setFilteredCallData(filterDataByTimeRange(calls, timeRange)); // Add this line
    const codes = await getCode1();
    setCodesData(codes);
    const users = await getAllUsers();
    setUsersData(users);
    const counts_CSR = activeDeactiveCountsOnly(filterDataByTimeRange(calls, timeRange)); // Update this line
    setCounts(counts_CSR);
  };
  fetchData();
}, [timeRange]); // Add timeRange to dependencies

 useEffect(() => {
  if (filteredCallData.length > 0 && codesData.length > 0 && usersData.length > 0) { // Update this line
    const codeMap = codesData.reduce((map, code) => {
      const id = code?.id?.toString();
      if (id) {
        map[id] = {
          name: code.code_purpose || `Code ${id}`,
          color: code.code_color || '#cccccc',
          codealert: code.code_name || 'Unknown Code'
        };
      }
      return map;
    }, {});

    const userMap = usersData.reduce((map, user) => {
      map[user.id] = user.username || `User ${user.id}`;
      return map;
    }, {});

    const recentData = [...filteredCallData] // Update this line
      .filter(call => call.status?.toUpperCase() === 'DEACTIVATED')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(call => {
        const codeId = call.code_id?.toString();
        const codeDetails = codeId ? codeMap[codeId] : null;
        const userId = call.performed_by_user_id;
        const userName = userId ? userMap[userId] : 'N/A';
        
        return {
          codeId: codeDetails?.codealert.toUpperCase() || 'Unknown Code',
          user: userName,
          status: call.status || 'Deactivated',
        };        
      });
    setRecentDeactivated(recentData);
  }
}, [filteredCallData, codesData, usersData]); // Update this line
 
const activeDeactiveCountsOnly = (data) => {
  const filteredData = filterDataByTimeRange(data, timeRange); // Add this line
  try {
    const counts = { ACTIVE: 0, DEACTIVATED: 0 };
    
    if (!Array.isArray(filteredData)) { // Update this line
      console.error("Expected array but got:", filteredData);
      return counts;
    }
    
    filteredData.forEach(item => { // Update this line
      if (item && typeof item === 'object') {
        const status = item.status?.toUpperCase();
        if (status && counts.hasOwnProperty(status)) {
          counts[status]++;
        } else {
          console.log("Unknown status:", status, "in item:", item);
        }
      }
    });
    
    return counts;
  } catch (error) {
    console.error('Error:', error);
    return { ACTIVE: 0, DEACTIVATED: 0 };
  }
};

const filterDataByTimeRange = (data, range) => {
    const now = new Date();
    let startDate;
    
    switch(range) {
      case 'Today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'Week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'Month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'Year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        return data;
    }
    
    return data.filter(item => {
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate;
    });
  };

  
  const generateHTML = () => {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
      const timeRangeText = `Time Range: ${timeRange}`;
    const limitedData = recentDeactivated.slice(0, 10);
    
    const tableRows = limitedData.map((item, index) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px;">${item.codeId}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px;">${item.user}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px;">
          <span style="background-color: ${getStatusColor(item.status)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${item.status}</span>
        </td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Code Summary Report</title>
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
              padding: 20px; 
              background-color: #fff;
              color: #333;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 2px solid #3F51B5;
              padding-bottom: 20px;
            }
            .report-title { 
              font-size: 28px; 
              color: #3F51B5;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .report-date { 
              color: #666; 
              font-size: 14px;
            }
            .stats-container { 
              display: flex; 
              justify-content: space-around; 
              margin: 30px 0; 
              gap: 20px;
            }
            .stat-card { 
              flex: 1; 
              padding: 20px; 
              text-align: center;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-title {
              font-size: 14px;
              color: #666;
              margin-bottom: 8px;
              text-transform: uppercase;
              font-weight: 600;
            }
            .stat-value {
              font-size: 32px;
              font-weight: bold;
              margin: 0;
            }
            .active-card { 
              background-color: #E8F5E8; 
              border-left: 4px solid #4CAF50;
            }
            .deactivated-card { 
              background-color: #FFEBEE; 
              border-left: 4px solid #F44336;
            }
            .inactive-card { 
              background-color: #F5F5F5; 
              border-left: 4px solid #9E9E9E;
            }
            .active-value { color: #4CAF50; }
            .deactivated-value { color: #F44336; }
            .inactive-value { color: #9E9E9E; }
            
            .section-title { 
              color: #3F51B5; 
              font-size: 20px;
              font-weight: bold;
              margin: 30px 0 20px 0;
              padding-bottom: 10px;
              border-bottom: 1px solid #e0e0e0;
            }
            .table-container {
              overflow-x: auto;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              background-color: #fff;
            }
            th { 
              background-color: #3F51B5; 
              color: white; 
              padding: 15px; 
              text-align: left; 
              font-weight: 600;
              font-size: 14px;
            }
            td { 
              padding: 12px; 
              border-bottom: 1px solid #e0e0e0; 
              font-size: 14px;
            }
            tr:hover { 
              background-color: #f8f9fa; 
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #e0e0e0;
              padding-top: 20px;
            }
            .empty-state {
              text-align: center;
              padding: 40px;
              color: #666;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="report-title">📊 Code Summary Report</div>
            <div class="report-date">Generated on ${date} at ${time}</div>
             <div class="report-date" style="margin-top: 4px;">${timeRangeText}</div>
          </div>
          
          <div class="stats-container">
            <div class="stat-card active-card">
              <div class="stat-title">✅ Active</div>
              <div class="stat-value active-value">${counts.ACTIVE}</div>
            </div>
            
            <div class="stat-card deactivated-card">
              <div class="stat-title">❌ Deactivated</div>
              <div class="stat-value deactivated-value">${counts.DEACTIVATED}</div>
            </div>
            
            <div class="stat-card inactive-card">
              <div class="stat-title">⚪ Total Codes</div>
              <div class="stat-value inactive-value">${callData.length}</div>
            </div>
          </div>
          
          <div class="section-title">🕵️‍♂️ Recent Deactivated Codes</div>
          
          ${limitedData.length > 0 ? `
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Code ID</th>
                    <th>User</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="empty-state">
              <p>No deactivated codes found</p>
            </div>
          `}
          
          <div class="footer">
            <p><strong>Code Management System</strong></p>
            <p>Total records processed: ${callData.length} | Showing: ${limitedData.length} recent deactivated codes</p>
          </div>
        </body>
      </html>
    `;
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return '#4CAF50';
      case 'DEACTIVATED': return '#F44336';
      case 'INACTIVE': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const createPDF = async () => {
    console.log('=== Expo PDF Generation Started ===');
    setIsGeneratingPDF(true);
    
    try {
      // Step 1: Generate HTML
      console.log('Step 1: Generating HTML...');
      const htmlContent = generateHTML();
      console.log('✓ HTML generated successfully');

      // Step 2: Create PDF using Expo Print
      console.log('Step 2: Creating PDF with Expo Print...');
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 612,
        height: 792,
        margins: {
          left: 20,
          top: 20,
          right: 20,
          bottom: 20,
        },
      });

      console.log('✓ PDF created at:', uri);

      // Step 3: Move PDF to a permanent location
      const timestamp = Date.now();
      const fileName = `Code_Report_${timestamp}.pdf`;
      const documentsDir = FileSystem.documentDirectory;
      const newUri = `${documentsDir}${fileName}`;

      console.log('Step 3: Moving PDF to permanent location...');
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      console.log('✓ PDF saved to:', newUri);

      // Step 4: Share the PDF
      console.log('Step 4: Sharing PDF...');
      
      Alert.alert(
        'PDF Generated Successfully! 🎉',
        `Your report has been generated and saved as: ${fileName}`,
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Share PDF', 
            onPress: async () => {
              try {
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                  await Sharing.shareAsync(newUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Share Code Summary Report',
                  });
                } else {
                  Alert.alert('Sharing Not Available', 'PDF sharing is not available on this device.');
                }
              } catch (shareError) {
                console.error('Share error:', shareError);
                Alert.alert('Share Error', 'Failed to share the PDF file.');
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('=== PDF Generation Failed ===');
      console.error('Error:', error);
      
      let errorMessage = 'Failed to generate PDF';
      
      if (error.message.includes('Print')) {
        errorMessage = 'PDF printing failed. Please try again.';
      } else if (error.message.includes('FileSystem')) {
        errorMessage = 'Failed to save PDF file. Please check storage permissions.';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      Alert.alert(
        'PDF Generation Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsGeneratingPDF(false);
      console.log('=== PDF Generation Process Completed ===');
    }
  };

  const renderCompactCard = (icon, color, title, count) => (
    <View style={[styles.compactCard, { borderLeftColor: color }]}>
      <View style={styles.compactCardContent}>
        <Icon 
          name={icon} 
          type="font-awesome-5" 
          size={16} 
          color={color} 
          style={styles.compactIcon}
        />
        <Text style={styles.compactTitle}>{title}</Text>
      </View>
      <Text style={[styles.compactCount, { color }]}>{count}</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.codeCell]}>{item.codeId}</Text>
      <Text style={[styles.tableCell, styles.branchCell]}>{item.user}</Text>
      <View style={[styles.statusCell, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.headerWrapper}>
          <Text style={styles.title}>📊 Code Summary Report</Text>
        </View>
        
          <View style={styles.timeRangeContainer}>
  {timeRanges.map((range) => (
    <TouchableOpacity
      key={range}
      style={[
        styles.timeRangeButton,
        timeRange === range && styles.timeRangeButtonActive
      ]}
      onPress={() => setTimeRange(range)}
    >
      <Text style={[
        styles.timeRangeButtonText,
        timeRange === range && styles.timeRangeButtonTextActive
      ]}>
        {range}
      </Text>
    </TouchableOpacity>
  ))}
</View>

        <View style={styles.compactStatsRow}>
          {renderCompactCard('layer-group', '#3F51B5', 'Total', callData.length)}          
        </View>

        <View style={styles.compactStatsRow}>
          {renderCompactCard('check-circle', '#4CAF50', 'Activated', counts.ACTIVE)}
          {renderCompactCard('times-circle', '#F44336', 'Deactivated', counts.DEACTIVATED)}    
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.subTitle}>🕵️‍♂️ Last 5 Deactivated Codes</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHead, styles.codeHead]}>Code ID</Text>
          <Text style={[styles.tableHead, styles.branchHead]}>User</Text>
          <Text style={[styles.tableHead, styles.statusHead]}>Status</Text>
        </View>

        <FlatList
          data={recentDeactivated}
          renderItem={renderItem}
          scrollEnabled={false}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="database" size={40} color="#cccccc" />
              <Text style={styles.emptyText}>No deactivated codes found</Text>
            </View>
          }
        />

        <TouchableOpacity 
          style={[styles.downloadWrapper, isGeneratingPDF && styles.downloadButtonDisabled]}
          onPress={createPDF}
          disabled={isGeneratingPDF}
        >
          <View style={styles.downloadButton}>
            {isGeneratingPDF ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.downloadText}>Generating PDF...</Text>
              </>
            ) : (
              <>
                <Feather name="download" size={20} color="#fff" />
                <Text style={styles.downloadText}>Generate & Share PDF</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    padding: 12,
    paddingBottom: 20,
  },
  headerWrapper: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#3F51B5',
  },
  compactStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  compactCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    elevation: 1,
    borderLeftWidth: 4,
  },
  compactCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactIcon: {
    marginRight: 6,
  },
  compactTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#555',
  },
  compactCount: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#3F51B5',
    paddingVertical: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHead: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 14,
  },
  codeHead: {
    flex: 1,
    paddingLeft: 12,
  },
  branchHead: {
    flex: 2,
    paddingLeft: 12,
  },
  statusHead: {
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCell: {
    fontSize: 13,
  },
  codeCell: {
    flex: 1,
    paddingLeft: 12,
  },
  branchCell: {
    flex: 2,
    paddingLeft: 12,
  },
  statusCell: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 2,
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    marginTop: 8,
    color: '#888',
  },
  downloadWrapper: {
    marginTop: 16,
    alignItems: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#3F51B5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  downloadButtonDisabled: {
    opacity: 0.7,
  },
  downloadText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 16,
  },
  timeRangeContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 16,
  paddingHorizontal: 4,
},
timeRangeButton: {
  flex: 1,
  paddingVertical: 8,
  marginHorizontal: 4,
  borderRadius: 8,
  backgroundColor: '#f0f0f0',
  alignItems: 'center',
},
timeRangeButtonActive: {
  backgroundColor: '#3F51B5',
},
timeRangeButtonText: {
  fontSize: 14,
  fontWeight: '500',
  color: '#555',
},
timeRangeButtonTextActive: {
  color: 'white',
},
});

export default Viewreport;