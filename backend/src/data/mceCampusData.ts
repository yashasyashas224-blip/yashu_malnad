import { CampusBuilding, DepartmentInfo, RoomLocation, NavigationNode, NavigationEdge, QRCheckpoint } from '../models/types';

// Official MCE Campus Center & Coordinates
export const MCE_CAMPUS_META = {
  institution: 'Malnad College of Engineering (MCE)',
  address: 'No. 21, Salagame Road, Rangoli Halla, Hassan, Karnataka 573202, India',
  areaAcres: 41.28,
  officialWebsite: 'https://www.mcehassan.ac.in/',
  center: [76.10354, 13.02365] as [number, number], // [lng, lat]
  osmWayId: '288781302',
  osmNodeId: '2373974941',
  bounds: {
    minLng: 76.1008,
    minLat: 13.0210,
    maxLng: 76.1068,
    maxLat: 13.0268
  }
};

// OpenStreetMap Way 288781302 Campus Boundary Polygon
export const MCE_CAMPUS_BOUNDARY: [number, number][] = [
  [76.10180, 13.02420], // NW corner along Salagame Rd
  [76.10260, 13.02590], // N boundary
  [76.10420, 13.02640], // NE corner near Dhyana Mandira
  [76.10580, 13.02580], // E boundary near Hostels
  [76.10620, 13.02380], // SE boundary near Sports grounds
  [76.10540, 13.02180], // S boundary near Second Gate
  [76.10320, 13.02150], // SW boundary
  [76.10185, 13.02380], // Salagame Road Main Gate
  [76.10180, 13.02420]  // Closing loop
];

// Verified Campus Buildings
export const MCE_BUILDINGS: CampusBuilding[] = [
  {
    id: 'b-admin',
    name: 'Administrative Block (Main Building)',
    shortCode: 'ADMIN',
    category: 'administrative',
    description: 'Houses the Principal\'s Office, Administrative Desks, Examination Section, Accounts, and Academic Dean offices.',
    coordinates: [76.10245, 13.02365],
    floorsCount: 3,
    accessibility: {
      wheelchairRamp: true,
      elevators: true,
      tactilePaving: true,
      accessibleWashrooms: true
    },
    verificationStatus: 'verified',
    verificationNotes: 'Verified from MCE institutional records and front Salagame Road orientation.'
  },
  {
    id: 'b-cse-ise',
    name: 'Computer Science & Information Science Complex',
    shortCode: 'CS-IS',
    category: 'academic',
    description: 'Departments of Computer Science & Engineering, Information Science & Engineering, and CSE (AI & ML). Features high-performance computing labs, server rooms, and faculty chambers.',
    coordinates: [76.10390, 13.02395],
    floorsCount: 4,
    accessibility: {
      wheelchairRamp: true,
      elevators: true,
      tactilePaving: false,
      accessibleWashrooms: true
    },
    verificationStatus: 'verified',
    verificationNotes: 'Verified building complex in the central academic zone.'
  },
  {
    id: 'b-civil',
    name: 'Civil Engineering Department (CED)',
    shortCode: 'CIVIL',
    category: 'academic',
    description: 'One of the foundation departments of MCE (est. 1960). Houses Basic Material Testing Lab, Geotechnical Lab, Environmental Lab, Concrete & Highway Materials Testing Labs.',
    coordinates: [76.10285, 13.02435],
    floorsCount: 2,
    accessibility: {
      wheelchairRamp: true,
      elevators: false,
      tactilePaving: false,
      accessibleWashrooms: true
    },
    verificationStatus: 'verified',
    verificationNotes: 'Verified historical heritage engineering block.'
  },
  {
    id: 'b-mech',
    name: 'Mechanical Engineering Complex & Workshops',
    shortCode: 'MECH',
    category: 'academic',
    description: 'Contains thermal engineering labs, fluid mechanics bays, foundry, machine shop, and advanced manufacturing suites.',
    coordinates: [76.10340, 13.02485],
    floorsCount: 2,
    accessibility: {
      wheelchairRamp: true,
      elevators: false,
      tactilePaving: false,
      accessibleWashrooms: true
    },
    verificationStatus: 'verified',
    verificationNotes: 'Verified workshop bays north of the civil quadrangle.'
  },
  {
    id: 'b-ece',
    name: 'Electronics & Communication Engineering Block',
    shortCode: 'ECE',
    category: 'academic',
    description: 'Specialized laboratories for VLSI design, DSP, Embedded Systems, Communication systems, and Microcontrollers.',
    coordinates: [76.10315, 13.02290],
    floorsCount: 3,
    accessibility: {
      wheelchairRamp: true,
      elevators: true,
      tactilePaving: false,
      accessibleWashrooms: true
    },
    verificationStatus: 'verified',
    verificationNotes: 'Verified southern academic quadrangle.'
  },
  {
    id: 'b-eee',
    name: 'Electrical & Electronics & Instrumentation Block',
    shortCode: 'EEE',
    category: 'academic',
    description: 'Houses Power Systems, High Voltage, Electrical Machines, and Process Instrumentation labs.',
    coordinates: [76.10345, 13.02330],
    floorsCount: 3,
    accessibility: {
      wheelchairRamp: true,
      elevators: false,
      tactilePaving: false,
      accessibleWashrooms: true
    },
    verificationStatus: 'verified',
    verificationNotes: 'Verified block adjacent to ECE.'
  },
  {
    id: 'b-library',
    name: 'MCE Central Library & Digital Information Centre',
    shortCode: 'LIB',
    category: 'amenity',
    description: 'Over 94,000+ volumes, IEEE digital access terminal, study cubicles, VTU consortium hub, and 300+ seat reading hall.',
    coordinates: [76.10260, 13.02325],
    floorsCount: 2,
    accessibility: {
      wheelchairRamp: true,
      elevators: false,
      tactilePaving: true,
      accessibleWashrooms: true
    },
    verificationStatus: 'verified',
    verificationNotes: 'Verified central library facility.'
  },
  {
    id: 'b-placement',
    name: 'Training & Placement Centre & MCE Auditorium',
    shortCode: 'T&P',
    category: 'amenity',
    description: 'Auditorium for college symposiums, placement interview rooms, group discussion halls, and pre-placement briefing theater.',
    coordinates: [76.10255, 13.02245],
    floorsCount: 2,
    accessibility: {
      wheelchairRamp: true,
      elevators: false,
      tactilePaving: false,
      accessibleWashrooms: true
    },
    verificationStatus: 'verified',
    verificationNotes: 'Verified placement facility.'
  },
  {
    id: 'b-meriise',
    name: 'ME-RIISE Foundation & AICTE IDEA-Lab',
    shortCode: 'ME-RIISE',
    category: 'academic',
    description: 'Technology Business Incubator (TBI), startup prototyping labs, 3D printers, laser cutters, and entrepreneurship cells.',
    coordinates: [76.10445, 13.02425],
    floorsCount: 2,
    accessibility: {
      wheelchairRamp: true,
      elevators: false,
      tactilePaving: false,
      accessibleWashrooms: true
    },
    verificationStatus: 'verified',
    verificationNotes: 'Verified innovation center.'
  },
  {
    id: 'b-hostels',
    name: 'Boys Hostels Complex (Hoysala, Hemavathi & Hasanamba)',
    shortCode: 'HOSTEL-B',
    category: 'hostel',
    description: 'On-campus residential quarters for male students with dining hall, study lounges, and solar hot water facilities.',
    coordinates: [76.10515, 13.02510],
    floorsCount: 4,
    accessibility: {
      wheelchairRamp: true,
      elevators: false,
      tactilePaving: false,
      accessibleWashrooms: true
    },
    verificationStatus: 'verified',
    verificationNotes: 'Verified on-campus residential zone.'
  },
  {
    id: 'b-canteen',
    name: 'Campus Canteen & Student Dining Hub',
    shortCode: 'CANTEEN',
    category: 'amenity',
    description: 'Subsidized fresh meals, breakfast, coffee bar, and social seating area for students and faculty.',
    coordinates: [76.10375, 13.02360],
    floorsCount: 1,
    accessibility: {
      wheelchairRamp: true,
      elevators: false,
      tactilePaving: false,
      accessibleWashrooms: true
    },
    verificationStatus: 'verified',
    verificationNotes: 'Verified canteen location.'
  },
  {
    id: 'b-sports',
    name: 'MCE Sports Complex & Athletic Grounds',
    shortCode: 'SPORTS',
    category: 'sports',
    description: 'Full-size cricket/football field, indoor badminton/table tennis stadium, gymnasium, and basketball courts.',
    coordinates: [76.10530, 13.02230],
    floorsCount: 1,
    accessibility: {
      wheelchairRamp: true,
      elevators: false,
      tactilePaving: false,
      accessibleWashrooms: true
    },
    verificationStatus: 'verified',
    verificationNotes: 'Verified athletic grounds.'
  },
  {
    id: 'b-temple',
    name: 'Spiritual Enclave (Shree Ganapathi Temple & Dhyana Mandira)',
    shortCode: 'TEMPLE',
    category: 'spiritual',
    description: 'Divya Chaithanya center for yoga, meditation, peace, and spiritual well-being located in the calm northern garden.',
    coordinates: [76.10410, 13.02595],
    floorsCount: 1,
    accessibility: {
      wheelchairRamp: true,
      elevators: false,
      tactilePaving: false,
      accessibleWashrooms: false
    },
    verificationStatus: 'verified',
    verificationNotes: 'Verified landmark temple and meditation hall.'
  },
  {
    id: 'b-security',
    name: 'Main Security Gate & Visitor Post',
    shortCode: 'GATE-1',
    category: 'administrative',
    description: 'Primary campus entrance on Salagame Road with 24/7 security watch, vehicular barrier, and identity verification.',
    coordinates: [76.10185, 13.02380],
    floorsCount: 1,
    accessibility: {
      wheelchairRamp: true,
      elevators: false,
      tactilePaving: true,
      accessibleWashrooms: true
    },
    verificationStatus: 'verified',
    verificationNotes: 'Verified main entrance on Salagame Road.'
  },
  {
    id: 'b-health',
    name: 'Campus Health & First Aid Centre',
    shortCode: 'HEALTH',
    category: 'amenity',
    description: 'Emergency primary care, on-call physician, nursing staff, basic triage, and emergency stretcher transfer station.',
    coordinates: [76.10220, 13.02335],
    floorsCount: 1,
    accessibility: {
      wheelchairRamp: true,
      elevators: false,
      tactilePaving: true,
      accessibleWashrooms: true
    },
    verificationStatus: 'verified',
    verificationNotes: 'Verified health post near main gate.'
  }
];

// Verified MCE Academic Departments
export const MCE_DEPARTMENTS: DepartmentInfo[] = [
  {
    id: 'dept-cse',
    name: 'Computer Science & Engineering',
    shortCode: 'CSE',
    buildingId: 'b-cse-ise',
    floor: 1,
    hodName: 'Dr. B. R. Srinivas',
    contactEmail: 'hod_cse@mcehassan.ac.in',
    programmes: ['B.E. Computer Science & Engineering', 'M.Tech Computer Science', 'Ph.D. VTU Research Center'],
    laboratories: ['Algorithms Lab', 'Data Structures Lab', 'Cloud Computing Lab', 'Network Systems Lab']
  },
  {
    id: 'dept-ise',
    name: 'Information Science & Engineering',
    shortCode: 'ISE',
    buildingId: 'b-cse-ise',
    floor: 2,
    hodName: 'Dr. C. V. Srikrishna',
    contactEmail: 'hod_ise@mcehassan.ac.in',
    programmes: ['B.E. Information Science & Engineering'],
    laboratories: ['Web Technology Lab', 'Database Management Lab', 'Software Engineering Lab']
  },
  {
    id: 'dept-aiml',
    name: 'Computer Science & Engineering (Artificial Intelligence and Machine Learning)',
    shortCode: 'AIML',
    buildingId: 'b-cse-ise',
    floor: 3,
    hodName: 'Dr. P. Sandhya',
    contactEmail: 'hod_aiml@mcehassan.ac.in',
    programmes: ['B.E. CSE (AI & ML)'],
    laboratories: ['Deep Learning Studio', 'Computer Vision Lab', 'Natural Language Processing Lab']
  },
  {
    id: 'dept-civil',
    name: 'Civil Engineering',
    shortCode: 'CIVIL',
    buildingId: 'b-civil',
    floor: 0,
    hodName: 'Dr. H. S. Narashimhan',
    contactEmail: 'hod_civil@mcehassan.ac.in',
    programmes: ['B.E. Civil Engineering', 'M.Tech Structural Engineering', 'M.Tech CAD Structures'],
    laboratories: ['Geotechnical Engineering Lab', 'Concrete & Highway Materials Lab', 'Environmental Engineering Lab', 'Surveying Lab']
  },
  {
    id: 'dept-mech',
    name: 'Mechanical Engineering',
    shortCode: 'MECH',
    buildingId: 'b-mech',
    floor: 0,
    hodName: 'Dr. Y. M. Shashidhara',
    contactEmail: 'hod_mech@mcehassan.ac.in',
    programmes: ['B.E. Mechanical Engineering', 'M.Tech Manufacturing Science'],
    laboratories: ['Foundry & Forging Lab', 'Thermal Engineering Lab', 'Design & Simulation Lab', 'Machine Shop']
  },
  {
    id: 'dept-ece',
    name: 'Electronics & Communication Engineering',
    shortCode: 'ECE',
    buildingId: 'b-ece',
    floor: 1,
    hodName: 'Dr. B. R. Sujatha',
    contactEmail: 'hod_ece@mcehassan.ac.in',
    programmes: ['B.E. Electronics & Communication Engineering', 'M.Tech Digital Electronics'],
    laboratories: ['Advanced Communication Lab', 'VLSI & Embedded Systems Lab', 'Analog Electronics Lab']
  },
  {
    id: 'dept-eee',
    name: 'Electrical & Electronics Engineering',
    shortCode: 'EEE',
    buildingId: 'b-eee',
    floor: 1,
    hodName: 'Dr. M. S. Srinath',
    contactEmail: 'hod_eee@mcehassan.ac.in',
    programmes: ['B.E. Electrical & Electronics Engineering'],
    laboratories: ['High Voltage Engineering Lab', 'Power Electronics Lab', 'Electric Machines Lab']
  }
];

// Room & Facility Directory with verification status
export const MCE_ROOMS: RoomLocation[] = [
  // Admin Block
  {
    id: 'room-principal',
    buildingId: 'b-admin',
    floor: 0,
    roomNumber: 'ADM-001',
    name: 'Principal\'s Office & Board Room',
    aliases: ['Principal Chamber', 'Director Office', 'Board Room'],
    category: 'office',
    coordinates: [76.10240, 13.02360],
    indoorCoordinates: { x: 12, y: 15, corridor: 'Main Foyer Left' },
    isAccessible: true,
    qrCheckpointId: 'qr-admin-gf',
    verificationStatus: 'verified'
  },
  {
    id: 'room-exam-cell',
    buildingId: 'b-admin',
    floor: 1,
    roomNumber: 'ADM-105',
    name: 'Examination Section (Autonomous Exam Cell)',
    aliases: ['COE Office', 'Controller of Examinations', 'Marks Card Section'],
    category: 'office',
    coordinates: [76.10245, 13.02365],
    indoorCoordinates: { x: 25, y: 30, corridor: '1st Floor North Wing' },
    isAccessible: true,
    qrCheckpointId: 'qr-admin-1f',
    verificationStatus: 'verified'
  },
  {
    id: 'room-academic-dean',
    buildingId: 'b-admin',
    floor: 1,
    roomNumber: 'ADM-102',
    name: 'Dean Academic Affairs & Student Welfare',
    aliases: ['Dean Academics', 'Scholarship Counter'],
    category: 'office',
    coordinates: [76.10250, 13.02370],
    indoorCoordinates: { x: 18, y: 30, corridor: '1st Floor South Wing' },
    isAccessible: true,
    verificationStatus: 'verified'
  },

  // CS-IS Complex
  {
    id: 'room-cse-hod',
    buildingId: 'b-cse-ise',
    floor: 1,
    roomNumber: 'CS-101',
    name: 'Department Office & HOD Chamber - CSE',
    aliases: ['CSE Department', 'CSE HOD Office', 'CS Staff Room'],
    category: 'office',
    coordinates: [76.10385, 13.02390],
    indoorCoordinates: { x: 10, y: 20, corridor: 'First Floor Central Corridor' },
    isAccessible: true,
    qrCheckpointId: 'qr-csis-1f',
    verificationStatus: 'verified'
  },
  {
    id: 'room-cse-lab-ai',
    buildingId: 'b-cse-ise',
    floor: 2,
    roomNumber: 'CS-204',
    name: 'Artificial Intelligence & Machine Learning Lab',
    aliases: ['AI Lab', 'ML Lab', 'Deep Learning Center'],
    category: 'laboratory',
    coordinates: [76.10395, 13.02400],
    indoorCoordinates: { x: 35, y: 40, corridor: 'Second Floor East Wing' },
    isAccessible: true,
    qrCheckpointId: 'qr-csis-2f',
    verificationStatus: 'verified'
  },
  {
    id: 'room-cse-cr-301',
    buildingId: 'b-cse-ise',
    floor: 3,
    roomNumber: 'CS-301',
    name: 'Lecture Hall CS-301 (Final Year CSE)',
    aliases: ['Room 301', 'CS Class 301'],
    category: 'classroom',
    coordinates: [76.10390, 13.02395],
    indoorCoordinates: { x: 20, y: 50, corridor: 'Third Floor West Wing' },
    isAccessible: true,
    qrCheckpointId: 'qr-csis-3f',
    verificationStatus: 'verified'
  },
  {
    id: 'room-ise-hod',
    buildingId: 'b-cse-ise',
    floor: 2,
    roomNumber: 'IS-201',
    name: 'Department Office & HOD Chamber - ISE',
    aliases: ['ISE Department', 'ISE HOD Office', 'Info Science Office'],
    category: 'office',
    coordinates: [76.10380, 13.02385],
    indoorCoordinates: { x: 12, y: 40, corridor: 'Second Floor West Wing' },
    isAccessible: true,
    verificationStatus: 'verified'
  },

  // Civil Department
  {
    id: 'room-civil-concrete-lab',
    buildingId: 'b-civil',
    floor: 0,
    roomNumber: 'CV-004',
    name: 'Concrete & Highway Materials Testing Lab',
    aliases: ['Concrete Lab', 'Highway Materials Lab', 'Civil Testing Lab'],
    category: 'laboratory',
    coordinates: [76.10280, 13.02440],
    indoorCoordinates: { x: 15, y: 10, corridor: 'Ground Floor Heavy Lab Bay' },
    isAccessible: true,
    qrCheckpointId: 'qr-civil-gf',
    verificationStatus: 'verified'
  },
  {
    id: 'room-civil-survey-store',
    buildingId: 'b-civil',
    floor: 0,
    roomNumber: 'CV-002',
    name: 'Surveying Instrument & Total Station Room',
    aliases: ['Survey Lab', 'Survey Store'],
    category: 'laboratory',
    coordinates: [76.10290, 13.02430],
    indoorCoordinates: { x: 25, y: 10, corridor: 'Ground Floor Corridor' },
    isAccessible: true,
    verificationStatus: 'verified'
  },

  // Mechanical
  {
    id: 'room-mech-workshop',
    buildingId: 'b-mech',
    floor: 0,
    roomNumber: 'ME-001',
    name: 'Central Machine Shop & CNC Bay',
    aliases: ['Workshop', 'Machine Shop', 'CNC Lab', 'Mechanical Workshop'],
    category: 'laboratory',
    coordinates: [76.10335, 13.02480],
    indoorCoordinates: { x: 50, y: 50, corridor: 'Main Workshop Floor' },
    isAccessible: true,
    qrCheckpointId: 'qr-mech-gf',
    verificationStatus: 'verified'
  },

  // ECE
  {
    id: 'room-ece-vlsi-lab',
    buildingId: 'b-ece',
    floor: 1,
    roomNumber: 'EC-103',
    name: 'VLSI Design & Embedded Systems Laboratory',
    aliases: ['VLSI Lab', 'Microprocessor Lab', 'Embedded Lab'],
    category: 'laboratory',
    coordinates: [76.10310, 13.02295],
    indoorCoordinates: { x: 20, y: 25, corridor: 'First Floor North Bay' },
    isAccessible: true,
    qrCheckpointId: 'qr-ece-1f',
    verificationStatus: 'verified'
  },

  // Library
  {
    id: 'room-lib-reference',
    buildingId: 'b-library',
    floor: 0,
    roomNumber: 'LIB-001',
    name: 'Central Reference & Circulation Desk',
    aliases: ['Library Counter', 'Book Issue', 'Circulation'],
    category: 'library',
    coordinates: [76.10260, 13.02320],
    indoorCoordinates: { x: 15, y: 20, corridor: 'Entrance Foyer' },
    isAccessible: true,
    qrCheckpointId: 'qr-lib-gf',
    verificationStatus: 'verified'
  },
  {
    id: 'room-lib-digital',
    buildingId: 'b-library',
    floor: 1,
    roomNumber: 'LIB-102',
    name: 'Digital Library & VTU E-Learning Center',
    aliases: ['Digital Library', 'Internet Browsing Center', 'IEEE Terminal'],
    category: 'library',
    coordinates: [76.10265, 13.02330],
    indoorCoordinates: { x: 20, y: 35, corridor: 'First Floor E-Resource Hall' },
    isAccessible: true,
    verificationStatus: 'verified'
  },

  // Amenities & Emergency
  {
    id: 'room-canteen-counter',
    buildingId: 'b-canteen',
    floor: 0,
    roomNumber: 'CAN-01',
    name: 'Main Canteen Counter & Dining Area',
    aliases: ['Canteen', 'Cafeteria', 'Mess Counter', 'Food Court'],
    category: 'canteen',
    coordinates: [76.10375, 13.02360],
    isAccessible: true,
    qrCheckpointId: 'qr-canteen',
    verificationStatus: 'verified'
  },
  {
    id: 'room-health-clinic',
    buildingId: 'b-health',
    floor: 0,
    roomNumber: 'HC-01',
    name: 'Campus Dispensary & Medical Doctor Cabin',
    aliases: ['Doctor Room', 'First Aid Station', 'Infirmary', 'Health Center'],
    category: 'first_aid',
    coordinates: [76.10220, 13.02335],
    isAccessible: true,
    qrCheckpointId: 'qr-health',
    verificationStatus: 'verified'
  },
  {
    id: 'room-security-desk',
    buildingId: 'b-security',
    floor: 0,
    roomNumber: 'SEC-01',
    name: 'Main Security Gate & Visitor Desk',
    aliases: ['Gate Security', 'Main Gate Office', 'Visitor Pass Counter'],
    category: 'security',
    coordinates: [76.10185, 13.02380],
    isAccessible: true,
    qrCheckpointId: 'qr-gate-main',
    verificationStatus: 'verified'
  },

  // Unverified/Pending locations requiring on-site physical survey confirmation
  {
    id: 'room-ced-survey-subroom',
    buildingId: 'b-civil',
    floor: 1,
    roomNumber: 'CV-108',
    name: 'Civil CAD Analysis Lab (Annex)',
    aliases: ['Civil CAD Lab', 'Room 108'],
    category: 'laboratory',
    coordinates: [76.10295, 13.02445],
    isAccessible: false,
    verificationStatus: 'needs_verification'
  },
  {
    id: 'room-mech-fluid-substation',
    buildingId: 'b-mech',
    floor: 0,
    roomNumber: 'ME-012',
    name: 'Hydraulics & Fluid Machinery Sub-Bay',
    aliases: ['Fluid Mechanics Lab', 'Room 012'],
    category: 'laboratory',
    coordinates: [76.10355, 13.02495],
    isAccessible: true,
    verificationStatus: 'needs_verification'
  }
];

// Outdoor & Indoor Navigation Graph Nodes
export const MCE_NAVIGATION_NODES: NavigationNode[] = [
  // Outdoor Nodes (Real walking network coordinates)
  {
    id: 'node-gate-salagame',
    name: 'Salagame Road Main Entrance Gate',
    type: 'outdoor_gate',
    coordinates: [76.10185, 13.02380],
    isAccessible: true
  },
  {
    id: 'node-security-junction',
    name: 'Front Security Checkpoint Junction',
    type: 'outdoor_junction',
    coordinates: [76.10205, 13.02375],
    isAccessible: true
  },
  {
    id: 'node-admin-circle',
    name: 'Administrative Quadrangle Roundabout',
    type: 'outdoor_junction',
    coordinates: [76.10235, 13.02365],
    isAccessible: true
  },
  {
    id: 'node-admin-entrance',
    name: 'Administrative Block Main Porch',
    type: 'building_entrance',
    coordinates: [76.10242, 13.02365],
    buildingId: 'b-admin',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-library-junction',
    name: 'Central Library Plaza Junction',
    type: 'outdoor_junction',
    coordinates: [76.10245, 13.02325],
    isAccessible: true
  },
  {
    id: 'node-library-entrance',
    name: 'Central Library Portico',
    type: 'building_entrance',
    coordinates: [76.10255, 13.02325],
    buildingId: 'b-library',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-placement-entrance',
    name: 'Training & Placement / Auditorium Entrance',
    type: 'building_entrance',
    coordinates: [76.10250, 13.02245],
    buildingId: 'b-placement',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-civil-avenue',
    name: 'Civil Engineering North Promenade',
    type: 'outdoor_junction',
    coordinates: [76.10265, 13.02410],
    isAccessible: true
  },
  {
    id: 'node-civil-entrance',
    name: 'Civil Department Main Portico',
    type: 'building_entrance',
    coordinates: [76.10280, 13.02430],
    buildingId: 'b-civil',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-mech-avenue',
    name: 'Mechanical Workshop Crossroads',
    type: 'outdoor_junction',
    coordinates: [76.10310, 13.02460],
    isAccessible: true
  },
  {
    id: 'node-mech-entrance',
    name: 'Mechanical Workshop Main Entrance',
    type: 'building_entrance',
    coordinates: [76.10335, 13.02478],
    buildingId: 'b-mech',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-academic-central-path',
    name: 'Central Academic Boulevard',
    type: 'outdoor_junction',
    coordinates: [76.10320, 13.02370],
    isAccessible: true
  },
  {
    id: 'node-canteen-plaza',
    name: 'Canteen & Social Plaza',
    type: 'outdoor_junction',
    coordinates: [76.10365, 13.02360],
    isAccessible: true
  },
  {
    id: 'node-canteen-entrance',
    name: 'Campus Canteen Entrance',
    type: 'building_entrance',
    coordinates: [76.10372, 13.02360],
    buildingId: 'b-canteen',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-csis-entrance',
    name: 'CS-IS Complex Main Archway',
    type: 'building_entrance',
    coordinates: [76.10385, 13.02388],
    buildingId: 'b-cse-ise',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-ece-entrance',
    name: 'ECE Block Portico',
    type: 'building_entrance',
    coordinates: [76.10312, 13.02292],
    buildingId: 'b-ece',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-eee-entrance',
    name: 'EEE Block Entrance',
    type: 'building_entrance',
    coordinates: [76.10340, 13.02330],
    buildingId: 'b-eee',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-meriise-entrance',
    name: 'ME-RIISE Foundation Incubator Entrance',
    type: 'building_entrance',
    coordinates: [76.10440, 13.02420],
    buildingId: 'b-meriise',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-hostel-junction',
    name: 'Boys Hostels Access Gate',
    type: 'outdoor_junction',
    coordinates: [76.10480, 13.02480],
    isAccessible: true
  },
  {
    id: 'node-hostel-entrance',
    name: 'Hoysala/Hemavathi Hostel Portico',
    type: 'building_entrance',
    coordinates: [76.10510, 13.02505],
    buildingId: 'b-hostels',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-temple-path',
    name: 'Spiritual Enclave Meditation Garden Walk',
    type: 'outdoor_junction',
    coordinates: [76.10390, 13.02530],
    isAccessible: true
  },
  {
    id: 'node-temple-entrance',
    name: 'Shree Ganapathi Temple Steps',
    type: 'building_entrance',
    coordinates: [76.10408, 13.02590],
    buildingId: 'b-temple',
    floor: 0,
    isAccessible: false // has steps, ramp on side
  },
  {
    id: 'node-sports-ground',
    name: 'Main Sports Complex & Pavilion',
    type: 'building_entrance',
    coordinates: [76.10525, 13.02235],
    buildingId: 'b-sports',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-emergency-assembly',
    name: 'Central Academic Lawn Emergency Assembly Area',
    type: 'emergency_point',
    coordinates: [76.10300, 13.02390],
    isAccessible: true
  },

  // Indoor CS-IS Complex Nodes (Multi-Floor)
  {
    id: 'node-csis-f0-foyer',
    name: 'CS-IS Ground Floor Main Foyer',
    type: 'indoor_junction',
    coordinates: [76.10385, 13.02388],
    buildingId: 'b-cse-ise',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-csis-f0-stairs',
    name: 'CS-IS Ground Floor Staircase West',
    type: 'indoor_staircase',
    coordinates: [76.10382, 13.02386],
    buildingId: 'b-cse-ise',
    floor: 0,
    isAccessible: false
  },
  {
    id: 'node-csis-f0-elevator',
    name: 'CS-IS Ground Floor Accessible Elevator',
    type: 'indoor_elevator',
    coordinates: [76.10387, 13.02385],
    buildingId: 'b-cse-ise',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-csis-f1-foyer',
    name: 'CS-IS First Floor Landing',
    type: 'indoor_junction',
    coordinates: [76.10385, 13.02388],
    buildingId: 'b-cse-ise',
    floor: 1,
    isAccessible: true
  },
  {
    id: 'node-csis-f1-stairs',
    name: 'CS-IS First Floor Staircase West',
    type: 'indoor_staircase',
    coordinates: [76.10382, 13.02386],
    buildingId: 'b-cse-ise',
    floor: 1,
    isAccessible: false
  },
  {
    id: 'node-csis-f1-elevator',
    name: 'CS-IS First Floor Elevator',
    type: 'indoor_elevator',
    coordinates: [76.10387, 13.02385],
    buildingId: 'b-cse-ise',
    floor: 1,
    isAccessible: true
  },
  {
    id: 'node-csis-f1-cse-hod',
    name: 'Doorway: CSE HOD Office (CS-101)',
    type: 'room_entrance',
    coordinates: [76.10385, 13.02390],
    buildingId: 'b-cse-ise',
    floor: 1,
    isAccessible: true
  },
  {
    id: 'node-csis-f2-foyer',
    name: 'CS-IS Second Floor Landing',
    type: 'indoor_junction',
    coordinates: [76.10385, 13.02388],
    buildingId: 'b-cse-ise',
    floor: 2,
    isAccessible: true
  },
  {
    id: 'node-csis-f2-stairs',
    name: 'CS-IS Second Floor Staircase West',
    type: 'indoor_staircase',
    coordinates: [76.10382, 13.02386],
    buildingId: 'b-cse-ise',
    floor: 2,
    isAccessible: false
  },
  {
    id: 'node-csis-f2-elevator',
    name: 'CS-IS Second Floor Elevator',
    type: 'indoor_elevator',
    coordinates: [76.10387, 13.02385],
    buildingId: 'b-cse-ise',
    floor: 2,
    isAccessible: true
  },
  {
    id: 'node-csis-f2-ai-lab',
    name: 'Doorway: AI & ML Lab (CS-204)',
    type: 'room_entrance',
    coordinates: [76.10395, 13.02400],
    buildingId: 'b-cse-ise',
    floor: 2,
    isAccessible: true
  },
  {
    id: 'node-csis-f3-foyer',
    name: 'CS-IS Third Floor Landing',
    type: 'indoor_junction',
    coordinates: [76.10385, 13.02388],
    buildingId: 'b-cse-ise',
    floor: 3,
    isAccessible: true
  },
  {
    id: 'node-csis-f3-stairs',
    name: 'CS-IS Third Floor Staircase West',
    type: 'indoor_staircase',
    coordinates: [76.10382, 13.02386],
    buildingId: 'b-cse-ise',
    floor: 3,
    isAccessible: false
  },
  {
    id: 'node-csis-f3-cr-301',
    name: 'Doorway: Lecture Hall CS-301',
    type: 'room_entrance',
    coordinates: [76.10390, 13.02395],
    buildingId: 'b-cse-ise',
    floor: 3,
    isAccessible: true
  },

  // Indoor Admin Block Nodes (Multi-Floor)
  {
    id: 'node-admin-f0-foyer',
    name: 'Admin Block Ground Floor Rotunda',
    type: 'indoor_junction',
    coordinates: [76.10242, 13.02365],
    buildingId: 'b-admin',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-admin-f0-principal',
    name: 'Doorway: Principal\'s Office (ADM-001)',
    type: 'room_entrance',
    coordinates: [76.10240, 13.02360],
    buildingId: 'b-admin',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-admin-f0-stairs',
    name: 'Admin Block Ground Floor Grand Staircase',
    type: 'indoor_staircase',
    coordinates: [76.10244, 13.02363],
    buildingId: 'b-admin',
    floor: 0,
    isAccessible: false
  },
  {
    id: 'node-admin-f0-elevator',
    name: 'Admin Block Ground Floor Elevator',
    type: 'indoor_elevator',
    coordinates: [76.10241, 13.02367],
    buildingId: 'b-admin',
    floor: 0,
    isAccessible: true
  },
  {
    id: 'node-admin-f1-foyer',
    name: 'Admin Block First Floor Landing',
    type: 'indoor_junction',
    coordinates: [76.10242, 13.02365],
    buildingId: 'b-admin',
    floor: 1,
    isAccessible: true
  },
  {
    id: 'node-admin-f1-stairs',
    name: 'Admin Block First Floor Staircase',
    type: 'indoor_staircase',
    coordinates: [76.10244, 13.02363],
    buildingId: 'b-admin',
    floor: 1,
    isAccessible: false
  },
  {
    id: 'node-admin-f1-elevator',
    name: 'Admin Block First Floor Elevator',
    type: 'indoor_elevator',
    coordinates: [76.10241, 13.02367],
    buildingId: 'b-admin',
    floor: 1,
    isAccessible: true
  },
  {
    id: 'node-admin-f1-exam-cell',
    name: 'Doorway: Examination Section (ADM-105)',
    type: 'room_entrance',
    coordinates: [76.10245, 13.02365],
    buildingId: 'b-admin',
    floor: 1,
    isAccessible: true
  }
];

// Navigation Graph Edges (Distances in meters calculated along actual walkways)
export const MCE_NAVIGATION_EDGES: NavigationEdge[] = [
  // Gate to Security
  {
    id: 'edge-gate-sec',
    fromNodeId: 'node-gate-salagame',
    toNodeId: 'node-security-junction',
    distanceMeters: 23,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-sec-admin-circle',
    fromNodeId: 'node-security-junction',
    toNodeId: 'node-admin-circle',
    distanceMeters: 35,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-circle-admin-ent',
    fromNodeId: 'node-admin-circle',
    toNodeId: 'node-admin-entrance',
    distanceMeters: 10,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // Admin circle to Library
  {
    id: 'edge-circle-lib-junc',
    fromNodeId: 'node-admin-circle',
    toNodeId: 'node-library-junction',
    distanceMeters: 45,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-lib-junc-ent',
    fromNodeId: 'node-library-junction',
    toNodeId: 'node-library-entrance',
    distanceMeters: 12,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // Library junction to Placement
  {
    id: 'edge-lib-placement',
    fromNodeId: 'node-library-junction',
    toNodeId: 'node-placement-entrance',
    distanceMeters: 90,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // Library junction to ECE
  {
    id: 'edge-lib-ece',
    fromNodeId: 'node-library-junction',
    toNodeId: 'node-ece-entrance',
    distanceMeters: 80,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // ECE to EEE
  {
    id: 'edge-ece-eee',
    fromNodeId: 'node-ece-entrance',
    toNodeId: 'node-eee-entrance',
    distanceMeters: 52,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // Admin circle north to Civil Avenue
  {
    id: 'edge-circle-civil',
    fromNodeId: 'node-admin-circle',
    toNodeId: 'node-civil-avenue',
    distanceMeters: 60,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-civil-junc-ent',
    fromNodeId: 'node-civil-avenue',
    toNodeId: 'node-civil-entrance',
    distanceMeters: 28,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // Civil Avenue north to Mechanical
  {
    id: 'edge-civil-mech',
    fromNodeId: 'node-civil-avenue',
    toNodeId: 'node-mech-avenue',
    distanceMeters: 75,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-mech-junc-ent',
    fromNodeId: 'node-mech-avenue',
    toNodeId: 'node-mech-entrance',
    distanceMeters: 34,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // Civil Avenue east to Central Academic Boulevard
  {
    id: 'edge-civil-central',
    fromNodeId: 'node-civil-avenue',
    toNodeId: 'node-academic-central-path',
    distanceMeters: 72,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // Admin circle east to Central Academic Boulevard
  {
    id: 'edge-circle-central',
    fromNodeId: 'node-admin-circle',
    toNodeId: 'node-academic-central-path',
    distanceMeters: 92,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // Central path to Emergency Assembly Area
  {
    id: 'edge-central-emergency',
    fromNodeId: 'node-academic-central-path',
    toNodeId: 'node-emergency-assembly',
    distanceMeters: 30,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // Central path to Canteen Plaza
  {
    id: 'edge-central-canteen',
    fromNodeId: 'node-academic-central-path',
    toNodeId: 'node-canteen-plaza',
    distanceMeters: 50,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-canteen-plaza-ent',
    fromNodeId: 'node-canteen-plaza',
    toNodeId: 'node-canteen-entrance',
    distanceMeters: 8,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // Canteen Plaza to CS-IS complex
  {
    id: 'edge-canteen-csis',
    fromNodeId: 'node-canteen-plaza',
    toNodeId: 'node-csis-entrance',
    distanceMeters: 40,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // Canteen Plaza to EEE
  {
    id: 'edge-canteen-eee',
    fromNodeId: 'node-canteen-plaza',
    toNodeId: 'node-eee-entrance',
    distanceMeters: 45,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // CS-IS to ME-RIISE Foundation
  {
    id: 'edge-csis-meriise',
    fromNodeId: 'node-csis-entrance',
    toNodeId: 'node-meriise-entrance',
    distanceMeters: 65,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // ME-RIISE to Hostels Junction
  {
    id: 'edge-meriise-hostels',
    fromNodeId: 'node-meriise-entrance',
    toNodeId: 'node-hostel-junction',
    distanceMeters: 75,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-hostels-junc-ent',
    fromNodeId: 'node-hostel-junction',
    toNodeId: 'node-hostel-entrance',
    distanceMeters: 42,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // Mechanical to Temple Garden Path
  {
    id: 'edge-mech-temple-path',
    fromNodeId: 'node-mech-avenue',
    toNodeId: 'node-temple-path',
    distanceMeters: 110,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-temple-path-ent',
    fromNodeId: 'node-temple-path',
    toNodeId: 'node-temple-entrance',
    distanceMeters: 70,
    isIndoor: false,
    isAccessible: false,
    isStairs: true,
    isElevator: false,
    isBlocked: false
  },
  // Canteen/EEE south to Sports Complex
  {
    id: 'edge-eee-sports',
    fromNodeId: 'node-eee-entrance',
    toNodeId: 'node-sports-ground',
    distanceMeters: 230,
    isIndoor: false,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },

  // Indoor CS-IS Graph Edges
  {
    id: 'edge-csis-ent-f0',
    fromNodeId: 'node-csis-entrance',
    toNodeId: 'node-csis-f0-foyer',
    distanceMeters: 5,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-csis-f0-stairs',
    fromNodeId: 'node-csis-f0-foyer',
    toNodeId: 'node-csis-f0-stairs',
    distanceMeters: 8,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-csis-f0-elevator',
    fromNodeId: 'node-csis-f0-foyer',
    toNodeId: 'node-csis-f0-elevator',
    distanceMeters: 6,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // Stairs: Floor 0 <-> Floor 1
  {
    id: 'edge-csis-stairs-0-1',
    fromNodeId: 'node-csis-f0-stairs',
    toNodeId: 'node-csis-f1-stairs',
    distanceMeters: 14,
    isIndoor: true,
    isAccessible: false,
    isStairs: true,
    isElevator: false,
    isBlocked: false
  },
  // Elevator: Floor 0 <-> Floor 1
  {
    id: 'edge-csis-elev-0-1',
    fromNodeId: 'node-csis-f0-elevator',
    toNodeId: 'node-csis-f1-elevator',
    distanceMeters: 5,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: true,
    isBlocked: false
  },
  // Floor 1 links
  {
    id: 'edge-csis-f1-elev-foyer',
    fromNodeId: 'node-csis-f1-elevator',
    toNodeId: 'node-csis-f1-foyer',
    distanceMeters: 6,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-csis-f1-stairs-foyer',
    fromNodeId: 'node-csis-f1-stairs',
    toNodeId: 'node-csis-f1-foyer',
    distanceMeters: 8,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-csis-f1-hod',
    fromNodeId: 'node-csis-f1-foyer',
    toNodeId: 'node-csis-f1-cse-hod',
    distanceMeters: 12,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // Floor 1 <-> Floor 2 Stairs & Elevator
  {
    id: 'edge-csis-stairs-1-2',
    fromNodeId: 'node-csis-f1-stairs',
    toNodeId: 'node-csis-f2-stairs',
    distanceMeters: 14,
    isIndoor: true,
    isAccessible: false,
    isStairs: true,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-csis-elev-1-2',
    fromNodeId: 'node-csis-f1-elevator',
    toNodeId: 'node-csis-f2-elevator',
    distanceMeters: 5,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: true,
    isBlocked: false
  },
  // Floor 2 links
  {
    id: 'edge-csis-f2-elev-foyer',
    fromNodeId: 'node-csis-f2-elevator',
    toNodeId: 'node-csis-f2-foyer',
    distanceMeters: 6,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-csis-f2-stairs-foyer',
    fromNodeId: 'node-csis-f2-stairs',
    toNodeId: 'node-csis-f2-foyer',
    distanceMeters: 8,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-csis-f2-ai-lab',
    fromNodeId: 'node-csis-f2-foyer',
    toNodeId: 'node-csis-f2-ai-lab',
    distanceMeters: 16,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  // Floor 2 <-> Floor 3 Stairs
  {
    id: 'edge-csis-stairs-2-3',
    fromNodeId: 'node-csis-f2-stairs',
    toNodeId: 'node-csis-f3-stairs',
    distanceMeters: 14,
    isIndoor: true,
    isAccessible: false,
    isStairs: true,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-csis-f3-stairs-foyer',
    fromNodeId: 'node-csis-f3-stairs',
    toNodeId: 'node-csis-f3-foyer',
    distanceMeters: 8,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-csis-f3-cr-301',
    fromNodeId: 'node-csis-f3-foyer',
    toNodeId: 'node-csis-f3-cr-301',
    distanceMeters: 15,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },

  // Indoor Admin Block Edges
  {
    id: 'edge-admin-ent-f0',
    fromNodeId: 'node-admin-entrance',
    toNodeId: 'node-admin-f0-foyer',
    distanceMeters: 6,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-admin-f0-principal',
    fromNodeId: 'node-admin-f0-foyer',
    toNodeId: 'node-admin-f0-principal',
    distanceMeters: 10,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-admin-f0-stairs',
    fromNodeId: 'node-admin-f0-foyer',
    toNodeId: 'node-admin-f0-stairs',
    distanceMeters: 6,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-admin-f0-elev',
    fromNodeId: 'node-admin-f0-foyer',
    toNodeId: 'node-admin-f0-elevator',
    distanceMeters: 5,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-admin-stairs-0-1',
    fromNodeId: 'node-admin-f0-stairs',
    toNodeId: 'node-admin-f1-stairs',
    distanceMeters: 12,
    isIndoor: true,
    isAccessible: false,
    isStairs: true,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-admin-elev-0-1',
    fromNodeId: 'node-admin-f0-elevator',
    toNodeId: 'node-admin-f1-elevator',
    distanceMeters: 5,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: true,
    isBlocked: false
  },
  {
    id: 'edge-admin-f1-elev-foyer',
    fromNodeId: 'node-admin-f1-elevator',
    toNodeId: 'node-admin-f1-foyer',
    distanceMeters: 5,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-admin-f1-stairs-foyer',
    fromNodeId: 'node-admin-f1-stairs',
    toNodeId: 'node-admin-f1-foyer',
    distanceMeters: 6,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  },
  {
    id: 'edge-admin-f1-exam-cell',
    fromNodeId: 'node-admin-f1-foyer',
    toNodeId: 'node-admin-f1-exam-cell',
    distanceMeters: 14,
    isIndoor: true,
    isAccessible: true,
    isStairs: false,
    isElevator: false,
    isBlocked: false
  }
];

// Verified Indoor & Checkpoint QR Codes
export const MCE_QR_CHECKPOINTS: QRCheckpoint[] = [
  {
    id: 'qr-gate-main',
    code: 'MCE-CHK-GATE-01',
    buildingId: 'b-security',
    floor: 0,
    locationName: 'Salagame Road Main Gate Security Post',
    description: 'Mount on the east pillar of the Main Gate pedestrian entrance',
    nodeId: 'node-gate-salagame',
    coordinates: [76.10185, 13.02380]
  },
  {
    id: 'qr-admin-gf',
    code: 'MCE-CHK-ADM-GF',
    buildingId: 'b-admin',
    floor: 0,
    locationName: 'Admin Block Ground Floor Rotunda',
    description: 'Located next to the Principal Office directory board',
    nodeId: 'node-admin-f0-foyer',
    coordinates: [76.10242, 13.02365]
  },
  {
    id: 'qr-admin-1f',
    code: 'MCE-CHK-ADM-1F',
    buildingId: 'b-admin',
    floor: 1,
    locationName: 'Admin Block First Floor - Examination Section',
    description: 'Mounted outside the Controller of Examinations door (ADM-105)',
    nodeId: 'node-admin-f1-foyer',
    coordinates: [76.10242, 13.02365]
  },
  {
    id: 'qr-csis-gf',
    code: 'MCE-CHK-CSIS-GF',
    buildingId: 'b-cse-ise',
    floor: 0,
    locationName: 'CS-IS Complex Ground Floor Archway',
    description: 'Mounted at the main entry atrium beside the elevator',
    nodeId: 'node-csis-f0-foyer',
    coordinates: [76.10385, 13.02388]
  },
  {
    id: 'qr-csis-1f',
    code: 'MCE-CHK-CSIS-1F',
    buildingId: 'b-cse-ise',
    floor: 1,
    locationName: 'CS-IS Complex First Floor - CSE Department',
    description: 'Mounted at the HOD CSE corridor notice board',
    nodeId: 'node-csis-f1-foyer',
    coordinates: [76.10385, 13.02388]
  },
  {
    id: 'qr-csis-2f',
    code: 'MCE-CHK-CSIS-2F',
    buildingId: 'b-cse-ise',
    floor: 2,
    locationName: 'CS-IS Complex Second Floor - AI & ML Laboratory',
    description: 'Mounted outside the AI & ML Innovation Laboratory (CS-204)',
    nodeId: 'node-csis-f2-foyer',
    coordinates: [76.10385, 13.02388]
  },
  {
    id: 'qr-csis-3f',
    code: 'MCE-CHK-CSIS-3F',
    buildingId: 'b-cse-ise',
    floor: 3,
    locationName: 'CS-IS Complex Third Floor - Lecture Wing',
    description: 'Mounted opposite Lecture Hall CS-301',
    nodeId: 'node-csis-f3-foyer',
    coordinates: [76.10385, 13.02388]
  },
  {
    id: 'qr-lib-gf',
    code: 'MCE-CHK-LIB-GF',
    buildingId: 'b-library',
    floor: 0,
    locationName: 'Central Library Circulation Portico',
    description: 'Mounted at the book return RFID turnstile',
    nodeId: 'node-library-entrance',
    coordinates: [76.10255, 13.02325]
  },
  {
    id: 'qr-civil-gf',
    code: 'MCE-CHK-CIV-GF',
    buildingId: 'b-civil',
    floor: 0,
    locationName: 'Civil Engineering Testing Labs Corridor',
    description: 'Mounted beside the Concrete & Highway Materials Testing Lab door',
    nodeId: 'node-civil-entrance',
    coordinates: [76.10280, 13.02430]
  },
  {
    id: 'qr-mech-gf',
    code: 'MCE-CHK-MECH-GF',
    buildingId: 'b-mech',
    floor: 0,
    locationName: 'Mechanical Workshops Central Bay',
    description: 'Mounted on pillar A1 near the Machine Shop safety desk',
    nodeId: 'node-mech-entrance',
    coordinates: [76.10335, 13.02478]
  },
  {
    id: 'qr-canteen',
    code: 'MCE-CHK-CANTEEN',
    buildingId: 'b-canteen',
    floor: 0,
    locationName: 'Campus Canteen Central Dining Area',
    description: 'Mounted above the digital token display board',
    nodeId: 'node-canteen-entrance',
    coordinates: [76.10372, 13.02360]
  },
  {
    id: 'qr-health',
    code: 'MCE-CHK-HEALTH',
    buildingId: 'b-health',
    floor: 0,
    locationName: 'Campus Health Centre & First Aid Desk',
    description: 'Mounted at the entrance triage desk',
    nodeId: 'room-health-clinic',
    coordinates: [76.10220, 13.02335]
  }
];
