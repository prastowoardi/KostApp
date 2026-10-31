import { Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fc',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 10,
        color: '#64748b',
        fontSize: 14,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 12,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
    },
    scrollContent: {
        padding: 16,
    },
    mainCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryPill: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryBadge: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 6,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    dateText: {
        fontSize: 12,
        color: '#94a3b8',
        marginLeft: 6,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 22,
    },
    responseBox: {
        backgroundColor: '#ecfdf5',
        borderRadius: 14,
        padding: 14,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#a7f3d0',
    },
    responseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    responseTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#065f46',
    },
    responseText: {
        fontSize: 13,
        color: '#047857',
        lineHeight: 20,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 4,
    },
    imageWrapper: {
        width: (width - 76) / 3,
        height: 90,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f1f5f9',
        position: 'relative',
    },
    img: {
        width: '100%',
        height: '100%',
    },
    zoomBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 6,
        padding: 3,
    },
    noImage: {
        width: '100%',
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    noImageText: {
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 4,
    },
    retryBtn: {
        marginTop: 16,
        backgroundColor: '#1e3a8a',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    retryBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImg: {
        width: width * 0.95,
        height: height * 0.8,
    },
    closeBtn: {
        position: 'absolute',
        right: 20,
        zIndex: 20,
    },
});
