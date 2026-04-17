$ErrorActionPreference = 'Stop'

$root = 'E:\[Courses]'
$reportPath = Join-Path $root 'LIBRARY_REPORT.md'
$videoExtensions = @('.mp4', '.m4v', '.mkv', '.mov', '.avi', '.wmv', '.vob', '.ogv')
$subtitleExtensions = @('.srt', '.vtt', '.ass', '.ssa')
$documentExtensions = @('.pdf', '.doc', '.docx', '.epub')

function Format-Duration {
    param([int]$Seconds)

    $span = [TimeSpan]::FromSeconds($Seconds)
    if ($span.TotalHours -ge 1) {
        return ('{0}h {1}m' -f [int][Math]::Floor($span.TotalHours), $span.Minutes)
    }

    return ('{0}m' -f [int][Math]::Round($span.TotalMinutes))
}

function Get-VideoDurationSeconds {
    param([string]$FullPath)

    $shell = New-Object -ComObject Shell.Application
    $folder = $shell.Namespace([System.IO.Path]::GetDirectoryName($FullPath))
    if ($null -eq $folder) { return 0 }

    $item = $folder.ParseName([System.IO.Path]::GetFileName($FullPath))
    if ($null -eq $item) { return 0 }

    $length = $folder.GetDetailsOf($item, 27)
    if (-not $length) { return 0 }

    try {
        return [int][TimeSpan]::Parse($length).TotalSeconds
    }
    catch {
        return 0
    }
}

function Get-CourseStats {
    param([string]$CoursePath)

    $files = Get-ChildItem -LiteralPath $CoursePath -Recurse -File -Force
    $videos = $files | Where-Object { $videoExtensions -contains $_.Extension.ToLowerInvariant() }
    $subtitles = $files | Where-Object { $subtitleExtensions -contains $_.Extension.ToLowerInvariant() }
    $documents = $files | Where-Object { $documentExtensions -contains $_.Extension.ToLowerInvariant() }

    $seconds = 0
    foreach ($video in $videos) {
        $seconds += Get-VideoDurationSeconds $video.FullName
    }

    [pscustomobject]@{
        VideoCount = $videos.Count
        SubtitleCount = $subtitles.Count
        DocumentCount = $documents.Count
        TotalSeconds = $seconds
        Duration = Format-Duration $seconds
        SizeGB = [Math]::Round((($files | Measure-Object Length -Sum).Sum / 1GB), 2)
    }
}

function Join-Bullets {
    param([string[]]$Items)

    return ($Items | ForEach-Object { "- $_" }) -join "`r`n"
}

function Build-LocalSummary {
    param($Stats)

    $parts = @()
    $parts += "$($Stats.VideoCount) video lessons"
    if ($Stats.SubtitleCount -gt 0) {
        $parts += "$($Stats.SubtitleCount) subtitle files"
    }
    if ($Stats.DocumentCount -gt 0) {
        $parts += "$($Stats.DocumentCount) course documents"
    }
    $parts += "$($Stats.SizeGB) GB on disk"

    return ($parts -join ', ')
}

function Write-Readme {
    param($Course)

    $coursePath = Join-Path (Join-Path $root $Course.Provider) $Course.Folder
    $stats = Get-CourseStats -CoursePath $coursePath
    $expectBullets = Join-Bullets -Items $Course.Expect
    $localNoteBlock = if ($Course.LocalNote) {
@"

## Local Copy Notes
$($Course.LocalNote)
"@
    }
    else {
        ''
    }

    $readme = @"
# $($Course.Title)

**Instructor:** $($Course.Instructor)  
**Provider:** $($Course.ProviderLabel)  
**Approximate runtime in this library:** $($stats.Duration)  
**Local materials:** $(Build-LocalSummary -Stats $stats)

## Course Scope
$($Course.Scope)

## About the Instructor
$($Course.Bio)

## What to Expect
$expectBullets
$localNoteBlock

## Source
[$($Course.SourceLabel)]($($Course.SourceUrl))
"@

    $readmePath = Join-Path $coursePath 'README.md'
    Set-Content -LiteralPath $readmePath -Value $readme -Encoding UTF8

    return [pscustomobject]@{
        Provider = $Course.Provider
        Folder = $Course.Folder
        Title = $Course.Title
        Instructor = $Course.Instructor
        SourceLabel = $Course.SourceLabel
        SourceUrl = $Course.SourceUrl
        ReadmePath = $readmePath
        Stats = $stats
    }
}

$courses = @()
$courses += @(
    [pscustomobject]@{
        Provider = 'Coursera - Machine Learning Specialization'
        ProviderLabel = 'Coursera'
        Folder = '01 - Supervised Machine Learning - Regression And Classification'
        Title = 'Supervised Machine Learning: Regression and Classification'
        Instructor = 'Andrew Ng'
        Scope = 'The first course in the Machine Learning Specialization introduces core supervised learning ideas with a practical focus on linear regression, logistic regression, gradient descent, model evaluation, and basic overfitting control.'
        Bio = 'Andrew Ng is a computer scientist, educator, founder of DeepLearning.AI and Coursera, and one of the most recognizable teachers in modern machine learning education.'
        Expect = @(
            'Build and train simple predictive models in Python.',
            'Understand how regression and classification differ and when to use each.',
            'Develop intuition for cost functions, gradient descent, and model diagnostics.'
        )
        SourceLabel = 'Coursera course page'
        SourceUrl = 'https://www.coursera.org/learn/supervised-machine-learning-regression-and-classification'
        LocalNote = 'This local copy includes the video lessons, subtitles, and text-heavy companion files generated from the course pages.'
    }
    [pscustomobject]@{
        Provider = 'Coursera - Machine Learning Specialization'
        ProviderLabel = 'Coursera'
        Folder = '02 - Advanced Learning Algorithms'
        Title = 'Advanced Learning Algorithms'
        Instructor = 'Andrew Ng'
        Scope = 'This course expands into modern nonlinear models, focusing on neural networks, TensorFlow workflows, decision trees, tree ensembles, and practical strategies for choosing and improving models.'
        Bio = 'Andrew Ng is a leading machine learning educator and entrepreneur whose online courses have introduced millions of learners to AI and deep learning.'
        Expect = @(
            'Work through neural network concepts from intuition to implementation.',
            'Learn the basics of TensorFlow-based model building.',
            'Compare neural networks with decision trees and ensemble methods for structured problems.'
        )
        SourceLabel = 'Coursera course page'
        SourceUrl = 'https://www.coursera.org/learn/advanced-learning-algorithms'
        LocalNote = 'The folder has a dense set of short lesson videos, subtitles, and companion HTML/text assets that are useful for quick review.'
    }
    [pscustomobject]@{
        Provider = 'Coursera - Machine Learning Specialization'
        ProviderLabel = 'Coursera'
        Folder = '03 - Unsupervised Learning - Recommenders - Reinforcement Learning'
        Title = 'Unsupervised Learning, Recommenders, Reinforcement Learning'
        Instructor = 'Andrew Ng'
        Scope = 'The third course covers clustering, anomaly detection, recommender systems, and reinforcement learning foundations, rounding out the specialization with techniques for problems that go beyond labeled supervised datasets.'
        Bio = 'Andrew Ng helped shape mainstream online AI education and is widely known for making complex machine learning concepts approachable for working learners.'
        Expect = @(
            'Use unsupervised learning methods such as clustering and anomaly detection.',
            'Understand how recommendation engines are built and evaluated.',
            'Get an accessible first pass at reinforcement learning ideas and terminology.'
        )
        SourceLabel = 'Coursera course page'
        SourceUrl = 'https://www.coursera.org/learn/unsupervised-learning-recommenders-reinforcement-learning'
        LocalNote = 'This course folder is especially useful as a reference library because the local copy preserves many small lesson files and companion materials.'
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'Bill Nye - Science and Problem-Solving'
        Title = 'Bill Nye - Science and Problem-Solving'
        Instructor = 'Bill Nye'
        Scope = 'This class is built around scientific thinking as a practical problem-solving framework. It leans into curiosity, evidence, critical filtering of information, and applying science-minded reasoning to everyday questions and big social issues.'
        Bio = 'Bill Nye is an Emmy Award-winning science educator, mechanical engineer, author, and public communicator best known for making science accessible to broad audiences.'
        Expect = @(
            'Practice a more rigorous way to evaluate claims, media, and evidence.',
            'See how the scientific method can guide daily decision-making, not just classroom experiments.',
            'Spend meaningful time on climate, design constraints, and civic-minded scientific thinking.'
        )
        SourceLabel = 'MasterClass course page'
        SourceUrl = 'https://www.masterclass.com/classes/bill-nye-teaches-science-and-problem-solving'
        LocalNote = $null
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'Billy Collins - Reading and Writing Poetry'
        Title = 'Billy Collins - Reading and Writing Poetry'
        Instructor = 'Billy Collins'
        Scope = 'Billy Collins uses close reading, observation, humor, and voice to show how poetry can feel welcoming rather than intimidating. The class covers both reading poetry well and writing poems with precision and humanity.'
        Bio = 'Billy Collins is a former U.S. Poet Laureate and one of the most widely read contemporary American poets, known for clarity, wit, and emotional accessibility.'
        Expect = @(
            'Learn to read poems with more confidence and less fear of over-analysis.',
            'Study how imagery, line breaks, voice, and surprise shape a poem.',
            'Develop a more relaxed but deliberate writing process for your own poems.'
        )
        SourceLabel = 'Teaching Victory course page'
        SourceUrl = 'https://teachingvictory.com/product/billy-collins-teaches-reading-and-writing-poetry/'
        LocalNote = 'This folder includes a workbook in addition to the lesson videos.'
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'Chris Voss - The Art of Negotiation'
        Title = 'Chris Voss - The Art of Negotiation'
        Instructor = 'Chris Voss'
        Scope = 'The course adapts Chris Voss''s hostage-negotiation background into practical tools for business, salary, conflict, and day-to-day communication. It emphasizes tactical empathy, calibrated questions, labels, mirrors, and preparation.'
        Bio = 'Chris Voss is a former FBI lead hostage negotiator, founder of The Black Swan Group, and coauthor of Never Split the Difference.'
        Expect = @(
            'Build a repeatable negotiation process instead of relying on improvisation.',
            'Use empathy and listening as active leverage, not as soft extras.',
            'Apply the tools to both formal negotiation and ordinary difficult conversations.'
        )
        SourceLabel = 'Trusted Courses page'
        SourceUrl = 'https://trustedcourse.com/course/masterclass-chris-voss-teaches-the-art-of-negotiation-2/'
        LocalNote = 'Your local copy includes both video lessons and a dense set of subtitle tracks, which makes this course easy to skim for specific tactics.'
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'Stored under MasterClass in this library'
        Folder = 'David Goggins - Cultivate the Mind of the Warrior'
        Title = 'David Goggins - Cultivate the Mind of the Warrior'
        Instructor = 'David Goggins'
        Scope = 'This material focuses on discipline, discomfort, self-accountability, and mental resilience. It is less about technical instruction and more about building an internal standard for effort and persistence.'
        Bio = 'David Goggins is a retired Navy SEAL, endurance athlete, speaker, and bestselling author known for his uncompromising approach to mental toughness and self-discipline.'
        Expect = @(
            'Hear a mindset-first approach to suffering, stress, and personal limits.',
            'Use the material as motivation for habit building and self-accountability.',
            'Expect a direct, intense tone rather than a step-by-step classroom format.'
        )
        SourceLabel = 'Mindvalley / Mindvalley Podcast page'
        SourceUrl = 'https://podcast.mindvalley.com/david-goggins-cultivate-the-mind/'
        LocalNote = 'The folder currently lives inside `MasterClass`, but the available source material suggests it is closer to Mindvalley-style content than an official MasterClass release.'
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'David Sedaris - Storytelling and Humor'
        Title = 'David Sedaris - Storytelling and Humor'
        Instructor = 'David Sedaris'
        Scope = 'David Sedaris teaches personal storytelling through observation, memory, comic timing, and revision. The class is strongest when it shows how lived experience becomes material on the page and in live readings.'
        Bio = 'David Sedaris is a bestselling essayist and humorist known for memoir-driven storytelling, radio pieces, and sharply observed comic writing.'
        Expect = @(
            'See how ordinary details become memorable story material.',
            'Study how humor can coexist with vulnerability and emotional honesty.',
            'Get a writerly view of revision, voice, and reading work aloud.'
        )
        SourceLabel = 'Trusted Courses page'
        SourceUrl = 'https://trustedcourse.com/course/masterclass-david-sedaris-teaches-storytelling-and-humor/'
        LocalNote = 'This folder includes subtitles and a course workbook, which pair well with Sedaris''s delivery-heavy style.'
    }
)
$courses += @(
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'Robin Roberts - Effective and Authentic Communication'
        Title = 'Robin Roberts - Effective and Authentic Communication'
        Instructor = 'Robin Roberts'
        Scope = 'Robin Roberts teaches communication as an act of presence, vulnerability, preparation, and resilience. The class combines broadcast skill, interpersonal communication, and a grounded personal philosophy.'
        Bio = 'Robin Roberts is a longtime broadcaster, co-anchor of Good Morning America, former sportscaster, and widely respected interviewer.'
        Expect = @(
            'Learn ways to communicate with more clarity and authenticity in public and private settings.',
            'Improve how you prepare for interviews, difficult conversations, and speaking moments.',
            'Get a motivational but practical perspective on resilience and emotional honesty.'
        )
        SourceLabel = 'Teaching Victory course page'
        SourceUrl = 'https://teachingvictory.com/product/robin-roberts-teaches-effective-and-authentic-communication/'
        LocalNote = 'This local copy includes subtitles and a workbook, which makes it easier to revisit specific advice.'
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'RuPaul - Self-Expression and Authenticity'
        Title = 'RuPaul - Self-Expression and Authenticity'
        Instructor = 'RuPaul'
        Scope = 'RuPaul frames self-expression as a creative and personal practice rooted in honesty, confidence, and reinvention. The course mixes identity work, performance wisdom, and mindset coaching.'
        Bio = 'RuPaul is a drag icon, television host, producer, recording artist, and the creator-host of RuPaul''s Drag Race.'
        Expect = @(
            'Think more intentionally about identity, presence, and personal narrative.',
            'Build confidence around visibility, criticism, and showing up fully as yourself.',
            'Expect a reflective and motivational course, not a technical performance workshop.'
        )
        SourceLabel = 'Teaching Victory course page'
        SourceUrl = 'https://teachingvictory.com/product/rupaul-teaches-self-expression-and-authenticity/'
        LocalNote = 'The folder contains subtitles and a workbook, which makes it straightforward to review key ideas quickly.'
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'Samuel L. Jackson - Acting'
        Title = 'Samuel L. Jackson - Acting'
        Instructor = 'Samuel L. Jackson'
        Scope = 'Samuel L. Jackson teaches acting through script work, character embodiment, monologues, auditioning, and sustained commitment to strong choices. The class emphasizes confidence, preparation, and craft discipline.'
        Bio = 'Samuel L. Jackson is one of the most prolific and recognizable film actors of his generation, known for a wide range of high-intensity dramatic and commercial performances.'
        Expect = @(
            'Study how Jackson approaches character, text, and commitment to a role.',
            'Get practical perspective on monologues, auditions, and screen performance habits.',
            'Use the course as both motivation and a grounded acting craft resource.'
        )
        SourceLabel = 'Teaching Victory course page'
        SourceUrl = 'https://teachingvictory.com/product/samuel-l-jackson-teaches-acting/'
        LocalNote = 'This is one of the larger local folders by size, and it includes a text transcript-style file in addition to the video lessons.'
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'Steve Martin - Comedy'
        Title = 'Steve Martin - Comedy'
        Instructor = 'Steve Martin'
        Scope = 'Steve Martin covers comedic identity, material generation, editing, stagecraft, and the long-game mindset of a working comic. The class is especially strong as a perspective piece on building a voice.'
        Bio = 'Steve Martin is a comedian, actor, writer, playwright, musician, and one of the most influential modern comedy performers.'
        Expect = @(
            'Think more carefully about comic persona and the structure behind jokes and bits.',
            'Learn how Martin views refinement, stage experience, and sustained originality.',
            'Get a career-minded creative course rather than only a bag of one-liners.'
        )
        SourceLabel = 'Teaching Victory course page'
        SourceUrl = 'https://teachingvictory.com/product/steve-martin-teaches-comedy/'
        LocalNote = $null
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'Tan France - Style for Everyone'
        Title = 'Tan France - Style for Everyone'
        Instructor = 'Tan France'
        Scope = 'Tan France teaches approachable style through proportion, fit, wardrobe basics, and confidence. The class is aimed at everyday dressing rather than high-fashion theory.'
        Bio = 'Tan France is a fashion designer, stylist, author, and television personality best known as a style expert and cohost on Queer Eye.'
        Expect = @(
            'Build a more wearable wardrobe with less guesswork around fit and proportion.',
            'Use style rules as supportive tools rather than rigid rules you have to obey.',
            'Treat clothing as a confidence and self-presentation system, not just shopping.'
        )
        SourceLabel = 'PRNewswire launch announcement'
        SourceUrl = 'https://www.prnewswire.com/news-releases/masterclass-announces-queer-eyes-tan-france-to-teach-style-for-everyone-301127081.html'
        LocalNote = 'This local copy includes subtitle files even though there is no workbook in the folder.'
    }
    [pscustomobject]@{
        Provider = 'Wellness'
        ProviderLabel = 'The Great Courses'
        Folder = 'David-Dorian Ross - Essentials of Tai Chi and Qigong'
        Title = 'David-Dorian Ross - Essentials of Tai Chi and Qigong'
        Instructor = 'David-Dorian Ross'
        Scope = 'This is a complete introduction to tai chi and qigong built around 24 half-hour lessons. It blends history, philosophy, health context, and step-by-step instruction in the Yang family short form.'
        Bio = 'David-Dorian Ross is a tai chi champion, TaijiFit founder, PBS host, and veteran instructor who has taught martial arts, wellness, and mind-body movement for decades.'
        Expect = @(
            'Learn the 24-movement Yang short form gradually, one lesson at a time.',
            'Get substantial context on philosophy, qi, balance, and health benefits alongside physical practice.',
            'Use the guidebook and renamed lesson files as a long-term reference course rather than a one-time watch.'
        )
        SourceLabel = 'The Great Courses course page'
        SourceUrl = 'https://www.thegreatcourses.com/courses/essentials-of-tai-chi-and-qigong'
        LocalNote = 'This folder was reorganized to a cleaner standalone-course layout: the guidebook was flattened into the course root and the 24 lecture videos were renamed to match the official lesson titles.'
    }
    [pscustomobject]@{
        Provider = 'Wellness'
        ProviderLabel = 'Wim Hof Method'
        Folder = 'Wim Hof - Classic 10-Week Video Course'
        Title = 'Wim Hof - Classic 10-Week Video Course'
        Instructor = 'Wim Hof'
        Scope = 'The Classic 10-Week Video Course teaches the Wim Hof Method through progressive lessons on breathing, cold exposure, and commitment or focus. The local copy also includes daily exercises, bonus videos, ebooks, and practice materials.'
        Bio = 'Wim Hof is a Dutch extreme athlete and breathing-method teacher, often called The Iceman, known for popularizing cold exposure and breathwork practices.'
        Expect = @(
            'Move through the method in a structured ten-week sequence rather than isolated clips.',
            'Work with breathing, cold adaptation, mindset, and physical exercises as connected pillars.',
            'Use the local bonus materials for additional context, science, and guided practice.'
        )
        SourceLabel = 'Official Wim Hof Method course page'
        SourceUrl = 'https://www.wimhofmethod.com/classic-10-week-video-course-introduction'
        LocalNote = 'This folder was normalized for browsing: core sections were renamed, week videos were zero-padded for proper sorting, the workbook was renamed, and an official cover was added.'
    }
    [pscustomobject]@{
        Provider = 'Wellness'
        ProviderLabel = 'YMAA'
        Folder = 'Dr. Yang Jwing-Ming - Yang Tai Chi for Beginners'
        Title = 'Dr. Yang Jwing-Ming - Yang Tai Chi for Beginners'
        Instructor = 'Dr. Yang Jwing-Ming'
        Scope = 'This course teaches Yang-style tai chi step by step, emphasizing detailed movement explanation, front-and-back demonstration, and the meaning behind the form rather than only a follow-along workout.'
        Bio = 'Dr. Yang Jwing-Ming is a longtime tai chi, qigong, and kung fu teacher, author, and founder of YMAA, known for detailed and methodical martial arts instruction.'
        Expect = @(
            'Study the Yang form carefully, with a strong emphasis on posture and sequence accuracy.',
            'Use the material as a traditional instructional program rather than a fast-paced fitness class.',
            'Expect a DVD-style structure focused on deep, repetitive explanation and demonstration.'
        )
        SourceLabel = 'NewSouth Books product page'
        SourceUrl = 'https://newsouthbooks.com.au/books/yang-tai-chi-for-beginners/'
        LocalNote = 'The original `VIDEO_TS` DVD structure was preserved on purpose so the disc-style content remains playable as authored.'
    }
)

$written = foreach ($course in $courses) {
    Write-Readme -Course $course
}

$providerSummary = $written |
    Group-Object Provider |
    Sort-Object Name |
    ForEach-Object {
        $videoTotal = (($_.Group | ForEach-Object { $_.Stats.VideoCount }) | Measure-Object -Sum).Sum
        $secondsTotal = (($_.Group | ForEach-Object { $_.Stats.TotalSeconds }) | Measure-Object -Sum).Sum
        $sizeTotal = [Math]::Round((((($_.Group | ForEach-Object { $_.Stats.SizeGB }) | Measure-Object -Sum).Sum)), 2)
        [pscustomobject]@{
            Provider = $_.Name
            Courses = $_.Count
            Videos = $videoTotal
            Duration = Format-Duration $secondsTotal
            SizeGB = $sizeTotal
        }
    }

$courseRows = $written |
    Sort-Object Provider, Title |
    ForEach-Object {
        "| $($_.Provider) | $($_.Title.Replace('|', '/')) | $($_.Instructor.Replace('|', '/')) | $($_.Stats.VideoCount) | $($_.Stats.Duration) | $($_.Stats.SizeGB) GB |"
    }

$providerRows = $providerSummary |
    ForEach-Object {
        "| $($_.Provider) | $($_.Courses) | $($_.Videos) | $($_.Duration) | $($_.SizeGB) GB |"
    }

$sourceRows = foreach ($item in ($courses | Sort-Object Provider, Title)) {
    "| $($item.Provider) | $($item.Title.Replace('|', '/')) | [$($item.SourceLabel)]($($item.SourceUrl)) |"
}

$totalCourseCount = $written.Count
$totalVideoCount = ((($written | ForEach-Object { $_.Stats.VideoCount }) | Measure-Object -Sum).Sum)
$totalSeconds = ((($written | ForEach-Object { $_.Stats.TotalSeconds }) | Measure-Object -Sum).Sum)
$totalSizeGB = [Math]::Round((((($written | ForEach-Object { $_.Stats.SizeGB }) | Measure-Object -Sum).Sum)), 2)

$report = @"
# Course Library Report

Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## What Was Completed
- Audited and organized the course library stored under ``E:\[Courses]``.
- Normalized course folder names and lesson naming for the main library and the Wellness collection.
- Removed obvious junk and downloader clutter in earlier cleanup passes.
- Added `cover.jpg` artwork to every course folder.
- Created a `README.md` in every course folder with scope, instructor context, local runtime, and expectations.
- Reorganized the Wellness collection into cleaner, instructor-led course folders.

## Naming and Structure Schema
- Standalone course folders use ``Instructor - Course Title``.
- Numbered program modules keep a sequence prefix such as ``01 - Course Title``.
- Lesson videos use ``NN - Lesson Title.ext`` whenever reliable lesson titles were available.
- Shared support files use stable names such as ``Guidebook.pdf``, ``Course Workbook.pdf``, ``cover.jpg``, and ``README.md``.
- Native disc structures such as ``VIDEO_TS`` are preserved when they are part of the original media format.

## Library Totals
- Courses: $totalCourseCount
- Video files: $totalVideoCount
- Approximate local runtime: $(Format-Duration $totalSeconds)
- Approximate size: $totalSizeGB GB

## Provider Summary
| Provider | Courses | Videos | Runtime | Size |
| --- | ---: | ---: | ---: | ---: |
$($providerRows -join "`r`n")

## Course Inventory
| Provider | Course | Instructor | Videos | Runtime | Size |
| --- | --- | --- | ---: | ---: | ---: |
$($courseRows -join "`r`n")

## Wellness Organization Notes
- ``TTC - Essentials of Tai Chi and Qigong`` was renamed to ``David-Dorian Ross - Essentials of Tai Chi and Qigong`` so it matches the instructor-title schema used elsewhere.
- The Tai Chi guidebook was flattened into the course root and renamed to ``Guidebook.pdf``.
- All 24 Tai Chi lectures were renamed to their official lesson titles from The Great Courses listing.
- ``Wim Hof Method`` was renamed to ``Wim Hof - Classic 10-Week Video Course`` and reorganized into cleaner top-level sections such as ``Start Here``, ``10 Week Program``, ``Daily Exercises``, and ``Bonus Materials``.
- Wim Hof week videos were zero-padded for correct sort order, supporting files were renamed, and an official cover image was added.
- ``Yang Tai Chi for Beginners`` was renamed to ``Dr. Yang Jwing-Ming - Yang Tai Chi for Beginners`` while preserving the original ``VIDEO_TS`` disc structure.

## Practical Guidance
- Add new standalone courses using ``Instructor - Course Title``.
- For multi-part programs or specializations, keep numbered folders such as ``01 - ...``, ``02 - ...``, ``03 - ...``.
- Put the main folder-level documentation in ``README.md`` and keep artwork in ``cover.jpg``.
- When a course includes a workbook or guide, use clear names like ``Guidebook.pdf`` or ``Course Workbook.pdf``.
- Keep subtitles next to their matching video files whenever possible.
- Preserve authored disc or app export structures only when flattening them would make the material harder to use.

## Sources Used For README Creation
| Provider | Course | Source |
| --- | --- | --- |
$($sourceRows -join "`r`n")

## Notes
- All durations in this report come from the local media files on disk, not from catalog listings.
- ``David Goggins - Cultivate the Mind of the Warrior`` remains stored inside the ``MasterClass`` folder for now, but the available source material looks closer to Mindvalley-style content.
"@

Set-Content -LiteralPath $reportPath -Value $report -Encoding UTF8

Write-Host "Created $($written.Count) course README files."
Write-Host "Created report: $reportPath"
$courses += @(
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'James Suckling - Wine Appreciation'
        Title = 'James Suckling - Wine Appreciation'
        Instructor = 'James Suckling'
        Scope = 'The course is a practical introduction to tasting, evaluating, buying, and enjoying wine with more structure and confidence. It is aimed at appreciation rather than sommelier-level certification.'
        Bio = 'James Suckling is a longtime wine critic, former senior editor of Wine Spectator, and founder of JamesSuckling.com.'
        Expect = @(
            'Learn vocabulary and tasting habits that make wine less opaque.',
            'Understand how to compare wines, regions, and styles with more confidence.',
            'Use the workbook and lessons as a foundation for your own tasting practice.'
        )
        SourceLabel = 'JamesSuckling.com article'
        SourceUrl = 'https://www.jamessuckling.com/videos/james-sucklings-masterclass-wine-appreciation'
        LocalNote = 'The local folder includes a workbook, so this one is especially well suited to repeated tasting sessions.'
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'Jocko Willink - Critical Leadership Training'
        Title = 'Jocko Willink - Critical Leadership Training'
        Instructor = 'Jocko Willink'
        Scope = 'This course frames leadership as disciplined decision-making, accountability, and clear communication under pressure. It borrows directly from Jocko''s military leadership background but aims to translate the principles to teams and organizations more broadly.'
        Bio = 'Jocko Willink is a retired U.S. Navy SEAL officer, leadership instructor, podcaster, and bestselling coauthor of Extreme Ownership.'
        Expect = @(
            'Focus on ownership, clarity, debriefing, and team execution.',
            'Learn leadership habits that apply to work, projects, and operations.',
            'Expect a direct, tactical tone rather than abstract management theory.'
        )
        SourceLabel = 'PRNewswire launch announcement'
        SourceUrl = 'https://www.prnewswire.com/news-releases/masterclass-announces-critical-leadership-training-with-former-navy-seal-officer-jocko-willink-301914248.html'
        LocalNote = $null
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'Karla Welch - Building and Owning Your Personal Style'
        Title = 'Karla Welch - Building and Owning Your Personal Style'
        Instructor = 'Karla Welch'
        Scope = 'Karla Welch teaches style as a system you can understand and own rather than a trend you chase. The course focuses on defining a signature look, editing a wardrobe, and building confidence through fit and intentionality.'
        Bio = 'Karla Welch is a celebrity stylist and entrepreneur known for styling figures such as Justin Bieber, Tracee Ellis Ross, and Oprah Winfrey.'
        Expect = @(
            'Create a clearer personal style instead of collecting disconnected fashion tips.',
            'Learn practical wardrobe editing, shopping, and capsule-wardrobe thinking.',
            'Treat style as an identity and confidence tool, not just trend consumption.'
        )
        SourceLabel = 'Defile Magazine / PRNewswire announcement'
        SourceUrl = 'https://defilemagazine.com/masterclass-announces-celebrity-stylist-karla-welch-to-teach-building-and-owning-your-personal-style/'
        LocalNote = 'This local copy also includes subtitles and a workbook.'
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'Massimo Bottura - Modern Italian Cooking'
        Title = 'Massimo Bottura - Modern Italian Cooking'
        Instructor = 'Massimo Bottura'
        Scope = 'Massimo Bottura teaches classic Italian techniques through a modern, creative lens. The class balances recipe instruction with a broader philosophy around reinterpretation, regional tradition, and using food to tell a story.'
        Bio = 'Massimo Bottura is the chef-owner of Osteria Francescana, one of the world''s most celebrated restaurants, and a leading figure in modern Italian cuisine.'
        Expect = @(
            'Learn Bottura''s approach to dishes such as pasta, risotto, and tortellini.',
            'Understand how technique, plating, and concept work together in high-level cooking.',
            'See how traditional recipes can be reimagined without losing their roots.'
        )
        SourceLabel = 'MasterClass lesson page'
        SourceUrl = 'https://www.masterclass.com/classes/massimo-bottura-teaches-modern-italian-cooking/chapters/introduction-e404a524-2e36-42bd-a549-58b957f735c8'
        LocalNote = 'This folder includes a companion workbook that is useful if you want the recipes and process notes close at hand.'
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'Natalie Portman - Acting'
        Title = 'Natalie Portman - Acting'
        Instructor = 'Natalie Portman'
        Scope = 'Natalie Portman focuses on how actors analyze scripts, prepare characters, collaborate with directors, and protect truthful performances. The course is grounded in process rather than celebrity anecdotes.'
        Bio = 'Natalie Portman is an Oscar-winning actor, director, and producer whose work spans stage-trained craft, mainstream film, and psychologically demanding roles.'
        Expect = @(
            'Learn how Portman breaks down scripts and discovers a role''s center.',
            'Explore research, rehearsal, and collaboration as part of performance prep.',
            'Use the course as a practical acting-process companion, not just inspiration.'
        )
        SourceLabel = 'MasterClass introduction page'
        SourceUrl = 'https://www.masterclass.com/classes/natalie-portman-teaches-acting/chapters/introduction-d7fe8516-c0cf-4a57-a0d5-ef33677179aa'
        LocalNote = 'The folder includes a workbook alongside the 20 lesson videos.'
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'Neil deGrasse Tyson - Scientific Thinking and Communication'
        Title = 'Neil deGrasse Tyson - Scientific Thinking and Communication'
        Instructor = 'Neil deGrasse Tyson'
        Scope = 'Neil deGrasse Tyson teaches scientific reasoning as both a habit of mind and a communication skill. The class connects bias, probability, skepticism, and audience awareness.'
        Bio = 'Neil deGrasse Tyson is an astrophysicist, author, science communicator, and longtime director of the Hayden Planetarium.'
        Expect = @(
            'Build better habits for questioning claims and spotting weak reasoning.',
            'Improve your ability to explain scientific ideas to non-specialists.',
            'Treat science as a method of inquiry rather than a list of facts.'
        )
        SourceLabel = 'Teaching Victory course page'
        SourceUrl = 'https://teachingvictory.com/product/neil-degrasse-tyson-teaches-scientific-thinking-and-communication/'
        LocalNote = 'This course folder includes a workbook but no subtitle files in the local copy.'
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'Neil Gaiman - The Art of Storytelling'
        Title = 'Neil Gaiman - The Art of Storytelling'
        Instructor = 'Neil Gaiman'
        Scope = 'Neil Gaiman explores where stories come from and how writers turn vague ideas into memorable characters, settings, and narrative voice. The class is broad, imaginative, and useful for fiction, comics, and cross-genre storytelling.'
        Bio = 'Neil Gaiman is a bestselling author and screenwriter known for works such as The Sandman, American Gods, Coraline, and Good Omens.'
        Expect = @(
            'Develop a stronger idea-generation and worldbuilding process.',
            'Think more deliberately about voice, character desire, and scene logic.',
            'Use the lessons as creative fuel and perspective, especially if you write speculative fiction.'
        )
        SourceLabel = 'Teaching Victory course page'
        SourceUrl = 'https://teachingvictory.com/product/neil-gaiman-teaches-the-art-of-storytelling/'
        LocalNote = 'The local folder includes a course workbook and a relatively long total runtime compared with many other MasterClass courses.'
    }
    [pscustomobject]@{
        Provider = 'MasterClass'
        ProviderLabel = 'MasterClass'
        Folder = 'Paul Krugman - Economics and Society'
        Title = 'Paul Krugman - Economics and Society'
        Instructor = 'Paul Krugman'
        Scope = 'Paul Krugman teaches the economic ideas needed to interpret policy, inequality, trade, crises, and public debate. The course is oriented toward economic literacy for citizens rather than toward formal problem sets.'
        Bio = 'Paul Krugman is a Nobel Prize-winning economist, professor, columnist, and public intellectual known for explaining macroeconomics and policy in accessible terms.'
        Expect = @(
            'Build better intuition for how economic systems shape politics and daily life.',
            'Understand major concepts without needing an advanced math background.',
            'Use the course as a framework for reading economic news with more context.'
        )
        SourceLabel = 'MasterClass course page'
        SourceUrl = 'https://www.masterclass.com/classes/paul-krugman-teaches-economics-and-society'
        LocalNote = 'A workbook is included in the local folder, which pairs well with the concept-heavy lessons.'
    }
)

# Final pass after all course metadata has been loaded.
$written = foreach ($course in $courses) {
    Write-Readme -Course $course
}

$providerSummary = $written |
    Group-Object Provider |
    Sort-Object Name |
    ForEach-Object {
        $videoTotal = (($_.Group | ForEach-Object { $_.Stats.VideoCount }) | Measure-Object -Sum).Sum
        $secondsTotal = (($_.Group | ForEach-Object { $_.Stats.TotalSeconds }) | Measure-Object -Sum).Sum
        $sizeTotal = [Math]::Round((((($_.Group | ForEach-Object { $_.Stats.SizeGB }) | Measure-Object -Sum).Sum)), 2)
        [pscustomobject]@{
            Provider = $_.Name
            Courses = $_.Count
            Videos = $videoTotal
            Duration = Format-Duration $secondsTotal
            SizeGB = $sizeTotal
        }
    }

$courseRows = $written |
    Sort-Object Provider, Title |
    ForEach-Object {
        "| $($_.Provider) | $($_.Title.Replace('|', '/')) | $($_.Instructor.Replace('|', '/')) | $($_.Stats.VideoCount) | $($_.Stats.Duration) | $($_.Stats.SizeGB) GB |"
    }

$providerRows = $providerSummary |
    ForEach-Object {
        "| $($_.Provider) | $($_.Courses) | $($_.Videos) | $($_.Duration) | $($_.SizeGB) GB |"
    }

$sourceRows = foreach ($item in ($courses | Sort-Object Provider, Title)) {
    "| $($item.Provider) | $($item.Title.Replace('|', '/')) | [$($item.SourceLabel)]($($item.SourceUrl)) |"
}

$totalCourseCount = $written.Count
$totalVideoCount = ((($written | ForEach-Object { $_.Stats.VideoCount }) | Measure-Object -Sum).Sum)
$totalSeconds = ((($written | ForEach-Object { $_.Stats.TotalSeconds }) | Measure-Object -Sum).Sum)
$totalSizeGB = [Math]::Round((((($written | ForEach-Object { $_.Stats.SizeGB }) | Measure-Object -Sum).Sum)), 2)

$report = @"
# Course Library Report

Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## What Was Completed
- Audited and organized the course library stored under ``E:\[Courses]``.
- Normalized course folder names and lesson naming for the main library and the Wellness collection.
- Removed obvious junk and downloader clutter in earlier cleanup passes.
- Added `cover.jpg` artwork to every course folder.
- Created a `README.md` in every course folder with scope, instructor context, local runtime, and expectations.
- Reorganized the Wellness collection into cleaner, instructor-led course folders.

## Naming and Structure Schema
- Standalone course folders use ``Instructor - Course Title``.
- Numbered program modules keep a sequence prefix such as ``01 - Course Title``.
- Lesson videos use ``NN - Lesson Title.ext`` whenever reliable lesson titles were available.
- Shared support files use stable names such as ``Guidebook.pdf``, ``Course Workbook.pdf``, ``cover.jpg``, and ``README.md``.
- Native disc structures such as ``VIDEO_TS`` are preserved when they are part of the original media format.

## Library Totals
- Courses: $totalCourseCount
- Video files: $totalVideoCount
- Approximate local runtime: $(Format-Duration $totalSeconds)
- Approximate size: $totalSizeGB GB

## Provider Summary
| Provider | Courses | Videos | Runtime | Size |
| --- | ---: | ---: | ---: | ---: |
$($providerRows -join "`r`n")

## Course Inventory
| Provider | Course | Instructor | Videos | Runtime | Size |
| --- | --- | --- | ---: | ---: | ---: |
$($courseRows -join "`r`n")

## Wellness Organization Notes
- ``TTC - Essentials of Tai Chi and Qigong`` was renamed to ``David-Dorian Ross - Essentials of Tai Chi and Qigong`` so it matches the instructor-title schema used elsewhere.
- The Tai Chi guidebook was flattened into the course root and renamed to ``Guidebook.pdf``.
- All 24 Tai Chi lectures were renamed to their official lesson titles from The Great Courses listing.
- ``Wim Hof Method`` was renamed to ``Wim Hof - Classic 10-Week Video Course`` and reorganized into cleaner top-level sections such as ``Start Here``, ``10 Week Program``, ``Daily Exercises``, and ``Bonus Materials``.
- Wim Hof week videos were zero-padded for correct sort order, supporting files were renamed, and an official cover image was added.
- ``Yang Tai Chi for Beginners`` was renamed to ``Dr. Yang Jwing-Ming - Yang Tai Chi for Beginners`` while preserving the original ``VIDEO_TS`` disc structure.

## Practical Guidance
- Add new standalone courses using ``Instructor - Course Title``.
- For multi-part programs or specializations, keep numbered folders such as ``01 - ...``, ``02 - ...``, ``03 - ...``.
- Put the main folder-level documentation in ``README.md`` and keep artwork in ``cover.jpg``.
- When a course includes a workbook or guide, use clear names like ``Guidebook.pdf`` or ``Course Workbook.pdf``.
- Keep subtitles next to their matching video files whenever possible.
- Preserve authored disc or app export structures only when flattening them would make the material harder to use.

## Sources Used For README Creation
| Provider | Course | Source |
| --- | --- | --- |
$($sourceRows -join "`r`n")

## Notes
- All durations in this report come from the local media files on disk, not from catalog listings.
- ``David Goggins - Cultivate the Mind of the Warrior`` remains stored inside the ``MasterClass`` folder for now, but the available source material looks closer to Mindvalley-style content.
"@

Set-Content -LiteralPath $reportPath -Value $report -Encoding UTF8

Write-Host "Created $($written.Count) course README files."
Write-Host "Created report: $reportPath"
