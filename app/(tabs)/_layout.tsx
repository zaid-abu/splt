import { Tabs } from 'expo-router';
import { TabBar } from '../../src/components/navigation/TabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...(props as any)} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="wallet" />
      <Tabs.Screen 
        name="add" 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // We navigate to the global /add route which is a transparent modal
            navigation.navigate('add');
          },
        })} 
      />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
