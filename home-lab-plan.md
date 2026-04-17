# Home Lab Plan

## Obiettivo

Usare l'hardware gia disponibile per costruire una piccola infrastruttura domestica con:

- storage centralizzato
- media server per film e serie TV
- servizi sempre attivi 24/7
- un nodo leggero per bot, automazioni e utility

## Hardware Disponibile

| Macchina | Specifiche note | Ruolo possibile |
| --- | --- | --- |
| `mom-asus-notebook` | Intel Pentium | bot, utility, monitoraggio, piccoli servizi |
| `my-asus-notebook` | Intel i5 10th gen, GeForce 940MX | server applicativo principale, media server, container |
| `computer fisso` | Intel Core 2 Duo, 8 GB RAM, piu HDD interni e piccolo SSD | NAS, archivio dati, file server, eventuale media server light |

## Architettura Consigliata

### Scelta consigliata

- `computer fisso` come `storage server / NAS`
- `my-asus-notebook` come `server servizi principale`
- `mom-asus-notebook` come `nodo leggero 24/7`

Questa divisione e la piu equilibrata perche separa bene:

- i dischi e i dati sul fisso
- il carico software e multimediale sulla macchina piu potente
- i servizi secondari sul portatile Pentium

## Ruoli Dettagliati

### 1. `computer fisso`

Ruolo:

- archivio principale dei dati
- condivisioni di rete per PC, telefoni e smart TV
- deposito dei film e delle librerie multimediali
- backup locale delle altre macchine

Sistema operativo consigliato:

- `OpenMediaVault` se vuoi una gestione semplice da browser
- `Debian` se vuoi piu controllo manuale

Servizi consigliati:

- `Samba` per cartelle condivise
- `NFS` solo se in casa hai altri sistemi Linux
- `SMART monitoring`
- `rsync` o backup schedulati
- opzionale `Jellyfin` solo in scenario light

Dischi:

- `SSD piccolo` per il sistema operativo
- `HDD interni` per dati, media, backup

### 2. `my-asus-notebook`

Ruolo:

- server principale dei servizi
- orchestrazione con `Docker`
- media server principale se serve transcodifica
- eventuali servizi web o AI via API

Sistema operativo consigliato:

- `Debian`
- in alternativa `Ubuntu Server` se preferisci qualcosa di piu guidato

Servizi consigliati:

- `Jellyfin`
- `Tailscale`
- `Docker` e `Docker Compose`
- `Uptime Kuma`
- `Nextcloud` o `Immich` in un secondo momento
- reverse proxy solo se davvero ti serve

Nota hardware:

- per i film conta molto di piu la iGPU Intel del processore rispetto alla `940MX`
- l'i5 10th gen e la macchina migliore che hai per eventuale transcodifica video

### 3. `mom-asus-notebook`

Ruolo:

- bot e automazioni sempre accese
- utility di rete
- monitoraggio base

Sistema operativo consigliato:

- `Debian` minimale
- opzionale desktop `XFCE` solo se vuoi usarlo anche localmente

Servizi consigliati:

- bot WhatsApp o bridge messaggi
- webhook receiver
- scheduler
- `AdGuard Home` o `Pi-hole`
- piccoli script di automazione

## Il Fisso Puo Fare Streaming Alla Smart TV?

Si, puo farlo.

La risposta pero cambia a seconda del tipo di streaming:

### Caso 1: `direct play`

Se la smart TV supporta gia:

- il codec video
- il codec audio
- il contenitore del file, ad esempio `mp4` o `mkv`
- i sottotitoli usati

allora il fisso puo tranquillamente servire i film anche con hardware vecchio, perche in pratica spedisce il file in rete senza convertirlo.

Questo e lo scenario migliore per il tuo `Core 2 Duo`.

### Caso 2: `transcoding`

Se invece la TV non supporta un file e il server deve convertirlo in tempo reale:

- risoluzione troppo alta
- codec non supportato
- audio incompatibile
- sottotitoli che obbligano il burn-in

allora il `Core 2 Duo` rischia di essere troppo debole, soprattutto con `1080p pesanti` o contenuti superiori.

## Conclusione pratica sul media server

Hai due strade sensate.

### Opzione A: il fisso fa anche media server

Va bene se:

- la smart TV legge quasi tutto in `direct play`
- usi file gia compatibili
- non prevedi piu stream contemporanei
- non ti serve transcodifica pesante

Stack tipico:

- `OpenMediaVault`
- cartella media sugli HDD
- `Jellyfin` o `MiniDLNA`

### Opzione B: il fisso tiene i file, l'i5 fa Jellyfin

Questa e la soluzione migliore in generale.

Funziona cosi:

- il fisso espone i dischi in rete
- l'i5 monta la cartella media dal fisso
- `Jellyfin` gira sull'i5

Vantaggi:

- storage separato dal carico CPU
- migliore compatibilita con TV e client diversi
- piu margine se un giorno aggiungi accesso remoto
- meno rischio di saturare il vecchio desktop

Per il tuo hardware, questa e la soluzione che consiglierei.

## Sistema Finale Consigliato

### `computer fisso`

- OS: `OpenMediaVault`
- funzione: NAS, file server, backup, archivio media
- dischi: SSD per OS, HDD per dati
- rete: solo Ethernet

### `my-asus-notebook`

- OS: `Debian`
- funzione: `Jellyfin`, `Docker`, `Tailscale`, servizi vari
- accesso ai media: mount SMB o NFS dal fisso

### `mom-asus-notebook`

- OS: `Debian light`
- funzione: bot, automazioni, monitoraggio, servizi leggeri

## Sequenza Di Installazione Consigliata

### Fase 1: mettere in sicurezza storage e rete

1. Installare `OpenMediaVault` sul fisso usando l'SSD.
2. Configurare gli HDD con nomi e cartelle chiare.
3. Creare share separate, ad esempio:
   - `media`
   - `documents`
   - `backups`
   - `private`
4. Collegare il fisso via Ethernet al router.
5. Impostare IP statico o reservation DHCP.

### Fase 2: preparare il server servizi

1. Installare `Debian` sul portatile i5.
2. Installare `Docker`, `Docker Compose`, `Tailscale`.
3. Montare la share `media` del fisso.
4. Avviare `Jellyfin` leggendo i file dal NAS.
5. Testare la riproduzione dalla smart TV.

### Fase 3: preparare il nodo leggero

1. Installare `Debian` minimale sul Pentium.
2. Disattivare sospensione e standby.
3. Installare i servizi leggeri che vuoi tenere sempre vivi.
4. Mettere monitoraggio base e riavvio automatico dei servizi.

## Software Consigliato

### Storage

- `OpenMediaVault`
- `Samba`
- `rsync`

### Media

- `Jellyfin`
- in alternativa `MiniDLNA` se vuoi il minimo indispensabile

### Rete e accesso remoto

- `Tailscale`

### Monitoraggio

- `Uptime Kuma`

### Utility

- `AdGuard Home`
- script personali

## Note 24/7

- usare sempre `Ethernet` per NAS e media server
- pulire ventole e controllare temperature
- sui portatili disattivare sospensione automatica
- se possibile limitare la carica della batteria al `60-80%`
- non considerare RAID come backup
- fare almeno una copia separata dei dati importanti

## Decisione Operativa

Se vuoi partire senza complicarti troppo:

- usa il `computer fisso` come NAS
- usa il portatile `i5` come media server e server applicativo
- usa il portatile `Pentium` per bot e servizi leggeri

Se invece vuoi il setup piu semplice in assoluto all'inizio:

- fai NAS + `Jellyfin` direttamente sul fisso
- sposta `Jellyfin` sull'i5 solo se noti problemi di transcodifica o lentezza

## Modalita Ibrida: NAS Sempre On + i5 Solo Quando Serve

Questa modalita e assolutamente possibile ed e anche abbastanza semplice da gestire.

Funziona cosi:

- il `computer fisso` resta sempre acceso come archivio e libreria media
- il portatile `i5` monta la libreria del fisso via rete
- `Jellyfin` sull'i5 viene acceso solo quando vuoi interfaccia migliore, metadata e transcodifica

### Quando e una buona idea

Va bene se:

- vuoi tenere bassi i consumi medi
- non ti serve `Jellyfin` 24/7
- ti va bene accendere l'i5 quando vuoi usare la libreria tramite app Jellyfin

### Quando diventa scomoda

Diventa un po' piu scomoda se:

- vuoi sempre la stessa esperienza sulla smart TV
- vuoi che `Jellyfin` sia sempre pronto
- vuoi monitoraggio e servizi sempre raggiungibili sul nodo i5

### Valutazione pratica

La difficolta tecnica e bassa.

La vera differenza e solo operativa:

- con l'i5 spento hai solo il NAS e l'eventuale direct play dal fisso
- con l'i5 acceso hai anche `Jellyfin` completo

Se per te va bene avere queste due modalita, e una soluzione sensata.

## Prossimi Passi

1. Verificare modello esatto dei dischi del fisso e loro stato SMART.
2. Verificare se la smart TV supporta bene i tuoi file piu comuni.
3. Decidere se partire con `OpenMediaVault` o `Debian`.
4. Installare prima il NAS, poi i servizi.

## File Operativi In Questa Cartella

- `home-lab-plan.md`: panoramica generale dell'architettura
- `setup-checklist.md`: checklist pratica di installazione
- `nas-directory-layout.md`: struttura cartelle consigliata per il NAS
- `docker-compose.yml`: stack base per il portatile i5
- `.env.example`: variabili da personalizzare per lo stack Docker
