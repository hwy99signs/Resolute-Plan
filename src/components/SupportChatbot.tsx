import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { X, Send } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Type definition for bot steps
type BotStep = {
  message: string;
  options?: { text: string; next: string }[];
  next?: string;
  requiresInput?: boolean;
  requiresContactInfo?: boolean;
};
type BotSteps = {
  [key: string]: BotStep;
};

// Bot Steps - The "brain" of the chatbot
const botSteps: BotSteps = {
  greeting: {
    message: "Hi! 👋 I'm here to help you with Resolute Plan. How can I assist you today?",
    options: [
      { text: "Frequently Asked Questions", next: "faqMenu" },
      { text: "Learn about App Features", next: "features" },
      { text: "Report an Issue", next: "reportIssue" },
      { text: "Ask a Question", next: "askQuestion" },
    ],
  },
  faqMenu: {
    message: "Here are some frequently asked questions. Click on any question to see the answer:",
    options: [
      { text: "How do I create a Resolve?", next: "faqHowToCreate" },
      { text: "Can I have multiple Resolves?", next: "faqMultipleResolves" },
      { text: "How do I delete or edit a Resolve?", next: "faqEditDelete" },
      { text: "How do streaks work?", next: "faqStreaks" },
      { text: "What happens if I miss a day?", next: "faqMissDay" },
      { text: "How do I change my password?", next: "faqChangePassword" },
      { text: "What are the different categories?", next: "faqCategories" },
      { text: "How do I edit milestones?", next: "faqEditMilestones" },
      { text: "What is Premium and how do I upgrade?", next: "faqPremium" },
      { text: "How do I reset my password?", next: "faqResetPassword" },
      { text: "Can I export my data?", next: "faqExport" },
      { text: "How do I change the app language?", next: "faqLanguage" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  features: {
    message: "Great! Here are some key features I can tell you about:",
    options: [
      { text: "Creating a Resolve", next: "faqCreate" },
      { text: "Tracking Progress", next: "faqProgress" },
      { text: "Milestones", next: "faqMilestones" },
      { text: "Dashboard & Stats", next: "faqDashboard" },
      { text: "Settings & Account", next: "faqSettings" },
      { text: "Achievements", next: "faqAchievements" },
      { text: "Notifications & Reminders", next: "faqNotifications" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqCreate: {
    message: "📝 **Creating a Resolve:**\n\nTo create a new Resolve:\n1. Tap the '+' button in the bottom navigation\n2. Select a category (Health & Fitness, Career, Finance, etc.)\n3. Name your Resolve and add a description\n4. Add milestones to break down your goal\n5. Set up reminders if you want notifications\n6. Complete the setup!\n\nResolves help you track long-term goals and stay committed to your resolutions.",
    options: [
      { text: "More FAQs", next: "features" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqProgress: {
    message: "📊 **Tracking Progress:**\n\nProgress is automatically calculated based on completed milestones:\n• View progress bars on each Resolve card\n• Complete milestones to increase your progress percentage\n• Track your streak in the dashboard stats\n• See daily completion stats (milestones done today)\n• Progress updates in real-time as you complete tasks\n\nThe dashboard shows your overall progress at a glance!",
    options: [
      { text: "More FAQs", next: "features" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqMilestones: {
    message: "🎯 **Milestones:**\n\nMilestones are the building blocks of your Resolve:\n• Break down your big goal into smaller, achievable steps\n• Add multiple milestones when creating a Resolve\n• Mark milestones as complete when finished\n• Each completed milestone increases your overall progress\n• View milestone details on the Resolve detail page\n\nTip: Start with 3-5 milestones for better tracking!",
    options: [
      { text: "More FAQs", next: "features" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqDashboard: {
    message: "🏠 **Dashboard & Stats:**\n\nThe dashboard is your command center:\n• View your active Resolves with progress bars\n• See your current streak (consecutive days with activity)\n• Check today's completed milestones\n• View active habits count\n• Tap any Resolve card to see details\n• Pull down to refresh your data\n\nUse the stats cards at the top to track your overall performance!",
    options: [
      { text: "More FAQs", next: "features" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqSettings: {
    message: "⚙️ **Settings & Account:**\n\nAccess settings from the Profile tab:\n• **Dark Mode:** Toggle between light and dark themes\n• **Notifications:** Manage reminder preferences\n• **Language:** Change app language (English, French, Spanish)\n• **Change Password:** Update your account password\n• **Privacy Policy & Terms:** View legal documents\n• **Manage Subscription:** Upgrade to Premium\n\nYour account settings help personalize your experience!",
    options: [
      { text: "More FAQs", next: "features" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqAchievements: {
    message: "🏆 **Achievements:**\n\nTrack your accomplishments:\n• Earn achievements by completing milestones and Resolves\n• View unlocked achievements in the Achievements tab\n• See progress on in-progress achievements\n• Celebrate your milestones and streaks\n• Achievement progress updates automatically\n\nKeep completing your goals to unlock more achievements!",
    options: [
      { text: "More FAQs", next: "features" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqNotifications: {
    message: "🔔 **Notifications & Reminders:**\n\nStay on track with reminders:\n• Set up reminders when creating a Resolve\n• Choose frequency: Daily, Weekly, or Custom\n• Select preferred time: Morning, Afternoon, or Evening\n• Manage all notifications in Settings > Notifications\n• Get notified about milestone completions\n• Receive streak reminders to maintain consistency\n\nNever miss a step in your journey to success!",
    options: [
      { text: "More FAQs", next: "features" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqHowToCreate: {
    message: "📝 **How to Create a Resolve:**\n\n1. Tap the '+' button in the bottom navigation bar\n2. Select a category that matches your goal (Health & Fitness, Career, Finance, etc.)\n3. Enter a name for your Resolve\n4. Add a description (optional but recommended)\n5. Add milestones to break down your goal into steps\n6. Set up reminders if you want notifications\n7. Tap 'Complete Setup' to finish\n\nYour Resolve will appear on your dashboard and you can start tracking your progress!",
    options: [
      { text: "More FAQs", next: "faqMenu" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqMultipleResolves: {
    message: "✅ **Multiple Resolves:**\n\nYes! You can create as many Resolves as you want. There's no limit!\n\n• Each Resolve is independent and tracks its own progress\n• You can have Resolves in different categories\n• All your active Resolves appear on your dashboard\n• You can view all Resolves by tapping 'See All' on the dashboard\n• Manage multiple goals simultaneously without any restrictions\n\nThis helps you work on different areas of your life at the same time!",
    options: [
      { text: "More FAQs", next: "faqMenu" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqEditDelete: {
    message: "✏️ **Editing or Deleting a Resolve:**\n\n**To Edit a Resolve:**\n1. Go to your dashboard\n2. Tap on the Resolve you want to edit\n3. Look for the edit icon (pencil) in the top right\n4. Make your changes\n5. Save your updates\n\n**To Delete a Resolve:**\n1. Open the Resolve detail page\n2. Tap the delete/trash icon\n3. Confirm the deletion\n\n⚠️ Note: Deleting a Resolve is permanent and cannot be undone. All associated milestones and progress will be lost.",
    options: [
      { text: "More FAQs", next: "faqMenu" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqStreaks: {
    message: "🔥 **How Streaks Work:**\n\nA streak is the number of consecutive days you've completed at least one milestone.\n\n• Your streak increases each day you complete a milestone\n• The streak counter resets if you miss a day\n• View your current streak on the dashboard stats card\n• Streaks help motivate you to stay consistent\n• Longer streaks show your dedication and progress\n\n💡 Tip: Even completing one small milestone per day keeps your streak alive!",
    options: [
      { text: "More FAQs", next: "faqMenu" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqMissDay: {
    message: "📅 **What Happens If I Miss a Day?**\n\nDon't worry! Missing a day is normal and happens to everyone.\n\n• Your streak will reset to 0\n• All your Resolves and progress remain intact\n• You can start a new streak the next day\n• Previous achievements are not lost\n• You can continue where you left off\n\n💪 Remember: The goal is progress, not perfection. Just get back on track the next day!",
    options: [
      { text: "More FAQs", next: "faqMenu" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqChangePassword: {
    message: "🔐 **How to Change Your Password:**\n\n1. Go to the Profile tab (bottom navigation)\n2. Tap on 'Settings'\n3. Scroll to the 'Account' section\n4. Tap 'Change Password'\n5. Enter your current password\n6. Enter your new password (minimum 6 characters)\n7. Confirm your new password\n8. Tap 'Change Password' to save\n\n✅ You'll receive a notification confirming your password was changed successfully.",
    options: [
      { text: "More FAQs", next: "faqMenu" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqCategories: {
    message: "📂 **Resolve Categories:**\n\nResolute Plan offers 8 categories to organize your goals:\n\n• 💪 **Health & Fitness** - Exercise, diet, wellness goals\n• 🧠 **Personal Growth** - Self-improvement, learning\n• 💰 **Finance** - Saving, budgeting, financial goals\n• 💼 **Career** - Professional development, job goals\n• ❤️ **Relationships** - Family, friends, social goals\n• 🎨 **Hobbies** - Creative pursuits, interests\n• 📚 **Education** - Learning, courses, skills\n• 🧘 **Wellness** - Mental health, mindfulness\n\nChoose the category that best fits your goal when creating a Resolve!",
    options: [
      { text: "More FAQs", next: "faqMenu" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqEditMilestones: {
    message: "🎯 **Editing Milestones:**\n\n**To Edit a Milestone:**\n1. Open the Resolve that contains the milestone\n2. Find the milestone you want to edit\n3. Tap on the milestone\n4. Look for the edit icon or tap to edit\n5. Update the name, due date, or notes\n6. Save your changes\n\n**To Delete a Milestone:**\n1. Open the milestone details\n2. Tap the delete/trash icon\n3. Confirm deletion\n\n**To Mark Complete:**\n• Simply tap the checkbox next to the milestone\n• Progress will update automatically",
    options: [
      { text: "More FAQs", next: "faqMenu" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqPremium: {
    message: "⭐ **Premium Features:**\n\nPremium unlocks advanced features to supercharge your goal tracking:\n\n• Advanced analytics and insights\n• Unlimited custom templates\n• Priority support\n• Advanced reminder options\n• Export and sharing features\n• And more exclusive features!\n\n**To Upgrade:**\n1. Go to Settings\n2. Tap 'Manage Subscription'\n3. Choose your Premium plan\n4. Complete the purchase\n\n💎 Premium helps you achieve your goals faster with powerful tools!",
    options: [
      { text: "More FAQs", next: "faqMenu" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqResetPassword: {
    message: "🔑 **How to Reset Your Password:**\n\nIf you've forgotten your password:\n\n1. On the login screen, tap 'Forgot Password?'\n2. Enter your email address\n3. Check your email for a password reset link\n4. Click the link in the email\n5. Enter your new password\n6. Confirm your new password\n7. Log in with your new password\n\n📧 If you don't receive the email, check your spam folder or contact support.",
    options: [
      { text: "More FAQs", next: "faqMenu" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqExport: {
    message: "📤 **Exporting Your Data:**\n\nYou can export your Resolves and progress data:\n\n• Export to PDF for printing or sharing\n• Export your data for backup\n• Share your progress with others\n• Keep a record of your achievements\n\n**To Export:**\n1. Go to your dashboard or profile\n2. Look for the 'Export' option\n3. Choose export format (PDF, etc.)\n4. Select what to include\n5. Generate and download your export\n\n💡 Note: Export features may be available in Premium plans.",
    options: [
      { text: "More FAQs", next: "faqMenu" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  faqLanguage: {
    message: "🌍 **Changing App Language:**\n\nResolute Plan supports multiple languages:\n\n**Supported Languages:**\n• English\n• French (Français)\n• Spanish (Español)\n\n**To Change Language:**\n1. Go to Settings (Profile tab)\n2. Tap 'Language'\n3. Select your preferred language\n4. The app will update immediately\n\nAll menus, buttons, and text will change to your selected language!",
    options: [
      { text: "More FAQs", next: "faqMenu" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
  reportIssue: {
    message: "I'm sorry to hear you're experiencing an issue. Before we proceed, I'll need some contact information so we can respond to you.",
    next: "collectContactInfo",
    options: [
      { text: "Cancel", next: "greeting" },
    ],
  },
  askQuestion: {
    message: "I'd be happy to help! Before we proceed, I'll need some contact information so we can respond to you.",
    next: "collectContactInfo",
    options: [
      { text: "Cancel", next: "greeting" },
    ],
  },
  collectContactInfo: {
    message: "Please provide your full name and email address:",
    requiresContactInfo: true,
    options: [
      { text: "Cancel", next: "greeting" },
    ],
  },
  collectMessage: {
    message: "",
    requiresInput: true,
    options: [
      { text: "Cancel", next: "greeting" },
    ],
  },
  issueSubmitted: {
    message: "Thank you for your message! We have received it and will contact you shortly. Your feedback helps us improve Resolute Plan. Is there anything else I can help you with?",
    options: [
      { text: "Ask Another Question", next: "askQuestion" },
      { text: "Report Another Issue", next: "reportIssue" },
      { text: "Back to Main Menu", next: "greeting" },
    ],
  },
};

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface SupportChatbotProps {
  visible: boolean;
  onClose: () => void;
}

export default function SupportChatbot({ visible, onClose }: SupportChatbotProps) {
  const { colors, isDarkMode } = useTheme();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState<string>('greeting');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: botSteps.greeting.message,
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [pendingStep, setPendingStep] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset to greeting when modal opens
      setCurrentStep('greeting');
      setMessages([
        {
          id: '1',
          text: botSteps.greeting.message,
          isBot: true,
          timestamp: new Date(),
        },
      ]);
      setShowInput(false);
      setShowContactForm(false);
      setUserInput('');
      setFullName(profile?.full_name || user?.email?.split('@')[0] || '');
      setEmail(user?.email || '');
      setPendingStep('');
      
      // Slide up animation
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      // Slide down animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, user, profile]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleOptionPress = (option: { text: string; next: string }) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: option.text,
      isBot: false,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    // Check if next step requires input
    const nextStep = botSteps[option.next];
    
    if (!nextStep) return;
    
    // Check if step has a next property (for reportIssue/askQuestion flow)
    if (nextStep.next) {
      setPendingStep(option.next); // Store the original step (reportIssue or askQuestion)
      setCurrentStep(nextStep.next);
      const nextNextStep = botSteps[nextStep.next];
      if (nextNextStep?.requiresContactInfo) {
        setShowContactForm(true);
        setShowInput(false);
        setTimeout(() => {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: nextStep.message + '\n\n' + nextNextStep.message,
            isBot: true,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
        }, 300);
      }
    } else if (nextStep?.requiresContactInfo) {
      setShowContactForm(true);
      setShowInput(false);
      setCurrentStep(option.next);
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: nextStep.message,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 300);
    } else if (nextStep?.requiresInput) {
      setShowInput(true);
      setShowContactForm(false);
      setCurrentStep(option.next);
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: nextStep.message,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 300);
    } else {
      setShowInput(false);
      setShowContactForm(false);
      setCurrentStep(option.next);
      
      // Add bot response
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: nextStep.message,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 300);
    }
  };

  const handleContactInfoSubmit = () => {
    if (!fullName.trim() || !email.trim()) {
      // Show error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Please provide both your full name and email address.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Please enter a valid email address.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // Add confirmation message
    const confirmMessage: Message = {
      id: Date.now().toString(),
      text: `Thank you, ${fullName}! Now please ${pendingStep === 'reportIssue' ? 'describe your issue' : 'type your question'} below.`,
      isBot: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmMessage]);

    // Switch to message input
    setShowContactForm(false);
    setShowInput(true);
    setCurrentStep('collectMessage');
  };

  const handleSubmission = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      isBot: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Log to console (placeholder for backend integration)
    const submissionData = {
      text: text,
      fullName: fullName,
      email: email,
      date: new Date().toISOString(),
      step: pendingStep || currentStep,
      userId: user?.id || null,
    };
    console.log('User Submission:', submissionData);

    // Clear input
    setUserInput('');
    setShowInput(false);

    // Show confirmation message
    setTimeout(() => {
      setCurrentStep('issueSubmitted');
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botSteps.issueSubmitted.message,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 300);
  };

  const currentStepData = botSteps[currentStep];
  const modalTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    header: { backgroundColor: colors.surface, borderBottomColor: colors.border },
    headerTitle: { color: colors.text },
    messageBot: { backgroundColor: colors.surface },
    messageBotText: { color: colors.text },
    messageUser: { backgroundColor: colors.primary },
    messageUserText: { color: '#FFFFFF' },
    inputContainer: { backgroundColor: colors.surface, borderTopColor: colors.border },
    input: { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
    inputPlaceholder: { color: colors.textSecondary },
    button: { backgroundColor: colors.primaryLight },
    buttonText: { color: colors.text },
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={0}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              dynamicStyles.container,
              {
                transform: [{ translateY: modalTranslateY }],
                paddingTop: insets.top + 8,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.header, dynamicStyles.header]}>
              <View style={styles.headerLeft}>
                <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
                  <Image
                    source={require('../../assets/icon.png')}
                    style={styles.botAvatarImage}
                    resizeMode="contain"
                    defaultSource={require('../../assets/icon.png')}
                  />
                </View>
                <View>
                  <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>
                    AI Bot: Ronzae
                  </Text>
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    We're here to help
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageWrapper,
                    message.isBot ? styles.messageBotWrapper : styles.messageUserWrapper,
                  ]}
                >
                  <View
                    style={[
                      styles.message,
                      message.isBot ? dynamicStyles.messageBot : dynamicStyles.messageUser,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.isBot ? dynamicStyles.messageBotText : dynamicStyles.messageUserText,
                      ]}
                    >
                      {message.text}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Options */}
              {currentStepData && !currentStepData.requiresInput && !currentStepData.requiresContactInfo && (
                <View style={styles.optionsContainer}>
                  {currentStepData.options?.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.optionButton, dynamicStyles.button]}
                      onPress={() => handleOptionPress(option)}
                    >
                      <Text style={[styles.optionButtonText, dynamicStyles.buttonText]}>
                        {option.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Contact Info Form */}
            {showContactForm && (
              <View style={[styles.contactFormContainer, dynamicStyles.inputContainer]}>
                <View style={styles.contactForm}>
                  <Text style={[styles.contactFormLabel, { color: colors.text }]}>
                    Full Name
                  </Text>
                  <TextInput
                    style={[styles.contactFormInput, dynamicStyles.input]}
                    placeholder="Enter your full name"
                    placeholderTextColor={dynamicStyles.inputPlaceholder.color}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                  <Text style={[styles.contactFormLabel, { color: colors.text, marginTop: 12 }]}>
                    Email Address
                  </Text>
                  <TextInput
                    style={[styles.contactFormInput, dynamicStyles.input]}
                    placeholder="Enter your email"
                    placeholderTextColor={dynamicStyles.inputPlaceholder.color}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[
                      styles.submitContactButton,
                      { backgroundColor: colors.primary },
                      (!fullName.trim() || !email.trim()) && styles.sendButtonDisabled,
                    ]}
                    onPress={handleContactInfoSubmit}
                    disabled={!fullName.trim() || !email.trim()}
                  >
                    <Text style={styles.submitContactButtonText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Input Area */}
            {showInput && (
              <View style={[styles.inputContainer, dynamicStyles.inputContainer]}>
                <TextInput
                  style={[styles.input, dynamicStyles.input]}
                  placeholder={pendingStep === 'reportIssue' ? "Describe your issue..." : "Type your question here..."}
                  placeholderTextColor={dynamicStyles.inputPlaceholder.color}
                  value={userInput}
                  onChangeText={setUserInput}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    { backgroundColor: colors.primary },
                    !userInput.trim() && styles.sendButtonDisabled,
                  ]}
                  onPress={() => handleSubmission(userInput)}
                  disabled={!userInput.trim()}
                >
                  <Send size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 0.9,
    backgroundColor: '#F4F4F6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  botAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9163F2',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  botAvatarImage: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1625',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageWrapper: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  messageBotWrapper: {
    alignSelf: 'flex-start',
  },
  messageUserWrapper: {
    alignSelf: 'flex-end',
  },
  message: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1a1625',
  },
  optionsContainer: {
    marginTop: 8,
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#E8DEFF',
    marginBottom: 8,
  },
  optionButtonText: {
    fontSize: 15,
    color: '#1a1625',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: '#F4F4F6',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 15,
    color: '#1a1625',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9163F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  contactFormContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  contactForm: {
    gap: 8,
  },
  contactFormLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1625',
    marginBottom: 4,
  },
  contactFormInput: {
    height: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F4F4F6',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 15,
    color: '#1a1625',
  },
  submitContactButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#9163F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitContactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
