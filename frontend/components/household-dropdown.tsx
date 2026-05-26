import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, Button } from 'react-native-paper';
import { useHousehold } from '@/context/household-context';

export function HouseholdDropdown() {
  const { households, activeHousehold, setActiveHousehold } = useHousehold();
  const [visible, setVisible] = useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  if (households.length === 0) return null;

  return (
    <View style={styles.container}>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <Button
            mode="outlined"
            onPress={openMenu}
            icon="home-group"
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {activeHousehold?.name || 'WG wählen'}
          </Button>
        }
      >
        {households.map((h) => (
          <Menu.Item
            key={h.id}
            onPress={() => {
              setActiveHousehold(h);
              closeMenu();
            }}
            title={h.name}
            leadingIcon={h.id === activeHousehold?.id ? 'check' : 'home'}
          />
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  button: {
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  buttonContent: {
    flexDirection: 'row',
  },
});
