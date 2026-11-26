{
      brandSubtitle: "Analisi musicale nativa \xB7 Telemetria in tempo reale",
      tabs: {
        overview: "Panoramica",
        artists: "Artisti",
        tracks: "Brani",
        albums: "Album",
        live: "Attivit\xE0 Live"
      },
      periods: {
        short_term: "1 Mese",
        medium_term: "6 Mesi",
        long_term: "Sempre"
      },
      nowPlaying: "In riproduzione",
      paused: "In pausa",
      currentSession: "Sessione attuale",
      today: "Oggi",
      idleHint: "Riproduci qualsiasi brano su Spotify per avviare la telemetria live.",
      loadingAnalytics: "Caricamento statistiche Spotify...",
      kpis: {
        recordedTime: "Tempo registrato",
        todayLabel: "Oggi",
        annualInCronotofy: (h) => `${h} annuale su Cronotofy`,
        totalMod: (h) => `Totale: ${h}`,
        topArtist: (period) => `Top Artista (${period})`,
        artistsAnalyzed: (n) => `${n} artisti analizzati`,
        topTrack: (period) => `Top Brano (${period})`,
        noData: "Nessun dato",
        favoriteGenre: "Genere preferito",
        varied: "Vario",
        affinityAndRecent: (pct, n) => `${pct}% affinit\xE0 \xB7 ${n} recenti`,
        tracksInRanking: (n) => `${n} brani in classifica`
      },
      sections: {
        top5Artists: "Top 5 Artisti",
        top5Tracks: "Top 5 Brani",
        top4Albums: "Top 4 Album",
        genreDna: "DNA dei Generi",
        mainGenresBadge: (n) => `${n} principali`,
        viewAll: (n) => `Vedi tutti (${n}) \u2192`,
        tracksRanking: (period) => `Classifica Brani \xB7 ${period}`,
        tracksBadge: (n) => `${n} brani`,
        tracksListenedToday: "Ascoltato oggi",
        accumulatedDesktop: "Totale su Desktop",
        exactSecondBySecond: "Misurazione esatta secondo per secondo",
        capturedTracks: "Brani acquisiti",
        completedPlays: (n) => `${n} ascolti completi`,
        lastSync: "Archivio locale",
        pending: "Attivo",
        topRealTimeTracks: "Brani per tempo reale di ascolto",
        topNBadge: (n) => `Top ${n}`,
        realArtistsAndRecent: "Artisti reali e cronologia",
        clearLocalHistory: "Cancella cronologia locale",
        recordedPlays: (n) => `${n} ascolti registrati`,
        latestCapturedPlays: "Ultimi ascolti acquisiti",
        localDateLabel: (d) => `Data locale: ${d}`
      },
      entities: {
        spotifyArtist: "Artista Spotify",
        untitled: "Senza titolo",
        unknownArtist: "Artista sconosciuto",
        popularityLabel: (p) => `Pop ${p}`,
        topTracksCount: (n) => `${n} top brani`,
        songSingular: "brano",
        songPlural: "brani",
        playSingular: "riproduzione",
        playPlural: "riproduzioni"
      },
      empty: {
        noArtistsPeriod: "Nessun artista disponibile per questo periodo.",
        noTracksPeriod: "Nessun brano disponibile per questo periodo.",
        noAlbumsPeriod: "Nessun album da mostrare.",
        noGenres: "Nessun tag di genere disponibile su Spotify.",
        noArtistsFound: "Nessun artista principale trovato per questo periodo.",
        noTrackedTimeYet: "Nessun tempo registrato. Riproduci un brano su Spotify per iniziare.",
        noRecentPlaysYet: "I brani ascoltati \u2265 25s appariranno in questa cronologia."
      },
      actions: {
        play: "Riproduci",
        pause: "Pausa",
        addToQueue: "Aggiungi in coda",
        playingNowToast: (title) => `In riproduzione: ${title}`,
        playbackErrorToast: "Impossibile avviare la riproduzione",
        queuedToast: (title) => `Aggiunto in coda: ${title}`,
        queueErrorToast: "Impossibile aggiungere in coda",
        historyClearedToast: "Cronologia locale cancellata",
        confirmClearHistory: "Confermare?",
        copiedTrackToast: (title) => `Copiato: ${title}`,
        copyErrorToast: "Impossibile copiare il brano",
        noTrackPlayingToast: "Nessun brano in riproduzione"
      },
      search: {
        placeholder: "Filtra per brano, artista o album...",
        clear: "Cancella filtro",
        noResults: "Nessun risultato trovato per il filtro."
      },
      streak: {
        daysBadge: (n) => `${n}g di fila`,
        last7Days: (h) => `7g: ${h}`
      },
      sleepTimer: {
        label: "Timer spegnimento",
        offToast: "Timer disattivato",
        endOfTrackShort: "Fine",
        endOfTrackToast: "Timer: pausa a fine brano",
        minutesToast: (m) => `Timer: ${m} min`,
        triggeredToast: "Timer scaduto \u2014 riproduzione in pausa",
        tooltipIdle: "Timer spegnimento (Alt+Shift+S)",
        tooltipActive: (detail) => `Timer: ${detail} (tasto destro per annullare)`
      },
      time: {
        justNow: "Proprio ora",
        secondsAgo: (s) => `${s}s fa`,
        minutesAgo: (m) => `${m}m fa`,
        hoursAgo: (h) => `${h}h fa`
      },
      errorBoundary: {
        title: "Si \xE8 verificato un errore in Cronotofy",
        fallbackMsg: "Errore imprevisto durante il rendering della vista.",
        retry: "Riprova"
      }
    }
