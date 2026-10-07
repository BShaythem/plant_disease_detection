import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';
import { MOCK_NEWS } from '../../utils/mockData';
import { NewsArticle } from '../../types';

const CATEGORIES = ['All', 'Crop Protection', 'Water Conservation', 'Organic Farming', 'AI Technology'];

export default function NewsScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);

  const filteredNews =
    selectedCategory === 'All'
      ? MOCK_NEWS
      : MOCK_NEWS.filter((item) => item.category === selectedCategory);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={colors.gradients.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerBadge}>ORCHARD INTELLIGENCE</Text>
              <Text style={styles.headerTitle}>Olive Agronomy News</Text>
              <Text style={styles.headerSubtitle}>
                Phytosanitary alerts, research findings & olive farming practices
              </Text>
            </View>
            <View style={styles.headerIconBox}>
              <FontAwesome5 name="newspaper" size={22} color={colors.gold} />
            </View>
          </View>
        </LinearGradient>

        {/* Filter Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.categoryText, isSelected && styles.categoryTextActive]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Featured Alert Card */}
        <View style={styles.alertCardContainer}>
          <LinearGradient
            colors={['#FFFDF8', '#FAF4E3']}
            style={styles.alertCard}
          >
            <View style={styles.alertIconRow}>
              <MaterialCommunityIcons name="weather-partly-rainy" size={24} color={colors.goldMuted} />
              <View style={styles.alertTextWrap}>
                <Text style={styles.alertTitle}>Seasonal Disease Warning: Autumn Spore Peak</Text>
                <Text style={styles.alertBody}>
                  Elevated leaf wetness triggers Spilocaea oleagina germination. Ensure preventative
                  copper sprays before rain spells exceed 48 hours.
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Articles List */}
        <View style={styles.articlesContainer}>
          <Text style={styles.sectionHeading}>
            {selectedCategory === 'All' ? 'Latest Publications' : `${selectedCategory} Articles`}
          </Text>

          {filteredNews.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              onPress={() => setActiveArticle(article)}
              activeOpacity={0.85}
            >
              <View style={styles.articleTopRow}>
                <View style={styles.articleBadge}>
                  <Text style={styles.articleBadgeText}>{article.tag}</Text>
                </View>
                <View style={styles.articleMeta}>
                  <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.articleMetaText}>{article.readTime}</Text>
                </View>
              </View>

              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleSummary} numberOfLines={3}>
                {article.summary}
              </Text>

              <View style={styles.articleFooter}>
                <View style={styles.authorRow}>
                  <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
                  <Text style={styles.authorText}>{article.author}</Text>
                </View>
                <View style={styles.readMoreRow}>
                  <Text style={styles.readMoreText}>Read Article</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Article Detail Modal */}
      <Modal
        visible={!!activeArticle}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveArticle(null)}
      >
        {activeArticle && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setActiveArticle(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Article</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.modalTag}>
                <Text style={styles.modalTagText}>{activeArticle.category}</Text>
              </View>
              <Text style={styles.modalTitle}>{activeArticle.title}</Text>

              <View style={styles.modalAuthorBox}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalAuthorName}>{activeArticle.author}</Text>
                  <Text style={styles.modalMetaLine}>
                    {activeArticle.date} • {activeArticle.readTime}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryCallout}>
                <Text style={styles.summaryCalloutText}>{activeArticle.summary}</Text>
              </View>

              <Text style={styles.articleContentText}>{activeArticle.content}</Text>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.olivePale,
    marginTop: 4,
    maxWidth: 260,
  },
  headerIconBox: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  categoryScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  alertCardContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  alertCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    ...shadows.soft,
  },
  alertIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  alertBody: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 4,
  },
  articlesContainer: {
    paddingHorizontal: spacing.md,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  articleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  articleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  articleBadge: {
    backgroundColor: colors.oliveSoftBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  articleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  articleMetaText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
  },
  articleSummary: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  authorText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.oliveSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalBody: {
    padding: spacing.lg,
    paddingBottom: 50,
  },
  modalTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.oliveSoftBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    marginBottom: 12,
  },
  modalTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 28,
    marginBottom: 16,
  },
  modalAuthorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.oliveSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalMetaLine: {
    fontSize: 12,
    color: colors.textMuted,
  },
  summaryCallout: {
    backgroundColor: colors.backgroundSecondary,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
    padding: 14,
    borderRadius: borderRadius.sm,
    marginBottom: 18,
  },
  summaryCalloutText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  articleContentText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
