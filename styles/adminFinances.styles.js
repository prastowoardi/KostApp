import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fc',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#64748b',
        fontSize: 14,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    addBtn: {
        backgroundColor: '#10b981',
        padding: 8,
        borderRadius: 12,
    },
    balanceRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    balanceCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
    },
    balanceIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    balanceLabel: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500',
    },
    balanceVal: {
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 2,
    },
    filterRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: 12,
        padding: 4,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 7,
        alignItems: 'center',
        borderRadius: 9,
    },
    filterTabActive: {
        backgroundColor: '#ffffff',
    },
    filterTabText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12,
        fontWeight: '600',
    },
    filterTabTextActive: {
        color: '#1e3a8a',
        fontWeight: '700',
    },
    listContainer: {
        padding: 16,
    },
    transactionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 4,
    },
    typeIndicator: {
        width: 4,
        height: 38,
        borderRadius: 2,
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    transSub: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    transAmount: {
        fontSize: 14,
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 4,
    },
});
