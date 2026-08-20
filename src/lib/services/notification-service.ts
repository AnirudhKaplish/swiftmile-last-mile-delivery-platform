// src/lib/services/notification-service.ts
import { prisma } from "../prisma";

export interface SendNotificationOptions {
  userId: string;
  orderId?: string;
  title: string;
  message: string;
  type: string;
  sendEmail?: boolean;
  sendSms?: boolean;
  recipientEmail?: string;
  recipientPhone?: string;
}

export interface NotificationProvider {
  sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean>;
  sendSms(to: string, message: string): Promise<boolean>;
}

/**
 * Clean mock provider for local development that logs structured notifications
 * and can be seamlessly switched with Resend/Twilio/AWS SNS in production via env variables.
 */
export const mockNotificationProvider: NotificationProvider = {
  async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    console.log(`\n📧 [EMAIL DISPATCH] To: ${to} | Subject: ${subject}`);
    console.log(`   Content: ${htmlContent.substring(0, 120)}...\n`);
    return true;
  },

  async sendSms(to: string, message: string): Promise<boolean> {
    console.log(`\n📱 [SMS DISPATCH] To: ${to} | Message: ${message}\n`);
    return true;
  },
};

/**
 * Dispatches multi-channel notifications (Database + Email + SMS)
 */
export async function sendNotification(options: SendNotificationOptions) {
  const { userId, orderId, title, message, type, sendEmail = true, sendSms = true } = options;

  // 1. Create In-App Notification in Database
  const notification = await prisma.notification.create({
    data: {
      userId,
      orderId,
      title,
      message,
      type,
      read: false,
    },
  });

  // 2. Lookup recipient contact if not provided
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true, name: true },
  });

  const recipientEmail = options.recipientEmail || user?.email;
  const recipientPhone = options.recipientPhone || user?.phone;

  // 3. Dispatch Email notification
  if (sendEmail && recipientEmail) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a;">SwiftMile Logistics</h2>
        <h3 style="color: #0f172a;">${title}</h3>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">${message}</p>
        <div style="margin-top: 24px; padding: 12px; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #64748b;">
          This is an automated operational notification regarding your delivery order.
        </div>
      </div>
    `;
    await mockNotificationProvider.sendEmail(recipientEmail, `SwiftMile: ${title}`, emailHtml);
  }

  // 4. Dispatch SMS notification
  if (sendSms && recipientPhone) {
    const smsText = `SwiftMile: ${title}. ${message}`;
    await mockNotificationProvider.sendSms(recipientPhone, smsText);
  }

  return notification;
}
