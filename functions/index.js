
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

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
  
  // This function focuses on promoting pre-approved admins.
  // The superadmin role is handled on the client-side for simplicity via email check.

  const inviteDocRef = admin.firestore().collection("adminInvites").doc(email);

  try {
    const inviteDoc = await inviteDocRef.get();

    if (inviteDoc.exists) {
      functions.logger.log(`Admin invite found for ${email}. Setting 'admin' custom claim for user ${uid}.`);
      // Set the custom claim to mark the user as an admin
      await admin.auth().setCustomUserClaims(uid, { admin: true });
      functions.logger.log(`Successfully set 'admin' custom claim for user ${uid} (${email}).`);
      
      // Optional: It's safer to leave the invite for auditing purposes or delete it in a separate cleanup job.
      // Deleting it here can introduce race conditions or complexity.
      // await inviteDocRef.delete();
      
      return { result: `Admin claim assigned to ${email}` };
    }

    functions.logger.log(`No admin invite found for ${email}. User will be a standard client.`);
    return null; // No invite found, do nothing.
    
  } catch (error) {
    functions.logger.error(`Error processing signup for ${email}:`, error);
    // Re-throw the error to ensure Firebase knows the function failed and can potentially retry.
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
