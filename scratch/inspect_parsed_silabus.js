const fs = require('fs');

let fileContent = fs.readFileSync('d:/project/kelas/scratch/parsed_silabus.json', 'utf8');
// Strip BOM if present
fileContent = fileContent.replace(/^\uFEFF/, '');

const parsed = JSON.parse(fileContent);

console.log("=== SYLLABUS FILES INFO ===");
for (const filename in parsed) {
  const data = parsed[filename];
  const meetings = data.Meetings;
  
  // Find unique MeetingNums or max meeting num
  const meetingNums = meetings.map(m => m.MeetingNum).filter(Boolean);
  const maxMeetingNum = meetingNums.reduce((max, val) => {
    // extract digits
    const num = parseInt(val.replace(/\D/g, ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  
  console.log(`File: ${filename}`);
  console.log(`  Subject: ${data.MataKuliah}`);
  console.log(`  Semester: ${data.Semester}`);
  console.log(`  Rows in table: ${meetings.length}`);
  console.log(`  Max Meeting Num parsed: ${maxMeetingNum}`);
}
