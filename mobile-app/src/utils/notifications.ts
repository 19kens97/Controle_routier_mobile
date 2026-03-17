import Constants, { ExecutionEnvironment } from "expo-constants";
import { Linking, Platform } from "react-native";

export type NotificationPermissionState = "granted" | "denied" | "undetermined";

const ANDROID_CHANNEL_ID = "default";

function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

async function getNotificationsModule() {
  if (isExpoGo()) {
    return null;
  }

  const Notifications = await import("expo-notifications");

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  return Notifications;
}

function mapPermissionStatus(status?: string): NotificationPermissionState {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

export function areNotificationsSupported(): boolean {
  return !isExpoGo();
}

export async function configureNotificationChannel() {
  const Notifications = await getNotificationsModule();
  if (!Notifications || Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "General",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return "undetermined";
  }

  const permissions = await Notifications.getPermissionsAsync();
  return mapPermissionStatus(permissions.status);
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return "denied";
  }

  await configureNotificationChannel();
  const permissions = await Notifications.requestPermissionsAsync();
  return mapPermissionStatus(permissions.status);
}

export async function openDeviceNotificationSettings() {
  await Linking.openSettings();
}

export async function sendTestNotification() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    throw new Error("Notifications are not supported in Expo Go.");
  }

  await configureNotificationChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Notifications actives",
      body: "Les notifications de l'application sont bien configurees.",
      sound: true,
    },
    trigger: null,
  });
}
