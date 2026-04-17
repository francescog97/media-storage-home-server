$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$planPath = Join-Path $repoRoot 'site\data\d-drive-rename-plan.json'
$jsonOut = Join-Path $repoRoot 'site\data\d-drive-rename-execution.json'
$mdOut = Join-Path $repoRoot 'd-drive-rename-execution.md'

if (-not (Test-Path -LiteralPath $planPath)) {
  throw "Rename plan not found: $planPath"
}

$plan = Get-Content -LiteralPath $planPath -Raw | ConvertFrom-Json

function Rename-WithCaseSupport {
  param(
    [Parameter(Mandatory = $true)][string]$SourcePath,
    [Parameter(Mandatory = $true)][string]$TargetPath
  )

  $sourceItem = Get-Item -LiteralPath $SourcePath
  $targetDir = Split-Path $TargetPath -Parent
  $targetLeaf = Split-Path $TargetPath -Leaf

  if (-not $SourcePath.StartsWith('D:\', [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Source path outside expected drive: $SourcePath"
  }
  if (-not $TargetPath.StartsWith('D:\', [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Target path outside expected drive: $TargetPath"
  }
  if (-not (Test-Path -LiteralPath $targetDir)) {
    throw "Target directory not found: $targetDir"
  }

  if ($SourcePath -ieq $TargetPath) {
    if ($SourcePath -ceq $TargetPath) {
      return 'already_correct'
    }

    $tempLeaf = '{0}.__rename_tmp__{1}' -f [System.IO.Path]::GetFileNameWithoutExtension($targetLeaf), [System.IO.Path]::GetExtension($targetLeaf)
    $tempPath = Join-Path $targetDir $tempLeaf
    if (Test-Path -LiteralPath $tempPath) {
      throw "Temporary path already exists: $tempPath"
    }

    Rename-Item -LiteralPath $SourcePath -NewName $tempLeaf
    Rename-Item -LiteralPath $tempPath -NewName $targetLeaf
    return 'renamed_case_only'
  }

  if (Test-Path -LiteralPath $TargetPath) {
    throw "Target already exists: $TargetPath"
  }

  Rename-Item -LiteralPath $SourcePath -NewName $targetLeaf
  return 'renamed'
}

$results = New-Object 'System.Collections.Generic.List[object]'

foreach ($entry in @($plan.episodePlan)) {
  if ($entry.action -ne 'rename') {
    continue
  }

  if (-not (Test-Path -LiteralPath $entry.currentPath)) {
    if (Test-Path -LiteralPath $entry.proposedPath) {
      $results.Add([PSCustomObject]@{
        type = 'episode'
        source = $entry.currentPath
        target = $entry.proposedPath
        status = 'already_applied'
        note = 'Source missing but target already exists.'
      })
      continue
    }

    $results.Add([PSCustomObject]@{
      type = 'episode'
      source = $entry.currentPath
      target = $entry.proposedPath
      status = 'missing_source'
      note = 'Source file not found at execution time.'
    })
    continue
  }

  $status = Rename-WithCaseSupport -SourcePath $entry.currentPath -TargetPath $entry.proposedPath
  $results.Add([PSCustomObject]@{
    type = 'episode'
    source = $entry.currentPath
    target = $entry.proposedPath
    status = $status
    note = $entry.reason
  })
}

foreach ($entry in @($plan.extrasPlan)) {
  if ($entry.action -ne 'rename') {
    continue
  }

  $targetPath = Join-Path (Split-Path $entry.currentPath -Parent) $entry.recommendedName

  if (-not (Test-Path -LiteralPath $entry.currentPath)) {
    if (Test-Path -LiteralPath $targetPath) {
      $results.Add([PSCustomObject]@{
        type = 'extra'
        source = $entry.currentPath
        target = $targetPath
        status = 'already_applied'
        note = 'Source missing but target already exists.'
      })
      continue
    }

    $results.Add([PSCustomObject]@{
      type = 'extra'
      source = $entry.currentPath
      target = $targetPath
      status = 'missing_source'
      note = 'Source file not found at execution time.'
    })
    continue
  }

  $status = Rename-WithCaseSupport -SourcePath $entry.currentPath -TargetPath $targetPath
  $results.Add([PSCustomObject]@{
    type = 'extra'
    source = $entry.currentPath
    target = $targetPath
    status = $status
    note = $entry.reason
  })
}

$summary = [PSCustomObject]@{
  totalActions = $results.Count
  renamed = @($results | Where-Object { $_.status -like 'renamed*' }).Count
  alreadyApplied = @($results | Where-Object { $_.status -in @('already_correct', 'already_applied') }).Count
  missingSource = @($results | Where-Object { $_.status -eq 'missing_source' }).Count
}

$resultArray = foreach ($entry in $results) { $entry }

$payload = [PSCustomObject]@{
  generatedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
  summary = $summary
  results = $resultArray
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($jsonOut, ($payload | ConvertTo-Json -Depth 6), $utf8)

$lines = New-Object 'System.Collections.Generic.List[string]'
$lines.Add('# D Drive Rename Execution')
$lines.Add('')
$lines.Add(('Generated: {0}' -f $payload.generatedAt))
$lines.Add('')
$lines.Add('## Summary')
$lines.Add('')
$lines.Add(('- Total actions: {0}' -f $summary.totalActions))
$lines.Add(('- Renamed: {0}' -f $summary.renamed))
$lines.Add(('- Already applied: {0}' -f $summary.alreadyApplied))
$lines.Add(('- Missing source: {0}' -f $summary.missingSource))
$lines.Add('')
$lines.Add('## Results')
$lines.Add('')
foreach ($entry in $resultArray) {
  $lines.Add(('- [{0}] `{1}` -> `{2}`' -f $entry.status, $entry.source, $entry.target))
}
[System.IO.File]::WriteAllLines($mdOut, $lines, $utf8)

Write-Output ('JSON=' + $jsonOut)
Write-Output ('MARKDOWN=' + $mdOut)
Write-Output ('RENAMED=' + $summary.renamed)
Write-Output ('ALREADY=' + $summary.alreadyApplied)
Write-Output ('MISSING=' + $summary.missingSource)
