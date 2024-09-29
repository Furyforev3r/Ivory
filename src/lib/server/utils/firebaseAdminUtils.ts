import { db } from "$lib/server/services/firebaseAdmin"

export async function getUserByUID(uid) {
  try {
    const userDoc = await db.collection('Users').doc(uid).get()

    if (userDoc.exists) {
      return { success: true, user: userDoc.data() }
    } else {
      return { success: false, message: 'User not found' }
    }
  } catch (error) {
    console.error('Error fetching user by UID:', error)
    return { success: false, error: 'Failed to fetch user' }
  }
}

export async function getUserByUsername(username) {
  try {
    const userSnapshot = await db.collection('Users').where('username', '==', username).get()

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data()
      return { success: true, user: userData }
    } else {
      return { success: false, message: 'User not found' }
    }
  } catch (error) {
    console.error('Error fetching user by username:', error)
    return { success: false, error: 'Failed to fetch user' }
  }
}


export async function registerUser(user) {
  try {
    const getUser = await getUserByUID(user.uid)

    if (getUser.success === false && getUser.message === 'User not found') {
      await db.collection('Users').doc(user.uid).set(user)

      return { success: true, user }
    }

    return { success: false, error: 'The user already exists.' }
  } catch (error) {
    console.error('Error registering user:', error)
    return { success: false, error: 'Failed to register user' }
  }
}
