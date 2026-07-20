import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TagAlongColors } from '../../constants/Colors';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: TagAlongColors.primary,
      tabBarInactiveTintColor: '#94A3B8',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderColor: '#F1F5F9',
        height: 56 + insets.bottom,
        paddingBottom: Math.max(insets.bottom, 8),
      }
    }}>
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="my-tags" 
        options={{ 
          title: 'My Tags',
          tabBarIcon: ({ color, size }) => <Ionicons name="pricetags-outline" size={size} color={color} />
        }} 
      />
      
      {/* Hidden layout tab entry used to store the screen reference without showing a tab block */}
      <Tabs.Screen 
        name="create-flow" 
        options={{ 
          href: null, // Hides this option visually from the bottom strip!
        }} 
      />

      <Tabs.Screen
        name="profile"
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />
        }} 
      />
    </Tabs>
  );
}
