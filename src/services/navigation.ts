// Safe route navigation service
export interface SafeRoute {
  distance: string;
  duration: string;
  steps: RouteStep[];
  safetyScore: number;
  warnings: string[];
}

export interface RouteStep {
  instruction: string;
  distance: string;
  safetyLevel: 'high' | 'medium' | 'low';
}

export const findSafeRoute = async (
  from: { lat: number; lng: number },
  to: string
): Promise<SafeRoute> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock safe route calculation
  const mockSteps: RouteStep[] = [
    {
      instruction: "Head north on Main Street (Well-lit area)",
      distance: "0.3 km",
      safetyLevel: 'high'
    },
    {
      instruction: "Turn right onto Park Avenue (Police station nearby)",
      distance: "0.5 km", 
      safetyLevel: 'high'
    },
    {
      instruction: "Continue straight through Shopping District (High foot traffic)",
      distance: "0.8 km",
      safetyLevel: 'high'
    },
    {
      instruction: "Turn left onto Residential Road (Moderate lighting)",
      distance: "0.4 km",
      safetyLevel: 'medium'
    },
    {
      instruction: "Arrive at destination",
      distance: "0.0 km",
      safetyLevel: 'high'
    }
  ];

  return {
    distance: "2.0 km",
    duration: "24 minutes walking",
    steps: mockSteps,
    safetyScore: 85,
    warnings: [
      "Avoid Park Road (poorly lit after 8 PM)",
      "Construction area on 5th Street - use alternate route"
    ]
  };
};

export const getNearbyEmergencyServices = async (
  location: { lat: number; lng: number }
): Promise<Array<{ name: string; distance: string; type: string }>> => {
  // Mock emergency services data
  return [
    {
      name: "City Police Station",
      distance: "0.8 km",
      type: "police"
    },
    {
      name: "General Hospital",
      distance: "1.2 km", 
      type: "hospital"
    },
    {
      name: "Fire Station #3",
      distance: "1.5 km",
      type: "fire"
    },
    {
      name: "Metro Station - Safe Zone",
      distance: "0.3 km",
      type: "transport"
    }
  ];
};