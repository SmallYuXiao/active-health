import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

interface ChipButtonProps {
  label: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  selectedBackgroundColor?: string;
  selectedBorderColor?: string;
  selectedTextColor?: string;
}

export const ChipButton: React.FC<ChipButtonProps> = ({
  label,
  description,
  selected = false,
  disabled = false,
  compact = false,
  onPress,
  style,
  selectedBackgroundColor = '#111827',
  selectedBorderColor = '#111827',
  selectedTextColor = '#FFFFFF',
}) => {
  const containerStyles: StyleProp<ViewStyle> = [
    styles.container,
    compact && styles.compactContainer,
    selected && {
      backgroundColor: selectedBackgroundColor,
      borderColor: selectedBorderColor,
    },
    disabled && styles.disabledContainer,
    style,
  ];

  const labelStyles: StyleProp<TextStyle> = [
    styles.label,
    compact && styles.compactLabel,
    selected && { color: selectedTextColor },
    disabled && styles.disabledLabel,
  ];

  const descriptionStyles: StyleProp<TextStyle> = [
    styles.description,
    selected && styles.selectedDescription,
    disabled && styles.disabledLabel,
  ];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [containerStyles, pressed && !disabled && styles.pressed]}
      disabled={disabled}
    >
      <Text style={labelStyles}>{label}</Text>
      {description ? (
        <View style={styles.descriptionWrap}>
          <Text style={descriptionStyles}>{description}</Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  compactContainer: {
    minHeight: 0,
    paddingVertical: 10,
  },
  compactLabel: {
    fontSize: 13,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  descriptionWrap: {
    marginTop: 4,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
  },
  selectedDescription: {
    color: '#E5E7EB',
  },
  disabledContainer: {
    opacity: 0.5,
  },
  disabledLabel: {
    color: '#9CA3AF',
  },
  pressed: {
    opacity: 0.88,
  },
});
