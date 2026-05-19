import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { CONFIG } from '../../src/constants/config';
import { driverAPI } from '../../src/api/driver';
import DriverHeader from '../../src/components/DriverHeader';

export default function DocumentsScreen() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [imageError, setImageError] = useState(false);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const serverBase = CONFIG.API_BASE_URL.replace('/api/v1', '');
    return `${serverBase}/storage/${path.replace('public/', '')}`;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await driverAPI.getProfile();
        if (res.data.success && res.data.driver) {
          const d = res.data.driver;
          const u = res.data.user;
          const loadedDocs = [];
          
          if (d.driving_license_image) {
            loadedDocs.push({
              id: 'dl',
              label: 'Driving License',
              expiry: 'Valid',
              submittedAt: new Date(d.updated_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              imageUrl: getImageUrl(d.driving_license_image),
              docDetails: {
                'License Number': d.driving_license_number || 'DL-XXXXXX',
                'Class': 'LMV / MCWG',
                'Holder Name': u?.name || 'Driver'
              }
            });
          }

          if (d.aadhar_front_image) {
            loadedDocs.push({
              id: 'aadhar_front',
              label: 'Aadhaar Card (Front)',
              expiry: 'Lifetime',
              submittedAt: new Date(d.updated_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              imageUrl: getImageUrl(d.aadhar_front_image),
              docDetails: {
                'Aadhaar Number': d.aadhar_number || 'XXXX-XXXX-XXXX',
                'Holder Name': u?.name || 'Driver'
              }
            });
          }

          if (d.aadhar_back_image) {
            loadedDocs.push({
              id: 'aadhar_back',
              label: 'Aadhaar Card (Back)',
              expiry: 'Lifetime',
              submittedAt: new Date(d.updated_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              imageUrl: getImageUrl(d.aadhar_back_image),
              docDetails: {
                'Aadhaar Number': d.aadhar_number || 'XXXX-XXXX-XXXX',
                'Holder Name': u?.name || 'Driver'
              }
            });
          }

          if (d.vehicle_image) {
            loadedDocs.push({
              id: 'vehicle',
              label: 'Vehicle Photo / RC',
              expiry: 'Valid',
              submittedAt: new Date(d.updated_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              imageUrl: getImageUrl(d.vehicle_image),
              docDetails: {
                'Model Name': d.vehicle_name || 'N/A',
                'Plate Number': d.number_plate || 'N/A',
                'Segment': d.vehicle_type?.toUpperCase() || 'N/A'
              }
            });
          }

          setDocs(loadedDocs);
        }
      } catch (e) {
        console.error('Error fetching driver profile:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DriverHeader title="Documents" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerInfo}>
          <Text style={styles.infoTitle}>Verification Status</Text>
          <Text style={styles.infoText}>
            Below are your verified legal documents active in the database. Tap any document to view its specific registration metrics and digital copies.
          </Text>
        </View>

        {docs.length > 0 ? (
          <View style={styles.list}>
            {docs.map((doc) => {
              const isExpanded = expandedDoc === doc.id;
              
              return (
                <View key={doc.id} style={[styles.docWrapper, isExpanded && styles.docWrapperExpanded]}>
                  <TouchableOpacity 
                    style={styles.docCard}
                    activeOpacity={0.8}
                    onPress={() => setExpandedDoc(isExpanded ? null : doc.id)}
                  >
                    <View style={styles.docLeft}>
                      <View style={styles.docIconBox}>
                        <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
                      </View>
                      <View style={styles.docInfo}>
                        <Text style={styles.docLabel}>{doc.label}</Text>
                        <Text style={styles.docExpiry}>Verified • Expires: {doc.expiry}</Text>
                      </View>
                    </View>

                    <View style={styles.docRight}>
                      <View style={styles.statusTag}>
                        <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                        <Text style={styles.statusText}>Verified</Text>
                      </View>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} style={{ marginTop: 2 }} />
                    </View>
                  </TouchableOpacity>

                  {/* Expanded submitted details */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <View style={styles.detailsBlock}>
                        <View style={styles.detailsGrid}>
                          {Object.entries(doc.docDetails).map(([key, val]) => (
                            <View key={key} style={styles.detailRow}>
                              <Text style={styles.detailLabel}>{key}</Text>
                              <Text style={styles.detailValue}>{val}</Text>
                            </View>
                          ))}
                        </View>

                        {/* Scanned Document Digital Preview Card */}
                        <View style={styles.previewContainer}>
                          <Text style={styles.previewTitle}>Digital Scan Copy</Text>
                          <TouchableOpacity 
                            style={styles.previewBox} 
                            activeOpacity={0.9}
                            onPress={() => {
                              setImageError(false);
                              setPreviewDoc(doc);
                            }}
                          >
                            <Ionicons name="eye" size={20} color={COLORS.white} />
                            <Text style={styles.previewBoxText}>View Digital Card</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Documents Uploaded</Text>
            <Text style={styles.emptyText}>
              There are currently no active document files registered in the database. Please contact your local administrator to upload your verification certificates.
            </Text>
          </View>
        )}

        <View style={styles.footerNote}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.footerText}>
            For help with documents, write to support@lekar.com.
          </Text>
        </View>
      </ScrollView>

      {/* Screen Preview Modal */}
      <Modal visible={!!previewDoc} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.previewCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{previewDoc?.label} Preview</Text>
              <TouchableOpacity onPress={() => setPreviewDoc(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {/* Display actual document image if present, else fallback card */}
            {previewDoc?.imageUrl && !imageError ? (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: previewDoc.imageUrl }} 
                  style={styles.actualImage} 
                  resizeMode="contain"
                  onError={() => setImageError(true)}
                />
              </View>
            ) : (
              <View style={styles.digitalCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderTitle}>LEKAR VERIFIED LICENSE</Text>
                  <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
                </View>

                <View style={styles.cardMain}>
                  <View style={styles.cardLeft}>
                    <View style={styles.cardPhoto}>
                      <Ionicons name="person" size={40} color={COLORS.textMuted} />
                    </View>
                    <Text style={styles.photoLabel}>Scan Match</Text>
                  </View>

                  <View style={styles.cardRight}>
                    {previewDoc?.docDetails && Object.entries(previewDoc.docDetails).map(([key, val]) => (
                      <View key={key} style={styles.cardDetailItem}>
                        <Text style={styles.cardDetailLabel}>{key.toUpperCase()}</Text>
                        <Text style={styles.cardDetailVal}>{val}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>Status: VERIFIED</Text>
                  <Text style={styles.cardFooterDate}>Submitted: {previewDoc?.submittedAt}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.doneBtn} onPress={() => setPreviewDoc(null)}>
              <Text style={styles.doneBtnText}>Close Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: SIZES.padding, paddingTop: 16, paddingBottom: 40 },
  headerInfo: {
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  infoTitle: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  infoText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  list: { gap: 14 },
  docWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  docWrapperExpanded: {
    borderColor: COLORS.primary + '50',
  },
  docCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  docIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: { gap: 4, flex: 1 },
  docLabel: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
  docExpiry: { fontSize: SIZES.xs, color: COLORS.textMuted },
  docRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.success + '15',
  },
  statusText: { fontSize: 11, fontWeight: '800', color: COLORS.success },
  expandedContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: '#12121A',
    gap: 16,
  },
  detailsBlock: { gap: 12 },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailRow: {
    width: '47%',
    gap: 2,
  },
  detailLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted },
  detailValue: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  previewContainer: {
    marginTop: 8,
    gap: 6,
  },
  previewTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
    borderRadius: SIZES.radius,
  },
  previewBoxText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 32,
  },
  footerText: { fontSize: 12, color: COLORS.textMuted },

  // Empty placeholder
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
  },
  emptyTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.text },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 240,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    backgroundColor: '#0F0F14',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actualImage: {
    width: '100%',
    height: '100%',
  },
  digitalCard: {
    width: '100%',
    backgroundColor: '#1E1E2C',
    borderRadius: SIZES.radius,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  cardHeaderTitle: { fontSize: 12, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.5 },
  cardMain: {
    flexDirection: 'row',
    gap: 16,
  },
  cardLeft: {
    alignItems: 'center',
    gap: 4,
  },
  cardPhoto: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoLabel: { fontSize: 8, color: COLORS.textMuted, textTransform: 'uppercase' },
  cardRight: {
    flex: 1,
    gap: 6,
  },
  cardDetailItem: {
    gap: 2,
  },
  cardDetailLabel: { fontSize: 8, fontWeight: '800', color: COLORS.textMuted },
  cardDetailVal: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  cardFooterText: { fontSize: 9, fontWeight: '800', color: COLORS.success },
  cardFooterDate: { fontSize: 9, color: COLORS.textMuted },
  doneBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    width: '100%',
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: { color: COLORS.white, fontSize: SIZES.md, fontWeight: '800' },
});
