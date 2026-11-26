{
      brandSubtitle: "Analytique musicale native \xB7 T\xE9l\xE9m\xE9trie en temps r\xE9el",
      tabs: {
        overview: "Aper\xE7u",
        artists: "Artistes",
        tracks: "Titres",
        albums: "Albums",
        live: "Activit\xE9 en direct"
      },
      periods: {
        short_term: "1 Mois",
        medium_term: "6 Mois",
        long_term: "Global"
      },
      nowPlaying: "Lecture en cours",
      paused: "En pause",
      currentSession: "Session actuelle",
      today: "Aujourd'hui",
      idleHint: "Lancez un titre sur Spotify pour activer la t\xE9l\xE9m\xE9trie en direct.",
      loadingAnalytics: "Chargement de vos statistiques Spotify...",
      kpis: {
        recordedTime: "Temps enregistr\xE9",
        todayLabel: "Aujourd'hui",
        annualInCronotofy: (h) => `${h} annuel sur Cronotofy`,
        totalMod: (h) => `Total : ${h}`,
        topArtist: (period) => `Top Artiste (${period})`,
        artistsAnalyzed: (n) => `${n} artistes analys\xE9s`,
        topTrack: (period) => `Top Titre (${period})`,
        noData: "Aucune donn\xE9e",
        favoriteGenre: "Genre favori",
        varied: "Vari\xE9",
        affinityAndRecent: (pct, n) => `${pct}% d'affinit\xE9 \xB7 ${n} \xE9coutes r\xE9centes`,
        tracksInRanking: (n) => `${n} titres class\xE9s`
      },
      sections: {
        top5Artists: "Top 5 Artistes",
        top5Tracks: "Top 5 Titres",
        top4Albums: "Top 4 Albums",
        genreDna: "ADN des genres",
        mainGenresBadge: (n) => `${n} principaux`,
        viewAll: (n) => `Tout voir (${n}) \u2192`,
        tracksRanking: (period) => `Classement des titres \xB7 ${period}`,
        tracksBadge: (n) => `${n} titres`,
        tracksListenedToday: "\xC9cout\xE9 aujourd'hui",
        accumulatedDesktop: "Total sur ordinateur",
        exactSecondBySecond: "Mesure exacte seconde par seconde",
        capturedTracks: "Titres captur\xE9s",
        completedPlays: (n) => `${n} lectures compl\xE8tes`,
        lastSync: "Stockage local",
        pending: "Actif",
        topRealTimeTracks: "Titres par temps d'\xE9coute r\xE9el",
        topNBadge: (n) => `Top ${n}`,
        realArtistsAndRecent: "Artistes r\xE9els & historique r\xE9cent",
        clearLocalHistory: "Effacer l'historique local",
        recordedPlays: (n) => `${n} \xE9coutes enregistr\xE9es`,
        latestCapturedPlays: "Derni\xE8res lectures captur\xE9es",
        localDateLabel: (d) => `Date locale : ${d}`
      },
      entities: {
        spotifyArtist: "Artiste Spotify",
        untitled: "Sans titre",
        unknownArtist: "Artiste inconnu",
        popularityLabel: (p) => `Pop ${p}`,
        topTracksCount: (n) => `${n} top titres`,
        songSingular: "titre",
        songPlural: "titres",
        playSingular: "\xE9coute",
        playPlural: "\xE9coutes"
      },
      empty: {
        noArtistsPeriod: "Aucun artiste disponible pour cette p\xE9riode.",
        noTracksPeriod: "Aucun titre disponible pour cette p\xE9riode.",
        noAlbumsPeriod: "Aucun album \xE0 afficher.",
        noGenres: "Aucun genre disponible sur Spotify.",
        noArtistsFound: "Aucun artiste principal trouv\xE9 pour cette p\xE9riode.",
        noTrackedTimeYet: "Aucun temps cumul\xE9. Lancez n'importe quel titre sur Spotify.",
        noRecentPlaysYet: "Les titres \xE9cout\xE9s \u2265 25s appara\xEEtront ici."
      },
      actions: {
        play: "Lire",
        pause: "Pause",
        addToQueue: "Ajouter \xE0 la file d'attente",
        playingNowToast: (title) => `Lecture : ${title}`,
        playbackErrorToast: "Impossible de lancer la lecture",
        queuedToast: (title) => `Ajout\xE9 \xE0 la file : ${title}`,
        queueErrorToast: "Impossible d'ajouter \xE0 la file",
        historyClearedToast: "Historique local effac\xE9",
        confirmClearHistory: "Confirmer la suppression ?",
        copiedTrackToast: (title) => `Copi\xE9 : ${title}`,
        copyErrorToast: "Impossible de copier le titre",
        noTrackPlayingToast: "Aucun titre en cours de lecture"
      },
      search: {
        placeholder: "Filtrer par titre, artiste ou album...",
        clear: "Effacer le filtre",
        noResults: "Aucun r\xE9sultat pour ce filtre."
      },
      streak: {
        daysBadge: (n) => `${n}j de suite`,
        last7Days: (h) => `7j : ${h}`
      },
      sleepTimer: {
        label: "Minuteur",
        offToast: "Minuteur d\xE9sactiv\xE9",
        endOfTrackShort: "Fin",
        endOfTrackToast: "Minuteur : pause en fin de titre",
        minutesToast: (m) => `Minuteur : ${m} min`,
        triggeredToast: "Minuteur termin\xE9 \u2014 lecture en pause",
        tooltipIdle: "Minuteur de veille (Alt+Shift+S)",
        tooltipActive: (detail) => `Minuteur : ${detail} (clic droit pour annuler)`
      },
      time: {
        justNow: "\xC0 l'instant",
        secondsAgo: (s) => `Il y a ${s}s`,
        minutesAgo: (m) => `Il y a ${m}m`,
        hoursAgo: (h) => `Il y a ${h}h`
      },
      errorBoundary: {
        title: "Une erreur est survenue dans Cronotofy",
        fallbackMsg: "Une erreur inattendue s'est produite lors de l'affichage.",
        retry: "R\xE9essayer"
      }
    }
