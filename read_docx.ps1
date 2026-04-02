Add-Type -AssemblyName 'System.IO.Compression.FileSystem'
$zip = [System.IO.Compression.ZipFile]::OpenRead('c:\Users\SB1\Desktop\focus\focus_coach_app_projektiohjeistus.docx')
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()
# Remove XML tags and get text
$text = $content -replace '<[^>]+>', ' '
$text = $text -replace '\s+', ' '
$text | Out-File -FilePath 'c:\Users\SB1\Desktop\focus\docx_content.txt' -Encoding UTF8
Write-Host "Done - saved to docx_content.txt"
