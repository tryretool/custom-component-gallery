import React, { type FC, useEffect, useMemo, useRef, useState } from 'react'
import { Retool } from '@tryretool/custom-component-support'

type Song = {
  URL: string
  title: string
}

export const AudioPlayer: FC = () => {
  Retool.useComponentSettings({
    defaultHeight: 70,
    defaultWidth: 3
  })

  const [songsInput] = Retool.useStateArray({
    name: 'songs',
    label: 'Songs',
    initialValue: [
      {
        title: 'Sound Helix Song',
        URL: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
      }
    ],
    description:
      '<b>Format:</b><br />[<br />&nbsp;&nbsp;{<br />&nbsp;&nbsp;&nbsp;&nbsp; title: "Song Name",<br />&nbsp;&nbsp;&nbsp;&nbsp; URL: "https://..." <br />&nbsp;&nbsp;},<br />&nbsp;&nbsp;{<br />&nbsp;&nbsp;&nbsp;&nbsp; title: "Song Name",<br />&nbsp;&nbsp;&nbsp;&nbsp; URL: "https://..." <br />&nbsp;&nbsp;}<br />]<br /><br /><b>Note:</b> YouTube links are not supported.'
  })

  const [headerTitle] = Retool.useStateString({
    name: 'headerTitle',
    label: 'Header Title',
    initialValue: 'Audio Library',
    description: 'Example: My Music'
  })

  const safeSongs = (() => {
    try {
      // If already array → use directly
      if (Array.isArray(songsInput)) return songsInput

      // If string → try parsing JSON
      if (typeof songsInput === 'string') {
        const parsed = JSON.parse(songsInput)
        return Array.isArray(parsed) ? parsed : []
      }

      // Fallback
      return []
    } catch (e) {
      console.warn('Invalid songsInput:', songsInput)
      return []
    }
  })()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressBarRef = useRef<HTMLDivElement | null>(null)
  const overlayProgressBarRef = useRef<HTMLDivElement | null>(null)
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTransitioningRef = useRef(false)
  const pendingAutoplayRef = useRef(false)
  const isUserPausedRef = useRef(false)
  const PLAYER_MEMORY_KEY = 'retool-audio-player-memory'
  const hasRestoredMemoryRef = useRef(false)
  const pendingSeekTimeRef = useRef(0)
  const fadeInTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(1)
  const [lastVolume, setLastVolume] = useState(1)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [shuffleOn, setShuffleOn] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'all' | 'one' | 'off'>('all')
  const [isMiniPlayer, setIsMiniPlayer] = useState(false)
  const [isFullscreenPlayerOpen, setIsFullscreenPlayerOpen] = useState(false)
  const marqueeRef = useRef<HTMLDivElement | null>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  const [songDurations, setSongDurations] = useState<Record<number, number>>({})
  const [shuffleQueue, setShuffleQueue] = useState<number[]>([])

  const songs: Song[] = useMemo(() => {
    return safeSongs.map((item: any) => ({
      title: String(item?.title || 'Unknown Title'),
      URL: String(item?.URL || '')
    }))
  }, [songsInput])

  // ✅ Theme Dropdown
  const [theme] = Retool.useStateEnumeration({
    name: 'theme',
    label: 'Theme',
    initialValue: 'roseGold',
    inspector: 'select',
    enumDefinition: [
      'spotify',
      'midnight',
      'sunset',
      'ocean',
      'royal',
      'roseGold',
      'amoled'
    ],
    enumLabels: {
      spotify: 'Spotify',
      midnight: 'Midnight',
      sunset: 'Sunset',
      ocean: 'Ocean',
      royal: 'Royal',
      roseGold: 'Rose Gold',
      amoled: 'AMOLED'
    }
  })

  // ✅ Optional custom color inputs from Retool
  const [customAccent] = Retool.useStateString({
    name: 'accentColor',
    label: 'Accent Color',
    initialValue: '',
    description: 'Example: #f97316'
  })

  const [customAccentSoft] = Retool.useStateString({
    name: 'accentSoftColor',
    label: 'Accent Soft Color',
    initialValue: '',
    description: 'Example: rgba(249,115,22,0.15)'
  })

  const [customAccentBorder] = Retool.useStateString({
    name: 'accentBorderColor',
    label: 'Accent Border Color',
    initialValue: '',
    description: 'Example: rgba(249,115,22,0.40)'
  })

  const [customBg] = Retool.useStateString({
    name: 'backgroundColor',
    label: 'Background Color',
    initialValue: '',
    description: 'Example: #121212'
  })

  const [customSurface] = Retool.useStateString({
    name: 'surfaceColor',
    label: 'Surface Color',
    initialValue: '',
    description: 'Example: rgba(255,255,255,0.05)'
  })

  const [customText] = Retool.useStateString({
    name: 'textColor',
    label: 'Text Color',
    initialValue: '',
    description: 'Example: #ffffff'
  })

  const [customMuted] = Retool.useStateString({
    name: 'mutedTextColor',
    label: 'Muted Text Color',
    initialValue: '',
    description: 'Example: rgba(255,255,255,0.68)'
  })

  // ✅ Theme Config
  const themes = {
    spotify: {
      accent: '#1db954',
      accentSoft: 'rgba(29,185,84,0.14)',
      accentBorder: 'rgba(29,185,84,0.35)',
      bg: '#121212',
      surface: 'rgba(255,255,255,0.04)',
      text: '#ffffff',
      muted: 'rgba(255,255,255,0.68)'
    },
    roseGold: {
      accent: '#e8b4b8',
      accentSoft: 'rgba(232,180,184,0.18)',
      accentBorder: 'rgba(232,180,184,0.45)',
      bg: '#1a1415',
      surface: 'rgba(255,255,255,0.05)',
      text: '#fce7e9',
      muted: 'rgba(252,231,233,0.65)'
    },
    midnight: {
      accent: '#6366f1',
      accentSoft: 'rgba(99,102,241,0.15)',
      accentBorder: 'rgba(99,102,241,0.4)',
      bg: '#0f172a',
      surface: 'rgba(255,255,255,0.05)',
      text: '#e5e7eb',
      muted: 'rgba(229,231,235,0.65)'
    },
    sunset: {
      accent: '#f97316',
      accentSoft: 'rgba(249,115,22,0.15)',
      accentBorder: 'rgba(249,115,22,0.4)',
      bg: '#1c1917',
      surface: 'rgba(255,255,255,0.05)',
      text: '#fafaf9',
      muted: 'rgba(250,250,249,0.65)'
    },
    ocean: {
      accent: '#0ea5e9',
      accentSoft: 'rgba(14,165,233,0.15)',
      accentBorder: 'rgba(14,165,233,0.4)',
      bg: '#020617',
      surface: 'rgba(255,255,255,0.05)',
      text: '#e2e8f0',
      muted: 'rgba(226,232,240,0.65)'
    },
    royal: {
      accent: '#8b5cf6',
      accentSoft: 'rgba(139,92,246,0.15)',
      accentBorder: 'rgba(139,92,246,0.4)',
      bg: '#0f0b1f',
      surface: 'rgba(255,255,255,0.05)',
      text: '#ede9fe',
      muted: 'rgba(237,233,254,0.65)'
    },
    amoled: {
      accent: '#ffffff',
      accentSoft: 'rgba(255,255,255,0.10)',
      accentBorder: 'rgba(255,255,255,0.18)',
      bg: '#000000',
      surface: 'rgba(255,255,255,0.03)',
      text: '#ffffff',
      muted: 'rgba(255,255,255,0.60)'
    }
  }

  const selectedTheme = themes[theme] || themes.spotify

  const currentTheme = {
    accent: customAccent?.trim() || selectedTheme.accent,
    accentSoft: customAccentSoft?.trim() || selectedTheme.accentSoft,
    accentBorder: customAccentBorder?.trim() || selectedTheme.accentBorder,
    bg: customBg?.trim() || selectedTheme.bg,
    surface: customSurface?.trim() || selectedTheme.surface,
    text: customText?.trim() || selectedTheme.text,
    muted: customMuted?.trim() || selectedTheme.muted
  }

  const themeVars = {
    '--accent': currentTheme.accent,
    '--accent-soft': currentTheme.accentSoft,
    '--accent-border': currentTheme.accentBorder,
    '--bg': currentTheme.bg,
    '--surface': currentTheme.surface,
    '--text': currentTheme.text,
    '--muted': currentTheme.muted
  } as React.CSSProperties

  useEffect(() => {
    if (!songs.length || hasRestoredMemoryRef.current) return

    const memory = loadPlaybackMemory()
    if (!memory) {
      hasRestoredMemoryRef.current = true
      return
    }

    const safeSongIndex =
      memory.currentSongIndex >= 0 && memory.currentSongIndex < songs.length
        ? memory.currentSongIndex
        : 0

    setCurrentSongIndex(safeSongIndex)
    setVolume(
      typeof memory.volume === 'number'
        ? Math.max(0, Math.min(1, memory.volume))
        : 1
    )
    setShuffleOn(!!memory.shuffleOn)
    setRepeatMode(
      memory.repeatMode === 'one' || memory.repeatMode === 'off'
        ? memory.repeatMode
        : 'all'
    )

    pendingSeekTimeRef.current =
      typeof memory.currentTime === 'number' && memory.currentTime > 0
        ? memory.currentTime
        : 0

    pendingAutoplayRef.current = !!memory.isPlaying
    isUserPausedRef.current = !memory.isPlaying

    hasRestoredMemoryRef.current = true
  }, [songs])

  useEffect(() => {
    const handleScroll = () => {
      setIsMiniPlayer(window.scrollY > 80)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
      if (fadeInTimeoutRef.current) clearTimeout(fadeInTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!songs.length) return

    savePlaybackMemory({
      currentSongIndex,
      currentTime,
      isPlaying,
      volume,
      shuffleOn,
      repeatMode
    })
  }, [
    currentSongIndex,
    currentTime,
    isPlaying,
    volume,
    shuffleOn,
    repeatMode,
    songs.length
  ])

  const shuffleArray = (arr: number[]) => {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  useEffect(() => {
    if (!songs.length) {
      setShuffleQueue([])
      return
    }

    if (!shuffleOn) {
      setShuffleQueue([])
      return
    }

    // When shuffle starts, current song counts as already played in current cycle
    const remainingInCurrentCycle = shuffleArray(
      songs
        .map((_, index) => index)
        .filter((index) => index !== currentSongIndex)
    )

    setShuffleQueue(remainingInCurrentCycle)
  }, [shuffleOn, songs.length])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !songs.length) return

    const currentSong = songs[currentSongIndex]
    if (!currentSong) return

    audio.src = currentSong.URL
    audio.load()

    setIsLoading(true)
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)
  }, [currentSongIndex, songs])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    audio.muted = volume === 0
  }, [volume])

  useEffect(() => {
    if (!songs.length) return

    const loadDurations = async () => {
      const durationMap: Record<number, number> = {}

      await Promise.all(
        songs.map(
          (song, index) =>
            new Promise<void>((resolve) => {
              if (!song.URL) {
                durationMap[index] = 0
                resolve()
                return
              }

              const tempAudio = new Audio()
              tempAudio.preload = 'metadata'
              tempAudio.src = song.URL

              const cleanup = () => {
                tempAudio.removeEventListener('loadedmetadata', onLoaded)
                tempAudio.removeEventListener('error', onError)
              }

              const onLoaded = () => {
                durationMap[index] = Number.isFinite(tempAudio.duration)
                  ? tempAudio.duration
                  : 0
                cleanup()
                resolve()
              }

              const onError = () => {
                durationMap[index] = 0
                cleanup()
                resolve()
              }

              tempAudio.addEventListener('loadedmetadata', onLoaded)
              tempAudio.addEventListener('error', onError)
            })
        )
      )

      setSongDurations(durationMap)
    }

    void loadDurations()
  }, [songs])

  const savePlaybackMemory = (data: {
    currentSongIndex: number
    currentTime: number
    isPlaying: boolean
    volume: number
    shuffleOn: boolean
    repeatMode: 'all' | 'one' | 'off'
  }) => {
    try {
      localStorage.setItem(PLAYER_MEMORY_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save playback memory:', error)
    }
  }

  const loadPlaybackMemory = () => {
    try {
      const raw = localStorage.getItem(PLAYER_MEMORY_KEY)
      if (!raw) return null
      return JSON.parse(raw) as {
        currentSongIndex: number
        currentTime: number
        isPlaying: boolean
        volume: number
        shuffleOn: boolean
        repeatMode: 'all' | 'one' | 'off'
      }
    } catch (error) {
      console.error('Failed to load playback memory:', error)
      return null
    }
  }

  const formatTimeWithBlink = (time: number, shouldBlink: boolean) => {
    if (!isFinite(time) || time < 0) return '0:00'

    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    const paddedSecs = String(secs).padStart(2, '0')

    return (
      <span className={shouldBlink ? 'time-blink' : ''}>
        {mins}:{paddedSecs}
      </span>
    )
  }

  const fadeInAudio = (targetVolume: number) => {
    const audio = audioRef.current
    if (!audio) return

    if (fadeInTimeoutRef.current) {
      clearTimeout(fadeInTimeoutRef.current)
    }

    const safeTarget = Math.max(0, Math.min(1, targetVolume))
    const fadeSteps = 10
    const fadeDuration = 260
    const stepTime = fadeDuration / fadeSteps
    let step = 0

    audio.volume = 0

    const runFade = () => {
      step += 1
      const nextVolume = Math.min(safeTarget, safeTarget * (step / fadeSteps))
      audio.volume = nextVolume

      if (step < fadeSteps) {
        fadeInTimeoutRef.current = setTimeout(runFade, stepTime)
      }
    }

    runFade()
  }

  const playCurrentAudio = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      setIsLoading(true)
      await audio.play()
      pendingAutoplayRef.current = false
      isUserPausedRef.current = false
      setIsPlaying(true)
      setIsLoading(false)
    } catch (error) {
      console.error('Error playing audio:', error)
      pendingAutoplayRef.current = false
      setIsPlaying(false)
      setIsLoading(false)
    }
  }

  const smoothSwitchSong = (newIndex: number, autoPlay = true) => {
    const audio = audioRef.current

    pendingAutoplayRef.current = autoPlay
    isUserPausedRef.current = !autoPlay

    if (!audio) {
      setCurrentSongIndex(newIndex)
      return
    }

    if (isTransitioningRef.current) return
    isTransitioningRef.current = true

    const startVolume = audio.volume
    const fadeSteps = 8
    const fadeDuration = 180
    const stepTime = fadeDuration / fadeSteps
    let step = 0

    if (!audio.paused && audio.volume > 0) {
      const fadeOut = () => {
        step += 1
        const nextVolume = Math.max(0, startVolume * (1 - step / fadeSteps))
        audio.volume = nextVolume

        if (step < fadeSteps) {
          fadeTimeoutRef.current = setTimeout(fadeOut, stepTime)
        } else {
          audio.pause()
          audio.volume = volume
          setCurrentSongIndex(newIndex)
          isTransitioningRef.current = false
        }
      }

      fadeOut()
    } else {
      setCurrentSongIndex(newIndex)
      isTransitioningRef.current = false
    }
  }

  const getNextShuffleQueue = (
    queue: number[],
    currentIndex: number,
    totalSongs: number
  ) => {
    if (queue.length > 0) {
      return {
        nextIndex: queue[0],
        nextQueue: queue.slice(1)
      }
    }

    // Current cycle finished, start a fresh cycle
    // Repeats are allowed in the new cycle
    const newCycle = shuffleArray(
      Array.from({ length: totalSongs }, (_, index) => index)
    )

    return {
      nextIndex: newCycle[0] ?? currentIndex,
      nextQueue: newCycle.slice(1)
    }
  }

  const getNextSongIndex = () => {
    if (!songs.length) return 0

    if (shuffleOn) {
      if (songs.length === 1) {
        return 0
      }

      const { nextIndex, nextQueue } = getNextShuffleQueue(
        shuffleQueue,
        currentSongIndex,
        songs.length
      )

      setShuffleQueue(nextQueue)
      return nextIndex
    }

    if (currentSongIndex === songs.length - 1) {
      if (repeatMode === 'all') return 0
      if (repeatMode === 'off') return null
    }

    return (currentSongIndex + 1) % songs.length
  }

  const getPrevSongIndex = () => {
    if (!songs.length) return 0

    if (shuffleOn) {
      if (songs.length === 1) return 0
      const randomIndexes = songs
        .map((_, index) => index)
        .filter((index) => index !== currentSongIndex)
      return randomIndexes[Math.floor(Math.random() * randomIndexes.length)]
    }

    if (currentSongIndex === 0) {
      if (repeatMode === 'all') return songs.length - 1
      if (repeatMode === 'off') return 0
    }

    return currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1
  }

  const persistCurrentPlaybackState = () => {
    savePlaybackMemory({
      currentSongIndex,
      currentTime: audioRef.current?.currentTime || currentTime || 0,
      isPlaying: !!audioRef.current && !audioRef.current.paused,
      volume,
      shuffleOn,
      repeatMode
    })
  }

  const togglePlayPause = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (audio.paused) {
        pendingAutoplayRef.current = true
        isUserPausedRef.current = false
        await playCurrentAudio()
      } else {
        pendingAutoplayRef.current = false
        isUserPausedRef.current = true
        audio.pause()
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsLoading(false)
    }
  }

  const updateProgress = () => {
    const audio = audioRef.current
    if (!audio) return

    const nextCurrentTime = audio.currentTime || 0
    const nextDuration = audio.duration || 0

    setCurrentTime(nextCurrentTime)
    setDuration(nextDuration)

    if (nextDuration > 0) {
      setProgress((nextCurrentTime / nextDuration) * 100)
    } else {
      setProgress(0)
    }
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return

    const newProgress = Number(e.target.value)
    const newTime = (newProgress / 100) * duration

    audio.currentTime = newTime
    setCurrentTime(newTime)
    setProgress(newProgress)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value)
    setVolume(newVolume)
    if (newVolume > 0) {
      setLastVolume(newVolume)
    }
  }

  const toggleMute = () => {
    if (volume === 0) {
      setVolume(lastVolume > 0 ? lastVolume : 1)
    } else {
      setLastVolume(volume)
      setVolume(0)
    }
  }

  const seekByRef = (
    event: React.MouseEvent<HTMLDivElement>,
    ref: React.RefObject<HTMLDivElement | null>
  ) => {
    const audio = audioRef.current
    const progressBar = ref.current
    if (!audio || !progressBar || !duration) return

    const rect = progressBar.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const width = rect.width
    const clickRatio = Math.max(0, Math.min(1, clickX / width))

    audio.currentTime = clickRatio * duration
    setCurrentTime(audio.currentTime)
    setProgress(clickRatio * 100)
  }

  const nextSong = () => {
    const nextIndex = getNextSongIndex()
    if (nextIndex === null) {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      setIsPlaying(false)
      return
    }
    smoothSwitchSong(nextIndex, true)
  }

  const prevSong = () => {
    const audio = audioRef.current

    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }

    const prevIndex = getPrevSongIndex()
    smoothSwitchSong(prevIndex, true)
  }

  const playSong = (index: number) => {
    if (shuffleOn) {
      setShuffleQueue((prev) => prev.filter((item) => item !== index))
    }

    if (currentSongIndex === index) {
      if (!isPlaying) {
        pendingAutoplayRef.current = true
        isUserPausedRef.current = false
        void playCurrentAudio()
      }
      return
    }

    smoothSwitchSong(index, true)
  }

  const cycleRepeatMode = () => {
    setRepeatMode((prev) => {
      if (prev === 'all') return 'one'
      if (prev === 'one') return 'off'
      return 'all'
    })
  }

  const handlePlay = () => {
    setIsPlaying(true)
    setIsLoading(false)
    persistCurrentPlaybackState()
  }

  const handlePause = () => {
    const audio = audioRef.current
    setIsPlaying(
      !!audio && !audio.ended && !pendingAutoplayRef.current ? false : false
    )
    persistCurrentPlaybackState()
  }

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (!audio) return

    const audioDuration = audio.duration || 0
    setDuration(audioDuration)
    setSongDurations((prev) => ({
      ...prev,
      [currentSongIndex]: audioDuration
    }))

    if (
      pendingSeekTimeRef.current > 0 &&
      pendingSeekTimeRef.current < audioDuration
    ) {
      audio.currentTime = pendingSeekTimeRef.current
      setCurrentTime(pendingSeekTimeRef.current)
      setProgress(
        audioDuration > 0
          ? (pendingSeekTimeRef.current / audioDuration) * 100
          : 0
      )
    }

    pendingSeekTimeRef.current = 0

    if (pendingAutoplayRef.current) {
      void playCurrentAudio()
    } else {
      setIsLoading(false)
    }
  }

  const handleCanPlay = () => {
    if (pendingAutoplayRef.current) {
      void playCurrentAudio()
    } else {
      setIsLoading(false)
    }
  }

  const handleWaiting = () => {
    setIsLoading(true)
  }

  const handleEnded = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (repeatMode === 'one') {
      try {
        audio.currentTime = 0
        setCurrentTime(0)
        setProgress(0)
        setIsLoading(false)

        pendingAutoplayRef.current = true
        isUserPausedRef.current = false

        const playPromise = audio.play()

        if (playPromise !== undefined) {
          await playPromise
          setIsPlaying(true)
        }
      } catch (error) {
        console.error('Error replaying audio in repeat-one mode:', error)
        pendingAutoplayRef.current = false
        setIsPlaying(false)
        setIsLoading(false)
      }

      return
    }

    const nextIndex = getNextSongIndex()
    if (nextIndex === null) {
      pendingAutoplayRef.current = false
      setIsPlaying(false)
      setIsLoading(false)
      return
    }

    smoothSwitchSong(nextIndex, true)
  }

  const renderVolumeIcon = () => {
    if (volume === 0) {
      return (
        <svg viewBox="0 0 24 24" className="volume-icon-svg">
          <path d="M16.5 12L19 14.5L17.5 16L15 13.5L12.5 16L11 14.5L13.5 12L11 9.5L12.5 8L15 10.5L17.5 8L19 9.5L16.5 12ZM5 9H8L12 5V19L8 15H5V9Z" />
        </svg>
      )
    }

    if (volume < 0.5) {
      return (
        <svg viewBox="0 0 24 24" className="volume-icon-svg">
          <path d="M5 9H8L12 5V19L8 15H5V9ZM14.5 12C14.5 10.97 13.92 10.08 13 9.63V14.37C13.92 13.92 14.5 13.03 14.5 12Z" />
        </svg>
      )
    }

    return (
      <svg viewBox="0 0 24 24" className="volume-icon-svg">
        <path d="M5 9H8L12 5V19L8 15H5V9ZM13 8.23V9.29C14.46 9.75 15.5 11.11 15.5 12.75C15.5 14.39 14.46 15.75 13 16.21V17.27C15.01 16.79 16.5 14.96 16.5 12.75C16.5 10.54 15.01 8.71 13 8.23ZM13 5V6.06C16.39 6.55 19 9.47 19 12.75C19 16.03 16.39 18.95 13 19.44V20.5C16.95 20 20 16.73 20 12.75C20 8.77 16.95 5.5 13 5Z" />
      </svg>
    )
  }

  const renderShuffleIcon = () => (
    <svg viewBox="0 0 24 24" className="icon-svg">
      <path d="M17 3L21 7L17 11V8H15.41L12.83 10.59L11.41 9.17L14.59 6H17V3ZM3 6H6.59L16 15.41V18H14.59L9.83 13.24L6.59 10H3V6ZM17 13V16H14.59L13 17.59L14.41 19L17 16.41V19L21 15L17 11V13ZM3 14V18H6.59L8.17 16.41L6.76 15H3V14Z" />
    </svg>
  )

  const renderRepeatIcon = () => (
    <div className="mode-icon-wrap">
      <svg viewBox="0 0 24 24" className="icon-svg">
        <path d="M17 17H17.5C18.88 17 20 15.88 20 14.5V9.5C20 8.12 18.88 7 17.5 7H6V4L2 8L6 12V9H17.5C17.78 9 18 9.22 18 9.5V14.5C18 14.78 17.78 15 17.5 15H17V17ZM7 7H6.5C5.12 7 4 8.12 4 9.5V14.5C4 15.88 5.12 17 6.5 17H18V20L22 16L18 12V15H6.5C6.22 15 6 14.78 6 14.5V9.5C6 9.22 6.22 9 6.5 9H7V7Z" />
      </svg>
      {repeatMode === 'one' && <span className="repeat-one-badge">1</span>}
    </div>
  )

  const renderPreviousIcon = () => (
    <svg viewBox="0 0 24 24" className="icon-svg">
      <path d="M7 6H9V18H7V6ZM10.5 12L18 17V7L10.5 12Z" />
    </svg>
  )

  const renderNextIcon = () => (
    <svg viewBox="0 0 24 24" className="icon-svg">
      <path d="M15 6H17V18H15V6ZM6 7V17L13.5 12L6 7Z" />
    </svg>
  )

  const openFullscreenPlayer = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const interactive = target.closest(
      '.play-pause-button, .progress-bar-container, .volume-icon-button, .volume-slider, .mini-open-button'
    )
    if (interactive) return
    setIsFullscreenPlayerOpen(true)
  }

  const formatTime = (time: number) => {
    if (!isFinite(time) || time < 0) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  const getSongRightText = (index: number) => {
    const savedDuration = songDurations[index] || 0

    if (index === currentSongIndex) {
      if (isLoading) return '...'

      const shouldBlink = !isPlaying && currentTime > 0
      const displayTime = currentTime > 0 ? currentTime : savedDuration

      return formatTimeWithBlink(displayTime, shouldBlink)
    }

    return formatTime(savedDuration)
  }

  const currentSongTitle = songs[currentSongIndex]?.title || 'Unknown Title'

  useEffect(() => {
    const el = marqueeRef.current
    if (!el) return

    const checkOverflow = () => {
      setIsOverflowing(el.scrollWidth > el.clientWidth)
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)

    return () => window.removeEventListener('resize', checkOverflow)
  }, [currentSongTitle])

  if (!songs.length) {
    return (
      <div className="audio-player-root" style={themeVars}>
        <style>{styles}</style>
        <div className="empty-state">
          <div className="empty-title">🎵 No songs yet</div>
          <div className="empty-subtitle">
            Add songs in the <b>Songs</b> field to start playing music
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="audio-player-root" style={themeVars}>
      <style>{styles}</style>

      <div className="app-shell">
        <div className="header">
          <h1 className="header-title">{headerTitle || 'Audio Library'}</h1>
          {/* <div className="header-subtitle">{songs.length} tracks available</div> */}
        </div>

        <div className="song-list">
          {songs
            .map((song, i) => ({ song, originalIndex: i }))
            .map(({ song, originalIndex }) => (
              <div
                key={originalIndex}
                className={`song-item ${originalIndex === currentSongIndex ? 'active' : ''}`}
                onClick={() => playSong(originalIndex)}
              >
                <div className="song-index">
                  {originalIndex === currentSongIndex && isPlaying
                    ? '♪'
                    : originalIndex + 1}
                </div>

                <div className="song-content">
                  <div className="song-title-text">
                    {song.title || 'Unknown Title'}
                  </div>
                  <div className="song-subtext">
                    {originalIndex === currentSongIndex
                      ? isPlaying
                        ? ''
                        : ''
                      : ''}
                  </div>
                </div>

                <div
                  className={`song-duration ${
                    originalIndex === currentSongIndex ? 'active' : ''
                  } ${
                    originalIndex === currentSongIndex &&
                    !isPlaying &&
                    currentTime > 0
                      ? 'paused-blink'
                      : ''
                  }`}
                >
                  {getSongRightText(originalIndex)}
                </div>
              </div>
            ))}
        </div>

        <div
          className={`player-container ${isMiniPlayer ? 'mini' : ''}`}
          onClick={openFullscreenPlayer}
        >
          <div className="left-controls">
            <div className="track-row">
              <div className={`equalizer ${isPlaying ? 'playing' : ''}`}>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
              </div>

              <div className="track-title-wrap">
                <div className="track-title-marquee">
                  <span>{currentSongTitle}</span>
                  <span>{currentSongTitle}</span>
                </div>
              </div>
            </div>

            <div className="track-subtitle">
              {isLoading ? 'Fetching audio...' : ''}
            </div>
          </div>

          <div className="center-info">
            <div className="timeline-wrapper">
              <div className="time-label">{formatTime(currentTime)}</div>

              <input
                className="progress-slider"
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progress}
                onClick={(e) => e.stopPropagation()}
                onChange={handleProgressChange}
              />

              <div className="time-label">
                {duration > 0 ? formatTime(duration) : '...'}
              </div>
            </div>

            <div className="controls-row">
              <button
                className={`mode-button ${shuffleOn ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setShuffleOn((prev) => {
                    const nextValue = !prev

                    if (!nextValue) {
                      setShuffleQueue([])
                    } else {
                      const remainingInCurrentCycle = shuffleArray(
                        songs
                          .map((_, index) => index)
                          .filter((index) => index !== currentSongIndex)
                      )
                      setShuffleQueue(remainingInCurrentCycle)
                    }

                    return nextValue
                  })
                }}
                title="Shuffle"
              >
                {renderShuffleIcon()}
              </button>

              <button
                className="next-prev-button"
                onClick={(e) => {
                  e.stopPropagation()
                  prevSong()
                }}
                title="Previous"
              >
                {renderPreviousIcon()}
              </button>

              <button
                className="play-pause-button"
                onClick={(e) => {
                  e.stopPropagation()
                  void togglePlayPause()
                }}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                className="next-prev-button"
                onClick={(e) => {
                  e.stopPropagation()
                  nextSong()
                }}
                title="Next"
              >
                {renderNextIcon()}
              </button>

              <button
                className={`mode-button ${repeatMode !== 'off' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  cycleRepeatMode()
                }}
                title="Repeat mode"
              >
                {renderRepeatIcon()}
              </button>
            </div>

            <div
              className="horizontal-volume-row"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="volume-icon-button"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMute()
                }}
                title="Toggle volume"
              >
                {renderVolumeIcon()}
              </button>

              <input
                className="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onClick={(e) => e.stopPropagation()}
                onChange={handleVolumeChange}
              />
            </div>
          </div>

          {
            isMiniPlayer
            //   && (
            //     <button
            //       className="mini-open-button"
            //       onClick={(e) => {
            //         e.stopPropagation()
            //         setIsFullscreenPlayerOpen(true)
            //       }}
            //       title="Open player"
            //     >
            //       <svg viewBox="0 0 24 24" className="icon-svg">
            //         <path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" />
            //       </svg>
            //     </button>
            //   )
          }

          <div className="right-controls"></div>

          <audio
            ref={audioRef}
            preload="metadata"
            onTimeUpdate={updateProgress}
            onPlay={handlePlay}
            onPause={handlePause}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onWaiting={handleWaiting}
            onEnded={handleEnded}
          />
        </div>

        {isFullscreenPlayerOpen && (
          <div className="fullscreen-overlay">
            <div className="overlay-topbar">
              <button
                className="overlay-close"
                onClick={() => setIsFullscreenPlayerOpen(false)}
                title="Close player"
              >
                <svg viewBox="0 0 24 24" className="icon-svg">
                  <path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" />
                </svg>
              </button>
              <div className="overlay-subtitle">Now Playing</div>
              <div style={{ width: 40 }}></div>
            </div>

            <div className="overlay-body">
              <div className="overlay-art">
                {currentSongTitle
                  ? currentSongTitle.charAt(0).toUpperCase()
                  : '♪'}
              </div>

              <div className="overlay-track-info">
                <div className="overlay-track-title-wrap">
                  <div className="overlay-track-title-marquee">
                    <span>{currentSongTitle}</span>
                    <span>{currentSongTitle}</span>
                  </div>
                </div>
                <div className="overlay-track-subtitle">
                  {isLoading ? 'Fetching audio...' : ''}
                </div>
              </div>

              <div className={`equalizer ${isPlaying ? 'playing' : ''}`}>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
              </div>

              <div className="overlay-bottom-stack">
                <div className="overlay-timeline">
                  <div className="time-label">{formatTime(currentTime)}</div>

                  <input
                    className="progress-slider"
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progress}
                    onChange={handleProgressChange}
                  />

                  <div className="time-label">
                    {duration > 0 ? formatTime(duration) : '...'}
                  </div>
                </div>

                <div className="overlay-controls">
                  <button
                    className={`overlay-icon-button ${shuffleOn ? 'active' : ''}`}
                    onClick={() => {
                      setShuffleOn((prev) => {
                        const nextValue = !prev

                        if (!nextValue) {
                          setShuffleQueue([])
                        } else {
                          const remainingInCurrentCycle = shuffleArray(
                            songs
                              .map((_, index) => index)
                              .filter((index) => index !== currentSongIndex)
                          )
                          setShuffleQueue(remainingInCurrentCycle)
                        }

                        return nextValue
                      })
                    }}
                    title="Shuffle"
                  >
                    {renderShuffleIcon()}
                  </button>

                  <button
                    className="overlay-icon-button"
                    onClick={prevSong}
                    title="Previous"
                  >
                    {renderPreviousIcon()}
                  </button>

                  <button
                    className="overlay-main-play"
                    onClick={() => void togglePlayPause()}
                  >
                    {isPlaying ? (
                      <svg viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <button
                    className="overlay-icon-button"
                    onClick={nextSong}
                    title="Next"
                  >
                    {renderNextIcon()}
                  </button>

                  <button
                    className={`overlay-icon-button ${repeatMode !== 'off' ? 'active' : ''}`}
                    onClick={cycleRepeatMode}
                    title="Repeat mode"
                  >
                    {renderRepeatIcon()}
                  </button>
                </div>

                <div className="horizontal-volume-row">
                  <button
                    className="volume-icon-button"
                    type="button"
                    onClick={toggleMute}
                    title="Toggle volume"
                  >
                    {renderVolumeIcon()}
                  </button>

                  <input
                    className="volume-slider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = `
/* ===== SCROLLBAR - GLOBAL ===== */

/* Chrome, Edge, Safari */
::-webkit-scrollbar {
  width: 10px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--accent), #17a74a);
  border-radius: 10px;
  transition: background 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #22c55e, #16a34a);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--accent) rgba(255, 255, 255, 0.05);
}

* {
  box-sizing: border-box;
}

.audio-player-root {
  margin: 0;
  padding: 0;
  font-family: "IBM Plex Sans", sans-serif;
  background:
    radial-gradient(circle at top left, rgba(29, 185, 84, 0.12), transparent 28%),
    linear-gradient(180deg, var(--bg) 0%, #0d0d0d 100%);
  color: var(--text);
  // min-height: 100vh;
  max-height: 600px;
  overflow-y: auto;
  width: 100%;
}

.app-shell {
  min-height: 100vh;
  padding-bottom: 130px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: rgba(255,255,255,0.7);
  }
  
.empty-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
  }
  
.empty-subtitle {
  text-align: center;
  font-size: 13px;
  color: rgba(255,255,255,0.5);
}

.header {
  position: sticky;
  top: 0;
  z-index: 30;
  padding: 22px 20px 12px 20px;
  background:
    linear-gradient(180deg, rgba(18, 18, 18, 0.96) 0%, rgba(18, 18, 18, 0.88) 70%, rgba(18, 18, 18, 0.35) 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0);
  transition: padding 0.2s ease, background 0.2s ease;
}

.header-title {
  font-size: 26px;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.header-subtitle {
  margin-top: 6px;
  color: var(--muted);
  font-size: 13px;
}

.song-list {
  margin: 0;
  padding: 12px 16px 100px 16px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

@media (min-width: 1100px) {
  .song-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    align-items: start;
  }
}

@media (min-width: 1500px) {
  .song-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.center-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 0;
  width: 100%;
}

.timeline-wrapper,
.overlay-timeline {
  width: 100%;
  display: grid;
  grid-template-columns: 42px 1fr 42px;
  align-items: center;
  gap: 10px;
}

.controls-row,
.overlay-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: nowrap;
}

.horizontal-volume-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.horizontal-volume-row .volume-icon-button {
  flex-shrink: 0;
}

.horizontal-volume-row .volume-slider {
  width: min(180px, 45%);
  min-width: 110px;
}

.overlay-body .horizontal-volume-row .volume-slider {
  width: min(220px, 52vw);
}

.player-container.mini .center-info {
  gap: 8px;
}

.player-container.mini .timeline-wrapper {
  display: grid !important;
  grid-template-columns: 38px 1fr 38px;
  gap: 8px;
}

.player-container.mini .controls-row {
  display: flex !important;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.player-container.mini .horizontal-volume-row {
  display: flex !important;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.player-container.mini .horizontal-volume-row .volume-slider {
  width: min(120px, 42vw);
}

.song-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  cursor: pointer;
  color: var(--text);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255,255,255,0.05);
  transition: all 0.22s ease;
  min-width: 0;
  width: 100%;
}

.song-item:hover {
  background: var(--surface);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--accent-soft);
}

.song-item.active {
  background: var(--accent-soft);
  border: 1px solid var(--accent-border);
  box-shadow: 0 8px 24px var(--accent-soft);
}

.song-index {
  width: 28px;
  min-width: 28px;
  height: 28px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
}

.song-item.active .song-index {
  background: var(--accent);
  color: var(--bg);
}

.song-content {
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.song-title-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.song-subtext {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text);
}

.song-duration {
  font-size: 12px;
  color: var(--text);
  font-weight: 600;
  min-width: 44px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.colon-blink {
  animation: colonBlink 1s steps(2, start) infinite;
}

.time-display {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  font-variant-numeric: tabular-nums;
}

.colon-blink {
  animation: colonBlink 1s steps(1) infinite;
}

.time-blink {
  animation: digitalBlink 1s steps(1) infinite;
  font-variant-numeric: tabular-nums;
}

@keyframes digitalBlink {
  0% { visibility: visible; }
  50% { visibility: hidden; }
  100% { visibility: visible; }
}

@keyframes colonBlink {
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
}

.overlay-track-title-wrap {
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  position: relative;
}

.overlay-track-title-marquee {
  display: flex;
  width: max-content;
  min-width: 100%;
  animation: overlayMarquee 12s linear infinite;
}

.overlay-track-title-marquee span {
  flex-shrink: 0;
  padding-right: 40px;
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
}

@keyframes overlayMarquee {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-30%);
  }
}

.song-duration.active {
  color: var(--accent);
}

.player-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: 240px 1fr;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(18,18,18,0.88);
  backdrop-filter: blur(14px);
  border-top: 1px solid var(--accent-border);
  box-shadow: 0 -10px 30px var(--accent-soft);
  z-index: 50;
  transition: all 0.28s ease;
  cursor: pointer;
}

.player-container.mini {
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  padding: 10px 12px;
}

.player-container.mini .track-subtitle {
  display: none !important;
}

.player-container.mini .player-bottom-stack {
  gap: 8px;
}

.player-container.mini .horizontal-volume-row {
  gap: 8px;
}

.player-container.mini .horizontal-volume-row .volume-slider {
  width: min(120px, 42vw);
}

.player-container.mini .left-controls {
  min-width: 0;
  width: 100%;
}

.player-container.mini .track-row {
  min-width: 0;
  gap: 8px;
}

.player-container.mini .track-title-wrap {
  width: 100%;
}

.player-container.mini .track-title-marquee {
  animation-duration: 14s;
}

.player-container.mini .center-info {
  width: auto;
  min-width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-container.mini .controls-row {
  display: flex !important;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.player-container.mini .play-pause-button {
  width: 42px;
  height: 42px;
  margin: 0;
}

.player-container.mini .play-pause-button svg {
  width: 20px;
  height: 20px;
}

.left-controls {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.track-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  width: 100%;
}

.track-title-wrap {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.track-title-marquee {
  display: flex;
  align-items: center;
  width: max-content;
  min-width: 100%;
  animation: marqueeScroll 18s linear infinite;
}

.track-title-marquee span {
  flex-shrink: 0;
  padding-right: 48px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
}

@keyframes marqueeScroll {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-50%);
  }
}

.track-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255,255,255,0.66);
}

.center-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.play-pause-button,
.next-prev-button,
.mode-button,
.overlay-icon-button,
.mini-open-button {
  border: none;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

.play-pause-button {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: 0 8px 18px var(--accent-soft);
  flex-shrink: 0;
}

.play-pause-button:hover {
  transform: scale(1.04);
  opacity: 0.95;
  background: var(--accent-soft);
}

.play-pause-button svg {
  fill: var(--bg);
  width: 24px;
  height: 24px;
  display: block;
}

.next-prev-button,
.mode-button,
.overlay-icon-button,
.mini-open-button {
  background: rgba(255,255,255,0.08);
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  padding: 10px 12px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.next-prev-button:hover,
.mode-button:hover,
.overlay-icon-button:hover,
.mini-open-button:hover {
  background: rgba(255,255,255,0.16);
}

.mode-button.active {
  background: var(--accent-soft);
  color: var(--accent);
  box-shadow: 0 0 10px var(--accent-soft);
}

.overlay-icon-button.active {
  background: var(--accent-soft);
  color: var(--accent);
  box-shadow: 0 0 10px var(--accent-soft);
}

.icon-svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
  display: block;
}

.mini-open-button {
  display: none;
  width: 38px;
  height: 38px;
  padding: 0;
  flex-shrink: 0;
}

.player-container.mini .mini-open-button {
  display: flex;
}

.repeat-one-badge {
  position: absolute;
  right: 6px;
  bottom: 4px;
  font-size: 9px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.mode-icon-wrap {
  position: relative;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.timeline-wrapper {
  width: 100%;
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  gap: 10px;
}

.time-label {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.progress-bar-container {
  width: 100%;
  background-color: rgba(255,255,255,0.14);
  border-radius: 999px;
  height: 6px;
  position: relative;
  cursor: pointer;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #4be07f);
  width: 0;
  border-radius: 999px;
  transition: width 0.15s linear;
}

.right-controls {
  display: none;
}

.volume-icon-button {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  flex-shrink: 0;
}

.volume-icon-button:hover {
  background: rgba(255,255,255,0.16);
}

.volume-icon-svg {
  width: 18px;
  height: 18px;
  fill: var(--text);
}

.volume-slider {
  width: 95px;
  height: 5px;
  border-radius: 999px;
  cursor: pointer;
  accent-color: var(--accent);
}

.progress-slider {
  width: 100%;
  height: 5px;
  border-radius: 999px;
  cursor: pointer;
  accent-color: var(--accent);
}

.mode-label {
  font-size: 11px;
  color: rgba(255,255,255,0.58);
  min-width: 52px;
}

.equalizer {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 16px;
  flex-shrink: 0;
}

.equalizer-bar {
  width: 3px;
  border-radius: 999px;
  background: var(--accent);
  height: 6px;
  opacity: 0.55;
}

.equalizer.playing .equalizer-bar:nth-child(1) {
  animation: equalize 0.8s ease-in-out infinite;
}

.equalizer.playing .equalizer-bar:nth-child(2) {
  animation: equalize 1s ease-in-out infinite 0.15s;
}

.equalizer.playing .equalizer-bar:nth-child(3) {
  animation: equalize 0.7s ease-in-out infinite 0.25s;
}

.equalizer.playing .equalizer-bar:nth-child(4) {
  animation: equalize 1.1s ease-in-out infinite 0.1s;
}

@keyframes equalize {
  0%, 100% { height: 4px; opacity: 0.45; }
  50% { height: 16px; opacity: 1; }
}

.player-middle-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.volume-above-timeline,
.overlay-volume-above-timeline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.player-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: 260px 1fr 80px;
  align-items: center;
  gap: 18px;
  padding: 14px 18px;
  background: var(--surface);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--accent-border);
  box-shadow: 0 -10px 30px var(--accent-soft);
  z-index: 50;
  transition: all 0.28s ease;
  cursor: pointer;
}

.right-controls {
  display: flex;
  justify-content: flex-end;
  min-width: 0;
}

.player-container.mini {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  padding: 10px 12px;
  gap: 10px;
}

.player-container.mini .player-middle-stack {
  gap: 8px;
}

.player-container.mini .volume-above-timeline {
  display: flex !important;
  justify-content: center;
  gap: 8px;
}

.player-container.mini {
  height: 62px;
}

.player-container.mini {
  height: 62px;
}

.player-container.mini .timeline-wrapper {
  display: grid !important;
  grid-template-columns: 42px 1fr 42px;
  gap: 8px;
  width: 100%;
}

.overlay-volume-above-timeline {
  margin-top: 4px;
  margin-bottom: 2px;
}

.overlay-volume-above-timeline {
  height: 96px;
}

.overlay-volume-above-timeline {
  height: 96px;
}

.empty-state {
  padding: 24px 20px;
  color: rgba(255,255,255,0.75);
  font-size: 14px;
}

.fullscreen-overlay {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at top center, var(--accent-soft), transparent 35%),
    linear-gradient(180deg, var(--bg) 0%, var(--bg) 100%);
  z-index: 120;
  display: flex;
  flex-direction: column;
  padding: 18px 18px 24px 18px;
  animation: overlayFadeIn 0.25s ease;
}

@keyframes overlayFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.overlay-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.overlay-close {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: none;
  background: rgba(255,255,255,0.08);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.overlay-close:hover {
  background: rgba(255,255,255,0.16);
}

.overlay-subtitle {
  font-size: 12px;
  color: rgba(255,255,255,0.66);
  text-align: center;
  flex: 1;
}

.overlay-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 22px;
  min-height: 0;
}

.overlay-art {
  width: min(72vw, 320px);
  height: min(72vw, 320px);
  border-radius: 24px;
  background: linear-gradient(
    135deg,
    var(--accent),
    color-mix(in srgb, var(--accent) 40%, black)
  );
  box-shadow: 0 20px 50px var(--accent-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72px;
  font-weight: 700;
  color: rgba(255,255,255,0.92);
  user-select: none;
}

.overlay-track-info {
  width: 100%;
  max-width: 420px;
  text-align: center;
}

.overlay-track-title {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
  word-break: break-word;
}

.overlay-track-subtitle {
  margin-top: 8px;
  font-size: 13px;
  color: var(--muted);
}

.overlay-timeline {
  width: 100%;
  max-width: 420px;
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  gap: 10px;
  align-items: center;
}

.overlay-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: nowrap;
}

.overlay-main-play {
  width: 62px;
  height: 62px;
  min-width: 62px;
  border-radius: 999px;
  border: none;
  background: var(--accent);
  color: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  box-shadow: 0 10px 24px var(--accent-soft);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.overlay-main-play:hover {
  transform: scale(1.05);
  box-shadow: 0 14px 30px var(--accent-soft);
}

.overlay-main-play svg {
  width: 28px;
  height: 28px;
  fill: var(--bg);
  display: block;
}

@media (max-width: 900px) {
  .player-container:not(.mini) {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 12px 14px 14px 14px;
  }

  .player-container:not(.mini) .left-controls,
  .player-container:not(.mini) .center-info,
  .player-container:not(.mini) .right-controls {
    width: 100%;
  }

  .player-container:not(.mini) .left-controls {
    align-items: center;
    text-align: center;
    min-width: 0;
    order: 1;
  }

  .player-container:not(.mini) .center-info {
    order: 2;
    gap: 8px;
  }

  .player-container:not(.mini) .right-controls {
    order: 3;
    justify-content: center;
  }

  .player-container.mini {
    grid-template-columns: minmax(0, 1fr) auto auto;
    padding: 10px 12px;
    gap: 10px;
  }

  .track-title-marquee span {
    font-size: 14px;
    max-width: 100%;
  }

  .track-subtitle {
    font-size: 11px;
    margin-top: 2px;
  }

  .controls-row {
    gap: 10px;
  }

  .player-bottom-stack,
.overlay-bottom-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.horizontal-volume-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.horizontal-volume-row .volume-icon-button {
  flex-shrink: 0;
}

.horizontal-volume-row .volume-slider {
  width: min(180px, 45%);
  min-width: 110px;
}

.overlay-bottom-stack .horizontal-volume-row .volume-slider {
  width: min(220px, 52vw);
}

  .timeline-wrapper {
    grid-template-columns: 40px 1fr 40px;
    gap: 8px;
  }

  .time-label {
    font-size: 11px;
  }
}

@media (max-width: 768px) {
  .player-container {
    grid-template-columns: 1fr;
    max-height: 100vh;
  }
}

@media (max-width: 600px) {
  .header {
    padding: 16px 12px 10px 12px;
    transition: padding 0.2s ease, background 0.2s ease;
  }

  .header-title {
    font-size: 22px;
  }

  .song-list {
    padding: 10px 14px 90px 14px;
    gap: 8px;
  }

  .song-item {
    padding: 12px;
    gap: 10px;
    border-radius: 12px;
  }

  .song-title-text {
    font-size: 14px;
  }

  .song-subtext {
    font-size: 11px;
  }

  .song-duration {
    font-size: 11px;
  }

  .player-container:not(.mini) {
    padding: 10px 12px 12px 12px;
    gap: 8px;
  }

  .track-title-marquee span {
    font-size: 13px;
    line-height: 1.25;
  }

  .track-subtitle {
    font-size: 10px;
  }

  .center-info {
    gap: 7px;
  }

  .controls-row {
    gap: 8px;
  }

  .player-container.mini .volume-control-pop {
  display: flex !important;
}

.player-container.mini .timeline-wrapper {
  display: grid !important;
  grid-template-columns: 38px 1fr 38px;
  gap: 8px;
}

.overlay-controls .volume-popup {
  height: 138px;
}

.overlay-controls {
  height: 96px;
}

  .next-prev-button,
  .mode-button,
  .overlay-icon-button {
    padding: 8px 10px;
    font-size: 12px;
  }

  .play-pause-button {
    width: 42px;
    height: 42px;
  }

  .play-pause-button svg {
    width: 22px;
    height: 22px;
  }

  .timeline-wrapper {
    grid-template-columns: 36px 1fr 36px;
    gap: 6px;
  }

  .time-label {
    font-size: 10px;
  }

  .volume-icon-button {
    width: 30px;
    height: 30px;
  }

  .volume-icon-svg {
    width: 16px;
    height: 16px;
  }

  .volume-slider {
    width: 80px;
  }

  .overlay-track-title {
    font-size: 20px;
  }

  .overlay-main-play {
    width: 60px;
    height: 60px;
  }
}

@media (max-width: 480px) {
  .track-subtitle {
    display: none;
  }

  .player-container:not(.mini) {
    padding-top: 10px;
  }
}
}
`
