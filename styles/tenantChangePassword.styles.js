import { StyleSheet } from 'react-native';
import { responsiveFont, moderateScale } from './theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FC" },
  header: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(24),
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    width: "100%",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
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
  content: {
    padding: moderateScale(16),
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: moderateScale(20),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  instruction: {
    fontSize: responsiveFont(12),
    color: "#475569",
    lineHeight: 18,
    flex: 1,
  },
  inputLabel: {
    fontSize: responsiveFont(13),
    fontWeight: "600",
    color: "#334155",
    marginTop: 12,
    marginBottom: 6,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: responsiveFont(14),
    color: "#1e293b",
  },
  saveBtn: {
    marginTop: 24,
    borderRadius: 14,
    overflow: "hidden",
  },
  gradientBtn: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: responsiveFont(14),
    letterSpacing: 0.6,
  },
});
