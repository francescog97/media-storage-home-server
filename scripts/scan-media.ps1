$ErrorActionPreference = 'Stop'

$videoExt = @('.mkv', '.mp4', '.avi', '.m4v', '.mov', '.wmv', '.ts', '.mpg', '.mpeg', '.webm')
$ignoredDirNames = @('subs', 'sub', 'subtitles', 'samples', 'sample', 'deleted scenes', 'featurettes', 'extras', 'other')
$ignoredFilePattern = '(?i)\bsample\b|\btrailer\b|\bpreview\b'

$mediaCategoryRoots = @(
  @{ Name = 'Movies'; Tag = $null },
  @{ Name = 'Documentaries'; Tag = 'documentario' },
  @{ Name = 'Specials'; Tag = 'special' },
  @{ Name = 'Concerts'; Tag = 'concerto' },
  @{ Name = '[2categorize]'; Tag = 'da categorizzare' }
)

function Normalize-Title([string]$title) {
  $result = ($title -replace '[._]+', ' ') -replace '\s+', ' '
  $result = $result.Trim()
  $result = $result -replace '(?i)\b(?:2160p|1080p|720p|480p|blu[- ]?ray|brrip|web[- ]?dl|webrip|hdrip|dvdscr|telesync|cam|x264|x265|h264|hevc|aac|ac3|amzn|nf|dsnp|proper|rerip|galaxytv|ettv|tgx|syncup)\b.*$', ''
  $yearWithTail = [regex]::Match($result, '^(.*?)[\s._-]+((?:19|20)\d{2})\b(?:\s+v\d+)?(?:\s+.*)?$', 'IgnoreCase')
  if ($yearWithTail.Success -and $result -notmatch '\(\d{4}\)') {
    $result = '{0} ({1})' -f $yearWithTail.Groups[1].Value.Trim(), $yearWithTail.Groups[2].Value
  }
  return ($result -replace '\s{2,}', ' ').Trim()
}

function Test-IsVideoFile($file) {
  return $videoExt -contains $file.Extension.ToLowerInvariant()
}

function Test-IsIgnoredPath([string]$path) {
  foreach ($segment in ($path -split '\\')) {
    if ($ignoredDirNames -contains $segment.ToLowerInvariant()) {
      return $true
    }
  }
  return $false
}

function Test-IsIgnoredFile([string]$name) {
  return $name.StartsWith('._') -or $name -match $ignoredFilePattern
}

function Get-EpisodeInfo([string]$text) {
  $season = $null
  $episode = $null

  if ($text -match '(?i)S(?<season>\d{1,2})E(?<episode>\d{1,3})') {
    $season = [int]$Matches.season
    $episode = [int]$Matches.episode
  } elseif ($text -match '(?i)\b(?<season>\d{1,2})x(?<episode>\d{1,3})\b') {
    $season = [int]$Matches.season
    $episode = [int]$Matches.episode
  } elseif ($text -match '(?i)\bEP(?:ISODE)?[ ._-]?(?<episode>\d{1,3})\b') {
    $episode = [int]$Matches.episode
  }

  if ($null -eq $episode) {
    return $null
  }

  if ($null -eq $season) {
    if ($text -match '(?i)(?:Season|Stagione)[ ._-]?(?<season>\d{1,2})') {
      $season = [int]$Matches.season
    } elseif ($text -match '(?i)(?:^|\\)S(?<season>\d{1,2})(?:\\|$)') {
      $season = [int]$Matches.season
    }
  }

  return [PSCustomObject]@{
    Season  = $season
    Episode = $episode
  }
}

function New-TagSet() {
  return New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
}

function Get-MediaRoots() {
  return @(
    Get-PSDrive -PSProvider FileSystem |
      ForEach-Object {
        $candidate = Join-Path $_.Root 'Media'
        if (Test-Path -LiteralPath $candidate) {
          (Resolve-Path -LiteralPath $candidate).Path
        }
      } |
      Sort-Object -Unique
  )
}

$mediaRoots = Get-MediaRoots

$movieRoots = @(
  foreach ($mediaRoot in $mediaRoots) {
    foreach ($definition in $mediaCategoryRoots) {
      $categoryRoot = Join-Path $mediaRoot $definition.Name
      if (Test-Path -LiteralPath $categoryRoot) {
        @{
          Root = $categoryRoot
          Tag = $definition.Tag
        }
      }
    }
  }
)

$seriesRoots = @(
  foreach ($mediaRoot in $mediaRoots) {
    $seriesRoot = Join-Path $mediaRoot 'TV Shows'
    if (Test-Path -LiteralPath $seriesRoot) {
      @{
        Root = $seriesRoot
        FixedTitle = $null
      }
    }
  }
)

$movies = @{}
$series = @{}

function Add-Movie([string]$title, [string]$tag) {
  if ([string]::IsNullOrWhiteSpace($title)) {
    return
  }

  $key = $title.ToLowerInvariant()
  if (-not $movies.ContainsKey($key)) {
    $movies[$key] = [PSCustomObject]@{
      Title = $title
      Tags  = (New-TagSet)
      Notes = (New-TagSet)
    }
  }

  if ($tag) {
    [void]$movies[$key].Tags.Add($tag)
  }
}

function Add-SeriesEpisode([string]$title, [Nullable[int]]$season, [int]$episode, [bool]$explicitIncomplete) {
  if ([string]::IsNullOrWhiteSpace($title)) {
    return
  }

  $key = $title.ToLowerInvariant()
  if (-not $series.ContainsKey($key)) {
    $series[$key] = [PSCustomObject]@{
      Title   = $title
      Seasons = @{}
    }
  }

  $seasonKey = if ($null -eq $season) { '?' } else { '{0:D2}' -f $season }
  if (-not $series[$key].Seasons.ContainsKey($seasonKey)) {
    $series[$key].Seasons[$seasonKey] = [PSCustomObject]@{
      SeasonNumber       = $season
      Episodes           = New-Object 'System.Collections.Generic.SortedSet[int]'
      ExplicitIncomplete = $explicitIncomplete
    }
  }

  [void]$series[$key].Seasons[$seasonKey].Episodes.Add($episode)
  if ($explicitIncomplete) {
    $series[$key].Seasons[$seasonKey].ExplicitIncomplete = $true
  }
}

foreach ($root in $movieRoots) {
  if (-not (Test-Path -LiteralPath $root.Root)) {
    continue
  }

  Get-ChildItem -LiteralPath $root.Root -Recurse -File -Force -ErrorAction SilentlyContinue |
    Where-Object { Test-IsVideoFile $_ } |
    Where-Object { -not (Test-IsIgnoredPath $_.DirectoryName) } |
    Where-Object { -not (Test-IsIgnoredFile $_.Name) } |
    ForEach-Object {
      $episodeInfo = Get-EpisodeInfo $_.FullName
      if ($null -ne $episodeInfo) {
        $seed = Split-Path $_.DirectoryName -Leaf
        if ([string]::IsNullOrWhiteSpace($seed)) {
          $seed = $_.BaseName
        }

        $seriesTitle = Normalize-Title(
          ($seed -replace '(?i)\bS\d{1,2}E\d{1,3}\b', '') `
            -replace '(?i)\b\d{1,2}x\d{1,3}\b', '' `
            -replace '(?i)\bEP(?:ISODE)?[ ._-]?\d{1,3}\b', '' `
            -replace '(?i)\bSeason[ ._-]?\d{1,2}\b', ''
        )

        Add-SeriesEpisode $seriesTitle $episodeInfo.Season $episodeInfo.Episode ($_.FullName.ToLowerInvariant().Contains('incomplete'))
        return
      }

      $movieTitle = Normalize-Title((Split-Path $_.DirectoryName -Leaf))
      Add-Movie $movieTitle $root.Tag
    }
}

foreach ($root in $seriesRoots) {
  if (-not (Test-Path -LiteralPath $root.Root)) {
    continue
  }

  Get-ChildItem -LiteralPath $root.Root -Recurse -File -Force -ErrorAction SilentlyContinue |
    Where-Object { Test-IsVideoFile $_ } |
    Where-Object { -not (Test-IsIgnoredPath $_.DirectoryName) } |
    Where-Object { -not (Test-IsIgnoredFile $_.Name) } |
    ForEach-Object {
      $episodeInfo = Get-EpisodeInfo $_.FullName
      if ($null -eq $episodeInfo) {
        return
      }

      if ($root.FixedTitle) {
        $seriesTitle = $root.FixedTitle
      } else {
        $relative = $_.FullName.Substring($root.Root.Length).TrimStart('\')
        $seriesTitle = ($relative -split '\\')[0]
      }

      Add-SeriesEpisode (Normalize-Title $seriesTitle) $episodeInfo.Season $episodeInfo.Episode ($_.FullName.ToLowerInvariant().Contains('incomplete'))
    }
}

$movieOutput = @(
  $movies.Values |
    Sort-Object Title |
    ForEach-Object {
      [ordered]@{
        title = $_.Title
        tags  = @($_.Tags | Sort-Object)
        notes = @($_.Notes | Sort-Object)
      }
    }
)

$seriesOutput = @(
  $series.Values |
    Sort-Object Title |
    ForEach-Object {
      [ordered]@{
        title   = $_.Title
        seasons = @(
          $_.Seasons.Values |
            Sort-Object @{ Expression = { if ($null -eq $_.SeasonNumber) { 999 } else { $_.SeasonNumber } } } |
            ForEach-Object {
              [ordered]@{
                seasonNumber       = $_.SeasonNumber
                episodes           = @($_.Episodes | Sort-Object)
                explicitIncomplete = [bool]$_.ExplicitIncomplete
              }
            }
        )
      }
    }
)

[ordered]@{
  sourceRoots = @($mediaRoots | ForEach-Object { $_ })
  movies = $movieOutput
  series = $seriesOutput
} | ConvertTo-Json -Depth 8
