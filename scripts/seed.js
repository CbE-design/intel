require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  doc,
  setDoc,
  Timestamp,
} = require('firebase/firestore');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const subjects = [
  {
    id: 'S001',
    name: 'John Doe',
    idNumber: '8501015000080',
    address: '123 Main St, Johannesburg, 2000',
    phoneNumber: '+27 82 123 4567',
    avatarUrl: 'https://picsum.photos/seed/1/100/100',
    status: 'Clear',
    lastCheck: '2023-10-15',
  },
  {
    id: 'S002',
    name: 'Jane Smith',
    idNumber: '9203154001081',
    address: '456 Market St, Cape Town, 8001',
    phoneNumber: '+27 73 987 6543',
    avatarUrl: 'https://picsum.photos/seed/2/100/100',
    status: 'Review',
    lastCheck: '2024-01-20',
  },
  {
    id: 'S003',
    name: 'Sipho Williams',
    idNumber: '7911206002083',
    address: '789 Beach Rd, Durban, 4001',
    phoneNumber: '+27 61 555 1234',
    avatarUrl: 'https://picsum.photos/seed/3/100/100',
    status: 'Pending',
    lastCheck: '2024-05-01',
  },
  {
    id: 'S004',
    name: 'Thandi Johnson',
    idNumber: '9507053003085',
    address: '101 Church St, Pretoria, 0002',
    phoneNumber: '+27 84 111 2222',
    avatarUrl: 'https://picsum.photos/seed/4/100/100',
    status: 'Clear',
    lastCheck: '2023-12-05',
  },
  {
    id: 'S005',
    name: 'Michael Brown',
    idNumber: '8808085004088',
    address: '222 Long St, Port Elizabeth, 6001',
    phoneNumber: '+27 72 333 4444',
    avatarUrl: 'https://picsum.photos/seed/5/100/100',
    status: 'Review',
    lastCheck: '2024-03-30',
  },
];

const locations = {
  S001: [
    {
      lat: -26.2041,
      lng: 28.0473,
      timestamp: Timestamp.fromDate(new Date('2024-05-20T09:00:00Z')),
    },
    {
      lat: -26.1952,
      lng: 28.0363,
      timestamp: Timestamp.fromDate(new Date('2024-05-20T12:30:00Z')),
    },
    {
      lat: -26.2144,
      lng: 28.0512,
      timestamp: Timestamp.fromDate(new Date('2024-05-20T17:45:00Z')),
    },
  ],
  S002: [
    {
      lat: -33.9249,
      lng: 18.4241,
      timestamp: Timestamp.fromDate(new Date('2024-05-21T08:15:00Z')),
    },
    {
      lat: -33.918,
      lng: 18.4232,
      timestamp: Timestamp.fromDate(new_Date('2024-05-21T13:00:00Z')),
    },
  ],
  S003: [
    {
      lat: -29.8587,
      lng: 31.0218,
      timestamp: Timestamp.fromDate(new Date('2024-05-19T10:00:00Z')),
    },
  ],
  S004: [
    {
      lat: -25.7479,
      lng: 28.2293,
      timestamp: Timestamp.fromDate(new Date('2024-05-20T11:00:00Z')),
    },
    {
      lat: -25.7564,
      lng: 28.2361,
      timestamp: Timestamp.fromDate(new Date('2024-05-20T16:20:00Z')),
    },
  ],
  S005: [
    {
      lat: -33.9608,
      lng: 25.6022,
      timestamp: Timestamp.fromDate(new Date('2024-05-21T14:00:00Z')),
    },
  ],
};

async function seedData() {
  for (const subject of subjects) {
    const { id, ...subjectData } = subject;
    const subjectRef = doc(db, 'subject_profiles', id);
    await setDoc(subjectRef, {
      ...subjectData,
      lastCheck: Timestamp.fromDate(new Date(subjectData.lastCheck)),
    });

    if (locations[id]) {
      for (const location of locations[id]) {
        const locationRef = doc(
          collection(subjectRef, 'location_data')
        );
        await setDoc(locationRef, location);
      }
    }
  }
  console.log('Database seeded successfully');
}

seedData().catch((error) => {
  console.error('Error seeding database: ', error);
});
