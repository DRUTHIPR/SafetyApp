// SMS/Twilio service for sending emergency alerts
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';

const TEST_MODE = process.env.EXPO_PUBLIC_TEST_MODE === 'true';

export interface Contact {
  id?: string;
  name: string;
  phone: string;
  email: string;
  userId: string;
}

export const sendSOSAlert = async (
  userId: string,
  location: { latitude: number; longitude: number },
  message: string
): Promise<{ success: boolean; sentTo: string[]; contacts: Contact[] }> => {
  try {
    // Get user's contacts
    const contacts = await getContacts(userId);
    
    if (contacts.length === 0) {
      throw new Error('No emergency contacts found. Please add contacts first.');
    }

    const locationUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    const fullMessage = `${message}\n\nMy location: ${locationUrl}`;

    if (TEST_MODE) {
      console.log('🚨 SOS ALERT (TEST MODE)');
      console.log('Message:', fullMessage);
      console.log('Sent to:', contacts.map(c => `${c.name}: ${c.phone}`));
      
      try {
        await SecureStore.setItemAsync('lastSOSAlert', JSON.stringify({
          userId, message: fullMessage, location,
          contacts: contacts.map(c => ({ name: c.name, phone: c.phone })),
          timestamp: new Date().toISOString(), testMode: true,
        }));
      } catch (e) {
        console.log('Storage not available');
      }
      
      return { success: true, sentTo: contacts.map(c => c.phone), contacts };
    }

    // Real SMS via Twilio
    console.log('🚨 Sending REAL SMS alerts...');
    
    const twilioSid = process.env.EXPO_PUBLIC_TWILIO_SID;
    const twilioToken = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.EXPO_PUBLIC_TWILIO_PHONE_NUMBER;

    if (!twilioSid || !twilioToken || !twilioPhone) {
      throw new Error('Twilio credentials missing');
    }

    const sentResults = [];
    const failedResults = [];
    
    for (const contact of contacts) {
      try {
        // Format phone number for Twilio
        let phoneNumber = contact.phone.trim().replace(/\s+/g, '');
        if (!phoneNumber) {
          console.error(`❌ Empty phone number for ${contact.name}`);
          failedResults.push(contact.name);
          continue;
        }
        
        // Ensure proper E.164 format
        if (!phoneNumber.startsWith('+')) {
          if (phoneNumber.startsWith('91')) {
            phoneNumber = '+' + phoneNumber;
          } else if (phoneNumber.length === 10) {
            phoneNumber = '+91' + phoneNumber;
          } else {
            phoneNumber = '+' + phoneNumber;
          }
        }
        
        console.log(`📱 Attempting SMS to ${contact.name} at ${phoneNumber}`);
        
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `From=${encodeURIComponent(twilioPhone)}&To=${encodeURIComponent(phoneNumber)}&Body=${encodeURIComponent(fullMessage)}`,
        });

        const result = await response.json();
        
        if (response.ok && result.sid) {
          console.log(`✅ SMS sent to ${contact.name}: ${result.sid}`);
          sentResults.push(contact.phone);
        } else {
          console.error(`❌ Failed SMS to ${contact.name}:`, result);
          failedResults.push(`${contact.name}: ${result.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error(`❌ SMS error for ${contact.name}:`, error);
        failedResults.push(`${contact.name}: Network error`);
      }
    }

    if (sentResults.length === 0) {
      throw new Error(`Failed to send SMS to any contacts. Errors: ${failedResults.join(', ')}`);
    }

    if (failedResults.length > 0) {
      console.warn('⚠️ Some SMS failed:', failedResults);
    }

    return {
      success: true,
      sentTo: sentResults,
      contacts: contacts.filter(c => sentResults.includes(c.phone)),
      failed: failedResults,
    };
  } catch (error) {
    console.error('SMS Alert Error:', error);
    throw error;
  }
};

export const getContacts = async (userId: string): Promise<Contact[]> => {
  if (!db) {
    // Get from SecureStore for demo
    try {
      const stored = await SecureStore.getItemAsync(`contacts_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  try {
    const q = query(collection(db, 'contacts'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
  } catch (error) {
    console.error('Error getting contacts:', error);
    // Fallback to SecureStore
    try {
      const stored = await SecureStore.getItemAsync(`contacts_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }
};

export const addContact = async (contact: Omit<Contact, 'id'>): Promise<string> => {
  const newId = 'contact_' + Date.now();
  const contactWithId = { ...contact, id: newId };

  if (!db) {
    // Store in SecureStore for demo
    try {
      const existing = await SecureStore.getItemAsync(`contacts_${contact.userId}`);
      const contacts = existing ? JSON.parse(existing) : [];
      contacts.push(contactWithId);
      await SecureStore.setItemAsync(`contacts_${contact.userId}`, JSON.stringify(contacts));
      console.log('✅ Contact added to SecureStore:', contact.name);
      return newId;
    } catch (e) {
      console.log('Storage not available');
      return newId;
    }
  }

  try {
    const docRef = await addDoc(collection(db, 'contacts'), contact);
    console.log('✅ Contact added to Firestore:', contact.name);
    return docRef.id;
  } catch (error) {
    console.error('❌ Firestore error, using SecureStore:', error);
    // Fallback to SecureStore
    try {
      const existing = await SecureStore.getItemAsync(`contacts_${contact.userId}`);
      const contacts = existing ? JSON.parse(existing) : [];
      contacts.push(contactWithId);
      await SecureStore.setItemAsync(`contacts_${contact.userId}`, JSON.stringify(contacts));
      return newId;
    } catch (e) {
      return newId;
    }
  }
};

export const deleteContact = async (contactId: string, userId: string): Promise<void> => {
  if (!db) {
    // Remove from SecureStore
    try {
      const existing = await SecureStore.getItemAsync(`contacts_${userId}`);
      if (existing) {
        const contacts = JSON.parse(existing).filter((c: Contact) => c.id !== contactId);
        await SecureStore.setItemAsync(`contacts_${userId}`, JSON.stringify(contacts));
      }
    } catch (e) {
      console.log('Storage not available');
    }
    return;
  }

  try {
    const { deleteDoc, doc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'contacts', contactId));
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
};