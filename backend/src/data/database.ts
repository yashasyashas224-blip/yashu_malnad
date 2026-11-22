import fs from 'fs';
import path from 'path';
import {
  User,
  VerificationRequest,
  CampusBuilding,
  RoomLocation,
  NavigationNode,
  NavigationEdge,
  QRCheckpoint,
  CampusFeedback,
  AuditLog,
  ClassScheduleItem
} from '../models/types';
import {
  MCE_BUILDINGS,
  MCE_ROOMS,
  MCE_NAVIGATION_NODES,
  MCE_NAVIGATION_EDGES,
  MCE_QR_CHECKPOINTS
} from './mceCampusData';
import { MCE_CLASS_SCHEDULES } from './mceScheduleData';

interface OtpChallenge {
  id: string;
  target: string; // phone or email
  type: 'email' | 'phone';
  code: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: number; // timestamp
  lastSentAt: number;
}

interface LocationShareSession {
  id: string;
  userId: string;
  userName: string;
  targetName?: string;
  currentCoordinates: [number, number];
  locationDescription: string;
  expiresAt: number;
  isActive: boolean;
}

export interface MapVersion {
  version: number;
  publishedAt: string;
  publishedBy: string;
  notes: string;
  nodesCount: number;
  edgesCount: number;
}

const DB_FILE = path.join(__dirname, '..', '..', 'campus_store.json');

class DatabaseStore {
  public users: Map<string, User> = new Map();
  public userPasswords: Map<string, string> = new Map(); // userId -> bcrypt hash
  public verificationRequests: Map<string, VerificationRequest> = new Map();
  public otpChallenges: Map<string, OtpChallenge> = new Map();
  public buildings: Map<string, CampusBuilding> = new Map();
  public rooms: Map<string, RoomLocation> = new Map();
  public nodes: Map<string, NavigationNode> = new Map();
  public edges: Map<string, NavigationEdge> = new Map();
  public qrCheckpoints: Map<string, QRCheckpoint> = new Map();
  public feedbacks: Map<string, CampusFeedback> = new Map();
  public auditLogs: AuditLog[] = [];
  public schedules: ClassScheduleItem[] = [];
  public locationShares: Map<string, LocationShareSession> = new Map();
  public userFavorites: Map<string, Set<string>> = new Map(); // userId -> set of locationIds
  public searchHistory: Map<string, string[]> = new Map(); // userId -> search queries
  public mapVersions: MapVersion[] = [];

  constructor() {
    this.seedDefaults();
    this.loadFromFile();
  }

  private seedDefaults() {
    MCE_BUILDINGS.forEach(b => this.buildings.set(b.id, { ...b }));
    MCE_ROOMS.forEach(r => this.rooms.set(r.id, { ...r }));
    MCE_NAVIGATION_NODES.forEach(n => this.nodes.set(n.id, { ...n }));
    MCE_NAVIGATION_EDGES.forEach(e => this.edges.set(e.id, { ...e }));
    MCE_QR_CHECKPOINTS.forEach(q => this.qrCheckpoints.set(q.id, { ...q }));
    this.schedules = [...MCE_CLASS_SCHEDULES];

    this.mapVersions.push({
      version: 1,
      publishedAt: new Date().toISOString(),
      publishedBy: 'System Bootstrap',
      notes: 'Initial surveyed MCE Hassan campus baseline topology',
      nodesCount: this.nodes.size,
      edgesCount: this.edges.size
    });

    // Seed default administrator
    const adminId = 'user-admin-default';
    this.users.set(adminId, {
      id: adminId,
      name: 'Dr. C. V. Venkatesh (Principal)',
      email: 'principal@mcehassan.ac.in',
      phone: '+919448123456',
      institutionalId: 'MCE-ADMIN-001',
      role: 'super_admin',
      departmentId: 'b-admin',
      verificationStatus: 'verified',
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    // Default pass: MceAdmin@2025
    this.userPasswords.set(adminId, '$2b$10$XjBjhSW3QTe4dMcexZFb5OVbtr9jeTPEN.rc2.eCeirPS48QCMVLe');
  }

  public saveToFile() {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        userPasswords: Array.from(this.userPasswords.entries()),
        verificationRequests: Array.from(this.verificationRequests.entries()),
        buildings: Array.from(this.buildings.entries()),
        rooms: Array.from(this.rooms.entries()),
        nodes: Array.from(this.nodes.entries()),
        edges: Array.from(this.edges.entries()),
        qrCheckpoints: Array.from(this.qrCheckpoints.entries()),
        feedbacks: Array.from(this.feedbacks.entries()),
        auditLogs: this.auditLogs,
        mapVersions: this.mapVersions
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database state:', err);
    }
  }

  public loadFromFile() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.users) this.users = new Map(data.users);
        if (data.userPasswords) {
          this.userPasswords = new Map(data.userPasswords);
          this.userPasswords.set('user-admin-default', '$2b$10$XjBjhSW3QTe4dMcexZFb5OVbtr9jeTPEN.rc2.eCeirPS48QCMVLe');
        }
        if (data.verificationRequests) this.verificationRequests = new Map(data.verificationRequests);
        
        // Merge with seed defaults so newly registered nodes/buildings are always present
        if (data.buildings) {
          const loadedBuildings = new Map<string, CampusBuilding>(data.buildings);
          MCE_BUILDINGS.forEach(b => { if (!loadedBuildings.has(b.id)) loadedBuildings.set(b.id, { ...b }); });
          this.buildings = loadedBuildings;
        }
        if (data.rooms) {
          const loadedRooms = new Map<string, RoomLocation>(data.rooms);
          MCE_ROOMS.forEach(r => { if (!loadedRooms.has(r.id)) loadedRooms.set(r.id, { ...r }); });
          this.rooms = loadedRooms;
        }
        if (data.nodes) {
          const loadedNodes = new Map<string, NavigationNode>(data.nodes);
          MCE_NAVIGATION_NODES.forEach(n => { if (!loadedNodes.has(n.id)) loadedNodes.set(n.id, { ...n }); });
          this.nodes = loadedNodes;
        }
        if (data.edges) {
          const loadedEdges = new Map<string, NavigationEdge>(data.edges);
          MCE_NAVIGATION_EDGES.forEach(e => { if (!loadedEdges.has(e.id)) loadedEdges.set(e.id, { ...e }); });
          this.edges = loadedEdges;
        }
        if (data.qrCheckpoints) {
          const loadedQr = new Map<string, QRCheckpoint>(data.qrCheckpoints);
          MCE_QR_CHECKPOINTS.forEach(q => { if (!loadedQr.has(q.id)) loadedQr.set(q.id, { ...q }); });
          this.qrCheckpoints = loadedQr;
        }
        if (data.feedbacks) this.feedbacks = new Map(data.feedbacks);
        if (data.auditLogs) this.auditLogs = data.auditLogs;
        if (data.mapVersions) this.mapVersions = data.mapVersions;
      }
    } catch (err) {
      console.warn('Could not load existing store, keeping defaults:', err);
    }
  }

  public addAuditLog(adminId: string, adminName: string, action: string, targetType: string, targetId: string, details: string) {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      adminId,
      adminName,
      action,
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
    this.saveToFile();
    return log;
  }
}

export const db = new DatabaseStore();
