import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const Test = () => {
  const [checked, setChecked] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.checkboxContainer}>
        {/* Custom checkbox */}
        <TouchableOpacity
          style={[styles.checkbox, checked && styles.checkboxChecked]}
          onPress={() => setChecked(!checked)}
        >
          {checked && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        {/* Label */}
        <Text style={styles.label} numberOfLines={1}>
          Keep me signed in
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent:'space-around',
    width:'10%',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#d32f2f', // Red border color
    backgroundColor: '#ffffff', // White background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 0, // Ensure no right margin
  },
  checkboxChecked: {
    backgroundColor: '#d32f2f', // Red background for checked state
  },
  checkmark: {
    color: '#ffffff', // White checkmark color
    fontSize: 14,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    color: '#333333', // Dark text color
    marginLeft: 0, // Remove any left margin
    paddingLeft: 0, // Ensure no padding
  },
});

export default Test;
