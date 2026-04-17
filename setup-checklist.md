# Setup Checklist

## Obiettivo

Portare online un setup con:

- `computer fisso` come NAS e libreria media
- `my-asus-notebook` come server `Jellyfin` e servizi Docker
- possibilita di usare l'i5 solo quando serve

## Decisione Consigliata

Modalita consigliata per iniziare:

- `computer fisso` sempre acceso
- `i5` acceso quando vuoi usare `Jellyfin` o transcodifica

Questa modalita e semplice da gestire se accetti che:

- quando l'i5 e spento non hai l'interfaccia `Jellyfin`
- quando l'i5 e acceso ritrovi libreria, metadata e configurazione gia pronti

## Fase 0 - Preparazione Hardware

- [ ] Pulire ventole e dissipatori di tutte le macchine
- [ ] Verificare che il fisso abbia raffreddamento stabile per uso 24/7
- [ ] Mettere il sistema operativo del fisso sul piccolo SSD
- [ ] Lasciare gli HDD solo per dati, media e backup
- [ ] Collegare il fisso via Ethernet
- [ ] Collegare anche l'i5 via Ethernet quando possibile

## Fase 1 - Installare il NAS Sul Fisso

Scelta consigliata:

- [ ] Installare `OpenMediaVault` sul fisso

Passi:

- [ ] Installare il sistema sul piccolo SSD
- [ ] Accedere alla web UI di `OpenMediaVault`
- [ ] Verificare che tutti gli HDD vengano visti correttamente
- [ ] Controllare stato SMART di ogni disco
- [ ] Creare filesystem solo sui dischi destinati ai dati
- [ ] Creare cartelle condivise
- [ ] Abilitare `Samba`
- [ ] Impostare IP statico o reservation DHCP

Share iniziali consigliate:

- [ ] `media`
- [ ] `documents`
- [ ] `backups`
- [ ] `private`
- [ ] `incoming`

## Fase 2 - Struttura Cartelle Del NAS

Usare la struttura descritta in `nas-directory-layout.md`.

Minimo indispensabile:

- [ ] `/media/movies`
- [ ] `/media/series`
- [ ] `/media/music`
- [ ] `/backups`
- [ ] `/private`

## Fase 3 - Direct Play Dal Fisso

Questa fase e opzionale ma utile.

Serve per permettere alla TV di leggere i file direttamente anche quando l'i5 e spento.

Scelte possibili:

- [ ] provare prima con cartelle condivise lette dalla TV
- [ ] se la TV lavora meglio con DLNA, installare un servizio leggero tipo `MiniDLNA` sul fisso

Nota:

- se la TV supporta bene i file, il fisso basta da solo
- se compaiono problemi di codec, audio o sottotitoli, allora si usa l'i5 con `Jellyfin`

## Fase 4 - Installare Debian Sull'i5

- [ ] Installare `Debian`
- [ ] Disattivare sospensione automatica
- [ ] Aggiornare i pacchetti
- [ ] Installare `cifs-utils`, `curl`, `git`
- [ ] Installare `Docker Engine` e `Docker Compose`

Comandi utili dopo l'installazione:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y cifs-utils curl git ca-certificates
```

## Fase 5 - Montare La Libreria Del NAS Sull'i5

Creare mount point:

```bash
sudo mkdir -p /mnt/nas/media
```

Installare supporto SMB se manca:

```bash
sudo apt install -y cifs-utils
```

Creare file credenziali:

```bash
sudo mkdir -p /root/.config
sudo nano /root/.config/nas-media-credentials
```

Contenuto del file:

```text
username=TUO_UTENTE_NAS
password=TUA_PASSWORD_NAS
```

Proteggere il file:

```bash
sudo chmod 600 /root/.config/nas-media-credentials
```

Aggiungere una riga in `/etc/fstab`:

```fstab
//IP_DEL_NAS/media /mnt/nas/media cifs credentials=/root/.config/nas-media-credentials,iocharset=utf8,uid=1000,gid=1000,vers=3.0,nofail,_netdev 0 0
```

Test:

```bash
sudo mount -a
ls /mnt/nas/media
```

## Fase 6 - Preparare Lo Stack Docker Sull'i5

In questa cartella hai gia:

- `docker-compose.yml`
- `.env.example`

Nota pratica:

- il file compose include anche `Tailscale`
- se `Tailscale` in container ti crea problemi, su `Debian` e spesso ancora piu semplice installarlo direttamente sull'host e lasciare nel compose solo `Jellyfin` e `Uptime Kuma`

Passi:

- [ ] Copiare `.env.example` in `.env`
- [ ] Personalizzare i valori
- [ ] Verificare che `MEDIA_PATH` punti a `/mnt/nas/media`

Comando:

```bash
cp .env.example .env
```

## Fase 7 - Avvio Dei Servizi

### Se vuoi usare l'i5 sempre acceso

```bash
docker compose up -d
```

### Se vuoi usare l'i5 solo quando ti serve Jellyfin

Avvio:

```bash
docker compose up -d tailscale jellyfin
```

Stop solo di Jellyfin:

```bash
docker compose stop jellyfin
```

Riavvio successivo:

```bash
docker compose start jellyfin
```

## Fase 8 - Configurare Jellyfin

- [ ] Aprire `http://IP_I5:8096`
- [ ] Completare il wizard iniziale
- [ ] Aggiungere libreria puntando a `/media/movies`, `/media/series`, ecc.
- [ ] Abilitare hardware acceleration solo dopo aver verificato `/dev/dri`

Nota:

- l'i5 10th gen e la macchina giusta per eventuale transcodifica
- il mapping `/dev/dri` nel compose e gia predisposto
- il compose attuale e pensato per client `Jellyfin` via browser o app
- se vuoi usare `DLNA` direttamente tramite `Jellyfin`, conviene passare il servizio a `host networking`

## Fase 9 - Configurare Uptime Kuma

- [ ] Aprire `http://IP_I5:3001`
- [ ] Creare un monitor per il NAS
- [ ] Creare un monitor per `Jellyfin`
- [ ] Creare un monitor per il nodo Pentium quando sara pronto

## Fase 10 - Decisione Operativa Finale

Hai due modalita reali.

### Modalita semplice

- fisso acceso sempre
- i5 acceso quando serve `Jellyfin`

Questa e facile da gestire.

### Modalita uniforme

- fisso acceso sempre
- i5 acceso sempre
- usi sempre e solo `Jellyfin`

Questa e la piu comoda lato esperienza utente.

## Comandi Da Ricordare

Vedere stato stack:

```bash
docker compose ps
```

Vedere log Jellyfin:

```bash
docker compose logs -f jellyfin
```

Aggiornare immagini:

```bash
docker compose pull
docker compose up -d
```
