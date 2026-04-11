import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Category } from '../types'

interface CategoryTabsProps {
  categories: Category[]
  selected: string
  onSelect: (category: string) => void
}

export function CategoryTabs({ categories, selected, onSelect }: CategoryTabsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.name}
            style={[
              styles.tab,
              selected === cat.name && styles.tabActive
            ]}
            onPress={() => onSelect(cat.name)}
          >
            <Text style={styles.tabIcon}>{cat.icon}</Text>
            <Text style={[
              styles.tabText,
              selected === cat.name && styles.tabTextActive
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: '#FF6B6B',
  },
  tabIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
})
