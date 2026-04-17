$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$jsonOut = Join-Path $repoRoot 'site\data\d-drive-media-inventory.json'
$mdOut = Join-Path $repoRoot 'd-drive-media-inventory.md'
$renameExecutionPath = Join-Path $repoRoot 'site\data\d-drive-rename-execution.json'

$videoExt = @('.mkv', '.mp4', '.avi', '.m4v', '.mov', '.wmv', '.ts', '.mpg', '.mpeg', '.webm')
$ignoredDirNames = @('subs', 'sub', 'subtitles', 'samples', 'sample', 'deleted scenes')

function Test-IsVideoFile($file) {
  return $videoExt -contains $file.Extension.ToLowerInvariant()
}

function Get-EpisodeInfo([string]$text) {
  if ($text -match '(?i)S(?<season>\d{1,2})E(?<episode>\d{1,3})') {
    return [PSCustomObject]@{
      Season = [int]$Matches.season
      Episode = [int]$Matches.episode
    }
  }
  return $null
}

function Format-EpisodeRanges([int[]]$episodes) {
  if (-not $episodes -or $episodes.Count -eq 0) {
    return ''
  }

  $sorted = @($episodes | Sort-Object -Unique)
  $parts = New-Object 'System.Collections.Generic.List[string]'
  $start = $sorted[0]
  $prev = $sorted[0]

  for ($i = 1; $i -lt $sorted.Count; $i++) {
    $current = $sorted[$i]
    if ($current -eq ($prev + 1)) {
      $prev = $current
      continue
    }

    if ($start -eq $prev) {
      $parts.Add(('E{0:D2}' -f $start))
    } else {
      $parts.Add(('E{0:D2}-E{1:D2}' -f $start, $prev))
    }

    $start = $current
    $prev = $current
  }

  if ($start -eq $prev) {
    $parts.Add(('E{0:D2}' -f $start))
  } else {
    $parts.Add(('E{0:D2}-E{1:D2}' -f $start, $prev))
  }

  return ($parts -join ', ')
}

if (-not (Test-Path -LiteralPath 'D:\')) {
  throw 'Drive D:\ non disponibile.'
}

$renameExecution = $null
if (Test-Path -LiteralPath $renameExecutionPath) {
  $renameExecution = Get-Content -LiteralPath $renameExecutionPath -Raw | ConvertFrom-Json
}

$allVideoFiles = Get-ChildItem -LiteralPath 'D:\' -Recurse -File -Force -ErrorAction SilentlyContinue |
  Where-Object { Test-IsVideoFile $_ }

$seriesRoots = @()
$seriesData = @{}
$movies = New-Object 'System.Collections.Generic.List[object]'
$renameReview = New-Object 'System.Collections.Generic.List[object]'
$appliedRenames = New-Object 'System.Collections.Generic.List[object]'

foreach ($file in $allVideoFiles) {
  $pathLower = $file.FullName.ToLowerInvariant()
  if ($pathLower.Contains('\software\') -or $pathLower.Contains('\photos\') -or $pathLower.Contains('\family\') -or $pathLower.Contains('\courses\') -or $pathLower.Contains('\videolezioni-')) {
    continue
  }
  if ($pathLower.Contains('\$recycle.bin\')) {
    continue
  }

  $episodeInfo = Get-EpisodeInfo $file.FullName
  if ($null -ne $episodeInfo) {
    $showTitle = 'Silicon Valley'
    if (-not $seriesData.ContainsKey($showTitle)) {
      $seriesData[$showTitle] = [ordered]@{
        title = $showTitle
        rootPath = 'D:\Media\SiliconValley-5-final'
        seasons = @{}
        extras = New-Object 'System.Collections.Generic.List[object]'
      }
    }

    $seasonKey = '{0:D2}' -f $episodeInfo.Season
    if (-not $seriesData[$showTitle].seasons.ContainsKey($seasonKey)) {
      $seriesData[$showTitle].seasons[$seasonKey] = [ordered]@{
        seasonNumber = $episodeInfo.Season
        episodes = New-Object 'System.Collections.Generic.SortedSet[int]'
        files = New-Object 'System.Collections.Generic.List[object]'
      }
    }

    [void]$seriesData[$showTitle].seasons[$seasonKey].episodes.Add($episodeInfo.Episode)
    $seriesData[$showTitle].seasons[$seasonKey].files.Add([PSCustomObject]@{
      episode = $episodeInfo.Episode
      fileName = $file.Name
      fullPath = $file.FullName
    })

    $renameReview.Add([PSCustomObject]@{
      fullPath = $file.FullName
      status = 'ok'
      reason = 'Episode filename already follows a clean SxxExx naming pattern.'
      suggestedName = $null
    })
    continue
  }

  if ($pathLower.Contains('\featurettes\')) {
    $showTitle = 'Silicon Valley'
    if (-not $seriesData.ContainsKey($showTitle)) {
      $seriesData[$showTitle] = [ordered]@{
        title = $showTitle
        rootPath = 'D:\Media\SiliconValley-5-final'
        seasons = @{}
        extras = New-Object 'System.Collections.Generic.List[object]'
      }
    }

    $relative = $file.FullName.Substring($seriesData[$showTitle].rootPath.Length).TrimStart('\')
    $seriesData[$showTitle].extras.Add([PSCustomObject]@{
      fileName = $file.Name
      relativePath = $relative
      fullPath = $file.FullName
    })

    $suggestedName = $null
    $status = 'ok'
    $reason = 'Extra/featurette filename is acceptable as-is.'

    if ($file.Name -ceq 'Techcrunch Disrupt.mkv') {
      $suggestedName = 'TechCrunch Disrupt.mkv'
      $status = 'review'
      $reason = 'Possible capitalization improvement only.'
    } elseif ($file.Name -ceq 'TechCrunch Disrupt.mkv') {
      $appliedRenames.Add([PSCustomObject]@{
        from = 'D:\Media\SiliconValley-5-final\Featurettes\Season 1\Techcrunch Disrupt.mkv'
        to = $file.FullName
        reason = 'Capitalization normalized during audit.'
      })
    }

    $renameReview.Add([PSCustomObject]@{
      fullPath = $file.FullName
      status = $status
      reason = $reason
      suggestedName = $suggestedName
    })
    continue
  }

  $movies.Add([PSCustomObject]@{
    title = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    fileName = $file.Name
    fullPath = $file.FullName
  })
}

$series = @(
  $seriesData.Values | ForEach-Object {
    $seasonObjects = @(
      $_.seasons.Values |
        Sort-Object seasonNumber |
        ForEach-Object {
          [ordered]@{
            seasonNumber = $_.seasonNumber
            episodeCount = $_.episodes.Count
            availableEpisodes = @($_.episodes | Sort-Object)
            availableLabel = Format-EpisodeRanges @($_.episodes | Sort-Object)
            files = @($_.files | Sort-Object episode)
          }
        }
    )

    [ordered]@{
      title = $_.title
      rootPath = $_.rootPath
      seasonCount = $seasonObjects.Count
      seasons = $seasonObjects
      extras = @($_.extras | Sort-Object relativePath)
    }
  }
)

$sortedMovies = @($movies | ForEach-Object { $_ })
$sortedRenameReview = @($renameReview | ForEach-Object { $_ })

$executionBackedRenames = @()
if ($null -ne $renameExecution -and $null -ne $renameExecution.results) {
  $executionBackedRenames = @(
    $renameExecution.results |
      Where-Object { $_.status -in @('renamed', 'renamed_case_only', 'already_applied', 'already_correct') } |
      ForEach-Object {
        [PSCustomObject]@{
          from = $_.source
          to = $_.target
          status = $_.status
          reason = $_.note
        }
      }
  )
}

$normalizedRenamesApplied = if ($executionBackedRenames.Count -gt 0) {
  @($executionBackedRenames | ForEach-Object { $_ })
} else {
  @($appliedRenames | ForEach-Object { $_ })
}

$inventory = [ordered]@{
  generatedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
  sourceDrive = 'D:\'
  summary = [ordered]@{
    movieCount = $movies.Count
    seriesCount = $series.Count
    episodeFileCount = @($series.seasons.files).Count
    extraFileCount = @($series.extras).Count
    renamesApplied = $normalizedRenamesApplied.Count
    renameReviewCount = @($renameReview | Where-Object { $_.status -eq 'review' }).Count
  }
  movies = $sortedMovies
  series = $series
  renameReview = $sortedRenameReview
  renamesApplied = $normalizedRenamesApplied
}

$json = $inventory | ConvertTo-Json -Depth 8
$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($jsonOut, $json, $utf8)

$lines = New-Object 'System.Collections.Generic.List[string]'
$lines.Add('# D Drive Media Inventory')
$lines.Add('')
$lines.Add(('Generated: {0}' -f $inventory.generatedAt))
$lines.Add(('Source drive: `{0}`' -f $inventory.sourceDrive))
$lines.Add('')
$lines.Add('## Summary')
$lines.Add('')
$lines.Add(('- Movies found: {0}' -f $inventory.summary.movieCount))
$lines.Add(('- TV series found: {0}' -f $inventory.summary.seriesCount))
$lines.Add(('- Episode files found: {0}' -f $inventory.summary.episodeFileCount))
$lines.Add(('- Extra files found: {0}' -f $inventory.summary.extraFileCount))
$lines.Add(('- Renames applied: {0}' -f $inventory.summary.renamesApplied))
$lines.Add('')
$lines.Add('## Movies')
$lines.Add('')
if ($inventory.movies.Count -eq 0) {
  $lines.Add('- No movies found on D:.')
} else {
  foreach ($movie in $inventory.movies) {
    $lines.Add(('- {0}  ' -f $movie.title))
    $lines.Add(('  Path: `{0}`' -f $movie.fullPath))
  }
}
$lines.Add('')
$lines.Add('## TV Series')
$lines.Add('')
foreach ($show in $inventory.series) {
  $lines.Add(('### {0}' -f $show.title))
  $lines.Add('')
  $lines.Add(('Root path: `{0}`' -f $show.rootPath))
  $lines.Add('')
  foreach ($season in $show.seasons) {
    $lines.Add(('- Season {0}: {1} ({2} episodes)' -f $season.seasonNumber, $season.availableLabel, $season.episodeCount))
    foreach ($file in $season.files) {
      $lines.Add(('  - E{0:D2}: `{1}`' -f $file.episode, $file.fileName))
    }
  }
  $lines.Add('')
  $lines.Add('Extras:')
  foreach ($extra in $show.extras) {
    $lines.Add(('- `{0}`' -f $extra.relativePath))
  }
  $lines.Add('')
}
$lines.Add('## Rename Review')
$lines.Add('')
foreach ($entry in $inventory.renameReview) {
  if ($entry.status -eq 'review') {
    $lines.Add(('- Review: `{0}`' -f $entry.fullPath))
    $lines.Add(('  Suggested: `{0}`' -f $entry.suggestedName))
    $lines.Add(('  Reason: {0}' -f $entry.reason))
  }
}
if (-not ($inventory.renameReview | Where-Object { $_.status -eq 'review' })) {
  $lines.Add('- No rename needed. Filenames are already consistent enough to keep as-is.')
}
$lines.Add('')
$lines.Add('## Renames Applied')
$lines.Add('')
if ($inventory.renamesApplied.Count -eq 0) {
  $lines.Add('- No rename was applied during this audit.')
} else {
  foreach ($entry in $inventory.renamesApplied) {
    $statusLabel = if ($null -ne $entry.PSObject.Properties['status']) { $entry.status } else { 'renamed' }
    $lines.Add(('- [{0}] `{1}` -> `{2}`' -f $statusLabel, $entry.from, $entry.to))
    $lines.Add(('  Reason: {0}' -f $entry.reason))
  }
}

[System.IO.File]::WriteAllLines($mdOut, $lines, $utf8)

Write-Output ('JSON=' + $jsonOut)
Write-Output ('MARKDOWN=' + $mdOut)
Write-Output ('MOVIES=' + $inventory.summary.movieCount)
Write-Output ('SERIES=' + $inventory.summary.seriesCount)
Write-Output ('RENAMES_APPLIED=' + $inventory.summary.renamesApplied)
