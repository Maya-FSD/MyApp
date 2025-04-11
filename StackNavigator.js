import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../screens/login/Login";
import Home from "../screens/home/Home";
import ForgotPassword from "../screens/forgotPassword/ForgotPassword";
import Registration from "../screens/registration/Registration";
import ResendOTP from "../screens/resendotp/Resendotp";
import OTPVerification from "../screens/otpverification/OTPverification";
import EnterOTP from "../screens/enterotp/Enterotp";
import SetnewPassword from "../screens/setnewpassword/Setnewpassword";
import RequestChange from "../screens/requestlocationchange/Requestlocationchange";
import Messagedisplay from "../screens/message/Messagedisplay";
import LocationManage from "../screens/location/Location";
import SelectCode from "../screens/selectcode/Selectcode";
import Contactus from "../screens/contactus/Contactus";
import RecordCode from "../screens/recordcode/Recordcode";
import { useTheme } from "@react-navigation/native";

const StackNavigator = () => {
  const Stack = createNativeStackNavigator();
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },}}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: "Forgot Password" }} />
      <Stack.Screen name="Registration" component={Registration} />
      <Stack.Screen name="ResendOTP" component={ResendOTP} options={{ title: "Resend OTP" }} />
      <Stack.Screen name="OTPVerification" component={OTPVerification} options={{ title: "OTP Verification" }} />
      <Stack.Screen name="EnterOTP" component={EnterOTP} options={{ title: "Enter your Verification code" }} />
      <Stack.Screen name="SetnewPassword" component={SetnewPassword} options={{ title: "Set new Password" }} />
      <Stack.Screen name="RequestChange" component={RequestChange} options={{title: "Request Location Change"}} />
      <Stack.Screen name="Messagedisplay" component={Messagedisplay} options={{title: "Thank You!"}} />
      <Stack.Screen name="LocationManage" component={LocationManage} options={{title: "Location"}} />
      <Stack.Screen name="SelectCode" component={SelectCode} options={{title: "Select Code"}} />
      <Stack.Screen name="Contactus" component={Contactus} options={{title: "Contact us"}} />      
      <Stack.Screen name="RecordCode" component={RecordCode} options={{title: "Record Code"}} />      
      </Stack.Navigator>
  );
};
export default StackNavigator;
