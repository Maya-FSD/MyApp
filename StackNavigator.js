import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Testpage1 from "./screens/Testpage1";
import Testpage2 from "./screens/Testpage2";
import Testpage3 from "./screens/Testpage3";
import Testpage4 from "./screens/Testpage4";
import Testpage5 from "./screens/Testpage5";
import Testpage6 from "./screens/Testpage6";
import Testpage7 from "./screens/Testpage7";
import Testpage8 from "./screens/Testpage8";
import Testpage9 from "./screens/Testpage9";
import Testpage10 from "./screens/Testpage10";
import Home from "./Home";
import { useTheme } from "@react-navigation/native";

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Testpage1" component={Testpage1} />
      <Stack.Screen name="Testpage2" component={Testpage2} />
      <Stack.Screen name="Testpage3" component={Testpage3} />
      <Stack.Screen name="Testpage4" component={Testpage4} />
      <Stack.Screen name="Testpage5" component={Testpage5} />
      <Stack.Screen name="Testpage6" component={Testpage6} />
      <Stack.Screen name="Testpage7" component={Testpage7} />
      <Stack.Screen name="Testpage8" component={Testpage8} />
      <Stack.Screen name="Testpage9" component={Testpage9} />
      <Stack.Screen name="Testpage10" component={Testpage10} />
    </Stack.Navigator>
  );
};

export default StackNavigator;