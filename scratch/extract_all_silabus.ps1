$word = New-Object -ComObject Word.Application
$word.Visible = $false

$files = Get-ChildItem "d:\project\kelas\upload\*.docx"
$allSilabus = @{}

foreach ($file in $files) {
    if ($file.Name -eq "jadwal semester 2.docx") { continue }
    Write-Output "Extracting $($file.Name)..."
    
    $doc = $word.Documents.Open($file.FullName)
    $text = $doc.Content.Text
    
    # Get metadata from text
    $mataKuliah = ""
    $semester = ""
    
    # Simple regex parsing for Mata Kuliah and Semester
    if ($text -match "Mata Kuliah\s*:\s*([^\r\n]+)") {
        $mataKuliah = $Matches[1].Trim()
    }
    if ($text -match "Semester\s*:\s*([^\r\n]+)") {
        $semester = $Matches[1].Trim()
    }
    
    if (!$mataKuliah) {
        # Fallback to file name
        $mataKuliah = $file.BaseName.Replace("2. SILABUS MATA KULIAH ", "").Replace("SILABUS MATA KULIAH ", "").Replace(" SMT 2", "").Replace(" SMT  2", "").Replace(" SMT 3", "").Trim()
    }
    
    # Extract syllabus table rows
    $meetings = @()
    $tables = $doc.Tables
    if ($tables.Count -ge 1) {
        $table = $tables.Item(1)
        
        $currentMeetingNum = 0
        $currentMateriPokok = ""
        $currentReferensi = ""
        
        for ($r = 2; $r -le $table.Rows.Count; $r++) {
            try {
                $cellMeeting = $table.Cell($r, 1).Range.Text.TrimEnd([char]7, [char]13).Trim()
                $cellMateriPokok = $table.Cell($r, 2).Range.Text.TrimEnd([char]7, [char]13).Trim()
                $cellSubMateri = $table.Cell($r, 3).Range.Text.TrimEnd([char]7, [char]13).Trim()
                $cellReferensi = ""
                if ($table.Columns.Count -ge 4) {
                    $cellReferensi = $table.Cell($r, 4).Range.Text.TrimEnd([char]7, [char]13).Trim()
                }
                
                # Handle merged cells or empty cell in meeting number
                # In Word table, merged cells might throw an error or return empty/special chars.
                # If meeting number is empty or MERGED, we carry over the previous meeting number
                if ($cellMeeting -and $cellMeeting -notmatch "MERGED" -and $cellMeeting -ne "") {
                    # Try to parse meeting number, or use it directly
                    # Sometimes it says "1" or "2"
                    $currentMeetingNum = $cellMeeting
                }
                
                if ($cellMateriPokok -and $cellMateriPokok -notmatch "MERGED" -and $cellMateriPokok -ne "") {
                    $currentMateriPokok = $cellMateriPokok
                }
                
                if ($cellReferensi -and $cellReferensi -notmatch "MERGED" -and $cellReferensi -ne "") {
                    $currentReferensi = $cellReferensi
                }
                
                $meetings += [PSCustomObject]@{
                    RowIndex = $r
                    MeetingInput = $cellMeeting
                    MeetingNum = $currentMeetingNum
                    MateriPokok = $currentMateriPokok
                    SubMateri = $cellSubMateri
                    Referensi = $currentReferensi
                }
            } catch {
                # Handle errors due to cell merging
                $meetings += [PSCustomObject]@{
                    RowIndex = $r
                    Error = $_.Exception.Message
                }
            }
        }
    }
    
    $allSilabus[$file.Name] = @{
        FileName = $file.Name
        MataKuliah = $mataKuliah
        Semester = $semester
        Meetings = $meetings
    }
    
    $doc.Close($false)
}

$word.Quit()

# Output all as JSON
$allSilabus | ConvertTo-Json -Depth 10 | Out-File "d:\project\kelas\scratch\extracted_silabus.json" -Encoding utf8
Write-Output "Extraction complete. Saved to scratch\extracted_silabus.json"
