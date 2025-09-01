
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Cloud Function that triggers when a new Firebase user is created.
 * It checks if the user's email exists in the 'adminInvites' collection.
 * If it does, the function assigns a custom 'admin' claim to the user and
 * updates their role in the corresponding Firestore 'users' document.
 */
exports.processSignUp = functions.auth.user().onCreate(async (user) => {
  const { uid, email } = user;

  if (!email) {
    functions.logger.log(`User ${uid} has no email, cannot process role.`);
    return null;
  }

  const inviteDocRef = admin.firestore().collection("adminInvites").doc(email);

  try {
    const inviteDoc = await inviteDocRef.get();

    // If an invite doesn't exist, the user is a regular client. Do nothing.
    if (!inviteDoc.exists) {
      functions.logger.log(`No invite found for ${email}. User is a client.`);
      return null;
    }

    const inviteData = inviteDoc.data();

    // The user was pre-approved. Set their custom claims.
    if (inviteData.role === "admin") {
      functions.logger.log(`Invite found for ${email}. Setting admin claim.`);
      await admin.auth().setCustomUserClaims(uid, { admin: true });

      // Also update the user's document in Firestore with the 'admin' role.
      // This is for display purposes in the app.
      const userDocRef = admin.firestore().collection("users").doc(uid);
      await userDocRef.update({ role: "admin" });

      functions.logger.log(`Successfully set admin role for user ${uid} (${email}).`);
      
      // Optionally, delete the invite so it can't be reused.
      await inviteDocRef.delete();
      
      return { result: `Admin role assigned to ${email}` };
    }

    return null;
  } catch (error) {
    functions.logger.error(`Error processing signup for ${email}:`, error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while processing the user's role."
    );
  }
});

/**
 * This function synchronizes role changes made in Firestore to Firebase Auth Custom Claims.
 * It ensures that if a superadmin changes a user's role in the UI, the user's
 * authentication token reflects that change, granting or revoking privileges.
 */
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
        // This ensures the superadmin role is also reflected in claims
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
