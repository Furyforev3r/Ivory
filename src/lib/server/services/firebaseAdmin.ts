import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { FIREBASE_ADMIN_KEY } from '$env/static/private'

let adminApp

if (!adminApp) {
  if (admin.apps.length == 0) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(FIREBASE_ADMIN_KEY))
    }, 'admin-app')
  }
  else {
      adminApp = admin.apps[0]
  }
}

export const db = getFirestore(adminApp)
export const auth = adminApp.auth()
