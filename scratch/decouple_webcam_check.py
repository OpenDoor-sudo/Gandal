import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# Replace the webcamVideo block with clean video player loading block
old_webcam_block_start = 'const webcamVideo = document.getElementById("tutorWebcamMock");'
old_webcam_block_end = 'if (typeof updateActiveTimestampHighlight === "function") {'

start_idx = txt.find(old_webcam_block_start)
end_idx = txt.find(old_webcam_block_end, start_idx)

if start_idx != -1 and end_idx != -1:
    clean_player_logic = """const video = document.getElementById("lectureVideoPlayer");
              const webcamVideo = document.getElementById("tutorWebcamMock");
              if (video && data.video_file_path) {
                const srcPathname = new URL(
                  video.src || "http://localhost",
                  window.location.origin,
                ).pathname.toLowerCase();
                const targetPath = (data.video_file_path || "").replace(
                  /\\\\/g,
                  "/",
                );
                const targetPathname = ("/" + targetPath)
                  .replace(/\/+/g, "/")
                  .toLowerCase();

                if (webcamVideo) {
                  try { webcamVideo.src = encodeURI(data.video_file_path); } catch (e) {}
                }

                window.isRestoringVideoProgress = true;

                const dbSavedTime = parseFloat(data.last_position || 0);
                const dbSavedMaxTime = parseFloat(data.max_position || 0);
                const localSavedTime = parseFloat(
                  localStorage.getItem("video_time_" + data.video_id) || "0"
                );
                const localSavedMaxTime = parseFloat(
                  localStorage.getItem("video_max_time_" + data.video_id) || "0"
                );

                const savedTime = Math.max(dbSavedTime, localSavedTime);
                const savedMaxTime = Math.max(dbSavedMaxTime, localSavedMaxTime);
                const effectiveRestoreTime = targetTimeSecs !== null ? targetTimeSecs : savedTime;

                maxTimeWatched = Math.max(savedMaxTime, effectiveRestoreTime, maxTimeWatched || 0);

                if (srcPathname !== targetPathname) {
                  video.src = encodeURI(data.video_file_path);
                  video.load();
                  emittedTranscripts.clear();
                  const tutorContainer = document.getElementById(
                    "tutorTranscriptContainer",
                  );
                  if (tutorContainer) {
                    tutorContainer.innerHTML = "";
                  }

                  let restoreDone = false;
                  const performSeekRestore = () => {
                    if (restoreDone) return;
                    restoreDone = true;
                    try {
                      window.isProgrammaticSeek = true;
                      if (effectiveRestoreTime > 0.5) {
                        console.log("[PROGRESS_RESTORE] Restoring video position to:", effectiveRestoreTime);
                        if (effectiveRestoreTime > maxTimeWatched) {
                          maxTimeWatched = effectiveRestoreTime;
                        }
                        video.currentTime = effectiveRestoreTime;
                      }

                      const startPlayback = () => {
                        if (pauseVideo) {
                          video.pause();
                          const playBtn = document.getElementById("playControlBtn");
                          if (playBtn) {
                            playBtn.innerHTML =
                              '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
                          }
                        } else {
                          const p = video.play();
                          if (p && p.catch) {
                            p.catch((e) => console.log("[PLAY_DEBUG] Autoplay prevented play:", e));
                          }
                        }
                        setTimeout(() => { window.isRestoringVideoProgress = false; }, 1000);
                      };

                      if (effectiveRestoreTime > 0.5) {
                        let seekedHandled = false;
                        const onSeeked = () => {
                          if (seekedHandled) return;
                          seekedHandled = true;
                          video.removeEventListener("seeked", onSeeked);
                          startPlayback();
                        };
                        video.addEventListener("seeked", onSeeked, { once: true });
                        setTimeout(onSeeked, 350);
                      } else {
                        startPlayback();
                      }
                    } catch (e) {
                      console.warn("[PROGRESS_RESTORE] Seek restore failed:", e);
                      window.isRestoringVideoProgress = false;
                    }
                  };

                  if (video.readyState >= 1) {
                    performSeekRestore();
                  } else {
                    video.addEventListener("loadedmetadata", performSeekRestore, { once: true });
                    video.addEventListener("canplay", performSeekRestore, { once: true });
                  }
                } else {
                  // Same video file is already loaded — seek if chapter was clicked OR restore saved progress
                  if (effectiveRestoreTime > 0.5) {
                    console.log("[PROGRESS_RESTORE] Same-src resume to:", effectiveRestoreTime);
                    window.isProgrammaticSeek = true;
                    if (effectiveRestoreTime > maxTimeWatched) {
                      maxTimeWatched = effectiveRestoreTime;
                    }
                    video.currentTime = effectiveRestoreTime;
                  }
                  if (pauseVideo) {
                    video.pause();
                    const playBtn = document.getElementById("playControlBtn");
                    if (playBtn) {
                      playBtn.innerHTML =
                        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
                    }
                  } else {
                    const p = video.play();
                    if (p && p.catch) {
                      p.catch((e) => console.log("[PLAY_DEBUG] Same-src play blocked:", e));
                    }
                  }
                  setTimeout(() => { window.isRestoringVideoProgress = false; }, 1000);
                }
              }

              """
    txt = txt[:start_idx] + clean_player_logic + txt[end_idx:]
    open(html_path, 'w', encoding='utf-8').write(txt)
    print("Successfully decoupled video progress restoration from tutorWebcamMock!")
else:
    print("Could not find markers!")
