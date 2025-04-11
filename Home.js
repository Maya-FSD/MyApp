import { View, ScrollView, StyleSheet } from "react-native";
import React from "react";
import { Button } from "@rneui/themed"; // Use this if you're using RNEUI across your app
import { useNavigation } from "@react-navigation/native";

const pages = Array.from({ length: 10 }, (_, i) => `Testpage${i + 1}`);

const Home = () => {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {pages.map((page) => (
        <Button
          key={page}
          title={page}
          onPress={() => navigation.navigate(page)}
          containerStyle={styles.buttonContainer}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
  },
  buttonContainer: {
    marginVertical: 8,
    width: "80%",
  },
});

export default Home;
