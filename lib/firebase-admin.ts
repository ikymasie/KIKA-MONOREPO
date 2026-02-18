import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(
        process.env.FIREBASE_ADMIN_CREDENTIALS || '{}'
    );

    const account = {
        "type": "service_account",
        "project_id": "kika-bw",
        "private_key_id": "b77edf10fe2507f0657c1da03d10162edb72baa1",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDXHHLKM0eMTnBn\nkeTymzGgF8vO/e8HpnBt4pDplV3d3GV+fYv2elEoEnOiq9cvz8aHG+0he3f9aSpl\nlwXLQrogvt1ePvRCn0KCSh6Dn0ujsDUg1IUURYTZBDghQ4V4jlpsNmwfQYFIF+27\nFpWTEb2pfpEf8T+4ZyJWZ4Ndg1xx2sNBLfCHs2MeNTVEzKVURR8A+qhQgKUflwD8\np60qFt1bJtNe5taBFE6MJc5NBmzU7Po4TFMO8hHhTFA/m4g2kK3NShstcu4iAJMz\nTeenFVoiaeauGQMSCgjbx9Q3CgIgs0tRq/1nskoVN9q/FczqUNPFJdhRwlad+zG3\ns+aSs7tBAgMBAAECggEAAnEayrmtqw2gJCXVYm1hcSS6AhrS8/xXQAETleo1lUFV\nZ9vdGw55Bb5dYIwosnzOXy3hiYjzNA3Fvt7ZsIysrBbckI+AgnHYPX5BxcrY7wYO\n2VU+QDxYiWXdTP/dJ9DeXQZ6YFm0Ee1fHAnB54gq1e3nT/RzLajCjJZq2OS3B74P\nkvVlsp9Ge7vCJM+IBRrZuNhJg//hF/ws20ilE7Bfflbw/9nVTTQZIvwjWf3040yP\nmgVNLJMOLl01g36W3Vx36X+dUWoj/EUemxiEPZUlfCsxlxI8NPDP9Neuu8vaQPxZ\nQY1msveAgD+iYZy/NVgpxiqdiZflOijV3X1O70ueUQKBgQD/YLmG9YkUOZg/IKbJ\nc1E5d0jl0S9FUJ7iwn+AWE8GJTWjcu89wghccgnexqMi9iGRAMzkoSKhi8T5ifbg\nRSoWlUQnVsSimPL35dixpPodBhGy/r46q+KVR2KiAO5vlJdTKh6Gn74PHW4qF5RN\nAGNqccgG146ChkLtl+9Pa4/W8QKBgQDXopwlmgDOV3FdnCmHyCKP78OoohEOpN+G\nfJIU1OUXmDWXqGf71rexSzOV1pbydpEeIO1UnrmFZVTLvwGjE+8nPgk94Lep4Aj7\neR5K0Ic5eZ/L19kmPSejL7Ggw/uCbfbDxotKkJGAgB5MMghTTEfqeGsaozJc/Q0E\ndWSQwEZJUQKBgDdBUmMlFTfPDmX6Rpwn21c3vAodrMCupPIjazr14INP4b8vyxvt\ns6ls8z3EdN/HqZOaPLrrMncJquDjPQtha63fNhPc7kbQGSISFUS6kXNeMM4t2DMR\npcDu5SRwVybFW8iewGQYhCL5FzD8URYoE1qgq8rvMOKE8k4+JYVlnIXBAoGASjWB\n+0bGpDxfnVGS0VHE4zgmY7ByolGHQ2c3dsfVl4sgVnL0Ziz8xp0Uwao6BHNdebrn\nMkn1mrzGs9+mFpNTqHOnBo6BZordTH3gOOsOvm7m2WYNKyW8sGJHhQYtVjO1yqZX\nZW/fQxPUWXCWgOQtk7mhUmd7e5jyk+g6lb418iECgYBNJLaJv8tJwSixo98XNu5E\nkNOs0iyB8/moo+KdLoL8JFZngt40Xyt7OeWvhxRvjtCa5Flxdf7VOYwBQ0zPS3aP\nSPojzxDMi1i5i5eo4ox5i8aAfWISwFLSTmhW5MkvhRbURqQSBtjzMpLSf2LJlRvG\nJ9f8UPofDw/9qEXLgn6Hgw==\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-fbsvc@kika-bw.iam.gserviceaccount.com",
        "client_id": "113319993222893006881",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40kika-bw.iam.gserviceaccount.com",
        "universe_domain": "googleapis.com"
    }

    admin.initializeApp({
        credential: admin.credential.cert(account as admin.ServiceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

export default admin;
