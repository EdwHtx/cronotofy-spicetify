{
      brandSubtitle: "Statistik musik · Aktivitas langsung",
      tabs: { overview: "Ringkasan", artists: "Artis", tracks: "Lagu", albums: "Album", live: "Aktivitas langsung" },
      periods: { short_term: "1 Bulan", medium_term: "6 Bulan", long_term: "Sepanjang Waktu" },
      nowPlaying: "Sedang Diputar",
      paused: "Dijeda",
      currentSession: "Sesi saat ini",
      today: "Hari ini",
      idleHint: "Putar lagu di Spotify untuk mulai mencatat aktivitas.",
      loadingAnalytics: "Memuat statistik Spotify...",
      kpis: {
        recordedTime: "Durasi Tercatat", todayLabel: "Hari ini",
        annualInCronotofy: (h) => `${h} per tahun di Cronotofy`,
        totalMod: (h) => `Total: ${h}`,
        topArtist: (period) => `Artis Teratas (${period})`,
        artistsAnalyzed: (n) => `${n} artis dianalisis`,
        topTrack: (period) => `Lagu Teratas (${period})`,
        noData: "Belum ada data", favoriteGenre: "Genre Favorit", varied: "Beragam",
        affinityAndRecent: (pct, n) => `${pct}% kecocokan · ${n} pemutaran terbaru`,
        tracksInRanking: (n) => `${n} lagu dalam peringkat`
      },
      sections: {
        top5Artists: "5 Artis Teratas", top5Tracks: "5 Lagu Teratas", top4Albums: "4 Album Teratas",
        genreDna: "Profil Genre", mainGenresBadge: (n) => `${n} genre teratas`,
        viewAll: (n) => `Lihat semua (${n}) →`,
        tracksRanking: (period) => `Peringkat Lagu · ${period}`,
        tracksBadge: (n) => `${n} lagu`,
        tracksListenedToday: "Didengarkan Hari Ini", accumulatedDesktop: "Total di Desktop",
        exactSecondBySecond: "Pencatatan setiap detik", capturedTracks: "Lagu Tercatat",
        completedPlays: (n) => `${n} pemutaran tercatat`,
        lastSync: "Penyimpanan Lokal", pending: "Aktif",
        topRealTimeTracks: "Lagu Berdasarkan Durasi Mendengarkan",
        topNBadge: (n) => `${n} teratas`,
        realArtistsAndRecent: "Artis dan Riwayat Terbaru",
        clearLocalHistory: "Hapus riwayat lokal",
        recordedPlays: (n) => `${n} pemutaran tercatat`,
        latestCapturedPlays: "Pemutaran Terbaru",
        localDateLabel: (d) => `Tanggal lokal: ${d}`
      },
      entities: {
        spotifyArtist: "Artis Spotify", untitled: "Tanpa Judul", unknownArtist: "Artis Tidak Dikenal",
        popularityLabel: (p) => `Popularitas ${p}`,
        topTracksCount: (n) => `${n} lagu teratas`,
        songSingular: "lagu", songPlural: "lagu", playSingular: "pemutaran", playPlural: "pemutaran"
      },
      empty: {
        noArtistsPeriod: "Tidak ada artis untuk periode ini.",
        noTracksPeriod: "Tidak ada lagu untuk periode ini.",
        noAlbumsPeriod: "Tidak ada album untuk ditampilkan.",
        noGenres: "Tidak ada tag genre di Spotify.",
        noArtistsFound: "Tidak ada artis teratas untuk periode ini.",
        noTrackedTimeYet: "Belum ada durasi tercatat. Putar lagu di Spotify untuk melihatnya di sini.",
        noRecentPlaysYet: "Lagu yang diputar minimal 25 detik akan muncul di riwayat ini."
      },
      actions: {
        play: "Putar", pause: "Jeda", addToQueue: "Tambahkan ke antrean",
        playingNowToast: (title) => `Memutar: ${title}`,
        playbackErrorToast: "Pemutaran tidak dapat dimulai",
        queuedToast: (title) => `Ditambahkan ke antrean: ${title}`,
        queueErrorToast: "Tidak dapat menambahkan ke antrean",
        historyClearedToast: "Riwayat lokal dihapus", confirmClearHistory: "Hapus riwayat?",
        copiedTrackToast: (title) => `Disalin: ${title}`,
        copyErrorToast: "Tidak dapat menyalin info lagu",
        noTrackPlayingToast: "Tidak ada lagu yang sedang diputar"
      },
      search: { placeholder: "Filter berdasarkan lagu, artis, atau album...", clear: "Hapus filter", noResults: "Tidak ada hasil yang cocok." },
      streak: { daysBadge: (n) => `${n} hari berturut-turut`, last7Days: (h) => `7 hari: ${h}` },
      sleepTimer: {
        label: "Timer tidur", offToast: "Timer tidur nonaktif", endOfTrackShort: "Akhir lagu",
        endOfTrackToast: "Timer tidur: jeda di akhir lagu",
        minutesToast: (m) => `Timer tidur: ${m} menit`,
        triggeredToast: "Timer tidur selesai. Pemutaran dijeda.",
        tooltipIdle: "Timer tidur (Alt+Shift+S)",
        tooltipActive: (detail) => `Timer tidur: ${detail} (klik kanan untuk membatalkan)`
      },
      time: {
        justNow: "Baru saja", secondsAgo: (s) => `${s} detik lalu`,
        minutesAgo: (m) => `${m} menit lalu`, hoursAgo: (h) => `${h} jam lalu`
      },
      errorBoundary: { title: "Terjadi masalah di Cronotofy", fallbackMsg: "Tampilan ini tidak dapat dimuat.", retry: "Coba lagi" }
    }
