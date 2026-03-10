// app/(tabs)/profile.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../../components/screen";
import { AppTheme, theme as themeSingleton } from "../../constants/theme";
import { useAppTheme } from "../../src/providers/theme.provider";
import { getUserProfile, updateUserProfile, UserProfile } from "../../src/api/users.api";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
};

export default function ProfileScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormState>({
    first_name: "",
    last_name: "",
    email: "",
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roleLabel = useMemo(() => {
    const role = profile?.role || "AGENT_TERRAIN";
    return role === "AGENT_TERRAIN"
      ? "Agent de terrain"
      : role === "AGENT_SAISIE"
      ? "Agent de saisie"
      : "Administrateur";
  }, [profile]);

  const fullName = useMemo(() => {
    const first = (profile?.first_name || "").trim();
    const last = (profile?.last_name || "").trim();
    const full = `${first} ${last}`.trim();
    return full || profile?.username || "Agent";
  }, [profile]);

  const initials = useMemo(() => {
    const f = (profile?.first_name || "").trim();
    const l = (profile?.last_name || "").trim();
    const a = f ? f[0].toUpperCase() : "";
    const b = l ? l[0].toUpperCase() : "";
    const two = `${a}${b}`.trim();
    return two || (profile?.username?.slice(0, 2).toUpperCase() ?? "AG");
  }, [profile]);

  async function loadProfile() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getUserProfile(); // { message, data }
      const p = res?.data ?? null;
      setProfile(p);

      // init form
      setForm({
        first_name: p?.first_name ?? "",
        last_name: p?.last_name ?? "",
        email: p?.email ?? "",
      });
    } catch {
      setProfile(null);
      setErrorMsg("Impossible de charger le profil. Vérifie ta connexion.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function cancelEdit() {
    setIsEditing(false);
    setErrorMsg(null);
    setForm({
      first_name: profile?.first_name ?? "",
      last_name: profile?.last_name ?? "",
      email: profile?.email ?? "",
    });
  }

  async function save() {
    if (!profile) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const payload: Partial<FormState> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
      };

      const res = await updateUserProfile(payload); // { message, data }
      // backend renvoie data = serializer fields (first_name,last_name,email)
      const updated = res?.data ?? payload;

      // merge dans le profile local
      const merged: UserProfile = {
        ...profile,
        ...updated,
      };

      setProfile(merged);
      setIsEditing(false);
    } catch {
      // si ton api renvoie errors détaillées, tu peux les afficher ici
      setErrorMsg("Erreur lors de l’enregistrement. Vérifie les champs.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{loading ? "..." : fullName}</Text>
            <View style={styles.rolePill}>
              <Ionicons name="shield-checkmark-outline" size={14} color={theme.colors.text} />
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </View>

          <Pressable
            onPress={loadProfile}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="refresh-outline" size={18} color={theme.colors.text} />
          </Pressable>
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={18} color={theme.colors.danger} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Info cards */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations</Text>

          <InfoRow
            label="Nom d'utilisateur"
            value={profile?.username ?? (loading ? "..." : "-")}
            icon="person-outline"
            styles={styles}
            theme={theme}
          />
          <InfoRow
            label="NIF"
            value={profile?.nif ?? "-"}
            icon="card-outline"
            styles={styles}
            theme={theme}
          />
          <InfoRow
            label="Téléphone"
            value={profile?.phone_number ?? "-"}
            icon="call-outline"
            styles={styles}
            theme={theme}
          />
          <InfoRow
            label="Date de naissance"
            value={profile?.date_of_birth ?? "-"}
            icon="calendar-outline"
            styles={styles}
            theme={theme}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Profil</Text>

            {!isEditing ? (
              <Pressable
                onPress={() => {
                  setIsEditing(true);
                  setErrorMsg(null);
                }}
                style={({ pressed }) => [styles.smallBtn, pressed && { opacity: 0.9 }]}
              >
                <Ionicons name="create-outline" size={16} color={theme.colors.text} />
                <Text style={styles.smallBtnText}>Modifier</Text>
              </Pressable>
            ) : null}
          </View>

          <Field
            label="Prénom"
            value={form.first_name}
            onChange={(v) => setForm((s) => ({ ...s, first_name: v }))}
            editable={isEditing}
            placeholder="Votre prénom"
          />
          <Field
            label="Nom"
            value={form.last_name}
            onChange={(v) => setForm((s) => ({ ...s, last_name: v }))}
            editable={isEditing}
            placeholder="Votre nom"
            styles={styles}
          />
          <Field
            label="Email"
            value={form.email}
            onChange={(v) => setForm((s) => ({ ...s, email: v }))}
            editable={isEditing}
            placeholder="email@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {isEditing ? (
            <View style={styles.actionsRow}>
              <Pressable
                onPress={cancelEdit}
                disabled={saving}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnGhost,
                  pressed && { opacity: 0.92 },
                  saving && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.btnText}>Annuler</Text>
              </Pressable>

              <Pressable
                onPress={save}
                disabled={saving}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnPrimary,
                  pressed && { opacity: 0.92 },
                  saving && { opacity: 0.6 },
                ]}
              >
                {saving ? (
                  <ActivityIndicator />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color={theme.colors.text} />
                    <Text style={styles.btnText}>Enregistrer</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>
    </Screen>
  );
}

function InfoRow({
  label,
  value,
  icon,
  styles,
  theme,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={theme.colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  editable,
  placeholder,
  keyboardType,
  autoCapitalize,
  styles,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  styles?: ReturnType<typeof createStyles>;
}) {
  const resolvedStyles = styles ?? createStyles(themeSingleton);
  return (
    <View style={{ marginTop: themeSingleton.spacing.md }}>
      <Text style={resolvedStyles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.35)"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[
          resolvedStyles.input,
          !editable && { opacity: 0.8 },
        ]}
      />
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },

  headerCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.font.h2,
  },

  name: {
    color: theme.colors.text,
    fontSize: theme.font.h2 ?? 18,
    fontWeight: "900",
  },

  rolePill: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border2,
  },
  roleText: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "900",
    fontSize: theme.font.small,
  },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border2,
    alignItems: "center",
    justifyContent: "center",
  },

  errorBox: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(255,0,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,0,0,0.25)",
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
    flex: 1,
  },

  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },

  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.font.body,
    fontWeight: "900",
  },

  infoRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingTop: theme.spacing.md,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    color: theme.colors.textDim,
    fontSize: theme.font.small,
    fontWeight: "800",
  },
  infoValue: {
    color: theme.colors.text,
    fontSize: theme.font.body,
    fontWeight: "900",
    marginTop: 4,
  },

  smallBtn: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border2,
  },
  smallBtnText: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "900",
    fontSize: theme.font.small,
  },

  fieldLabel: {
    color: theme.colors.textDim,
    fontSize: theme.font.small,
    fontWeight: "900",
    marginBottom: 8,
  },
  input: {
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border2,
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: theme.font.body,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: theme.spacing.lg,
  },

  btn: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
  },
  btnPrimary: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accentBorder,
  },
  btnGhost: {
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border2,
  },
  btnText: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "900",
    fontSize: theme.font.body,
  },
  });
}
