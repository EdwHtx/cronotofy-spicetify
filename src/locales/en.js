{
      brandSubtitle: "Native music analytics \xB7 Real-time telemetry",
      tabs: {
        overview: "Overview",
        artists: "Artists",
        tracks: "Tracks",
        albums: "Albums",
        live: "Live Activity"
      },
      periods: {
        short_term: "1 Month",
        medium_term: "6 Months",
        long_term: "All Time"
      },
      nowPlaying: "Now Playing",
      paused: "Paused",
      currentSession: "Current session",
      today: "Today",
      idleHint: "Play any song on Spotify to start live telemetry.",
      loadingAnalytics: "Loading your Spotify stats...",
      kpis: {
        recordedTime: "Recorded Time",
        todayLabel: "Today",
        annualInCronotofy: (h) => `${h} annual in Cronotofy`,
        totalMod: (h) => `Total: ${h}`,
        topArtist: (period) => `Top Artist (${period})`,
        artistsAnalyzed: (n) => `${n} artists analyzed`,
        topTrack: (period) => `Top Track (${period})`,
        noData: "No data",
        favoriteGenre: "Favorite Genre",
        varied: "Varied",
        affinityAndRecent: (pct, n) => `${pct}% affinity \xB7 ${n} recent plays`,
        tracksInRanking: (n) => `${n} tracks in ranking`
      },
      sections: {
        top5Artists: "Top 5 Artists",
        top5Tracks: "Top 5 Tracks",
        top4Albums: "Top 4 Albums",
        genreDna: "Genre DNA",
        mainGenresBadge: (n) => `${n} top genres`,
        viewAll: (n) => `View all (${n}) \u2192`,
        tracksRanking: (period) => `Track Ranking \xB7 ${period}`,
        tracksBadge: (n) => `${n} tracks`,
        tracksListenedToday: "Listened Today",
        accumulatedDesktop: "Desktop Total",
        exactSecondBySecond: "Exact second-by-second tracking",
        capturedTracks: "Captured Tracks",
        completedPlays: (n) => `${n} completed plays`,
        lastSync: "Local Storage",
        pending: "Active",
        topRealTimeTracks: "Tracks by Real Listening Time",
        topNBadge: (n) => `Top ${n}`,
        realArtistsAndRecent: "Real Artists & Recent History",
        clearLocalHistory: "Clear local history",
        recordedPlays: (n) => `${n} recorded plays`,
        latestCapturedPlays: "Latest Captured Plays",
        localDateLabel: (d) => `Local date: ${d}`
      },
      entities: {
        spotifyArtist: "Spotify Artist",
        untitled: "Untitled",
        unknownArtist: "Unknown Artist",
        popularityLabel: (p) => `Pop ${p}`,
        topTracksCount: (n) => `${n} ${n === 1 ? "top track" : "top tracks"}`,
        songSingular: "track",
        songPlural: "tracks",
        playSingular: "play",
        playPlural: "plays"
      },
      empty: {
        noArtistsPeriod: "No artists available for this period.",
        noTracksPeriod: "No tracks available for this period.",
        noAlbumsPeriod: "No albums to display.",
        noGenres: "No genre tags available on Spotify.",
        noArtistsFound: "No top artists found for this period.",
        noTrackedTimeYet: "No accumulated time yet. Play any track on Spotify and it will appear live here.",
        noRecentPlaysYet: "Tracks played \u2265 25s will appear in this chronological timeline."
      },
      actions: {
        play: "Play",
        pause: "Pause",
        addToQueue: "Add to queue",
        playingNowToast: (title) => `Playing: ${title}`,
        playbackErrorToast: "Could not start playback",
        queuedToast: (title) => `Added to queue: ${title}`,
        queueErrorToast: "Could not add to queue",
        historyClearedToast: "Local history cleared",
        confirmClearHistory: "Confirm clear?",
        copiedTrackToast: (title) => `Copied: ${title}`,
        copyErrorToast: "Could not copy track info",
        noTrackPlayingToast: "No track playing right now"
      },
      search: {
        placeholder: "Filter by song, artist or album...",
        clear: "Clear filter",
        noResults: "No matching results for your filter."
      },
      streak: {
        daysBadge: (n) => `${n}d streak`,
        last7Days: (h) => `7d: ${h}`
      },
      sleepTimer: {
        label: "Sleep timer",
        offToast: "Sleep timer off",
        endOfTrackShort: "End",
        endOfTrackToast: "Sleep timer: pause at end of track",
        minutesToast: (m) => `Sleep timer: ${m} min`,
        triggeredToast: "Sleep timer finished \u2014 playback paused",
        tooltipIdle: "Sleep timer (Alt+Shift+S)",
        tooltipActive: (detail) => `Sleep timer: ${detail} (right-click to cancel)`
      },
      time: {
        justNow: "Just now",
        secondsAgo: (s) => `${s}s ago`,
        minutesAgo: (m) => `${m}m ago`,
        hoursAgo: (h) => `${h}h ago`
      },
      errorBoundary: {
        title: "Something went wrong in Cronotofy",
        fallbackMsg: "An unexpected error occurred while rendering this view.",
        retry: "Retry"
      }
    }
