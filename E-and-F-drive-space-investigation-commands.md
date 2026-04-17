# E and F Drive Space Investigation - Commands and Notes

Date: 2026-04-17

## What I found

- `E:` and `F:` are two partitions on the same physical disk.
- Physical disk: `Disk 2`, `Generic External`, USB, about `500 GB`.
- `E:` is an `NTFS` partition of about `419.43 GB`.
- `F:` is an `exFAT` partition of about `80.67 GB`.
- Windows reports `F:` as using about `5,891,424,256` bytes.
- The hidden folder `F:\$RECYCLE.BIN` contains about `5,887,979,606` bytes.
- `F:\System Volume Information` contains only `88` bytes of visible files.
- The small leftover difference is normal filesystem overhead/metadata.

## Why F: looked empty

In a normal Explorer view, hidden and protected operating system folders are not shown.
On `F:`, almost all of the used space is inside the hidden recycle bin:

- `F:\$RECYCLE.BIN`

That means the drive is not really empty. It contains deleted files that are still sitting in the recycle bin for that volume.

Largest items I found in `F:\$RECYCLE.BIN`:

- `Dear.Evan.Hansen.2021.1080p.WEBRip.x264.AAC5.1-[YTS.MX].mp4` about `2.524 GiB`
- `The.Shawshank.Redemption.1994.1080p.x264.YIFY.mp4` about `1.604 GiB`
- `Bros.2022.HDRip.XviD.AC3-EVO.avi` about `1.352 GiB`

Those three files already explain nearly all of the missing space.

## Commands I ran

### 1. Check the two volumes

```powershell
Get-Volume | Where-Object { $_.DriveLetter -in 'E','F' } |
  Select-Object DriveLetter, FileSystemLabel, FileSystem, HealthStatus, SizeRemaining, Size |
  Format-List
```

What it does:
- Shows filesystem type, health, total size, and free space for `E:` and `F:`.

Why it matters:
- This confirms whether the reported used space is coming from the filesystem itself and gives the real size/free-space numbers.

### 2. Check whether E: and F: are on the same disk

```powershell
Get-Partition | Where-Object { $_.DriveLetter -in 'E','F' } |
  Select-Object DiskNumber, PartitionNumber, DriveLetter, Type, Size, Offset |
  Sort-Object DriveLetter |
  Format-List
```

What it does:
- Shows which disk each partition belongs to.

Why it matters:
- This is the cleanest way to prove that `E:` and `F:` are separate partitions on the same physical drive.

### 3. Inspect the physical disks

```powershell
Get-Disk |
  Select-Object Number, FriendlyName, SerialNumber, BusType, PartitionStyle, OperationalStatus, HealthStatus, Size, AllocatedSize |
  Format-Table -AutoSize
```

What it does:
- Lists the actual disks connected to the machine.

Why it matters:
- This lets you match the partitions to the real hardware and confirm which external disk is involved.

### 4. Show hidden items in the root of F:

```powershell
Get-ChildItem -LiteralPath 'F:\' -Force -ErrorAction SilentlyContinue |
  Select-Object Mode, Length, LastWriteTime, Name, FullName |
  Format-Table -AutoSize
```

What it does:
- Lists everything in the root of `F:`, including hidden and system items.

Why it matters:
- This is what exposed `System Volume Information` and `$RECYCLE.BIN`, which Explorer usually hides.

### 5. Ask Windows for the official free-space numbers

```powershell
fsutil volume diskfree F:
```

What it does:
- Shows total bytes and free bytes for the volume directly from Windows.

Why it matters:
- Useful for comparing "what the filesystem says" versus "what visible files seem to add up to."

### 6. Measure the hidden recycle bin on F:

```powershell
$sum = (Get-ChildItem -LiteralPath 'F:\$RECYCLE.BIN' -Force -Recurse -File -ErrorAction Stop |
  Measure-Object Length -Sum).Sum
$sum
```

What it does:
- Recursively walks the recycle bin and sums file sizes.

Why it matters:
- This is the command that proved the missing space was almost entirely in the recycle bin.

### 7. Check System Volume Information

```powershell
Get-ChildItem -LiteralPath 'F:\System Volume Information' -Force -Recurse -ErrorAction Stop |
  Select-Object FullName, Length, Mode |
  Format-Table -AutoSize
```

What it does:
- Lists the contents of the volume metadata folder.

Why it matters:
- This helps rule out restore points, indexing data, or other system-managed content as the main cause.

### 8. Find the biggest hidden files

```powershell
Get-ChildItem -LiteralPath 'F:\$RECYCLE.BIN' -Force -Recurse -File -ErrorAction SilentlyContinue |
  Sort-Object Length -Descending |
  Select-Object -First 10 @{Name='SizeGB';Expression={[math]::Round($_.Length/1GB,3)}}, Length, FullName |
  Format-List
```

What it does:
- Sorts files by size and shows the largest ones first.

Why it matters:
- This is the fastest way to identify exactly which deleted files are consuming the space.

## Mini tutorial: how to use these commands yourself

### Hidden folders

- Use `-Force` with `Get-ChildItem` whenever you suspect Explorer is hiding the real contents.
- The two common folders you will see are:
- `$RECYCLE.BIN`: deleted files still occupying space
- `System Volume Information`: filesystem/indexing/system metadata

### Why the size can look different

- Windows tools sometimes show decimal gigabytes (`GB`), while PowerShell math with `1GB` is binary (`GiB`).
- Because of that, about `5.89 GB` can also appear as about `5.49 GiB`.

### A simple workflow for "drive looks empty but space is missing"

1. Run `Get-Volume` to confirm total and free space.
2. Run `Get-ChildItem -Force` at the root of the drive.
3. Check `$RECYCLE.BIN`.
4. Check `System Volume Information`.
5. Sort hidden files by size to find the main offenders.

## If you want to free the space later

The safe next step would be to empty the recycle bin for `F:`. I did not delete anything during this investigation.
