
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const SUPER_ADMIN_EMAIL = 'superadmin@thefreshhub.com';

/**
 * Cloud Function that triggers when a new Firebase user is created.
 * It checks if the user's email exists in the 'adminInvites' collection.
 * If it does, the function assigns a custom 'admin' claim to the user.
 * This function's primary job is to set claims, not to touch the Firestore user document.
 */
exports.processSignUp = functions.auth.user().onCreate(async (user) => {
  const { uid, email } = user;

  if (!email) {
    functions.logger.log(`User ${uid} has no email, cannot process role.`);
    return null;
  }
  
  // Explicitly ignore the super admin email to prevent accidental processing
  if (email === SUPER_ADMIN_EMAIL) {
    functions.logger.log(`Super admin user ${email} registered. No special claims needed via this function.`);
    return null;
  }

  const inviteDocRef = admin.firestore().collection("adminInvites").doc(email);

  try {
    const inviteDoc = await inviteDocRef.get();

    if (inviteDoc.exists && inviteDoc.data().role === "admin") {
      functions.logger.log(`Invite found for ${email}. Setting admin claim for user ${uid}.`);
      await admin.auth().setCustomUserClaims(uid, { admin: true });
      functions.logger.log(`Successfully set admin claim for user ${uid} (${email}).`);
      
      // Delete the invite so it can't be reused.
      await inviteDocRef.delete();
      
      return { result: `Admin claim assigned to ${email}` };
    }

    functions.logger.log(`No admin invite found for ${email}. User will be a client.`);
    return null;
    
  } catch (error) {
    functions.logger.error(`Error processing signup for ${email}:`, error);
    // We re-throw the error to ensure Firebase knows the function failed.
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
      let claims = {}; // Default to no claims (client role)
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
