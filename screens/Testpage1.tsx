import { Text } from '@rneui/themed'
import React from 'react'
import { ScrollView, View } from 'react-native'


const Testpage1 = () => {
  return (
    <ScrollView>
      <View>
<Text>
  Hi
</Text>
      </View>
    </ScrollView>
  )
}

export default Testpage1;


// // DashboardScreen.tsx
// import React, { useState } from 'react';
// import { View, Text, ScrollView, TouchableOpacity, Share } from 'react-native';
// import { VictoryBar, VictoryChart } from 'victory-native';
// import { Button } from '../components/ui/button';
// import { Card, CardContent } from '../components/ui/card';
// import { Input } from '../components/ui/input';
// import Icon from 'react-native-vector-icons/Feather';
// import * as FileSystem from 'expo-file-system';

// const Testpage1 = () => {
//   const [codes, setCodes] = useState([
//     { name: 'Code Blue', activated: '06-04-2025 05:55', deactivated: '06-04-2025 06:55' },
//     { name: 'Code Orange', activated: '06-04-2025 05:55', deactivated: '06-04-2025 06:55' },
//     { name: 'Code Yellow', activated: '06-04-2025 05:55', deactivated: '06-04-2025 06:55' },
//     { name: 'Code Red', activated: '06-04-2025 05:55', deactivated: '06-04-2025 06:55' },
//   ]);

//   interface BarData {
//     code: string;
//     count: number;
//     color?: string;
//   }
//   const barData: BarData[]  = [
//     { code: 'Code Blue', count: 2 },
//     { code: 'Code Orange', count: 2 },
//     { code: 'Code Yellow', count: 3 },
//     { code: 'Code Red', count: 1 },
//     { code: 'Not Deactivated', count: 1, color: 'red' },
//   ];

  
//   const totalActivated = 10;
//   const totalDeactivated = 9;
//   const notDeactivated = 1;

//   const shareReport = async () => {
//     try {
//       const content = `Code Activation Report\nTotal Activated: ${totalActivated}\nTotal Deactivated: ${totalDeactivated}`;
//       const uri = FileSystem.documentDirectory + 'report.txt';
//       await FileSystem.writeAsStringAsync(uri, content);
//       await Share.share({ url: uri, message: 'Download code report here' });
//     } catch (error) {
//       console.error('Error sharing report:', error);
//     }
//   };

//   const handleCardClick = (type: string) => {
//     console.log(`Show details for ${type}`);
//   };

//   return (
//     <ScrollView className="p-4 bg-white">
//       <Text className="text-xl font-bold mb-2">Code Activation vs Deactivation Report</Text>

//       {/* Overview Section */}
//       <View className="flex-row flex-wrap justify-between mb-4">
//         <TouchableOpacity 
//           className="w-[48%] mb-4"
//           onPress={() => handleCardClick('activated')}
//         >
//           <Card>
//             <CardContent className="p-4">
//               <Text>Total Activated Codes</Text>
//               <Text className="text-2xl font-bold">{totalActivated}</Text>
//             </CardContent>
//           </Card>
//         </TouchableOpacity>

//         <TouchableOpacity 
//           className="w-[48%] mb-4"
//           onPress={() => handleCardClick('deactivated')}
//         >
//           <Card>
//             <CardContent className="p-4">
//               <Text>Total Deactivated Codes</Text>
//               <Text className="text-2xl font-bold text-red-500">{totalDeactivated}</Text>
//             </CardContent>
//           </Card>
//         </TouchableOpacity>

//         <TouchableOpacity 
//           className="w-[48%]"
//           onPress={() => handleCardClick('notDeactivated')}
//         >
//           <Card>
//             <CardContent className="p-4">
//               <Text>Not Deactivated Codes</Text>
//               <Text className="text-2xl font-bold text-red-600">{notDeactivated}</Text>
//             </CardContent>
//           </Card>
//         </TouchableOpacity>

//         <TouchableOpacity className="w-[48%]">
//           <Card>
//             <CardContent className="p-4 flex-row justify-between items-center">
//               <Text>Click to see details</Text>
//               <Icon name="bell" size={20} />
//             </CardContent>
//           </Card>
//         </TouchableOpacity>
//       </View>

//       {/* Chart Section */}
//       <View className="mt-6">
//         <Text className="font-bold text-lg mb-2">Activity</Text>
//         <VictoryChart domainPadding={{ x: 20 }}>
//           <VictoryBar
//             data={barData}
//             x="code"
//             y="count"
//             style={{
//               data: {
//                 fill: ({ datum }) => datum.color || '#3366FF',
//               },
//             }}
//           />
//         </VictoryChart>
//       </View>

//       {/* Last 5 Codes */}
//       <View className="mt-6">
//         <Text className="font-bold mb-2">Last 5 Codes</Text>
//         <Input placeholder="Search" className="mb-4" />

//         <View>
//           {codes.map((item, index) => (
//             <View key={index} className="flex-row justify-between py-2 border-b">
//               <Text className="w-1/3">{item.name}</Text>
//               <Text className="w-1/3 text-xs">{item.activated}</Text>
//               <Text className="w-1/3 text-xs">{item.deactivated}</Text>
//             </View>
//           ))}
//         </View>
//       </View>

//       {/* Actions */}
//       <View className="flex-row justify-between mt-6 mb-4">
//         <Button onPress={() => console.log('Refreshed')}>
//           <Icon name="refresh-cw" size={16} /> Refresh
//         </Button>
//         <Button onPress={shareReport}>
//           <Icon name="share-2" size={16} /> Export
//         </Button>
//       </View>
//     </ScrollView>
//   );
// };

// export default Testpage1;