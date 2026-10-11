// src/app/chat.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../constants/theme';
import { LeafImage } from '../components/LeafImage';
import {
  generateChatResponse,
  buildSystemPrompt,
  ChatMessage,
} from '../services/llm';
import {
  getDiseaseByLabel,
  getDiseaseDoc,
  getSuggestedQuestions,
  createSession,
  saveMessage,
  getSessionMessages,
} from '../services/db';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    sessionId?: string;
    classLabel?: string;
    diseaseName?: string;
    confidence?: string;
    imageUri?: string;
  }>();

  const [sessionId, setSessionId] = useState<string>(params.sessionId || '');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedChips, setSuggestedChips] = useState<string[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [diseaseDocMarkdown, setDiseaseDocMarkdown] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const classLabel = params.classLabel || '';
  const diseaseName = params.diseaseName || '';
  const confidence = params.confidence ? parseFloat(params.confidence) : undefined;
  const imageUri = params.imageUri;
  const isHealthy = classLabel.toLowerCase() === 'healthy';

  // 1. Initialize session, Tier 1 context, and greeting
  useEffect(() => {
    let isMounted = true;

    async function initChat() {
      try {
        // Resolve or create session ID
        let currentSessionId = sessionId;
        if (!currentSessionId) {
          const session = await createSession(
            diseaseName ? `Consultation: ${diseaseName}` : 'General Olive Consultation'
          );
          currentSessionId = session.id;
          if (isMounted) setSessionId(session.id);
        }

        // Fetch existing messages from SQLite app.db
        const existingRecords = await getSessionMessages(currentSessionId);
        if (existingRecords.length > 0) {
          const formatted: DisplayMessage[] = existingRecords
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              createdAt: m.created_at,
            }));
          if (isMounted) setMessages(formatted);
        }

        // Build Tier 1 grounded context
        let docMarkdown: string | null = null;
        let chips: string[] = [];

        if (classLabel && !isHealthy) {
          const diseaseRecord = await getDiseaseByLabel(classLabel);
          if (diseaseRecord) {
            const doc = await getDiseaseDoc(diseaseRecord.id);
            if (doc) docMarkdown = doc.content_md;

            const qRows = await getSuggestedQuestions(diseaseRecord.id);
            if (qRows.length > 0) {
              chips = qRows.map((q) => q.question_text);
            }
          }
        }

        if (chips.length === 0) {
          if (isHealthy) {
            chips = [
              'How to maintain good leaf color?',
              'Best irrigation schedule for olives?',
              'When is the right time to prune?',
            ];
          } else if (classLabel === 'olivepeacockspot') {
            chips = [
              'When should I spray copper fungicide?',
              'How to prune dense canopy for airflow?',
              'Does rain spread peacock spot?',
            ];
          } else if (classLabel === 'aculus_olive') {
            chips = [
              'When should I apply wettable sulfur?',
              'How to protect natural predatory mites?',
              'What damage occurs on spring shoots?',
            ];
          } else {
            chips = [
              'How to detect fungal infections early?',
              'Recommended spring fertilizer balance?',
              'Best drip irrigation practices?',
            ];
          }
        }

        const prompt = buildSystemPrompt({
          diseaseName,
          diseaseDocMarkdown: docMarkdown,
          isHealthy,
        });

        if (isMounted) {
          setDiseaseDocMarkdown(docMarkdown);
          setSuggestedChips(chips);
          setSystemPrompt(prompt);

          // If no previous messages, send initial assistant welcome
          if (existingRecords.length === 0) {
            let initialGreeting = '';
            if (diseaseName && !isHealthy) {
              initialGreeting = `Hello! I have reviewed your scan for **${diseaseName}** (${confidence || 0}% confidence).\n\nI am grounded in verified pathology data. How can I help you manage and treat this in your olive grove?`;
            } else if (isHealthy) {
              initialGreeting = `Hello! Your leaf scan shows **Healthy Olive Foliage**.\n\nNo pathogen intervention is needed. I can answer questions about regular canopy pruning, soil nutrients, or irrigation to keep your orchard healthy!`;
            } else {
              initialGreeting = `Hello! I am your on-device **Olive Care AI Assistant**.\n\nAsk me anything about olive grove management, soil balance, irrigation, or seasonal pest prevention.`;
            }

            const welcomeMsg: DisplayMessage = {
              id: 'welcome-' + Date.now(),
              role: 'assistant',
              content: initialGreeting,
              createdAt: Date.now(),
            };

            setMessages([welcomeMsg]);
            await saveMessage({
              sessionId: currentSessionId,
              role: 'assistant',
              content: initialGreeting,
              tier: 1,
            });
          }
        }
      } catch (err) {
        console.error('[Chat] Initialization error:', err);
      }
    }

    initChat();

    return () => {
      isMounted = false;
    };
  }, []);

  // Send message flow with streaming token updates
  const handleSendMessage = async (userText: string) => {
    const textToSend = userText.trim();
    if (!textToSend || isGenerating) return;

    setInputText('');

    const userMessage: DisplayMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: textToSend,
      createdAt: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Save user message to SQLite app.db
    if (sessionId) {
      await saveMessage({
        sessionId,
        role: 'user',
        content: textToSend,
      });
    }

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setIsGenerating(true);

    const assistantMsgId = 'assistant-' + Date.now();
    let accumulatedContent = '';

    // Add empty assistant placeholder
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      },
    ]);

    try {
      // Build conversation history for LLM
      const chatHistory: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...newMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ];

      const result = await generateChatResponse({
        messages: chatHistory,
        onToken: (token) => {
          accumulatedContent += token;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
            )
          );
        },
      });

      const finalContent = result.text || accumulatedContent;

      // Persist final assistant reply to SQLite app.db
      if (sessionId) {
        await saveMessage({
          sessionId,
          role: 'assistant',
          content: finalContent,
          tier: diseaseDocMarkdown ? 1 : null,
          latencyMs: result.latencyMs,
        });
      }
    } catch (err) {
      console.error('[Chat] Generation error:', err);
      const errorFallback =
        'Sorry, I could not complete the response on-device. Please ensure the model file is accessible and try again.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, content: errorFallback } : m
        )
      );
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Olive Care Assistant</Text>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>On-Device AI (Tier 1)</Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Diagnosis Summary Card (if opened from scan) */}
        {diseaseName ? (
          <View style={styles.diagnosisCard}>
            {imageUri ? (
              <LeafImage uri={imageUri} style={styles.leafThumb} resizeMode="cover" />
            ) : null}
            <View style={styles.diagnosisInfo}>
              <Text style={styles.diagnosisLabel}>DIAGNOSED CONDITION</Text>
              <Text style={styles.diagnosisTitle} numberOfLines={1}>
                {diseaseName}
              </Text>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.statusPill,
                    isHealthy ? styles.pillHealthy : styles.pillInfected,
                  ]}
                >
                  <Text style={styles.statusPillText}>
                    {isHealthy ? 'Healthy Leaf' : 'Infected'}
                  </Text>
                </View>
                {confidence !== undefined && (
                  <Text style={styles.confidenceText}>
                    Confidence: {confidence.toFixed(1)}%
                  </Text>
                )}
              </View>
            </View>
          </View>
        ) : null}

        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            return (
              <View
                style={[
                  styles.messageBubbleWrap,
                  isUser ? styles.userWrap : styles.assistantWrap,
                ]}
              >
                {!isUser && (
                  <View style={styles.avatarWrap}>
                    <MaterialCommunityIcons name="leaf" size={18} color={colors.gold} />
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isUser ? styles.userText : styles.assistantText,
                    ]}
                  >
                    {item.content}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Suggested Question Chips */}
        {suggestedChips.length > 0 && !isGenerating && (
          <View style={styles.chipsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {suggestedChips.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chipBtn}
                  onPress={() => handleSendMessage(chip)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="sparkles-outline" size={13} color={colors.primary} />
                  <Text style={styles.chipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask about treatments, pruning, irrigation..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isGenerating}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || isGenerating) && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || isGenerating}
            activeOpacity={0.8}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34A853',
  },
  onlineText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  diagnosisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
    ...shadows.soft,
  },
  leafThumb: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.olivePale,
  },
  diagnosisInfo: {
    flex: 1,
  },
  diagnosisLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  diagnosisTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  pillHealthy: {
    backgroundColor: '#E8F5E9',
  },
  pillInfected: {
    backgroundColor: '#FFEBEE',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  confidenceText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  messageList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 12,
  },
  messageBubbleWrap: {
    flexDirection: 'row',
    gap: 8,
    maxWidth: '85%',
  },
  userWrap: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantWrap: {
    alignSelf: 'flex-start',
  },
  avatarWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  messageBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderBottomLeftRadius: 2,
    ...shadows.soft,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  assistantText: {
    color: colors.textPrimary,
  },
  chipsContainer: {
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  chipsScroll: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.oliveSage,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 4,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
});
