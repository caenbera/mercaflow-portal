const functions = require("firebase-functions");
const admin = require("firebase-admin");
const webpush = require("web-push");

admin.initializeApp();

// Set up VAPID keys for web push.
// In a production environment, these should be stored securely as environment variables.
// For example, in Firebase Functions config:
// `firebase functions:config:set vapid.public_key="YOUR_KEY" vapid.private_key="YOUR_KEY"`
// The public key MUST match the one used in `src/lib/notifications.ts`.
const VAPID_PUBLIC_KEY = "BPhgGfH_TCI66-3o7kXQ2S2G4iO4-dJkYx9A3C2A1Z1E4W4zY2zJ4J8L4zX3w5H_k3K9J6n3L1oY8E";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const NOTIFICATION_ICON = "https://i.postimg.cc/y86gF4Cp/the-fresh_hub-noback.png";

if (VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
      "mailto:example@your-domain.com",
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
  );
} else {
  functions.logger.warn("VAPID_PRIVATE_KEY environment variable not set. Push notifications will not work.");
}


/**
 * Sends a push notification to a single user.
 * @param {string} userId - The user's ID.
 * @param {object} payload - The notification payload.
 */
async function sendNotificationToUser(userId, payload) {
    if (!userId) {
        functions.logger.log("No userId provided, cannot send notification.");
        return;
    }
    try {
        const userDoc = await admin.firestore().collection("users").doc(userId).get();
        if (!userDoc.exists) {
            functions.logger.log("User document not found:", userId);
            return;
        }

        const userProfile = userDoc.data();
        const subscription = userProfile.pushSubscription;

        if (subscription && subscription.endpoint) {
            await webpush.sendNotification(subscription, JSON.stringify(payload));
            functions.logger.log("Successfully sent notification to user:", userId);
        } else {
            functions.logger.log("No push subscription found for user:", userId);
        }
    } catch (error) {
        functions.logger.error("Error sending push notification for user:", userId, error);
        if (error.statusCode === 410 || error.statusCode === 404) {
            functions.logger.log("Subscription is gone or invalid, removing from user profile.");
            return admin.firestore().collection("users").doc(userId).update({
                pushSubscription: null,
            });
        }
    }
}

/**
 * Sends a push notification to all users with the specified roles.
 * @param {Array<string>} roles - Array of roles (e.g., ['admin', 'superadmin']).
 * @param {object} payload - The notification payload.
 */
async function sendNotificationToRoles(roles, payload) {
    try {
        const usersRef = admin.firestore().collection('users');
        const q = usersRef.where('role', 'in', roles);
        const usersSnapshot = await q.get();

        if (usersSnapshot.empty) {
            functions.logger.log("No users found with roles:", roles);
            return;
        }

        const notificationPromises = [];
        usersSnapshot.forEach(doc => {
            const userProfile = doc.data();
            const subscription = userProfile.pushSubscription;
            if (subscription && subscription.endpoint) {
                notificationPromises.push(
                    webpush.sendNotification(subscription, JSON.stringify(payload))
                );
            }
        });

        await Promise.all(notificationPromises);
        functions.logger.log(`Sent notifications to ${notificationPromises.length} users with roles:`, roles);
    } catch (error) {
        functions.logger.error("Error sending notifications to roles:", roles, error);
    }
}


// --- SUPPORT TICKET NOTIFICATIONS ---

/**
 * Triggers when a support ticket status is updated and sends a push notification TO THE CLIENT.
 */
exports.onSupportTicketUpdate = functions.firestore
    .document("supportTickets/{ticketId}")
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();

        // Exit if the status hasn't changed
        if (newValue.status === previousValue.status) {
            return null;
        }

        const statusTranslations = {
          "new": "Nuevo",
          "in_progress": "En Progreso",
          "resolved": "Resuelto",
        };

        const notificationPayload = {
          title: "Actualización de Ticket de Soporte",
          body: `Tu ticket #${context.params.ticketId.substring(0, 6)} ha sido actualizado a: ${statusTranslations[newValue.status] || newValue.status}`,
          icon: NOTIFICATION_ICON,
          data: {
            url: `/client/support`,
          },
        };

        await sendNotificationToUser(newValue.userId, notificationPayload);
        return null;
    });

/**
 * Triggers when a NEW support ticket is created and notifies ALL ADMINS.
 */
exports.onNewSupportTicket = functions.firestore
    .document("supportTickets/{ticketId}")
    .onCreate(async (snap, context) => {
        const ticket = snap.data();
        const notificationPayload = {
          title: "Nuevo Ticket de Soporte",
          body: `De ${ticket.userName}: "${ticket.issueType}"`,
          icon: NOTIFICATION_ICON,
          data: {
            url: `/admin/support`,
          },
        };
        
        await sendNotificationToRoles(['admin', 'superadmin'], notificationPayload);
        return null;
    });


// --- ORDER NOTIFICATIONS ---

/**
 * Triggers when a NEW order is created and notifies ALL ADMINS.
 */
exports.onNewOrder = functions.firestore
    .document("orders/{orderId}")
    .onCreate(async (snap, context) => {
        const order = snap.data();
        const notificationPayload = {
          title: "Nuevo Pedido Recibido",
          body: `Nuevo pedido de ${order.businessName} por un total de $${order.total.toFixed(2)}.`,
          icon: NOTIFICATION_ICON,
          data: {
            url: `/admin/orders`,
          },
        };
        
        await sendNotificationToRoles(['admin', 'superadmin'], notificationPayload);
        return null;
    });

/**
 * Triggers when an order status is updated and notifies THE CLIENT.
 */
exports.onOrderUpdate = functions.firestore
    .document("orders/{orderId}")
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();

        // Exit if the status hasn't changed
        if (newValue.status === previousValue.status) {
            return null;
        }

        const statusTranslations = {
          "pending": "Pendiente",
          "processing": "En Preparación",
          "shipped": "En Ruta",
          "delivered": "Entregado",
          "cancelled": "Cancelado"
        };

        const notificationPayload = {
          title: "Actualización de tu Pedido",
          body: `Tu pedido #${context.params.orderId.substring(0, 6)} ha sido actualizado a: ${statusTranslations[newValue.status] || newValue.status}`,
          icon: NOTIFICATION_ICON,
          data: {
            url: `/client/history`,
          },
        };

        await sendNotificationToUser(newValue.userId, notificationPayload);

        // Note: Logic for awarding points on 'delivered' status would go here.
        // This requires re-implementing the rewards engine logic on the server-side.
        if (newValue.status === 'delivered') {
             functions.logger.log(`Order ${context.params.orderId} delivered. Reward point calculation can be triggered here.`);
        }

        return null;
    });
