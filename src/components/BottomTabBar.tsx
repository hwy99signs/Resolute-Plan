import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, BarChart3, Plus, Calendar, User } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getIconSize, getSpacing, rp, isSmallScreen } from '../utils/responsive';

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const tabs = [
    { id: 'home', Icon: Home, route: '/dashboard' },
    { id: 'insight', Icon: BarChart3, route: '/insights' },
    { id: 'create', Icon: Plus, route: '/create-choice' },
    { id: 'daily', Icon: Calendar, route: '/daily' },
    { id: 'profile', Icon: User, route: '/profile' },
  ];

  const isActive = (route: string) => {
    if (route === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname === route || pathname.startsWith(route + '/');
  };

  const iconSize = getIconSize(22);
  const horizontalPadding = rp(16);
  const bottomPadding = Math.max(insets.bottom, getSpacing(8));

  // Determine icon color based on theme
  const iconColor = isDarkMode ? '#FFFFFF' : '#666666';
  const activeIconColor = isDarkMode ? '#FFFFFF' : colors.primary;

  // Determine background colors based on theme
  const containerBg = isDarkMode ? '#2A2A2A' : '#FFFFFF';
  const activeBg = isDarkMode ? '#3A3A3A' : colors.primaryLight;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: containerBg,
        paddingBottom: bottomPadding,
        paddingHorizontal: horizontalPadding,
        shadowColor: isDarkMode ? '#000' : 'rgba(0, 0, 0, 0.1)',
        shadowOpacity: isDarkMode ? 0.3 : 0.1,
      }
    ]}>
      {tabs.map((tab) => {
        const active = isActive(tab.route);
        const IconComponent = tab.Icon;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconContainer,
              active && { backgroundColor: activeBg }
            ]}>
              <IconComponent 
                size={iconSize} 
                color={active ? activeIconColor : iconColor}
                strokeWidth={active ? 2.5 : 2}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: rp(20),
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: rp(10),
    marginHorizontal: rp(16),
    marginBottom: rp(8),
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: rp(8),
    elevation: 6,
    minHeight: isSmallScreen ? rp(56) : rp(60),
    maxHeight: rp(70),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rp(6),
    minWidth: 0,
  },
  iconContainer: {
    padding: rp(8),
    borderRadius: rp(12),
    minWidth: rp(40),
    minHeight: rp(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
