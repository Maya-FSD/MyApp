import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
//import Login from './script/Login';
import Dbfetch from 'Dbfetch';


const App = () => {
  return (

    <SafeAreaView style={styles.container}>
    <Dbfetch/>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },  
});
export default App;
