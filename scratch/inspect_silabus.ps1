$word = New-Object -ComObject Word.Application
$word.Visible = $false

$files = Get-ChildItem "d:\project\kelas\upload\*.docx"
foreach ($file in $files) {
    if ($file.Name -eq "jadwal semester 2.docx") { continue }
    Write-Output "========================================="
    Write-Output "FILE: $($file.Name)"
    Write-Output "========================================="
    $doc = $word.Documents.Open($file.FullName)
    
    # Let's print the first 2000 characters of text
    $text = $doc.Content.Text
    if ($text.Length -gt 2000) {
        Write-Output $text.Substring(0, 2000)
        Write-Output "... [TRUNCATED]"
    } else {
        Write-Output $text
    }
    
    # Let's see how many tables it has
    $tables = $doc.Tables
    Write-Output "`nTables: $($tables.Count)"
    for ($t = 1; $t -le [Math]::Min($tables.Count, 2); $t++) {
        Write-Output "--- TABLE $t ---"
        $table = $tables.Item($t)
        # print first 5 rows
        for ($r = 1; $r -le [Math]::Min($table.Rows.Count, 20); $r++) {
            $rowText = ""
            for ($c = 1; $c -le [Math]::Min($table.Columns.Count, 10); $c++) {
                try {
                    $cellText = $table.Cell($r, $c).Range.Text
                    $cellText = $cellText.TrimEnd([char]7, [char]13).Replace("`r", " ").Replace("`n", " ")
                    $rowText += $cellText + " | "
                } catch {
                    $rowText += "MERGED | "
                }
            }
            Write-Output $rowText
        }
    }
    
    $doc.Close($false)
}

$word.Quit()
