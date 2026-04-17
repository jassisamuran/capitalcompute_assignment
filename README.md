# ScreenCasta

A cross-platform screen and webcam recorder desktop application built with **Electron**, **TypeScript**, **React**, and **Tailwind CSS**.

---

## Table of Contents

- [Features](#features)
- [Setup](#setup)
- [Usage](#usage)
- [File Structure](#file-structure)
- [Tech Stack](#tech-stack)
- [Permissions](#permissions)
- [Known Limitations](#known-limitations)
- [Edge Cases Handled](#edge-cases-handled)

---

## Features

- Browse all available displays and open windows with live thumbnails
- Select any screen or window to record
- Optional webcam overlay (picture-in-picture) — toggle on/off before recording
- Independent `screen.webm` and `webcam.webm` files saved per session
- Each session stored in a UUID-named folder: `videos/<uuid>/`
- Live recording timer (HH:MM:SS)
- Session library — browse, rename, and delete past recordings with file sizes
- "Open folder" button reveals files in Finder / File Explorer
- Safe close — prompts to save before quitting if recording is active
- Graceful permission handling for camera and screen capture

---

## Setup

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- **macOS** 12+, **Windows** 10+, or **Linux** (X11)

### Install & Run

```bash
git clone https://github.com/YOUR_USERNAME/captura.git
cd captura
npm install
npm start
```

### Build for distribution

```bash
npm run build
```

---

## Usage

1. **Launch** the app — you land on the Home screen
2. Click **New Recording**
3. Click **Scan sources** to load available displays and windows
4. Click any **source thumbnail** to select it
5. Toggle **Webcam on/off** in the controls bar
6. Click **REC** — the app window minimizes so it doesn't appear in your recording
7. Click **Stop** when done — files are saved automatically
8. The **Recording Complete** screen shows saved file names and sizes
9. Click **Open folder** to reveal files, or **View all recordings** to browse the library
10. In the library you can **rename** or **delete** any past session

---

## File Structure

### Recorded files on disk

```
~/Documents/Captura/videos/
├── 4a12ffac-b243-4fa3-8c9f-1123dfeaa342/
│   ├── screen.webm          ← screen recording
│   └── webcam.webm          ← webcam recording (only if webcam was on)
├── my-meeting_9f3bc201/     ← renamed session
│   └── screen.webm
└── ...
```

A new UUID folder is created for every recording session automatically.

### Project source structure

```
captura/
├── src/
│   ├── main/
│   │   ├── index.ts                 # Electron main process (IPC, FS, app lifecycle)
│   │   └── electron.vite.config.ts 
│   │
│   ├── preload/
│   │   └── index.ts                 # contextBridge (secure APIs)
│   │
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── App.tsx              # Root + view state machine
│           ├── main.tsx             # React entry point
│           ├── types/
│           │   └── index.ts         # shared types (better than flat file)
│           │
│           ├── styles/
│           │   └── index.css        # Tailwind base styles
│           │
│           ├── hooks/
│           │   └── useTimer.ts
│           │
│           ├── components/
│           │   ├── common/
│           │   │   ├── Icons.tsx
│           │   │   └── Label.tsx
│           │   │
│           │   ├── home/
│           │   │   └── HomeView.tsx
│           │   │
│           │   ├── source/
│           │   │   └── SourceGrid.tsx
│           │   │
│           │   ├── recording/
│           │   │   ├── RecordingView.tsx
│           │   │   ├── ControlsBar.tsx
│           │   │   └── WebcamPip.tsx
│           │   │
│           │   ├── completion/
│           │   │   ├── CompletionView.tsx
│           │   │   └── FileRow.tsx
│           │   │
│           │   ├── sessions/
│           │   │   └── SessionsView.tsx
│           │   │   
│
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.web.json
├── tsconfig.node.json
├── postcss.config.js
└── package.json



12 directories, 17 files
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop runtime | Electron 28 |
| Build tooling | electron-vite |
| UI framework | React 18 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Screen capture | `desktopCapturer` + `MediaRecorder` API |
| File I/O | Node.js `fs` module |
| Session IDs | `uuid` v4 |

---

## Permissions

### macOS

macOS requires explicit user approval for screen recording and camera access. The OS will prompt automatically on first use.

**If the prompt never appeared or was denied:**

| Permission | How to re-enable |
|---|---|
| Screen Recording | System Settings → Privacy & Security → Screen Recording → toggle Captura ON |
| Camera | System Settings → Privacy & Security → Camera → toggle Captura ON |

After changing permissions, **restart the app**.

The app checks camera permission status at launch and requests it proactively on macOS via `systemPreferences.askForMediaAccess('camera')`.

### Windows

Windows 10+ manages camera and microphone access via Settings.

| Permission | How to enable |
|---|---|
| Camera | Settings → Privacy & Security → Camera → Allow desktop apps to access your camera → ON |

Screen capture on Windows does not require a separate permission.

### Linux

On Linux (X11), screen capture works without additional permissions in most distributions. Wayland may require `pipewire` or `xdg-desktop-portal`. Camera access is managed by the kernel; ensure your user is in the `video` group:

```bash
sudo usermod -aG video $USER
# Log out and back in for the change to take effect
```

---

## Edge Cases Handled

### 1. Close window during active recording
**Trigger:** User clicks the × button or presses Cmd+Q while recording.
**Behavior:** A native dialog appears: _"Recording in progress — Save & Close or Cancel?"_. Choosing Save & Close saves the recording to disk first, then closes the app. Choosing Cancel returns to the recording.

### 2. Source window closed mid-recording
**Trigger:** User selects a specific app window, then closes that window while recording.
**Behavior:** The `MediaStreamTrack.onended` event fires. The app automatically stops and saves whatever was captured up to that point, then shows the completion screen.

### 3. Screen recording permission denied
**Trigger:** User denies the screen capture permission on macOS, or the permission was previously revoked.
**Behavior:** The source picker shows an error message with exact instructions to re-enable the permission in System Settings. The app does not crash.

### 4. Camera access denied
**Trigger:** User denies camera permission, or no camera is connected.
**Behavior:**
- `NotAllowedError` → "Camera access denied" message with OS-specific instructions shown in the webcam PiP area.
- `NotFoundError` → "No camera found" message. Recording continues without webcam.
- The webcam can be toggled off — recording always proceeds without it.


### 5. Empty recording (stopped immediately)
**Trigger:** User starts then immediately stops before any chunk is collected.
**Behavior:** No file is written for that track. The completion screen shows only the files that actually contain data.

### 6. MediaRecorder codec not supported
**Trigger:** Running on a platform where `video/webm;codecs=vp9` is not supported.
**Behavior:** Falls back to `video/webm` (VP8), then any supported format. Checked via `MediaRecorder.isTypeSupported()` before creating the recorder.

### 7. Session folder deleted between recording and save
**Trigger:** User or external process deletes the session folder while recording is in progress.
**Behavior:** `save-recording` IPC handler calls `ensureDir()` before writing, recreating the folder automatically.

### 8. Rename collision
**Trigger:** User tries to rename a session to a name that already exists on disk.
**Behavior:** The rename IPC handler checks with `existsSync()` before calling `renameSync()`, and throws a descriptive error. The UI shows: _"Could not rename — name may already be taken"_.

### 9. Open folder for deleted/renamed session
**Trigger:** User clicks "Open folder" after the folder was renamed or deleted externally.
**Behavior:** If the specific folder no longer exists, falls back to opening the root `videos/` directory in Finder/Explorer.

### 10. Scan sources before permissions granted
**Trigger:** User clicks "Scan sources" before granting screen recording permission.
**Behavior:** `desktopCapturer.getSources()` is wrapped in try/catch. Returns `{ ok: false, error }` instead of throwing. The UI shows an actionable error with permission instructions.

### 11. Force quit (Cmd+Q / taskbar terminate)
**Trigger:** User uses force-quit shortcuts while recording.
**Behavior:** `app.on('before-quit')` intercepts the event, sends `force-stop-recording` to the renderer, waits for the renderer to confirm files are saved via `recording-stopped` IPC, then allows the quit to proceed.

---

## Known Limitations

- **Audio not recorded** — `MediaRecorder` captures video only. To include system audio, add `audio: true` to the `getUserMedia` call. Note: system audio capture requires additional entitlements on macOS and may need a virtual audio driver (e.g. BlackHole).

- **WebM output only** — Files are saved as `.webm`. To convert to `.mp4`, install `ffmpeg` and run:
  ```bash
  ffmpeg -i screen.webm -c:v copy screen.mp4
  ```

- **Static source thumbnails** — Thumbnails shown in the source picker are snapshots taken at scan time. They do not update live.

- **Single source per session** — Only one screen or window can be recorded per session. Start a new recording to switch sources.

- **Partial files on hard kill** — If the process is killed via `kill -9` or Task Manager "End Task", the `.webm` file may be corrupt or truncated. Normal close and Cmd+Q are handled safely.

- **Wayland (Linux)** — Screen capture on Wayland requires `pipewire` and `xdg-desktop-portal`. The app works on X11 without additional configuration.

- **Webcam flip** — The webcam preview is mirrored horizontally (like a selfie camera). The recorded file is also mirrored. Remove `transform: scaleX(-1)` from `WebcamPip.tsx` to record in natural orientation.

---

## Recommended screen recording for submission

Record a walkthrough showing:
1. App launch → Home screen
2. New Recording → Scan sources
3. Select a window → Ready screen with webcam PiP
4. Start recording → Timer running
5. Stop → Completion screen with file sizes
6. Open folder → files visible in Finder/Explorer
7. Library screen → rename a session
8. Close attempt during recording → save dialog