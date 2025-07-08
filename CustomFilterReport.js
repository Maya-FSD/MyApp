import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import {getCodeById,
  getUserById, 
  getBranchById,  
  getAllCodes as getCode1,
  getAllUsers as getUsers1,
  getAllBranches as getBranches1,
  getAllCalls as getuserAudit1,
  getAllCodeMappings} from './DynamicDataApi';
import { ButtonGroup, Input } from '@rneui/themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CustomFilterReport() {
  const [selectedCode, setSelectedCode] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [callData, setCallData] = useState([]);
  const [mapdata, setMapdata] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const timeRanges = ["Today", "This Week", "This Month", "This Year"];

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
      await getBranches1();
      await getCode1();
      await getUsers1();
      const result = await getAllCodeMappings();
      if (result && result.mappedData) setMapdata(result.mappedData);
      const data = await getuserAudit1();
      setCallData(data);
    };
    fetchData();
  }, []);

  const filteredCalls = callData
    .filter(call => {
      const code = getCodeById(call.code_id);
      const user = getUserById(call.performed_by_user_id);
      const mapping = mapdata.find(m => String(m.codeid) === String(call.code_id));
      const branch = mapping ? getBranchById(mapping.branchid) : null;
      const callDate = new Date(call.created_at);

      return (
        (!selectedCode || code?.code_name?.toLowerCase().includes(selectedCode.toLowerCase())) &&
        (!selectedUser || user?.first_name?.toLowerCase().includes(selectedUser.toLowerCase())) &&
        (!selectedBranch || branch?.name?.toLowerCase().includes(selectedBranch.toLowerCase())) &&
        callDate >= getStartDateFromRange(selectedIndex)
      );
    })
    .map(call => {
      const mapping = mapdata.find(m => String(m.codeid) === String(call.code_id));
      return {
        ...call,
        branchid: mapping?.branchid || call.branch_id,
      };
    });

  const renderItem = ({ item }) => {
    const code = getCodeById(item.code_id);
    const user = getUserById(item.performed_by_user_id);   
    const branch = getBranchById(item.branchid);

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <MaterialCommunityIcons name={code?.code_icon || 'alert'} size={20} color={code?.code_color || '#000'} />
          <Text style={[styles.codeName, { color: code?.code_color }]}>{code?.code_name?.toUpperCase()}</Text>
          <Text style={styles.status}>{item.status}</Text>
        </View>
        <Text>User: {user?.first_name} ({user?.phone})</Text>
        <Text>Branch: {branch?.name}</Text>
        <Text>Date: {new Date(item.created_at).toLocaleString()}</Text>
        <Text>Duration: {item.duration}s</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Input placeholder="Filter by Code" value={selectedCode} onChangeText={setSelectedCode} />
      <Input placeholder="Filter by User" value={selectedUser} onChangeText={setSelectedUser} />
      <Input placeholder="Filter by Branch" value={selectedBranch} onChangeText={setSelectedBranch} />

      <ButtonGroup
        buttons={timeRanges}
        selectedIndex={selectedIndex}
        onPress={setSelectedIndex}
        containerStyle={styles.buttonGroupContainer}
        selectedButtonStyle={styles.selectedButton}
        textStyle={styles.buttonText}
        selectedTextStyle={styles.selectedButtonText}
      />

      <Text style={styles.resultCount}>Results: {filteredCalls.length}</Text>

      <FlatList
        data={filteredCalls}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f2f2f2' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  codeName: { marginLeft: 8, fontWeight: 'bold', fontSize: 16 },
  status: { marginLeft: 10, fontSize: 12, backgroundColor: '#ddd', padding: 4, borderRadius: 5 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10, shadowColor: '#000', elevation: 3 },
  resultCount: { textAlign: 'center', fontSize: 16, marginVertical: 10 },
  buttonGroupContainer: { marginBottom: 10, borderRadius: 10 },
  selectedButton: { backgroundColor: '#007bff' },
  buttonText: { fontSize: 12 },
  selectedButtonText: { color: '#fff', fontWeight: 'bold' },
});
