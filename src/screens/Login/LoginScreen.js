import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from '../../components/LinearGradient';
import Ionicons from '../../components/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { Card, GradientButton, Input } from '../../components';
import { colors, font, type } from '../../theme';

function BrandLogo() {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="LinkedIn logo" style={s.appLogo}>
      <LinearGradient colors={['#168BE8', '#0A66C2', '#032B5C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(91,190,255,0.62)', 'rgba(27,126,218,0.08)']} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.logoHighlight} />
      <LinearGradient colors={['rgba(2,48,105,0.04)', 'rgba(2,35,82,0.72)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.logoWave} />
      <View style={s.logoWaveAccent} />
      <Text style={s.logoLetters}>in</Text>
    </View>
  );
}

function WorkingIllustration() {
  return (
    <View style={s.illustration} accessible accessibilityRole="image" accessibilityLabel="A person working at a computer">
      <View style={s.sunShape} />
      <View style={s.plant}>
        <View style={[s.leaf, s.leafOne]} />
        <View style={[s.leaf, s.leafTwo]} />
        <View style={[s.leaf, s.leafThree]} />
        <View style={s.plantPot} />
      </View>
      <View style={s.personHead} />
      <View style={s.personHair} />
      <View style={s.personBody} />
      <View style={s.personArm} />
      <View style={s.laptop}>
        <View style={s.laptopScreen}>
          <View style={s.laptopScreenLine} />
          <View style={[s.laptopScreenLine, s.laptopScreenLineShort]} />
          <Ionicons name="briefcase-outline" size={28} color="#0A66C2" />
        </View>
        <View style={s.laptopBase} />
      </View>
      <View style={s.desk} />
      <View style={s.deskLeg} />
      <View style={s.deskLegRight} />
      <View style={s.chair} />
    </View>
  );
}

function NetworkIllustration() {
  return (
    <View style={s.illustration} accessible accessibilityRole="image" accessibilityLabel="People connecting in a professional network">
      <View style={[s.sunShape, s.networkHalo]} />
      <View style={s.networkLineOne} />
      <View style={s.networkLineTwo} />
      <View style={s.networkLineThree} />
      <View style={[s.networkPerson, s.networkPersonLeft]}>
        <Ionicons name="person" size={33} color="#fff" />
      </View>
      <View style={[s.networkPerson, s.networkPersonTop]}>
        <Ionicons name="person" size={37} color="#fff" />
      </View>
      <View style={[s.networkPerson, s.networkPersonRight]}>
        <Ionicons name="person" size={33} color="#fff" />
      </View>
      <View style={[s.networkPerson, s.networkPersonBottom]}>
        <Ionicons name="person" size={30} color="#fff" />
      </View>
      <View style={s.networkCenter}>
        <Ionicons name="people" size={40} color="#0A66C2" />
      </View>
      <View style={s.networkSparkle}><Ionicons name="sparkles" size={22} color="#E5A93D" /></View>
    </View>
  );
}

function OpportunityIllustration() {
  return (
    <View style={s.illustration} accessible accessibilityRole="image" accessibilityLabel="A professional discovering a new opportunity">
      <View style={[s.sunShape, s.opportunityHalo]} />
      <View style={s.opportunityBoard}>
        <View style={s.boardHeader} />
        <View style={s.boardLineLong} />
        <View style={s.boardLineShort} />
        <View style={s.boardChart}>
          <View style={s.chartBarOne} />
          <View style={s.chartBarTwo} />
          <View style={s.chartBarThree} />
        </View>
      </View>
      <View style={s.opportunityPersonHead} />
      <View style={s.opportunityPersonHair} />
      <View style={s.opportunityPersonBody} />
      <View style={s.opportunityArm} />
      <View style={s.opportunityBriefcase}>
        <Ionicons name="briefcase" size={28} color="#fff" />
      </View>
      <View style={s.opportunityGround} />
      <View style={s.opportunitySparkle}><Ionicons name="star" size={20} color="#E5A93D" /></View>
    </View>
  );
}

const carouselSlides = [
  { title: 'Find and land your next job', Illustration: WorkingIllustration },
  { title: 'Build your professional network', Illustration: NetworkIllustration },
  { title: 'Discover opportunities that fit you', Illustration: OpportunityIllustration },
];

function PolicyLink({ label, url }) {
  const open = () => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open link', 'Please try again later.');
    });
  };
  return (
    <Text accessibilityRole="link" onPress={open} style={s.policyLink}>
      {label}
    </Text>
  );
}

function WelcomeScreen({ navigation }) {
  const { signInWithGoogle } = useApp();
  const [googleBusy, setGoogleBusy] = useState(false);
  const onGoogle = async () => {
    if (googleBusy) return;
    setGoogleBusy(true);
    const error = await signInWithGoogle();
    setGoogleBusy(false);
    if (error) Alert.alert('Google sign-in failed', error);
  };
  const { width } = useWindowDimensions();
  const carouselWidth = Math.min(width - 40, 520);
  const carouselRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const selectSlide = (index) => {
    setActiveSlide(index);
    carouselRef.current?.scrollTo({ x: index * carouselWidth, animated: true });
  };

  return (
    <View style={s.welcomeBackground}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={s.welcomeContent} showsVerticalScrollIndicator={false}>
          <View style={s.welcomeHeader}>
            <BrandLogo />
          </View>
          <View style={[s.carousel, { width: carouselWidth }]}>
            <ScrollView
              ref={carouselRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              bounces={false}
              onMomentumScrollEnd={(event) => {
                setActiveSlide(Math.round(event.nativeEvent.contentOffset.x / carouselWidth));
              }}
              accessibilityLabel="Welcome carousel"
            >
              {carouselSlides.map(({ title, Illustration }, index) => (
                <View key={title} style={[s.slide, { width: carouselWidth }]}>
                  <Illustration />
                  <Text style={s.welcomeTitle} accessibilityLabel={`Slide ${index + 1}: ${title}`}>{title}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
          <View style={s.indicators} accessibilityLabel={`Slide ${activeSlide + 1} of 3`}>
            {carouselSlides.map((slide, index) => (
              <Pressable
                key={slide.title}
                accessibilityRole="button"
                accessibilityLabel={`Show slide ${index + 1}`}
                accessibilityState={{ selected: activeSlide === index }}
                onPress={() => selectSlide(index)}
                hitSlop={8}
                style={s.indicatorButton}
              >
                <View style={activeSlide === index ? s.activeIndicator : s.inactiveIndicator} />
              </Pressable>
            ))}
          </View>
          <View style={s.welcomeActions}>
            <Text style={s.disclaimer}>
              By clicking Agree &amp; Join or Sign in, you agree to our{' '}
              <PolicyLink label="User Agreement" url="https://www.linkedin.com/legal/user-agreement" />,{' '}
              <PolicyLink label="Privacy Policy" url="https://www.linkedin.com/legal/privacy-policy" /> and{' '}
              <PolicyLink label="Cookie Policy" url="https://www.linkedin.com/legal/cookie-policy" />.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onGoogle}
              disabled={googleBusy}
              style={({ pressed }) => [s.googleButton, pressed && s.buttonPressed]}
            >
              <Ionicons name="logo-google" size={20} color="#0A66C2" />
              <Text style={s.googleButtonText}>{googleBusy ? 'Signing in...' : 'Continue with Google'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Registration')}
              style={({ pressed }) => [s.joinButton, pressed && s.buttonPressed]}
            >
              <Text style={s.joinButtonText}>Agree &amp; Join</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Login')}
              style={({ pressed }) => [s.signInButton, pressed && s.buttonPressed]}
            >
              <Text style={s.signInText}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function AuthLayout({ title, description, children }) {
  return (
    <LinearGradient colors={['#EAF4FF', '#DCEBFA', '#F5F9FF']} locations={[0, 0.55, 1]} style={s.background}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={s.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.authContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={s.authHeader}><BrandLogo /></View>
            <Text style={s.authTitle}>{title}</Text>
            <Text style={s.authDescription}>{description}</Text>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function AuthField({ label, ...inputProps }) {
  return (
    <View style={s.field}>
      <Text style={[type.label, s.fieldLabel]}>{label}</Text>
      <Input {...inputProps} style={s.fieldInput} />
    </View>
  );
}

const authErrorMessage = (error) => {
  const messages = {
    'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/network-request-failed': 'Could not connect. Check your internet connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a while and try again.',
    'auth/weak-password': 'Choose a stronger password.',
  };
  return messages[error?.code] || error?.message || 'Something went wrong. Please try again.';
};

export function RegistrationScreen({ navigation }) {
  const { signUp } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setShowPassword(false);
  }, []));

  const submit = async () => {
    if (!firstName.trim()) return setError('Enter your first name.');
    if (!lastName.trim()) return setError('Enter your last name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) {
      Alert.alert('Invalid password', 'Passwords do not match.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const result = await signUp({ name: `${firstName.trim()} ${lastName.trim()}`, email, password });
      if (result) setError(result);
    } catch (e) {
      console.error('Account registration failed:', e);
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Create your account" description="Join your professional community and discover new opportunities.">
      <Card style={s.authCard}>
        <AuthField label="First Name" icon="person-outline" placeholder="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" autoComplete="off" textContentType="none" />
        <AuthField label="Last Name" icon="person-outline" placeholder="Last name" value={lastName} onChangeText={setLastName} autoCapitalize="words" autoComplete="off" textContentType="none" />
        <AuthField label="Email Address" icon="at" placeholder="name@company.com" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="off" textContentType="none" keyboardType="email-address" />
        <View style={s.passwordField}>
          <AuthField label="Create Password" icon="lock-closed-outline" placeholder="At least 6 characters" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} autoCapitalize="none" autoComplete="off" textContentType="none" onSubmitEditing={submit} />
          <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword(!showPassword)} style={s.passwordToggle}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.text2} />
          </Pressable>
        </View>
        <AuthField label="Re-enter Password" icon="lock-closed-outline" placeholder="Re-enter your password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} autoCapitalize="none" autoComplete="off" textContentType="none" onSubmitEditing={submit} />
        {!!error && <Text accessibilityRole="alert" style={s.errorText}>{error}</Text>}
        <GradientButton title={busy ? 'Please wait…' : 'Create Account'} onPress={submit} disabled={busy} style={s.submitButton} />
      </Card>
      <Text style={s.authFooter}>
        Already have an account?{' '}
        <Text accessibilityRole="link" style={s.authLink} onPress={() => navigation.navigate('Login')}>Sign in</Text>
      </Text>
    </AuthLayout>
  );
}

export function SignInScreen({ navigation, route }) {
  const { signIn } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    setEmail(route?.params?.prefillEmail || '');
    setPassword('');
    setError('');
    setShowPassword(false);
  }, [route?.params?.prefillEmail]));

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');
    setError('');
    setBusy(true);
    try {
      const result = await signIn(email, password);
      if (result) setError(result);
    } catch (e) {
      console.error('Sign in failed:', e);
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" description="Sign in to access your professional network, jobs, and messages.">
      <Card style={s.authCard}>
        <AuthField label="Email Address" icon="at" placeholder="name@company.com" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="off" textContentType="none" keyboardType="email-address" />
        <View style={s.passwordField}>
          <AuthField label="Password" icon="lock-closed-outline" placeholder="Your password" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} autoCapitalize="none" autoComplete="off" textContentType="none" onSubmitEditing={submit} />
          <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword(!showPassword)} style={s.passwordToggle}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.text2} />
          </Pressable>
        </View>
        <Pressable accessibilityRole="link" onPress={() => navigation.navigate('ForgotPassword')} style={s.forgotLink}>
          <Text style={s.authLink}>Forgot Password?</Text>
        </Pressable>
        {!!error && <Text accessibilityRole="alert" style={s.errorText}>{error}</Text>}
        <GradientButton title={busy ? 'Please wait…' : 'Sign in'} onPress={submit} disabled={busy} style={s.submitButton} />
      </Card>
      <Text style={s.authFooter}>
        New to Linkedin?{' '}
        <Text accessibilityRole="link" style={s.authLink} onPress={() => navigation.navigate('Registration')}>Create an account</Text>
      </Text>
    </AuthLayout>
  );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen({ navigation }) {
  const { cancelPasswordReset } = useApp();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    setEmail('');
    setError('');
    setSentTo('');
  }, []));

  const submit = () => {
    const address = email.trim();
    if (!address) {
      setError('Please enter your email address.');
      return;
    }
    if (!EMAIL_PATTERN.test(address)) {
      setError('Enter a valid email address, such as name@company.com.');
      return;
    }
    setError('');
    setSentTo(address);
  };

  const useDifferentEmail = () => {
    setSentTo('');
    setError('');
  };

  const backToSignIn = async () => {
    setBusy(true);
    setError('');
    try {
      await cancelPasswordReset();
      navigation.navigate('Login', { prefillEmail: email.trim() });
    } catch (storageError) {
      console.error('Could not clear password-reset state:', storageError);
      setError('Could not clear the saved reset details. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Confirm Your Email"
      description="Enter the email linked to your account and we’ll prepare a 6-digit verification code."
    >
      <Card style={s.authCard}>
        <View style={s.verifyHeader}>
          <View style={s.verifyIcon}>
            <Ionicons name="mail-unread-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={type.label}>Verification code</Text>
            <Text style={type.small}>We’ll use this address to confirm it’s yours.</Text>
          </View>
        </View>

        {sentTo ? (
          <View style={s.successBox} accessibilityLiveRegion="polite">
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.successTitle}>Verification Sent</Text>
              <Text style={s.successText}>
                Verification code would be sent to {sentTo}. 
              </Text>
              <Text accessibilityRole="link" style={s.inlineLink} onPress={useDifferentEmail}>
                Use a different email
              </Text>
            </View>
          </View>
        ) : (
          <>
            <AuthField
              label="Email Address"
              icon="at"
              placeholder="name@company.com"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (error) setError('');
              }}
              onSubmitEditing={submit}
              returnKeyType="send"
              editable={!busy}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              textContentType="none"
              keyboardType="email-address"
              accessibilityLabel="Email address"
            />
            {!!error && <Text accessibilityRole="alert" style={s.errorText}>{error}</Text>}
            <GradientButton
              title="Send Verification Code"
              onPress={submit}
              disabled={busy}
              style={s.submitButton}
            />
          </>
        )}
      </Card>

      <Pressable accessibilityRole="link" onPress={backToSignIn} disabled={busy} style={s.backLink}>
        <Ionicons name="arrow-back" size={16} color="#0A66C2" />
        <Text style={s.authLink}>{busy ? 'Please wait…' : 'Back to Sign in'}</Text>
      </Pressable>
    </AuthLayout>
  );
}

const s = StyleSheet.create({
  background: { flex: 1 },
  welcomeBackground: { flex: 1, backgroundColor: '#fff' },
  safe: { flex: 1 },
  welcomeContent: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  welcomeHeader: { width: '100%', maxWidth: 960, alignSelf: 'center', alignItems: 'flex-start', marginTop: 4 },
  appLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginTop: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1459BD',
    shadowOpacity: 0.2,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logoHighlight: {
    position: 'absolute',
    width: 106,
    height: 43,
    borderRadius: 54,
    top: -14,
    left: -20,
    transform: [{ rotate: '-24deg' }],
  },
  logoWave: {
    position: 'absolute',
    width: 100,
    height: 52,
    borderRadius: 50,
    bottom: -22,
    left: -17,
    transform: [{ rotate: '-22deg' }],
  },
  logoWaveAccent: {
    position: 'absolute',
    width: 78,
    height: 36,
    borderRadius: 40,
    bottom: -13,
    right: -23,
    backgroundColor: 'rgba(25,117,206,0.52)',
    transform: [{ rotate: '-28deg' }],
  },
  logoLetters: {
    zIndex: 1,
    color: '#fff',
    fontSize: 38,
    lineHeight: 45,
    fontWeight: '800',
    letterSpacing: -3,
    marginLeft: -3,
    textShadowColor: 'rgba(5,35,100,0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  carousel: { alignSelf: 'center', height: 320, marginTop: 10 },
  slide: { height: 320, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 5 },
  illustration: { width: 300, height: 218, maxWidth: '100%', alignSelf: 'center', marginTop: 4, marginBottom: 8 },
  sunShape: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.64)', top: 14, left: 60 },
  networkHalo: { backgroundColor: '#EEF6FC' },
  networkLineOne: { position: 'absolute', left: 93, top: 74, width: 113, height: 3, backgroundColor: '#B8D5EA', transform: [{ rotate: '-26deg' }] },
  networkLineTwo: { position: 'absolute', left: 100, top: 123, width: 105, height: 3, backgroundColor: '#B8D5EA', transform: [{ rotate: '25deg' }] },
  networkLineThree: { position: 'absolute', left: 115, top: 107, width: 90, height: 3, backgroundColor: '#B8D5EA' },
  networkPerson: { position: 'absolute', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4A8AC7', borderWidth: 4, borderColor: '#fff' },
  networkPersonLeft: { left: 51, top: 75 },
  networkPersonTop: { left: 124, top: 28, width: 58, height: 58, borderRadius: 29, backgroundColor: '#0A66C2' },
  networkPersonRight: { right: 43, top: 75, backgroundColor: '#61A58A' },
  networkPersonBottom: { left: 124, top: 132, width: 48, height: 48, borderRadius: 24, backgroundColor: '#D88368' },
  networkCenter: { position: 'absolute', left: 120, top: 85, width: 60, height: 48, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DCEAF5' },
  networkSparkle: { position: 'absolute', right: 35, top: 31 },
  opportunityHalo: { backgroundColor: '#F0F6FC' },
  opportunityBoard: { position: 'absolute', left: 60, top: 29, width: 151, height: 130, borderRadius: 12, borderWidth: 5, borderColor: '#36536F', backgroundColor: '#fff', padding: 12 },
  boardHeader: { width: 48, height: 7, borderRadius: 4, backgroundColor: '#0A66C2', marginBottom: 10 },
  boardLineLong: { width: 91, height: 4, borderRadius: 2, backgroundColor: '#C5D9E9', marginBottom: 6 },
  boardLineShort: { width: 59, height: 4, borderRadius: 2, backgroundColor: '#D9E6F0' },
  boardChart: { height: 39, flexDirection: 'row', alignItems: 'flex-end', marginTop: 7, paddingHorizontal: 9 },
  chartBarOne: { width: 19, height: 18, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: '#9DC8E9', marginRight: 8 },
  chartBarTwo: { width: 19, height: 27, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: '#5E9DD0', marginRight: 8 },
  chartBarThree: { width: 19, height: 35, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: '#0A66C2' },
  opportunityPersonHead: { position: 'absolute', left: 187, top: 106, width: 37, height: 42, borderRadius: 20, backgroundColor: '#D99370' },
  opportunityPersonHair: { position: 'absolute', left: 186, top: 101, width: 39, height: 20, borderTopLeftRadius: 20, borderTopRightRadius: 18, backgroundColor: '#263B58' },
  opportunityPersonBody: { position: 'absolute', left: 174, top: 143, width: 62, height: 54, borderTopLeftRadius: 29, borderTopRightRadius: 28, backgroundColor: '#4A8AC7' },
  opportunityArm: { position: 'absolute', left: 139, top: 126, width: 59, height: 10, borderRadius: 5, backgroundColor: '#D99370', transform: [{ rotate: '-24deg' }] },
  opportunityBriefcase: { position: 'absolute', left: 86, top: 159, width: 47, height: 36, borderRadius: 7, backgroundColor: '#E4A83B', alignItems: 'center', justifyContent: 'center' },
  opportunityGround: { position: 'absolute', left: 41, right: 23, bottom: 15, height: 9, borderRadius: 5, backgroundColor: '#C98966' },
  opportunitySparkle: { position: 'absolute', right: 32, top: 37 },
  plant: { position: 'absolute', left: 22, bottom: 47, width: 40, height: 110 },
  leaf: { position: 'absolute', width: 16, height: 32, borderRadius: 16, backgroundColor: '#58A783' },
  leafOne: { left: 5, top: 25, transform: [{ rotate: '-34deg' }] },
  leafTwo: { left: 20, top: 10, transform: [{ rotate: '34deg' }] },
  leafThree: { left: 12, top: 0, transform: [{ rotate: '-6deg' }] },
  plantPot: { position: 'absolute', left: 7, bottom: 0, width: 28, height: 28, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: '#D88368' },
  personHead: { position: 'absolute', width: 42, height: 48, borderRadius: 21, backgroundColor: '#D99370', left: 119, top: 39 },
  personHair: { position: 'absolute', width: 45, height: 27, borderTopLeftRadius: 24, borderTopRightRadius: 22, borderBottomRightRadius: 17, backgroundColor: '#263B58', left: 117, top: 34, transform: [{ rotate: '-8deg' }] },
  personBody: { position: 'absolute', width: 88, height: 73, borderTopLeftRadius: 38, borderTopRightRadius: 34, backgroundColor: '#4A8AC7', left: 97, top: 86 },
  personArm: { position: 'absolute', width: 91, height: 16, borderRadius: 8, backgroundColor: '#D99370', left: 143, top: 111, transform: [{ rotate: '13deg' }] },
  laptop: { position: 'absolute', left: 144, top: 94, width: 105, height: 78, alignItems: 'center' },
  laptopScreen: { width: 92, height: 67, borderWidth: 6, borderColor: '#304B69', borderTopLeftRadius: 8, borderTopRightRadius: 8, backgroundColor: '#F8FCFF', alignItems: 'center', justifyContent: 'center' },
  laptopScreenLine: { width: 35, height: 3, borderRadius: 2, backgroundColor: '#9DC6E9', marginBottom: 5 },
  laptopScreenLineShort: { width: 22, alignSelf: 'flex-start', marginLeft: 13, marginBottom: 3 },
  laptopBase: { width: 104, height: 7, borderRadius: 5, backgroundColor: '#304B69' },
  desk: { position: 'absolute', left: 42, right: 23, bottom: 38, height: 12, borderRadius: 6, backgroundColor: '#C98966' },
  deskLeg: { position: 'absolute', left: 61, bottom: 0, width: 8, height: 40, backgroundColor: '#A76D52' },
  deskLegRight: { position: 'absolute', right: 42, bottom: 0, width: 8, height: 40, backgroundColor: '#A76D52' },
  chair: { position: 'absolute', left: 83, bottom: 35, width: 44, height: 40, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 7, borderBottomWidth: 0, borderColor: '#426C98' },
  welcomeTitle: { maxWidth: 460, alignSelf: 'center', marginTop: 2, color: '#191919', fontFamily: font.bold, fontSize: 28, lineHeight: 35, letterSpacing: -0.7, textAlign: 'center' },
  indicators: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 3, marginBottom: 12 },
  indicatorButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  activeIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0A66C2' },
  inactiveIndicator: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#0A66C2' },
  welcomeActions: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  disclaimer: { color: '#536779', fontFamily: font.reg, fontSize: 12, lineHeight: 19, textAlign: 'center', marginBottom: 15 },
  policyLink: { color: '#0A66C2', fontFamily: font.semi, textDecorationLine: 'underline' },
  joinButton: { width: '100%', minHeight: 54, borderRadius: 28, backgroundColor: '#0A66C2', alignItems: 'center', justifyContent: 'center' },
  joinButtonText: { color: '#fff', fontFamily: font.bold, fontSize: 16 },
  googleButton: { width: '100%', minHeight: 54, borderRadius: 28, backgroundColor: '#fff', borderWidth: 1, borderColor: '#0A66C2', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 12 },
  googleButtonText: { color: '#0A66C2', fontFamily: font.bold, fontSize: 16, marginLeft: 10 },
  buttonPressed: { opacity: 0.82 },
  signInButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  signInText: { color: '#0A66C2', fontFamily: font.semi, fontSize: 16 },
  authContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 },
  authHeader: { alignItems: 'flex-start', marginTop: 4, marginBottom: 24 },
  authTitle: { color: '#15324F', fontFamily: font.xbold, fontSize: 28, lineHeight: 36, letterSpacing: -0.6, marginBottom: 6 },
  authDescription: { color: colors.text2, fontFamily: font.reg, fontSize: 14, lineHeight: 21, marginBottom: 22 },
  authCard: { width: '100%', maxWidth: 500, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.94)', borderColor: 'rgba(10,102,194,0.13)' },
  field: { marginBottom: 15 },
  fieldLabel: { marginBottom: 6 },
  fieldInput: { backgroundColor: '#F7FAFD', borderColor: '#D7E4F1' },
  passwordField: { position: 'relative' },
  passwordToggle: { position: 'absolute', right: 14, top: 36, width: 34, height: 38, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.error, fontFamily: font.reg, fontSize: 13, lineHeight: 18, marginTop: 2 },
  resetNotice: { color: '#31516F', backgroundColor: '#EEF6FD', borderRadius: 12, padding: 12, fontFamily: font.reg, fontSize: 13, lineHeight: 19, marginBottom: 8 },
  submitButton: { marginTop: 16 },
  forgotLink: { alignSelf: 'flex-end', paddingVertical: 4 },
  authFooter: { color: colors.text2, fontFamily: font.reg, fontSize: 14, textAlign: 'center', marginTop: 22 },
  authLink: { color: '#0A66C2', fontFamily: font.semi },
  verifyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  verifyIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  successBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#ECFDF5', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#A7F3D0' },
  successTitle: { color: '#065F46', fontFamily: font.bold, fontSize: 14, marginBottom: 2 },
  successText: { color: '#065F46', fontFamily: font.reg, fontSize: 13, lineHeight: 19 },
  inlineLink: { color: '#0A66C2', fontFamily: font.semi, fontSize: 13, marginTop: 8 },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22 },
});

export default WelcomeScreen;