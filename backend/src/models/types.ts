export type UserRole = 'student' | 'faculty' | 'staff' | 'campus_admin' | 'super_admin';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  institutionalId: string; // USN for students, Employee ID for staff
  role: UserRole;
  departmentId: string;
  semester?: number;
  section?: string;
  verificationStatus: VerificationStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  googleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentRosterEntry {
  usn: string;
  fullName: string;
  officialEmail: string;
  departmentId: string;
  admissionYear: number;
  currentSemester: number;
  section: string;
  isActive: boolean;
}

export interface StaffRosterEntry {
  employeeId: string;
  fullName: string;
  officialEmail: string;
  departmentId: string;
  designation: string;
  role: 'faculty' | 'staff' | 'campus_admin' | 'super_admin';
  isActive: boolean;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  institutionalId: string;
  idCardImageUrl?: string;
  submittedAt: string;
  status: VerificationStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: string;
}

export interface CampusBuilding {
  id: string;
  name: string;
  shortCode: string;
  category: 'academic' | 'administrative' | 'hostel' | 'amenity' | 'sports' | 'spiritual';
  description: string;
  coordinates: [number, number]; // [lng, lat]
  polygon?: [number, number][]; // footprint coordinates
  floorsCount: number;
  accessibility: {
    wheelchairRamp: boolean;
    elevators: boolean;
    tactilePaving: boolean;
    accessibleWashrooms: boolean;
  };
  verificationStatus: 'verified' | 'needs_verification';
  verificationNotes?: string;
}

export interface DepartmentInfo {
  id: string;
  name: string;
  shortCode: string;
  buildingId: string;
  floor: number;
  hodName: string;
  contactEmail: string;
  programmes: string[];
  laboratories: string[];
}

export interface RoomLocation {
  id: string;
  buildingId: string;
  floor: number;
  roomNumber: string;
  name: string;
  aliases: string[];
  category: 'classroom' | 'laboratory' | 'office' | 'seminar_hall' | 'library' | 'washroom' | 'canteen' | 'first_aid' | 'security';
  coordinates: [number, number]; // [lng, lat]
  indoorCoordinates?: { x: number; y: number; corridor: string };
  isAccessible: boolean;
  qrCheckpointId?: string;
  verificationStatus: 'verified' | 'needs_verification';
}

export interface NavigationNode {
  id: string;
  name: string;
  type: 'outdoor_gate' | 'outdoor_junction' | 'building_entrance' | 'indoor_junction' | 'indoor_staircase' | 'indoor_elevator' | 'room_entrance' | 'emergency_point';
  coordinates: [number, number]; // [lng, lat]
  buildingId?: string;
  floor?: number;
  isAccessible: boolean;
}

export interface NavigationEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distanceMeters: number;
  isIndoor: boolean;
  isAccessible: boolean; // Stair-free
  isStairs: boolean;
  isElevator: boolean;
  isBlocked: boolean;
  blockedReason?: string;
}

export interface QRCheckpoint {
  id: string;
  code: string;
  buildingId: string;
  floor: number;
  locationName: string;
  description: string;
  nodeId: string;
  coordinates: [number, number];
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  fromNodeId: string;
  toNodeId: string;
  floorTransition?: {
    fromFloor: number;
    toFloor: number;
    method: 'stairs' | 'elevator';
  };
  landmark?: string;
}

export interface RouteResult {
  routeMode: 'shortest' | 'easiest' | 'accessible';
  totalDistanceMeters: number;
  estimatedWalkingMinutes: number;
  steps: RouteStep[];
  pathNodes: NavigationNode[];
  pathCoordinates: [number, number][];
  isAccessible: boolean;
  indoorLegsCount: number;
  floorTransitions: number;
}

export interface ClassScheduleItem {
  id: string;
  dayOfWeek: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  roomId: string;
  roomName: string;
  buildingName: string;
  floor: number;
  semester: number;
  section: string;
}

export interface CampusFeedback {
  id: string;
  userId: string;
  type: 'missing_place' | 'incorrect_room' | 'blocked_path' | 'accessibility_issue' | 'other';
  locationId?: string;
  description: string;
  reportedAt: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}
