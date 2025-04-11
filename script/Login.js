import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View, TouchableOpacity  } from 'react-native';
//import {CheckBox} from 'react-native-community/checkbox';
import { Button ,Text, Input } from '@rneui/themed';
import {  CheckBox } from '@rneui/base';

const Login = () => {

  return (

    <SafeAreaView style={styles.container}>
     <View style={styles.loginContainer}><Text h2>Login</Text></View>      
      <Text  style={styles.mainlable}>Phone Number</Text>      
      <Input      
        type="Number"
        placeholder='9345725583'
        errorStyle={{ color: 'red' }}
        errorMessage='Please Enter a Valid Phone Number!'/>
      <Text  style={styles.mainlable}>Password</Text>
      <Input  placeholder="Password" secureTextEntry={true}/>
     <View style={styles.forgetContainer}><Text >Forget Password?</Text></View>
      <View style={styles.checkboxContainer}>
        <View style={styles.checkstyle}><CheckBox/></View>
      <View><Text style={styles.label}>Keep me signed in</Text></View>        
      </View>    
      <Button title="Login" type="solid"  ></Button>
      <Text style={styles.account} >Create an account</Text>
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
    marginBottom: 40,
  },
 checkboxContainer: {
    flexDirection: 'row',    
    alignItems: 'center',           
    borderWidth: 0, 
    padding: 0,     
  },
  label:{
    marginLeft: 0,
    fontSize: 16,    
    paddingLeft: 0,
  },
  checkstyle:{    
    padding: 0,
    margin: 0, 
  },
  account:{
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  forgetContainer:{
    alignItems: 'flex-end',
    fontFamily: 'Verdana',
    fontSize:10,
  },  
  mainlable:{
    paddingHorizontal: 15,
    fontFamily: 'Verdana',
    fontSize:18,
  }, 

});

export default Login;
