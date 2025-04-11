import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Button ,Text, Input } from '@rneui/themed';

const Registration = () => {

  return (

    <SafeAreaView style={styles.container}>
     <View style={styles.loginContainer}><Text h3>Registration Form</Text></View>      
      <Text  style={styles.mainlable}>First Name</Text>     
      <Input  placeholder="First Name" /> 
      <Text  style={styles.mainlable}>Last Name</Text>     
      <Input  placeholder="Last Name" /> 
      <Text  style={styles.mainlable}>Gender</Text>     
      <Input  placeholder="Gender" /> 
      <Text  style={styles.mainlable}>Email Id</Text>     
      <Input  placeholder="Email Id" /> 
      <Text  style={styles.mainlable}>Phone Number</Text>     
      <Input  type="Number"
        placeholder='9345725583'
        errorStyle={{ color: 'red' }}
        errorMessage='Phone Number already registered.'/> /> 
      <Text  style={styles.mainlable}>Password</Text>           
      <Input  placeholder="Password" secureTextEntry={true}/>
      <Text  style={styles.mainlable}>Confirm Password</Text>           
      <Input  placeholder="Confirm Password" secureTextEntry={true}/>
      <Button title="Register" type="solid"  ></Button>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#fff',
  },
  loginContainer:{
    alignItems: 'center',
    marginBottom: 10,
  },
  label:{
    marginLeft: 0,
    fontSize: 15,    
    paddingLeft: 0,
  },
  mainlable:{
    paddingHorizontal: 15,
    fontFamily: 'Verdana',
    fontSize:17,
  }, 
});

export default Registration;
