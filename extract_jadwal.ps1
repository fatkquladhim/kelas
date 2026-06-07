$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open("d:\project\kelas\upload\jadwal semester 2.docx")

# Get all text
$text = $doc.Content.Text
Write-Output "=== FULL TEXT ==="
Write-Output $text

# Get tables
$tables = $doc.Tables
Write-Output "`n=== TABLES: $($tables.Count) ==="

for ($t = 1; $t -le $tables.Count; $t++) {
    Write-Output "`n--- TABLE $t ---"
    $table = $tables.Item($t)
    for ($r = 1; $r -le $table.Rows.Count; $r++) {
        $rowText = ""
        for ($c = 1; $c -le $table.Columns.Count; $c++) {
            try {
                $cellText = $table.Cell($r, $c).Range.Text
                $cellText = $cellText.TrimEnd([char]7, [char]13)
                $rowText += $cellText + " | "
            } catch {
                $rowText += "MERGED | "
            }
        }
        Write-Output $rowText
    }
}

$doc.Close($false)
$word.Quit()
