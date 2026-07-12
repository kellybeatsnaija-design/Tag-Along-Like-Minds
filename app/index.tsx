import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { TagAlongColors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'Tag Along',
    subtitle: 'Find your people online.', // Screen text from your file
    description: 'A warm, low-pressure space to connect when you need it.',
  },
  {
    id: '2',
    title: 'Intentional Matching',
    subtitle: 'Based on shared energy',
    description: 'Tag along with like minds for language practice, coding studies, or anything else you fancy.',
  },
  {
    id: '3',
    title: 'Your Terms',
    subtitle: 'Private & Secure',
    description: 'Total control over boundaries. Exit, block, or report instantly at any time.',
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 16);
    return () => clearTimeout(timeout);
  }, [router]);

  const handleScroll = (event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / width);
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      // Transition out to the primary Home Tab
      router.replace('/(tabs)/home');
    }
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Slide Item Carousel Layout */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Mock Visual Branding Elements representing your messaging icons */}
            <View style={styles.logoMockContainer}>
              <View style={[styles.bubbleMock, { backgroundColor: TagAlongColors.primary, left: -15 }]} />
              <View style={[styles.bubbleMock, { backgroundColor: TagAlongColors.secondary, right: -15 }]} />
            </View>

            <Text style={styles.brandTitle}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />

      {/* Footer Interface with Pagination Micro-Indicators */}
      <View style={styles.footerContainer}>
        <View style={styles.paginationRow}>
          {ONBOARDING_SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index 
                  ? { backgroundColor: TagAlongColors.primary, width: 14 } 
                  : { backgroundColor: '#CBD5E1' }
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {activeIndex === ONBOARDING_SLIDES.length - 1 ? "Let's Start" : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TagAlongColors.background, // Warm neutral backdrop
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoMockContainer: {
    width: 120,
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  bubbleMock: {
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.8,
    position: 'absolute',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: TagAlongColors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    color: TagAlongColors.textDark,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    marginBottom: 32,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  actionButton: {
    backgroundColor: TagAlongColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 30, // Smooth rounded action states
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
