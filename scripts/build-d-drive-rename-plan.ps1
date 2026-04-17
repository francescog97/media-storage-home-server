$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$mdOut = Join-Path $repoRoot 'd-drive-rename-plan.md'
$jsonOut = Join-Path $repoRoot 'site\data\d-drive-rename-plan.json'

$showRoot = 'D:\Media\SiliconValley-5-final'
if (-not (Test-Path -LiteralPath $showRoot)) {
  throw 'Expected Silicon Valley root not found on D:.'
}

$videoExt = @('.mkv', '.mp4', '.avi', '.m4v', '.mov', '.wmv', '.ts', '.mpg', '.mpeg', '.webm')

function Test-IsVideoFile($file) {
  return $videoExt -contains $file.Extension.ToLowerInvariant()
}

function Get-CleanEpisodeName($fileName) {
  $pattern = '^(?<series>.+?) \((?<year>\d{4})\) - S(?<season>\d{2})E(?<episode>\d{2}) - (?<title>.+?)(?: \([^)]*\))?\.(?<ext>[^.]+)$'
  $match = [regex]::Match($fileName, $pattern)
  if (-not $match.Success) {
    return $null
  }

  return '{0} ({1}) - S{2}E{3} - {4}.{5}' -f `
    $match.Groups['series'].Value.Trim(), `
    $match.Groups['year'].Value, `
    $match.Groups['season'].Value, `
    $match.Groups['episode'].Value, `
    $match.Groups['title'].Value.Trim(), `
    $match.Groups['ext'].Value
}

function Get-ExtraRecommendation($file) {
  $relative = $file.FullName.Substring($showRoot.Length).TrimStart('\')
  $seasonMatch = [regex]::Match($relative, '^Featurettes\\Season (?<season>\d+)\\', 'IgnoreCase')
  $seasonLabel = if ($seasonMatch.Success) { 'Season {0:D2}' -f [int]$seasonMatch.Groups['season'].Value } else { 'Extras' }
  $currentName = $file.Name

  if ($currentName -match '^Silicon Valley \(2014\) - Season \d{2} - .+\.[^.]+$') {
    $recommendedName = $currentName
  } else {
    $baseTitle = [System.IO.Path]::GetFileNameWithoutExtension($currentName)
    $recommendedName = 'Silicon Valley (2014) - {0} - {1}{2}' -f $seasonLabel, $baseTitle, $file.Extension
  }

  return [PSCustomObject]@{
    currentPath = $file.FullName
    currentName = $currentName
    recommendedName = $recommendedName
    action = $(if ($currentName -ceq $recommendedName) { 'keep' } else { 'rename' })
    reason = 'Extra/featurette: use Season NN naming instead of inventing fake SxxExx episode numbers.'
  }
}

$episodePlan = New-Object 'System.Collections.Generic.List[object]'
$extraPlan = New-Object 'System.Collections.Generic.List[object]'

$files = Get-ChildItem -LiteralPath $showRoot -Recurse -File -Force -ErrorAction SilentlyContinue |
  Where-Object { Test-IsVideoFile $_ } |
  Sort-Object FullName

foreach ($file in $files) {
  if ($file.FullName -like '*\Featurettes\*') {
    $extraPlan.Add((Get-ExtraRecommendation $file))
    continue
  }

  $cleanName = Get-CleanEpisodeName $file.Name
  if ($null -eq $cleanName) {
    $episodePlan.Add([PSCustomObject]@{
      currentPath = $file.FullName
      currentName = $file.Name
      proposedName = $null
      proposedPath = $null
      action = 'manual_review'
      reason = 'Filename could not be parsed reliably into series/year/season/episode/title.'
    })
    continue
  }

  $episodePlan.Add([PSCustomObject]@{
    currentPath = $file.FullName
    currentName = $file.Name
    proposedName = $cleanName
    proposedPath = (Join-Path $file.DirectoryName $cleanName)
    action = $(if ($file.Name -ceq $cleanName) { 'keep' } else { 'rename' })
    reason = $(if ($file.Name -ceq $cleanName) {
      'Already matches the target pattern.'
    } else {
      'Strip release/source metadata and keep only Series, Year, SxxExx, and Episode Title.'
    })
  })
}

$renameCandidates = @($episodePlan | Where-Object { $_.action -eq 'rename' })
$keepCandidates = @($episodePlan | Where-Object { $_.action -eq 'keep' })
$manualCandidates = @($episodePlan | Where-Object { $_.action -eq 'manual_review' })
$extraRenameCandidates = @($extraPlan | Where-Object { $_.action -eq 'rename' })
$extraKeepCandidates = @($extraPlan | Where-Object { $_.action -eq 'keep' })

$episodePlanArray = foreach ($entry in $episodePlan) { $entry }
$extraPlanArray = foreach ($entry in $extraPlan) { $entry }

$payload = [PSCustomObject]@{
  generatedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
  sourceRoot = $showRoot
  targetPattern = 'Series (Year) - SxxExx - Episode Title.ext'
  summary = [PSCustomObject]@{
    episodeFiles = $episodePlan.Count
    episodeRenamesPlanned = $renameCandidates.Count
    episodeFilesAlreadyCompliant = $keepCandidates.Count
    episodeFilesNeedingManualReview = $manualCandidates.Count
    extraRenamesPlanned = $extraRenameCandidates.Count
    extraFilesAlreadyCompliant = $extraKeepCandidates.Count
  }
  episodePlan = $episodePlanArray
  extrasPlan = $extraPlanArray
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($jsonOut, ($payload | ConvertTo-Json -Depth 8), $utf8)

$lines = New-Object 'System.Collections.Generic.List[string]'
$lines.Add('# D Drive Rename Plan')
$lines.Add('')
$lines.Add(('Generated: {0}' -f $payload.generatedAt))
$lines.Add(('Source root: `{0}`' -f $payload.sourceRoot))
$lines.Add(('Target episode pattern: `{0}`' -f $payload.targetPattern))
$lines.Add('')
$lines.Add('## Summary')
$lines.Add('')
$lines.Add(('- Episode files checked: {0}' -f $payload.summary.episodeFiles))
$lines.Add(('- Episode renames planned: {0}' -f $payload.summary.episodeRenamesPlanned))
$lines.Add(('- Episode files already compliant: {0}' -f $payload.summary.episodeFilesAlreadyCompliant))
$lines.Add(('- Episode files needing manual review: {0}' -f $payload.summary.episodeFilesNeedingManualReview))
$lines.Add(('- Extra renames planned: {0}' -f $payload.summary.extraRenamesPlanned))
$lines.Add(('- Extra files already compliant: {0}' -f $payload.summary.extraFilesAlreadyCompliant))
$lines.Add('')
$lines.Add('## Planned Episode Renames')
$lines.Add('')
if ($renameCandidates.Count -eq 0) {
  $lines.Add('- No episode rename required.')
} else {
  foreach ($entry in $renameCandidates) {
    $lines.Add(('- `{0}`' -f $entry.currentPath))
    $lines.Add(('  -> `{0}`' -f $entry.proposedPath))
  }
}
$lines.Add('')
$lines.Add('## Episode Files Already Compliant')
$lines.Add('')
if ($keepCandidates.Count -eq 0) {
  $lines.Add('- None.')
} else {
  foreach ($entry in $keepCandidates) {
    $lines.Add(('- `{0}`' -f $entry.currentPath))
  }
}
$lines.Add('')
$lines.Add('## Planned Extra Renames')
$lines.Add('')
$lines.Add('- Your requested episode pattern is used for real episodes.')
$lines.Add('- For extras/featurettes, the target convention is: `Silicon Valley (2014) - Season NN - Extra Title.ext`.')
$lines.Add('')
if ($extraRenameCandidates.Count -eq 0) {
  $lines.Add('- No extra rename required.')
} else {
  foreach ($entry in $extraRenameCandidates) {
    $lines.Add(('- `{0}`' -f $entry.currentPath))
    $lines.Add(('  -> `{0}`' -f (Join-Path (Split-Path $entry.currentPath -Parent) $entry.recommendedName)))
  }
}

[System.IO.File]::WriteAllLines($mdOut, $lines, $utf8)

Write-Output ('MARKDOWN=' + $mdOut)
Write-Output ('JSON=' + $jsonOut)
Write-Output ('EPISODE_RENAMES=' + $renameCandidates.Count)
Write-Output ('EPISODE_KEEP=' + $keepCandidates.Count)
Write-Output ('EXTRA_RENAMES=' + $extraRenameCandidates.Count)
