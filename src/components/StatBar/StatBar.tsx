import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface StatBarProps {
  label: string;
  value: number;       
  maxValue: number;    
  color?: string;      
  unit?: string;       
}

export const StatBar: React.FC<StatBarProps> = ({ 
  label, 
  value, 
  maxValue, 
  color = '#007AFF', // 默认经典蓝
  unit = '' 
}) => {
  // 利用 Math 限制填充率在 0-100% 之间，防止超界
  const fillPercentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valueText}>
          {value} <Text style={styles.unit}>{unit}</Text>
        </Text>
      </View>
      <View style={styles.barBackground}>
        {/* 利用纯粹的 View 和百分比进行绝对精准渲染 */}
        <View 
          style={[
            styles.barFill, 
            { width: `${fillPercentage}%`, backgroundColor: color }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  unit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
  },
  barBackground: {
    height: 10,
    backgroundColor: '#E5E5EA',
    borderRadius: 5,
    overflow: 'hidden', // 关键底层设定：强行把内部方块切角，跟随容器圆角
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
});
