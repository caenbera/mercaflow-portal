const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.onUserRoleChange = functions.firestore
  .document("users/{uid}")
  .onUpdate(async (change, context) => {
    const newRole = change.after.data().role;
    const oldRole = change.before.data().role;
    const uid = context.params.uid;

    if (newRole === oldRole) {
      functions.logger.log(`Role for user ${uid} is unchanged. Exiting.`);
      return null;
    }

    functions.logger.log(
      `Role for user ${uid} changed from '${oldRole}' to '${newRole}'. Updating custom claims.`
    );

    try {
      let claims = {};
      if (newRole === "admin") {
        claims = { admin: true };
      } else if (newRole === "superadmin") {
        claims = { superadmin: true };
      }
      
      await admin.auth().setCustomUserClaims(uid, claims);

      return {
        result: `Custom claims for user ${uid} have been updated to reflect new role: ${newRole}.`,
      };
    } catch (error) {
      functions.logger.error(
        `Error setting custom claims for user ${uid}:`,
        error
      );
      throw new functions.https.HttpsError(
        "internal",
        "An error occurred while setting custom claims."
      );
    }
  });
