# NAS Directory Layout

## Obiettivo

Tenere i dischi del `computer fisso` ordinati fin dall'inizio, separando:

- media
- dati personali
- backup
- file temporanei

## Struttura Consigliata

```text
/
`-- srv
    `-- storage
        |-- media
        |   |-- movies
        |   |-- series
        |   |-- anime
        |   |-- documentaries
        |   |-- kids
        |   |-- music
        |   `-- concerts
        |-- documents
        |   |-- family
        |   |-- admin
        |   `-- scans
        |-- backups
        |   |-- pcs
        |   |-- phones
        |   `-- configs
        |-- private
        |   |-- personal
        |   `-- archive
        `-- incoming
            |-- downloads
            |-- sort-me
            `-- temporary
```

## Share Di Rete Consigliate

Puoi esportare almeno queste share:

- `media`
- `documents`
- `backups`
- `private`
- `incoming`

## Librerie Consigliate Per Jellyfin

Quando configuri `Jellyfin` sull'i5, usa queste librerie:

- Film: `/media/movies`
- Serie: `/media/series`
- Anime: `/media/anime`
- Documentari: `/media/documentaries`
- Musica: `/media/music`
- Concerti: `/media/concerts`

## Regole Pratiche

- non mischiare backup e media
- non mettere file temporanei dentro `media`
- evita nomi ambigui delle cartelle
- lascia `incoming` come area di smistamento
- sposta i file in `movies` o `series` solo quando sono gia ordinati

## Convenzioni Di Nome Utili

### Film

```text
movies/
`-- Film Name (2024)
    `-- Film Name (2024).mkv
```

### Serie TV

```text
series/
`-- Series Name
    |-- Season 01
    |   |-- Series Name - S01E01.mkv
    |   `-- Series Name - S01E02.mkv
    `-- Season 02
```

### Anime

```text
anime/
`-- Anime Name
    `-- Season 01
```

## Mount Consigliato Sull'i5

Sull'i5 conviene montare la share `media` qui:

```text
/mnt/nas/media
```

In questo modo il container `Jellyfin` puo leggerla in sola lettura come:

```text
/media
```

## Perche Questa Struttura Funziona Bene

- e facile da capire
- funziona bene con `Jellyfin`
- separa subito i dati importanti dai media
- ti lascia spazio per crescere senza rifare tutto

