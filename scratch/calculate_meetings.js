const fs = require('fs');

const startDate = new Date('2026-01-03');
const endDate = new Date('2026-06-02');

// Schedule maps: day index (0 = Sunday/Ahad, 1 = Monday/Senin, ..., 6 = Saturday/Sabtu)
// and times of day. We'll list all occurrences of each subject.
const schedule = {
  'alfiyah': [
    { day: 0, time: 'Pagi' }, // Ahad Pagi
    { day: 3, time: 'Pagi' }  // Rabu Pagi
  ],
  'Fathul muin': [
    { day: 1, time: 'Pagi' }, // Senin Pagi
    { day: 2, time: 'Pagi' }, // Selasa Pagi
    { day: 4, time: 'Pagi' }  // Kamis Pagi
  ],
  'Idohul qowaid': [
    { day: 6, time: 'Pagi' }  // Sabtu Pagi
  ],
  'Sulamul munawroq': [
    { day: 0, time: 'Sore' }  // Ahad Sore
  ],
  'waraqat': [
    { day: 0, time: 'Malam' } // Ahad Malam
  ],
  'mafahim': [
    { day: 1, time: 'Malam' } // Senin Malam
  ]
};

const meetingsCount = {};
const meetingDates = {};

for (const key in schedule) {
  meetingsCount[key] = 0;
  meetingDates[key] = [];
}

let currentDate = new Date(startDate);
while (currentDate <= endDate) {
  const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  for (const subject in schedule) {
    const sessions = schedule[subject];
    for (const session of sessions) {
      if (session.day === dayOfWeek) {
        meetingsCount[subject]++;
        meetingDates[subject].push({
          date: currentDate.toISOString().split('T')[0],
          dayName: ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dayOfWeek],
          time: session.time,
          meetingNum: meetingsCount[subject]
        });
      }
    }
  }
  
  // Move to next day
  currentDate.setDate(currentDate.getDate() + 1);
}

console.log("=== MEETING COUNTS FROM 2026-01-03 to 2026-06-02 ===");
for (const subject in meetingsCount) {
  console.log(`${subject}: ${meetingsCount[subject]} meetings`);
}

fs.writeFileSync('d:/project/kelas/scratch/calculated_meetings.json', JSON.stringify(meetingDates, null, 2));
console.log("Calculated meetings saved to scratch/calculated_meetings.json");
