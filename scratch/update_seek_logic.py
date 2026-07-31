import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# Replace the seek restore block in loadTextbookPDF in index.html
old_block_start = "if (srcPathname !== targetPathname) {"
old_block_end = "if (typeof updateActiveTimestampHighlight === \"function\") {"

start_idx = txt.find(old_block_start)
end_idx = txt.find(old_block_end, start_idx)

if start_idx != -1 and end_idx != -1:
    new_seek_logic = """if (srcPathname !== targetPathname) {
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
    txt = txt[:start_idx] + new_seek_logic + txt[end_idx:]
    open(html_path, 'w', encoding='utf-8').write(txt)
    print("Successfully replaced seek restore logic in index.html!")
else:
    print("Could not find markers!")
