import { StyleSheet } from 'react-native';
import { responsiveFont, moderateScale } from './theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fc",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#64748b",
    fontSize: responsiveFont(14),
  },
  header: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(24),
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: responsiveFont(18),
    fontWeight: "bold",
    color: "#ffffff",
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
  },
  listContent: {
    padding: moderateScale(16),
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: moderateScale(16),
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  invoiceText: {
    fontSize: responsiveFont(14),
    fontWeight: "bold",
    color: "#1e293b",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: responsiveFont(12),
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 12,
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  periodLabel: {
    fontSize: responsiveFont(12),
    color: "#94a3b8",
  },
  periodValue: {
    fontSize: responsiveFont(15),
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 2,
  },
  paymentDate: {
    fontSize: responsiveFont(12),
    color: "#64748b",
    marginTop: 4,
  },
  amountLabel: {
    fontSize: responsiveFont(12),
    color: "#94a3b8",
  },
  amountValue: {
    fontSize: responsiveFont(16),
    fontWeight: "800",
    color: "#10b981",
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: responsiveFont(17),
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: responsiveFont(14),
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
  },
});
