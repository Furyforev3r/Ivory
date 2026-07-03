import admin from 'firebase-admin'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { FIREBASE_ADMIN_KEY } from '$env/static/private'

let adminApp

const credentials = JSON.parse(FIREBASE_ADMIN_KEY)

if (!adminApp) {
  if (admin.apps.length == 0) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(credentials),
      storageBucket: `${credentials.project_id}.appspot.com`
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
