# Load assembly for ZipArchive
Add-Type -AssemblyName System.IO.Compression.FileSystem

$uploadDir = "d:\project\kelas\upload"
$scratchDir = "d:\project\kelas\scratch"
$outputFile = "$scratchDir\parsed_silabus.json"

$files = Get-ChildItem "$uploadDir\*.docx"
$allData = @{}

foreach ($file in $files) {
    if ($file.Name -eq "jadwal semester 2.docx") { continue }
    Write-Output "Processing Docx: $($file.Name)..."
    
    # Open the zip archive
    $zip = [System.IO.Compression.ZipFile]::OpenRead($file.FullName)
    $entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
    
    if (-not $entry) {
        Write-Output "No word/document.xml found in $($file.Name)"
        $zip.Dispose()
        continue
    }
    
    # Extract the XML content
    $stream = $entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xmlText = $reader.ReadToEnd()
    $reader.Dispose()
    $stream.Dispose()
    $zip.Dispose()
    
    # Parse as XML
    $xml = [xml]$xmlText
    
    # Setup namespace manager
    $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
    $ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
    
    # Let's get the document text first for metadata
    $allParagraphs = $xml.SelectNodes("//w:p", $ns)
    $fullText = ""
    foreach ($p in $allParagraphs) {
        $pText = ""
        $runs = $p.SelectNodes(".//w:t", $ns)
        foreach ($r in $runs) {
            $pText += $r.InnerText
        }
        if ($pText.Trim()) {
            $fullText += $pText.Trim() + "`n"
        }
    }
    
    # Extract Metadata
    $mataKuliah = ""
    $semester = ""
    
    if ($fullText -match "Mata Kuliah\s*:\s*([^\r\n]+)") {
        $mataKuliah = $Matches[1].Trim()
    }
    if ($fullText -match "Semester\s*:\s*([^\r\n]+)") {
        $semester = $Matches[1].Trim()
    }
    
    if (!$mataKuliah) {
        # Fallback to clean filename
        $mataKuliah = $file.BaseName.Replace("2. SILABUS MATA KULIAH ", "").Replace("SILABUS MATA KULIAH ", "").Replace(" SMT 2", "").Replace(" SMT  2", "").Replace(" SMT 3", "").Trim()
    }
    
    # Find tables
    $tables = $xml.SelectNodes("//w:tbl", $ns)
    $meetings = @()
    
    if ($tables.Count -gt 0) {
        # We usually care about the first table for the syllabus matrix
        $table = $tables[0]
        $rows = $table.SelectNodes("w:tr", $ns)
        
        $currentMeetingNum = ""
        $currentMateriPokok = ""
        $currentReferensi = ""
        
        # Skip the header row (usually row 0)
        for ($rIdx = 1; $rIdx -lt $rows.Count; $rIdx++) {
            $row = $rows[$rIdx]
            $cells = $row.SelectNodes("w:tc", $ns)
            
            if ($cells.Count -lt 3) { continue }
            
            # Helper function to get text of a cell
            filter Get-CellText {
                $c = $_
                $txt = ""
                $runs = $c.SelectNodes(".//w:t", $ns)
                foreach ($run in $runs) {
                    $txt += $run.InnerText
                }
                $txt.Trim()
            }
            
            $cellMeeting = ($cells[0] | Get-CellText)
            $cellMateriPokok = ($cells[1] | Get-CellText)
            $cellSubMateri = ($cells[2] | Get-CellText)
            $cellReferensi = ""
            if ($cells.Count -ge 4) {
                $cellReferensi = ($cells[3] | Get-CellText)
            }
            
            # Check for grid span / merged cells or empty cells to carry forward
            if ($cellMeeting -and $cellMeeting -ne "") {
                $currentMeetingNum = $cellMeeting
            }
            if ($cellMateriPokok -and $cellMateriPokok -ne "") {
                $currentMateriPokok = $cellMateriPokok
            }
            if ($cellReferensi -and $cellReferensi -ne "") {
                $currentReferensi = $cellReferensi
            }
            
            # Skip rows that are header copies or completely blank
            if (!$cellMeeting -and !$cellMateriPokok -and !$cellSubMateri -and !$cellReferensi) {
                continue
            }
            
            # Keep row details
            $meetings += [PSCustomObject]@{
                MeetingNum = $currentMeetingNum
                MateriPokok = $currentMateriPokok
                SubMateri = $cellSubMateri
                Referensi = $currentReferensi
            }
        }
    }
    
    $allData[$file.Name] = @{
        FileName = $file.Name
        MataKuliah = $mataKuliah
        Semester = $semester
        Meetings = $meetings
    }
}

$allData | ConvertTo-Json -Depth 10 | Out-File $outputFile -Encoding utf8
Write-Output "Successfully parsed all syllabi. JSON saved to $outputFile"
