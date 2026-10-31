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
  addBtn: {
    backgroundColor: "#10b981",
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
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: responsiveFont(12),
    fontWeight: "700",
    color: "#475569",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: responsiveFont(12),
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: responsiveFont(17),
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: responsiveFont(14),
    color: "#64748b",
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: responsiveFont(12),
    color: "#94a3b8",
  },
  detailLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  detailLinkText: {
    fontSize: responsiveFont(13),
    fontWeight: "700",
    color: "#4e73df",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 20,
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
    lineHeight: 18,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 6,
  },
  createBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
  },
});
