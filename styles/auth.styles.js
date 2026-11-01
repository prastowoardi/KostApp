import { Dimensions, StyleSheet } from 'react-native';
import { responsiveFont, moderateScale } from './theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Galaxy S23 FE has ~880-900dp screen height, modern tall Android >= 800dp
const isSmallDevice = SCREEN_HEIGHT < 700;
const isTallDevice = SCREEN_HEIGHT >= 800;

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FC',
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        height: isSmallDevice ? 240 : isTallDevice ? Math.min(340, Math.round(SCREEN_HEIGHT * 0.36)) : 280,
        minHeight: isSmallDevice ? 230 : isTallDevice ? 310 : 270,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        paddingHorizontal: moderateScale(20),
        paddingBottom: isTallDevice ? moderateScale(24) : moderateScale(14),
        maxWidth: 720,
        width: '100%',
        alignSelf: 'center',
    },
    logoCircle: {
        width: moderateScale(90),
        height: moderateScale(90),
        backgroundColor: '#ffffff',
        borderRadius: moderateScale(45),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        overflow: 'hidden',
    },
    logoImage: {
        width: '85%',
        height: '85%',
    },
    logoText: {
        color: '#ffffff',
        fontSize: responsiveFont(26),
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    tagline: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: responsiveFont(14),
        fontWeight: '500',
        marginTop: 4,
    },
    formContainer: {
        flex: 1,
        marginTop: isTallDevice ? -15 : -35,
        paddingHorizontal: moderateScale(24),
        maxWidth: 520,
        width: '100%',
        alignSelf: 'center',
        justifyContent: 'space-between',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: moderateScale(24),
        elevation: 4,
        shadowColor: '#0f172a',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        borderWidth: 1,
        borderColor: '#edf2f7',
    },
    welcomeTitle: {
        fontSize: responsiveFont(22),
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center',
    },
    welcomeSub: {
        fontSize: responsiveFont(14),
        color: '#64748b',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 22,
    },
    inputLabel: {
        fontSize: responsiveFont(14),
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
        marginLeft: 2,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        paddingHorizontal: 14,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: responsiveFont(15),
        color: '#1e293b',
    },
    button: {
        marginTop: 10,
        borderRadius: 14,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#1e3a8a',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    gradientBtn: {
        paddingVertical: moderateScale(16),
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: responsiveFont(16),
        letterSpacing: 0.8,
    },
    footerText: {
        textAlign: 'center',
        marginTop: isTallDevice ? 36 : 24,
        marginBottom: 16,
        color: '#94a3b8',
        fontSize: responsiveFont(13),
        fontWeight: '500',
    },
});
