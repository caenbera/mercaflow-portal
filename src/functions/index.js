const functions = require("firebase-functions");
const admin = require("firebase-admin");
const webpush = require("web-push");

admin.initializeApp();

// Set up VAPID keys for web push.
const VAPID_PUBLIC_KEY = "BPhgGfH_TCI66-3o7kXQ2S2G4iO4-dJkYx9A3C2A1Z1E4W4zY2zJ4J8L4zX3w5H_k3K9J6n3L1oY8E";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const NOTIFICATION_ICON = "https://i.postimg.cc/sxBVGnMp/icon.png";

if (VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
      "mailto:example@your-domain.com",
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
  );
} else {
  functions.logger.warn("VAPID_PRIVATE_KEY environment variable not set. Push notifications will not work.");
}

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

        await admin.firestore().collection('users').doc(userId).collection('notifications').add({
            ...payload,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        if (subscription && subscription.endpoint) {
            await webpush.sendNotification(subscription, JSON.stringify(payload));
            functions.logger.log("Successfully sent push notification to user:", userId);
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

async function sendNotificationToRoles(roles, payload) {
    try {
        const usersRef = admin.firestore().collection('users');
        const usersSnapshot = await usersRef.get();

        if (usersSnapshot.empty) {
            functions.logger.log("No users found to send notifications to.");
            return;
        }

        const notificationPromises = [];
        const batch = admin.firestore().batch();
        let targetUserCount = 0;
        
        usersSnapshot.forEach(doc => {
            const userProfile = doc.data();
            if (roles.includes(userProfile.role)) {
                targetUserCount++;
                const notificationRef = admin.firestore().collection('users').doc(doc.id).collection('notifications').doc();
                batch.set(notificationRef, {
                    ...payload,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });

                const subscription = userProfile.pushSubscription;
                if (subscription && subscription.endpoint) {
                    notificationPromises.push(
                        webpush.sendNotification(subscription, JSON.stringify(payload))
                    );
                }
            }
        });

        if (targetUserCount === 0) {
            functions.logger.log("No users found with specified roles:", roles);
            return;
        }

        await Promise.all(notificationPromises);
        await batch.commit();
        functions.logger.log(`Sent notifications to ${targetUserCount} users with roles:`, roles);
    } catch (error) {
        functions.logger.error("Error sending notifications to roles:", roles, error);
    }
}

// --- REWARD POINTS ENGINE ---
async function awardPointsForOrder(order, userProfile, allOrders, allRules) {
    let totalPoints = 0;
    const activeRules = allRules.filter(rule => rule.isActive);
    const orderDay = order.createdAt.toDate().getDay();

    const additiveRules = activeRules.filter(r => r.ruleType !== 'multiplierPerDay');
    const multiplierRules = activeRules.filter(r => r.ruleType === 'multiplierPerDay' && r.dayOfWeek === orderDay);

    for (const rule of additiveRules) {
        let pointsFromRule = 0;
        switch (rule.ruleType) {
            case 'pointsPerDollar':
                if (rule.points && rule.perAmount) {
                    pointsFromRule = Math.floor(order.total / rule.perAmount) * rule.points;
                }
                break;
            case 'bonusForAmount':
                if (rule.points && rule.amount && order.total > rule.amount) {
                    pointsFromRule = rule.points;
                }
                break;
            case 'fixedPointsPerOrder':
                if (rule.points) {
                    pointsFromRule = rule.points;
                }
                break;
            case 'bonusForProduct':
                if (rule.points && rule.productId && order.items.some(item => item.productId === rule.productId)) {
                    pointsFromRule = rule.points;
                }
                break;
            case 'firstOrderBonus':
                const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
                if (rule.points && deliveredOrders.length === 1 && deliveredOrders[0].id === order.id) {
                    pointsFromRule = rule.points;
                }
                break;
            case 'anniversaryBonus':
                const userAnniversaryMonth = userProfile.createdAt.toDate().getMonth();
                const orderMonth = order.createdAt.toDate().getMonth();
                if (rule.points && userAnniversaryMonth === orderMonth) {
                    pointsFromRule = rule.points;
                }
                break;
            case 'bonusForVariety':
                if (rule.points && rule.amount && order.items.length > rule.amount) {
                    pointsFromRule = rule.points;
                }
                break;
        }
        totalPoints += pointsFromRule;
    }

    for (const rule of multiplierRules) {
        if (rule.multiplier) {
            totalPoints *= rule.multiplier;
        }
    }

    totalPoints = Math.floor(totalPoints);

    if (totalPoints > 0) {
        const userRef = admin.firestore().collection('users').doc(userProfile.uid);
        const activityRef = userRef.collection('rewardsActivity').doc();

        const batch = admin.firestore().batch();
        batch.update(userRef, { rewardPoints: admin.firestore.FieldValue.increment(totalPoints) });
        batch.set(activityRef, {
            description: `Pedido #${order.id.substring(0, 6)}`,
            points: totalPoints,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();

        // Send notification for points earned
        const pointsNotificationPayload = {
            title: "🎉 ¡Puntos Ganados!",
            body: `Has recibido ${totalPoints} puntos por tu pedido.`,
            icon: NOTIFICATION_ICON,
            data: { url: '/client/rewards' },
        };
        await sendNotificationToUser(userProfile.uid, pointsNotificationPayload);
    }
}


// --- SUPPORT TICKET NOTIFICATIONS ---
exports.onSupportTicketUpdate = functions.firestore
    .document("supportTickets/{ticketId}")
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();
        if (newValue.status === previousValue.status) return null;

        const statusTranslations = { "new": "Nuevo", "in_progress": "En Progreso", "resolved": "Resuelto" };
        const notificationPayload = {
          title: "Actualización de Ticket de Soporte",
          body: `Tu ticket #${context.params.ticketId.substring(0, 6)} ha sido actualizado a: ${statusTranslations[newValue.status] || newValue.status}`,
          icon: NOTIFICATION_ICON,
          data: { url: `/client/support` },
        };
        await sendNotificationToUser(newValue.userId, notificationPayload);
        return null;
    });

exports.onNewSupportTicket = functions.firestore
    .document("supportTickets/{ticketId}")
    .onCreate(async (snap) => {
        const ticket = snap.data();
        const notificationPayload = {
          title: "Nuevo Ticket de Soporte",
          body: `De ${ticket.userName}: "${ticket.issueType}"`,
          icon: NOTIFICATION_ICON,
          data: { url: `/admin/support` },
        };
        await sendNotificationToRoles(['admin', 'superadmin'], notificationPayload);
        return null;
    });

// --- ORDER NOTIFICATIONS ---
exports.onNewOrder = functions.firestore
    .document("orders/{orderId}")
    .onCreate(async (snap) => {
        const order = snap.data();
        const notificationPayload = {
          title: "Nuevo Pedido Recibido",
          body: `Nuevo pedido de ${order.businessName} por un total de $${order.total.toFixed(2)}.`,
          icon: NOTIFICATION_ICON,
          data: { url: `/admin/orders` },
        };
        await sendNotificationToRoles(['admin', 'superadmin'], notificationPayload);
        return null;
    });

exports.onOrderUpdate = functions.firestore
    .document("orders/{orderId}")
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();
        if (newValue.status === previousValue.status) return null;

        const statusTranslations = { "pending": "Pendiente", "processing": "En Preparación", "shipped": "En Ruta", "delivered": "Entregado", "cancelled": "Cancelado" };
        const notificationPayload = {
          title: "Actualización de tu Pedido",
          body: `Tu pedido #${context.params.orderId.substring(0, 6)} ha sido actualizado a: ${statusTranslations[newValue.status] || newValue.status}`,
          icon: NOTIFICATION_ICON,
          data: { url: `/client/history` },
        };
        await sendNotificationToUser(newValue.userId, notificationPayload);

        // If order is delivered, award points.
        if (newValue.status === 'delivered' && previousValue.status !== 'delivered') {
            try {
                const userId = newValue.userId;
                const userDoc = await admin.firestore().collection('users').doc(userId).get();
                if (!userDoc.exists) throw new Error("User not found for point calculation");
                const userProfile = { uid: userDoc.id, ...userDoc.data() };

                const rulesSnapshot = await admin.firestore().collection('rewardRules').where('isActive', '==', true).get();
                const allRules = rulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const userOrdersSnapshot = await admin.firestore().collection('orders').where('userId', '==', userId).get();
                const allOrders = userOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                const order = { id: context.params.orderId, ...newValue };
                
                await awardPointsForOrder(order, userProfile, allOrders, allRules);
            } catch (error) {
                functions.logger.error(`Error awarding points for order ${context.params.orderId}:`, error);
            }
        }

        return null;
    });

// --- OFFER NOTIFICATIONS ---
exports.onNewOffer = functions.firestore
    .document("offers/{offerId}")
    .onCreate(async (snap) => {
        const offer = snap.data();
        const notificationPayload = {
          title: "🔥 ¡Nueva Oferta Flash!",
          body: `¡${offer.productName.es} a un precio increíble! No te la pierdas.`,
          icon: NOTIFICATION_ICON,
          data: { url: '/client/offers' },
        };
        // Send to all clients
        await sendNotificationToRoles(['client'], notificationPayload);
        return null;
    });
