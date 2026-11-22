import { StudentRosterEntry, StaffRosterEntry } from '../models/types';

// Authoritative MCE Student Master Registry (Whitelisted USNs)
export const MCE_STUDENT_ROSTER: StudentRosterEntry[] = [
  {
    usn: '4MC22CS045',
    fullName: 'Yashaswini K S',
    officialEmail: 'yashaswini.22cs045@mcehassan.ac.in',
    departmentId: 'dept-cse',
    admissionYear: 2022,
    currentSemester: 6,
    section: 'A',
    isActive: true
  },
  {
    usn: '4MC22CS089',
    fullName: 'Aditya Gowda',
    officialEmail: 'aditya.22cs089@mcehassan.ac.in',
    departmentId: 'dept-cse',
    admissionYear: 2022,
    currentSemester: 6,
    section: 'B',
    isActive: true
  },
  {
    usn: '4MC23IS012',
    fullName: 'Bhoomika R',
    officialEmail: 'bhoomika.23is012@mcehassan.ac.in',
    departmentId: 'dept-ise',
    admissionYear: 2023,
    currentSemester: 4,
    section: 'A',
    isActive: true
  },
  {
    usn: '4MC22AI015',
    fullName: 'Chetan Kumar',
    officialEmail: 'chetan.22ai015@mcehassan.ac.in',
    departmentId: 'dept-aiml',
    admissionYear: 2022,
    currentSemester: 6,
    section: 'A',
    isActive: true
  },
  {
    usn: '4MC21CV030',
    fullName: 'Darshan Patel',
    officialEmail: 'darshan.21cv030@mcehassan.ac.in',
    departmentId: 'dept-civil',
    admissionYear: 2021,
    currentSemester: 8,
    section: 'A',
    isActive: true
  },
  {
    usn: '4MC23EC088',
    fullName: 'Deepika M',
    officialEmail: 'deepika.23ec088@mcehassan.ac.in',
    departmentId: 'dept-ece',
    admissionYear: 2023,
    currentSemester: 4,
    section: 'B',
    isActive: true
  },
  {
    usn: '4MC22ME052',
    fullName: 'Gagan S',
    officialEmail: 'gagan.22me052@mcehassan.ac.in',
    departmentId: 'dept-mech',
    admissionYear: 2022,
    currentSemester: 6,
    section: 'A',
    isActive: true
  },
  {
    usn: '4MC24CS001',
    fullName: 'Ananya Sharma',
    officialEmail: 'ananya.24cs001@mcehassan.ac.in',
    departmentId: 'dept-cse',
    admissionYear: 2024,
    currentSemester: 2,
    section: 'A',
    isActive: true
  }
];

// Authoritative MCE Staff Master Registry
export const MCE_STAFF_ROSTER: StaffRosterEntry[] = [
  {
    employeeId: 'MCE-ADMIN-001',
    fullName: 'Dr. C. V. Venkatesh (Principal)',
    officialEmail: 'principal@mcehassan.ac.in',
    departmentId: 'b-admin',
    designation: 'Principal & Professor',
    role: 'super_admin',
    isActive: true
  },
  {
    employeeId: 'MCE-FAC-014',
    fullName: 'Dr. B. R. Srinivas (HOD CSE)',
    officialEmail: 'hod_cse@mcehassan.ac.in',
    departmentId: 'dept-cse',
    designation: 'Professor & Head',
    role: 'campus_admin',
    isActive: true
  },
  {
    employeeId: 'MCE-FAC-022',
    fullName: 'Dr. P. Sandhya (HOD AIML)',
    officialEmail: 'hod_aiml@mcehassan.ac.in',
    departmentId: 'dept-aiml',
    designation: 'Associate Professor & Head',
    role: 'faculty',
    isActive: true
  },
  {
    employeeId: 'MCE-ADM-005',
    fullName: 'K. Ramesh (System Admin)',
    officialEmail: 'sysadmin@mcehassan.ac.in',
    departmentId: 'b-admin',
    designation: 'Network & System Administrator',
    role: 'campus_admin',
    isActive: true
  }
];
