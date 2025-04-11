import { View } from "react-native";
import React from "react";
import { Button } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";

const Home = () => {
  const navigation = useNavigation();
  return (
    <View>
      <Button onPress={() => navigation.navigate("Login")}>Login</Button>
      <Button onPress={() => navigation.navigate("ForgotPassword")}>ForgotPassword</Button>
      <Button onPress={() => navigation.navigate("Registration")}>Registration</Button>
      <Button onPress={() => navigation.navigate("OTPVerification")}>OTP Verification</Button>
      <Button onPress={() => navigation.navigate("EnterOTP")}>Enter OTP</Button>
      <Button onPress={() => navigation.navigate("SetnewPassword")}>New Password</Button>
      <Button onPress={() => navigation.navigate("RequestChange")}>Request Location Change</Button>
      <Button onPress={() => navigation.navigate("LocationManage")}>Location Manage</Button>
      <Button onPress={() => navigation.navigate("SelectCode")}>Select Code</Button>
      <Button onPress={() => navigation.navigate("Contactus")}>Contact us</Button>
      <Button onPress={() => navigation.navigate("RecordCode")}>Record Code</Button>
    </View>
  );
};

export default Home;
