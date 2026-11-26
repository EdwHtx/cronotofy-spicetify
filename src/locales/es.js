{
      brandSubtitle: "Anal\xEDtica musical nativa \xB7 Telemetr\xEDa en tiempo real",
      tabs: {
        overview: "Resumen",
        artists: "Artistas",
        tracks: "Canciones",
        albums: "\xC1lbumes",
        live: "Actividad en Vivo"
      },
      periods: {
        short_term: "1 Mes",
        medium_term: "6 Meses",
        long_term: "General"
      },
      nowPlaying: "Reproduciendo ahora",
      paused: "En pausa",
      currentSession: "Sesi\xF3n actual",
      today: "Hoy",
      idleHint: "Reproduce cualquier canci\xF3n en Spotify para capturar telemetr\xEDa en vivo.",
      loadingAnalytics: "Cargando tus estad\xEDsticas de Spotify...",
      kpis: {
        recordedTime: "Tiempo Registrado",
        todayLabel: "Hoy",
        annualInCronotofy: (h) => `${h} anual en Cronotofy`,
        totalMod: (h) => `Total: ${h}`,
        topArtist: (period) => `Top Artista (${period})`,
        artistsAnalyzed: (n) => `${n} artistas analizados`,
        topTrack: (period) => `Top Canci\xF3n (${period})`,
        noData: "Sin datos",
        favoriteGenre: "G\xE9nero Favorito",
        varied: "Variado",
        affinityAndRecent: (pct, n) => `${pct}% de afinidad \xB7 ${n} escuchas recientes`,
        tracksInRanking: (n) => `${n} canciones en ranking`
      },
      sections: {
        top5Artists: "Top 5 Artistas",
        top5Tracks: "Top 5 Canciones",
        top4Albums: "Top 4 \xC1lbumes",
        genreDna: "ADN de G\xE9neros",
        mainGenresBadge: (n) => `${n} principales`,
        viewAll: (n) => `Ver todos (${n}) \u2192`,
        tracksRanking: (period) => `Ranking de Canciones \xB7 ${period}`,
        tracksBadge: (n) => `${n} canciones`,
        tracksListenedToday: "Escuchado Hoy",
        accumulatedDesktop: "Acumulado en Escritorio",
        exactSecondBySecond: "Medici\xF3n exacta segundo a segundo",
        capturedTracks: "Pistas Capturadas",
        completedPlays: (n) => `${n} reproducciones completas`,
        lastSync: "Almacenamiento Local",
        pending: "Activo",
        topRealTimeTracks: "Canciones por Tiempo Real Escuchado",
        topNBadge: (n) => `Top ${n}`,
        realArtistsAndRecent: "Artistas Reales e Historial Reciente",
        clearLocalHistory: "Limpiar historial local",
        recordedPlays: (n) => `${n} reproducciones registradas`,
        latestCapturedPlays: "\xDAltimas Reproducciones Capturadas",
        localDateLabel: (d) => `Fecha local: ${d}`
      },
      entities: {
        spotifyArtist: "Artista de Spotify",
        untitled: "Sin t\xEDtulo",
        unknownArtist: "Artista desconocido",
        popularityLabel: (p) => `Pop ${p}`,
        topTracksCount: (n) => `${n} ${n === 1 ? "top canci\xF3n" : "top canciones"}`,
        songSingular: "canci\xF3n",
        songPlural: "canciones",
        playSingular: "play",
        playPlural: "plays"
      },
      empty: {
        noArtistsPeriod: "Sin artistas disponibles para este per\xEDodo.",
        noTracksPeriod: "Sin canciones disponibles para este per\xEDodo.",
        noAlbumsPeriod: "Sin \xE1lbumes para mostrar.",
        noGenres: "Sin etiquetas de g\xE9nero disponibles en Spotify.",
        noArtistsFound: "No se encontraron artistas principales para este per\xEDodo.",
        noTrackedTimeYet: "A\xFAn no hay tiempo acumulado. Dale play a cualquier canci\xF3n en Spotify y aparecer\xE1 aqu\xED en vivo.",
        noRecentPlaysYet: "Las canciones reproducidas \u2265 25s aparecer\xE1n en esta l\xEDnea de tiempo cronol\xF3gica."
      },
      actions: {
        play: "Reproducir",
        pause: "Pausar",
        addToQueue: "A\xF1adir a la cola",
        playingNowToast: (title) => `Reproduciendo: ${title}`,
        playbackErrorToast: "No se pudo iniciar la reproducci\xF3n",
        queuedToast: (title) => `A\xF1adida a la cola: ${title}`,
        queueErrorToast: "No se pudo a\xF1adir a la cola",
        historyClearedToast: "Historial local reiniciado",
        confirmClearHistory: "\xBFConfirmar borrado?",
        copiedTrackToast: (title) => `Copiada: ${title}`,
        copyErrorToast: "No se pudo copiar la canci\xF3n",
        noTrackPlayingToast: "No hay ninguna canci\xF3n sonando"
      },
      search: {
        placeholder: "Filtrar por canci\xF3n, artista o \xE1lbum...",
        clear: "Limpiar filtro",
        noResults: "Sin resultados para tu filtro."
      },
      streak: {
        daysBadge: (n) => `${n}d racha`,
        last7Days: (h) => `7d: ${h}`
      },
      sleepTimer: {
        label: "Temporizador",
        offToast: "Temporizador apagado",
        endOfTrackShort: "Fin",
        endOfTrackToast: "Temporizador: pausar al terminar la canci\xF3n",
        minutesToast: (m) => `Temporizador: ${m} min`,
        triggeredToast: "Temporizador finalizado \u2014 reproducci\xF3n pausada",
        tooltipIdle: "Temporizador de sue\xF1o (Alt+Shift+S)",
        tooltipActive: (detail) => `Temporizador: ${detail} (clic derecho para cancelar)`
      },
      time: {
        justNow: "Hace un momento",
        secondsAgo: (s) => `Hace ${s}s`,
        minutesAgo: (m) => `Hace ${m}m`,
        hoursAgo: (h) => `Hace ${h}h`
      },
      errorBoundary: {
        title: "Ocurri\xF3 un error al mostrar Cronotofy",
        fallbackMsg: "Ocurri\xF3 un problema inesperado al renderizar esta vista.",
        retry: "Reintentar"
      }
    }
