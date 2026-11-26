{
      brandSubtitle: "An\xE1lise musical nativa \xB7 Telemetria em tempo real",
      tabs: {
        overview: "Resumo",
        artists: "Artistas",
        tracks: "M\xFAsicas",
        albums: "\xC1lbuns",
        live: "Atividade ao Vivo"
      },
      periods: {
        short_term: "1 M\xEAs",
        medium_term: "6 Meses",
        long_term: "Geral"
      },
      nowPlaying: "Tocando agora",
      paused: "Pausado",
      currentSession: "Sess\xE3o atual",
      today: "Hoje",
      idleHint: "Reproduza qualquer m\xFAsica no Spotify para iniciar a telemetria ao vivo.",
      loadingAnalytics: "Carregando suas estat\xEDsticas do Spotify...",
      kpis: {
        recordedTime: "Tempo Registrado",
        todayLabel: "Hoje",
        annualInCronotofy: (h) => `${h} anual no Cronotofy`,
        totalMod: (h) => `Total: ${h}`,
        topArtist: (period) => `Top Artista (${period})`,
        artistsAnalyzed: (n) => `${n} artistas analisados`,
        topTrack: (period) => `Top M\xFAsica (${period})`,
        noData: "Sem dados",
        favoriteGenre: "G\xEAnero Favorito",
        varied: "Variado",
        affinityAndRecent: (pct, n) => `${pct}% afinidade \xB7 ${n} recentes`,
        tracksInRanking: (n) => `${n} m\xFAsicas no ranking`
      },
      sections: {
        top5Artists: "Top 5 Artistas",
        top5Tracks: "Top 5 M\xFAsicas",
        top4Albums: "Top 4 \xC1lbuns",
        genreDna: "DNA de G\xEAneros",
        mainGenresBadge: (n) => `${n} principais`,
        viewAll: (n) => `Ver todos (${n}) \u2192`,
        tracksRanking: (period) => `Ranking de M\xFAsicas \xB7 ${period}`,
        tracksBadge: (n) => `${n} m\xFAsicas`,
        tracksListenedToday: "Ouvido Hoje",
        accumulatedDesktop: "Acumulado no Desktop",
        exactSecondBySecond: "Medi\xE7\xE3o exata segundo a segundo",
        capturedTracks: "Faixas Capturadas",
        completedPlays: (n) => `${n} reprodu\xE7\xF5es completas`,
        lastSync: "Armazenamento Local",
        pending: "Ativo",
        topRealTimeTracks: "M\xFAsicas por Tempo Real Ouvido",
        topNBadge: (n) => `Top ${n}`,
        realArtistsAndRecent: "Artistas Reais e Hist\xF3rico Recente",
        clearLocalHistory: "Limpar hist\xF3rico local",
        recordedPlays: (n) => `${n} reprodu\xE7\xF5es registradas`,
        latestCapturedPlays: "\xDAltimas Reprodu\xE7\xF5es Capturadas",
        localDateLabel: (d) => `Data local: ${d}`
      },
      entities: {
        spotifyArtist: "Artista do Spotify",
        untitled: "Sem t\xEDtulo",
        unknownArtist: "Artista desconhecido",
        popularityLabel: (p) => `Pop ${p}`,
        topTracksCount: (n) => `${n} top m\xFAsicas`,
        songSingular: "m\xFAsica",
        songPlural: "m\xFAsicas",
        playSingular: "play",
        playPlural: "plays"
      },
      empty: {
        noArtistsPeriod: "Sem artistas dispon\xEDveis para este per\xEDodo.",
        noTracksPeriod: "Sem m\xFAsicas dispon\xEDveis para este per\xEDodo.",
        noAlbumsPeriod: "Sem \xE1lbuns para mostrar.",
        noGenres: "Sem tags de g\xEAnero dispon\xEDveis no Spotify.",
        noArtistsFound: "Nenhum artista principal encontrado para este per\xEDodo.",
        noTrackedTimeYet: "Ainda n\xE3o h\xE1 tempo acumulado. D\xEA play em qualquer m\xFAsica no Spotify.",
        noRecentPlaysYet: "M\xFAsicas tocadas \u2265 25s aparecer\xE3o nesta linha do tempo."
      },
      actions: {
        play: "Reproduzir",
        pause: "Pausar",
        addToQueue: "Adicionar \xE0 fila",
        playingNowToast: (title) => `Tocando: ${title}`,
        playbackErrorToast: "N\xE3o foi poss\xEDvel iniciar a reprodu\xE7\xE3o",
        queuedToast: (title) => `Adicionada \xE0 fila: ${title}`,
        queueErrorToast: "N\xE3o foi poss\xEDvel adicionar \xE0 fila",
        historyClearedToast: "Hist\xF3rico local limpo",
        confirmClearHistory: "Confirmar limpeza?",
        copiedTrackToast: (title) => `Copiada: ${title}`,
        copyErrorToast: "N\xE3o foi poss\xEDvel copiar a m\xFAsica",
        noTrackPlayingToast: "Nenhuma m\xFAsica tocando agora"
      },
      search: {
        placeholder: "Filtrar por m\xFAsica, artista ou \xE1lbum...",
        clear: "Limpar filtro",
        noResults: "Nenhum resultado encontrado para o filtro."
      },
      streak: {
        daysBadge: (n) => `${n}d sequ\xEAncia`,
        last7Days: (h) => `7d: ${h}`
      },
      sleepTimer: {
        label: "Temporizador",
        offToast: "Temporizador desligado",
        endOfTrackShort: "Fim",
        endOfTrackToast: "Temporizador: pausar ao fim da faixa",
        minutesToast: (m) => `Temporizador: ${m} min`,
        triggeredToast: "Temporizador encerrado \u2014 reprodu\xE7\xE3o pausada",
        tooltipIdle: "Temporizador (Alt+Shift+S)",
        tooltipActive: (detail) => `Temporizador: ${detail} (clique direito para cancelar)`
      },
      time: {
        justNow: "Agora mesmo",
        secondsAgo: (s) => `H\xE1 ${s}s`,
        minutesAgo: (m) => `H\xE1 ${m}m`,
        hoursAgo: (h) => `H\xE1 ${h}h`
      },
      errorBoundary: {
        title: "Algo deu errado no Cronotofy",
        fallbackMsg: "Ocorreu um erro inesperado ao renderizar esta visualiza\xE7\xE3o.",
        retry: "Tentar novamente"
      }
    }
