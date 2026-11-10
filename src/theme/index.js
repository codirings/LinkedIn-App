export const colors = {
  bg: '#FAFAFC', card: '#FFFFFF', border: '#E5E7EB', borderHover: '#D1D5DB',
  text: '#111827', text2: '#4B5563', text3: '#9CA3AF',
  primary: '#0A66C2', tint: 'rgba(10,102,194,0.08)', tintBorder: 'rgba(10,102,194,0.3)',
  chipBg: '#F3F4F6', error: '#BA1A1A', success: '#10B981',
};
export const gradient = ['#0A66C2', '#0A66C2', '#0A66C2'];
export const radius = { sm: 8, md: 16, full: 9999 };
export const font = { reg: 'PlusJakartaSans_400Regular', semi: 'PlusJakartaSans_600SemiBold', bold: 'PlusJakartaSans_700Bold', xbold: 'PlusJakartaSans_800ExtraBold' };
export const type = {
  h1: { fontFamily: font.xbold, fontSize: 30, lineHeight: 38, letterSpacing: -0.75, color: colors.text },
  h2: { fontFamily: font.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3, color: colors.text },
  h3: { fontFamily: font.semi, fontSize: 18, lineHeight: 24, color: colors.text },
  bodyLg: { fontFamily: font.reg, fontSize: 16, lineHeight: 26, color: colors.text },
  body: { fontFamily: font.reg, fontSize: 14, lineHeight: 22, color: colors.text },
  small: { fontFamily: font.reg, fontSize: 13, lineHeight: 18, color: colors.text2 },
  label: { fontFamily: font.semi, fontSize: 13, lineHeight: 18, color: colors.text },
};
export const shadow = {
  card: { shadowColor: '#0A66C2', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  cta: { shadowColor: '#0A66C2', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
};
