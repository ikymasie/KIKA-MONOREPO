import * as admin from 'firebase-admin';

// Lazy initialization — only runs when first accessed, never at build time
function getAdminApp(): admin.app.App {
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    const credentialsRaw = process.env.FIREBASE_ADMIN_CREDENTIALS;
    if (!credentialsRaw) {
        throw new Error('FIREBASE_ADMIN_CREDENTIALS environment variable is not set');
    }

    const serviceAccount = JSON.parse(credentialsRaw);

    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}

export function getAdminAuth(): admin.auth.Auth {
    return getAdminApp().auth();
}

export function getAdminDb(): admin.firestore.Firestore {
    return getAdminApp().firestore();
}

export function getAdminStorage(): admin.storage.Storage {
    return getAdminApp().storage();
}

// Lazy proxy exports — these are the same API surface as before
// but initialization is deferred until first property access
export const adminAuth: admin.auth.Auth = new Proxy({} as admin.auth.Auth, {
    get(_target, prop) {
        return (getAdminAuth() as any)[prop];
    },
});

export const adminDb: admin.firestore.Firestore = new Proxy({} as admin.firestore.Firestore, {
    get(_target, prop) {
        return (getAdminDb() as any)[prop];
    },
});

export const adminStorage: admin.storage.Storage = new Proxy({} as admin.storage.Storage, {
    get(_target, prop) {
        return (getAdminStorage() as any)[prop];
    },
});

export default admin;
