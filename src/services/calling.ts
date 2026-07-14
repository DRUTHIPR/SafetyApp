// Calling service for video/voice calls
export interface CallState {
  isActive: boolean;
  type: 'voice' | 'video';
  contact?: string;
  duration: number;
}

export const makeVoiceCall = async (phoneNumber: string): Promise<CallState> => {
  try {
    console.log(`📞 Initiating voice call to ${phoneNumber}`);
    
    // Import Linking from React Native
    const { Linking } = require('react-native');
    
    // Use React Native Linking for mobile
    const supported = await Linking.canOpenURL(`tel:${phoneNumber}`);
    if (supported) {
      await Linking.openURL(`tel:${phoneNumber}`);
    } else {
      // Fallback for web
      if (typeof window !== 'undefined') {
        window.open(`tel:${phoneNumber}`, '_self');
      }
    }
    
    return {
      isActive: true,
      type: 'voice',
      contact: phoneNumber,
      duration: 0
    };
  } catch (error) {
    console.error('Voice call error:', error);
    return {
      isActive: false,
      type: 'voice',
      contact: phoneNumber,
      duration: 0
    };
  }
};

export const makeVideoCall = async (phoneNumber: string): Promise<CallState> => {
  try {
    console.log(`📹 Initiating video call to ${phoneNumber}`);
    
    const { Linking } = require('react-native');
    
    // Clean phone number for WhatsApp
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    const whatsappUrl = `whatsapp://send?phone=${cleanNumber}&text=EMERGENCY%20VIDEO%20CALL%20NEEDED`;
    
    // Try WhatsApp first
    const whatsappSupported = await Linking.canOpenURL(whatsappUrl);
    if (whatsappSupported) {
      await Linking.openURL(whatsappUrl);
    } else {
      // Fallback to regular call
      await makeVoiceCall(phoneNumber);
    }
    
    return {
      isActive: true,
      type: 'video',
      contact: phoneNumber,
      duration: 0
    };
  } catch (error) {
    console.error('Video call error:', error);
    // Fallback to voice call
    return await makeVoiceCall(phoneNumber);
  }
};

export const endCall = async (): Promise<void> => {
  console.log('📞 Call ended');
  // In a real app, this would end the active call
};

// Emergency call - calls all contacts
export const makeEmergencyCall = async (contacts: string[]): Promise<void> => {
  console.log('🚨 Making emergency calls to all contacts');
  
  for (const contact of contacts) {
    try {
      await makeVoiceCall(contact);
      // Small delay between calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to call ${contact}:`, error);
    }
  }
};