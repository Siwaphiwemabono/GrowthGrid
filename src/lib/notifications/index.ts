// src/lib/notifications/index.ts
import { db } from "@/db/db";
import type { CreateNotification } from "@/types/notifications";

export const createNotification = async (data: CreateNotification) => {
  try {
    const { data: notification, error } = await db
      .from("notifications")
      .insert({
        user_id: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link || null,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to create notification:", error);
      return null;
    }

    return notification;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    return null;
  }
};

export const getNotifications = async (userId: string) => {
  try {
    const { data, error } = await db
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ Failed to get notifications:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Error getting notifications:", error);
    return [];
  }
};

export const getUnreadCount = async (userId: string) => {
  try {
    const { count, error } = await db
      .from("notifications")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("❌ Failed to get unread count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("❌ Error getting unread count:", error);
    return 0;
  }
};

export const markAsRead = async (notificationId: string) => {
  try {
    const { error } = await db
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("❌ Failed to mark as read:", error);
    }
  } catch (error) {
    console.error("❌ Error marking as read:", error);
  }
};

export const markAllAsRead = async (userId: string) => {
  try {
    const { error } = await db
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("❌ Failed to mark all as read:", error);
    }
  } catch (error) {
    console.error("❌ Error marking all as read:", error);
  }
};

export const deleteNotification = async (notificationId: string) => {
  try {
    const { error } = await db
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      console.error("❌ Failed to delete notification:", error);
    }
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
  }
};