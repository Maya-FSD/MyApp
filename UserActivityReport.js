import React, { useState, useEffect, useMemo } from "react";
import { useTheme, Badge } from "@rneui/themed";
import {
  View,
  ScrollView,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Download,
  User,
  ChevronDown,
  BarChart2,
  PieChart,
  Code,
  Activity,
  Flame,
  HeartPulse,
  AlertCircle,
  TrendingUp,
  Calendar,
  Clock,
} from "lucide-react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { BarChart, PieChart as RNPieChart } from "react-native-chart-kit";
import moment from "moment";
import { 
  initData,
  getAllUsers, 
  getAllCalls, 
  getAllCodes, 
  getAllBranches
} from './DynamicDataApi';
import styles from "./viewreport.style";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const UserActivityReport = () => {
  const { theme } = useTheme();
  const style = styles(theme);
  
  const extraStyles = {
    chartWrapper: {
      alignItems: 'center',
      paddingVertical: 15,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      marginVertical: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    noDataContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.grey5,
      borderRadius: 12,
      marginVertical: 10,
    },
    noDataIcon: {
      marginBottom: 12,
      opacity: 0.5,
    },
    noDataText: {
      fontSize: 16,
      color: theme.colors.grey2,
      textAlign: 'center',
      fontWeight: '500',
    },
    noDataSubText: {
      fontSize: 14,
      color: theme.colors.grey3,
      textAlign: 'center',
      marginTop: 4,
    },
    chartLegend: {
      marginTop: 20,
      paddingHorizontal: 20,
      width: '100%',
    },
    chartLegendTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 12,
      color: theme.colors.grey0,
      textAlign: 'center',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: theme.colors.grey5,
      borderRadius: 8,
    },
    legendColor: {
      width: 14,
      height: 14,
      borderRadius: 7,
      marginRight: 12,
    },
    legendText: {
      fontSize: 13,
      color: theme.colors.grey0,
      flex: 1,
      fontWeight: '500',
    },
    enhancedCard: {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      marginVertical: 8,
      marginHorizontal: 4,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 5,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.colors.grey5,
    },
    cardGradient: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.grey5,
    },
    statBox: {
      alignItems: 'center',
      flex: 1,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.grey2,
      marginTop: 2,
      textAlign: 'center',
    },
    timeRangeContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.grey5,
      borderRadius: 12,
      padding: 4,
      marginVertical: 14,
      marginHorizontal: 2,
    },
    timeRangeButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeRangeButtonActive: {
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 2,
    },
    timeRangeButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.grey1,
      textAlign: 'center', 
      lineHeight: 16, 
    },
    timeRangeButtonTextActive: {
      color: 'white',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.grey5,
      borderRadius: 12,
      marginVertical: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.grey0,
      marginLeft: 8,
      flex: 1,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: theme.colors.grey2,
      marginLeft: 8,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.grey5,
      borderRadius: 12,
      padding: 4,
      marginVertical: 8,
      marginHorizontal: 8,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    tabButtonActive: {
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 2,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.grey1,
    },
    tabTextActive: {
      color: 'white',
    },
  };

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);
  const [timeRange, setTimeRange] = useState("Thisday");
  const [activeTab, setActiveTab] = useState("summary");
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState([]);
  const [animation] = useState(new Animated.Value(0));
  const [callData, setCallData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [codesData, setCodesData] = useState([]);
  const [branchData, setBranchData] = useState([]);

  const getFilteredDateRange = (range) => {
    const now = new Date();
    const today = new Date(now.setHours(23, 59, 59, 999));
    
    switch (range) {
      case 'Thisday':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        return new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'all':
      default:
        return new Date(0);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (processing) return;
    
    setLoading(true);
    setProcessing(true);
    
    try {
      const success = await initData();
      if (!success) {
        throw new Error("Failed to initialize data");
      }
      
      const codedata = await getAllCodes();
      const callsdata = await getAllCalls();
      const branchsdata = await getAllBranches();
      const userddatas = await getAllUsers();
      
      setUsersData(userddatas);
      setCallData(callsdata);
      setCodesData(codedata);
      setBranchData(branchsdata);
      
      const processedUsers = processDataWithFetchedData(userddatas, callsdata, branchsdata);
      setUserData(processedUsers);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  const reprocessData = () => {
    if (usersData.length > 0 && callData.length > 0 && branchData.length > 0) {
      const processedUsers = processDataWithFetchedData(usersData, callData, branchData);
      setUserData(processedUsers);
    }
  };

  const processDataWithFetchedData = (users, calls, branches) => {
    const userActivity = {};
    calls.forEach((call) => {
      if (call.action === "CODE_TRIGGER") {
        const userId = call.performed_by_user_id;
        if (!userActivity[userId]) {
          userActivity[userId] = {
            count: 0,
            lastActivity: null,
            codes: [],
          };
        }
        userActivity[userId].count++;
        const activityDate = new Date(call.created_at);
        if (!userActivity[userId].lastActivity || activityDate > userActivity[userId].lastActivity) {
          userActivity[userId].lastActivity = activityDate;
        }
        userActivity[userId].codes.push(call);
      }
    });

    const formattedUsers = users
      .map((user) => {
        const activity = userActivity[user.id] || { count: 0, lastActivity: null, codes: [] };
        const branch = branches.find((b) => b.id === user.branch_id) || {};

        return {
          ...user,
          activityCount: activity.count,
          lastActivity: activity.lastActivity,
          branchName: branch.name || "Unknown",
          branchLocation: `${branch.city || ""}, ${branch.state || ""}`,
          recentCodes: activity.codes.slice(0, 3),
        };
      })
      .filter((user) => user.status === "ACTIVE");
      
    return formattedUsers;
  };

  const processData = () => {
    if (processing) return;
    reprocessData();
  };

  useEffect(() => {
    if (usersData.length > 0 && callData.length > 0 && branchData.length > 0) {
      processData();
    }
  }, [usersData, callData, branchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      console.error("Refresh error:", error);
    }
    setRefreshing(false);
  };

  const filteredData = useMemo(() => {
    if (!userData.length || !callData.length) return { users: [], calls: [] };

    const startDate = getFilteredDateRange(timeRange);
    
    const filteredCalls = callData.filter(call => {
      const callDate = new Date(call.created_at || call.createdAt);
      return callDate >= startDate && call.action === "CODE_TRIGGER";
    });
    
    const usersWithFilteredActivity = userData.map(user => {
      const userCalls = filteredCalls.filter(call => call.performed_by_user_id === user.id);
      return {
        ...user,
        filteredActivityCount: userCalls.length,
        originalActivityCount: user.activityCount
      };     
    });
    
    return {
      users: usersWithFilteredActivity,
      calls: filteredCalls
    };
  }, [userData, callData, timeRange]);

  const topPerformers = useMemo(() => {
    if (!filteredData.users || filteredData.users.length === 0) {
      return [];
    }
    
    return [...filteredData.users]
      .filter(user => {
        const count = timeRange === 'all' ? user.activityCount : user.filteredActivityCount;
        return count > 0;
      })
      .sort((a, b) => {
        const aCount = timeRange === 'all' ? a.activityCount : a.filteredActivityCount;
        const bCount = timeRange === 'all' ? b.activityCount : b.filteredActivityCount;
        return bCount - aCount;
      })
      .slice(0, 5);
  }, [filteredData.users, timeRange]);

  const codeDistribution = useMemo(() => {
    return codesData.map(code => ({
      name: code.code_name,
      count: filteredData.calls.filter(call => call.code_id === code.id).length,
      color: code.code_color || '#cccccc',
      legendFontColor: theme.colors.grey0,
      legendFontSize: 12,
    }));
  }, [codesData, filteredData.calls]);

  const exportToCSV = async () => {
    try {
      let csv = "Name,Username,Activity Count,Last Activity,Branch\n";
      csv += userData
        .map(
          (user) =>
            `"${user.first_name} ${user.last_name}","${user.username}",${user.activityCount},"${
              user.lastActivity ? moment(user.lastActivity).format("YYYY-MM-DD") : "Never"
            }","${user.branchName}"`
        )
        .join("\n");

      const fileUri = FileSystem.documentDirectory + `user_activity_${moment().format("YYYYMMDD_HHmmss")}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "User Activity Report",
        UTI: "public.comma-separated-values-text",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      Alert.alert("Error", "Failed to export report. Please try again.");
    }
  };

  const toggleUserExpand = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
    Animated.timing(animation, {
      toValue: expandedUser === userId ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const getCodeById = (id) => codesData.find(code => code.id === id) || null;
  const getUserById = (id) => usersData.find(user => user.id === id) || null;
  const getBranchById = (id) => branchData.find(branch => branch.id === id) || null;

  const renderTopPerformersChart = () => {
    if (topPerformers.length === 0) {
      return (
        <View style={extraStyles.noDataContainer}>
          <TrendingUp size={32} color={theme.colors.grey3} style={extraStyles.noDataIcon} />
          <Text style={extraStyles.noDataText}>
            No user activity found
          </Text>
          <Text style={extraStyles.noDataSubText}>
            for {timeRange === 'Thisday' ? 'today' : timeRange === 'week' ? 'this week' : timeRange === 'month' ? 'this month' : 'all time'}
          </Text>
        </View>
      );
    }

    // Generate distinct colors for each bar
    const generateColors = (count) => {
      const colors = [];
      for (let i = 0; i < count; i++) {
        const hue = (i * 360 / count) % 360;
        colors.push(`hsl(${hue}, 70%, 60%)`);
      }
      return colors;
    };

    const barColors = generateColors(topPerformers.length);

    const chartData = {
      labels: topPerformers.map((user) => {
        const name = user.first_name || 'Unknown';
        return name.length > 6 ? `${name.substring(0, 6)}...` : name;
      }),
      datasets: [
        {
          data: topPerformers.map((user) => {
            const count = timeRange === 'all' ? user.activityCount : user.filteredActivityCount;
            return Math.max(count, 1);
          }),
          colors: topPerformers.map((_, index) => (opacity = 1) => barColors[index]),
        },
      ],
    };

    const chartConfig = {
      backgroundColor: theme.colors.background || '#ffffff',
      backgroundGradientFrom: theme.colors.background || '#ffffff',
      backgroundGradientTo: theme.colors.background || '#ffffff',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      labelColor: (opacity = 1) => theme.colors.grey0 || `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForBackgroundLines: {
        strokeDasharray: "",
        stroke: theme.colors.grey4 || '#e0e0e0',
        strokeWidth: 1,
      },
      propsForLabels: {
        fontSize: 11,
        fontWeight: '500',
      },
      barPercentage: 0.8,
      useShadowColorFromDataset: false,
      fillShadowGradient: theme.colors.primary,
      fillShadowGradientOpacity: 1,
    };

    const chartWidth = Math.max(screenWidth - 32, topPerformers.length * 60);
    const chartHeight = 220;

    return (
      <View style={extraStyles.chartWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          <BarChart
            data={chartData}
            width={chartWidth}
            height={chartHeight}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            fromZero={true}
            showBarTops={false}
            withInnerLines={true}
            verticalLabelRotation={0}
            horizontalLabelRotation={0}
            segments={4}
            showValuesOnTopOfBars={true}
          />
        </ScrollView>
        
        <View style={extraStyles.chartLegend}>
          <Text style={extraStyles.chartLegendTitle}>Performance Summary</Text>
          {topPerformers.map((user, index) => (
            <View key={user.id} style={extraStyles.legendItem}>
              <View style={[extraStyles.legendColor, { backgroundColor: barColors[index] }]} />
              <Text style={extraStyles.legendText}>
                {user.first_name} {user.last_name}
              </Text>
              <Text style={[extraStyles.legendText, { flex: 0, fontWeight: 'bold' }]}>
                {timeRange === 'all' ? user.activityCount : user.filteredActivityCount}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderUserCard = ({ item }) => {
    const rotateAnim = animation.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "180deg"],
    });

    const activityCount = timeRange === 'all' ? item.activityCount : item.filteredActivityCount;

    return (
      <Animated.View style={[extraStyles.enhancedCard, extraStyles.cardGradient]}>
        <TouchableOpacity onPress={() => toggleUserExpand(item.id)} activeOpacity={0.8}>
          <View style={style.cardHeader}>
            <View style={style.userInfo}>
              <View style={[style.userAvatar, { backgroundColor: theme.colors.primary }]}>
                <User color="white" size={20} />
              </View>
              <View style={style.userText}>
                <Text style={[style.userName, { color: theme.colors.grey0, fontSize: 16, fontWeight: '700' }]}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text style={[style.userDetails, { color: theme.colors.grey2, fontSize: 13 }]}>
                  @{item.username} • {item.branchName}
                </Text>
              </View>
            </View>
            <Animated.View style={{ transform: [{ rotate: rotateAnim }] }}>
              <ChevronDown color={theme.colors.grey2} size={20} />
            </Animated.View>
          </View>

          <View style={extraStyles.statsContainer}>
            <View style={extraStyles.statBox}>
              <Text style={extraStyles.statNumber}>{activityCount}</Text>
              <Text style={extraStyles.statLabel}>Activities</Text>
            </View>
            <View style={extraStyles.statBox}>
              <Text style={[extraStyles.statNumber, { fontSize: 16 }]}>
                {item.lastActivity ? moment(item.lastActivity).format("MMM D") : "-"}
              </Text>
              <Text style={extraStyles.statLabel}>Last Activity</Text>
            </View>
            <View style={extraStyles.statBox}>
              <Text style={[extraStyles.statNumber, { fontSize: 16 }]}>
                {item.lastActivity ? moment(item.lastActivity).fromNow() : "Never"}
              </Text>
              <Text style={extraStyles.statLabel}>Time Ago</Text>
            </View>
          </View>
        </TouchableOpacity>

        {expandedUser === item.id && (
          <View style={style.detailsContainer}>
            {item.recentCodes.length > 0 ? (
              <>
                <Text style={[style.detailsTitle, { fontSize: 16, fontWeight: '600', marginBottom: 12 }]}>
                  Recent Code Activations
                </Text>
                {item.recentCodes.map((code, index) => {
                  const codeInfo = getCodeById(code.code_id);
                  const branchInfo = getBranchById(code.branch_id);
                  return (
                    <View key={`code-${index}`} style={[style.activityItem, { backgroundColor: theme.colors.grey5, borderRadius: 8, marginBottom: 8 }]}>
                      <View style={style.activityHeader}>
                        <View style={style.codeIconContainer}>
                          {codeInfo?.code_icon === "fire" && <Flame size={16} color="#ff0000" />}
                          {codeInfo?.code_icon === "heart-pulse" && <HeartPulse size={16} color="#0000ff" />}
                          {codeInfo?.code_icon === "alert" && <AlertCircle size={16} color="#ffa500" />}
                        </View>
                        <Text style={[style.codeText, { flex: 1 }]}>
                          {codeInfo?.code_name || "Unknown"} • {branchInfo?.name || "Unknown"}
                        </Text>
                        <Badge
                          value={code.status}
                          status={code.status === "ACTIVE" ? "success" : "error"}
                          badgeStyle={style.badge}
                        />
                      </View>
                      <View style={style.activityDetails}>
                        <Text style={style.activityText}>
                          <Clock size={12} color={theme.colors.grey2} /> {moment(code.created_at).format("MMM D, YYYY h:mm A")}
                        </Text>
                        <Text style={style.activityText}>Duration: {code.duration} seconds</Text>
                      </View>
                    </View>
                  );
                })}
              </>
            ) : (
              <Text style={style.noActivityText}>No recent code activations</Text>
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  const renderSummaryTab = () => {
    if (loading) {
      return (
        <View style={style.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.grey1, marginTop: 12 }}>Loading data...</Text>
        </View>
      );
    }

    const timeRangeLabel = timeRange === 'Thisday' ? 'Today' : timeRange === 'week' ? 'This Week' : timeRange === 'month' ? 'This Month' : 'All Time';

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={extraStyles.timeRangeContainer}>
          {["Thisday", "week", "month", "all"].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                extraStyles.timeRangeButton,
                timeRange === range && extraStyles.timeRangeButtonActive
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[
                extraStyles.timeRangeButtonText,
                timeRange === range && extraStyles.timeRangeButtonTextActive
              ]}>
                {range === "Thisday" ? "Today" : range === "week" ? "7 Days" : range === "month" ? "30 Days" : "All Time"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={extraStyles.sectionHeader}>
          <BarChart2 size={22} color={theme.colors.primary} />
          <Text style={extraStyles.sectionTitle}>Top Performers</Text>
          <Text style={extraStyles.sectionSubtitle}>({timeRangeLabel})</Text>
        </View>
        {renderTopPerformersChart()}

        <View style={extraStyles.sectionHeader}>
          <PieChart size={22} color={theme.colors.primary} />
          <Text style={extraStyles.sectionTitle}>Code Distribution</Text>
          <Text style={extraStyles.sectionSubtitle}>({timeRangeLabel})</Text>
        </View>
        <View style={extraStyles.chartWrapper}>
          {codeDistribution.some(item => item.count > 0) ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <RNPieChart
                data={codeDistribution.filter(item => item.count > 0)}
                width={Math.max(screenWidth - 32, 320)}
                height={220}
                chartConfig={{
                  backgroundColor: theme.colors.background,
                  backgroundGradientFrom: theme.colors.background,
                  backgroundGradientTo: theme.colors.background,
                  color: (opacity = 1) => theme.colors.grey0,
                }}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                hasLegend={true}
              />
            </ScrollView>
          ) : (
            <View style={extraStyles.noDataContainer}>
              <PieChart size={32} color={theme.colors.grey3} style={extraStyles.noDataIcon} />
              <Text style={extraStyles.noDataText}>No code data available</Text>
              <Text style={extraStyles.noDataSubText}>for selected time range</Text>
            </View>
          )}
        </View>

        <View style={extraStyles.sectionHeader}>
          <User size={22} color={theme.colors.primary} />
          <Text style={extraStyles.sectionTitle}>User Activity</Text>
          <Text style={extraStyles.sectionSubtitle}>({timeRangeLabel})</Text>
        </View>
        
        <FlatList
          data={filteredData.users.sort((a, b) => {
            const aCount = timeRange === 'all' ? a.activityCount : a.filteredActivityCount;
            const bCount = timeRange === 'all' ? b.activityCount : b.filteredActivityCount;
            return bCount - aCount;
          })}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserCard}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={extraStyles.noDataContainer}>
              <User size={32} color={theme.colors.grey3} style={extraStyles.noDataIcon} />
              <Text style={extraStyles.noDataText}>No users found</Text>
              <Text style={extraStyles.noDataSubText}>for selected time range</Text>
            </View>
          }
        />
      </ScrollView>
    );
  };

  const renderActivityTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={extraStyles.sectionHeader}>
        <Activity size={22} color={theme.colors.primary} />
        <Text style={extraStyles.sectionTitle}>Recent Activity</Text>         
      </View>
      <FlatList
        data={[...callData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const user = getUserById(item.performed_by_user_id);
          const code = getCodeById(item.code_id);
          const branch = getBranchById(item.branch_id);

          return (
            <View style={style.activityCard}>
              <View style={style.activityCardHeader}>
                <View style={[style.userAvatar, { backgroundColor: theme.colors.primary }]}>
                  <User color="white" size={16} />
                </View>
                <View>
                  <Text style={style.activityUser}>
                    {user ? `${user.first_name} ${user.last_name}` : "Unknown User"}
                  </Text>
                  <Text style={style.activityTime}>{moment(item.created_at).fromNow()}</Text>
                </View>
              </View>

              <View style={style.activityCardBody}>
                <View style={style.codeBadge}>
                  <Text style={[style.codeBadgeText, { color: code?.code_color || "#000" }]}>
                    {code?.code_name || "Unknown"}
                  </Text>
                </View>
                <Text style={style.activityDetails}>{code?.code_purpose || "No description available"}</Text>
                <Text style={style.activityBranch}>
                  {branch?.name || "Unknown Branch"} • {item.duration} seconds
                </Text>
              </View>
            </View>
          );
        }}
        scrollEnabled={false}
      />
    </ScrollView>
  );

  const renderCodesTab = () => (
    <>
      <View style={style.sectionHeader}>
        <Code size={20} color={theme.colors.primary} />
        <Text style={style.sectionTitle}>Emergency Codes</Text>
      </View>
      <FlatList
        data={codesData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[style.codeCard, { borderLeftColor: item.code_color }]}>
            <View style={style.codeCardHeader}>
              <Text style={style.codeName}>{item.code_name}</Text>
              <Badge
                value={item.status}
                status={item.status === "ACTIVE" ? "success" : "error"}
                badgeStyle={style.badge}
              />
            </View>
            <Text style={style.codePurpose}>{item.code_purpose}</Text>
            <View style={style.codeStats}>
              <Text style={style.codeStat}>Activations: {callData.filter((c) => c.code_id === item.id).length}</Text>
              <Text style={style.codeStat}>
                Last used:{" "}
                {callData.filter((c) => c.code_id === item.id).length > 0
                  ? moment(
                      callData
                        .filter((c) => c.code_id === item.id)
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at
                    ).fromNow()
                  : "Never"}
              </Text>
            </View>
          </View>
        )}
        scrollEnabled={false}
      />
    </>
  );

  if (loading || usersData.length === 0) {
    return (
      <View style={style.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={style.loadingText}>Loading activity data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={style.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
    >
      <View style={style.header}>
        <Text style={[style.title, { color: theme.colors.primary }]}>System Analytics</Text>
        <TouchableOpacity onPress={exportToCSV} style={[style.exportButton, { borderColor: theme.colors.primary }]}>
          <Download size={18} color={theme.colors.primary} />
          <Text style={[style.exportText, { color: theme.colors.primary }]}>Export</Text>
        </TouchableOpacity>
      </View>

      <View style={style.tabContainer}>
        {["summary", "activity", "codes"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              style.tabButton,
              activeTab === tab && {
                borderBottomColor: theme.colors.primary,
                borderBottomWidth: 3,
              },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[style.tabText, activeTab === tab && { color: theme.colors.primary }]}>
              {tab === "summary" ? "Summary" : tab === "activity" ? "Activity" : "Codes"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "summary" && renderSummaryTab()}
      {activeTab === "activity" && renderActivityTab()}
      {activeTab === "codes" && renderCodesTab()}
    </ScrollView>
  );
};

export default UserActivityReport;