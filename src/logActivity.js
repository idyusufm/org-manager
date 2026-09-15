import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export async function logActivity(user, action, description) {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      action,
      description,
      by: user?.displayName || user?.email || 'unknown',
      email: user?.email || 'unknown',
      createdAt: serverTimestamp(),
    })
  } catch (e) {
    // Logging must never block the actual action succeeding.
  }
}
