import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

clean_function = """      async function loadTextbookPDF(
        videoId,
        time = null,
        clickedItem = null,
        chapterTitle = "",
        pauseVideo = false,
      ) {
        const oldVideoId = window.lastLoadedVideoId;
        if (oldVideoId) {
          const video = document.getElementById("lectureVideoPlayer");
          if (video && video.currentTime > 0) {
            localStorage.setItem("video_time_" + oldVideoId, video.currentTime);
            localStorage.setItem(
              "video_max_time_" + oldVideoId,
              maxTimeWatched,
            );
            if (typeof saveVideoProgress === "function") {
              saveVideoProgress(oldVideoId, video.currentTime, maxTimeWatched);
            }
          }
        }
        window.lastLoadedVideoId = videoId;
        try {
          const res = await fetch(`/api/lesson?video_id=${videoId}`);
          const data = await res.json();
          if (data) {
            if (data.blocked) {
              showDailyCapOverlay(data.reason);
              return;
            }
            if (data.video_id) {
              let resolvedTrack = selectedGoalTrack;
              if (data.video_id === "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques")
                resolvedTrack = "k12/12th_SM/Economics";
              else if (data.video_id === "vid_physics_01")
                resolvedTrack = "k12/12th_SM/physics";
              else if (data.video_id === "vid_chemistry_organic_chemistry_chemistry")
                resolvedTrack = "k12/12th_SM/chemistry";
              else if (data.video_id === "vid_philosophy_01")
                resolvedTrack =
                  "independent_learner/philosophy/stoicism_and_ethics";
              else if (data.video_id === "vid_physics_02")
                resolvedTrack = "k12/1st_grade/mathematics";

              const isNewVideo = oldVideoId !== data.video_id;
              if (selectedGoalTrack !== resolvedTrack || isNewVideo) {
                selectedGoalTrack = resolvedTrack;
                window.currentTrack = resolvedTrack;

                emittedTranscripts.clear();
                renderFlashcardsDeck(resolvedTrack);

                const savedChat = localStorage.getItem(
                  "chatHistory_" + resolvedTrack,
                );
                const chatFeedBox = document.getElementById("chatFeedBox");
                if (chatFeedBox) {
                  chatFeedBox.innerHTML = savedChat || "";
                }
                const tutorContainer = document.getElementById(
                  "tutorTranscriptContainer",
                );
                if (tutorContainer) {
                  tutorContainer.innerHTML = "";
                }

                renderKnowledgeCoreGrid();
                renderProfileInterests();
              }
            }
            if (data.instructor_locale) {
              window.ACTIVE_DATABASE_INSTRUCTOR_LOCALE = data.instructor_locale;
            }
            if (data.active_locale) {
              const userPref = localStorage.getItem("classroomUserLocalePref");
              window.ACTIVE_DATABASE_LOCALE = userPref || data.active_locale;
              const localeSel = document.getElementById(
                "classroomLocaleSelect",
              );
              if (localeSel) {
                localeSel.value = window.ACTIVE_DATABASE_LOCALE;
              }
            }

            // Adapt default audio translation mode when student matches teacher language
            const currentLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
            const teacherLoc =
              window.ACTIVE_DATABASE_INSTRUCTOR_LOCALE || "en_US";
            if (currentLoc === teacherLoc) {
              translationAudioMode = "original";
            } else {
              const storedAudioMode = localStorage.getItem(
                "lectureTranslationAudioMode",
              );
              translationAudioMode = storedAudioMode || "translated";
            }
            if (typeof updateTranslationAudioMode === "function") {
              updateTranslationAudioMode(translationAudioMode);
            }

            if (clickedItem) {
              document
                .querySelectorAll(".timestamp-item")
                .forEach((el) => el.classList.remove("active"));
              clickedItem.classList.add("active");
              activeTimestampItem = clickedItem;
            }

            let targetTimeSecs = null;
            if (time) {
              const parts = time.split(":");
              if (parts.length === 3) {
                targetTimeSecs =
                  parseInt(parts[0]) * 3600 +
                  parseInt(parts[1]) * 60 +
                  parseInt(parts[2]);
              } else if (parts.length === 2) {
                targetTimeSecs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
              }
              if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                wsConnection.send(
                  JSON.stringify({
                    action: "SEEK_VIDEO",
                    timestamp: time,
                    video_id: videoId,
                  }),
                );
              }
            }

            const activeTitle = chapterTitle || data.chapter_title || "";
            if (activeTitle) {
              showToastNotification(
                "Chapter Selected",
                `Playing chapter: ${activeTitle}`,
              );
            }
            const subEl = document.getElementById("videoSubject");
            if (subEl) {
              if (activeTitle) {
                subEl.innerText = activeTitle.toUpperCase();
              } else {
                if (videoId === "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques") {
                  subEl.innerText = "CHAPTER 1: EXTRA-ECONOMIC CHARACTERISTICS";
                } else if (videoId === "vid_calculus_01") {
                  subEl.innerText = "CHAPITRE 1: CALCULUS & DERIVATIVES";
                } else if (videoId === "vid_physics_01") {
                  subEl.innerText = "CHAPITRE 1: HARMONIC OSCILLATORS";
                } else if (videoId === "vid_philosophy_01") {
                  subEl.innerText = "CHAPITRE 1: STOIC PHILOSOPHY";
                } else {
                  subEl.innerText = "CHAPTER 1: LESSON INTRO";
                }
              }
            }
            if (data.video_id) {
              activeVideoId = data.video_id;
              window.ACTIVE_DATABASE_VIDEO_ID = data.video_id;
              
              // Automatically sync all sidebar tabs to the active video content
              if (typeof renderVideoSummary === "function") {
                renderVideoSummary(data.video_id);
              }
              if (typeof renderQuizQuestions === "function") {
                renderQuizQuestions();
              }
              if (typeof renderFlashcardsDeck === "function") {
                renderFlashcardsDeck(selectedGoalTrack);
              }

              // Update Profile Card video title and course title dynamically
              const currentPlayingTitle = data.video_file_path ? data.video_file_path.split("/").pop() : (data.title || "Lesson");
              document.querySelectorAll("#currentlyStudyingTitle, #profileTrackName, #tabProfileTrackName, #modalProfileTrackName").forEach((el) => {
                if (el) el.innerText = currentPlayingTitle;
              });
            }
            if (data.instructor_name) {
              activeInstructorName = data.instructor_name;
              document.querySelectorAll(".tutor-header-label").forEach((el) => {
                el.innerText = activeInstructorName;
              });

              // Update workspace instructor name and avatar too
              const wAvatar = document.getElementById("socraticAvatarImg");
              const wStatus = document.getElementById("tutorStatusIndicator");
              if (data.instructor_avatar) {
                window.ACTIVE_DATABASE_INSTRUCTOR_AVATAR =
                  data.instructor_avatar;
                if (wAvatar) {
                  wAvatar.src = data.instructor_avatar;
                }
              }
              if (wStatus) {
                wStatus.innerText = `${data.instructor_name} is online`;
              }

              // Override static 'Dr. Sophia AI' placeholder content
              const textContainer = document.getElementById(
                "instructor-text-box",
              );
              if (textContainer) {
                textContainer.innerHTML = "";

                const nameDiv = document.createElement("div");
                nameDiv.id = "profileCardName";
                nameDiv.style.fontWeight = "600";
                nameDiv.style.color = "#ffffff";
                nameDiv.style.fontSize = "0.7rem";
                nameDiv.style.whiteSpace = "nowrap";
                nameDiv.style.overflow = "hidden";
                nameDiv.style.textOverflow = "ellipsis";
                nameDiv.innerText = data.instructor_name;
                textContainer.appendChild(nameDiv);

                const roleDiv = document.createElement("div");
                roleDiv.id = "profileCardRole";
                roleDiv.style.fontSize = "0.6rem";
                roleDiv.style.color = "var(--on-surface-variant)";
                roleDiv.style.whiteSpace = "nowrap";
                roleDiv.style.overflow = "hidden";
                roleDiv.style.textOverflow = "ellipsis";
                roleDiv.innerText =
                  data.instructor_role || "Academic Specialist";
                textContainer.appendChild(roleDiv);
              }
              const profileAvatar =
                document.getElementById("profileCardAvatar");
              if (profileAvatar)
                profileAvatar.src =
                  data.instructor_avatar ||
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150";

              // Also update character selector carousel
              const carouselName = document.getElementById("carouselName");
              if (carouselName) carouselName.innerText = data.instructor_name;
              const carouselAvatar =
                document.getElementById("carouselAvatarImg");
              if (carouselAvatar)
                carouselAvatar.src =
                  data.instructor_avatar ||
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150";
              const carouselRole = document.getElementById("carouselRole");
              if (carouselRole)
                carouselRole.innerText =
                  data.instructor_role || "Academic Specialist";

              if (data.student_name) {
                window.ACTIVE_DATABASE_USER = data.student_name;
                activeStudentName = data.student_name;
                document
                  .querySelectorAll(".user-header-label")
                  .forEach((el) => {
                    el.innerText = activeStudentName;
                  });
              }

              const charIdx = CHARACTERS.findIndex(
                (c) => c.name === data.instructor_name,
              );
              if (charIdx !== -1) {
                activeCharacterIndex = charIdx;
              }
            }

            // Video loading & progress restoration on lectureVideoPlayer
            const video = document.getElementById("lectureVideoPlayer");
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

            if (typeof updateActiveTimestampHighlight === "function") {
              updateActiveTimestampHighlight();
            }
          }
        } catch (err) {
          console.warn("[LOAD_LESSON] Failed to load lesson data:", err);
        }
      }
"""

marker = "// Start student cam tracker simulation loop"
idx = txt.find(marker)
if idx != -1:
    txt = clean_function + "\n\n        " + txt[idx:]
    open(html_path, 'w', encoding='utf-8').write(txt)
    print("Re-inserted complete loadTextbookPDF function into index.html!")
else:
    print("Could not find marker!")
