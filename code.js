import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

export default function code() {
  const [selectedLocation, setSelectedLocation] = useState("DASH");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>App Name</Text>
        <View style={styles.dropdownContainer}>
          <Picker
            selectedValue={selectedLocation}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedLocation(itemValue)}
          >
            <Picker.Item label="DASH" value="DASH" />
            <Picker.Item label="Location 2" value="Location2" />
            <Picker.Item label="Location 3" value="Location3" />
          </Picker>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        <TouchableOpacity style={[styles.card, styles.red]}>
          <Text style={styles.cardText}>Code Red</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.blue]}>
          <Text style={styles.cardText}>Code Blue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.orange]}>
          <Text style={styles.cardText}>Code Orange</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.grey]}>
          <Text style={styles.cardText}>Code Grey</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.pink]}>
          <Text style={styles.cardText}>Code Pink</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.yellow]}>
          <Text style={styles.cardText}>Code Yellow</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.white]}>
          <Text style={styles.cardText}>Code RRT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.white]}>
          <Text style={styles.cardText}>Code Stemi</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#4a90e2",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 40,
    width: 150,
  },
  grid: {
    padding: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    height: 100,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cardText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  red: {
    backgroundColor: "#ff4d4d",
  },
  blue: {
    backgroundColor: "#4d88ff",
  },
  orange: {
    backgroundColor: "#ffa64d",
  },
  grey: {
    backgroundColor: "#b3b3b3",
  },
  pink: {
    backgroundColor: "#ff66b3",
  },
  yellow: {
    backgroundColor: "#ffff4d",
  },
  white: {
    backgroundColor: "#e6e6e6",
  },
});

//export default code;