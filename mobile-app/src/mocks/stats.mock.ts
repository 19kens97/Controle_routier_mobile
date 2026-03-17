import { DashboardStats } from "../api/stats.api";

export const mockDashboardStats: DashboardStats = {
  source: "mock",
  generatedAt: "2026-03-17T10:30:00Z",
  headline: "Activite soutenue sur les 7 derniers jours",
  subheadline:
    "Les controles progressent, avec une pression plus forte sur les zones urbaines et les documents expires.",
  metrics: [
    {
      id: "checks",
      label: "Controles",
      value: 148,
      formattedValue: "148",
      deltaLabel: "+18% vs semaine precedente",
      direction: "up",
      tone: "success",
    },
    {
      id: "tickets",
      label: "PV saisis",
      value: 39,
      formattedValue: "39",
      deltaLabel: "+9 nouveaux aujourd'hui",
      direction: "up",
      tone: "default",
    },
    {
      id: "alerts",
      label: "Alertes",
      value: 17,
      formattedValue: "17",
      deltaLabel: "5 dossiers critiques",
      direction: "neutral",
      tone: "warning",
    },
    {
      id: "expired",
      label: "Docs expires",
      value: 12,
      formattedValue: "12",
      deltaLabel: "A traiter en priorite",
      direction: "down",
      tone: "danger",
    },
  ],
  activity: {
    title: "Activite journaliere",
    points: [
      { label: "Lun", value: 18 },
      { label: "Mar", value: 24 },
      { label: "Mer", value: 21 },
      { label: "Jeu", value: 28 },
      { label: "Ven", value: 31 },
      { label: "Sam", value: 16 },
      { label: "Dim", value: 10 },
    ],
  },
  infractions: {
    title: "Infractions dominantes",
    items: [
      { label: "Stationnement", value: 14, formattedValue: "14 cas", color: "#E85D04" },
      { label: "Assurance", value: 10, formattedValue: "10 cas", color: "#355CDE" },
      { label: "Vitesse", value: 8, formattedValue: "8 cas", color: "#1B8A5A" },
      { label: "Carte grise", value: 7, formattedValue: "7 cas", color: "#C1121F" },
    ],
  },
  hotspots: {
    title: "Zones les plus actives",
    items: [
      { id: "delmas", label: "Delmas", value: 34, meta: "34 controles" },
      { id: "petion", label: "Petion-Ville", value: 29, meta: "29 controles" },
      { id: "carrefour", label: "Carrefour", value: 20, meta: "20 controles" },
    ],
  },
  agents: {
    title: "Agents les plus actifs",
    items: [
      { id: "agent-1", label: "Jean Pierre", value: 19, meta: "19 PV cette semaine" },
      { id: "agent-2", label: "Nadia Louis", value: 15, meta: "15 PV cette semaine" },
      { id: "agent-3", label: "Rony Paul", value: 11, meta: "11 PV cette semaine" },
    ],
  },
  recentActivity: [
    {
      id: "ra-1",
      title: "PV enregistre pour AB-12345",
      subtitle: "Absence d'assurance · Delmas 33",
      timeLabel: "Il y a 12 min",
      status: "success",
    },
    {
      id: "ra-2",
      title: "Document expire detecte",
      subtitle: "Carte vehicule · Petion-Ville",
      timeLabel: "Il y a 26 min",
      status: "warning",
    },
    {
      id: "ra-3",
      title: "Controle sans infraction",
      subtitle: "Vehicule CD-54321 · Carrefour",
      timeLabel: "Il y a 41 min",
      status: "neutral",
    },
  ],
  alerts: [
    {
      id: "al-1",
      title: "Pic de documents expires",
      description: "Les expirations d'assurance depassent la moyenne habituelle.",
      tone: "danger",
    },
    {
      id: "al-2",
      title: "Hausse du volume de controles",
      description: "Le rythme de controles est en progression continue depuis 4 jours.",
      tone: "success",
    },
  ],
};
