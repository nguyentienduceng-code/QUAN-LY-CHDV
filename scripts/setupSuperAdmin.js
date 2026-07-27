/**
 * Firebase Admin Setup for Custom Claims
 * Run this script ONCE via Node.js to set custom claims for super admin
 *
 * IMPORTANT: This requires Firebase Admin SDK and must be run in a secure environment
 * (Cloud Functions, your local machine with admin credentials, NOT in the browser)
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You need to download service account key from Firebase Console:
// Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/**
 * Set super admin custom claim for a user
 * @param {string} email - The email of the user to make super admin
 */
async function setSuperAdminClaim(email) {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);

    // Set custom claim
    await admin.auth().setCustomUserClaims(user.uid, {
      isSuperAdmin: true
    });

    console.log(`✅ Successfully set super admin claim for ${email}`);
    console.log(`   User UID: ${user.uid}`);
    console.log(`   The user must sign out and sign in again for the claim to take effect.`);

    // Verify the claim was set
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log(`   Custom claims:`, updatedUser.customClaims);

  } catch (error) {
    console.error('❌ Error setting super admin claim:', error.message);
    throw error;
  }
}

/**
 * Remove super admin custom claim from a user
 * @param {string} email - The email of the user to remove super admin from
 */
async function removeSuperAdminClaim(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);

    // Remove the claim by setting it to null
    await admin.auth().setCustomUserClaims(user.uid, {
      isSuperAdmin: null
    });

    console.log(`✅ Successfully removed super admin claim from ${email}`);

  } catch (error) {
    console.error('❌ Error removing super admin claim:', error.message);
    throw error;
  }
}

/**
 * Check if a user has super admin claim
 * @param {string} email - The email to check
 */
async function checkSuperAdminClaim(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    const isSuperAdmin = user.customClaims?.isSuperAdmin === true;

    console.log(`User: ${email}`);
    console.log(`UID: ${user.uid}`);
    console.log(`Is Super Admin: ${isSuperAdmin}`);
    console.log(`Custom Claims:`, user.customClaims);

    return isSuperAdmin;
  } catch (error) {
    console.error('❌ Error checking claim:', error.message);
    throw error;
  }
}

// Main execution
const SUPER_ADMIN_EMAIL = 'nguyentienducbmt123@gmail.com';

async function main() {
  console.log('🔧 Firebase Custom Claims Setup\n');

  const action = process.argv[2];
  const email = process.argv[3] || SUPER_ADMIN_EMAIL;

  switch (action) {
    case 'set':
      await setSuperAdminClaim(email);
      break;

    case 'remove':
      await removeSuperAdminClaim(email);
      break;

    case 'check':
      await checkSuperAdminClaim(email);
      break;

    default:
      console.log('Usage:');
      console.log('  node setupSuperAdmin.js set [email]     - Set super admin claim');
      console.log('  node setupSuperAdmin.js remove [email]  - Remove super admin claim');
      console.log('  node setupSuperAdmin.js check [email]   - Check if user has claim');
      console.log('');
      console.log(`Default email: ${SUPER_ADMIN_EMAIL}`);
      process.exit(1);
  }

  process.exit(0);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  setSuperAdminClaim,
  removeSuperAdminClaim,
  checkSuperAdminClaim
};
