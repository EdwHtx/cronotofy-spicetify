{
      brandSubtitle: "Native Musik-Analyse \xB7 Echtzeit-Telemetrie",
      tabs: {
        overview: "\xDCbersicht",
        artists: "K\xFCnstler",
        tracks: "Songs",
        albums: "Alben",
        live: "Live-Aktivit\xE4t"
      },
      periods: {
        short_term: "1 Monat",
        medium_term: "6 Monate",
        long_term: "Gesamt"
      },
      nowPlaying: "L\xE4uft gerade",
      paused: "Pausiert",
      currentSession: "Aktuelle Sitzung",
      today: "Heute",
      idleHint: "Spiele einen Song auf Spotify ab, um Live-Telemetrie zu erfassen.",
      loadingAnalytics: "Spotify-Statistiken werden geladen...",
      kpis: {
        recordedTime: "Erfasste Zeit",
        todayLabel: "Heute",
        annualInCronotofy: (h) => `${h} j\xE4hrlich in Cronotofy`,
        totalMod: (h) => `Gesamt: ${h}`,
        topArtist: (period) => `Top-K\xFCnstler (${period})`,
        artistsAnalyzed: (n) => `${n} K\xFCnstler analysiert`,
        topTrack: (period) => `Top-Song (${period})`,
        noData: "Keine Daten",
        favoriteGenre: "Lieblingsgenre",
        varied: "Gemischt",
        affinityAndRecent: (pct, n) => `${pct}% Anteil \xB7 ${n} k\xFCrzliche Plays`,
        tracksInRanking: (n) => `${n} Songs im Ranking`
      },
      sections: {
        top5Artists: "Top 5 K\xFCnstler",
        top5Tracks: "Top 5 Songs",
        top4Albums: "Top 4 Alben",
        genreDna: "Genre-DNA",
        mainGenresBadge: (n) => `${n} Top-Genres`,
        viewAll: (n) => `Alle ansehen (${n}) \u2192`,
        tracksRanking: (period) => `Song-Ranking \xB7 ${period}`,
        tracksBadge: (n) => `${n} Songs`,
        tracksListenedToday: "Heute geh\xF6rt",
        accumulatedDesktop: "Desktop gesamt",
        exactSecondBySecond: "Sekundengenaue Erfassung",
        capturedTracks: "Erfasste Songs",
        completedPlays: (n) => `${n} vollst\xE4ndige Plays`,
        lastSync: "Lokaler Speicher",
        pending: "Aktiv",
        topRealTimeTracks: "Songs nach echter H\xF6rzeit",
        topNBadge: (n) => `Top ${n}`,
        realArtistsAndRecent: "Echte K\xFCnstler & Verlauf",
        clearLocalHistory: "Lokalen Verlauf l\xF6schen",
        recordedPlays: (n) => `${n} erfasste Plays`,
        latestCapturedPlays: "Zuletzt erfasste Plays",
        localDateLabel: (d) => `Lokales Datum: ${d}`
      },
      entities: {
        spotifyArtist: "Spotify-K\xFCnstler",
        untitled: "Ohne Titel",
        unknownArtist: "Unbekannter K\xFCnstler",
        popularityLabel: (p) => `Pop ${p}`,
        topTracksCount: (n) => `${n} Top-Songs`,
        songSingular: "Song",
        songPlural: "Songs",
        playSingular: "Play",
        playPlural: "Plays"
      },
      empty: {
        noArtistsPeriod: "Keine K\xFCnstler f\xFCr diesen Zeitraum verf\xFCgbar.",
        noTracksPeriod: "Keine Songs f\xFCr diesen Zeitraum verf\xFCgbar.",
        noAlbumsPeriod: "Keine Alben vorhanden.",
        noGenres: "Keine Genre-Daten auf Spotify verf\xFCgbar.",
        noArtistsFound: "Keine Top-K\xFCnstler f\xFCr diesen Zeitraum gefunden.",
        noTrackedTimeYet: "Noch keine H\xF6rzeit erfasst. Spiele einfach einen Song auf Spotify ab.",
        noRecentPlaysYet: "Songs mit \u2265 25s H\xF6rzeit erscheinen hier chronologisch."
      },
      actions: {
        play: "Abspielen",
        pause: "Pause",
        addToQueue: "In die Warteschlange",
        playingNowToast: (title) => `Spielt: ${title}`,
        playbackErrorToast: "Wiedergabe konnte nicht gestartet werden",
        queuedToast: (title) => `Zur Warteschlange hinzugef\xFCgt: ${title}`,
        queueErrorToast: "Konnte nicht zur Warteschlange hinzugef\xFCgt werden",
        historyClearedToast: "Lokaler Verlauf gel\xF6scht",
        confirmClearHistory: "Wirklich l\xF6schen?",
        copiedTrackToast: (title) => `Kopiert: ${title}`,
        copyErrorToast: "Song konnte nicht kopiert werden",
        noTrackPlayingToast: "Gerade l\xE4uft kein Song"
      },
      search: {
        placeholder: "Nach Song, K\xFCnstler oder Album filtern...",
        clear: "Filter l\xF6schen",
        noResults: "Keine passenden Treffer gefunden."
      },
      streak: {
        daysBadge: (n) => `${n}T Serie`,
        last7Days: (h) => `7T: ${h}`
      },
      sleepTimer: {
        label: "Sleep-Timer",
        offToast: "Sleep-Timer aus",
        endOfTrackShort: "Ende",
        endOfTrackToast: "Sleep-Timer: Pause am Titelende",
        minutesToast: (m) => `Sleep-Timer: ${m} Min.`,
        triggeredToast: "Sleep-Timer abgelaufen \u2014 Wiedergabe pausiert",
        tooltipIdle: "Sleep-Timer (Alt+Shift+S)",
        tooltipActive: (detail) => `Sleep-Timer: ${detail} (Rechtsklick zum Abbrechen)`
      },
      time: {
        justNow: "Gerade eben",
        secondsAgo: (s) => `Vor ${s}s`,
        minutesAgo: (m) => `Vor ${m}m`,
        hoursAgo: (h) => `Vor ${h}h`
      },
      errorBoundary: {
        title: "Fehler in Cronotofy",
        fallbackMsg: "Beim Anzeigen dieser Ansicht ist ein unerwarteter Fehler aufgetreten.",
        retry: "Erneut versuchen"
      }
    }
