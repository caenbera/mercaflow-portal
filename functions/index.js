
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Admin SDK
admin.initializeApp();

/**
 * Cloud Function to assign the 'superadmin' role to a specific user.
 * This is a callable function, meaning it's invoked directly from the client.
 *
 * Security:
 * 1. Only authenticated users can call this function.
 * 2. Only the user with the email 'superadmin@thefreshhub.com' can assign themselves the role.
 */
exports.setupSuperAdmin = functions.https.onCall(async (data, context) => {
  // 1. Check if the user calling the function is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called by an authenticated user."
    );
  }

  const callerEmail = context.auth.token.email;
  const callerUid = context.auth.uid;

  // 2. Define the superadmin email.
  const superAdminEmail = "superadmin@thefreshhub.com";

  // 3. Verify that the user calling the function is the intended superadmin.
  // This prevents any user from assigning the role to themselves.
  if (callerEmail !== superAdminEmail) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You do not have permission to perform this action."
    );
  }

  try {
    // 4. Assign the Custom Claims to the user.
    // This is what defines their role across the application.
    await admin.auth().setCustomUserClaims(callerUid, { superadmin: true });

    // 5. Return a success message.
    return {
      success: true,
      message: `Success! The Super Admin role has been assigned to ${callerEmail}.`,
    };
  } catch (error) {
    console.error("Error setting superadmin claims:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An internal error occurred while trying to assign the role."
    );
  }
});
