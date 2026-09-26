export type Resource = {
  id: string;
  title: string;
  type: string;
  subject: string;
  code: string;
  branch: string;
  semester: number;
  contributor: string;
  date: string;
  views: number;
  downloads: number;
  helpful: number;
  description: string;
  pages: number;
};

export const branches = [
  { code: "CSE", name: "Computer Science & Engineering", count: 842, icon: "⌘" },
  { code: "IT", name: "Information Technology", count: 536, icon: "{}" },
  { code: "AIML", name: "Artificial Intelligence & ML", count: 418, icon: "AI" },
  { code: "DS", name: "Data Science", count: 362, icon: "◫" },
  { code: "ECE", name: "Electronics & Communication", count: 614, icon: "⌁" },
  { code: "EE", name: "Electrical Engineering", count: 489, icon: "ϟ" },
  { code: "EEE", name: "Electrical & Electronics", count: 304, icon: "∿" },
  { code: "ME", name: "Mechanical Engineering", count: 557, icon: "⚙" },
  { code: "CE", name: "Civil Engineering", count: 478, icon: "△" },
  { code: "CHE", name: "Chemical Engineering", count: 218, icon: "◌" },
  { code: "BT", name: "Biotechnology", count: 194, icon: "✣" },
  { code: "OTH", name: "Other AKTU Branches", count: 286, icon: "+" },
];

export const semesters = Array.from({ length: 8 }, (_, index) => ({
  number: index + 1,
  label: String(index + 1).padStart(2, "0"),
  phase: index < 2 ? "Foundation" : index < 6 ? "Core" : "Advanced",
  resources: 420 + index * 83,
}));

export const subjects = [
  { name: "Data Structures", code: "KCS301", semester: 3, resources: 128, color: "blue" },
  { name: "Discrete Structures", code: "KCS303", semester: 3, resources: 94, color: "teal" },
  { name: "Operating Systems", code: "KCS401", semester: 4, resources: 116, color: "amber" },
  { name: "Database Management", code: "KCS501", semester: 5, resources: 142, color: "coral" },
  { name: "Computer Networks", code: "KCS603", semester: 6, resources: 108, color: "violet" },
  { name: "Machine Learning", code: "KCS071", semester: 7, resources: 87, color: "cyan" },
];

export const resourceTypes = [
  "CT Papers", "Semester Papers", "PYQs", "Handwritten Notes", "Assignments",
  "Important Questions", "Quantum / Question Banks", "Practical / Lab", "Lab Manuals",
  "Viva Questions", "Project Material", "Internship Material", "Study Material", "Other",
];

export const resources: Resource[] = [
  { id: "data-structures-handwritten-notes", title: "Data Structures — Complete Handwritten Notes", type: "Handwritten Notes", subject: "Data Structures", code: "KCS301", branch: "CSE", semester: 3, contributor: "Aarav Sharma", date: "18 Sep 2026", views: 2840, downloads: 946, helpful: 318, pages: 84, description: "Clear, exam-focused notes covering arrays, linked lists, stacks, queues, trees, graphs and sorting techniques." },
  { id: "dbms-pyq-solved", title: "DBMS Solved PYQs 2021–2025", type: "PYQs", subject: "Database Management", code: "KCS501", branch: "CSE", semester: 5, contributor: "Tanishq Gupta", date: "14 Sep 2026", views: 1926, downloads: 703, helpful: 251, pages: 42, description: "Four years of AKTU database questions with concise, step-by-step solutions and repeated topics marked." },
  { id: "operating-system-quantum", title: "Operating System Exam Quantum", type: "Quantum / Question Banks", subject: "Operating Systems", code: "KCS401", branch: "IT", semester: 4, contributor: "Mehak Verma", date: "11 Sep 2026", views: 1532, downloads: 518, helpful: 194, pages: 66, description: "Unit-wise important questions, key definitions and last-minute revision prompts for the AKTU examination." },
  { id: "computer-networks-ct2", title: "Computer Networks CT-2 Paper", type: "CT Papers", subject: "Computer Networks", code: "KCS603", branch: "CSE", semester: 6, contributor: "Rohan Singh", date: "08 Sep 2026", views: 884, downloads: 337, helpful: 116, pages: 6, description: "Recent second class-test paper covering transport layer, congestion control and application protocols." },
  { id: "machine-learning-lab", title: "Machine Learning Lab Manual", type: "Lab Manuals", subject: "Machine Learning", code: "KCS071", branch: "AIML", semester: 7, contributor: "Ananya Jain", date: "02 Sep 2026", views: 1108, downloads: 429, helpful: 168, pages: 58, description: "Complete practical manual with Python experiments, observations and viva-ready explanations." },
  { id: "discrete-important-questions", title: "Discrete Structures Important Questions", type: "Important Questions", subject: "Discrete Structures", code: "KCS303", branch: "CSE", semester: 3, contributor: "Devansh Kumar", date: "28 Aug 2026", views: 1364, downloads: 482, helpful: 207, pages: 24, description: "Curated unit-wise questions based on recurring AKTU patterns and recent class assessments." },
];

export const notifications = [
  { id: 1, title: "Your resource was approved", text: "DBMS Solved PYQs is now live in the library.", time: "12 min ago", unread: true },
  { id: 2, title: "New material for KCS603", text: "A new Computer Networks CT paper was added.", time: "2 hours ago", unread: true },
  { id: 3, title: "Resource milestone", text: "Your shared resources crossed 1,000 downloads.", time: "Yesterday", unread: false },
  { id: 4, title: "Contribution under review", text: "Your Operating System notes are being reviewed.", time: "2 days ago", unread: false },
];

export const formatCount = (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);