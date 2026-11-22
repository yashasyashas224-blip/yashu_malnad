import { db } from '../data/database';
import { MCE_DEPARTMENTS } from '../data/mceCampusData';

export interface AssistantResponse {
  answer: string;
  matchedEntity?: {
    type: 'building' | 'room' | 'department' | 'facility';
    id: string;
    name: string;
    buildingName: string;
    floor: number;
    coordinates: [number, number];
    targetNodeId?: string;
  };
  navigationAction?: {
    available: boolean;
    toNodeId: string;
    label: string;
  };
  suggestedQuestions: string[];
}

export class AIAssistantService {
  /**
   * Process campus natural language query strictly grounded on verified MCE records
   */
  public static processQuery(query: string, currentSemester: number = 6): AssistantResponse {
    const q = query.toLowerCase().trim();

    // 1. Examination office / Controller of Examinations
    if (q.includes('exam') || q.includes('marks card') || q.includes('coe') || q.includes('controller')) {
      const room = db.rooms.get('room-exam-cell');
      const bldg = db.buildings.get('b-admin');
      return {
        answer: `The Autonomous Examination Section (ADM-105) is located on the First Floor of the Administrative Block (Main Building). Controller of Examinations and marks card verification counters operate here between 10:00 AM and 5:00 PM.`,
        matchedEntity: {
          type: 'room',
          id: room!.id,
          name: room!.name,
          buildingName: bldg!.name,
          floor: room!.floor,
          coordinates: room!.coordinates,
          targetNodeId: 'node-admin-f1-exam-cell'
        },
        navigationAction: {
          available: true,
          toNodeId: 'node-admin-f1-exam-cell',
          label: 'Navigate to Examination Section (Floor 1)'
        },
        suggestedQuestions: [
          'Where is the Principal\'s Office?',
          'Where is the Dean Academic Affairs?',
          'Take me to Central Library'
        ]
      };
    }

    // 2. Principal's Office / Director
    if (q.includes('principal') || q.includes('director') || q.includes('board room')) {
      const room = db.rooms.get('room-principal');
      const bldg = db.buildings.get('b-admin');
      return {
        answer: `The Principal's Office (ADM-001) is situated on the Ground Floor of the Administrative Block, directly adjacent to the main foyer right inside the Salagame Road entrance.`,
        matchedEntity: {
          type: 'room',
          id: room!.id,
          name: room!.name,
          buildingName: bldg!.name,
          floor: room!.floor,
          coordinates: room!.coordinates,
          targetNodeId: 'node-admin-f0-principal'
        },
        navigationAction: {
          available: true,
          toNodeId: 'node-admin-f0-principal',
          label: 'Navigate to Principal\'s Office'
        },
        suggestedQuestions: [
          'Where is the Examination Section?',
          'Where is the CSE Department?',
          'Show campus health center'
        ]
      };
    }

    // 3. AI / Machine Learning Lab or AI&ML Dept
    if (q.includes('ai') || q.includes('machine learning') || q.includes('aiml') || q.includes('deep learning')) {
      const room = db.rooms.get('room-cse-lab-ai');
      const bldg = db.buildings.get('b-cse-ise');
      return {
        answer: `The Artificial Intelligence & Machine Learning Laboratory (CS-204) is on the Second Floor (East Wing) of the Computer Science & Information Science Complex. It is headed by Dr. P. Sandhya.`,
        matchedEntity: {
          type: 'room',
          id: room!.id,
          name: room!.name,
          buildingName: bldg!.name,
          floor: room!.floor,
          coordinates: room!.coordinates,
          targetNodeId: 'node-csis-f2-ai-lab'
        },
        navigationAction: {
          available: true,
          toNodeId: 'node-csis-f2-ai-lab',
          label: 'Navigate to AI & ML Lab (Floor 2)'
        },
        suggestedQuestions: [
          'Where is the CSE HOD chamber?',
          'Where is ME-RIISE Foundation?',
          'Where is my next class?'
        ]
      };
    }

    // 4. CSE Department / HOD CSE
    if (q.includes('cse') || q.includes('computer science') || (q.includes('hod') && q.includes('cs'))) {
      const room = db.rooms.get('room-cse-hod');
      const bldg = db.buildings.get('b-cse-ise');
      const dept = MCE_DEPARTMENTS.find(d => d.id === 'dept-cse');
      return {
        answer: `The Department of Computer Science & Engineering is located in the CS-IS Complex. The HOD Chamber (CS-101) is on the First Floor, headed by ${dept?.hodName || 'Dr. B. R. Srinivas'}. Contact: ${dept?.contactEmail}.`,
        matchedEntity: {
          type: 'room',
          id: room!.id,
          name: room!.name,
          buildingName: bldg!.name,
          floor: room!.floor,
          coordinates: room!.coordinates,
          targetNodeId: 'node-csis-f1-cse-hod'
        },
        navigationAction: {
          available: true,
          toNodeId: 'node-csis-f1-cse-hod',
          label: 'Navigate to CSE Department (Floor 1)'
        },
        suggestedQuestions: [
          'Where is the AI & ML Lab?',
          'Where is ISE Department?',
          'Take me to Lecture Hall CS-301'
        ]
      };
    }

    // 5. Central Library / Books / Reading Hall
    if (q.includes('library') || q.includes('book') || q.includes('reading hall') || q.includes('ieee')) {
      const room = db.rooms.get('room-lib-reference');
      const bldg = db.buildings.get('b-library');
      return {
        answer: `The MCE Central Library & Digital Information Centre houses over 94,000+ volumes, IEEE digital access terminals, and a 300-seat reading hall. It is located just south of the Administrative quadrangle.`,
        matchedEntity: {
          type: 'building',
          id: bldg!.id,
          name: bldg!.name,
          buildingName: bldg!.name,
          floor: 0,
          coordinates: bldg!.coordinates,
          targetNodeId: 'node-library-entrance'
        },
        navigationAction: {
          available: true,
          toNodeId: 'node-library-entrance',
          label: 'Navigate to Central Library'
        },
        suggestedQuestions: [
          'Where is the Training & Placement Cell?',
          'Where is the Canteen?',
          'Take me to Main Gate'
        ]
      };
    }

    // 6. ME-RIISE Foundation / Incubation / Startup / TBI
    if (q.includes('riise') || q.includes('startup') || q.includes('incubator') || q.includes('idea lab') || q.includes('tbi')) {
      const bldg = db.buildings.get('b-meriise');
      return {
        answer: `The ME-RIISE Foundation (Technology Business Incubator & AICTE IDEA Lab) is located east of the CS-IS Complex. It provides 3D printing, prototyping equipment, and startup incubation support for MCE innovators.`,
        matchedEntity: {
          type: 'building',
          id: bldg!.id,
          name: bldg!.name,
          buildingName: bldg!.name,
          floor: 0,
          coordinates: bldg!.coordinates,
          targetNodeId: 'node-meriise-entrance'
        },
        navigationAction: {
          available: true,
          toNodeId: 'node-meriise-entrance',
          label: 'Navigate to ME-RIISE Foundation'
        },
        suggestedQuestions: [
          'Where is the CSE Department?',
          'Where are the Boys Hostels?',
          'Where is the Canteen?'
        ]
      };
    }

    // 7. Canteen / Food / Cafeteria / Coffee
    if (q.includes('canteen') || q.includes('food') || q.includes('coffee') || q.includes('breakfast') || q.includes('lunch')) {
      const bldg = db.buildings.get('b-canteen');
      return {
        answer: `The Campus Canteen is located in the central social hub between the EEE department and the CS-IS complex. It serves fresh South Indian breakfast, lunch meals, and refreshments.`,
        matchedEntity: {
          type: 'building',
          id: bldg!.id,
          name: bldg!.name,
          buildingName: bldg!.name,
          floor: 0,
          coordinates: bldg!.coordinates,
          targetNodeId: 'node-canteen-entrance'
        },
        navigationAction: {
          available: true,
          toNodeId: 'node-canteen-entrance',
          label: 'Navigate to Campus Canteen'
        },
        suggestedQuestions: [
          'Where is the Sports Ground?',
          'Where is the Health Center?',
          'Take me to CS-IS complex'
        ]
      };
    }

    // 8. Health / Medical / Doctor / First Aid
    if (q.includes('health') || q.includes('medical') || q.includes('doctor') || q.includes('clinic') || q.includes('first aid') || q.includes('emergency')) {
      const bldg = db.buildings.get('b-health');
      const room = db.rooms.get('room-health-clinic');
      return {
        answer: `The Campus Health & First Aid Centre is located right beside the Salagame Road entrance (south of the Security Post). First aid and emergency care are available on campus.`,
        matchedEntity: {
          type: 'building',
          id: bldg!.id,
          name: bldg!.name,
          buildingName: bldg!.name,
          floor: 0,
          coordinates: bldg!.coordinates,
          targetNodeId: 'room-health-clinic'
        },
        navigationAction: {
          available: true,
          toNodeId: 'room-health-clinic',
          label: 'Emergency: Navigate to Health Centre'
        },
        suggestedQuestions: [
          'Where is the Main Security Gate?',
          'Where is the Emergency Assembly Area?',
          'Where is the Principal\'s Office?'
        ]
      };
    }

    // 9. Civil Engineering / Mechanical Engineering
    if (q.includes('civil') || q.includes('ced') || q.includes('concrete')) {
      const bldg = db.buildings.get('b-civil');
      return {
        answer: `The Civil Engineering Department (CED) is located north of the Administrative block. It houses the Concrete & Highway Materials Testing Lab, Geotechnical Lab, and Surveying Centre.`,
        matchedEntity: {
          type: 'building',
          id: bldg!.id,
          name: bldg!.name,
          buildingName: bldg!.name,
          floor: 0,
          coordinates: bldg!.coordinates,
          targetNodeId: 'node-civil-entrance'
        },
        navigationAction: {
          available: true,
          toNodeId: 'node-civil-entrance',
          label: 'Navigate to Civil Engineering Block'
        },
        suggestedQuestions: [
          'Where is Mechanical Engineering?',
          'Where is Central Library?',
          'Take me to Administrative Block'
        ]
      };
    }

    // 10. Temple / Meditation / Spiritual
    if (q.includes('temple') || q.includes('ganapathi') || q.includes('meditation') || q.includes('yoga') || q.includes('dhyana')) {
      const bldg = db.buildings.get('b-temple');
      return {
        answer: `The Spiritual Enclave (Shree Ganapathi Temple and Dhyana Mandira - Divya Chaithanya) is situated in the peaceful northern garden of the MCE campus for prayer, meditation, and mental well-being.`,
        matchedEntity: {
          type: 'building',
          id: bldg!.id,
          name: bldg!.name,
          buildingName: bldg!.name,
          floor: 0,
          coordinates: bldg!.coordinates,
          targetNodeId: 'node-temple-entrance'
        },
        navigationAction: {
          available: true,
          toNodeId: 'node-temple-entrance',
          label: 'Navigate to Spiritual Enclave'
        },
        suggestedQuestions: [
          'Where are the Boys Hostels?',
          'Where is the Mechanical Workshop?',
          'Take me to Main Gate'
        ]
      };
    }

    // Default intelligent fallback grounded on MCE database
    return {
      answer: `I am your verified MCE Campus Assistant. You can ask me for any academic department (CSE, ISE, Civil, Mechanical, ECE, EEE), administrative office (Principal, Exam Cell), campus facility (Library, ME-RIISE, Canteen, Hostels), or classroom.`,
      suggestedQuestions: [
        'Where is the CSE department?',
        'Where is the Examination Section?',
        'Take me to Central Library',
        'Where is the AI and ML laboratory?',
        'Where is ME-RIISE Foundation?'
      ]
    };
  }
}
