// app/(tabs)/settings.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Application from "expo-application";
import { BlurView } from "expo-blur";

import Screen from "../../components/screen";
import { AppTheme, ThemeMode } from "../../constants/theme";
import { useAppTheme } from "../../src/providers/theme.provider";
import { getUserProfile, UserProfile } from "../../src/api/users.api";
import { changePassword, logout } from "../../src/api/auth.api";
import { API_BASE_URL, IS_FALLBACK_API_BASE_URL } from "../../src/config/api";
import {
  AppSettings,
  loadSettings,
  resetSettings,
  saveSettings,
  TextSize,
} from "../../src/storage/settings.storage";

function roleLabel(role?: string) {
  return role === "AGENT_TERRAIN"
    ? "Agent de terrain"
    : role === "AGENT_SAISIE"
      ? "Agent de saisie"
      : role === "ADMIN"
        ? "Administrateur"
        : role || "-";
}

function maskValue(v: string, enabled: boolean) {
  if (!enabled) return v;
  if (v.length <= 6) return "••••";
  return `${v.slice(0, 2)}••••${v.slice(-2)}`;
}

export default function SettingsScreen() {
  const { theme, setThemeMode } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [prefSaveState, setPrefSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [syncState, setSyncState] = useState({ online: true, pending: 0 }); // V1 local

  // password modal
  const [pwOpen, setPwOpen] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // logout
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await getUserProfile(); // { message, data }
        if (mounted) setProfile(res?.data ?? null);
      } catch {
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    })();

    (async () => {
      try {
        const s = await loadSettings();
        if (mounted) setSettings(s);
      } finally {
        if (mounted) setLoadingSettings(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function updateSettings(patch: Partial<AppSettings>) {
    if (!settings) return;
    const prev = settings;
    const next = { ...settings, ...patch };
    setSettings(next);
    setPrefSaveState("saving");
    try {
      await saveSettings(next);
      setPrefSaveState("saved");
      setTimeout(() => setPrefSaveState("idle"), 1200);
    } catch {
      setSettings(prev);
      setPrefSaveState("error");
      Alert.alert("Erreur", "Impossible d'enregistrer la préférence localement.");
    }
  }

  async function onCycleTheme() {
    if (!settings) return;
    const next = getNextTheme(settings.themeMode);
    await updateSettings({ themeMode: next });
    setThemeMode(next);
  }

  const appVersion = useMemo(() => {
    const v = Application.nativeApplicationVersion ?? "—";
    const b = Application.nativeBuildVersion ?? "—";
    return `${v} (${b})`;
  }, []);

  async function onClearLocalData() {
    Alert.alert(
      "Supprimer les données locales",
      "Cela efface les préférences et l’historique local (sans supprimer ton compte). Continuer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await resetSettings();
            setSettings(await loadSettings());
            // tokens: tu peux choisir de ne pas toucher ici.
            Alert.alert("OK", "Données locales réinitialisées.");
          },
        },
      ]
    );
  }

  async function onSubmitChangePassword() {
    const o = oldPw.trim();
    const n = newPw.trim();

    if (!o || !n) {
      setPwError("Veuillez remplir les deux champs.");
      return;
    }

    setPwLoading(true);
    setPwError(null);
    try {
      await changePassword(o, n);

      // Important : après set_password(), certains backends invalides tokens.
      // Ici on affiche un succès et on propose reconnect.
      setPwOpen(false);
      setOldPw("");
      setNewPw("");
      Alert.alert("Succès", "Mot de passe modifié. Si tu rencontres un souci, reconnecte-toi.");
    } catch (e: unknown) {
      const msg =
        (e as any)?.response?.data?.message ||
        (e as any)?.response?.data?.detail ||
        "Impossible de modifier le mot de passe.";
      setPwError(typeof msg === "string" ? msg : "Erreur.");
    } finally {
      setPwLoading(false);
    }
  }

  async function onLogout() {
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          setLogoutLoading(true);

          let serverLogoutOk = true;

          try {
            const refresh = await SecureStore.getItemAsync("refresh_token");

            // 1) Tentative logout serveur (blacklist)
            if (refresh) {
              try {
                await logout(refresh);
              } catch {
                serverLogoutOk = false;
              }
            } else {
              // pas de refresh => on ne peut pas blacklist côté serveur
              serverLogoutOk = false;
            }

            // 2) Purge tokens local (toujours)
            await SecureStore.deleteItemAsync("access_token");
            await SecureStore.deleteItemAsync("refresh_token");

            // 3) Feedback (optionnel)
            if (!serverLogoutOk) {
              Alert.alert(
                "Déconnecté",
                "Déconnexion locale effectuée. Le serveur n’a pas confirmé la déconnexion (réseau/route)."
              );
            }

            // 4) Retour login
            router.replace("/login");
          } finally {
            setLogoutLoading(false);
          }
        },
      },
    ]);
  }

  if (loadingProfile || loadingSettings || !settings) {
    return (
      <Screen>
        <View style={[styles.center, { padding: theme.spacing.lg }]}>
          <ActivityIndicator />
          <Text style={{ color: theme.colors.textDim, marginTop: 10 }}>
            Chargement...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Paramètres</Text>

        {/* COMPTE */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Compte</Text>
            <Ionicons name="person-circle-outline" size={20} color={theme.colors.text} />
          </View>

          <Row label="Nom" value={(profile?.first_name || profile?.last_name) ? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() : "-"} styles={styles} />
          <Row label="Username" value={profile?.username ?? "-"} styles={styles} />
          <Row label="Rôle" value={roleLabel(profile?.role)} styles={styles} />

          <Divider theme={theme} />

          <Pressable style={styles.actionRow} onPress={() => setPwOpen(true)}>
            <Text style={styles.actionText}>Changer le mot de passe</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textDim} />
          </Pressable>

          <Pressable
            style={[styles.dangerRow, logoutLoading && { opacity: 0.7 }]}
            onPress={onLogout}
            disabled={logoutLoading}
          >
            <Text style={styles.dangerText}>
              {logoutLoading ? "Déconnexion..." : "Déconnexion"}
            </Text>
            <Ionicons name="log-out-outline" size={18} color={theme.colors.danger} />
          </Pressable>
        </View>

        {/* PRÉFÉRENCES */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Préférences</Text>
            <Ionicons name="options-outline" size={20} color={theme.colors.text} />
          </View>
          <Text style={styles.prefStateText}>
            {prefSaveState === "saving"
              ? "Enregistrement local..."
              : prefSaveState === "saved"
                ? "Préférence enregistrée"
                : prefSaveState === "error"
                  ? "Erreur d'enregistrement local"
                  : "Stockage local (sans backend)"}
          </Text>

          <SelectRow
            label="Thème"
            value={
              settings.themeMode === "SYSTEM"
                ? "Système"
                : settings.themeMode === "DARK"
                  ? "Sombre"
                  : "Clair"
            }
            onPress={onCycleTheme}
            styles={styles}
            theme={theme}
          />

          <SelectRow
            label="Langue"
            value={settings.language === "FR" ? "Français" : "Kreyòl (beta)"}
            onPress={() =>
              updateSettings({ language: settings.language === "FR" ? "HT" : "FR" })
            }
            styles={styles}
            theme={theme}
          />

          <SelectRow
            label="Taille du texte"
            value={
              settings.textSize === "SMALL"
                ? "Petite"
                : settings.textSize === "LARGE"
                  ? "Grande"
                  : "Normale"
            }
            onPress={() => cycleTextSize(settings.textSize, (v) => updateSettings({ textSize: v }))}
            styles={styles}
            theme={theme}
          />
        </View>

        {/* TERRAIN / SYNC */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Terrain & synchronisation</Text>
            <Ionicons name="cloud-outline" size={20} color={theme.colors.text} />
          </View>

          <ToggleRow
            label="Mode hors-ligne"
            desc="Autoriser la saisie sans réseau (sync plus tard)."
            value={settings.offlineMode}
            onValueChange={(v) => updateSettings({ offlineMode: v })}
            styles={styles}
          />

          <SelectRow
            label="Politique de sync"
            value={settings.syncPolicy === "WIFI_ONLY" ? "Wi-Fi seulement" : "Toujours"}
            onPress={() =>
              updateSettings({
                syncPolicy: settings.syncPolicy === "ALWAYS" ? "WIFI_ONLY" : "ALWAYS",
              })
            }
            styles={styles}
            theme={theme}
          />

          <Divider theme={theme} />

          <View style={styles.kvLine}>
            <Text style={styles.kSmall}>Statut</Text>
            <Text style={styles.vSmall}>
              {syncState.online ? "En ligne" : "Hors ligne"} • {syncState.pending} en attente
            </Text>
          </View>

          <Pressable
            style={styles.btn}
            onPress={() => {
              // V1: action mock. Plus tard: vrai module de sync.
              Alert.alert("Synchronisation", "Sync lancé (V1).");
              setSyncState((s) => ({ ...s, pending: 0 }));
            }}
          >
            <Text style={styles.btnText}>Synchroniser maintenant</Text>
          </Pressable>
        </View>

        {/* NOTIFICATIONS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Notifications</Text>
            <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
          </View>

          <ToggleRow
            label="Alertes prioritaires"
            desc="Véhicule recherché, alerte importante, etc."
            value={settings.notifPriorityAlerts}
            onValueChange={(v) => updateSettings({ notifPriorityAlerts: v })}
            styles={styles}
          />
          <ToggleRow
            label="Documents expirés"
            desc="Avertissements assurance / carte / permis expirés."
            value={settings.notifExpiredDocs}
            onValueChange={(v) => updateSettings({ notifExpiredDocs: v })}
            styles={styles}
          />
          <ToggleRow
            label="Rappel fin de service"
            desc="Petit rappel en fin de journée (optionnel)."
            value={settings.notifEndShift}
            onValueChange={(v) => updateSettings({ notifEndShift: v })}
            styles={styles}
          />
        </View>

        {/* SÉCURITÉ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Sécurité</Text>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.text} />
          </View>

          <ToggleRow
            label="Masquer données sensibles"
            desc="Masquer une partie des numéros à l’écran."
            value={settings.maskSensitive}
            onValueChange={(v) => updateSettings({ maskSensitive: v })}
            styles={styles}
          />

          <View style={styles.kvLine}>
            <Text style={styles.kSmall}>Exemple</Text>
            <Text style={styles.vSmall}>
              {maskValue("DL-2025-000123", settings.maskSensitive)}
            </Text>
          </View>

          <Divider theme={theme} />

          <Pressable
            style={styles.actionRow}
            onPress={() =>
              Alert.alert(
                "Bientôt",
                "Le verrouillage PIN/biométrie sera ajouté (LocalAuthentication)."
              )
            }
          >
            <Text style={styles.actionText}>Verrouillage PIN / biométrie</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textDim} />
          </Pressable>
        </View>

        {/* SUPPORT & À PROPOS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Support & à propos</Text>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.text} />
          </View>

          <Row label="Version" value={appVersion} styles={styles} />
          <Row label="Environnement" value="DEV" styles={styles} />
          <Row
            label="Serveur (baseURL)"
            value={`${API_BASE_URL}${IS_FALLBACK_API_BASE_URL ? " (fallback)" : ""}`}
            styles={styles}
          />

          <Divider theme={theme} />

          <Pressable
            style={styles.actionRow}
            onPress={() =>
              Alert.alert(
                "Support",
                "Ouvre un mail: support@controle-routier.local (à remplacer)."
              )
            }
          >
            <Text style={styles.actionText}>Signaler un problème</Text>
            <Ionicons name="mail-outline" size={18} color={theme.colors.textDim} />
          </Pressable>

          <Pressable style={styles.actionRow} onPress={onClearLocalData}>
            <Text style={styles.actionText}>Supprimer données locales</Text>
            <Ionicons name="trash-outline" size={18} color={theme.colors.textDim} />
          </Pressable>

          <Pressable
            style={styles.actionRow}
            onPress={() => Alert.alert("Bientôt", "Conditions & politique seront ajoutées.")}
          >
            <Text style={styles.actionText}>Conditions / Politique</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textDim} />
          </Pressable>
        </View>

        <View style={{ height: 10 }} />
      </ScrollView>

      {/* MODAL CHANGE PASSWORD */}
      {/* MODAL CHANGE PASSWORD */}
      <Modal
        visible={pwOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPwOpen(false)}
      >
        <View style={styles.modalRoot}>
          {/* Fond flou */}
          <BlurView
            intensity={35}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />

          {/* Assombrissement + zone cliquable pour fermer */}
          <Pressable
            style={[StyleSheet.absoluteFill, styles.modalDim]}
            onPress={() => {
              setPwOpen(false);
              setPwError(null);
            }}
          />

          {/* Carte popup */}
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>

            <TextInput
              value={oldPw}
              onChangeText={setOldPw}
              placeholder="Ancien mot de passe"
              placeholderTextColor={theme.colors.textDim}
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              value={newPw}
              onChangeText={setNewPw}
              placeholder="Nouveau mot de passe"
              placeholderTextColor={theme.colors.textDim}
              secureTextEntry
              style={styles.input}
            />

            {pwError ? <Text style={styles.error}>{pwError}</Text> : null}

            <View style={styles.modalBtns}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={() => {
                  setPwOpen(false);
                  setPwError(null);
                }}
                disabled={pwLoading}
              >
                <Text style={styles.modalBtnTextGhost}>Annuler</Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, pwLoading && { opacity: 0.7 }]}
                onPress={onSubmitChangePassword}
                disabled={pwLoading}
              >
                {pwLoading ? <ActivityIndicator /> : <Text style={styles.modalBtnText}>Valider</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

/* -------- UI Helpers -------- */

function Divider({ theme }: { theme: AppTheme }) {
  return <View style={{ height: 1, backgroundColor: theme.colors.border2, opacity: 0.8 }} />;
}

function Row({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.kvLine}>
      <Text style={styles.kSmall}>{label}</Text>
      <Text style={styles.vSmall}>{value}</Text>
    </View>
  );
}

function ToggleRow({
  label,
  desc,
  value,
  onValueChange,
  styles,
}: {
  label: string;
  desc?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {desc ? <Text style={styles.toggleDesc}>{desc}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function SelectRow({
  label,
  value,
  onPress,
  styles,
  theme,
}: {
  label: string;
  value: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
}) {
  return (
    <Pressable style={styles.selectRow} onPress={onPress}>
      <Text style={styles.selectLabel}>{label}</Text>
      <View style={styles.selectRight}>
        <Text style={styles.selectValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textDim} />
      </View>
    </Pressable>
  );
}

function getNextTheme(cur: ThemeMode): ThemeMode {
  return cur === "SYSTEM" ? "DARK" : cur === "DARK" ? "LIGHT" : "SYSTEM";
}

function cycleTextSize(cur: TextSize, set: (v: TextSize) => void) {
  const next: TextSize = cur === "SMALL" ? "NORMAL" : cur === "NORMAL" ? "LARGE" : "SMALL";
  set(next);
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: 12,
  },

  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "900",
  },

  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 14,
  },

  prefStateText: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: "700",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  kvLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  kSmall: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },

  vSmall: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },

  actionText: {
    color: theme.colors.text,
    fontWeight: "800",
  },

  dangerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },

  dangerText: {
    color: theme.colors.danger,
    fontWeight: "900",
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },

  toggleLabel: {
    color: theme.colors.text,
    fontWeight: "800",
  },

  toggleDesc: {
    color: theme.colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },

  selectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },

  selectLabel: {
    color: theme.colors.text,
    fontWeight: "800",
  },

  selectRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  selectValue: {
    color: theme.colors.textDim,
    fontWeight: "800",
  },

  btn: {
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
  },

  btnText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  modalRoot: {
  flex: 1,
  justifyContent: "center",
  padding: 20,
},

modalDim: {
  backgroundColor: "rgba(0,0,0,0.35)", // petit voile sombre par-dessus le blur
},

modalCard: {
  borderRadius: theme.radius.lg,
  padding: theme.spacing.md,
  backgroundColor: theme.colors.surface,
  gap: 10,

  // mise en évidence (ombre)
  shadowColor: "#000",
  shadowOpacity: 0.25,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 8,
},

  // modalBackdrop: {
  //   flex: 1,
  //   backgroundColor: "rgba(0,0,0,0.6)",
  //   justifyContent: "center",
  //   padding: 20,
  // },

  // modalCard: {
  //   borderRadius: theme.radius.lg,
  //   padding: theme.spacing.md,
  //   backgroundColor: theme.colors.surface,
  //   gap: 10,
  // },

  modalTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 16,
  },

  modalBtns: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },

  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
  },

  modalBtnGhost: {
    backgroundColor: "transparent",
    borderColor: theme.colors.border2,
  },

  modalBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  modalBtnTextGhost: {
    color: theme.colors.textDim,
    fontWeight: "900",
  },

  input: {
    borderWidth: 1,
    borderColor: theme.colors.border2,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface2,
    fontWeight: "700",
  },

  error: {
    color: theme.colors.danger,
    fontWeight: "800",
  },
  });
}




