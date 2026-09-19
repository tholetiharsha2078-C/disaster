import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const EMERGENCY_SYSTEM_PROMPT = `
You are "ResQ AI", an emergency response and public disaster guidance assistant for the "Disaster Response & React" civil protection platform.
Your tone must be:
- Calm, clear, and reassuring
- Practical and straightforward, suitable for ordinary citizens, farmers, and villagers in distress
- Fast to read: use short paragraphs, clear bullet steps, and bold action verbs
- Safety first: life safety always comes before property protection
- Emergency numbers: Remind users to call 112 / 100 (Police), 101 (Fire), 108 / 102 (Ambulance), 1077 (Disaster Control Room) if in imminent danger

Never use sci-fi jargon, robotic greetings, or decorative disclaimers.
Provide immediate actionable safety rules (e.g. for floods: move to upper floor, disconnect main electricity, never drive through flowing water; for electrical hazards: stay at least 30 feet away, do not touch wet railings).
`;

export async function generateEmergencyAdvice(
  userQuery: string,
  context?: {
    activeAlerts?: string[];
    userLocation?: string;
  }
): Promise<string> {
  const ai = getGenAI();

  if (ai) {
    try {
      const prompt = `
Context:
- User Location: ${context?.userLocation || 'Regional Sector'}
- Active Regional Alerts: ${context?.activeAlerts?.join(', ') || 'None reported'}

User Question / Emergency Situation:
"${userQuery}"

Provide direct, actionable, step-by-step guidance.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: EMERGENCY_SYSTEM_PROMPT,
          temperature: 0.2,
        },
      });

      if (response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn('Gemini emergency assistant fallback triggered:', err);
    }
  }

  // Resilient rule-based emergency fallback
  const q = userQuery.toLowerCase();
  if (q.includes('flood') || q.includes('water')) {
    return `**Emergency Flood Safety Protocol:**\n\n1. **Move to Higher Ground immediately**: Do not stay in basements or single-story low areas.\n2. **Switch Off Main Power**: If dry and safe to reach, turn off the main circuit breaker and gas cylinder valve.\n3. **Never Walk or Drive in Flood Water**: Just 6 inches of moving water can knock you down; 12 inches can carry away a car.\n4. **Boil Water Before Drinking**: Avoid tap water due to cross-contamination.\n5. **Emergency Contacts**: Dial 1077 for Disaster Management or 108 for Medical Rescue.`;
  }
  if (q.includes('fire') || q.includes('smoke')) {
    return `**Emergency Fire Safety Protocol:**\n\n1. **Evacuate Immediately**: Do not stop to collect personal valuables.\n2. **Stay Low Under Smoke**: Crawl under smoke where cleaner air remains near the floor.\n3. **Test Doors with Back of Hand**: If warm to touch, do not open; use alternate exit.\n4. **Never Use Elevators**: Always use fire escape staircases.\n5. **Call 101 immediately** once safe outside and meet at your designated open muster point.`;
  }
  if (q.includes('electric') || q.includes('wire') || q.includes('cable')) {
    return `**Electrical Hazard Protocol:**\n\n1. **Keep 30+ Feet Distance**: Assume all fallen wires are energized and deadly.\n2. **Do Not Touch Water or Fences**: Metal fences, wet ground, and puddles conduct high voltage.\n3. **Do Not Approach Stranded Vehicles**: If a wire falls on your car, remain inside unless fire starts; then jump clear without touching car and ground at same time.\n4. **Report to Authority**: Call Electricity Board Emergency or 112 immediately.`;
  }
  if (q.includes('report') || q.includes('how to report')) {
    return `**How to Report an Incident on this Portal:**\n\n1. Click the red **REPORT INCIDENT** button.\n2. Select the incident type (Flood, Fire, Road Blockage, etc.).\n3. Click "Use My Current Location" or enter the landmark.\n4. Add a short description and attach a photo if safe to take.\n5. Submit. Your report starts as **UNVERIFIED** until confirmed by nearby community verifiers and civil protection officers.`;
  }

  return `**Emergency Preparedness Guidelines:**\n\n- **Stay Alert**: Regularly check the **Live Map** and **My Alerts** tab for updates within 15 km.\n- **Emergency Kit**: Keep torch lights, potable water, essential medicines, dry rations, and ID documents in a waterproof pouch.\n- **Listen to Authorities**: Follow instructions from civil defence personnel and evacuation sirens.\n- **Urgent Danger**: Call **112** for all emergency services.`;
}
