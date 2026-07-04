import admin from 'firebase-admin'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { FIREBASE_ADMIN_KEY, VITE_STORAGE_BUCKET } from '$env/static/private'

let adminApp

const credentials = JSON.parse(FIREBASE_ADMIN_KEY)

// Use the same bucket the client SDK is configured with instead of guessing
// the naming convention (newer Firebase projects use
// <project-id>.firebasestorage.app instead of the older <project-id>.appspot.com).
const storageBucket = VITE_STORAGE_BUCKET || `${credentials.project_id}.appspot.com`

if (!adminApp) {
  if (admin.apps.length == 0) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(credentials),
      storageBucket
    }, 'admin-app')
  }
  else {
      adminApp = admin.apps[0]
  }
}

export const fieldValue = FieldValue
export const db = getFirestore(adminApp)
export const auth = adminApp.auth()
export const bucket = getStorage(adminApp).bucket()
