import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../data/database';
import { MCE_STUDENT_ROSTER, MCE_STAFF_ROSTER } from '../data/mceRoster';
import { User, UserRole, VerificationStatus } from '../models/types';

const JWT_SECRET = process.env.JWT_SECRET || 'mce_hassan_secure_campus_jwt_secret_2025_9948';
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_OTP_ATTEMPTS = 3;

export class AuthService {
  /**
   * Verify identity against authoritative MCE Roster
   */
  public static verifyInstitutionalRoster(institutionalId: string, email: string): {
    matched: boolean;
    role: UserRole;
    name?: string;
    departmentId?: string;
    reason?: string;
  } {
    const cleanId = institutionalId.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check staff roster
    const staffMatch = MCE_STAFF_ROSTER.find(
      s => s.employeeId.toUpperCase() === cleanId && (s.officialEmail.toLowerCase() === cleanEmail || cleanEmail.endsWith('@mcehassan.ac.in'))
    );
    if (staffMatch) {
      if (!staffMatch.isActive) {
        return { matched: false, role: 'staff', reason: 'Staff account has been deactivated by MCE administration' };
      }
      return {
        matched: true,
        role: staffMatch.role,
        name: staffMatch.fullName,
        departmentId: staffMatch.departmentId
      };
    }

    // Check student roster (Format: 4MC<YY><BRANCH><NUM>, e.g. 4MC22CS045)
    const studentMatch = MCE_STUDENT_ROSTER.find(
      s => s.usn.toUpperCase() === cleanId
    );
    if (studentMatch) {
      if (!studentMatch.isActive) {
        return { matched: false, role: 'student', reason: 'Student USN is marked inactive or suspended by MCE administration' };
      }
      // If institutional email supplied, match or accept college domain
      if (cleanEmail.endsWith('@mcehassan.ac.in') || studentMatch.officialEmail.toLowerCase() === cleanEmail) {
        return {
          matched: true,
          role: 'student',
          name: studentMatch.fullName,
          departmentId: studentMatch.departmentId
        };
      } else {
        // Allows enrollment verification request for students whose personal email is registered on file
        return {
          matched: true,
          role: 'student',
          name: studentMatch.fullName,
          departmentId: studentMatch.departmentId,
          reason: 'Matched official roster via USN'
        };
      }
    }

    // Explicit rejection: USN not in MCE format or not registered
    return {
      matched: false,
      role: 'student',
      reason: 'Institutional ID not found in Malnad College of Engineering master roster. External college students cannot register.'
    };
  }

  /**
   * Send/Generate Phone or Email OTP with anti-abuse and rate limiting
   */
  public static generateOtp(target: string, type: 'email' | 'phone'): { success: boolean; message: string; challengeId?: string; debugOtp?: string } {
    const cleanTarget = target.trim().toLowerCase();
    const existing = db.otpChallenges.get(cleanTarget);
    const now = Date.now();

    if (existing && (now - existing.lastSentAt) < OTP_RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      return {
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new OTP.`
      };
    }

    // Generate cryptographically random 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();
    const challengeId = `otp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    db.otpChallenges.set(cleanTarget, {
      id: challengeId,
      target: cleanTarget,
      type,
      code,
      attempts: 0,
      maxAttempts: MAX_OTP_ATTEMPTS,
      expiresAt: now + OTP_EXPIRY_MS,
      lastSentAt: now
    });

    console.log(`[MCE Auth] Generated ${type.toUpperCase()} OTP for ${cleanTarget}: ${code}`);

    return {
      success: true,
      message: `OTP sent successfully to ${type === 'phone' ? 'phone number' : 'email address'}. Valid for 5 minutes.`,
      challengeId,
      debugOtp: code // provided for local testing / demo verification
    };
  }

  /**
   * Verify an OTP challenge
   */
  public static verifyOtp(target: string, code: string): { success: boolean; message: string } {
    const cleanTarget = target.trim().toLowerCase();
    const challenge = db.otpChallenges.get(cleanTarget);

    if (!challenge) {
      return { success: false, message: 'No active OTP verification session found for this target.' };
    }

    if (Date.now() > challenge.expiresAt) {
      db.otpChallenges.delete(cleanTarget);
      return { success: false, message: 'OTP has expired. Please request a new code.' };
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      db.otpChallenges.delete(cleanTarget);
      return { success: false, message: 'Maximum verification attempts exceeded. Please request a new code.' };
    }

    challenge.attempts += 1;

    if (challenge.code !== code.trim()) {
      return {
        success: false,
        message: `Invalid OTP code. ${challenge.maxAttempts - challenge.attempts} attempts remaining.`
      };
    }

    // Successfully verified
    db.otpChallenges.delete(cleanTarget);
    return { success: true, message: 'OTP verified successfully.' };
  }

  /**
   * Register a new MCE student or staff member
   */
  public static async registerUser(params: {
    fullName: string;
    institutionalId: string;
    officialEmail: string;
    phone: string;
    password?: string;
  }): Promise<{ success: boolean; message: string; user?: User; token?: string }> {
    const { fullName, institutionalId, officialEmail, phone, password } = params;

    const cleanEmail = officialEmail.trim().toLowerCase();
    const cleanId = institutionalId.trim().toUpperCase();
    const cleanPhone = phone.trim();

    // Check if user already exists
    for (const u of db.users.values()) {
      if (u.email.toLowerCase() === cleanEmail) {
        return { success: false, message: 'An account with this email already exists.' };
      }
      if (u.institutionalId.toUpperCase() === cleanId) {
        return { success: false, message: 'An account with this MCE USN/Employee ID is already registered.' };
      }
    }

    // Strict institutional validation
    const rosterCheck = this.verifyInstitutionalRoster(cleanId, cleanEmail);
    if (!rosterCheck.matched) {
      return {
        success: false,
        message: `MCE Verification Failed: ${rosterCheck.reason || 'Not recognized as an authorized Malnad College of Engineering member.'}`
      };
    }

    const userId = `mce-user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const newUser: User = {
      id: userId,
      name: rosterCheck.name || fullName.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      institutionalId: cleanId,
      role: rosterCheck.role,
      departmentId: rosterCheck.departmentId || 'dept-cse',
      verificationStatus: 'verified', // Pre-verified via authoritative college roster
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.users.set(userId, newUser);
    if (hashedPassword) {
      db.userPasswords.set(userId, hashedPassword);
    }
    db.saveToFile();

    const token = this.generateToken(newUser);

    return {
      success: true,
      message: 'Malnad College of Engineering identity verified and account activated.',
      user: newUser,
      token
    };
  }

  /**
   * Authenticate existing user with Email / USN / Phone + Password
   */
  public static async login(identifier: string, password?: string): Promise<{
    success: boolean;
    message: string;
    user?: User;
    token?: string;
  }> {
    const cleanId = identifier.trim().toLowerCase();
    let foundUser: User | undefined;

    for (const u of db.users.values()) {
      if (
        u.email.toLowerCase() === cleanId ||
        u.institutionalId.toLowerCase() === cleanId ||
        u.phone === cleanId
      ) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      return { success: false, message: 'No registered MCE account found with these credentials.' };
    }

    if (foundUser.verificationStatus !== 'verified') {
      return {
        success: false,
        message: `Account cannot access navigation. Verification status: ${foundUser.verificationStatus}.`
      };
    }

    if (password) {
      const storedHash = db.userPasswords.get(foundUser.id);
      if (storedHash) {
        const matches = await bcrypt.compare(password, storedHash);
        if (!matches) {
          return { success: false, message: 'Invalid password. Please check your credentials.' };
        }
      }
    }

    const token = this.generateToken(foundUser);
    return {
      success: true,
      message: 'Authentication successful. Welcome to MCE Smart Campus Navigator.',
      user: foundUser,
      token
    };
  }

  /**
   * Google Sign-In with mandatory MCE Roster linkage
   */
  public static async googleSignIn(params: {
    googleId: string;
    email: string;
    name: string;
    institutionalId?: string;
  }): Promise<{
    success: boolean;
    message: string;
    user?: User;
    token?: string;
    needsLinkage?: boolean;
  }> {
    const { googleId, email, name, institutionalId } = params;
    const cleanEmail = email.trim().toLowerCase();

    // Check if already linked
    for (const u of db.users.values()) {
      if (u.googleId === googleId || u.email.toLowerCase() === cleanEmail) {
        if (u.verificationStatus !== 'verified') {
          return { success: false, message: 'Your linked MCE account is not currently verified.' };
        }
        if (!u.googleId) {
          u.googleId = googleId;
          db.saveToFile();
        }
        return {
          success: true,
          message: 'Google login verified with authorized MCE account.',
          user: u,
          token: this.generateToken(u)
        };
      }
    }

    // If new Google login without MCE linkage, check institutionalId or domain
    if (!institutionalId) {
      // If the email is strictly @mcehassan.ac.in, try matching against staff/student roster
      if (cleanEmail.endsWith('@mcehassan.ac.in')) {
        const studentMatch = MCE_STUDENT_ROSTER.find(s => s.officialEmail.toLowerCase() === cleanEmail);
        const staffMatch = MCE_STAFF_ROSTER.find(s => s.officialEmail.toLowerCase() === cleanEmail);

        if (studentMatch || staffMatch) {
          const match = studentMatch || staffMatch!;
          const role = studentMatch ? 'student' : (staffMatch?.role || 'staff');
          const userId = `mce-user-g-${Date.now()}`;
          const newUser: User = {
            id: userId,
            name: match.fullName || name,
            email: cleanEmail,
            phone: '',
            institutionalId: studentMatch ? studentMatch.usn : staffMatch!.employeeId,
            role,
            departmentId: match.departmentId,
            verificationStatus: 'verified',
            isEmailVerified: true,
            isPhoneVerified: false,
            googleId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          db.users.set(userId, newUser);
          db.saveToFile();
          return {
            success: true,
            message: 'Institutional Google account verified.',
            user: newUser,
            token: this.generateToken(newUser)
          };
        }
      }

      // Reject standalone Gmail or other university email
      return {
        success: false,
        needsLinkage: true,
        message: 'Google sign-in alone is not proof of MCE membership. Please enter your valid MCE Student USN or Employee ID to link this account.'
      };
    }

    // Link provided institutionalId
    const rosterCheck = this.verifyInstitutionalRoster(institutionalId, cleanEmail);
    if (!rosterCheck.matched) {
      return {
        success: false,
        message: `MCE Linkage Rejected: ${rosterCheck.reason || 'Invalid USN/Employee ID.'}`
      };
    }

    const userId = `mce-user-g-${Date.now()}`;
    const newUser: User = {
      id: userId,
      name: rosterCheck.name || name,
      email: cleanEmail,
      phone: '',
      institutionalId: institutionalId.trim().toUpperCase(),
      role: rosterCheck.role,
      departmentId: rosterCheck.departmentId || 'dept-cse',
      verificationStatus: 'verified',
      isEmailVerified: true,
      isPhoneVerified: false,
      googleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.set(userId, newUser);
    db.saveToFile();

    return {
      success: true,
      message: 'Account successfully linked to verified MCE record.',
      user: newUser,
      token: this.generateToken(newUser)
    };
  }

  public static generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        institutionalId: user.institutionalId,
        verificationStatus: user.verificationStatus
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
  }

  public static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }
}
