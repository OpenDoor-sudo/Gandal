
      let wsConnection = null;
      const initialStudentLocale = window.ACTIVE_DATABASE_LOCALE || "en_US";
      const initialTeacherLocale =
        window.ACTIVE_DATABASE_INSTRUCTOR_LOCALE || "en_US";
      let translationAudioMode =
        localStorage.getItem("lectureTranslationAudioMode") ||
        (initialStudentLocale === initialTeacherLocale
          ? "original"
          : "translated");
      let activeLectureAudio = null;
      let activeCharacterIndex = 0;
      let selectedGoalTrack = window.ACTIVE_DATABASE_TRACK || "College";
      let isDeviceLocked = false;
      let isVideoPausedBySentry = false;

      // Real camera face detection states
      window.USING_REAL_CAMERA_DETECTION = false;
      let blazefaceModel = null;
      let realCamDetectInterval = null;

      let activeStudentName = window.ACTIVE_DATABASE_USER || "Allison";
      let activeInstructorName = window.ACTIVE_DATABASE_INSTRUCTOR || "GANDHO";
      function getActiveStudentName() {
        return activeStudentName;
      }
      function getActiveInstructor() {
        return activeInstructorName;
      }

      // Character lists
      const CHARACTERS = [
        {
          name: "Dr. Sophia AI",
          role: "Cognitive Science Specialist",
          avatar:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
          experience: "8 years",
          phone: "+1-555-0100",
          bio: "Dr. Sophia AI is a Cognitive Science Specialist, specializing in AI-driven socratic tutor systems, machine learning, and cognitive neuroscience.",
        },
        {
          name: "Socrates",
          role: "Ancient Socratic Mentor",
          avatar:
            "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150",
          experience: "25 years",
          phone: "N/A",
          bio: "Socrates was a classical Greek philosopher credited as one of the founders of Western philosophy, known for the Socratic method of dialogue.",
        },
        {
          name: "Albert Einstein",
          role: "Quantum Physics Pioneer",
          avatar:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
          experience: "40 years",
          phone: "N/A",
          bio: "Albert Einstein was a theoretical physicist who developed the theory of relativity, one of the two pillars of modern physics, with a lifetime of academic exploration.",
        },
      ];

      // Curriculum staging tree definition representing files on disk
      const CURRICULUM_STAGING_TREE = {
        k12: {
          label: "K-12 Education",
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>`,
          groups: {
            "1st_grade": {
              label: "1st Grade",
              subjects: [
                {
                  id: "k12/1st_grade/english_language_arts",
                  label: "English Language Arts",
                },
                {
                  id: "k12/1st_grade/introductory_science",
                  label: "Introductory Science",
                },
                { id: "k12/1st_grade/mathematics", label: "Mathematics" },
              ],
            },
            "10th Grade": {
              label: "10th Grade",
              subjects: [],
            },
            "12th_SE": {
              label: "12th Grade (SE)",
              subjects: [
                { id: "k12/12th_SE/12th_grade", label: "12th Grade" },
                { id: "k12/12th_SE/1st_grade", label: "1st Grade" },
              ],
            },
            "12th_SM": {
              label: "12th Grade (SM)",
              subjects: [
                { id: "k12/12th_SM/chemistry", label: "Chemistry" },
                { id: "k12/12th_SM/Economics", label: "Economics & Calculus" },
                {
                  id: "k12/12th_SM/english_literature",
                  label: "English Literature",
                },
                { id: "k12/12th_SM/physics", label: "Physics" },
                { id: "k12/12th_SM/world_history", label: "World History" },
              ],
            },
            "12th_SS": {
              label: "12th Grade (SS)",
              subjects: [
                { id: "k12/12th_SS/12th_grade", label: "12th Grade" },
                { id: "k12/12th_SS/1st_grade", label: "1st Grade" },
              ],
            },
          },
        },
        college_level: {
          label: "College Level",
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
          groups: {
            business_and_finance: {
              label: "Business & Finance",
              subjects: [
                {
                  id: "college_level/business_and_finance/corporate_finance",
                  label: "Corporate Finance",
                },
                {
                  id: "college_level/business_and_finance/macroeconomics",
                  label: "Macroeconomics",
                },
              ],
            },
            computer_science: {
              label: "Computer Science",
              subjects: [
                {
                  id: "college_level/computer_science/data_structures",
                  label: "Data Structures",
                },
                {
                  id: "college_level/computer_science/data_structures_and_algorithms",
                  label: "Data Structures & Algorithms",
                },
                {
                  id: "college_level/computer_science/neural_networks_and_deep_learning",
                  label: "Neural Networks & Deep Learning",
                },
                {
                  id: "college_level/computer_science/operating_systems",
                  label: "Operating Systems",
                },
              ],
            },
            engineering: {
              label: "Engineering",
              subjects: [
                {
                  id: "college_level/engineering/electrical_circuits",
                  label: "Electrical Circuits",
                },
                {
                  id: "college_level/engineering/mechanical_statics",
                  label: "Mechanical Statics",
                },
              ],
            },
            mathematics: {
              label: "Mathematics",
              subjects: [
                {
                  id: "college_level/mathematics/differential_equations",
                  label: "Differential Equations",
                },
                {
                  id: "college_level/mathematics/linear_algebra",
                  label: "Linear Algebra",
                },
              ],
            },
            pre_med: {
              label: "Pre-Med",
              subjects: [
                {
                  id: "college_level/pre_med/biochemistry",
                  label: "Biochemistry",
                },
                {
                  id: "college_level/pre_med/human_anatomy",
                  label: "Human Anatomy",
                },
              ],
            },
          },
        },
        independent_learner: {
          label: "Independent Learner",
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
          groups: {
            advanced_hobbies: {
              label: "Advanced Hobbies",
              subjects: [
                {
                  id: "independent_learner/advanced_hobbies/amateur_rocketry",
                  label: "Amateur Rocketry",
                },
                {
                  id: "independent_learner/advanced_hobbies/chess_grandmaster_strategy",
                  label: "Chess Grandmaster Strategy",
                },
              ],
            },
            creative_arts: {
              label: "Creative Arts",
              subjects: [
                {
                  id: "independent_learner/creative_arts/digital_cinematography",
                  label: "Digital Cinematography",
                },
                {
                  id: "independent_learner/creative_arts/music_theory_and_composition",
                  label: "Music Theory & Composition",
                },
              ],
            },
            language_acquisition: {
              label: "Language Acquisition",
              subjects: [
                {
                  id: "independent_learner/language_acquisition/conversational_french",
                  label: "Conversational French",
                },
                {
                  id: "independent_learner/language_acquisition/mandarin_chinese",
                  label: "Mandarin Chinese",
                },
              ],
            },
            philosophy: {
              label: "Philosophy",
              subjects: [
                {
                  id: "independent_learner/philosophy/socratic_dialogues",
                  label: "Socratic Dialogues",
                },
                {
                  id: "independent_learner/philosophy/stoicism_and_ethics",
                  label: "Stoicism & Ethics",
                },
              ],
            },
          },
        },
        professional_certificates: {
          label: "Professional Certificates",
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
          groups: {
            cybersecurity: {
              label: "Cybersecurity",
              subjects: [
                {
                  id: "professional_certificates/cybersecurity/comptia_security_plus",
                  label: "CompTIA Security+",
                },
                {
                  id: "professional_certificates/cybersecurity/network_security",
                  label: "Network Security",
                },
              ],
            },
            data_science: {
              label: "Data Science",
              subjects: [
                {
                  id: "professional_certificates/data_science/google_data_analytics",
                  label: "Google Data Analytics",
                },
              ],
            },
            project_management: {
              label: "Project Management",
              subjects: [
                {
                  id: "professional_certificates/project_management/pmp_certification",
                  label: "PMP Certification",
                },
              ],
            },
            software_engineering: {
              label: "Software Engineering",
              subjects: [
                {
                  id: "professional_certificates/software_engineering/aws_solutions_architect",
                  label: "AWS Solutions Architect",
                },
                {
                  id: "professional_certificates/software_engineering/cisco_ccna_networking",
                  label: "Cisco CCNA Networking",
                },
              ],
            },
          },
        },
      };

      // Curricula Chapters mapped by track
      const CURRICULA = {
        "k12/12th_SM/Economics": [
          {
            time: "00:00",
            title: "Introduction aux Problèmes Démographiques",
            active: true,
            video_id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            chapter_id: "economics_demographics",
          },
          {
            time: "02:30",
            title: "Causes de l'Explosion Démographique",
            active: false,
            video_id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            chapter_id: "economics_demographics",
          },
          {
            time: "06:15",
            title: "Conséquences Économiques et Sociales",
            active: false,
            video_id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            chapter_id: "economics_demographics",
          },
          {
            time: "10:00",
            title: "Théorie Malthusienne et Perspectives",
            active: false,
            video_id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            chapter_id: "economics_demographics",
          },
        ],
        "k12/12th_SM/chemistry": [
          {
            time: "00:00",
            title: "Analyse des réactions du chlorure d'ammonium",
            active: true,
            video_id: "vid_chemistry_organic_chemistry_chemistry",
            chapter_id: "chem_organic",
          },
          {
            time: "01:30",
            title: "Généralisation aux chlorures d'alkylammonium",
            active: false,
            video_id: "vid_chemistry_organic_chemistry_chemistry",
            chapter_id: "chem_organic",
          },
          {
            time: "03:34",
            title: "Définition et critères de reconnaissance d'un acide faible",
            active: false,
            video_id: "vid_chemistry_organic_chemistry_chemistry",
            chapter_id: "chem_organic",
          },
          {
            time: "05:35",
            title: "Familles d'acides faibles : Acides carboxyliques et cations d'amines",
            active: false,
            video_id: "vid_chemistry_organic_chemistry_chemistry",
            chapter_id: "chem_organic",
          },
        ],
        "5th Grade": [
          {
            time: "01:15",
            title: "5th Grade: Basic Physics - Gravity Intro",
            active: true,
            video_id: "vid_physics_01",
            chapter_id: "physics_pendulums",
          },
          {
            time: "04:30",
            title: "5th Grade: Basic Science - Friction Effects",
            active: false,
            video_id: "vid_physics_02",
            chapter_id: "physics_pendulums",
          },
          {
            time: "08:45",
            title: "5th Grade: Basic Science - Simple Machines",
            active: false,
            video_id: "vid_physics_03",
            chapter_id: "physics_pendulums",
          },
        ],
        "12th Grade": [
          {
            time: "00:00",
            title: "Introduction aux Problèmes Démographiques",
            active: true,
            video_id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            chapter_id: "economics_demographics",
          },
          {
            time: "02:30",
            title: "Causes de l'Explosion Démographique",
            active: false,
            video_id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            chapter_id: "economics_demographics",
          },
          {
            time: "06:15",
            title: "Conséquences Économiques et Sociales",
            active: false,
            video_id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            chapter_id: "economics_demographics",
          },
          {
            time: "10:00",
            title: "Théorie Malthusienne et Perspectives",
            active: false,
            video_id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            chapter_id: "economics_demographics",
          },
        ],
        College: [
          {
            time: "01:15",
            title: "College: Advanced Physics - Pendulum Harmonics",
            active: true,
            video_id: "vid_physics_01",
            chapter_id: "physics_pendulums",
          },
          {
            time: "04:30",
            title: "College: Advanced Physics - Damped Oscillations",
            active: false,
            video_id: "vid_physics_02",
            chapter_id: "physics_pendulums",
          },
          {
            time: "08:45",
            title: "College: Advanced Physics - Chaos Systems",
            active: false,
            video_id: "vid_physics_03",
            chapter_id: "physics_pendulums",
          },
        ],
        "Random Topics": [
          {
            time: "01:15",
            title: "Logic & Philosophy - Epistemic Truths",
            active: true,
            video_id: "vid_philosophy_01",
            chapter_id: "philosophy_stoic",
          },
          {
            time: "04:30",
            title: "Stoic Meditation - Epictetus Impressions",
            active: false,
            video_id: "vid_philosophy_02",
            chapter_id: "philosophy_stoic",
          },
          {
            time: "08:45",
            title: "Ancient Refutations - Socratic Elenchus",
            active: false,
            video_id: "vid_philosophy_03",
            chapter_id: "philosophy_stoic",
          },
        ],
        calculus: [
          {
            time: "00:00",
            title: "Economics: Économie Globale & Croissance",
            active: true,
            video_id: "vid_economics_01",
            chapter_id: "economics_extra_growth",
          },
          {
            time: "02:15",
            title: "Economics: Le rôle de l'ONU",
            active: false,
            video_id: "vid_economics_01",
            chapter_id: "economics_extra_growth",
          },
          {
            time: "05:40",
            title: "Economics: Caractéristiques Extra-économiques",
            active: false,
            video_id: "vid_economics_01",
            chapter_id: "economics_extra_growth",
          },
        ],
        Chemistry: [
          {
            time: "00:05",
            title: "Chemistry: Introduction to Chemical Bonds",
            active: true,
            video_id: "vid_chemistry_organic_chemistry",
            chapter_id: "ch_chemistry_organic_chemistry",
          },
          {
            time: "02:30",
            title: "Chemistry: Covalent vs Ionic Structures",
            active: false,
            video_id: "vid_chemistry_organic_chemistry",
            chapter_id: "ch_chemistry_organic_chemistry",
          },
        ],
      };

      // Connect WebSockets
      function connectWebSocket() {
        const wsUri = "ws://" + window.location.hostname + ":8001";
        console.log("Connecting to WebSocket: " + wsUri);
        wsConnection = new WebSocket(wsUri);

        wsConnection.onopen = function () {
          console.log("WebSocket connected.");
          showToastNotification(
            "WebSocket Active",
            "Connected to local hardware services.",
          );
        };

        wsConnection.onmessage = function (evt) {
          console.log("Received data: " + evt.data);
          try {
            const payload = JSON.parse(evt.data);
            if (!payload) return;

            if (payload.action === "DEPLOYMENT_MODE_CHANGED") {
              console.log("[WS] Deployment mode changed to:", payload.mode);
              showToastNotification("Room Mode Updated", `Deployment topology changed to ${payload.mode}. Reloading...`);
              setTimeout(() => { window.location.reload(); }, 1200);
              return;
            }

            if (payload.action === "CHAT_RESPONSE" || (payload.a2ui_payload && payload.a2ui_payload.action === "CHAT_RESPONSE")) {
              const text = payload.text || (payload.a2ui_payload && payload.a2ui_payload.text);
              if (text) {
                appendChatMessage("TUTOR", text);
                showToastNotification("Tutor Response", "GANDHO replied in Chat!");
              }
              return;
            }
            if (payload && payload.a2ui_payload) {
              const a2ui = payload.a2ui_payload;

              // Discard incoming voice response if user deactivated the microphone session in the meantime
              if (a2ui.mode === "voice" && !isConversationSessionActive) {
                console.log(
                  "[WS] Discarding incoming voice response because conversation session is inactive.",
                );
                return;
              }

              // If user explicitly closed/dismissed the whiteboard, don't auto-reopen it from background sentry messages
              if (window.isWhiteboardExplicitlyClosed && a2ui.mode !== "voice" && a2ui.mode !== "user_gesture" && !isConversationSessionActive) {
                console.log(
                  "[WS] Discarding auto whiteboard popup because user dismissed the workspace.",
                );
                if (a2ui.data && a2ui.data.socratic_text) {
                  streamChatMessage("AI TUTOR", a2ui.data.socratic_text);
                }
                return;
              }

              if (
                a2ui.action === "SPAWN_CANVAS" ||
                a2ui.action === "SOCRATIC_HINT"
              ) {
                const isMath =
                  a2ui.mode === "voice" ||
                  a2ui.data.is_math_query ||
                  checkIsMathQuery(
                    a2ui.data.raw_query,
                    a2ui.data.socratic_text || a2ui.data.text_context || "",
                  );
                if (isMath) {
                  if (a2ui.action === "SPAWN_CANVAS") {
                    const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
                    const locStrings =
                      UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
                    const getLocString = (key, fallback) =>
                      locStrings[key] !== undefined
                        ? locStrings[key]
                        : fallback;
                    a2ui.data.socratic_text =
                      a2ui.data.socratic_text ||
                      a2ui.data.text_context ||
                      getLocString(
                        "graphing_simulator_active",
                        "Graphing simulator active.",
                      );
                  }
                  streamChatMessage("AI TUTOR", a2ui.data.socratic_text);

                  if (a2ui.mode !== "chat_typed") {
                    const stateMode = a2ui.data.state_mode || "A";
                    switch (stateMode) {
                      case "B":
                        console.log(
                          "[WS ROUTER] Case B (Graph Only): 100% Graph, Whiteboard hidden immediately.",
                        );
                        triggerWhiteboardOverlay(a2ui.data);
                        break;
                      case "C":
                        console.log(
                          "[WS ROUTER] Case C (Whiteboard Only): 100% Socratic Whiteboard, Graph hidden.",
                        );
                        triggerWhiteboardOverlay(a2ui.data);
                        break;
                      case "A":
                      default:
                        console.log(
                          "[WS ROUTER] Case A (Dual Mode): 50%/50% side-by-side split.",
                        );
                        triggerWhiteboardOverlay(a2ui.data);
                        break;
                    }
                  } else if (a2ui.action === "SPAWN_CANVAS") {
                    appendChatGraphCard(a2ui.data);
                  }
                } else {
                  if (a2ui.mode !== "chat_typed") {
                    console.log(
                      "[WS ROUTER] Non-math query. Slide open whiteboard in Case C (Whiteboard Only) mode.",
                    );
                    a2ui.data.state_mode = "C";
                    triggerWhiteboardOverlay(a2ui.data);
                  }
                  if (a2ui.action === "SPAWN_CANVAS") {
                    if (a2ui.mode === "voice") {
                      triggerCanvasOverlay(a2ui.data);
                    } else {
                      appendChatGraphCard(a2ui.data);
                    }
                  } else {
                    streamChatMessage("AI TUTOR", a2ui.data.socratic_text);
                  }
                }

                // Speak socratic hint if triggered by mic/raise hand (only for physical/simulated GPIO buttons)
                if (a2ui.action === "SOCRATIC_HINT") {
                  if (a2ui.mode === "typed") {
                    speakSocraticHint(a2ui.data.socratic_text);
                  }
                }
              } else if (a2ui.action === "NO_RELEVANT_MATCH") {
                showToastNotification(
                  "Raise Hand Error",
                  "No context matches. relevance distance: " +
                    a2ui.data.relevance_distance.toFixed(3),
                );
              } else if (a2ui.action === "GRADE_RESULT") {
                handleGradeResult(a2ui);
              }
            } else if (payload && payload.action === "QUIZ_RESULT") {
              handleQuizResult(payload);
            } else if (payload && payload.action === "BROADCAST_PROJECT") {
              handleReceivedProject(payload.project_title, payload.sender);
            } else if (payload && payload.action === "MESH_STATUS_UPDATE") {
              document.getElementById("meshStatusText").innerText =
                payload.status;
            } else if (payload && payload.action === "LECTURE_TRANSCRIPT") {
              appendTutorTranscriptCard(payload.text, payload.timestamp_marker);
            } else if (payload && payload.action === "ONBOARDING_COMPLETE") {
              loadProfileProgress();
            } else if (payload && payload.action === "LOCK_DEVICE") {
              if (!window.USING_REAL_CAMERA_DETECTION) {
                handleLockDevice(payload.reason);
              }
            } else if (payload && payload.action === "UNLOCK_DEVICE") {
              if (!window.USING_REAL_CAMERA_DETECTION) {
                handleUnlockDevice();
              }
            } else if (payload && payload.action === "PAUSE_VIDEO") {
              if (payload.reason === "no_face_present" && !window.ENABLE_SENTRY_AUTO_PAUSE) {
                console.log("[SENTRY WS] Discarding background sentry pause event because Sentry auto-pause is disabled.");
              } else {
                pauseVideoTimeline();
              }
            } else if (payload && payload.action === "PLAY_VIDEO") {
              playVideoTimeline();
            } else if (payload && payload.action === "PLAY_VIDEO_OVERRIDE") {
              const lectureVideo =
                document.getElementById("lectureVideoPlayer");
              if (lectureVideo) {
                lectureVideo.muted = false;
                lectureVideo.paused = false;
                lectureVideo
                  .play()
                  .then(() => {
                    console.log("Playback release successful");
                  })
                  .catch((err) => {
                    lectureVideo.play();
                  });
                const btn = document.getElementById("playControlBtn");
                if (btn)
                  btn.innerHTML =
                    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
              }
            } else if (payload && payload.action === "SEEK_VIDEO") {
              if (payload.video_id && payload.video_id !== activeVideoId) {
                loadTextbookPDF(payload.video_id, payload.timestamp);
              } else {
                const video = document.getElementById("lectureVideoPlayer");
                if (video && payload.timestamp) {
                  const parts = payload.timestamp.split(":");
                  let secs = 0;
                  if (parts.length === 3) {
                    secs =
                      parseInt(parts[0]) * 3600 +
                      parseInt(parts[1]) * 60 +
                      parseInt(parts[2]);
                  } else if (parts.length === 2) {
                    secs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                  }
                  if (Math.abs(video.currentTime - secs) > 2.0) {
                    seekVideoToTime(payload.timestamp);
                  }
                }
              }
            } else if (payload && payload.action === "UPDATE_TIMESTAMPS") {
              const videoId = payload.video_id;
              const timestamps = payload.timestamps;
              const flashcards = payload.flashcards;
              const dense_transcripts = payload.dense_transcripts;
              let category = selectedGoalTrack;

              // Parse dense_transcripts into activeVideoTranscripts
              const sourceTranscripts =
                dense_transcripts && dense_transcripts.length > 0
                  ? dense_transcripts
                  : timestamps;
              activeVideoTranscripts = sourceTranscripts.map((ts) => {
                const parts = ts.timestamp.split(":");
                let timeSecs = 0;
                if (parts.length === 3) {
                  timeSecs =
                    parseInt(parts[0]) * 3600 +
                    parseInt(parts[1]) * 60 +
                    parseInt(parts[2]);
                } else if (parts.length === 2) {
                  timeSecs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                }
                const mm = Math.floor(timeSecs / 60)
                  .toString()
                  .padStart(2, "0");
                const ss = Math.floor(timeSecs % 60)
                  .toString()
                  .padStart(2, "0");
                const marker = `${mm}:${ss}`;
                return {
                  time: timeSecs,
                  marker: marker,
                  text: ts.text || ts.description,
                  translatedText: ts.translated_text,
                };
              });

              CURRICULA[category] = timestamps.map((ts, idx) => ({
                time: ts.timestamp,
                title: ts.title,
                active: idx === 0,
                video_id: videoId,
                chapter_id: "qwen_chapter_" + idx,
              }));
              renderCurriculumTimestamps(category);
              if (flashcards && flashcards.length > 0) {
                FLASHCARDS_DECKS[category] = flashcards;
                renderFlashcardsDeck(category);
              }
              showToastNotification(
                "Qwen Timestamps Active",
                `Generated ${timestamps.length} chapters.`,
              );
            }
          } catch (e) {
            console.error("Parse error socket message: ", e);
          }
        };

        wsConnection.onclose = function () {
          setTimeout(connectWebSocket, 2000);
        };
      }

      // App Launcher Dropdown Flyout Handlers
      function toggleAppLauncherMenu(e) {
        if (e) {
          e.stopPropagation();
          e.preventDefault();
        }
        const dropdown = document.getElementById("appLauncherDropdown");
        const wrapper = document.getElementById("appLauncherWrapper");
        const btn = document.getElementById("appLauncherBtn");
        if (!dropdown) return;
        const isOpen = dropdown.classList.toggle("open");
        if (wrapper) wrapper.classList.toggle("menu-open", isOpen);
        if (btn) btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      }

      function closeAppLauncherMenu() {
        const dropdown = document.getElementById("appLauncherDropdown");
        const wrapper = document.getElementById("appLauncherWrapper");
        const btn = document.getElementById("appLauncherBtn");
        if (dropdown) dropdown.classList.remove("open");
        if (wrapper) wrapper.classList.remove("menu-open");
        if (btn) btn.setAttribute("aria-expanded", "false");
      }

      function selectLauncherTab(viewName, element) {
        closeAppLauncherMenu();
        switchView(viewName, element);
      }

      document.addEventListener("click", function (e) {
        const wrapper = document.getElementById("appLauncherWrapper");
        if (wrapper && !wrapper.contains(e.target)) {
          closeAppLauncherMenu();
        }
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          closeAppLauncherMenu();
        }
      });

      // View Toggling logic
      function switchView(viewName, element) {
        document
          .querySelectorAll(".nav-item")
          .forEach((item) => {
            if (item.getAttribute("data-view") === viewName || item === element) {
              item.classList.add("active");
            } else {
              item.classList.remove("active");
            }
          });

        // Sync Navbar items: Dashboard stays fixed in navbar, active module from menu displays when selected
        const dashNav = document.getElementById("navItemDashboard");
        const activeModNav = document.getElementById("navItemActiveModule");
        const activeModLabel = document.getElementById("navItemActiveModuleLabel");

        const viewMeta = {
          dashboard: { icon: "📊", label: "Dashboard" },
          revision_library: { icon: "📼", label: "Révision & Cours" },
          virtual_labs: { icon: "🧪", label: "Virtual Labs" },
          stem_graphs: { icon: "📈", label: "Graphs" }
        };

        if (viewName === "dashboard") {
          if (dashNav) dashNav.classList.add("active");
          if (activeModNav) {
            activeModNav.style.display = "none";
            activeModNav.classList.remove("active");
          }
        } else {
          if (dashNav) dashNav.classList.remove("active");
          if (activeModNav && viewMeta[viewName]) {
            activeModNav.style.display = "flex";
            activeModNav.classList.add("active");
            if (activeModLabel) {
              activeModLabel.innerText = `${viewMeta[viewName].icon} ${viewMeta[viewName].label}`;
            }
          }
        }

        document
          .querySelectorAll(".view-pane")
          .forEach((pane) => pane.classList.remove("active"));
        if (viewName === "dashboard") {
          document.body.classList.remove("full-width-labs");
          window.isVirtualLabsActive = false;
          window.isStemGraphsActive = false;
          document.getElementById("dashboardPane").classList.add("active");
          if (typeof updateActiveViewState === "function") updateActiveViewState();
        } else if (viewName === "courses") {
          document.body.classList.remove("full-width-labs");
          window.isVirtualLabsActive = false;
          window.isStemGraphsActive = false;
          document.getElementById("coursesPane").classList.add("active");
          if (typeof updateActiveViewState === "function") updateActiveViewState();
        } else if (viewName === "library") {
          document.body.classList.remove("full-width-labs");
          window.isVirtualLabsActive = false;
          window.isStemGraphsActive = false;
          document.getElementById("libraryPane").classList.add("active");
          if (typeof updateActiveViewState === "function") updateActiveViewState();
        } else if (viewName === "revision_library") {
          document.body.classList.remove("full-width-labs");
          window.isVirtualLabsActive = false;
          window.isStemGraphsActive = false;
          const revPane = document.getElementById("revisionLibraryPane");
          if (revPane) revPane.classList.add("active");
          renderRevisionLibraryGrid();
          if (typeof updateActiveViewState === "function") updateActiveViewState();
        } else if (viewName === "virtual_labs") {
          document.body.classList.add("full-width-labs");
          window.isVirtualLabsActive = true;
          window.isStemGraphsActive = false;
          const labsPane = document.getElementById("virtualLabsPane");
          if (labsPane) labsPane.classList.add("active");
          const mountPoint = document.getElementById("virtualLabsMountPoint");
          if (mountPoint && !window.virtualLabsInstance) {
            import("/antigravity_labs/web_labs_package/src/virtual_labs.js").then((mod) => {
              if (!window.virtualLabsInstance) {
                window.virtualLabsInstance = mod.mountVirtualLabs(mountPoint);
              }
            }).catch((err) => {
              console.error("Failed to dynamically load Virtual Labs module:", err);
            });
          }
          if (typeof updateActiveViewState === "function") updateActiveViewState();
        } else if (viewName === "stem_graphs") {
          document.body.classList.add("full-width-labs");
          window.isVirtualLabsActive = false;
          window.isStemGraphsActive = true;
          const graphsPane = document.getElementById("stemGraphsPane");
          if (graphsPane) graphsPane.classList.add("active");
          if (typeof updateActiveViewState === "function") updateActiveViewState();
        }
      }

      window.activeRevisionSubjectFilter = "all";
      window.revisionVisibleCount = 4;

      function filterRevisionLibrary(sub) {
        window.activeRevisionSubjectFilter = sub;
        window.revisionVisibleCount = 4;
        document.querySelectorAll(".rev-subject-btn").forEach(btn => {
          if ((sub === "all" && btn.innerText.includes("Tous")) || btn.innerText.toLowerCase().includes(sub.toLowerCase())) {
            btn.style.border = "1px solid #a855f7";
            btn.style.background = "#a855f7";
            btn.style.color = "#ffffff";
          } else {
            btn.style.border = "1px solid #27272a";
            btn.style.background = "#141418";
            btn.style.color = "#a1a1aa";
          }
        });
        renderRevisionLibraryGrid();
      }

      function loadMoreRevisionLessons() {
        window.revisionVisibleCount += 4;
        renderRevisionLibraryGrid();
      }

      function renderRevisionLibraryGrid() {
        const grid = document.getElementById("revisionCardsGrid");
        const seeMoreContainer = document.getElementById("revisionSeeMoreContainer");
        if (!grid) return;
        grid.innerHTML = "";

        const searchVal = (document.getElementById("revisionPaneSearchInput")?.value || "").toLowerCase();
        const activeLoc = window.ACTIVE_DATABASE_LOCALE || "fr_FR";
        const isFr = activeLoc.startsWith("fr");

        const allLessons = [
          {
            id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            subject: "Economics",
            subjectTitle: isFr ? "Économie • Démographie" : "Economics • Demographics",
            title: isFr ? "01_Les Problèmes Démographiques" : "01_Demographic Problems",
            desc: isFr ? "Analyse des causes de la croissance démographique, théorie malthusienne et impact sur l'économie." : "Analysis of demographic drivers, Malthusian model, and economic consequences.",
            duration: "15 min",
            idx: 0
          },
          {
            id: "vid_economics_extraeconomiques_02_les_probl_mes_sanitaires",
            subject: "Economics",
            subjectTitle: isFr ? "Économie • Santé Publique" : "Economics • Public Health",
            title: isFr ? "02_Les Problèmes Sanitaires" : "02_Health Problems",
            desc: isFr ? "Étude des grandes endémies (paludisme, Ebola, COVID-19, VIH) et impact sur la productivité du travail." : "Study of mass endemics (malaria, Ebola, COVID-19, HIV) and impacts on labor productivity.",
            duration: "12 min",
            idx: 1
          },
          {
            id: "vid_economics_extraeconomiques_03_probl_mes_alimentaires",
            subject: "Economics",
            subjectTitle: isFr ? "Économie • Sécurité Alimentaire" : "Economics • Food Security",
            title: isFr ? "03_Problèmes Alimentaires" : "03_Food Problems",
            desc: isFr ? "Analyse de la sous-alimentation, sécurité alimentaire et rôles des agences (FAO, FIDA, PAM)." : "Analysis of malnutrition, food security, and international agency roles (FAO, WFP).",
            duration: "10 min",
            idx: 2
          },
          {
            id: "vid_chemistry_organic_chemistry_chemistry",
            subject: "Chemistry",
            subjectTitle: isFr ? "Chimie Organique" : "Organic Chemistry",
            title: isFr ? "Chimie : Cations d'Alkylammonium" : "Chemistry: Alkylammonium Cations",
            desc: isFr ? "Équilibres aqueux, couples acide/base et comportement des amines en solution." : "Aqueous equilibria, conjugate acid/base pairs, and amine behavior.",
            duration: "18 min",
            idx: 0
          },
          {
            id: "vid_economics_extraeconomiques_04_probl_mes_urbanisation",
            subject: "Economics",
            subjectTitle: isFr ? "Économie • Urbanisation" : "Economics • Urbanization",
            title: isFr ? "04_Problèmes d'Urbanisation" : "04_Urbanization Problems",
            desc: isFr ? "Évolution des zones urbaines, défis des bidonvilles, infrastructures et politiques d'aménagement." : "Urban growth, informal settlement challenges, infrastructure, and development policies.",
            duration: "14 min",
            idx: 3
          },
          {
            id: "vid_chemistry_02_amines",
            subject: "Chemistry",
            subjectTitle: isFr ? "Chimie • Amines & Réactions" : "Chemistry • Amines",
            title: isFr ? "Chimie : Synthèse et Réactivité des Amines" : "Chemistry: Amine Synthesis & Reactivity",
            desc: isFr ? "Propriétés nucléophiles des amines, alkylation d'Hofmann et réactions d'élimination." : "Nucleophilic properties of amines, Hofmann alkylation, and elimination reactions.",
            duration: "16 min",
            idx: 1
          },
          {
            id: "vid_philosophy_01",
            subject: "Philosophy",
            subjectTitle: isFr ? "Philosophie • Éthique" : "Philosophy • Ethics",
            title: isFr ? "Stoïcisme et Morale Contemporaine" : "Stoicism & Contemporary Ethics",
            desc: isFr ? "Philosophie antique, contrôle des désirs et sagesse pratique selon Épictète et Marc Aurèle." : "Ancient philosophy, control of desires, and practical wisdom according to Epictetus.",
            duration: "20 min",
            idx: 0
          },
          {
            id: "vid_physics_01",
            subject: "Physics",
            subjectTitle: isFr ? "Physique • Mécanique" : "Physics • Mechanics",
            title: isFr ? "Mouvement dans un Champ Pesant" : "Motion in a Gravitational Field",
            desc: isFr ? "Équations horaires, trajectoires paraboliques et conservation de l'énergie mécanique." : "Time equations, parabolic trajectories, and mechanical energy conservation.",
            duration: "15 min",
            idx: 0
          }
        ];

        let unlockedCount = 0;

        const filteredLessons = allLessons.filter((lesson) => {
          if (window.activeRevisionSubjectFilter !== "all" && lesson.subject !== window.activeRevisionSubjectFilter) return false;
          if (searchVal && !lesson.title.toLowerCase().includes(searchVal) && !lesson.desc.toLowerCase().includes(searchVal)) return false;
          return true;
        });

        const limit = window.revisionVisibleCount || 4;
        const visibleLessons = filteredLessons.slice(0, limit);

        visibleLessons.forEach((lesson) => {
          const isCompleted = (lesson.id === "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques" || localStorage.getItem("completed_videos_" + lesson.id) === "true");
          const isSanitaireUnlocked = true;
          const isUnlocked = isCompleted || (lesson.id.includes("sanitaire") && isSanitaireUnlocked);

          let badgeHtml = "";
          let btnHtml = "";

          if (isCompleted) {
            unlockedCount++;
            badgeHtml = `<span style="font-size: 0.68rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; background: rgba(34,197,94,0.15); color: #4ade80;">✓ VALIDÉ (85%+)</span>`;
            btnHtml = `<button type="button" onclick="selectRevisionLesson('${lesson.subject}', '${lesson.id}')" style="background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); border: none; color: #ffffff; padding: 7px 14px; border-radius: 8px; font-weight: 700; font-size: 0.75rem; cursor: pointer;">▶ REVOIR CE COURS</button>`;
          } else if (isUnlocked) {
            unlockedCount++;
            badgeHtml = `<span style="font-size: 0.68rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; background: rgba(168,85,247,0.15); color: #c084fc;">▶ COURS ACTUEL</span>`;
            btnHtml = `<button type="button" onclick="selectRevisionLesson('${lesson.subject}', '${lesson.id}')" style="background: #18181b; border: 1px solid #a855f7; color: #c084fc; padding: 7px 14px; border-radius: 8px; font-weight: 700; font-size: 0.75rem; cursor: pointer;">▶ CONTINUER LE COURS</button>`;
          } else {
            badgeHtml = `<span style="font-size: 0.68rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; background: rgba(239,68,68,0.15); color: #f87171;">🔒 VERROUILLÉ</span>`;
            btnHtml = `<button type="button" disabled style="background: #18181b; border: 1px solid #27272a; color: #71717a; padding: 7px 14px; border-radius: 8px; font-weight: 700; font-size: 0.75rem; cursor: not-allowed;">🔒 VERROUILLÉ</button>`;
          }

          const card = document.createElement("div");
          card.style.cssText = `background: #141418; border: 1px solid ${isUnlocked ? (activeVideoId === lesson.id ? '#a855f7' : '#27272a') : '#1c1c22'}; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s ease; ${isUnlocked ? 'box-shadow: 0 4px 12px rgba(0,0,0,0.3);' : 'opacity: 0.6;'}`;

          card.innerHTML = `
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 0.7rem; font-weight: 800; color: #a855f7; text-transform: uppercase; letter-spacing: 0.05em;">${lesson.subjectTitle}</span>
                ${badgeHtml}
              </div>
              <h3 style="font-size: 1.05rem; font-weight: 800; color: #ffffff; margin: 0 0 8px 0;">${lesson.title}</h3>
              <p style="font-size: 0.78rem; color: #a1a1aa; line-height: 1.45; margin: 0 0 16px 0;">${lesson.desc}</p>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; border-top: 1px solid #27272a; padding-top: 12px;">
                <span style="font-size: 0.72rem; color: #71717a; font-weight: 600;">⏱️ ${lesson.duration}</span>
                ${btnHtml}
              </div>
            </div>
          `;
          grid.appendChild(card);
        });

        // Handle See More Button visibility
        if (seeMoreContainer) {
          if (filteredLessons.length > visibleLessons.length) {
            const remaining = filteredLessons.length - visibleLessons.length;
            seeMoreContainer.style.display = "flex";
            seeMoreContainer.innerHTML = `
              <button type="button" onclick="loadMoreRevisionLessons()" style="background: linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(124,58,237,0.15) 100%); border: 1px solid #a855f7; color: #c084fc; padding: 12px 28px; border-radius: 12px; font-weight: 800; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; box-shadow: 0 4px 14px rgba(168,85,247,0.15);">
                <span>▼ ${isFr ? `Voir Plus (+${remaining} leçons restantes)` : `See More (+${remaining} more lessons)`}</span>
              </button>
            `;
          } else {
            seeMoreContainer.style.display = "none";
            seeMoreContainer.innerHTML = "";
          }
        }

        const countEl = document.getElementById("revisionUnlockedCount");
        if (countEl) countEl.innerText = `${unlockedCount} / ${allLessons.length} Leçons Débloquées`;
      }

      function selectRevisionLesson(subject, videoId) {
        if (subject === "Chemistry") selectedGoalTrack = "k12/12th_SM/chemistry";
        else if (subject === "Physics") selectedGoalTrack = "k12/12th_SM/physics";
        else if (subject === "Philosophy") selectedGoalTrack = "independent_learner/philosophy/stoicism_and_ethics";
        else if (subject === "Mathematics") selectedGoalTrack = "k12/1st_grade/mathematics";
        else selectedGoalTrack = "k12/12th_SM/Economics";

        window.currentTrack = selectedGoalTrack;
        activeVideoId = videoId;

        localStorage.setItem("lastActiveVideoId", videoId);
        localStorage.setItem("lastActiveVideo_" + subject, videoId);

        loadTextbookPDF(videoId);
        switchView("dashboard", document.querySelector('.nav-item'));
        showToastNotification("Leçon Chargée", "Leçon chargée. Discutez avec GANDHO !");
      }

      // Sidebar tabs toggling
      
                                            function renderKaTeXText(text) {
        if (!text) return "";
        if (!window.katex || typeof window.katex.renderToString !== "function") return text;
        
        // Parse LaTeX delimiters: \([math]\), \[math\], \(math\), or [math]
        return text.replace(/\\\(\\?\[(.*?)\\?\]\\\)|\\\((.*?)\\\)|\\?\[(.*?)\\?\]|\\\((.*?)\)/g, function(match, p1, p2, p3, p4) {
          var rawMath = (p1 || p2 || p3 || p4 || "").trim();
          if (!rawMath) return match;
          try {
            return window.katex.renderToString(rawMath, { displayMode: false, throwOnError: false });
          } catch (e) {
            return match;
          }
        });
      }

      function renderVideoSummary(videoId) {
        const container = document.getElementById("summaryDocumentContainer");
        if (!container) return;

        const isFrench = (window.ACTIVE_DATABASE_LOCALE || "fr_FR").startsWith("fr");
        const activeVideo = videoId || window.ACTIVE_DATABASE_VIDEO_ID || activeVideoId || "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques";
        const instructor = activeInstructorName || "Prof. GANDHO";

        let summaryData = {};

        if (activeVideo.includes("sanitaire")) {
          summaryData = {
            title: isFrench ? "Économie : Les Problèmes Sanitaires du Développement" : "Economics: Health & Sanitary Challenges in Development",
            subtitle: isFrench ? "Module Économie • Caractéristiques Extra-Économiques du Développement" : "Economics Module • Extra-Economic Characteristics of Development",
            overview: isFrench
              ? "Une étude approfondie des <u>problèmes sanitaires</u> et de la santé publique dans les pays du sud. Le cours examine les grandes maladies de masse (paludisme, choléra, Ebola, COVID-19, MST/VIH) et l'impact de la sous-alimentation sur le développement économique et la productivité du travail."
              : "An in-depth study of <u>public health and sanitary challenges</u> in developing nations. Examines endemic diseases (malaria, cholera, Ebola, COVID-19, HIV), malnutrition, and their direct impact on labor productivity and economic growth.",
            formulas: [
              { label: isFrench ? "Indice de Santé Publique" : "Public Health Index", eq: "\text{Espérance de Vie} = f(\text{Accès aux Soins}, \text{Nutrition}, \text{Eau Potable})" },
              { label: isFrench ? "Impact Économique de la Maladie" : "Economic Impact of Disease", eq: "\text{Perte de Productivité} = \text{Taux d'Infection} \times \text{Heures de Travail Perdues}" }
            ],
            concepts: isFrench ? [
              "<u>Maladies de Masse</u> : Endémies graves (paludisme, choléra, VIH) entravant la santé des populations et le développement économique.",
              "<u>Sous-Alimentation & Nutrition</u> : Carence calorique globale réduisant la capacité de travail et la résistance immunitaire.",
              "<u>Infrastructures Sanitaires</u> : Manque d'hôpitaux, d'eau potable et de personnel médical qualifié dans les zones rurales."
            ] : [
              "<u>Mass Endemics</u> : Major infectious diseases constraining workforce capacity and economic output.",
              "<u>Malnutrition & Nutrition</u> : Caloric deficiencies diminishing physical productivity and immune resilience.",
              "<u>Sanitary Infrastructure</u> : Deficits in potable water, hospitals, and qualified medical staff in rural sectors."
            ],
            takeaways: isFrench ? [
              "La santé est le pilier fondamental du développement capital humain et de la productivité.",
              "Renforcer l'action de l'OMS et l'accès à l'eau potable pour éradiquer les épidémies.",
              "Investir dans la médecine préventive et l'hygiène publique."
            ] : [
              "Public health is the cornerstone of human capital and workforce productivity.",
              "Strengthen WHO initiatives and clean water access to eliminate mass endemics.",
              "Prioritize preventive healthcare infrastructure and public sanitation."
            ]
          };
        } else if (activeVideo.includes("alimentaire")) {
          summaryData = {
            title: isFrench ? "Économie : Les Problèmes Alimentaires & Malnutrition" : "Economics: Food Security & Malnutrition",
            subtitle: isFrench ? "Module Économie • Caractéristiques Extra-Économiques du Développement" : "Economics Module • Extra-Economic Characteristics of Development",
            overview: isFrench
              ? "Examen des <u>problèmes alimentaires</u> et de la sous-alimentation dans les pays en développement, avec une analyse des interventions de la FAO, du FIDA et du PAM pour garantir la sécurité alimentaire."
              : "Analysis of <u>food security and agricultural deficits</u> in developing nations, highlighting international interventions by FAO, IFAD, and WFP.",
            formulas: [
              { label: isFrench ? "Sécurité Alimentaire" : "Food Security Balance", eq: "\text{Disponibilité Alimentaire} = \text{Production Locale} + \text{Importations} - \text{Pertes}" }
            ],
            concepts: isFrench ? [
              "<u>Sous-Alimentation</u> : Apport calorique insuffisant pour maintenir une vie saine et active.",
              "<u>Organisations Internationales</u> : Rôle décisif de la FAO, du FIDA et du PAM dans le développement agricole et le secours d'urgence."
            ] : [
              "<u>Undernourishment</u> : Insufficient caloric intake to sustain healthy physical activity.",
              "<u>Global Relief Agencies</u> : Key roles of FAO, IFAD, and WFP in agricultural support and emergency aid."
            ],
            takeaways: isFrench ? [
              "Assurer la souveraineté alimentaire par la modernisation de l'agriculture de subsistance.",
              "Développer les réseaux de distribution d'aide alimentaire d'urgence."
            ] : [
              "Ensure food sovereignty through modernizing smallholder agriculture.",
              "Expand regional food distribution networks and emergency aid systems."
            ]
          };
        } else if (activeVideo.includes("demographique")) {
          summaryData = {
            title: isFrench ? "Économie : Les Problèmes Démographiques du Développement" : "Economics: Demographic Challenges in Development",
            subtitle: isFrench ? "Module Économie • Caractéristiques Extra-Économiques du Développement" : "Economics Module • Extra-Economic Characteristics of Development",
            overview: isFrench
              ? "Une analyse complète des <u>problèmes démographiques</u> influençant le développement. Le cours examine l'explosion démographique due à la baisse de la mortalité infantile et au maintien de la natalité, les facteurs socioculturels (analphabétisme, mariages précoces, traditions) et la théorie malthusienne analysant l'écart entre croissance démographique et ressources de subsistance."
              : "A comprehensive analysis of <u>demographic challenges</u> influencing economic development. Examines population explosion resulting from declining mortality alongside sustained birth rates, sociocultural factors, and Malthusian theory on population growth vs. food resources.",
            formulas: [
              { label: isFrench ? "Accroissement Naturel" : "Natural Population Growth", eq: "\\text{Taux d'Accroissement} = \\text{Taux de Natalité} - \\text{Taux de Mortalité}" },
              { label: isFrench ? "Modèle Malthusien (Subsistance vs Population)" : "Malthusian Model (Subsistence vs Population)", eq: "\\text{Population (Géométrique)} \\gg \\text{Subsistances (Arithmétique)} \\implies \\text{Pauvreté}" }
            ],
            concepts: isFrench ? [
              "<u>Explosion Démographique</u> : Accélération rapide de la population dans les pays sous-développés, où la capacité d'absorption de l'économie reste limitée.",
              "<u>Théorie Malthusienne</u> : Postulat soutenant que la surpopulation aggrave la pauvreté lorsque la croissance des ressources alimentaires ne suit pas le rythme démographique.",
              "<u>Facteurs Socio-Culturels</u> : Poids des traditions, mariages précoces, polygamie et analphabétisme comme moteurs de l'augmentation de la fécondité."
            ] : [
              "<u>Population Explosion</u> : Rapid acceleration of population in developing nations where economic absorption capacity remains constrained.",
              "<u>Malthusian Theory</u> : Premise that overpopulation compounds poverty when food production growth fails to match demographic expansion.",
              "<u>Sociocultural Factors</u> : Traditional influences, early marriage, and illiteracy as drivers of sustained high fertility rates."
            ],
            takeaways: isFrench ? [
              "L'explosion démographique dans les pays en développement accentue le chômage, l'analphabétisme et la dépendance financière.",
              "Améliorer l'éducation et la maîtrise de l'eau/agriculture pour adapter l'économie au rythme démographique.",
              "Planifier les politiques de santé et d'enseignement pour garantir l'autosuffisance."
            ] : [
              "Demographic explosion in developing countries exacerbates unemployment, illiteracy, and financial dependency.",
              "Enhance education and agricultural/water management to align economic capacity with population growth.",
              "Structure health and educational policies to achieve sustainable self-sufficiency."
            ]
          };
        } else if (activeVideo === "vid_chemistry_organic_chemistry_chemistry" || activeVideo.includes("chemistry") || activeVideo.includes("chem")) {
          summaryData = {
            title: isFrench ? "Chimie Organique : Cations d'Alkylammonium, Acides & Bases" : "Organic Chemistry: Alkylammonium Cations, Acids & Bases",
            subtitle: isFrench ? "Module Chimie • Équilibres Aqueux & Réactions d'Amines" : "Chemistry Module • Aqueous Equilibria & Amine Reactions",
            overview: isFrench
              ? "Examen approfondi du comportement des <u>cations d'alkylammonium (R-NH3+)</u> en solution aqueuse. Le cours démontre qu'ils se comportent comme des acides faibles en cédant partiellement un proton à l'eau pour former l'amine correspondante (R-NH2) et des ions hydronium (H3O+)."
              : "In-depth examination of <u>alkylammonium cations (R-NH3+)</u> in aqueous solution. Demonstrates their behavior as weak acids donating a proton to water, generating the corresponding amine (R-NH2) and hydronium ions (H3O+).",
            formulas: [
              { label: isFrench ? "Équilibre d'Acide Faible en Solution" : "Weak Acid Equilibrium in Solution", eq: "\\text{R-NH}_3^+ + \\text{H}_2\\text{O} \\rightleftharpoons \\text{R-NH}_2 + \\text{H}_3\\text{O}^+" },
              { label: isFrench ? "Constante d'Acidité (Ka)" : "Acid Dissociation Constant (Ka)", eq: "K_a = \\frac{[\\text{R-NH}_2] [\\text{H}_3\\text{O}^+]}{[\\text{R-NH}_3^+]}" }
            ],
            concepts: isFrench ? [
              "<u>Cation Alkylammonium (R-NH3+)</u> : Acide faible conjugué d'une amine, capable de céder un proton à l'eau.",
              "<u>Réaction Réversible</u> : Réaction incomplète caractérisée par la présence simultanée des réactifs et des produits à l'équilibre.",
              "<u>Concentrations Équivalentes</u> : À l'équilibre, la concentration des produits formés \\([\\text{R-NH}_2]\\) et \\([\\text{H}_3\\text{O}^+]\\) est rigoureusement identique."
            ] : [
              "<u>Alkylammonium Cation (R-NH3+)</u> : Weak conjugate acid of an amine capable of donating a proton to water.",
              "<u>Reversible Reaction</u> : Incomplete reaction characterized by simultaneous presence of reactants and products at equilibrium.",
              "<u>Equal Product Concentrations</u> : At equilibrium, concentrations of generated \\([\\text{R-NH}_2]\\) and \\([\\text{H}_3\\text{O}^+]\\) are identical."
            ],
            takeaways: isFrench ? [
              "Identifier le couple acide/base \\(\\text{R-NH}_3^+ / \\text{R-NH}_2\\) dans l'équation de réaction.",
              "Calculer le pH et le degré de dissociation de l'acide faible à partir de sa constante \\(K_a\\).",
              "Vérifier la conservation de la masse et des charges lors de la formation des ions hydronium."
            ] : [
              "Identify the conjugate acid/base pair \\(\\text{R-NH}_3^+ / \\text{R-NH}_2\\) in the reaction equation.",
              "Calculate pH and dissociation fraction of the weak acid using constant \\(K_a\\).",
              "Verify mass and charge balance during hydronium ion formation."
            ]
          };
        } else {
          summaryData = {
            title: isFrench ? "Économie : Les Problèmes Démographiques" : "Economics: Demographic Challenges",
            subtitle: isFrench ? "Module Économie • Caractéristiques Extra-Économiques" : "Economics Module • Extra-Economic Characteristics",
            overview: isFrench
              ? "Analyse des <u>problèmes démographiques</u> dans les pays sous-développés, étude des causes et des conséquences socio-économiques."
              : "Analysis of <u>demographic challenges</u> in developing countries, examining sociocultural drivers and economic impacts.",
            formulas: [
              { label: isFrench ? "Taux d'Accroissement" : "Growth Rate", eq: "\\text{Accroissement} = \\text{Natalité} - \\text{Mortalité}" }
            ],
            concepts: isFrench ? [
              "<u>Explosion Démographique</u> : Accélération forte de la population liée aux avancées médicales et à la tradition."
            ] : [
              "<u>Population Explosion</u> : Rapid acceleration of population linked to healthcare improvements and traditions."
            ],
            takeaways: isFrench ? [
              "Maintenir l'équilibre entre croissance de la population et capacités d'accueil économiques."
            ] : [
              "Maintain balance between population growth and economic carrying capacity."
            ]
          };
        }

        let formulasHtml = "";
        if (summaryData.formulas && summaryData.formulas.length > 0) {
          formulasHtml = `
            <div style="margin-top: 14px; margin-bottom: 14px; padding: 12px; background: #141418; border-radius: 8px; border: 1px solid #24242a;">
              <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: #a855f7; font-weight: 700; margin-bottom: 10px;">
                📐 ${isFrench ? "Formules & Modèles Clés" : "Key Formulas & Models"}
              </div>
              ${summaryData.formulas.map(f => {
                let renderedEq = f.eq;
                if (window.katex && typeof window.katex.renderToString === "function") {
                  try {
                    renderedEq = window.katex.renderToString(f.eq, { displayMode: true, throwOnError: false });
                  } catch (e) {
                    console.warn("KaTeX render error:", e);
                  }
                }
                return `
                  <div style="margin-bottom: 10px; padding: 8px; background: #09090b; border-radius: 6px;">
                    <div style="font-size: 0.75rem; color: #a1a1aa; margin-bottom: 4px; font-weight: 600;">${f.label}</div>
                    <div style="color: #ffffff; font-size: 0.95rem; overflow-x: auto;">${renderedEq}</div>
                  </div>
                `;
              }).join("")}
            </div>
          `;
        }

        let conceptsHtml = "";
        if (summaryData.concepts && summaryData.concepts.length > 0) {
          conceptsHtml = `
            <div style="margin-bottom: 14px;">
              <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: #3b82f6; font-weight: 700; margin-bottom: 8px;">
                💡 ${isFrench ? "Notions Fondamentales" : "Key Concepts"}
              </div>
              <ul style="margin: 0; padding-left: 18px; color: #d4d4d8; font-size: 0.82rem; line-height: 1.5;">
                ${summaryData.concepts.map(c => `<li style="margin-bottom: 6px;">${renderKaTeXText(c)}</li>`).join("")}
              </ul>
            </div>
          `;
        }

        let takeawaysHtml = "";
        if (summaryData.takeaways && summaryData.takeaways.length > 0) {
          takeawaysHtml = `
            <div style="margin-bottom: 10px;">
              <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: #22c55e; font-weight: 700; margin-bottom: 8px;">
                ✅ ${isFrench ? "Points à Retenir" : "Key Takeaways"}
              </div>
              <ul style="margin: 0; padding-left: 18px; color: #d4d4d8; font-size: 0.82rem; line-height: 1.5;">
                ${summaryData.takeaways.map(t => `<li style="margin-bottom: 6px;">${renderKaTeXText(t)}</li>`).join("")}
              </ul>
            </div>
          `;
        }

        container.innerHTML = `
          <div style="font-family: 'Hanken Grotesk', sans-serif; color: #e4e4e7;">
            <div style="border-bottom: 1px solid #27272a; padding-bottom: 10px; margin-bottom: 12px;">
              <div style="font-size: 1.05rem; font-weight: 800; color: #ffffff; line-height: 1.3;">${summaryData.title}</div>
              <div style="font-size: 0.75rem; color: #a1a1aa; margin-top: 4px;">${summaryData.subtitle} • ${instructor}</div>
            </div>
            
            <div style="font-size: 0.83rem; line-height: 1.55; color: #d4d4d8; margin-bottom: 14px; background: #121215; padding: 10px; border-radius: 6px; border-left: 3px solid #a855f7;">
              ${summaryData.overview}
            </div>

            ${formulasHtml}
            ${conceptsHtml}
            ${takeawaysHtml}
          </div>
        `;
      }


      function switchSidebarTab(tabName, element) {
        if (tabName === "evaluation") {
          const video = document.getElementById("lectureVideoPlayer");
          const isVideoEnded =
            video &&
            (video.ended ||
              (video.duration && maxTimeWatched >= video.duration - 2.0));
          const isPdfRead = maxTimeWatched >= 99999;
          const alreadyMastered = !!window.activeChapterMastered;

          if (!alreadyMastered && !isVideoEnded && !isPdfRead) {
            showToastNotification(
              "Evaluation Locked",
              "You must watch the video or read the textbook PDF first.",
            );
            return;
          }
        }

        document
          .querySelectorAll(".sidebar-tab-btn")
          .forEach((btn) => btn.classList.remove("active"));
        element.classList.add("active");

        // Scroll tutor transcripts to bottom when selecting the Tutor tab
        if (tabName === "tutor") {
          const container = document.getElementById("tutorTranscriptContainer");
          if (container) {
            setTimeout(() => {
              container.scrollTop = container.scrollHeight;
            }, 100);
          }
        }

        // Automatically close evaluation split panel (Panels A & B) when switching to non-evaluation tabs
        if (tabName !== "evaluation") {
          if (typeof toggleQuizView === "function") {
            toggleQuizView(false);
          }
        }

        const panes = [
          "tutor",
          "chat",
          "flashcards",
          "timestamps",
          "profile",
          "evaluation",
        ];
        panes.forEach((p) => {
          const paneEl = document.getElementById(`${p}-pane`);
          if (paneEl) {
            if (p === tabName) {
              const targetDisplay =
                p === "chat" || p === "tutor" || p === "flashcards"
                  ? "flex"
                  : "block";
              paneEl.style.setProperty("display", targetDisplay, "important");
              paneEl.classList.add("active");
            } else {
              paneEl.style.setProperty("display", "none", "important");
              paneEl.classList.remove("active");
            }
          }
        });

        // Expandable Profile Tab Workspace Panel & Focus Lock
        const sidebar = document.querySelector(".interaction-sidebar");
        const lectureVideo = document.getElementById("lectureVideoPlayer");
        if (sidebar) sidebar.classList.add("profile-expanded");

        if (tabName === "profile") {
          if (lectureVideo) {
            lectureVideo.pause();
            const btn = document.getElementById("playControlBtn");
            if (btn)
              btn.innerHTML =
                '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
          }
        } else if (tabName === "timestamps") {
          renderVideoSummary(activeVideoId);
        } else if (tabName === "evaluation") {
          toggleQuizView(true);
          if (lectureVideo) {
            lectureVideo.pause();
            const btn = document.getElementById("playControlBtn");
            if (btn)
              btn.innerHTML =
                '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
          }
        } else {
          toggleQuizView(false);
          if ((tabName === "tutor" || tabName === "chat") && lectureVideo) {
            if (isConversationSessionActive) {
              console.log(
                "[TAB SWITCH] Conversation session is active. Keep video paused.",
              );
            } else {
              lectureVideo.removeAttribute("paused");
              lectureVideo
                .play()
                .then(() => {
                  console.log("Playback resumed on tab switch");
                })
                .catch((err) => {
                  lectureVideo.play();
                });
              const btn = document.getElementById("playControlBtn");
              if (btn)
                btn.innerHTML =
                  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
            }
          }
        }

        // Swap avatars representation dynamically based on tabs to wow the user
        const webcamVideo = document.getElementById("tutorWebcamMock");
        const meshAvatar = document.getElementById("tutorMeshAvatar");
        const liveBadge = document.getElementById("sidebarLiveStatus");

        if (webcamVideo) webcamVideo.style.display = "block";
        if (meshAvatar) meshAvatar.style.display = "none";
        if (liveBadge) {
          if (tabName === "tutor") {
            liveBadge.style.display = "flex";
            liveBadge.innerText = "LIVE";
          } else if (tabName === "chat") {
            liveBadge.style.display = "flex";
            liveBadge.innerText = "AI Tutor: Listening...";
          } else {
            liveBadge.style.display = "none";
          }
        }

        if (tabName === "profile") {
          loadProfileProgress();
        }
        updateActiveViewState();
      }

      function updateActiveViewState() {
        let activeTabName = "";
        const activeTab = document.querySelector(".sidebar-tab-btn.active");
        if (activeTab) {
          activeTabName = activeTab.innerText.trim().toLowerCase();
        }

        let state = "dashboard";
        if (isScreenSharingActive) {
          state = "screen_share";
        } else if (window.isWorkspaceActive) {
          state = "split_workspace";
        } else if (window.isVirtualLabsActive) {
          state = "virtual_labs";
        } else if (window.isStemGraphsActive) {
          state = "stem_graphs";
        } else if (activeTabName === "evaluation") {
          state = "evaluation";
        }

        let extraContext = "";
        if (window.isVirtualLabsActive) {
          extraContext = window.currentSocraticLabContext
            ? (typeof window.currentSocraticLabContext === "string" ? window.currentSocraticLabContext : JSON.stringify(window.currentSocraticLabContext))
            : "Student is actively experimenting in STEM Virtual Labs (Chemistry & Physics)";
        } else if (window.isStemGraphsActive) {
          extraContext = "Student is actively working with mathematical equations, curves, and inequalities in STEM Graphs.";
        } else if (activeTabName === "evaluation") {
          try {
            const trackKey = getQuizTrackKey();
            let questionsSet = isAlternativeQuizActive
              ? QUIZ_QUESTIONS[trackKey].alternative
              : QUIZ_QUESTIONS[trackKey].main;
            if (window.isPracticeQuizActive) {
              questionsSet = questionsSet.slice(3);
            } else {
              questionsSet = questionsSet.slice(0, 3);
            }
            extraContext = questionsSet
              .map((q, idx) => `Question ${idx + 1}: ${q.question}`)
              .join("\n");
          } catch (e) {}
        } else if (window.isWorkspaceActive) {
          const wbTextEl = document.getElementById("workspaceWhiteboardText");
          const wbView = document.getElementById("workspaceWhiteboardView");
          if (wbTextEl && wbView && wbView.style.display !== "none") {
            extraContext =
              "Digital Whiteboard current text content:\n" + wbTextEl.innerText;
          } else {
            const wTitle = document.getElementById("workspacePdfTitleLabel");
            if (wTitle) {
              extraContext = "Reviewing textbook page: " + wTitle.innerText;
            }
          }
        }

        console.log(
          "[ACTIVE STATE] Publishing active_view_state:",
          state,
          "with context length:",
          extraContext.length,
        );
        fetch("/api/active_state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            active_view_state: state,
            active_view_context: extraContext,
          }),
        }).catch((err) => console.error("Failed to update active state:", err));
      }

      // Popover helper functions & outside-click listener
      let isPopoverSticky = false;

      function getInstructorBio(name, subjects) {
        const cleanName = (name || "").toLowerCase();
        if (cleanName.includes("harris")) {
          return "Dr. Harris is an esteemed specialist in Physics with 15 years of experience in quantum mechanics and educational research. Dedicated to helping students grasp complex physical concepts.";
        } else if (cleanName.includes("marcus")) {
          return "Professor Marcus is a senior Philosophy Specialist with 20 years of academic teaching experience. He specializes in Ancient Socratic dialogues and Stoic philosophy.";
        } else if (
          cleanName.includes("evans") ||
          cleanName.includes("gandho")
        ) {
          return "GANDHO is an Economics Specialist with 10 years of experience teaching global growth indicators and international development at the United Nations.";
        } else if (cleanName.includes("sophia")) {
          return "Dr. Sophia AI is a Cognitive Science Specialist, specializing in AI-driven socratic tutor systems, machine learning, and cognitive neuroscience.";
        } else if (cleanName.includes("einstein")) {
          return "Albert Einstein was a theoretical physicist who developed the theory of relativity, one of the two pillars of modern physics, with a lifetime of academic exploration.";
        } else if (cleanName.includes("socrates")) {
          return "Socrates was a classical Greek philosopher credited as one of the founders of Western philosophy, known for the Socratic method of dialogue.";
        } else {
          return `${name} is an experienced ${subjects || "Academic"} Specialist, committed to guiding students through their academic journey with socratic clarity.`;
        }
      }

      function updatePopoverDetails(char) {
        const popoverAvatar = document.getElementById("popoverAvatar");
        if (popoverAvatar)
          popoverAvatar.src =
            char.avatar ||
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150";

        const popoverName = document.getElementById("popoverName");
        if (popoverName) popoverName.innerText = char.name || "";

        const popoverRole = document.getElementById("popoverRole");
        const popoverExp = document.getElementById("popoverExp");
        const popoverPhone = document.getElementById("popoverPhone");
        const popoverBio = document.getElementById("popoverBio");

        const locale = window.ACTIVE_DATABASE_LOCALE || "en_US";

        if (locale === "en_US") {
          if (popoverRole) popoverRole.innerText = char.role || "";
          if (popoverExp) popoverExp.innerText = char.experience || "N/A";
          if (popoverPhone) popoverPhone.innerText = char.phone || "N/A";
          if (popoverBio) popoverBio.innerText = char.bio || "";
        } else {
          if (popoverRole && char.role) {
            fetch(
              `/api/translate?text=${encodeURIComponent(char.role)}&locale=${encodeURIComponent(locale)}`,
            )
              .then((r) => r.json())
              .then((data) => {
                popoverRole.innerText = data.translated_text || char.role;
              })
              .catch(() => {
                popoverRole.innerText = char.role || "";
              });
          }
          if (popoverExp && char.experience) {
            fetch(
              `/api/translate?text=${encodeURIComponent(char.experience)}&locale=${encodeURIComponent(locale)}`,
            )
              .then((r) => r.json())
              .then((data) => {
                popoverExp.innerText = data.translated_text || char.experience;
              })
              .catch(() => {
                popoverExp.innerText = char.experience || "N/A";
              });
          }
          if (popoverPhone) popoverPhone.innerText = char.phone || "N/A";
          if (popoverBio && char.bio) {
            fetch(
              `/api/translate?text=${encodeURIComponent(char.bio)}&locale=${encodeURIComponent(locale)}`,
            )
              .then((r) => r.json())
              .then((data) => {
                popoverBio.innerText = data.translated_text || char.bio;
              })
              .catch(() => {
                popoverBio.innerText = char.bio || "";
              });
          }
        }
      }

      function showTutorPopover() {
        const popover = document.getElementById("tutorProfilePopover");
        if (popover) {
          const char = CHARACTERS[activeCharacterIndex];
          if (char) {
            updatePopoverDetails(char);
          }
          popover.classList.add("active");
        }
      }

      function hideTutorPopover(force = false) {
        const popover = document.getElementById("tutorProfilePopover");
        if (popover && (force || !isPopoverSticky)) {
          popover.classList.remove("active");
        }
      }

      function toggleTutorPopoverSticky(event) {
        if (event) event.stopPropagation();
        isPopoverSticky = !isPopoverSticky;
        const popover = document.getElementById("tutorProfilePopover");
        if (popover) {
          if (isPopoverSticky) {
            showTutorPopover();
            popover.style.border = "1.5px solid var(--primary)";
            popover.style.boxShadow =
              "0 12px 36px rgba(0, 0, 0, 0.7), 0 0 20px rgba(168, 85, 247, 0.4)";
          } else {
            popover.style.border = "1px solid var(--outline-variant)";
            popover.style.boxShadow =
              "0 12px 36px rgba(0, 0, 0, 0.6), 0 0 16px rgba(168, 85, 247, 0.2)";
            hideTutorPopover(true);
          }
        }
      }

      document.addEventListener("click", (event) => {
        const popover = document.getElementById("tutorProfilePopover");
        const avatarFrame = document.getElementById("carouselAvatarFrame");
        if (popover && avatarFrame) {
          if (
            !popover.contains(event.target) &&
            !avatarFrame.contains(event.target)
          ) {
            isPopoverSticky = false;
            popover.style.border = "1px solid var(--outline-variant)";
            popover.style.boxShadow =
              "0 12px 36px rgba(0, 0, 0, 0.6), 0 0 16px rgba(168, 85, 247, 0.2)";
            popover.classList.remove("active");
          }
        }
      });

      // Character carousel shifter
      function shiftCharacter(dir) {
        activeCharacterIndex =
          (activeCharacterIndex + dir + CHARACTERS.length) % CHARACTERS.length;
        const char = CHARACTERS[activeCharacterIndex];

        const img = document.getElementById("carouselAvatarImg");
        if (img) img.src = char.avatar;
        const nameEl = document.getElementById("carouselName");
        if (nameEl) nameEl.innerText = char.name;
        const roleEl = document.getElementById("carouselRole");

        const locale = window.ACTIVE_DATABASE_LOCALE || "en_US";
        if (roleEl) {
          if (locale === "en_US") {
            roleEl.innerText = char.role;
          } else {
            fetch(
              `/api/translate?text=${encodeURIComponent(char.role)}&locale=${encodeURIComponent(locale)}`,
            )
              .then((r) => r.json())
              .then((data) => {
                roleEl.innerText = data.translated_text || char.role;
              })
              .catch(() => {
                roleEl.innerText = char.role;
              });
          }
        }

        // Update popover content
        updatePopoverDetails(char);

        // Sync with sidebar header details too
        const textContainer = document.getElementById("instructor-text-box");
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
          nameDiv.innerText = char.name;
          textContainer.appendChild(nameDiv);

          const roleDiv = document.createElement("div");
          roleDiv.id = "profileCardRole";
          roleDiv.style.fontSize = "0.6rem";
          roleDiv.style.color = "var(--on-surface-variant)";
          roleDiv.style.whiteSpace = "nowrap";
          roleDiv.style.overflow = "hidden";
          roleDiv.style.textOverflow = "ellipsis";
          if (locale === "en_US") {
            roleDiv.innerText = char.role;
          } else {
            fetch(
              `/api/translate?text=${encodeURIComponent(char.role)}&locale=${encodeURIComponent(locale)}`,
            )
              .then((r) => r.json())
              .then((data) => {
                roleDiv.innerText = data.translated_text || char.role;
              })
              .catch(() => {
                roleDiv.innerText = char.role;
              });
          }
          textContainer.appendChild(roleDiv);
        }
        const profileAvatar = document.getElementById("profileCardAvatar");
        if (profileAvatar) profileAvatar.src = char.avatar;

        showToastNotification(
          "Character Sync",
          `Instructor character switched to ${char.name}.`,
        );
      }

      function toggleVideoPlayback() {
        const video = document.getElementById("lectureVideoPlayer");
        if (!video) return;

        const pane = document.getElementById("whiteboardSplitPane");
        const isPaneActive = pane && pane.classList.contains("active");
        if (video.paused) {
          if (
            isPaneActive ||
            ("speechSynthesis" in window && window.speechSynthesis.speaking)
          ) {
            console.log(
              "Ignore manual play click: workspace pane or speech synthesis is active.",
            );
            return;
          }
          video.play();
        } else {
          video.pause();
        }
      }

      // Automatically synchronize playControlBtn icon with video media state
      (function bindVideoPlaybackStateSync() {
        const syncPlayButtonUI = () => {
          const video = document.getElementById("lectureVideoPlayer");
          const playBtn = document.getElementById("playControlBtn");
          if (!video || !playBtn) return;

          if (video.paused || video.ended) {
            playBtn.innerHTML =
              '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'; // Play triangle
          } else {
            playBtn.innerHTML =
              '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'; // Pause bars
          }
        };

        const setupVideoSyncListeners = () => {
          const video = document.getElementById("lectureVideoPlayer");
          if (!video) return;

          video.addEventListener("play", syncPlayButtonUI);
          video.addEventListener("playing", syncPlayButtonUI);
          video.addEventListener("pause", syncPlayButtonUI);
          video.addEventListener("ended", syncPlayButtonUI);
          video.addEventListener("timeupdate", () => {
            if (!video.paused) {
              const playBtn = document.getElementById("playControlBtn");
              if (playBtn && playBtn.innerHTML.includes("M8 5v14l11-7z")) {
                syncPlayButtonUI();
              }
            }
          });
        };

        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", setupVideoSyncListeners);
        } else {
          setupVideoSyncListeners();
        }
      })();

      let prefetchedAudios = {};

      function preloadUpcomingLectureAudios(currentTime) {
        const currentLocale = window.ACTIVE_DATABASE_LOCALE || "en_US";
        const teacherLocale =
          window.ACTIVE_DATABASE_INSTRUCTOR_LOCALE || "en_US";
        if (currentLocale !== "en_US" || translationAudioMode !== "translated")
          return;

        // Look ahead 20 seconds
        activeVideoTranscripts.forEach((item) => {
          if (item.time > currentTime && item.time <= currentTime + 20) {
            if (!prefetchedAudios[item.marker]) {
              prefetchedAudios[item.marker] = "loading";

              const textToSpeak = item.translatedText || item.text || "";
              const cleanText = textToSpeak.replace(/^\[[^\]]+\]\s*/, "");
              const audioUrl =
                "/api/tts?locale=" +
                encodeURIComponent(currentLocale) +
                "&text=" +
                encodeURIComponent(cleanText);

              console.log(
                `[PRE-FETCH] Preloading TTS audio for marker ${item.marker}: "${cleanText}"`,
              );
              const audio = new Audio(audioUrl);
              audio.preload = "auto";
              audio.load();

              audio.oncanplaythrough = () => {
                prefetchedAudios[item.marker] = audio;
                console.log(
                  `[PRE-FETCH SUCCESS] Audio for marker ${item.marker} is cached and ready.`,
                );
              };
              audio.onerror = () => {
                delete prefetchedAudios[item.marker];
              };
            }
          }
        });
      }

      let activeTranslationAudios = [];

      function playTranslatedSegment(marker, text, translatedText) {
        const currentLocale = window.ACTIVE_DATABASE_LOCALE || "en_US";

        // Stop and clear all active audio elements
        stopAllTranslationAudios();

        const onPlayAudio = (audio) => {
          activeLectureAudio = audio;
          activeTranslationAudios.push(audio);
          audio
            .play()
            .catch((err) => console.warn("Audio playback failed:", err));
          audio.onended = () => {
            const idx = activeTranslationAudios.indexOf(audio);
            if (idx !== -1) activeTranslationAudios.splice(idx, 1);
            if (activeLectureAudio === audio) activeLectureAudio = null;
          };
        };

        if (
          prefetchedAudios[marker] &&
          prefetchedAudios[marker] !== "loading"
        ) {
          console.log(
            `[TTS PLAY] Using pre-fetched audio for marker ${marker}`,
          );
          onPlayAudio(prefetchedAudios[marker]);
        } else {
          console.log(
            `[TTS PLAY] Fallback to on-the-fly fetch for marker ${marker}`,
          );
          const textToSpeak = translatedText || text || "";
          const cleanText = textToSpeak.replace(/^\[[^\]]+\]\s*/, "");
          const audioUrl =
            "/api/tts?locale=" +
            encodeURIComponent(currentLocale) +
            "&text=" +
            encodeURIComponent(cleanText);

          const audio = new Audio(audioUrl);
          onPlayAudio(audio);
        }
      }

      function stopAllTranslationAudios() {
        if (activeLectureAudio) {
          try {
            activeLectureAudio.pause();
            activeLectureAudio.currentTime = 0;
          } catch (e) {}
          activeLectureAudio = null;
        }
        activeTranslationAudios.forEach((audio) => {
          if (audio) {
            try {
              audio.pause();
              audio.currentTime = 0;
            } catch (e) {}
          }
        });
        activeTranslationAudios = [];
      }

      function clearEmittedTranscriptsForBackwardsSeek() {
        const video = document.getElementById("lectureVideoPlayer");
        if (video) {
          const currentTime = video.currentTime;

          // 1. Stop all translation audios instantly
          stopAllTranslationAudios();

          // 2. Sync emittedTranscripts to current playhead:
          // - Remove future timestamps from emittedTranscripts so they can trigger later.
          // - Add past timestamps (except the current seek target if specified) so they don't trigger skipped.
          const targetMarker = window.lastSeekTargetMarker;
          activeVideoTranscripts.forEach((item) => {
            if (item.time > currentTime) {
              emittedTranscripts.delete(item.marker);
            } else if (targetMarker && item.marker === targetMarker) {
              emittedTranscripts.delete(item.marker); // Let this target marker trigger
            } else {
              emittedTranscripts.add(item.marker); // Skip other past markers
            }
          });
          window.lastSeekTargetMarker = null; // Reset target marker
        }
      }

      function onVideoProgressUpdate() {
        const video = document.getElementById("lectureVideoPlayer");
        const fill = document.getElementById("progressBarFill");
        const label = document.getElementById("currentTimeLabel");

        if (video.duration) {
          const pct = (video.currentTime / video.duration) * 100;
          fill.style.width = `${pct}%`;

          const cur = formatTime(video.currentTime);
          const dur = formatTime(video.duration);
          label.innerText = `${cur} / ${dur}`;

          const currentTime = video.currentTime;

          // Trigger pre-fetching of upcoming audios
          preloadUpcomingLectureAudios(currentTime);

          activeVideoTranscripts.forEach((item) => {
            if (
              currentTime >= item.time &&
              !emittedTranscripts.has(item.marker)
            ) {
              emittedTranscripts.add(item.marker);

              const currentLocale = window.ACTIVE_DATABASE_LOCALE || "en_US";
              const teacherLocale =
                window.ACTIVE_DATABASE_INSTRUCTOR_LOCALE || "en_US";

              // Print the transcript card locally immediately!
              const isStudentLocaleInstructorLocaleMismatch =
                currentLocale === "en_US";
              const textToShow = isStudentLocaleInstructorLocaleMismatch
                ? item.translatedText || item.text
                : item.text;
              const hasTranslated =
                isStudentLocaleInstructorLocaleMismatch &&
                !!item.translatedText;
              appendTutorTranscriptCard(textToShow, item.marker, hasTranslated);

              // Play the translation segment locally immediately (zero latency!)
              if (
                isStudentLocaleInstructorLocaleMismatch &&
                translationAudioMode === "translated"
              ) {
                playTranslatedSegment(
                  item.marker,
                  item.text,
                  item.translatedText,
                );
              }

              // Still broadcast to WebSocket so the UI prints it and other mesh nodes stay in sync
              if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                wsConnection.send(
                  JSON.stringify({
                    action: "LECTURE_TRANSCRIPT",
                    timestamp_marker: item.marker,
                    text: item.translatedText || item.text,
                  }),
                );
              }
            }
          });
        }
      }

      function seekVideo(event) {
        if (window.timelineLocked) {
          showToastNotification(
            "Timeline Locked",
            "Mastery Evaluation required to seek video.",
          );
          return;
        }
        const video = document.getElementById("lectureVideoPlayer");
        const bar = event.currentTarget;
        const clickX = event.offsetX;
        const width = bar.clientWidth;
        const pct = clickX / width;

        if (video.duration) {
          const targetTime = pct * video.duration;
          if (targetTime > maxTimeWatched + 1.5) {
            showToastNotification(
              "Seeking Restricted",
              "You must watch the video sequentially.",
            );
            return;
          }
          video.currentTime = targetTime;
        }
      }

      function formatTime(secs) {
        const m = Math.floor(secs / 60)
          .toString()
          .padStart(2, "0");
        const s = Math.floor(secs % 60)
          .toString()
          .padStart(2, "0");
        return `${m}:${s}`;
      }

      function toggleVideoFullscreen() {
        const video = document.getElementById("lectureVideoPlayer");
        if (video.requestFullscreen) {
          video.requestFullscreen();
        }
      }

      function replayVideo() {
        const video = document.getElementById("lectureVideoPlayer");
        if (video) {
          video.currentTime = 0;
          maxTimeWatched = 0;

          // Clear saved progress on restart
          if (typeof activeVideoId !== "undefined" && activeVideoId) {
            localStorage.removeItem("video_time_" + activeVideoId);
            localStorage.removeItem("video_max_time_" + activeVideoId);
          }

          // Clear subtitle checkpoints so they can play again from start
          emittedTranscripts.clear();

          // Clear the Tutor tab transcript list
          const tutorContainer = document.getElementById(
            "tutorTranscriptContainer",
          );
          if (tutorContainer) {
            tutorContainer.innerHTML = "";
          }
          localStorage.removeItem(
            "tutorTranscriptHistory_" + selectedGoalTrack,
          );

          video.play();
          showToastNotification(
            "Video restarted",
            "Starting video from the beginning.",
          );
        }
      }

      // Mic controller toggler
      let isListening = false;
      let isConversationSessionActive = false;
      let wasVideoPlayingBeforeSession = false;
      let isAgentResponding = false;
      let micInterval = null;
      let micWaveAngle = 0;
      let isRecognitionRunning = false;
      window.currentTutorSpeechText = "";

      // Helper to check if user speech is just an echo of the tutor's own voice
      function isTutorEcho(transcription, tutorText) {
        if (!tutorText) return false;
        const norm = (str) => {
          return str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // remove accents/diacritics
            .replace(/[^a-z0-9\s]/g, "") // remove punctuation
            .replace(/\s+/g, " ") // normalize whitespace
            .trim();
        };
        const normTrans = norm(transcription);
        const normTutor = norm(tutorText);
        if (!normTrans) return true; // Empty is ignored

        if (normTutor.includes(normTrans)) {
          return true;
        }
        if (normTrans.includes(normTutor)) {
          return true;
        }

        const wordsTrans = normTrans.split(" ");
        const wordsTutor = new Set(normTutor.split(" "));
        let overlapCount = 0;
        for (const w of wordsTrans) {
          if (wordsTutor.has(w)) {
            overlapCount++;
          }
        }
        const overlapRatio = overlapCount / wordsTrans.length;
        if (overlapRatio > 0.7 && wordsTrans.length > 3) {
          return true;
        }
        return false;
      }

      let recognition = null;

      function initSpeechRecognition() {
        if (
          "webkitSpeechRecognition" in window ||
          "SpeechRecognition" in window
        ) {
          const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
          recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;

          const currentLocale = window.ACTIVE_DATABASE_LOCALE || "en_US";
          recognition.lang = currentLocale.replace("_", "-");
          console.log(
            `[SPEECH] Classroom voice recognition language initialized to: ${recognition.lang}`,
          );

          recognition.onstart = function () {
            console.log("Speech recognition started.");
            isRecognitionRunning = true;
          };

          recognition.onresult = function (event) {
            const resultText = event.results[0][0].transcript;
            console.log("Speech recognition result: " + resultText);

            if (isConversationSessionActive) {
              // Check if this result is just an echo of the tutor's own voice
              if (
                window.currentTutorSpeechText &&
                isTutorEcho(resultText, window.currentTutorSpeechText)
              ) {
                console.log(
                  "[SPEECH] Ignored result because it is a tutor echo: " +
                    resultText,
                );
                return;
              }

              // Interrupt active speech / typewriter writing
              if (
                speechInProgress ||
                ("speechSynthesis" in window && window.speechSynthesis.speaking)
              ) {
                console.log(
                  "[SPEECH] Interrupted by user query. Cancelling active speech...",
                );
                if ("speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
                speechInProgress = false;
                isAgentResponding = false;
                if (fallbackTimer) {
                  clearInterval(fallbackTimer);
                  fallbackTimer = null;
                }
                const statusLabel = document.getElementById("whiteboardStatus");
                if (statusLabel) statusLabel.innerText = "Interrupted";
              }

              isAgentResponding = true;
              const label = document.getElementById("micTimerText");
              if (label) {
                label.innerText = "Listening State: Processing...";
              }
              stopMicWaveAnimation();
              triggerRAGQuery(resultText);
              try {
                recognition.stop();
              } catch (e) {}
            } else {
              console.log(
                "[SPEECH] Ignored speech recognition result because conversation session is inactive: " +
                  resultText,
              );
            }
          };

          recognition.onerror = function (event) {
            console.error("Speech recognition error: ", event.error);
            isRecognitionRunning = false;
            if (isConversationSessionActive) {
              if (
                event.error === "not-allowed" ||
                event.error === "audio-capture" ||
                event.error === "service-not-allowed"
              ) {
                showToastNotification(
                  "Voice Recognition Error",
                  "Access denied or mic missing. Session ended.",
                );
                isConversationSessionActive = false;
                toggleMicRaiseHand(null, false);
              }
            } else {
              console.log(
                "[SPEECH] Speech recognition error ignored because session is inactive.",
              );
            }
          };

          recognition.onend = function () {
            console.log("Speech recognition ended.");
            isRecognitionRunning = false;
            if (isConversationSessionActive && !isAgentResponding) {
              console.log(
                "[SPEECH] Recognition ended during active session. Restarting listener...",
              );
              try {
                if (!isRecognitionRunning) {
                  recognition.start();
                  // Restore active UI indicators
                  syncMicUI("active", "Listening State: Active");
                  startMicWaveAnimation();
                }
              } catch (e) {
                console.error(
                  "[SPEECH] Failed to restart recognition on end:",
                  e,
                );
              }
            } else {
              console.log(
                "[SPEECH] Recognition ended cleanly after session deactivation.",
              );
            }
          };
        }
      }

      function handleAgentSpeechFinished() {
        if (isConversationSessionActive) {
          console.log(
            "[SPEECH] Agent finished speaking. Auto-deactivating mic session.",
          );
          isAgentResponding = false;
          // Retain the spoken text in memory for 4 seconds to catch trailing speaker echoes
          setTimeout(() => {
            window.currentTutorSpeechText = "";
          }, 4000);

          toggleMicRaiseHand(null, false);
        }
      }

      function syncMicUI(state, text, sourceId = null) {
        const btn = document.getElementById("micActivationBtn");
        const label = document.getElementById("micTimerText");
        const wBtn = document.getElementById("workspaceMicBtn");
        const wLabel = document.getElementById("workspaceMicTimerText");

        const targetId = sourceId || window.activeLiveKitSourceId;

        if (state === "idle") {
          if (btn) btn.classList.remove("active", "loading");
          if (wBtn) wBtn.classList.remove("active", "loading");
          if (label) label.innerText = text || "Listening State: Idle";
          if (wLabel) wLabel.innerText = text || "Listening State: Idle";
          return;
        }

        if (state === "connecting") {
          if (!targetId || targetId === "micActivationBtn") {
            if (btn) {
              btn.classList.add("loading");
              btn.classList.remove("active");
            }
            if (label)
              label.innerText = text || "Listening State: Connecting...";
          }
          if (!targetId || targetId === "workspaceMicBtn") {
            if (wBtn) {
              wBtn.classList.add("loading");
              wBtn.classList.remove("active");
            }
            if (wLabel)
              wLabel.innerText = text || "Listening State: Connecting...";
          }
        } else if (state === "active") {
          if (!targetId || targetId === "micActivationBtn") {
            if (btn) {
              btn.classList.remove("loading");
              btn.classList.add("active");
            }
            if (label) label.innerText = text || "Listening State: Active";
          }
          if (!targetId || targetId === "workspaceMicBtn") {
            if (wBtn) {
              wBtn.classList.remove("loading");
              wBtn.classList.add("active");
            }
            if (wLabel) wLabel.innerText = text || "Listening State: Active";
          }
        }
      }

      let lkRoom = null;
      let lkAudioTrack = null;

      async function startLiveKitVoiceSession(sourceId = null) {
        try {
          if (lkRoom) {
            await lkRoom.disconnect();
            lkRoom = null;
          }

          syncMicUI("connecting", "Listening State: Connecting...", sourceId);

          const screenBtn = document.getElementById("screenShareBtn");
          if (screenBtn) {
            screenBtn.style.display = "flex";
            screenBtn.classList.add("ready-highlight");
          }

          // Fetch token from display_client /token endpoint
          const currentStudent = window.ACTIVE_DATABASE_USER || activeStudentName || "Alseny";
          const tokenResp = await fetch(
            `/token?room=socratic_tutor_room_${Math.floor(Math.random() * 1000)}&identity=${encodeURIComponent(currentStudent)}&name=${encodeURIComponent(currentStudent)}&mode=SOLO&video_id=${encodeURIComponent(activeVideoId)}`,
          );
          const tokenData = await tokenResp.json();
          const token = tokenData.token;

          const wsUrl = "wss://gandaledu-uqy2on78.livekit.cloud";

          // Initialize Room
          lkRoom = new LivekitClient.Room({
            adaptiveStream: true,
            dynacast: true,
            publishDefaults: {
              audioPreset: LivekitClient.AudioPresets.speech,
            },
          });
          window.lkRoom = lkRoom;

          // Listen to audio track subscriptions
          lkRoom.on(
            LivekitClient.RoomEvent.TrackSubscribed,
            (track, publication, participant) => {
              if (track.kind === "audio") {
                console.log("[LIVEKIT] Audio track subscribed. Attaching...");
                lkAudioTrack = track.attach();
                document.body.appendChild(lkAudioTrack);
                lkAudioTrack.play().catch((err) => {
                  console.warn(
                    "[LIVEKIT] Explicit play on attached track failed:",
                    err,
                  );
                });
                lkRoom
                  .startAudio()
                  .catch((e) =>
                    console.warn(
                      "[LIVEKIT] startAudio failed on track subscription:",
                      e,
                    ),
                  );
              }
            },
          );

          // Listen to participant data messages (transcripts)
          lkRoom.on(
            LivekitClient.RoomEvent.DataReceived,
            (payload, participant, kind, topic) => {
              if (topic === "tutor-transcripts") {
                const decoder = new TextDecoder();
                try {
                  const data = JSON.parse(decoder.decode(payload));
                  console.log("[LIVEKIT DATA RECEIVED]", data);
                  if (data.role === "assistant") {
                    // appendTutorTranscriptCard(data.text);
                    appendChatMessage("TUTOR", data.text);
                    syncMicUI("active", "Listening State: Active");
                    startMicWaveAnimation();

                    // Live Socratic whiteboard note updates
                    if (window.isWorkspaceActive) {
                      writeToWorkspaceWhiteboard(data.text);
                    }
                  } else if (data.role === "user") {
                    // appendTutorStudentCard(data.text);
                    appendChatMessage("YOU", data.text);
                    if (window.isWorkspaceActive) {
                      writeUserToWorkspaceWhiteboard(data.text);
                    }
                  }
                } catch (err) {
                  console.error(
                    "[LIVEKIT DATA ERROR] Failed to parse message:",
                    err,
                  );
                }
              }
            },
          );

          lkRoom.on(LivekitClient.RoomEvent.Connected, () => {
            console.log("[LIVEKIT] Connected successfully!");
            syncMicUI("active", "Listening State: Active");
            startMicWaveAnimation();

            // Unblock browser autoplay for LiveKit audio
            lkRoom
              .startAudio()
              .then(() => {
                console.log("[LIVEKIT] Audio playback unblocked successfully.");
              })
              .catch((err) => {
                console.warn("[LIVEKIT] startAudio failed:", err);
              });

            const screenBtn = document.getElementById("screenShareBtn");
            if (screenBtn) {
              screenBtn.style.display = "flex";
              if (!isScreenSharingActive) {
                screenBtn.classList.add("ready-highlight");
              }
            }
          });

          lkRoom.on(LivekitClient.RoomEvent.Disconnected, () => {
            console.log("[LIVEKIT] Disconnected.");
            cleanupSessionUI();
          });

          // Connect to LiveKit Cloud
          await lkRoom.connect(wsUrl, token);

          // Enable microphone
          await lkRoom.localParticipant.setMicrophoneEnabled(true);
          console.log("[LIVEKIT] Microphone enabled.");
        } catch (err) {
          console.error("[LIVEKIT ERROR]", err);
          showToastNotification(
            "Voice Session Error",
            "Failed to connect to Socratic Tutor server.",
          );
          cleanupSessionUI();
        }
      }

      async function stopLiveKitVoiceSession() {
        if (lkRoom) {
          console.log("[LIVEKIT] Stopping session...");
          try {
            await lkRoom.disconnect();
          } catch (e) {}
          lkRoom = null;
        }
        cleanupSessionUI();
      }

      let isScreenSharingActive = false;

      function makeElementDraggable(el, handle) {
        let pos1 = 0,
          pos2 = 0,
          pos3 = 0,
          pos4 = 0;
        handle.onmousedown = dragMouseDown;
        handle.ontouchstart = dragTouchStart;

        function dragMouseDown(e) {
          e = e || window.event;
          e.preventDefault();
          pos3 = e.clientX;
          pos4 = e.clientY;
          document.onmouseup = closeDragElement;
          document.onmousemove = elementDrag;
        }

        function dragTouchStart(e) {
          if (e.touches && e.touches[0]) {
            pos3 = e.touches[0].clientX;
            pos4 = e.touches[0].clientY;
            document.ontouchend = closeDragElement;
            document.ontouchmove = elementTouchDrag;
          }
        }

        function elementDrag(e) {
          e = e || window.event;
          e.preventDefault();
          pos1 = pos3 - e.clientX;
          pos2 = pos4 - e.clientY;
          pos3 = e.clientX;
          pos4 = e.clientY;
          updatePosition(el.offsetTop - pos2, el.offsetLeft - pos1);
        }

        function elementTouchDrag(e) {
          if (e.touches && e.touches[0]) {
            pos1 = pos3 - e.touches[0].clientX;
            pos2 = pos4 - e.touches[0].clientY;
            pos3 = e.touches[0].clientX;
            pos4 = e.touches[0].clientY;
            updatePosition(el.offsetTop - pos2, el.offsetLeft - pos1);
          }
        }

        function updatePosition(newTop, newLeft) {
          if (newTop < 10) newTop = 10;
          if (newTop > window.innerHeight - el.offsetHeight - 10)
            newTop = window.innerHeight - el.offsetHeight - 10;
          if (newLeft < 10) newLeft = 10;
          if (newLeft > window.innerWidth - el.offsetWidth - 10)
            newLeft = window.innerWidth - el.offsetWidth - 10;
          el.style.top = newTop + "px";
          el.style.left = newLeft + "px";
        }

        function closeDragElement() {
          document.onmouseup = null;
          document.onmousemove = null;
          document.ontouchend = null;
          document.ontouchmove = null;
        }
      }

      let lastAvatarParentId = "socraticWorkspaceAvatarPanel";
      let pipWindow = null;
      let fallbackDrawInterval = null;
      let isExitingPip = false;
      let cachedAvatarImgBox = null;

      async function toggleAvatarPopout() {
        if (pipWindow) {
          exitPictureInPicture();
        } else {
          showFloatingScreenShareAvatar(true);
        }
      }

      async function showFloatingScreenShareAvatar(show) {
        const avatarBox = document.getElementById("avatarImgBox") || cachedAvatarImgBox;
        if (!avatarBox) return;
        cachedAvatarImgBox = avatarBox;

        if (show && pipWindow) {
          exitPictureInPicture();
          return;
        }

        const widget = document.getElementById("floatingScreenShareWidget");
        const targetContainer = document.getElementById(
          "floatingAvatarImgContainer",
        );

        window.wasWorkspaceActiveBeforePip = window.isWorkspaceActive;
        if (show) {
          // Show the floating DOM widget
          if (widget) widget.style.display = "flex";
          if (targetContainer) {
            targetContainer.appendChild(avatarBox);
          }

          // Try Document Picture-in-Picture first (always-on-top DOM window)
          if ("documentPictureInPicture" in window) {
            try {
              pipWindow = await window.documentPictureInPicture.requestWindow({
                width: 246,
                height: 286,
              });

              // Copy stylesheets to the PiP window to preserve styling
              [...document.styleSheets].forEach((styleSheet) => {
                try {
                  const cssRules = [...styleSheet.cssRules]
                    .map((rule) => rule.cssText)
                    .join("");
                  const style = document.createElement("style");
                  style.textContent = cssRules;
                  pipWindow.document.head.appendChild(style);
                } catch (e) {
                  const link = document.createElement("link");
                  link.rel = "stylesheet";
                  link.type = styleSheet.type;
                  link.media = styleSheet.media.mediaText;
                  link.href = styleSheet.href;
                  pipWindow.document.head.appendChild(link);
                }
              });

              // Style PiP document body
              pipWindow.document.body.style.background = "#0c0c0e";
              pipWindow.document.body.style.margin = "0";
              pipWindow.document.body.style.display = "flex";
              pipWindow.document.body.style.alignItems = "center";
              pipWindow.document.body.style.justifyContent = "center";
              pipWindow.document.body.style.overflow = "hidden";

              // Append avatar container into the PiP body
              pipWindow.document.body.appendChild(avatarBox);

              // Hide the background DOM widget container on the main page while native PiP is open
              if (widget) widget.style.display = "none";

              // Update popout button text inside PiP to Dock
              const btn = avatarBox.querySelector("#popoutAvatarBtn");
              if (btn) btn.innerHTML = "↙ Dock";

              // Restart the Spatius avatar to recreate WebGL context in the new window
              if (window.spatiusAvatarManager) {
                window.spatiusAvatarManager.stopAvatar().then(() => {
                  window.spatiusAvatarManager.startAvatar();
                });
              }

              // Listen for close event before the document unloads to reparent correctly
              pipWindow.addEventListener("pagehide", () => {
                exitPictureInPicture();
              });
              pipWindow.addEventListener("unload", () => {
                exitPictureInPicture();
              });

              showToastNotification(
                "Picture-in-Picture Active",
                "Tutor avatar is now floating on top of your screen.",
              );
              return;
            } catch (err) {
              console.error(
                "Document PiP request failed, falling back to Video PiP:",
                err,
              );
            }
          }

          // Fallback: Standard HTML5 Video Picture-in-Picture
          try {
            const canvasEl = document.getElementById("spatiusAvatarCanvas");
            const imgEl = document.getElementById("socraticAvatarImg");
            let streamCanvas = canvasEl;

            if (imgEl && imgEl.style.display !== "none") {
              // Create temporary canvas to capture fallback static image
              const tempCanvas = document.createElement("canvas");
              tempCanvas.width = 240;
              tempCanvas.height = 280;
              const ctx = tempCanvas.getContext("2d");
              streamCanvas = tempCanvas;

              fallbackDrawInterval = setInterval(() => {
                if (imgEl.complete && imgEl.naturalWidth > 0) {
                  ctx.drawImage(
                    imgEl,
                    0,
                    0,
                    tempCanvas.width,
                    tempCanvas.height,
                  );
                } else {
                  ctx.fillStyle = "#08080a";
                  ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                }
              }, 100);
            }

            const stream = streamCanvas.captureStream(15);
            let pipVideo = document.getElementById("fallbackPipVideo");
            if (!pipVideo) {
              pipVideo = document.createElement("video");
              pipVideo.id = "fallbackPipVideo";
              pipVideo.muted = true;
              pipVideo.playsInline = true;
              pipVideo.style.display = "none";
              document.body.appendChild(pipVideo);
            }

            pipVideo.srcObject = stream;
            await pipVideo.play();
            await pipVideo.requestPictureInPicture();

            pipVideo.addEventListener("leavepictureinpicture", () => {
              exitPictureInPicture();
            });

            showToastNotification(
              "Picture-in-Picture Active",
              "Tutor stream is now floating on top.",
            );
          } catch (e) {
            console.error("Video PiP Fallback failed:", e);
            showToastNotification(
              "PiP Error",
              "Your browser does not support always-on-top floating windows.",
            );
          }
        } else {
          exitPictureInPicture();
        }
      }

      function exitPictureInPicture() {
        if (isExitingPip) return;
        isExitingPip = true;

        try {
          let avatarBox = cachedAvatarImgBox || document.getElementById("avatarImgBox");

          // CRITICAL: Retrieve node from PiP window context BEFORE closing pipWindow!
          if (pipWindow && pipWindow.document) {
            const inPipBox = pipWindow.document.getElementById("avatarImgBox");
            if (inPipBox) {
              avatarBox = inPipBox;
            }
          }

          if (pipWindow) {
            try {
              pipWindow.close();
            } catch (e) {}
            pipWindow = null;
          }
          if (fallbackDrawInterval) {
            clearInterval(fallbackDrawInterval);
            fallbackDrawInterval = null;
          }

          const wsPanel = document.getElementById("socraticWorkspaceAvatarPanel");
          const statusIndicator = document.getElementById("tutorStatusIndicator");
          const widget = document.getElementById("floatingScreenShareWidget");

          // CRITICAL: Re-adopt node into main document if coming from PiP window context
          if (avatarBox) {
            try {
              if (avatarBox.ownerDocument !== document) {
                avatarBox = document.adoptNode(avatarBox);
              }
            } catch (e) {
              console.warn("[AVATAR ADOPT NODE WARNING]", e);
            }
            cachedAvatarImgBox = avatarBox;
          }

          if (wsPanel && avatarBox) {
            wsPanel.style.display = "flex";
            avatarBox.style.display = "block";
            if (statusIndicator) {
              wsPanel.insertBefore(avatarBox, statusIndicator);
            } else {
              wsPanel.appendChild(avatarBox);
            }
          }
          if (widget) widget.style.display = "none";

          // Restore Popout button text to 🗗 Popout
          const btn = avatarBox ? avatarBox.querySelector("#popoutAvatarBtn") : document.getElementById("popoutAvatarBtn");
          if (btn) btn.innerHTML = "🗗 Popout";

          // Always return to split screen workspace if it was active or opened from workspace
          const workspacePane = document.getElementById("socraticWorkspacePane");
          if (workspacePane && (window.wasWorkspaceActiveBeforePip || window.isWorkspaceActive)) {
            const dashboardPane = document.getElementById("dashboardPane");
            if (dashboardPane) dashboardPane.classList.remove("active");
            workspacePane.classList.add("active");
            window.isWorkspaceActive = true;
          }

          // Restart the Spatius avatar to recreate WebGL context after reparenting (AGENTS.md Rule 3)
          if (window.spatiusAvatarManager) {
            window.spatiusAvatarManager.stopAvatar().then(() => {
              window.spatiusAvatarManager.startAvatar();
            });
          }

          const pipVideo = document.getElementById("fallbackPipVideo");
          if (pipVideo) {
            try {
              if (document.pictureInPictureElement === pipVideo) {
                document.exitPictureInPicture();
              }
            } catch (e) {}
            pipVideo.remove();
          }
        } finally {
          isExitingPip = false;
        }
      }

      // Initialize drag-to-move functionality for floatingScreenShareWidget DOM container
      (function initFloatingWidgetDrag() {
        document.addEventListener("DOMContentLoaded", () => {
          const widget = document.getElementById("floatingScreenShareWidget");
          const handle = document.getElementById("floatingDragHandle");
          if (!widget || !handle) return;

          let isDragging = false;
          let startX, startY, initialLeft, initialTop;

          handle.addEventListener("mousedown", (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = widget.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            widget.style.right = "auto";
            widget.style.left = initialLeft + "px";
            widget.style.top = initialTop + "px";
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
          });

          function onMouseMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            widget.style.left = (initialLeft + dx) + "px";
            widget.style.top = (initialTop + dy) + "px";
          }

          function onMouseUp() {
            isDragging = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          }
        });
      })();

      function stopScreenShareProgrammatically() {
        if (!isScreenSharingActive) return;
        isScreenSharingActive = false;

        const btn = document.getElementById("screenShareBtn");
        const label = document.getElementById("micTimerText");
        if (btn) {
          btn.classList.remove("active");
          btn.classList.add("ready-highlight");
        }
        if (label) label.innerText = "Listening State: Active";

        showToastNotification("Screen Share Stopped", "Screen share stopped.");
        showFloatingScreenShareAvatar(false);
        updateActiveViewState();

        // Tell LiveKit to disable screen share if room is connected
        if (lkRoom && lkRoom.state === "connected") {
          lkRoom.localParticipant.setScreenShareEnabled(false).catch((err) => {
            console.warn(
              "[LIVEKIT] setScreenShareEnabled(false) failed on auto-ended:",
              err,
            );
          });
        }
      }

      async function toggleScreenShare(event) {
        if (event) event.stopPropagation();
        if (!lkRoom) return;

        const btn = document.getElementById("screenShareBtn");
        const label = document.getElementById("micTimerText");

        try {
          if (!isScreenSharingActive) {
            label.innerText = "Sharing Screen: Requesting...";
            btn.classList.add("loading");
            btn.classList.remove("ready-highlight");

            // Show the floating avatar immediately to secure user gesture context
            await showFloatingScreenShareAvatar(true);

            const pub =
              await lkRoom.localParticipant.setScreenShareEnabled(true, { displaySurface: "monitor" });

            isScreenSharingActive = true;
            btn.classList.remove("loading");
            btn.classList.add("active");
            label.innerText = "Sharing Screen: Active";
            showToastNotification(
              "Screen Share Active",
              "Screen sharing active! You can share your Entire Screen / Desktop so GANDHO can see all your desktop books and files.",
            );

            // Listen to native ended event on the media stream track to detect native toolbar stop sharing clicks
            if (pub && pub.track && pub.track.mediaStreamTrack) {
              pub.track.mediaStreamTrack.onended = () => {
                console.log(
                  "[SCREEN SHARE] Native track ended event detected.",
                );
                stopScreenShareProgrammatically();
              };
            }

            updateActiveViewState();
          } else {
            await lkRoom.localParticipant.setScreenShareEnabled(false);
            isScreenSharingActive = false;
            btn.classList.remove("active");
            btn.classList.add("ready-highlight");
            label.innerText = "Listening State: Active";
            showToastNotification(
              "Screen Share Stopped",
              "Screen share stopped.",
            );

            showFloatingScreenShareAvatar(false);
            updateActiveViewState();
          }
        } catch (err) {
          console.error("[LIVEKIT SCREEN SHARE ERROR]", err);
          isScreenSharingActive = false;
          if (btn) {
            btn.classList.remove("loading");
            btn.classList.remove("active");
            btn.classList.add("ready-highlight");
          }
          label.innerText = "Listening State: Active";
          showToastNotification(
            "Screen Share Error",
            "Failed to start screen sharing.",
          );
          showFloatingScreenShareAvatar(false);
          updateActiveViewState();
        }
      }

      function cleanupSessionUI() {
        syncMicUI("idle", "Listening State: Idle");
        stopMicWaveAnimation();
        isListening = false;
        isConversationSessionActive = false;

        const screenBtn = document.getElementById("screenShareBtn");
        if (screenBtn) {
          screenBtn.style.display = "none";
          screenBtn.classList.remove("active", "loading", "ready-highlight");
        }
        isScreenSharingActive = false;

        showFloatingScreenShareAvatar(false);

        if (lkAudioTrack) {
          try {
            lkAudioTrack.remove();
          } catch (e) {}
          lkAudioTrack = null;
        }
      }

      function toggleMicRaiseHand(event, forceState) {
        console.log(
          "[DEBUG] toggleMicRaiseHand triggered! Event target:",
          event ? event.target : "none",
          "forceState:",
          forceState,
          "current state:",
          isConversationSessionActive,
        );
        if (event) {
          event.stopPropagation();
        }

        // Extract the ID of the clicked button
        let sourceId =
          event && event.currentTarget ? event.currentTarget.id : null;
        if (!sourceId && event && event.target) {
          let el = event.target;
          while (el && el !== document.body) {
            if (el.classList && el.classList.contains("mic-glow-button")) {
              sourceId = el.id;
              break;
            }
            el = el.parentElement;
          }
        }
        if (
          isConversationSessionActive ||
          forceState === true ||
          (forceState === undefined && !isConversationSessionActive)
        ) {
          window.activeLiveKitSourceId = sourceId;
        } else {
          window.activeLiveKitSourceId = null;
        }

        const prevSessionActive = isConversationSessionActive;
        if (forceState !== undefined) {
          isConversationSessionActive = forceState;
        } else {
          isConversationSessionActive = !isConversationSessionActive;
        }
        isListening = isConversationSessionActive;

        const video = document.getElementById("lectureVideoPlayer");

        if (isConversationSessionActive) {
          window.isWhiteboardExplicitlyClosed = false;
          if (!prevSessionActive) {
            wasVideoPlayingBeforeSession = video ? !video.paused : false;
          }

          // Immediately pause the video timeline player
          if (video && !video.paused) {
            video.pause();
            const playBtn = document.getElementById("playControlBtn");
            if (playBtn) {
              playBtn.innerHTML =
                '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
            }
          }

          // Start LiveKit WebSocket Audio Session
          startLiveKitVoiceSession(sourceId);
        } else {
          // Stop LiveKit WebSocket Audio Session
          stopLiveKitVoiceSession();

          // Resume video if it was playing before session started
          if (wasVideoPlayingBeforeSession && video && video.paused) {
            video
              .play()
              .catch((e) =>
                console.warn("Auto-play on session end failed:", e),
              );
            const playBtn = document.getElementById("playControlBtn");
            if (playBtn) {
              playBtn.innerHTML =
                '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
            }
          }
          wasVideoPlayingBeforeSession = false;
        }
      }

      function startMicWaveAnimation() {
        const canvas = document.getElementById("micWaveformCanvas");
        const ctx = canvas.getContext("2d");

        function draw() {
          if (!isListening) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = "#c2c1ff";
          ctx.lineWidth = 2;
          ctx.beginPath();

          for (let x = 0; x < canvas.width; x++) {
            const y = canvas.height / 2 + Math.sin(x * 0.05 + micWaveAngle) * 8;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          micWaveAngle += 0.25;
          requestAnimationFrame(draw);
        }
        draw();
      }

      function stopMicWaveAnimation() {
        const canvas = document.getElementById("micWaveformCanvas");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      function speakSocraticHint(text) {
        const activeLocale = window.ACTIVE_DATABASE_LOCALE || "en_US";
        const teacherLocale =
          window.ACTIVE_DATABASE_INSTRUCTOR_LOCALE || "en_US";

        const doSpeak = (textToSpeak) => {
          window.currentTutorSpeechText = textToSpeak || "";

          if (activeLocale !== "en_US") {
            fetch(
              `/api/tts?locale=${encodeURIComponent(activeLocale)}&text=${encodeURIComponent(textToSpeak)}`,
            ).catch((err) =>
              console.warn("Background TTS logger call failed:", err),
            );
          }

          if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(
              cleanTextForSpeech(textToSpeak),
            );
            utterance.lang = activeLocale.replace("_", "-");

            const voices = window.speechSynthesis.getVoices();
            const matchedVoice =
              voices.find((v) =>
                v.lang
                  .toLowerCase()
                  .startsWith(utterance.lang.toLowerCase().split("-")[0]),
              ) ||
              voices.find((v) =>
                v.lang
                  .toLowerCase()
                  .startsWith(utterance.lang.toLowerCase().replace("_", "-")),
              ) ||
              voices[0];
            if (matchedVoice) {
              utterance.voice = matchedVoice;
            }
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            utterance.onend = function () {
              if (isConversationSessionActive) {
                handleAgentSpeechFinished();
              } else if (isVideoPausedBySentry) {
                const video = document.getElementById("lectureVideoPlayer");
                if (video && video.paused) {
                  video
                    .play()
                    .catch((e) =>
                      console.warn("Auto-play on hint end failed:", e),
                    );
                }
                isVideoPausedBySentry = false;
              }
            };
            utterance.onerror = function () {
              if (isConversationSessionActive) {
                handleAgentSpeechFinished();
              } else if (isVideoPausedBySentry) {
                const video = document.getElementById("lectureVideoPlayer");
                if (video && video.paused) {
                  video
                    .play()
                    .catch((e) =>
                      console.warn("Auto-play on hint error failed:", e),
                    );
                }
                isVideoPausedBySentry = false;
              }
            };

            window.speechSynthesis.speak(utterance);
          } else {
            console.warn("Speech Synthesis not supported in this browser.");
          }
        };

        // Pause main lecture video when tutor starts speaking
        const video = document.getElementById("lectureVideoPlayer");
        if (video && !video.paused) {
          video.pause();
          const btn = document.getElementById("playControlBtn");
          if (btn) {
            btn.innerHTML =
              '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
          }
          isVideoPausedBySentry = true;
        }

        if (activeLocale !== "en_US") {
          fetch(
            `/api/translate?text=${encodeURIComponent(text)}&locale=${encodeURIComponent(activeLocale)}`,
          )
            .then((res) => res.json())
            .then((data) => {
              doSpeak(data.translated_text || text);
            })
            .catch((err) => {
              console.warn(
                "Translation for speech synthesis failed, using original:",
                err,
              );
              doSpeak(text);
            });
        } else {
          doSpeak(text);
        }
      }

      function streamChatMessage(sender, text) {
        const box = document.getElementById("chatFeedBox");
        if (!box) return;

        const timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        const messageRow = document.createElement("div");

        if (sender === "YOU") {
          messageRow.className = "chat-msg-user";
          messageRow.innerHTML = `
                    <div class="user-content-col">
                        <div class="user-card-container">
                            <div class="user-header-row">
                                <span class="user-header-label">${getActiveStudentName()}</span>
                                <span class="chat-message-time">${timeStr}</span>
                            </div>
                            <div class="user-body-text" id="streaming-body-active"></div>
                        </div>
                    </div>
                    <div class="user-avatar-col">
                        <div class="user-avatar-badge">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                        </div>
                    </div>
                `;
        } else {
          messageRow.className = "chat-msg-tutor";
          messageRow.innerHTML = `
                    <div class="tutor-avatar-col">
                        <div class="tutor-avatar-badge">
                            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="Teacher Portrait">
                        </div>
                        <div class="tutor-line-accent"></div>
                    </div>
                    <div class="tutor-content-col">
                        <div class="tutor-header-row">
                            <span class="tutor-header-label">${getActiveInstructor()}</span>
                            <span class="chat-message-time">${timeStr}</span>
                        </div>
                        <div class="tutor-body-text" id="streaming-body-active"></div>
                    </div>
                `;
        }

        box.appendChild(messageRow);
        box.scrollTop = box.scrollHeight;

        const bodyContainer = messageRow.querySelector(
          "#streaming-body-active",
        );
        bodyContainer.removeAttribute("id");

        const words = text.split(" ");
        let currentWordIdx = 0;

        function appendWord() {
          if (currentWordIdx < words.length) {
            bodyContainer.innerText +=
              (currentWordIdx === 0 ? "" : " ") + words[currentWordIdx];
            box.scrollTop = box.scrollHeight;
            currentWordIdx++;
            setTimeout(appendWord, 80);
          } else {
            bodyContainer.innerHTML = renderMathSymbolsInHtml(
              bodyContainer.innerText,
            );
            box.scrollTop = box.scrollHeight;
          }
        }
        appendWord();
      }

      // Search active concept
      function searchConcept(conceptName) {
        showToastNotification(
          "Concept Search",
          `RAG searching: '${conceptName}'`,
        );
        triggerRAGQuery(`Explain details about ${conceptName}`);
      }

      if (localStorage.getItem("schema_version") !== "v9") {
        localStorage.clear();
        localStorage.setItem("schema_version", "v9");
      }

      let activeVideoId = window.ACTIVE_DATABASE_VIDEO_ID || "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques";
      let activeVideoTranscripts = [];
      let activeChapterId = "physics_pendulums";
      let activeTimestamp = "01:15";
      let activeTimestampItem = null;
      let emittedTranscripts = new Set();

      // Quiz State Variables
      let isQuizActive = false;
      let isAlternativeQuizActive = false;
      let selectedAnswers = {};
      let quizTimeElapsed = 0;
      let quizTimerInterval = null;
      let sentryCanvasInterval = null;
      let deskVideoElement = null;
      let deskCamStream = null;
      window.timelineLocked = false;
      let maxTimeWatched = 0;

      // Quiz Questions Dataset
            const QUIZ_QUESTIONS = {
        Sanitaire: {
          main: [
            {
              id: 1,
              question: "Quelles sont les principales maladies de masse qui pèsent sur la santé publique dans les pays du sud ?",
              options: {
                A: "Le paludisme, le choléra, la fièvre jaune et le VIH/SIDA.",
                B: "Les maladies cardiovasculaires avancées uniquement.",
                C: "La grippe aviaire et la myopie infantile.",
                D: "L'asthme allergique et les migraines chroniques."
              },
              correct: "A"
            },
            {
              id: 2,
              question: "Quel est l'impact majeur du manque d'infrastructures sanitaires sur le développement économique ?",
              options: {
                A: "La baisse de la productivité du travail et l'alourdissement des dépenses de santé pour les ménages.",
                B: "L'augmentation spontanée du pouvoir d'achat des agriculteurs.",
                C: "L'arrêt complet de la croissance démographique rurale.",
                D: "La réduction du taux de chômage des jeunes diplômés."
              },
              correct: "A"
            },
            {
              id: 3,
              question: "Quelle mesure est indispensable pour améliorer la situation sanitaire dans les zones rurales en développement ?",
              options: {
                A: "L'accès à l'eau potable, la vaccination et le recrutement de personnel médical qualifié.",
                B: "La suppression complète de l'aide internationale.",
                C: "L'interdiction de toute construction de centres de santé régionaux.",
                D: "La privatisation exclusive des hôpitaux publics."
              },
              correct: "A"
            }
          ],
          alternative: [
            {
              id: 1,
              question: "Quel facteur favorise la propagation des maladies endémiques dans les zones défavorisées ?",
              options: {
                A: "Le manque d'eau potable et l'insuffisance de l'assainissement.",
                B: "L'excès de personnel médical qualifié.",
                C: "La surabondance de médicaments gratuits.",
                D: "La modernisation rapide des hôpitaux."
              },
              correct: "A"
            }
          ]
        },
        Demographics: {
          main: [
            {
              id: 1,
              question: "Selon la leçon, qu'est-ce que l'explosion démographique dans les pays en développement ?",
              options: {
                A: "Une augmentation rapide de la population due à un fort taux de natalité et une baisse de la mortalité.",
                B: "Un déclin progressif et continu de la population active.",
                C: "Une hausse soudaine et inexpliquée du taux de mortalité infantile.",
                D: "Une migration massive des populations urbaines vers les zones rurales."
              },
              correct: "A"
            },
            {
              id: 2,
              question: "Parmi les facteurs suivants, lequel contribue directement à la hausse de la natalité dans ces pays ?",
              options: {
                A: "Le mariage précoce, l'analphabétisme et le poids des traditions.",
                B: "L'accès universel aux méthodes de contraception moderne.",
                C: "L'industrialisation poussée et l'élévation du niveau de vie.",
                D: "La disparition de la polygamie dans les zones rurales."
              },
              correct: "A"
            },
            {
              id: 3,
              question: "Quel médecin est cité par le professeur pour avoir introduit la méthode de la césarienne afin de limiter la mortalité maternelle ?",
              options: {
                A: "Docteur César",
                B: "Docteur Malthus",
                C: "Docteur Pasteur",
                D: "Docteur Fleming"
              },
              correct: "A"
            },
            {
              id: 4,
              question: "Selon l'analyse démographique présentée dans le cours, quel est le lien entre pauvreté et fécondité ?",
              options: {
                A: "La pauvreté peut encourager l'augmentation des naissances.",
                B: "La pauvreté annule automatiquement toute naissance.",
                C: "Le niveau de vie n'a aucun impact sur la fécondité.",
                D: "La richesse matérielle entraîne une fécondité illimitée."
              },
              correct: "A"
            },
            {
              id: 5,
              question: "Quelle maladie de masse est citée par le professeur comme ayant été freinée grâce aux progrès de la biologie et de la médecine ?",
              options: {
                A: "La tuberculose",
                B: "Le choléra",
                C: "La grippe espagnole",
                D: "Le tétanos"
              },
              correct: "A"
            }
          ],
          alternative: [
            {
              id: 1,
              question: "Quel est l'un des principaux facteurs médicaux de la baisse de la mortalité maternelle après la Seconde Guerre mondiale ?",
              options: {
                A: "La généralisation des césariennes par le Docteur César",
                B: "L'invention du vaccin contre la grippe",
                C: "La hausse des mariages tardifs",
                D: "La réduction de l'agriculture de subsistance"
              },
              correct: "A"
            }
          ]
        },
        Chemistry: {
          main: [
            {
              id: 1,
              question: "Quelle est la formule générale d'un cation d'alkylammonium en chimie organique ?",
              options: {
                A: "R-NH3+",
                B: "R-COOH",
                C: "R-OH",
                D: "R-NH2"
              },
              correct: "A"
            },
            {
              id: 2,
              question: "Comment réagit une amine primaire en milieu acide aqueux pour former son cation d'alkylammonium ?",
              options: {
                A: "L'amine capte un proton H+ cédé par l'eau pour former l'ion alkylammonium R-NH3+.",
                B: "L'amine perd un électron par oxydation directe.",
                C: "L'amine se transforme spontanément en ester.",
                D: "L'amine précipite sous forme d'un produit neutre."
              },
              correct: "A"
            },
            {
              id: 3,
              question: "Dans l'équilibre R-NH3+ + H2O <-> R-NH2 + H3O+, quelle est la relation entre les concentrations des produits ?",
              options: {
                A: "[R-NH2] est rigoureusement égale à [H3O+].",
                B: "[R-NH2] est le double de [H3O+].",
                C: "[H3O+] est toujours nulle à l'équilibre.",
                D: "Les concentrations varient sans aucun rapport."
              },
              correct: "A"
            }
          ],
          alternative: [
            {
              id: 1,
              question: "Quelle est l'expression de la constante d'acidité Ka associée au couple alkylammonium / amine ?",
              options: {
                A: "Ka = ([R-NH2] * [H3O+]) / [R-NH3+]",
                B: "Ka = [R-NH3+] / ([R-NH2] * [H3O+])",
                C: "Ka = [R-NH2] + [H3O+]",
                D: "Ka = [R-NH3+] * [H2O]"
              },
              correct: "A"
            }
          ]
        },
        Economics: {
          main: [
            {
              id: 1,
              question: "Parmi ces institutions internationales, laquelle ne fait pas partie des trois citées par le professeur pour la lutte contre la faim ?",
              options: {
                A: "F.A.O (Food and Agriculture Organization)",
                B: "F.I.D.A (Fonds International de Développement Agricole)",
                C: "O.M.S (Organisation Mondiale de la Santé)",
                D: "P.A.M (Programme Alimentaire Mondial)"
              },
              correct: "C"
            }
          ],
          alternative: [
            {
              id: 1,
              question: "Quelle institution internationale gère le Programme Alimentaire Mondial ?",
              options: {
                A: "F.A.O",
                B: "P.A.M",
                C: "F.I.D.A",
                D: "U.N.E.S.C.O"
              },
              correct: "B"
            }
          ]
        }
      };

function getQuizTrackKey() {
        const vid = (activeVideoId || "").toLowerCase();
        const track = (selectedGoalTrack || "").toLowerCase();

        if (vid.includes("chem") || vid.includes("chemistry") || track.includes("chemistry")) {
          return "Chemistry";
        }
        if (vid.includes("sanitaire") || track.includes("sanitaire")) {
          return "Sanitaire";
        }
        if (vid.includes("alimentaire") || track.includes("alimentaire")) {
          return "Economics";
        }
        if (vid.includes("demographique") || vid.includes("economics") || track.includes("economics")) {
          return "Demographics";
        }
        return "Demographics";
      }

      function getActiveQuizQuestion() {
        const trackKey = getQuizTrackKey();
        const questionsSet = isAlternativeQuizActive
          ? QUIZ_QUESTIONS[trackKey].alternative
          : QUIZ_QUESTIONS[trackKey].main;
        let activeQ = null;
        for (let i = 0; i < questionsSet.length; i++) {
          if (!selectedAnswers[questionsSet[i].id]) {
            activeQ = questionsSet[i];
            break;
          }
        }
        if (!activeQ && questionsSet.length > 0) {
          activeQ = questionsSet[0];
        }
        return activeQ;
      }
      function updateMoreQuestionsButton() {
        const btnContainer = document.getElementById("moreQuestionsContainer");
        const btn = document.getElementById("moreQuestionsBtn");
        if (btnContainer && btn) {
          const isMastered = !!window.activeChapterMastered;
          const count = window.totalPassedMcqsCount || 0;
          const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
          const locStrings =
            UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
          const getLocString = (key, fallback) =>
            locStrings[key] !== undefined ? locStrings[key] : fallback;

          btn.innerText = getLocString(
            "label_more_practice_btn",
            "More Practice Questions ({passed}/30 Passed)",
          ).replace("{passed}", count);

          if (isMastered) {
            btnContainer.style.display = "block";
            btn.disabled = false;
            btn.style.background = "#a855f7";
            btn.style.color = "#ffffff";
            btn.style.cursor = "pointer";
            btn.style.opacity = "1";
            btn.style.boxShadow = "0 0 12px rgba(168, 85, 247, 0.4)";
          } else {
            btnContainer.style.display = "none";
            btn.disabled = true;
          }
        }
      }

      function togglePracticeQuizMode() {
        if (!window.activeChapterMastered) {
          showToastNotification(
            "Mastery Required",
            "You must pass the 85% Evaluation for this video first to unlock extra practice questions.",
          );
          return;
        }
        window.isPracticeQuizActive = !window.isPracticeQuizActive;
        if (window.isPracticeQuizActive) {
          showToastNotification(
            "Practice Mode Active",
            "Loading extra practice MCQs.",
          );
        } else {
          showToastNotification(
            "Evaluation Mode",
            "Loading required evaluation MCQs.",
          );
        }
        selectedAnswers = {};
        renderQuizQuestions();
        toggleQuizView(true);
      }

      function toggleQuizView(show) {
        const quizPane = document.getElementById("quizSplitPane");
        const whiteboardPane = document.getElementById("whiteboardSplitPane");

        if (show) {
          if (whiteboardPane) whiteboardPane.classList.remove("active");
          toggleRAGSimulation(false);
          if (quizPane) {
            quizPane.classList.add("active");
            isQuizActive = true;
            selectedAnswers = {};
            quizTimeElapsed = 0;
            startQuizTimers();
            startSentryDeskCamera();
            renderQuizQuestions();

            const closeBtn = document.getElementById("closeQuizBtn");
            if (closeBtn) {
              closeBtn.style.display = "block";
            }
          }
        } else {
          // Allow closing the evaluation at any time so the student can study the course content/video again to pass
          const closeBtn = document.getElementById("closeQuizBtn");
          if (closeBtn) {
            closeBtn.style.display = "block";
          }
          if (quizPane) {
            quizPane.classList.remove("active");
            isQuizActive = false;
            pauseQuizTimers();
            stopSentryDeskCamera();
            window.isPracticeQuizActive = false; // Reset practice mode when closed
          }
        }
      }

      function startQuizTimers() {
        if (quizTimerInterval) clearInterval(quizTimerInterval);
        quizTimerInterval = setInterval(() => {
          quizTimeElapsed++;
          const min = Math.floor(quizTimeElapsed / 60);
          const sec = quizTimeElapsed % 60;
          const timerText = document.getElementById("quizTimerText");
          if (timerText) {
            timerText.innerText = `Time: ${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
          }
        }, 1000);
      }

      function pauseQuizTimers() {
        if (quizTimerInterval) {
          clearInterval(quizTimerInterval);
          quizTimerInterval = null;
        }
      }

      function resumeQuizTimerFromHint() {
        startQuizTimers();
        const hintBox = document.getElementById("quizHintBox");
        if (hintBox) hintBox.style.display = "none";
      }

      async function startSentryDeskCamera() {
        const canvas = document.getElementById("sentryDeskCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        canvas.width = canvas.offsetWidth || 300;
        canvas.height = canvas.offsetHeight || 200;

        let scanY = 0;
        let scanDir = 1;

        if (sentryCanvasInterval) clearInterval(sentryCanvasInterval);

        const selectEl = document.getElementById("docCamSelect");
        const selectedVal = selectEl ? selectEl.value : "";

        if (deskCamStream) {
          try {
            deskCamStream.getTracks().forEach((track) => track.stop());
          } catch (e) {}
          deskCamStream = null;
        }

        if (selectedVal && selectedVal.startsWith("device:")) {
          const deviceId = selectedVal.split("device:")[1];
          if (!deskVideoElement) {
            deskVideoElement = document.createElement("video");
            deskVideoElement.autoplay = true;
            deskVideoElement.playsInline = true;
            deskVideoElement.muted = true;
          }

          try {
            console.log(
              "[CAM] Starting desk camera stream with deviceId:",
              deviceId,
            );
            deskCamStream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: deviceId } },
            });
            deskVideoElement.srcObject = deskCamStream;
            await new Promise((resolve) => {
              deskVideoElement.onloadedmetadata = () => {
                deskVideoElement.play().then(resolve).catch(resolve);
              };
            });
          } catch (err) {
            console.warn("[CAM] Failed to open real desk camera stream:", err);
          }
        }

        sentryCanvasInterval = setInterval(() => {
          if (!canvas || canvas.offsetParent === null) return;

          const w = canvas.width;
          const h = canvas.height;

          if (
            deskVideoElement &&
            deskVideoElement.readyState >= 2 &&
            selectedVal.startsWith("device:")
          ) {
            ctx.drawImage(deskVideoElement, 0, 0, w, h);
          } else {
            ctx.fillStyle = "#050508";
            ctx.fillRect(0, 0, w, h);
          }

          ctx.strokeStyle = "rgba(255, 59, 48, 0.08)";
          ctx.lineWidth = 1;
          const gridSize = 20;
          for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }
          for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }

          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          ctx.fillStyle = "rgba(12, 12, 16, 0.25)";
          const padW = w * 0.7;
          const padH = h * 0.7;
          const padX = (w - padW) / 2;
          const padY = (h - padH) / 2;
          ctx.fillRect(padX, padY, padW, padH);
          ctx.strokeRect(padX, padY, padW, padH);

          ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";

          ctx.beginPath();
          ctx.moveTo(padX + 20, padY + 30);
          ctx.quadraticCurveTo(padX + 25, padY + 25, padX + 35, padY + 30);
          ctx.moveTo(padX + 40, padY + 32);
          ctx.lineTo(padX + 50, padY + 32);
          ctx.moveTo(padX + 40, padY + 36);
          ctx.lineTo(padX + 50, padY + 36);
          ctx.moveTo(padX + 58, padY + 28);
          ctx.quadraticCurveTo(padX + 63, padY + 25, padX + 63, padY + 32);
          ctx.lineTo(padX + 58, padY + 38);
          ctx.lineTo(padX + 66, padY + 38);
          ctx.moveTo(padX + 72, padY + 28);
          ctx.lineTo(padX + 85, padY + 28);
          ctx.moveTo(padX + 75, padY + 28);
          ctx.lineTo(padX + 74, padY + 38);
          ctx.moveTo(padX + 82, padY + 28);
          ctx.lineTo(padX + 83, padY + 38);
          ctx.moveTo(padX + 92, padY + 35);
          ctx.lineTo(padX + 96, padY + 39);
          ctx.lineTo(padX + 100, padY + 24);
          ctx.lineTo(padX + 130, padY + 24);
          ctx.moveTo(padX + 105, padY + 28);
          ctx.lineTo(padX + 105, padY + 34);
          ctx.lineTo(padX + 112, padY + 34);
          ctx.moveTo(padX + 103, padY + 35);
          ctx.lineTo(padX + 120, padY + 35);
          ctx.moveTo(padX + 108, padY + 38);
          ctx.quadraticCurveTo(padX + 115, padY + 38, padX + 113, padY + 44);
          ctx.stroke();

          ctx.strokeStyle = "#ff3b30";
          ctx.lineWidth = 2;
          const cLen = 15;
          ctx.beginPath();
          ctx.moveTo(padX - 5, padY - 5 + cLen);
          ctx.lineTo(padX - 5, padY - 5);
          ctx.lineTo(padX - 5 + cLen, padY - 5);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(padX + padW + 5, padY - 5 + cLen);
          ctx.lineTo(padX + padW + 5, padY - 5);
          ctx.lineTo(padX + padW + 5 - cLen, padY - 5);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(padX - 5, padY + padH + 5 - cLen);
          ctx.lineTo(padX - 5, padY + padH + 5);
          ctx.lineTo(padX - 5 + cLen, padY + padH + 5);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(padX + padW + 5, padY + padH + 5 - cLen);
          ctx.lineTo(padX + padW + 5, padY + padH + 5);
          ctx.lineTo(padX + padW + 5 - cLen, padY + padH + 5);
          ctx.stroke();

          ctx.strokeStyle = "rgba(255, 59, 48, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, scanY);
          ctx.lineTo(w, scanY);
          ctx.stroke();

          const scanGrad = ctx.createLinearGradient(
            0,
            scanY - 20 * scanDir,
            0,
            scanY,
          );
          scanGrad.addColorStop(0, "rgba(255, 59, 48, 0)");
          scanGrad.addColorStop(1, "rgba(255, 59, 48, 0.06)");
          ctx.fillStyle = scanGrad;
          if (scanDir === 1) {
            ctx.fillRect(0, scanY - 20, w, 20);
          } else {
            ctx.fillRect(0, scanY, w, 20);
          }

          scanY += scanDir * 1.5;
          if (scanY >= h || scanY <= 0) {
            scanDir *= -1;
          }

          ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
          for (let i = 0; i < 50; i++) {
            const nx = Math.random() * w;
            const ny = Math.random() * h;
            ctx.fillRect(nx, ny, 1, 1);
          }
        }, 1000 / 30);
      }

      function stopSentryDeskCamera() {
        if (sentryCanvasInterval) {
          clearInterval(sentryCanvasInterval);
          sentryCanvasInterval = null;
        }
        if (deskCamStream) {
          try {
            deskCamStream.getTracks().forEach((track) => track.stop());
          } catch (e) {}
          deskCamStream = null;
        }
      }

      function renderQuizQuestions() {
        const container = document.getElementById("quizQuestionsContainer");
        if (!container) return;
        container.innerHTML = "";

        const trackKey = getQuizTrackKey() || "k12/12th_SM/Economics";
        const trackQuizData = QUIZ_QUESTIONS[trackKey] || QUIZ_QUESTIONS["k12/12th_SM/Economics"] || { main: [], alternative: [] };
        let questionsSet = isAlternativeQuizActive
          ? (trackQuizData.alternative || trackQuizData.main || [])
          : (trackQuizData.main || trackQuizData.alternative || []);
        if (!questionsSet) questionsSet = [];

        // Slice questions depending on practice mode
        if (window.isPracticeQuizActive) {
          questionsSet = questionsSet.slice(3); // indices 3, 4
        } else {
          questionsSet = questionsSet.slice(0, 3); // indices 0, 1, 2
        }

        const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
        const locStrings =
          UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
        const getLocString = (key, fallback) =>
          locStrings[key] !== undefined ? locStrings[key] : fallback;

        // Update Panel A header title
        const panelATitle = document.querySelector("#quizPanelA span");
        if (panelATitle) {
          panelATitle.innerText = window.isPracticeQuizActive
            ? getLocString(
                "label_practice_evaluation_panel_a",
                "Practice Evaluation - Panel A",
              )
            : getLocString(
                "label_mastery_evaluation_panel_a",
                "Mastery Evaluation - Panel A",
              );
        }

        // Update submit button text
        const submitBtn = document.getElementById("submitQuizBtn");
        if (submitBtn) {
          submitBtn.innerText = window.isPracticeQuizActive
            ? getLocString(
                "label_submit_practice_answers",
                "[SUBMIT PRACTICE ANSWERS]",
              )
            : getLocString(
                "label_submit_quiz",
                "[SUBMIT ANSWER FOR EVALUATION]",
              );
        }

        if (questionsSet.length === 0) {
          container.innerHTML = `<div style="font-size:0.75rem; color:var(--outline); text-align:center; padding:20px;">${getLocString("label_no_practice_questions", "No additional practice questions available for this lesson.")}</div>`;
          return;
        }

        questionsSet.forEach((q, idx) => {
          const card = document.createElement("div");
          card.className = "quiz-question-card";
          card.style.marginBottom = "16px";
          card.style.padding = "14px";
          card.style.background = "rgba(255,255,255,0.01)";
          card.style.border = "1px solid rgba(255,255,255,0.04)";
          card.style.borderRadius = "6px";

          const title = document.createElement("div");
          title.style.fontWeight = "600";
          title.style.fontSize = "0.78rem";
          title.style.color = "#ffffff";
          title.style.marginBottom = "10px";

          const questionNumber = window.isPracticeQuizActive
            ? idx + 4
            : idx + 1;
          const qText = q.question;
          title.innerText = `${questionNumber}. ${qText}`;
          card.appendChild(title);

          if (activeLoc !== "en_US") {
            fetch(
              `/api/translate?text=${encodeURIComponent(qText)}&locale=${encodeURIComponent(activeLoc)}`,
            )
              .then((r) => r.json())
              .then((data) => {
                const cleanQ = (data.translated_text || qText).replace(
                  /^(?:\[[^\]]+\]\s*)+/,
                  "",
                );
                title.innerText = `${questionNumber}. ${cleanQ}`;
              });
          }

          const optionsGrid = document.createElement("div");
          optionsGrid.style.display = "grid";
          optionsGrid.style.gridTemplateColumns = "1fr 1fr";
          optionsGrid.style.gap = "8px";

          for (const [letter, text] of Object.entries(q.options)) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "choice-bubble-btn";
            if (selectedAnswers[q.id] === letter) {
              btn.classList.add("selected");
            }
            btn.onclick = () => selectQuizAnswer(q.id, letter);

            btn.innerHTML = `
                        <span class="bubble-letter">${letter}</span>
                        <span class="bubble-text" style="font-family:'Geist',sans-serif;">${text}</span>
                    `;

            if (activeLoc !== "en_US") {
              fetch(
                `/api/translate?text=${encodeURIComponent(text)}&locale=${encodeURIComponent(activeLoc)}`,
              )
                .then((r) => r.json())
                .then((data) => {
                  const cleanOpt = (data.translated_text || text).replace(
                    /^(?:\[[^\]]+\]\s*)+/,
                    "",
                  );
                  const bubbleText = btn.querySelector(".bubble-text");
                  if (bubbleText) bubbleText.innerText = cleanOpt;
                })
                .catch((err) => {
                  console.warn("[QUIZ TRANSLATE WARN] Translation fetch fallback:", err);
                });
            }

            optionsGrid.appendChild(btn);
          }

          card.appendChild(optionsGrid);
          container.appendChild(card);
        });
      }

      function selectQuizAnswer(questionId, letter) {
        selectedAnswers[questionId] = letter;
        renderQuizQuestions();
      }

      function submitQuizAnswers() {
        const trackKey = getQuizTrackKey() || "k12/12th_SM/Economics";
        const trackQuizData = QUIZ_QUESTIONS[trackKey] || QUIZ_QUESTIONS["k12/12th_SM/Economics"] || { main: [], alternative: [] };
        let questionsSet = isAlternativeQuizActive
          ? (trackQuizData.alternative || trackQuizData.main || [])
          : (trackQuizData.main || trackQuizData.alternative || []);
        if (!questionsSet) questionsSet = [];

        // Slice questions depending on practice mode
        if (window.isPracticeQuizActive) {
          questionsSet = questionsSet.slice(3); // indices 3, 4
        } else {
          questionsSet = questionsSet.slice(0, 3); // indices 0, 1, 2
        }

        let answeredCount = 0;
        questionsSet.forEach((q) => {
          if (selectedAnswers[q.id]) answeredCount++;
        });

        if (answeredCount < questionsSet.length) {
          if (!confirm("You haven't answered all questions. Submit anyway?")) {
            return;
          }
        }

        const strictToggle = document.getElementById("strictSentryToggle");
        const isStrictEnforced = strictToggle ? strictToggle.checked : false;

        let sentryFrame = null;
        if (isStrictEnforced) {
          const sentryCanvas = document.getElementById("sentryDeskCanvas");
          if (sentryCanvas) {
            try {
              sentryFrame = sentryCanvas.toDataURL("image/png");
            } catch (e) {}
          }
        }

        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.send(
            JSON.stringify({
              action: "SUBMIT_QUIZ",
              track: trackKey,
              is_alternative: isAlternativeQuizActive,
              answers: selectedAnswers,
              video_id: activeVideoId,
              chapter_id: activeChapterId,
              is_practice: window.isPracticeQuizActive,
              enforce_sentry: isStrictEnforced,
              sentry_frame: sentryFrame,
            }),
          );
        }
      }

      function redoCurrentQuiz() {
        selectedAnswers = {};
        isAlternativeQuizActive = false;
        window.isPracticeQuizActive = false;
        renderQuizQuestions();
        if (typeof toggleQuizView === "function") {
          toggleQuizView(true);
        }
        showToastNotification("Évaluation réinitialisée", "Vous pouvez maintenant refaire l'évaluation !");
      }

      async function advanceToNextCurriculumVideo() {
        const curVid = activeVideoId || window.ACTIVE_DATABASE_VIDEO_ID;
        try {
          const resp = await fetch(`/get_next_lesson?video_id=${curVid}`);
          const nextData = await resp.json();
          if (nextData && nextData.video_id) {
            loadTextbookPDF(nextData.video_id);
            showToastNotification(
              nextData.same_subject ? "Next Lesson in Subject" : "Next Module Track",
              `Now playing: '${nextData.title || nextData.video_id}'`
            );
            const sommaireBtn = document.querySelector('[onclick*="timestamps"]') || document.getElementById("timestampsTabBtn");
            if (sommaireBtn) {
              switchSidebarTab("timestamps", sommaireBtn);
            }
            return;
          }
        } catch (e) {
          console.warn("[NEXT LESSON FETCH WARNING]", e);
        }

        // Static fallback for Economics track
        const econSequence = [
          "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
          "vid_economics_extraeconomiques_02_les_probl_mes_sanitaires",
          "vid_economics_extraeconomiques_03_probl_mes_alimentaires"
        ];
        const curIndex = econSequence.indexOf(curVid);
        if (curIndex !== -1 && curIndex < econSequence.length - 1) {
          loadTextbookPDF(econSequence[curIndex + 1]);
          showToastNotification("Next Economics Lesson", "Loaded next video in Economics!");
          const sommaireBtn = document.querySelector('[onclick*="timestamps"]') || document.getElementById("timestampsTabBtn");
          if (sommaireBtn) switchSidebarTab("timestamps", sommaireBtn);
        } else {
          showToastNotification("Subject Completed", "Congratulations! You have completed all lessons in this subject.");
        }
      }

      function openTeacherQuizKeyInspector() {
        const trackKey = getQuizTrackKey();
        const questions = QUIZ_QUESTIONS[trackKey] ? QUIZ_QUESTIONS[trackKey].main : [];
        let html = `<div style="padding: 20px; background: #0c0c0e; color: white; border-radius: 12px; max-width: 600px; margin: 40px auto; border: 1px solid #a855f7;">
          <h3 style="color: #a855f7; margin-top: 0;">🔑 Teacher Answer Key: ${trackKey}</h3>
          <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 14px; max-height: 400px; overflow-y: auto;">`;

        questions.forEach((q, idx) => {
          html += `<div style="background: #141418; padding: 12px; border-radius: 8px; border: 1px solid #27272a;">
            <div style="font-weight: 700; margin-bottom: 6px; font-size: 0.85rem;">Q${q.id}: ${q.question}</div>
            <div style="font-size: 0.8rem; color: #a1a1aa; margin-bottom: 6px;">`;
          for (let opt in q.options) {
            const isAns = opt === q.correct;
            html += `<span style="display: block; ${isAns ? 'color: #10b981; font-weight: 700;' : ''}">${opt}: ${q.options[opt]} ${isAns ? '✔ (CORRECT)' : ''}</span>`;
          }
          html += `</div></div>`;
        });

        html += `</div>
          <button onclick="document.getElementById('teacherKeyModal').remove()" style="margin-top: 16px; background: #a855f7; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer;">Close Inspector</button>
        </div>`;

        let modal = document.getElementById('teacherKeyModal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'teacherKeyModal';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 99999; display: flex; align-items: center; justifyContent: center;';
        modal.innerHTML = html;
        document.body.appendChild(modal);
      }

            function triggerRocketCelebration(score) {
        let existing = document.getElementById("rocketCelebrationOverlay");
        if (existing) existing.remove();

        const overlay = document.createElement("div");
        overlay.id = "rocketCelebrationOverlay";
        overlay.style.cssText = `
          position: fixed;
          inset: 0;
          z-index: 999999;
          background: rgba(10, 10, 16, 0.88);
          backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          animation: fadeInOverlay 0.5s ease forwards;
        `;

        overlay.innerHTML = `
          <style>
            @keyframes fadeInOverlay {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes launchRocket {
              0% { transform: translateY(120vh) scale(0.6) rotate(0deg); opacity: 0; }
              25% { opacity: 1; }
              65% { transform: translateY(-20vh) scale(1.3) rotate(0deg); opacity: 1; }
              100% { transform: translateY(-140vh) scale(1.6) rotate(0deg); opacity: 0; }
            }
            @keyframes rocketThrust {
              0%, 100% { filter: drop-shadow(0 0 15px rgba(245, 158, 11, 0.8)) drop-shadow(0 0 40px rgba(239, 68, 68, 0.9)); }
              50% { filter: drop-shadow(0 0 25px rgba(251, 191, 36, 1)) drop-shadow(0 0 60px rgba(249, 115, 22, 1)); }
            }
            @keyframes popBanner {
              0% { transform: scale(0.7); opacity: 0; }
              70% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes floatGlow {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
            }
            .rocket-anim-icon {
              position: absolute;
              bottom: 0;
              font-size: 7rem;
              z-index: 2;
              animation: launchRocket 3.2s cubic-bezier(0.25, 1, 0.5, 1) forwards, rocketThrust 0.2s infinite;
            }
            .celebration-card-content {
              position: relative;
              z-index: 10;
              background: linear-gradient(145deg, #181824, #0f0f17);
              border: 2px solid rgba(168, 85, 247, 0.5);
              box-shadow: 0 0 50px rgba(168, 85, 247, 0.3), 0 0 100px rgba(16, 185, 129, 0.2);
              border-radius: 24px;
              padding: 36px 44px;
              text-align: center;
              max-width: 520px;
              width: 90%;
              animation: popBanner 0.7s 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both, floatGlow 3s ease-in-out infinite;
            }
          </style>

          <div class="rocket-anim-icon">🚀</div>

          <div class="celebration-card-content">
            <div style="font-size: 3rem; margin-bottom: 8px;">🏆</div>
            <h2 style="color: #10b981; font-size: 1.8rem; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.02em; text-transform: uppercase;">
              Level Mastered!
            </h2>
            <div style="color: #a855f7; font-size: 1.25rem; font-weight: 700; margin-bottom: 14px;">
              Score: ${score.toFixed(1)}% — Outstanding Work!
            </div>
            <p style="color: #d4d4d8; font-size: 0.92rem; line-height: 1.5; margin-bottom: 24px;">
              You've demonstrated true Socratic mastery over this lesson! You are ready to launch into the next stage of your curriculum.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
              <button onclick="advanceToNextCurriculumVideo(); document.getElementById('rocketCelebrationOverlay').remove();" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px 28px; border-radius: 12px; font-weight: 800; cursor: pointer; font-size: 0.95rem; box-shadow: 0 4px 18px rgba(16,185,129,0.4); transition: transform 0.2s ease;">
                ▶️ Continue to Next Video
              </button>
              <button onclick="document.getElementById('rocketCelebrationOverlay').remove();" style="background: rgba(255,255,255,0.08); color: #a1a1aa; border: 1px solid rgba(255,255,255,0.15); padding: 12px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 0.9rem;">
                Close
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);
      }

      function handleQuizResult(payload) {
        const score = payload.score;
        const mastery =
          payload.mastery_achieved !== undefined
            ? payload.mastery_achieved
            : payload.passed;
        const closeBtn = document.getElementById("closeQuizBtn");

        if (payload.enforce_sentry && !payload.sentry_verified) {
          showToastNotification(
            "Sentry Work Verification Failed",
            "Handwritten paper work missing under desk camera. Show your derivation under Panel B camera to earn credit.",
          );
          return;
        }

        if (payload.enforce_sentry && payload.sentry_verified) {
          showToastNotification(
            "Sentry Work Verified",
            "Handwritten derivation verified via Panel B camera & archived to Handwriting Notes Ledger.",
          );
        }

        if (payload.is_practice) {
          showToastNotification(
            "Practice Completed",
            `Practice Score: ${score.toFixed(1)}%. This does not affect your course status.`,
          );
          if (closeBtn) closeBtn.style.display = "block";
          return;
        }

        if (mastery) {
          window.timelineLocked = false;
          if (closeBtn) closeBtn.style.display = "block";
          showToastNotification(
            "Mastery Achieved! (85%+)",
            `Score: ${score.toFixed(1)}%. Lesson completed successfully. Next level unlocked!`,
          );

          // Trigger Rocket Launch Animation Overlay!
          triggerRocketCelebration(score);

          const container = document.getElementById("quizQuestionsListContainer");
          if (container) {
            container.innerHTML = `
              <div style="margin-top: 20px; padding: 24px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 16px; text-align: center;">
                <div style="font-size: 2.2rem; margin-bottom: 8px;">🎉</div>
                <div style="font-weight: 800; color: #10b981; margin-bottom: 8px; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.05em;">
                  Mastery Achieved (${score.toFixed(1)}%)
                </div>
                <div style="color: #d4d4d8; font-size: 0.85rem; margin-bottom: 18px; line-height: 1.5;">
                  Great job! You passed with at least 85% and mastered this lesson. Click below to continue to the next video!
                </div>
                <button onclick="advanceToNextCurriculumVideo()" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 10px 24px; border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 0.9rem; box-shadow: 0 4px 14px rgba(16,185,129,0.3); transition: all 0.2s ease;">
                  ▶️ Continue to Next Video
                </button>
              </div>
            `;
          }
          loadProfileProgress();
        } else {
          window.timelineLocked = true;
          if (closeBtn) closeBtn.style.display = "block";
          showToastNotification(
            "85% Mastery Required",
            `Score: ${score.toFixed(1)}%. You need at least 85% to pass. Click 'Redo Quiz' to try again!`,
          );

          const container = document.getElementById("quizQuestionsContainer") || document.getElementById("quizQuestionsListContainer");
          if (container) {
            const existingRetry = document.getElementById("quizRetryNotice");
            if (existingRetry) existingRetry.remove();

            const retryDiv = document.createElement("div");
            retryDiv.id = "quizRetryNotice";
            retryDiv.style.cssText = "margin-top: 20px; padding: 20px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 14px; text-align: center;";
            retryDiv.innerHTML = `
              <div style="font-weight: 800; color: #f87171; margin-bottom: 8px; font-size: 1rem;">
                Score: ${score.toFixed(1)}% (Required: 85.0%)
              </div>
              <div style="color: #d4d4d8; font-size: 0.82rem; margin-bottom: 16px; line-height: 1.4;">
                Work hard to master the material! Re-read the <b>SOMMAIRE</b> tab or click below to redo the quiz until you reach 85%.
              </div>
              <button onclick="redoCurrentQuiz()" style="background: linear-gradient(135deg, #a855f7, #7e22ce); color: white; border: none; padding: 10px 22px; border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 0.85rem; box-shadow: 0 4px 14px rgba(168,85,247,0.3);">
                🔁 Redo Quiz (Try Again)
              </button>
            `;
            container.appendChild(retryDiv);
          }
          loadProfileProgress();
        }
      }

      // Trigger query over WebSocket
      function triggerRAGQuery(questionText, mode = "voice") {
        currentQueryMode = mode;
        appendChatMessage("YOU", questionText);

        let isQuizVal = false;
        let quizQuestionText = "";
        if (isQuizActive) {
          isQuizVal = true;
          pauseQuizTimers();
          const activeQ = getActiveQuizQuestion();
          if (activeQ) {
            quizQuestionText = activeQ.question;
          }
          const hintBox = document.getElementById("quizHintBox");
          const hintText = document.getElementById("quizHintText");
          if (hintBox && hintText) {
            hintBox.style.display = "block";
            const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
            const locStrings =
              UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
            const getLocString = (key, fallback) =>
              locStrings[key] !== undefined ? locStrings[key] : fallback;
            hintText.innerText = getLocString(
              "analyzing_workspace",
              "Analyzing workspace and thinking Socratic advice...",
            );
          }
        }

        const video = document.getElementById("lectureVideoPlayer");
        let currentMarker = activeTimestamp;
        if (video && !isNaN(video.duration) && video.duration > 0) {
          currentMarker = formatTime(video.currentTime);
        }

        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.send(
            JSON.stringify({
              action: "RAISE_HAND",
              question: questionText,
              video_id: activeVideoId,
              chapter_id: activeChapterId,
              timestamp: currentMarker,
              mode: mode,
              is_quiz: isQuizVal,
              quiz_question: quizQuestionText,
              locale: window.ACTIVE_DATABASE_LOCALE || "en_US",
            }),
          );
        }
      }

      // Send text from chat input
      function handleChatTextKey(event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          submitChatText();
        }
      }

      function submitChatText() {
        const input = document.getElementById("chatTextInput");
        const val = input.value.trim();
        if (!val) return;

        triggerRAGQuery(val, "chat_typed");
        input.value = "";
      }

      // Append message to sidebar Chat tab
      function appendChatMessage(sender, body, imagePath = null) {
        const box = document.getElementById("chatFeedBox");
        if (!box) return;
        const timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const messageRow = document.createElement("div");

        let imgHtml = "";
        if (imagePath) {
          imgHtml = `<img src="${imagePath}" class="chat-attachment-img" onclick="window.open('${imagePath}', '_blank')" alt="Attachment">`;
        }

        if (sender === "YOU") {
          messageRow.className = "chat-msg-user";
          messageRow.innerHTML = `
                    <div class="user-content-col">
                        <div class="user-card-container">
                            <div class="user-header-row">
                                <span class="user-header-label">${getActiveStudentName()}</span>
                                <span class="chat-message-time">${timeStr}</span>
                            </div>
                            <div class="user-body-text">${renderMathSymbolsInHtml(body)}</div>
                            ${imgHtml}
                        </div>
                    </div>
                    <div class="user-avatar-col">
                        <div class="user-avatar-badge">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                        </div>
                    </div>
                `;
        } else {
          messageRow.className = "chat-msg-tutor";
          messageRow.innerHTML = `
                    <div class="tutor-avatar-col">
                        <div class="tutor-avatar-badge">
                            <img src="${window.ACTIVE_DATABASE_INSTRUCTOR_AVATAR || '/static/professor_evans_avatar.png'}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="Teacher Portrait">
                        </div>
                        <div class="tutor-line-accent"></div>
                    </div>
                    <div class="tutor-content-col">
                        <div class="tutor-header-row">
                            <span class="tutor-header-label">${getActiveInstructor()}</span>
                            <span class="chat-message-time">${timeStr}</span>
                        </div>
                        <div class="tutor-body-text">${renderMathSymbolsInHtml(body)}</div>
                        ${imgHtml}
                    </div>
                `;
        }

        box.appendChild(messageRow);
        box.scrollTop = box.scrollHeight;
        const currentVidKey = (typeof activeVideoId !== "undefined" && activeVideoId) ? activeVideoId : (typeof selectedGoalTrack !== "undefined" ? selectedGoalTrack : "default");
        localStorage.setItem("chatHistory_" + currentVidKey, box.innerHTML);
      }

      // Append Tutor sequential flat charcoal card
      function appendTutorTranscriptCard(
        text,
        timestamp = null,
        isAlreadyTranslated = false,
      ) {
        const container = document.getElementById("tutorTranscriptContainer");
        if (!container) return;

        const safeText = text || "";

        // Duplicate prevention
        if (timestamp) {
          const existing = Array.from(container.querySelectorAll("span")).some(
            (span) => {
              return span.innerText.trim() === timestamp.trim();
            },
          );
          if (existing) return; // Prevent duplicate cards
        }

        const segment = document.createElement("div");
        segment.style.display = "flex";
        segment.style.alignItems = "flex-start";
        segment.style.gap = "16px";
        segment.style.padding = "12px 16px";
        segment.style.fontFamily = "'Hanken Grotesk', sans-serif";
        segment.style.fontSize = "0.98rem";
        segment.style.lineHeight = "1.6";
        segment.style.animation = "fadeIn 0.4s ease";
        segment.style.transition = "background-color 0.2s ease";

        segment.onmouseover = () => {
          segment.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
        };
        segment.onmouseout = () => {
          segment.style.backgroundColor = "transparent";
        };

        const timeStr =
          timestamp ||
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

        segment.innerHTML = `
                <span style="font-family: 'Space Mono', monospace; color: var(--primary); font-size: 0.78rem; background: rgba(168, 85, 247, 0.08); padding: 4px 8px; border-radius: 6px; white-space: nowrap; margin-top: 2px; font-weight: 500; letter-spacing: 0.05em; border: 1px solid rgba(168, 85, 247, 0.15);">
                    ${timeStr}
                </span>
                <div class="tutor-stream-text" style="color: #e2e8f0; flex: 1;"></div>
            `;
        container.appendChild(segment);
        container.scrollTop = container.scrollHeight;

        const bodyDiv = segment.querySelector(".tutor-stream-text");
        const currentLocale = window.ACTIVE_DATABASE_LOCALE || "en_US";

        const startStreaming = (rawText) => {
          const textToStream = rawText || "";
          const words = textToStream.split(" ");
          let currentWordIdx = 0;

          function appendWord() {
            if (currentWordIdx < words.length) {
              bodyDiv.innerText +=
                (currentWordIdx === 0 ? "" : " ") + words[currentWordIdx];
              container.scrollTop = container.scrollHeight;
              currentWordIdx++;
              setTimeout(appendWord, 140);
            } else {
              bodyDiv.innerHTML = renderMathSymbolsInHtml(bodyDiv.innerText);
              container.scrollTop = container.scrollHeight;
              if (typeof selectedGoalTrack !== "undefined") {
                localStorage.setItem(
                  "tutorTranscriptHistory_" + selectedGoalTrack,
                  container.innerHTML,
                );
                localStorage.setItem(
                  "emittedTranscripts_" + selectedGoalTrack,
                  JSON.stringify(Array.from(emittedTranscripts)),
                );
              }
            }
          }
          appendWord();
        };

        startStreaming(safeText);
      }

      function appendTutorStudentCard(text, timestamp = null) {
        const container = document.getElementById("tutorTranscriptContainer");
        if (!container) return;

        const card = document.createElement("div");
        card.className = "tutor-transcript-card";
        card.style.borderColor = "rgba(194, 193, 255, 0.2)";

        const timeStr =
          timestamp ||
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

        card.innerHTML = `
                <div class="tutor-wave-icon-wrapper" style="background: rgba(194, 193, 255, 0.1); border-radius: 4px; padding: 2px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>
                <div class="tutor-card-body" style="color: var(--primary); font-weight: 500;">Asked: "${text}"</div>
                <div class="tutor-card-timestamp">${timeStr}</div>
            `;
        container.appendChild(card);
        container.scrollTop = container.scrollHeight;
        if (typeof selectedGoalTrack !== "undefined") {
          localStorage.setItem(
            "tutorTranscriptHistory_" + selectedGoalTrack,
            container.innerHTML,
          );
        }
      }

      function streamTutorTranscriptCard(text) {
        const container = document.getElementById("tutorTranscriptContainer");
        if (!container) return;

        const card = document.createElement("div");
        card.className = "tutor-transcript-card";
        const timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        card.innerHTML = `
                <div class="tutor-wave-icon-wrapper">
                    <svg class="tutor-wave-icon" viewBox="0 0 24 24" fill="none" stroke="url(#waveGradientTutor)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 12c2.5-4 4.5-4 7 0s4.5 4 7 0 3.5-3 6-2" />
                    </svg>
                </div>
                <div class="tutor-card-body" id="streaming-tutor-body-active"></div>
                <div class="tutor-card-timestamp">${timeStr}</div>
            `;
        container.appendChild(card);
        container.scrollTop = container.scrollHeight;

        const bodyContainer = card.querySelector(
          "#streaming-tutor-body-active",
        );
        bodyContainer.removeAttribute("id");

        const words = text.split(" ");
        let currentWordIdx = 0;

        function appendWord() {
          if (currentWordIdx < words.length) {
            bodyContainer.innerText +=
              (currentWordIdx === 0 ? "" : " ") + words[currentWordIdx];
            container.scrollTop = container.scrollHeight;
            currentWordIdx++;
            setTimeout(appendWord, 80);
          } else {
            bodyContainer.innerHTML = renderMathSymbolsInHtml(
              bodyContainer.innerText,
            );
            container.scrollTop = container.scrollHeight;
            if (typeof selectedGoalTrack !== "undefined") {
              localStorage.setItem(
                "tutorTranscriptHistory_" + selectedGoalTrack,
                container.innerHTML,
              );
            }
          }
        }
        appendWord();
      }

      function renderMathSymbolsInHtml(text) {
        if (!text) return "";
        try {
          const segments = parseSegments(text);
          preRenderSegments(segments);
          return renderTypedSegments(segments, 99999);
        } catch (e) {
          console.error("Math symbols rendering failed:", e);
          return text;
        }
      }

      function extractFunctionFromQuery(query) {
        if (!query) return null;
        const q = query.toLowerCase().trim();
        const markers = ["plot ", "graph ", "simulate ", "show me "];
        for (const marker of markers) {
          const idx = q.indexOf(marker);
          if (idx !== -1) {
            let expr = query.substring(idx + marker.length).trim();
            expr = expr.replace(/[?.;!]$/, "").trim();
            while (true) {
              let lowerExpr = expr.toLowerCase();
              if (lowerExpr.startsWith("of ")) {
                expr = expr.substring(3).trim();
              } else if (lowerExpr.startsWith("for ")) {
                expr = expr.substring(4).trim();
              } else if (lowerExpr.startsWith("the ")) {
                expr = expr.substring(4).trim();
              } else if (lowerExpr.startsWith("function ")) {
                expr = expr.substring(9).trim();
              } else if (lowerExpr.startsWith("a ")) {
                expr = expr.substring(2).trim();
              } else {
                break;
              }
            }
            if (
              expr.includes("x") &&
              expr.length < 30 &&
              !expr.includes("the") &&
              !expr.includes("how")
            ) {
              expr = expr.replace(/(\d)x/g, "$1*x");
              return expr;
            }
          }
        }
        return null;
      }

      let chatGraphCounter = 0;
      function appendChatGraphCard(data) {
        const box = document.getElementById("chatFeedBox");
        if (!box) return;

        chatGraphCounter++;
        const canvasId = `chatGraphCanvas_${chatGraphCounter}`;
        const timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const queryExpr = extractFunctionFromQuery(data ? data.raw_query : "");
        const functionInput = document.querySelector(
          ".graphFunctionInputClass",
        );
        const expr =
          queryExpr ||
          (functionInput ? functionInput.value.trim() : "x*x*x - 3*x");
        const tangentSlider = document.getElementById("tangentSlider");
        const tangentVal = tangentSlider
          ? parseFloat(tangentSlider.value)
          : 1.0;

        // Local f(x) solver to calculate default readouts
        function f(xVal) {
          const val = evaluateGraphFunction(xVal, expr);
          return val !== null ? val : 0;
        }

        const fVal = f(tangentVal);
        const h = 0.001;
        const slopeVal = (f(tangentVal + h) - f(tangentVal - h)) / (2 * h);

        const messageRow = document.createElement("div");
        messageRow.className = "chat-msg-tutor";
        messageRow.innerHTML = `
                <div class="tutor-avatar-col">
                    <div class="tutor-avatar-badge">
                        <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="Teacher Portrait">
                    </div>
                    <div class="tutor-line-accent"></div>
                </div>
                <div class="tutor-content-col" style="min-width: 0; flex: 1;">
                    <div class="tutor-header-row">
                        <span class="tutor-header-label">${getActiveInstructor()}</span>
                        <span class="chat-message-time">${timeStr}</span>
                    </div>
                    <div class="tutor-body-text" style="margin-bottom: 4px; font-size: 0.8rem;">Here is the interactive function simulation graph:</div>
                    <div style="background:#0c0c0e; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:6px; width:100%; height:180px; box-sizing:border-box; overflow:hidden; position:relative;">
                        <canvas id="${canvasId}" data-zoom="1.0" style="width:100% !important; height:100% !important; display:block;"></canvas>
                    </div>
                    <!-- Mini Graph Interactive Controls -->
                    <div style="margin-top: 4px; display: flex; flex-direction: column; gap: 4px; background: rgba(255,255,255,0.02); border-radius: 6px; padding: 6px; border: 1px solid rgba(255,255,255,0.04); box-sizing: border-box; width: 100%;">
                        <div style="display: flex; gap: 4px; align-items: center; width: 100%;">
                            <span style="font-size: 0.6rem; color: var(--outline); font-family: 'Geist', monospace; flex-shrink: 0; width: 24px;">f(x):</span>
                            <input type="text" id="miniGraphExpr_${chatGraphCounter}" value="${expr}" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; font-size: 0.65rem; padding: 2px 4px; flex: 1; min-width: 0; font-family: 'Geist', monospace;" oninput="updateMiniGraph(${chatGraphCounter})">
                        </div>
                        <div style="display: flex; gap: 8px; width: 100%;">
                            <div style="display: flex; gap: 4px; align-items: center; flex: 1;">
                                <span style="font-size: 0.6rem; color: var(--outline); font-family: 'Geist', monospace; flex-shrink: 0; width: 24px;">x:</span>
                                <input type="text" id="miniGraphXInput_${chatGraphCounter}" value="${tangentVal.toFixed(2)}" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; font-size: 0.65rem; padding: 2px 4px; width: 100%; font-family: 'Geist', monospace;" onchange="updateMiniGraphFromXInput(${chatGraphCounter})">
                            </div>
                            <div style="display: flex; gap: 4px; align-items: center; flex: 1;">
                                <span style="font-size: 0.6rem; color: var(--outline); font-family: 'Geist', monospace; flex-shrink: 0; width: 24px;">y:</span>
                                <input type="text" id="miniGraphYInput_${chatGraphCounter}" value="${fVal.toFixed(2)}" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; font-size: 0.65rem; padding: 2px 4px; width: 100%; font-family: 'Geist', monospace;" onchange="updateMiniGraphFromYInput(${chatGraphCounter})">
                            </div>
                        </div>
                        <div style="display: flex; gap: 4px; align-items: center; width: 100%;">
                            <span style="font-size: 0.6rem; color: var(--outline); font-family: 'Geist', monospace; flex-shrink: 0; width: 24px;">pos:</span>
                            <input type="range" id="miniGraphSlider_${chatGraphCounter}" min="-2.5" max="2.5" step="0.05" value="${tangentVal}" style="flex: 1; min-width: 0; height: 3px; cursor: pointer; accent-color: var(--primary);" oninput="updateMiniGraph(${chatGraphCounter})">
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.58rem; color: #a855f7; font-family: 'Geist', monospace; padding-top: 1px; width: 100%;">
                            <span>dy/dx: <strong id="miniGraphSlope_${chatGraphCounter}" style="color:#fff;">${slopeVal.toFixed(2)}</strong></span>
                            <div style="display: flex; gap: 2px; align-items: center;">
                                <span style="color: var(--outline); margin-right: 2px;">zoom:</span>
                                <button onclick="changeMiniGraphZoom(${chatGraphCounter}, 1.2)" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; color: #fff; font-size: 0.55rem; padding: 0px 4px; cursor: pointer;">+</button>
                                <button onclick="changeMiniGraphZoom(${chatGraphCounter}, 0.8)" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; color: #fff; font-size: 0.55rem; padding: 0px 4px; cursor: pointer;">-</button>
                                <button onclick="changeMiniGraphZoom(${chatGraphCounter}, 'reset')" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; color: #fff; font-size: 0.55rem; padding: 0px 4px; cursor: pointer;">1x</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        box.appendChild(messageRow);
        box.scrollTop = box.scrollHeight;

        setTimeout(() => {
          drawMiniGraph(canvasId, expr, tangentVal);
        }, 80);
      }

      function drawMiniGraph(canvasId, expr = "x*x*x - 3*x", x0 = 1.0) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        canvas.width = canvas.parentElement.clientWidth || 300;
        canvas.height = canvas.parentElement.clientHeight || 140;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const zoom = parseFloat(canvas.getAttribute("data-zoom") || "1.0");
        const xMin = -3.0 / zoom,
          xMax = 3.0 / zoom;
        const yMin = -10.0 / zoom,
          yMax = 10.0 / zoom;

        function toScreenX(x) {
          return ((x - xMin) / (xMax - xMin)) * canvas.width;
        }
        function toScreenY(y) {
          return canvas.height - ((y - yMin) / (yMax - yMin)) * canvas.height;
        }

        // Draw grid
        ctx.strokeStyle = "#18181b";
        ctx.lineWidth = 1;
        for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
          ctx.beginPath();
          ctx.moveTo(toScreenX(x), 0);
          ctx.lineTo(toScreenX(x), canvas.height);
          ctx.stroke();
        }
        for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += 2) {
          ctx.beginPath();
          ctx.moveTo(0, toScreenY(y));
          ctx.lineTo(canvas.width, toScreenY(y));
          ctx.stroke();
        }

        // Draw axes
        ctx.strokeStyle = "#4b5563";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(toScreenX(0), 0);
        ctx.lineTo(toScreenX(0), canvas.height);
        ctx.moveTo(0, toScreenY(0));
        ctx.lineTo(canvas.width, toScreenY(0));
        ctx.stroke();

        // Draw axes ticks and labels for all 4 quadrants
        ctx.fillStyle = "#888888";
        ctx.font = '8px "Geist", monospace';
        const yAxisScreenX = toScreenX(0);
        const xAxisScreenY = toScreenY(0);

        // X-axis ticks and labels
        let xStep = 1;
        const xRange = xMax - xMin;
        if (xRange > 10) xStep = 2;
        if (xRange > 20) xStep = 5;

        for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += xStep) {
          if (x === 0) continue;
          const sx = toScreenX(x);
          ctx.strokeStyle = "#4b5563";
          ctx.beginPath();
          ctx.moveTo(sx, xAxisScreenY - 3);
          ctx.lineTo(sx, xAxisScreenY + 3);
          ctx.stroke();

          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(x.toString(), sx, xAxisScreenY + 5);
        }

        // Y-axis ticks and labels
        let yStep = 2;
        const yRange = yMax - yMin;
        if (yRange > 20) yStep = 5;

        for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += yStep) {
          if (y === 0) continue;
          const sy = toScreenY(y);
          ctx.strokeStyle = "#4b5563";
          ctx.beginPath();
          ctx.moveTo(yAxisScreenX - 3, sy);
          ctx.lineTo(yAxisScreenX + 3, sy);
          ctx.stroke();

          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          let labelX = yAxisScreenX - 5;
          if (labelX < 10) {
            labelX = yAxisScreenX + 5;
            ctx.textAlign = "left";
          }
          ctx.fillText(y.toString(), labelX, sy);
        }

        // Axis labels (x, -x, y, -y)
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillText("x", canvas.width - 5, xAxisScreenY - 4);
        ctx.textAlign = "left";
        ctx.fillText("-x", 5, xAxisScreenY - 4);

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("y", yAxisScreenX + 5, 5);
        ctx.textBaseline = "bottom";
        ctx.fillText("-y", yAxisScreenX + 5, canvas.height - 5);

        // Helper to evaluate function f(x)
        function f(xVal) {
          const val = evaluateGraphFunction(xVal, expr);
          return val !== null ? val : 0;
        }

        // Draw function curve
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        let first = true;
        for (let i = 0; i <= canvas.width; i++) {
          const screenX = i;
          const xVal = xMin + (screenX / canvas.width) * (xMax - xMin);
          const yVal = f(xVal);

          if (isNaN(yVal) || !isFinite(yVal)) continue;

          const screenY = toScreenY(yVal);
          if (first) {
            ctx.moveTo(screenX, screenY);
            first = false;
          } else {
            ctx.lineTo(screenX, screenY);
          }
        }
        ctx.stroke();

        // Draw tangent point and tangent line
        const y0 = f(x0);
        if (!isNaN(y0) && isFinite(y0)) {
          const h = 0.001;
          const yPlus = f(x0 + h);
          const yMinus = f(x0 - h);
          const slope = (yPlus - yMinus) / (2 * h);

          ctx.strokeStyle = "#a855f7";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();

          const xStart = xMin;
          const yStart = slope * (xStart - x0) + y0;
          const xEnd = xMax;
          const yEnd = slope * (xEnd - x0) + y0;

          ctx.moveTo(toScreenX(xStart), toScreenY(yStart));
          ctx.lineTo(toScreenX(xEnd), toScreenY(yEnd));
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(toScreenX(x0), toScreenY(y0), 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      function updateMiniGraph(id) {
        const exprInput = document.getElementById(`miniGraphExpr_${id}`);
        const slider = document.getElementById(`miniGraphSlider_${id}`);
        const xInput = document.getElementById(`miniGraphXInput_${id}`);
        const yInput = document.getElementById(`miniGraphYInput_${id}`);
        const slopeReadout = document.getElementById(`miniGraphSlope_${id}`);

        if (exprInput && slider) {
          const expr = exprInput.value.trim() || "x*x*x - 3*x";
          const xVal = parseFloat(slider.value);

          // Redraw canvas
          drawMiniGraph(`chatGraphCanvas_${id}`, expr, xVal);

          // Update numerical indicator readouts (only if not currently typing)
          if (xInput && document.activeElement !== xInput)
            xInput.value = xVal.toFixed(2);

          // Helper f(x)
          function f(x) {
            const val = evaluateGraphFunction(x, expr);
            return val !== null ? val : 0;
          }

          const yVal = f(xVal);
          if (yInput && document.activeElement !== yInput) {
            yInput.value =
              isNaN(yVal) || !isFinite(yVal) ? "0.00" : yVal.toFixed(2);
          }

          const h = 0.001;
          const slope = (f(xVal + h) - f(xVal - h)) / (2 * h);
          if (slopeReadout)
            slopeReadout.innerText =
              isNaN(slope) || !isFinite(slope) ? "0.00" : slope.toFixed(2);
        }
      }

      function updateMiniGraphFromXInput(id) {
        const xInput = document.getElementById(`miniGraphXInput_${id}`);
        const slider = document.getElementById(`miniGraphSlider_${id}`);
        if (xInput && slider) {
          let xVal = parseFloat(xInput.value);
          if (isNaN(xVal)) xVal = 0.0;
          // Clamp within standard graphing range
          xVal = Math.max(-2.5, Math.min(2.5, xVal));
          slider.value = xVal;
          updateMiniGraph(id);
        }
      }

      function updateMiniGraphFromYInput(id) {
        const yInput = document.getElementById(`miniGraphYInput_${id}`);
        const exprInput = document.getElementById(`miniGraphExpr_${id}`);
        const slider = document.getElementById(`miniGraphSlider_${id}`);
        if (yInput && exprInput && slider) {
          const targetY = parseFloat(yInput.value);
          if (isNaN(targetY)) return;
          const expr = exprInput.value.trim() || "x*x*x - 3*x";

          // Numerical search for closest x
          let bestX = parseFloat(slider.value);
          let minDiff = Infinity;
          for (let x = -2.5; x <= 2.5; x += 0.01) {
            const y = evaluateGraphFunction(x, expr);
            if (y !== null) {
              const diff = Math.abs(y - targetY);
              if (diff < minDiff) {
                minDiff = diff;
                bestX = x;
              }
            }
          }
          slider.value = bestX;
          updateMiniGraph(id);
        }
      }

      function changeMiniGraphZoom(id, factor) {
        const canvas = document.getElementById(`chatGraphCanvas_${id}`);
        if (!canvas) return;
        let currentZoom = parseFloat(canvas.getAttribute("data-zoom") || "1.0");
        if (factor === "reset") {
          currentZoom = 1.0;
        } else {
          currentZoom *= factor;
          currentZoom = Math.max(0.1, Math.min(10.0, currentZoom));
        }
        canvas.setAttribute("data-zoom", currentZoom.toString());

        // Redraw
        const exprInput = document.getElementById(`miniGraphExpr_${id}`);
        const slider = document.getElementById(`miniGraphSlider_${id}`);
        if (exprInput && slider) {
          const expr = exprInput.value.trim();
          const xVal = parseFloat(slider.value);
          drawMiniGraph(`chatGraphCanvas_${id}`, expr, xVal);
        }
      }

      // Start new session
      function startNewSession() {
        const box = document.getElementById("chatFeedBox");
        if (box) {
          box.innerHTML = "";
        }
        showToastNotification(
          "New Session",
          "A fresh session has been started.",
        );
      }

      // Socratic Digital Whiteboard Canvas helpers
      function checkIsMathQuery(query, socraticText) {
        const q = (query || "").toLowerCase().trim();
        const text = (socraticText || "").toLowerCase();

        // 1. Check if the query is a simple follow-up clarification
        const clarificationPhrases = [
          "explain further",
          "clarify",
          "what do you mean",
          "why is that",
          "elaborate",
          "go on",
          "makes sense",
          "understand",
          "got it",
          "why?",
          "how?",
          "yes",
          "no",
          "ok",
          "okay",
          "sure",
          "tell me more",
        ];

        // Check for explicit math/proof/curve requests in the query
        const mathExplicit = [
          "integral",
          "derivative",
          "tangent",
          "slope",
          "rate of change",
          "calculus",
          "limit",
          "area",
          "equation",
          "formula",
          "algebra",
          "coefficient",
          "sum",
          "math",
          "proof",
          "prove",
          "step",
          "steps",
          "solve",
          "calculate",
          "constant",
          "variable",
          "curve",
          "graph",
          "plot",
          "draw",
          "visualize",
          "chart",
          "canvas",
          "axis",
          "coordinates",
        ];

        const hasExplicitMathQuery =
          mathExplicit.some((term) => q.includes(term)) ||
          /[\d+\-*/=^()f(x)]/.test(q);

        // It is a simple follow-up clarification if it matches clarification phrases, is short, and doesn't explicitly have math terms in the query itself.
        const isClarification =
          clarificationPhrases.some((phrase) => q.includes(phrase)) &&
          q.split(" ").length < 8 &&
          !hasExplicitMathQuery;

        if (isClarification) {
          console.log(
            "[SOCRATIC STATE] Simple follow-up clarification. Keep canvases hidden and answer verbally.",
          );
          return false;
        }

        // 2. Check if the query demands multi-step math problems, proofs, or graphical curves
        const demandsMath =
          hasExplicitMathQuery ||
          mathExplicit.some((term) => text.includes(term)) ||
          text.includes("$$") ||
          text.includes("$") ||
          /[\d+\-*/=^]/.test(text);

        if (demandsMath) {
          console.log(
            "[SOCRATIC STATE] Query demands multi-step math/proofs/curves. Opening whiteboard split-pane.",
          );
          return true;
        }

        return false;
      }

      // HTML escaping helper
      function escapeHtml(str) {
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      // 3. Audio & LaTeX Typing Mask Filters
      function cleanTextForSpeech(text) {
        if (!text) return "";
        let clean = text;

        // Strip translation prefixes (e.g. [FR TRANSLATION])
        clean = clean.replace(/^(?:\[[^\]]+\]\s*)+/, "");

        // Verbalize common calculus math expressions
        clean = clean.replace(/\\begin\{(?:p|b|v|V)?matrix\}/g, " matrix: ");
        clean = clean.replace(/\\end\{(?:p|b|v|V)?matrix\}/g, " end matrix ");
        clean = clean.replace(/\\\\/g, ", next row, ");
        clean = clean.replace(/&/g, " and ");
        clean = clean.replace(
          /\\int_\{([^}]+)\}\^\{([^}]+)\}/g,
          " the integral from $1 to $2 of ",
        );
        clean = clean.replace(/\\int/g, " the integral of ");
        clean = clean.replace(
          /\\lim_\{([^}]+)\\to\s*([^}]+)\}/g,
          " the limit as $1 approaches $2 of ",
        );
        clean = clean.replace(/\\lim/g, " the limit ");
        clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, " $1 over $2 ");
        clean = clean.replace(/\\sqrt\{([^}]+)\}/g, " the square root of $1 ");
        clean = clean.replace(
          /\\sum_\{([^}]+)\}\^\{([^}]+)\}/g,
          " the sum from $1 to $2 of ",
        );
        clean = clean.replace(/\\sum/g, " the sum of ");
        clean = clean.replace(/\\to/g, " approaches ");
        clean = clean.replace(/\\infty/g, " infinity ");
        clean = clean.replace(/\\pi/g, " pi ");
        clean = clean.replace(/\\theta/g, " theta ");
        clean = clean.replace(/\\cdot/g, " times ");
        clean = clean.replace(/\\le/g, " less than or equal to ");
        clean = clean.replace(/\\ge/g, " greater than or equal to ");
        clean = clean.replace(/\\neq/g, " not equal to ");
        clean = clean.replace(/f\(x\)/g, " f of x ");
        clean = clean.replace(/g\(x\)/g, " g of x ");
        clean = clean.replace(/dx/g, " d x ");
        clean = clean.replace(/dy/g, " d y ");

        // Strip brackets and LaTeX syntax markers
        clean = clean.replace(/\$\$/g, "");
        clean = clean.replace(/\$/g, "");
        clean = clean.replace(/\\/g, "");
        clean = clean.replace(/[{}[\]]/g, ""); // Strip curly braces and square brackets
        clean = clean.replace(/[_^]/g, " "); // Strip subscript/superscript markers
        clean = clean.replace(/\*/g, ""); // Strip asterisks

        // Remove double spaces
        clean = clean.replace(/\s+/g, " ").trim();
        return clean;
      }

      function parseSegments(text) {
        const segments = [];
        let i = 0;
        while (i < text.length) {
          if (text.substr(i, 2) === "$$") {
            let endIdx = text.indexOf("$$", i + 2);
            if (endIdx !== -1) {
              segments.push({
                type: "display-math",
                raw: text.substring(i, endIdx + 2),
                latex: text.substring(i + 2, endIdx),
              });
              i = endIdx + 2;
            } else {
              segments.push({
                type: "text",
                raw: text.substring(i),
              });
              break;
            }
          } else if (text.substr(i, 1) === "$") {
            let endIdx = text.indexOf("$", i + 1);
            if (endIdx !== -1) {
              segments.push({
                type: "inline-math",
                raw: text.substring(i, endIdx + 1),
                latex: text.substring(i + 1, endIdx),
              });
              i = endIdx + 1;
            } else {
              segments.push({
                type: "text",
                raw: text.substring(i),
              });
              break;
            }
          } else {
            let nextDollar = text.indexOf("$", i);
            if (nextDollar === -1) {
              segments.push({
                type: "text",
                raw: text.substring(i),
              });
              break;
            } else {
              segments.push({
                type: "text",
                raw: text.substring(i, nextDollar),
              });
              i = nextDollar;
            }
          }
        }
        return segments;
      }

      function preRenderSegments(segments) {
        for (let seg of segments) {
          if (seg.type === "display-math") {
            try {
              seg.html = katex.renderToString(seg.latex, {
                displayMode: true,
                throwOnError: false,
              });
            } catch (e) {
              seg.html = `<span style="color:#ef4444;">${escapeHtml(seg.raw)}</span>`;
            }
          } else if (seg.type === "inline-math") {
            try {
              seg.html = katex.renderToString(seg.latex, {
                displayMode: false,
                throwOnError: false,
              });
            } catch (e) {
              seg.html = `<span style="color:#ef4444;">${escapeHtml(seg.raw)}</span>`;
            }
          } else {
            seg.html = escapeHtml(seg.raw);
          }
        }
      }

      function renderTypedSegments(segments, charCount) {
        let result = "";
        let remaining = charCount;
        for (let seg of segments) {
          if (seg.type === "text") {
            if (remaining >= seg.raw.length) {
              result += escapeHtml(seg.raw);
              remaining -= seg.raw.length;
            } else {
              result += escapeHtml(seg.raw.substring(0, remaining));
              remaining = 0;
              break;
            }
          } else {
            if (remaining >= 1) {
              result += seg.html;
              remaining -= 1;
            } else {
              break;
            }
          }
        }
        return result;
      }

      function getSegmentsTotalLength(segments) {
        let len = 0;
        for (let seg of segments) {
          if (seg.type === "text") {
            len += seg.raw.length;
          } else {
            len += 1;
          }
        }
        return len;
      }

      // LaTeX parser/renderer using KaTeX
      function renderWhiteboardContent(text) {
        const segments = parseSegments(text);
        preRenderSegments(segments);
        return renderTypedSegments(segments, getSegmentsTotalLength(segments));
      }

      // Filter out conversational filler and keep ONLY math relations/steps/theorems
      function filterMathematicalWrittenStream(text) {
        if (!text) return "";
        const lines = text.split("\n");
        const filteredLines = [];
        const fillerKeywords = [
          "great question",
          "interesting question",
          "good question",
          "let's look",
          "sure,",
          "happy to help",
          "think about",
          "consider what",
          "would you",
          "how about",
          "what if",
          "let us",
          "can you",
          "what is",
          "do you",
          "let's think",
          "explain a bit",
          "more please",
          "here is",
          "let's trace",
          "let's examine",
          "guidance plan",
          "questions to consider",
          "why is",
          "goal:",
          "socratic",
          "welcome",
          "glad to see",
          "hello",
          "hi ",
        ];

        for (let line of lines) {
          const trimmed = line.trim();
          const trimmedLower = trimmed.toLowerCase();
          if (!trimmed) {
            filteredLines.push("");
            continue;
          }

          const isFiller = fillerKeywords.some((kw) =>
            trimmedLower.includes(kw),
          );
          const hasMathSymbols =
            /[\d=+\-*/^\\(){}[\]_$]|lim|sin|cos|tan|log|ln|f\(x\)/.test(line);
          const isMathHeader =
            /concept|formula|variable|breakdown|step|example|theorem|definition|notation/i.test(
              trimmed,
            );
          const isIndentedOrStep =
            line.startsWith(" ") ||
            /^\s*\d+[\.:]/.test(line) ||
            /^\s*[\-\*]/.test(line);

          if (isFiller && !hasMathSymbols) {
            continue;
          }

          const words = trimmed.split(/\s+/);
          if (
            words.length > 5 &&
            !hasMathSymbols &&
            !isMathHeader &&
            !isIndentedOrStep
          ) {
            continue;
          }

          if (hasMathSymbols || isMathHeader || isIndentedOrStep) {
            filteredLines.push(line);
          }
        }

        return filteredLines
          .join("\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      }

      let speechInProgress = false;
      let boundaryFired = false;
      let fallbackTimer = null;
      let currentTypedIndex = 0;
      let isGraphLoopActive = false;
      let isSimulatorActive = false;
      let graphAnimationFrameId = null;
      let currentQueryMode = "voice"; // "voice" or "typed"

      function animateCalculusGraph() {
        if (!isGraphLoopActive) return;
        const panelA = document.getElementById("whiteboardPanelA");
        if (panelA && panelA.style.display !== "none") {
          drawCalculusGraph();
        }
        graphAnimationFrameId = requestAnimationFrame(animateCalculusGraph);
      }

      function updateTranslationAudioMode(mode) {
        translationAudioMode = mode;
        localStorage.setItem("lectureTranslationAudioMode", mode);

        // Sync dropdown value in UI
        const modeSelect = document.getElementById(
          "lectureTranslationAudioMode",
        );
        if (modeSelect) modeSelect.value = mode;

        showToastNotification(
          "Audio Mode Changed",
          `Lecture audio mode set to ${mode === "translated" ? "Translated Native Audio" : "Original Audio"}.`,
        );

        const video = document.getElementById("lectureVideoPlayer");
        const floating = document.getElementById("tutorWebcamMock");
        const currentLocale = window.ACTIVE_DATABASE_LOCALE || "en_US";
        const teacherLocale =
          window.ACTIVE_DATABASE_INSTRUCTOR_LOCALE || "en_US";

        if (floating) {
          floating.volume = 0;
          floating.muted = true;
        }

        if (video) {
          if (currentLocale === "en_US" && mode === "translated") {
            video.volume = 0;
            video.muted = true;
            console.log(
              "[LOCALIZATION] Muted video for translated audio playback.",
            );
          } else {
            video.volume = 1.0;
            video.muted = false;
            // Stop any playing translation audio when reverting to original audio
            if (activeLectureAudio) {
              activeLectureAudio.pause();
              activeLectureAudio = null;
            }
            console.log(
              "[LOCALIZATION] Unmuted video for original audio playback.",
            );
          }
        }
      }

      const UI_LOCALIZATIONS = {
        en_US: {
          tab_tutor: "Tutor",
          tab_chat: "Chat",
          tab_flashcards: "Flashcards",
          tab_timestamps: "Sommaire",
          tab_profile: "Profile",
          tab_evaluation: "Evaluation",
          welcome_msg:
            "Welcome to the lecture series! Please select your track or press the mic button below to start the conversation and explore topics together. Let's get learning!",
          mic_hint: '"Explain the relationship between these three vectors..."',
          active_lang: "Active System Language",
          audio_mode: "Lecture Translation Audio",
          mesh_network: "eSIM Mesh Networking",
          mode_translated: "Translated Native Audio (Gemma + Piper)",
          mode_original: "Original Audio (Teacher's Voice)",
          label_graphing_engine: "Calculus Graphing Engine",
          label_zoom: "zoom:",
          label_tangent_point: "Tangent Point (x₀):",
          label_function_fx: "Function f(x):",
          label_coordinates: "Coordinates:",
          label_slope_dydx: "Slope (dy/dx):",
          label_blackboard_canvas: "Socratic Blackboard Canvas",
          label_raise_hand: "Capacitive Raise Hand Sensor",
          label_listening_idle: "Listening State: Idle",
          label_listening_active: "Listening State: Active",
          label_chat_placeholder: "Ask anything...",
          label_popover_exp: "Experience:",
          label_popover_phone: "Contact:",
          label_collaboration_studio: "[Collaboration Studio]",
          label_system_config: "System Configuration",
          label_overhead_grader: "Overhead Document Camera Grader",
          label_scan_btn: "Scan Handwritten Page",
          label_collaboration_broadcaster: "Collaboration Project Broadcaster",
          label_broadcast_project: "Broadcast Project",
          label_close: "Close",
          label_archives_title: "Handwriting Notes Archives (by Subject)",
          label_broadcast_placeholder: "New Project Title...",
          show_answer: "Show Answer",
          show_question: "Show Question",
          show_hint: "Show Hint",
          study_hint: "Study Hint",
          definition: "Definition",
          answer: "Answer",
          study_stack: "Study Stack: ",
          cards_count: "{count} cards",
          recently_generated: "Recently Generated",
          index_landmark: "Index Landmark",
          time_col: "Time",
          pdf_loaded: "Library PDF Loaded",
          studying_msg: "Now studying: {file}",
          btn_done_reading: "Done Reading",
          pdf_page_indicator: "Page 1 - Dynamic Synchronization Active",
          label_mastery_level: "MASTERY LEVEL",
          label_knowledge_core_grid: "Knowledge Core Grid",
          label_sync_pdf: "Click card to Sync PDF",
          label_learning_interests: "Your Learning Interests",
          label_evaluation_ledger: "Evaluation Ledger",
          label_evaluation_desc:
            "Perform standard MCQ assessments to unlock subsequent curriculum topics. A passing grade of 85.0% or higher is strictly required for progression.",
          label_evaluation_status: "Evaluation Status",
          label_verbal_assistance: "Verbal Assistance",
          label_verbal_assistance_desc:
            'Need guidance? Click the microphone button and ask "Give me a hint" verbally. Gemma 4 e4b will analyze the question sheet and provide supportive, Socratic guidance without revealing the answer.',
          label_currently_studying: "CURRENTLY STUDYING",
          label_export_pdf: "EXPORT AS PDF",
          label_switch_lesson: "SWITCH TO LESSON",
          label_mastery_evaluation_panel_a: "Mastery Evaluation - Panel A",
          label_sentry_vision_panel_b: "Sentry Vision - Panel B",
          label_live_desk_tracking: "LIVE DESK TRACKING",
          label_socratic_hint: "Socratic Hint:",
          label_resume_timer: "[RESUME EVALUATION TIMER]",
          label_submit_quiz: "[SUBMIT ANSWER FOR EVALUATION]",
          label_more_practice_btn:
            "More Practice Questions ({passed}/30 Passed)",
          quiz_status_mastery: "Mastery Achieved ({score}%)",
          quiz_detail_mastery:
            "Topic completed successfully. Timeline navigation unlocked.",
          quiz_status_locked: "Action Required: Locked ({score}%)",
          quiz_detail_locked:
            "Score falls below 85% requirement. Alternative question set active.",
          quiz_status_ready: "Ready to Begin",
          quiz_detail_ready:
            "No attempts logged yet. 85.0% required to progress.",
          toast_practice_completed: "Practice Completed",
          toast_practice_completed_desc:
            "Practice Score: {score}%. This does not affect your course status.",
          toast_mastery_achieved: "Mastery Achieved!",
          toast_mastery_achieved_desc:
            "Score: {score}%. Lesson completed successfully.",
          toast_evaluation_failed: "Evaluation Failed",
          toast_evaluation_failed_desc:
            "Score: {score}%. Score falls below 85.0% mastery threshold. Timeline navigation locked.",
          interest_k12: "K-12 Education",
          desc_k12: "Calculus course path",
          interest_prof: "Professional Certificates",
          desc_prof: "Basic Science path",
          interest_college: "College Level",
          desc_college: "Physics & Chemistry path",
          interest_indep: "Independent Learner",
          desc_indep: "Logic & Philosophy path",
          subject_calculus: "Calculus",
          subject_physics: "Physics",
          subject_chemistry: "Chemistry",
          subject_philosophy: "Philosophy",
          subject_basic_science: "Basic Science",
          label_practice_evaluation_panel_a: "Practice Evaluation - Panel A",
          label_submit_practice_answers: "SUBMIT PRACTICE ANSWERS",
          label_no_practice_questions:
            "No additional practice questions available for this lesson.",
          label_close_evaluation: "[✖ Close Evaluation]",
          analyzing_workspace:
            "Analyzing workspace and thinking Socratic advice...",
          track_format: "{subject} Track",
          label_handwriting_note: "Handwriting Note",
          graphing_simulator_active: "Graphing simulator active.",
          subject_economics: "Economics",
          subject_k12_12th_sm_economics: "Economics & Calculus",
          subject_k12_12th_sm_chemistry: "Chemistry",
          subject_k12_12th_sm_physics: "Physics",
          subject_k12_12th_sm_english_literature: "English Literature",
          subject_k12_12th_sm_world_history: "World History",
          subject_k12_1st_grade_english_language_arts: "English Language Arts",
          subject_k12_1st_grade_introductory_science: "Introductory Science",
          subject_k12_1st_grade_mathematics: "Mathematics",
          subject_k12_12th_se_12th_grade: "12th Grade",
          subject_k12_12th_se_1st_grade: "1st Grade",
          subject_k12_12th_ss_12th_grade: "12th Grade",
          subject_k12_12th_ss_1st_grade: "1st Grade",
          subject_college_level_business_and_finance_corporate_finance:
            "Corporate Finance",
          subject_college_level_business_and_finance_macroeconomics:
            "Macroeconomics",
          subject_college_level_computer_science_data_structures:
            "Data Structures",
          subject_college_level_computer_science_data_structures_and_algorithms:
            "Data Structures & Algorithms",
          subject_college_level_computer_science_neural_networks_and_deep_learning:
            "Neural Networks & Deep Learning",
          subject_college_level_computer_science_operating_systems:
            "Operating Systems",
          subject_college_level_engineering_electrical_circuits:
            "Electrical Circuits",
          subject_college_level_engineering_mechanical_statics:
            "Mechanical Statics",
          subject_college_level_mathematics_differential_equations:
            "Differential Equations",
          subject_college_level_mathematics_linear_algebra: "Linear Algebra",
          subject_college_level_pre_med_biochemistry: "Biochemistry",
          subject_college_level_pre_med_human_anatomy: "Human Anatomy",
          subject_independent_learner_advanced_hobbies_amateur_rocketry:
            "Amateur Rocketry",
          subject_independent_learner_advanced_hobbies_chess_grandmaster_strategy:
            "Chess Grandmaster Strategy",
          subject_independent_learner_creative_arts_digital_cinematography:
            "Digital Cinematography",
          subject_independent_learner_creative_arts_music_theory_and_composition:
            "Music Theory & Composition",
          subject_independent_learner_language_acquisition_conversational_french:
            "Conversational French",
          subject_independent_learner_language_acquisition_mandarin_chinese:
            "Mandarin Chinese",
          subject_independent_learner_philosophy_socratic_dialogues:
            "Socratic Dialogues",
          subject_independent_learner_philosophy_stoicism_and_ethics:
            "Stoicism & Ethics",
          subject_professional_certificates_cybersecurity_comptia_security_plus:
            "CompTIA Security+",
          subject_professional_certificates_cybersecurity_network_security:
            "Network Security",
          subject_professional_certificates_data_science_google_data_analytics:
            "Google Data Analytics",
          subject_professional_certificates_project_management_pmp_certification:
            "PMP Certification",
          subject_professional_certificates_software_engineering_aws_solutions_architect:
            "AWS Solutions Architect",
          subject_professional_certificates_software_engineering_cisco_ccna_networking:
            "Cisco CCNA Networking",
          group_1st_grade: "1st Grade",
          group_10th_grade: "10th Grade",
          group_12th_se: "12th Grade (SE)",
          group_12th_sm: "12th Grade (SM)",
          group_12th_ss: "12th Grade (SS)",
          group_business_and_finance: "Business & Finance",
          group_computer_science: "Computer Science",
          group_engineering: "Engineering",
          group_mathematics: "Mathematics",
          group_pre_med: "Pre-Med",
          group_advanced_hobbies: "Advanced Hobbies",
          group_creative_arts: "Creative Arts",
          group_language_acquisition: "Language Acquisition",
          group_philosophy: "Philosophy",
          group_cybersecurity: "Cybersecurity",
          group_data_science: "Data Science",
          group_project_management: "Project Management",
          group_software_engineering: "Software Engineering",
          label_student_identity: "[STUDENT IDENTITY]",
          label_update_profile_photo: "Update Profile Photo",
          label_avatar_picker_status:
            "Take a live photo with your camera or upload a picture from gallery.",
          label_take_photo: "Take Photo",
          label_choose_gallery: "Choose Gallery",
          label_capture_snapshot: "📸 Capture Photo Snapshot",
          label_skip_default: "Skip / Default",
          label_save_photo: "Save Photo",
          label_student_profile_settings: "Student Profile & Photo Settings",
          label_edit_photo: "Edit Photo",
        },
        fr_FR: {
          tab_tutor: "Tuteur",
          tab_chat: "Chat",
          tab_flashcards: "Cartes",
          tab_timestamps: "Sommaire",
          tab_profile: "Profil",
          tab_evaluation: "Évaluation",
          welcome_msg:
            "Bienvenue dans la série de cours ! Veuillez sélectionner votre parcours ou appuyer sur le bouton micro ci-dessous pour démarrer la conversation et explorer les sujets ensemble. Commençons à apprendre !",
          mic_hint: '"Veuillez m\'expliquer..."',
          active_lang: "Langue active du système",
          audio_mode: "Mode audio de traduction du cours",
          mesh_network: "Réseau maillé eSIM",
          mode_translated: "Audio natif traduit (Gemma + Piper)",
          mode_original: "Audio d'origine (Voix du prof)",
          label_graphing_engine: "Moteur de graphisme de calcul",
          label_zoom: "zoom :",
          label_tangent_point: "Point de tangente (x₀) :",
          label_function_fx: "Fonction f(x) :",
          label_coordinates: "Coordonnées :",
          label_slope_dydx: "Pente (dy/dx) :",
          label_blackboard_canvas: "Tableau noir socratique",
          label_raise_hand: "Capteur de main levée capacitif",
          label_listening_idle: "État d'écoute : Inactif",
          label_listening_active: "État d'écoute : Actif",
          label_chat_placeholder: "Demandez n'importe quoi...",
          label_popover_exp: "Expérience :",
          label_popover_phone: "Contact :",
          label_collaboration_studio: "[Studio de collaboration]",
          label_system_config: "Configuration du système",
          label_overhead_grader: "Niveleur de caméra de document aérien",
          label_scan_btn: "Numériser la page manuscrite",
          label_collaboration_broadcaster:
            "Diffuseur de projet de collaboration",
          label_broadcast_project: "Diffuser le projet",
          label_close: "Fermer",
          label_archives_title: "Archives de notes manuscrites (par sujet)",
          label_broadcast_placeholder: "Nouveau titre de projet...",
          show_answer: "Afficher la réponse",
          show_question: "Afficher la question",
          show_hint: "Afficher l'indice",
          study_hint: "Indice d'étude",
          definition: "Définition",
          answer: "Réponse",
          study_stack: "Pile d'étude : ",
          cards_count: "{count} cartes",
          recently_generated: "Récemment générés",
          index_landmark: "Repère d'index",
          time_col: "Temps",
          pdf_loaded: "PDF de bibliothèque chargé",
          studying_msg: "Étudie actuellement : {file}",
          btn_done_reading: "Lecture terminée",
          pdf_page_indicator: "Page 1 - Synchronisation dynamique active",
          label_mastery_level: "NIVEAU DE MAÎTRISE",
          label_knowledge_core_grid: "Grille d'apprentissage de base",
          label_sync_pdf: "Cliquez sur une carte pour synchroniser le PDF",
          label_learning_interests: "Vos intérêts d'apprentissage",
          label_evaluation_ledger: "Registre d'évaluation",
          label_evaluation_desc:
            "Effectuez des évaluations standards à choix multiples pour débloquer les sujets du programme. Une note de passage de 85,0 % ou plus est strictly requise pour progresser.",
          label_evaluation_status: "Statut de l'évaluation",
          label_verbal_assistance: "Assistance verbale",
          label_verbal_assistance_desc:
            "Besoin d'aide ? Cliquez sur le bouton du micro et dites « Donne-moi un indice » de vive voix. Gemma 4 e4b analysera la feuille de questions et fournira des conseils socratiques sans révéler la réponse.",
          label_currently_studying: "ÉTUDIE ACTUELLEMENT",
          label_export_pdf: "EXPORTER EN PDF",
          label_switch_lesson: "PASSER À LA LEÇON",
          label_mastery_evaluation_panel_a:
            "Évaluation de maîtrise - Panneau A",
          label_sentry_vision_panel_b: "Vision sentinelle - Panneau B",
          label_live_desk_tracking: "SUIVI DU BUREAU EN DIRECT",
          label_socratic_hint: "Indice socratique :",
          label_resume_timer: "[REPRENDRE LE CHRONOMÈTRE]",
          label_submit_quiz: "[SOUMETTRE LA RÉPONSE]",
          label_more_practice_btn:
            "Plus de questions d'entraînement ({passed}/30 réussies)",
          quiz_status_mastery: "Maîtrise atteinte ({score}%)",
          quiz_detail_mastery:
            "Sujet complété avec succès. Navigation dans la chronologie déverrouillée.",
          quiz_status_locked: "Action requise : Verrouillé ({score}%)",
          quiz_detail_locked:
            "Le score est inférieur à l'exigence de 85 %. Série de questions alternatives active.",
          quiz_status_ready: "Prêt à commencer",
          quiz_detail_ready:
            "Aucune tentative enregistrée pour le moment. 85,0 % requis pour progresser.",
          toast_practice_completed: "Entraînement terminé",
          toast_practice_completed_desc:
            "Score d'entraînement : {score} %. Cela n'affecte pas le statut de votre cours.",
          toast_mastery_achieved: "Maîtrise atteinte !",
          toast_mastery_achieved_desc:
            "Score : {score} %. Leçon terminée avec succès.",
          toast_evaluation_failed: "Évaluation échouée",
          toast_evaluation_failed_desc:
            "Score : {score} %. Le score est inférieur au seuil de maîtrise de 85,0 %. Navigation dans la chronologie verrouillée.",
          interest_k12: "Éducation K-12",
          desc_k12: "Parcours de calcul",
          interest_prof: "Certificats professionnels",
          desc_prof: "Parcours de sciences de base",
          interest_college: "Niveau universitaire",
          desc_college: "Parcours de physique et chimie",
          interest_indep: "Apprenant indépendant",
          desc_indep: "Parcours de logique et philosophie",
          subject_calculus: "Calcul",
          subject_physics: "Physique",
          subject_chemistry: "Chimie",
          subject_philosophy: "Philosophie",
          subject_basic_science: "Sciences de base",
          label_practice_evaluation_panel_a: "Évaluation pratique - Panneau A",
          label_submit_practice_answers:
            "SOUMETTRE LES RÉPONSES D'ENTRAÎNEMENT",
          label_no_practice_questions:
            "Aucune question d'entraînement supplémentaire disponible pour cette leçon.",
          label_close_evaluation: "[✖ Fermer l'évaluation]",
          analyzing_workspace:
            "Analyse de l'espace de travail et réflexion sur les conseils socratiques...",
          track_format: "Parcours {subject}",
          label_file: "Fichier :",
          label_passed: "RÉUSSI",
          label_failed: "ÉCHOUÉ",
          label_evaluation_submission: "Soumission de l'évaluation",
          label_handwriting_note: "Note manuscrite",
          graphing_simulator_active: "Simulateur graphique actif.",
          subject_economics: "Économie",
          subject_k12_12th_sm_economics: "Économie & Calcul",
          subject_k12_12th_sm_chemistry: "Chimie",
          subject_k12_12th_sm_physics: "Physique",
          subject_k12_12th_sm_english_literature: "Littérature anglaise",
          subject_k12_12th_sm_world_history: "Histoire mondiale",
          subject_k12_1st_grade_english_language_arts:
            "Arts de la langue anglaise",
          subject_k12_1st_grade_introductory_science:
            "Introduction aux sciences",
          subject_k12_1st_grade_mathematics: "Mathématiques",
          subject_k12_12th_se_12th_grade: "12ème année (SE)",
          subject_k12_12th_se_1st_grade: "1ère année (SE)",
          subject_k12_12th_ss_12th_grade: "12ème année (SS)",
          subject_k12_12th_ss_1st_grade: "1ère année (SS)",
          subject_college_level_business_and_finance_corporate_finance:
            "Finance d'entreprise",
          subject_college_level_business_and_finance_macroeconomics:
            "Macroéconomie",
          subject_college_level_computer_science_data_structures:
            "Structures de données",
          subject_college_level_computer_science_data_structures_and_algorithms:
            "Structures de données & Algorithmes",
          subject_college_level_computer_science_neural_networks_and_deep_learning:
            "Réseaux de neurones & Apprentissage profond",
          subject_college_level_computer_science_operating_systems:
            "Systèmes d'exploitation",
          subject_college_level_engineering_electrical_circuits:
            "Circuits électriques",
          subject_college_level_engineering_mechanical_statics:
            "Statique mécanique",
          subject_college_level_mathematics_differential_equations:
            "Équations différentielles",
          subject_college_level_mathematics_linear_algebra: "Algèbre linéaire",
          subject_college_level_pre_med_biochemistry: "Biochimie",
          subject_college_level_pre_med_human_anatomy: "Anatomie humaine",
          subject_independent_learner_advanced_hobbies_amateur_rocketry:
            "Fusées amateurs",
          subject_independent_learner_advanced_hobbies_chess_grandmaster_strategy:
            "Stratégie de grand maître d'échecs",
          subject_independent_learner_creative_arts_digital_cinematography:
            "Cinématographie numérique",
          subject_independent_learner_creative_arts_music_theory_and_composition:
            "Théorie musicale & Composition",
          subject_independent_learner_language_acquisition_conversational_french:
            "Français conversationnel",
          subject_independent_learner_language_acquisition_mandarin_chinese:
            "Chinois mandarin",
          subject_independent_learner_philosophy_socratic_dialogues:
            "Dialogues socratiques",
          subject_independent_learner_philosophy_stoicism_and_ethics:
            "Stoïcisme & Éthique",
          subject_professional_certificates_cybersecurity_comptia_security_plus:
            "CompTIA Security+",
          subject_professional_certificates_cybersecurity_network_security:
            "Sécurité réseau",
          subject_professional_certificates_data_science_google_data_analytics:
            "Google Data Analytics",
          subject_professional_certificates_project_management_pmp_certification:
            "Certification PMP",
          subject_professional_certificates_software_engineering_aws_solutions_architect:
            "AWS Solutions Architect",
          subject_professional_certificates_software_engineering_cisco_ccna_networking:
            "Réseaux Cisco CCNA",
          group_1st_grade: "1ère année",
          group_10th_grade: "10ème année",
          group_12th_se: "12ème année (SE)",
          group_12th_sm: "12ème année (SM)",
          group_12th_ss: "12ème année (SS)",
          group_business_and_finance: "Affaires & Finance",
          group_computer_science: "Informatique",
          group_engineering: "Ingénierie",
          group_mathematics: "Mathématiques",
          group_pre_med: "Pré-médecine",
          group_advanced_hobbies: "Loisirs avancés",
          group_creative_arts: "Arts créatifs",
          group_language_acquisition: "Apprentissage des langues",
          group_philosophy: "Philosophie",
          group_cybersecurity: "Cybersécurité",
          group_data_science: "Science des données",
          group_project_management: "Gestion de projet",
          group_software_engineering: "Génie logiciel",
        },
        es_ES: {
          tab_tutor: "Tutor",
          tab_chat: "Chat",
          tab_flashcards: "Tarjetas",
          tab_timestamps: "Marcas de tiempo",
          tab_profile: "Perfil",
          tab_evaluation: "Evaluación",
          welcome_msg:
            "¡Bienvenido a la serie de conferencias! Seleccione su trayectoria o presione el botón de micrófono a continuación para iniciar la conversación y explorar temas juntos. ¡Comencemos a aprender!",
          mic_hint: '"Explique la relación entre estos tres vectores..."',
          active_lang: "Idioma activo del sistema",
          audio_mode: "Modo de audio de traducción de la clase",
          mesh_network: "Red de malla eSIM",
          mode_translated: "Audio traducido (Gemma + Piper)",
          mode_original: "Audio original (Voz del maestro)",
          label_socratic_hint: "Pista Socrática:",
          label_practice_evaluation_panel_a: "Evaluación de Práctica - Panel A",
          label_submit_practice_answers: "ENVIAR RESPUESTAS DE PRÁCTICA",
          label_no_practice_questions:
            "No hay preguntas de práctica adicionales disponibles para esta lección.",
          label_close_evaluation: "[✖ Cerrar Evaluación]",
          analyzing_workspace:
            "Analizando el espacio de trabajo y pensando en consejos socráticos...",
          track_format: "Trayectoria de {subject}",
          label_file: "Archivo:",
          label_passed: "APROBADO",
          label_failed: "REPROBADO",
          label_evaluation_submission: "Envío de Evaluación",
          label_handwriting_note: "Nota de escritura a mano",
          graphing_simulator_active: "Simulador gráfico activo.",
        },
        pt_PT: {
          tab_tutor: "Tutor",
          tab_chat: "Conversa",
          tab_flashcards: "Cartas de estudo",
          tab_timestamps: "Carimbos de data/hora",
          tab_profile: "Perfil",
          tab_evaluation: "Avaliação",
          welcome_msg:
            "Bem-vindo à série de palestras! Por favor, selecione a sua trajetória ou pressione o botão do microfone abaixo para iniciar a conversa e explorar tópicos juntos. Vamos começar a aprender!",
          mic_hint: '"Explique a relação entre estes três vetores..."',
          active_lang: "Idioma ativo do sistema",
          audio_mode: "Modo de áudio de tradução da aula",
          mesh_network: "Rede em malha eSIM",
          mode_translated: "Áudio nativo traduzido (Gemma + Piper)",
          mode_original: "Áudio original (Voz do professor)",
          label_socratic_hint: "Dica Socrática:",
          label_practice_evaluation_panel_a: "Avaliação Prática - Painel A",
          label_submit_practice_answers: "SUBMETER RESPOSTAS DE PRÁTICA",
          label_no_practice_questions:
            "Não há questões de prática adicionais disponíveis para esta lição.",
          label_close_evaluation: "[✖ Fechar Avaliação]",
          analyzing_workspace:
            "A analisar o espaço de trabalho e a pensar em conselhos socráticos...",
          track_format: "Percurso de {subject}",
          label_file: "Ficheiro:",
          label_passed: "APROVADO",
          label_failed: "REPROVADO",
          label_evaluation_submission: "Submissão de Avaliação",
          label_handwriting_note: "Nota manuscrita",
          graphing_simulator_active: "Simulador gráfico ativo.",
        },
        zh_CN: {
          tab_tutor: "导师",
          tab_chat: "聊天",
          tab_flashcards: "闪卡",
          tab_timestamps: "时间戳",
          tab_profile: "个人资料",
          tab_evaluation: "评估",
          welcome_msg:
            "欢迎来到课程系列！请选择您的学习路径或按下方的麦克风按钮开始对话，共同探索主题。让我们开始学习吧！",
          mic_hint: '"请解释这三个向量之间的关系..."',
          active_lang: "当前系统语言",
          audio_mode: "课程翻译音频模式",
          mesh_network: "eSIM 混合组网",
          mode_translated: "翻译本地音频 (Gemma + Piper)",
          mode_original: "原始音频 (老师原声)",
          label_socratic_hint: "苏格拉底式提示:",
          label_practice_evaluation_panel_a: "练习评估 - 面板 A",
          label_submit_practice_answers: "提交练习答案",
          label_no_practice_questions: "本课没有额外的练习题。",
          label_close_evaluation: "[✖ 关闭评估]",
          analyzing_workspace: "正在分析工作区并思考苏格拉底式建议...",
          track_format: "{subject}路径",
          label_file: "文件:",
          label_passed: "通过",
          label_failed: "未通过",
          label_evaluation_submission: "评估提交",
          label_handwriting_note: "手写笔记",
          graphing_simulator_active: "图形模拟器已激活。",
        },
        ar_AE: {
          tab_tutor: "المعلم",
          tab_chat: "الدردشة",
          tab_flashcards: "بطاقات الاستذكار",
          tab_timestamps: "الطوابع الزمنية",
          tab_profile: "الملف الشخصي",
          tab_evaluation: "التقييم",
          welcome_msg:
            "مرحبًا بكم في سلسلة المحاضرات! يرجى تحديد مسارك الدراسي أو الضغط على زر الميكروفون أدناه لبدء المحادثة واستكشاف المواضيع معًا. فلنبدأ التعلم!",
          mic_hint: '"اشرح العلاقة بين هذه المتجهات الثلاثة..."',
          active_lang: "لغة النظام النشطة",
          audio_mode: "وضع الصوت لترجمة المحاضرة",
          mesh_network: "شبكة eSIM المعقدة",
          mode_translated: "الصوت الأصلي المترجم (Gemma + Piper)",
          mode_original: "الصوت الأصلي (صوت المعلم)",
          graphing_simulator_active: "محاكي الرسوم البيانية نشط.",
        },
      };

      function translateClassroomUI(locale) {
        const strings = UI_LOCALIZATIONS[locale] || UI_LOCALIZATIONS["en_US"];
        const enStrings = UI_LOCALIZATIONS["en_US"];
        const getString = (key) =>
          strings[key] !== undefined ? strings[key] : enStrings[key];

        // Translate sidebar tab buttons
        const tabs = document.querySelectorAll(".sidebar-tabs button");
        if (tabs.length >= 6) {
          tabs[0].innerText = strings["tab_tutor"];
          tabs[1].innerText = strings["tab_chat"];
          tabs[2].innerText = strings["tab_flashcards"];
          tabs[3].innerText = strings["tab_timestamps"];
          tabs[4].innerText = strings["tab_profile"];
          tabs[5].innerText = strings["tab_evaluation"];
        }

        // Translate default welcome message if still matches any welcome
        const welcomeTextEl = document.querySelector(".tutor-card-body");
        if (welcomeTextEl) {
          const currentText = welcomeTextEl.innerText;
          const allWelcomes = Object.values(UI_LOCALIZATIONS).map(
            (l) => l.welcome_msg,
          );
          if (
            allWelcomes.includes(currentText) ||
            currentText.includes("Welcome to the lecture")
          ) {
            welcomeTextEl.innerText = strings["welcome_msg"];
          }
        }

        // Translate mic subtext hint
        const micHintEl = document.querySelector(".mic-subtext-hint");
        if (micHintEl) {
          micHintEl.innerText = strings["mic_hint"];
        }

        // Translate profile tab labels
        const activeLangLabel = document.getElementById(
          "activeSystemLanguageLabel",
        );
        if (activeLangLabel) activeLangLabel.innerText = strings["active_lang"];

        const audioModeLabel = document.getElementById(
          "lectureTranslationAudioLabel",
        );
        if (audioModeLabel) audioModeLabel.innerText = strings["audio_mode"];

        const esimMeshLabel = document.getElementById(
          "esimMeshNetworkingLabel",
        );
        if (esimMeshLabel) esimMeshLabel.innerText = strings["mesh_network"];

        // Translate selector options
        const audioModeSelect = document.getElementById(
          "lectureTranslationAudioMode",
        );
        if (audioModeSelect && audioModeSelect.options.length >= 2) {
          audioModeSelect.options[0].text = strings["mode_translated"];
          audioModeSelect.options[1].text = strings["mode_original"];
        }

        // Translate newly added classroom static elements
        document
          .querySelectorAll(".label-graphing-engine")
          .forEach((el) => (el.innerText = getString("label_graphing_engine")));
        document
          .querySelectorAll(".label-zoom")
          .forEach((el) => (el.innerText = getString("label_zoom")));
        document
          .querySelectorAll(".label-tangent-point")
          .forEach((el) => (el.innerText = getString("label_tangent_point")));
        document
          .querySelectorAll(".label-function-fx")
          .forEach((el) => (el.innerText = getString("label_function_fx")));
        document
          .querySelectorAll(".label-coordinates")
          .forEach((el) => (el.innerText = getString("label_coordinates")));
        document
          .querySelectorAll(".label-slope-dydx")
          .forEach((el) => (el.innerText = getString("label_slope_dydx")));
        document
          .querySelectorAll(".label-blackboard-canvas")
          .forEach(
            (el) => (el.innerText = getString("label_blackboard_canvas")),
          );

        const micStatus = document.getElementById("micStatusLabel");
        if (micStatus) micStatus.innerText = getString("label_raise_hand");

        const micTimer = document.getElementById("micTimerText");
        if (micTimer) {
          micTimer.innerText = isListening
            ? getString("label_listening_active")
            : getString("label_listening_idle");
        }

        const chatInput = document.getElementById("chatTextInput");
        if (chatInput)
          chatInput.placeholder = getString("label_chat_placeholder");

        const popoverExp = document.getElementById("labelPopoverExp");
        if (popoverExp) popoverExp.innerText = getString("label_popover_exp");

        const popoverPhone = document.getElementById("labelPopoverPhone");
        if (popoverPhone)
          popoverPhone.innerText = getString("label_popover_phone");

        document
          .querySelectorAll(".label-collaboration-studio")
          .forEach(
            (el) => (el.innerText = getString("label_collaboration_studio")),
          );
        document
          .querySelectorAll(".label-system-config")
          .forEach((el) => (el.innerText = getString("label_system_config")));
        document
          .querySelectorAll(".label-overhead-grader")
          .forEach((el) => (el.innerText = getString("label_overhead_grader")));
        document.querySelectorAll(".label-scan-btn").forEach((el) => {
          // Keep the SVG child, replace the text node
          for (let child of el.childNodes) {
            if (child.nodeType === Node.TEXT_NODE && child.nodeValue.trim()) {
              child.nodeValue = " " + getString("label_scan_btn");
              break;
            }
          }
        });
        document
          .querySelectorAll(".label-collaboration-broadcaster")
          .forEach(
            (el) =>
              (el.innerText = getString("label_collaboration_broadcaster")),
          );
        document.querySelectorAll(".label-broadcast-project").forEach((el) => {
          for (let child of el.childNodes) {
            if (child.nodeType === Node.TEXT_NODE && child.nodeValue.trim()) {
              child.nodeValue = " " + getString("label_broadcast_project");
              break;
            }
          }
        });
        document
          .querySelectorAll(".label-close")
          .forEach((el) => (el.innerText = getString("label_close")));
        document
          .querySelectorAll(".label-archives-title")
          .forEach((el) => (el.innerText = getString("label_archives_title")));

        const broadcastInput = document.getElementById("broadcastProjectTitle");
        if (broadcastInput)
          broadcastInput.placeholder = getString("label_broadcast_placeholder");

        // Translate recently generated flashcards header
        const recentHeader = document.querySelector(".recent-stack-header");
        if (recentHeader)
          recentHeader.innerText = getString("recently_generated");

        // Translate Index Landmark & Time header in Timestamps
        const timelineHeader = document.querySelector(
          ".terminal-timeline-header",
        );
        if (timelineHeader && timelineHeader.children.length >= 2) {
          timelineHeader.children[0].innerText = getString("index_landmark");
          timelineHeader.children[1].innerText = getString("time_col");
        }

        // Translate Done Reading button in PDF panel
        const doneReadingBtn = document.querySelector(
          '#pdfViewerPanel button[onclick*="completePDFReading"]',
        );
        if (doneReadingBtn)
          doneReadingBtn.innerText = getString("btn_done_reading");

        // Translate page indicator in PDF panel
        const pdfPageInd = document.getElementById("pdfPageIndicator");
        if (pdfPageInd && pdfPageInd.innerText.includes("Page 1")) {
          pdfPageInd.innerText = getString("pdf_page_indicator");
        }

        // Translate flashcard face headings
        document
          .querySelectorAll(".flashcard-front .flashcard-face-heading")
          .forEach((el) => (el.innerText = getString("definition")));
        document
          .querySelectorAll(".flashcard-back .flashcard-face-heading")
          .forEach((el) => (el.innerText = getString("answer")));

        // Translate flashcard hint button
        const hintBtn = document.getElementById("flashcardHintBtn");
        if (hintBtn) hintBtn.innerHTML = "💡 " + getString("show_hint");

        // Translate Downloaded Library Header
        const libraryTitleEl = document.querySelector(".library-title");
        if (libraryTitleEl) {
          const libText = "Downloaded Library";
          if (locale === "fr_FR") {
            libraryTitleEl.innerHTML =
              '<span style="margin-right: 6px;">📚</span>Bibliothèque téléchargée';
          } else if (locale === "en_US") {
            libraryTitleEl.innerHTML =
              '<span style="margin-right: 6px;">📚</span>Downloaded Library';
          } else {
            fetch(
              `/api/translate?text=${encodeURIComponent(libText)}&locale=${encodeURIComponent(locale)}`,
            )
              .then((res) => res.json())
              .then((data) => {
                const cleanText = (data.translated_text || libText).replace(
                  /^\[[^\]]+\]\s*/,
                  "",
                );
                libraryTitleEl.innerHTML = `<span style="margin-right: 6px;">📚</span>${cleanText}`;
              });
          }
        }

        // Translate Library Subject Groups
        document.querySelectorAll(".subject-title").forEach((el) => {
          if (!el.dataset.originalTitle) {
            el.dataset.originalTitle = el.innerText.trim();
          }
          const rawText = el.dataset.originalTitle;
          const textWithoutEmoji = rawText.replace(/^[^\s]+\s+/, "");
          const emoji = rawText.match(/^[^\s]+/)?.[0] || "";

          if (locale === "fr_FR") {
            el.innerText = emoji + " " + textWithoutEmoji;
          } else {
            fetch(
              `/api/translate?text=${encodeURIComponent(textWithoutEmoji)}&locale=${encodeURIComponent(locale)}`,
            )
              .then((res) => res.json())
              .then((data) => {
                const cleanText = (
                  data.translated_text || textWithoutEmoji
                ).replace(/^\[[^\]]+\]\s*/, "");
                el.innerText = emoji + " " + cleanText;
              });
          }
        });

        // Translate Library Book Names
        document.querySelectorAll(".book-item").forEach((el) => {
          const bookNameEl = el.querySelector(".book-name");
          if (!bookNameEl) return;

          if (!el.dataset.originalTitle) {
            el.dataset.originalTitle =
              bookNameEl.getAttribute("title") || bookNameEl.innerText.trim();
          }
          const origTitle = el.dataset.originalTitle;

          if (locale === "fr_FR") {
            bookNameEl.innerText = origTitle;
            bookNameEl.setAttribute("title", origTitle);
          } else {
            fetch(
              `/api/translate?text=${encodeURIComponent(origTitle)}&locale=${encodeURIComponent(locale)}`,
            )
              .then((res) => res.json())
              .then((data) => {
                const cleanText = (data.translated_text || origTitle).replace(
                  /^\[[^\]]+\]\s*/,
                  "",
                );
                bookNameEl.innerText = cleanText;
                bookNameEl.setAttribute("title", cleanText);
              });
          }
        });

        // Translate Profile and Evaluation Tab panes
        document
          .querySelectorAll(".label-mastery-level")
          .forEach((el) => (el.innerText = getString("label_mastery_level")));
        document
          .querySelectorAll(".label-knowledge-core-grid")
          .forEach(
            (el) => (el.innerText = getString("label_knowledge_core_grid")),
          );
        document
          .querySelectorAll(".label-sync-pdf")
          .forEach((el) => (el.innerText = getString("label_sync_pdf")));
        document
          .querySelectorAll(".label-learning-interests")
          .forEach(
            (el) => (el.innerText = getString("label_learning_interests")),
          );
        document
          .querySelectorAll(".label-evaluation-ledger")
          .forEach(
            (el) => (el.innerText = getString("label_evaluation_ledger")),
          );
        document
          .querySelectorAll(".label-evaluation-desc")
          .forEach((el) => (el.innerHTML = getString("label_evaluation_desc")));
        document
          .querySelectorAll(".label-evaluation-status")
          .forEach(
            (el) => (el.innerText = getString("label_evaluation_status")),
          );
        document
          .querySelectorAll(".label-verbal-assistance")
          .forEach(
            (el) => (el.innerText = getString("label_verbal_assistance")),
          );
        document
          .querySelectorAll(".label-verbal-assistance-desc")
          .forEach(
            (el) => (el.innerHTML = getString("label_verbal_assistance_desc")),
          );
        document
          .querySelectorAll(".label-mastery-evaluation-panel-a")
          .forEach(
            (el) =>
              (el.innerText = getString("label_mastery_evaluation_panel_a")),
          );
        document
          .querySelectorAll(".label-sentry-vision-panel-b")
          .forEach(
            (el) => (el.innerText = getString("label_sentry_vision_panel_b")),
          );
        document
          .querySelectorAll(".label-live-desk-tracking")
          .forEach(
            (el) => (el.innerText = getString("label_live_desk_tracking")),
          );
        document
          .querySelectorAll(".label-socratic-hint")
          .forEach((el) => (el.innerText = getString("label_socratic_hint")));
        document
          .querySelectorAll(".label-resume-timer")
          .forEach((el) => (el.innerText = getString("label_resume_timer")));
        document
          .querySelectorAll(".label-submit-quiz")
          .forEach((el) => (el.innerText = getString("label_submit_quiz")));
        document
          .querySelectorAll(".label-evaluation-submission")
          .forEach(
            (el) => (el.innerText = getString("label_evaluation_submission")),
          );
        document
          .querySelectorAll(".label-close-evaluation")
          .forEach(
            (el) => (el.innerText = getString("label_close_evaluation")),
          );

        // Force refresh dynamically generated components
        if (typeof renderKnowledgeCoreGrid === "function") {
          renderKnowledgeCoreGrid();
        }
        if (typeof renderProfileInterests === "function") {
          renderProfileInterests();
        }
        if (typeof updateMoreQuestionsButton === "function") {
          updateMoreQuestionsButton();
        }
        if (typeof renderQuizQuestions === "function") {
          renderQuizQuestions();
        }
      }

      function updateClassroomLocale(locale) {
        window.ACTIVE_DATABASE_LOCALE = locale;
        localStorage.setItem("classroomUserLocalePref", locale);
        if (recognition) {
          recognition.lang = locale.replace("_", "-");
          console.log(
            `[SPEECH] Classroom speech recognition language switched to: ${recognition.lang}`,
          );
        }

        // Translate the static dashboard UI elements instantly
        translateClassroomUI(locale);

        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.send(
            JSON.stringify({
              action: "UPDATE_LOCALE",
              name:
                window.ACTIVE_DATABASE_USER ||
                getActiveStudentName() ||
                "student_01",
              locale: locale,
            }),
          );
        }
        showToastNotification(
          "Language Changed",
          `System language preference set to ${locale}.`,
        );

        // Automatically adapt default audio translation mode when student matches teacher language
        const teacherLocale =
          window.ACTIVE_DATABASE_INSTRUCTOR_LOCALE || "en_US";
        if (locale === "en_US") {
          translationAudioMode = "original";
        } else {
          const storedAudioMode = localStorage.getItem(
            "lectureTranslationAudioMode",
          );
          translationAudioMode = storedAudioMode || "translated";
        }
        // Re-apply audio volume & mute state based on current locale and translation audio mode
        updateTranslationAudioMode(translationAudioMode);
      }

      function handleLectureTranscriptAudio(text) {
        const currentLocale = window.ACTIVE_DATABASE_LOCALE || "en_US";
        const teacherLocale =
          window.ACTIVE_DATABASE_INSTRUCTOR_LOCALE || "en_US";
        if (
          currentLocale === "en_US" &&
          translationAudioMode === "translated"
        ) {
          if (activeLectureAudio) {
            activeLectureAudio.pause();
            activeLectureAudio = null;
          }

          console.log("[GEMMA 4 E4B] Requesting translation for: ", text);
          fetch(
            `/api/translate?text=${encodeURIComponent(text)}&locale=${encodeURIComponent(currentLocale)}`,
          )
            .then((res) => res.json())
            .then((data) => {
              const translatedText = data.translated_text || text;
              const cleanText = translatedText.replace(/^\[[^\]]+\]\s*/, "");
              console.log(
                "[PIPER TTS] Synthesizing translated lecture text: ",
                cleanText,
              );

              const audioUrl =
                "/api/tts?locale=" +
                encodeURIComponent(currentLocale) +
                "&text=" +
                encodeURIComponent(cleanText);
              activeLectureAudio = new Audio(audioUrl);
              activeLectureAudio
                .play()
                .catch((err) =>
                  console.warn(
                    "Translated lecture audio playback failed:",
                    err,
                  ),
                );
            })
            .catch((err) =>
              console.error("[GEMMA 4 E4B] Translation failed:", err),
            );
        }
      }

      function typeTextSync(fullText, utterance) {
        const whiteboardText = document.getElementById("whiteboardText");
        if (!whiteboardText) return;

        const filteredText = filterMathematicalWrittenStream(fullText);
        whiteboardText.innerHTML = "";
        currentTypedIndex = 0;
        boundaryFired = false;

        const segments = parseSegments(filteredText);
        preRenderSegments(segments);
        const totalLength = getSegmentsTotalLength(segments);

        utterance.onboundary = function (event) {
          boundaryFired = true;
          const charIndex = event.charIndex;
          const progressRatio = charIndex / fullText.length;
          const index = Math.min(
            totalLength,
            Math.floor(progressRatio * totalLength),
          );

          if (index > currentTypedIndex) {
            whiteboardText.innerHTML = renderTypedSegments(segments, index);
            currentTypedIndex = index;
            whiteboardText.scrollTop = whiteboardText.scrollHeight;
          }
          if (charIndex >= fullText.length - 5 || progressRatio >= 0.98) {
            speechInProgress = false;
            if (fallbackTimer) clearInterval(fallbackTimer);
            document.getElementById("whiteboardStatus").innerText = "Complete";
          }
        };

        utterance.onstart = function () {
          speechInProgress = true;
          document.getElementById("whiteboardStatus").innerText = "Writing...";
          fallbackTimer = setInterval(() => {
            if (!boundaryFired && speechInProgress) {
              currentTypedIndex = Math.min(totalLength, currentTypedIndex + 2);
              whiteboardText.innerHTML = renderTypedSegments(
                segments,
                currentTypedIndex,
              );
              whiteboardText.scrollTop = whiteboardText.scrollHeight;
              if (currentTypedIndex >= totalLength) {
                clearInterval(fallbackTimer);
                speechInProgress = false;
                document.getElementById("whiteboardStatus").innerText =
                  "Complete";

                // Auto-play resume on fallback timer end
                if (isConversationSessionActive) {
                  handleAgentSpeechFinished();
                } else if (isVideoPausedBySentry) {
                  const video = document.getElementById("lectureVideoPlayer");
                  if (video && video.paused) {
                    video
                      .play()
                      .catch((e) =>
                        console.warn("Auto-play on fallback end failed:", e),
                      );
                  }
                  isVideoPausedBySentry = false;
                }
              }
            }
          }, 120);
        };

        utterance.onend = function () {
          speechInProgress = false;
          if (fallbackTimer) clearInterval(fallbackTimer);
          document.getElementById("whiteboardStatus").innerText = "Complete";

          if (isConversationSessionActive) {
            handleAgentSpeechFinished();
          } else if (isVideoPausedBySentry) {
            const video = document.getElementById("lectureVideoPlayer");
            if (video && video.paused) {
              video
                .play()
                .catch((e) =>
                  console.warn("Auto-play on speech end failed:", e),
                );
            }
            isVideoPausedBySentry = false;
          }
        };

        utterance.onerror = function () {
          speechInProgress = false;
          if (fallbackTimer) clearInterval(fallbackTimer);
          document.getElementById("whiteboardStatus").innerText = "Error";

          if (isConversationSessionActive) {
            handleAgentSpeechFinished();
          } else if (isVideoPausedBySentry) {
            const video = document.getElementById("lectureVideoPlayer");
            if (video && video.paused) {
              video
                .play()
                .catch((e) =>
                  console.warn("Auto-play on speech error failed:", e),
                );
            }
            isVideoPausedBySentry = false;
          }
        };
      }

      function triggerWhiteboardOverlay(data) {
        // Pause the main video
        const video = document.getElementById("lectureVideoPlayer");
        const btn = document.getElementById("playControlBtn");
        if (video && !video.paused) {
          video.pause();
          if (btn)
            btn.innerHTML =
              '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
          isVideoPausedBySentry = true; // Set state to indicate pause
        }

        // Hide RAG floating overlay to avoid visual clutter
        toggleRAGSimulation(false);

        // Determine targetState (A = Split Pane, B = Graph Only, C = Blackboard Only)
        let targetState = data.state_mode || "A";

        // Show the whiteboard split pane with targeted state
        toggleWhiteboard(true, targetState);

        const teacherLocale =
          window.ACTIVE_DATABASE_INSTRUCTOR_LOCALE || "en_US";

        const doSpeakAction = (textToSpeak) => {
          window.currentTutorSpeechText = textToSpeak || "";

          if (activeLocale !== "en_US") {
            fetch(
              `/api/tts?locale=${encodeURIComponent(activeLocale)}&text=${encodeURIComponent(textToSpeak)}`,
            ).catch((err) =>
              console.warn("Background TTS logger call failed:", err),
            );
          }

          if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel(); // Stop current speech
            const utterance = new SpeechSynthesisUtterance(
              cleanTextForSpeech(textToSpeak),
            );
            utterance.lang = activeLocale.replace("_", "-");

            const voices = window.speechSynthesis.getVoices();
            const matchedVoice =
              voices.find((v) =>
                v.lang
                  .toLowerCase()
                  .startsWith(utterance.lang.toLowerCase().split("-")[0]),
              ) ||
              voices.find((v) =>
                v.lang
                  .toLowerCase()
                  .startsWith(utterance.lang.toLowerCase().replace("_", "-")),
              ) ||
              voices[0];
            if (matchedVoice) utterance.voice = matchedVoice;

            typeTextSync(textToSpeak, utterance);

            if (data.action === "SPAWN_CANVAS" || data.mode === "voice") {
              // For graphing simulator and WebRTC voice sessions, type silently on the blackboard and skip speaking aloud
              setTimeout(() => {
                if (typeof utterance.onstart === "function") {
                  utterance.onstart();
                }
              }, 50);
            } else {
              window.speechSynthesis.speak(utterance);
            }
          } else {
            const filteredText = filterMathematicalWrittenStream(textToSpeak);
            const whiteboardText = document.getElementById("whiteboardText");
            if (whiteboardText) {
              whiteboardText.innerHTML = renderWhiteboardContent(filteredText);
              document.getElementById("whiteboardStatus").innerText =
                "Complete";
            }
            if (isConversationSessionActive) {
              handleAgentSpeechFinished();
            }
          }
        };

        if (activeLocale !== "en_US") {
          fetch(
            `/api/translate?text=${encodeURIComponent(data.socratic_text)}&locale=${encodeURIComponent(activeLocale)}`,
          )
            .then((res) => res.json())
            .then((transData) => {
              doSpeakAction(transData.translated_text || data.socratic_text);
            })
            .catch((err) => {
              console.warn(
                "Translation failed for tutor action speech, using original:",
                err,
              );
              doSpeakAction(data.socratic_text);
            });
        } else {
          doSpeakAction(data.socratic_text);
        }
      }

      async function toggleWhiteboard(show, state = "A") {
        const pane = document.getElementById("whiteboardSplitPane");
        const panelA = document.getElementById("whiteboardPanelA");
        const panelB = document.getElementById("whiteboardPanelB");

        if (pane) {
          if (show) {
            window.isWhiteboardExplicitlyClosed = false;
            pane.style.display = "";
            if (state === "B") {
              if (panelA) panelA.style.display = "flex";
              if (panelB) panelB.style.display = "none";
              pane.style.gridTemplateColumns = "100%";
              isSimulatorActive = true;
            } else if (state === "C") {
              if (panelA) panelA.style.display = "none";
              if (panelB) panelB.style.display = "flex";
              pane.style.gridTemplateColumns = "100%";
              isSimulatorActive = false;
            } else {
              if (panelA) panelA.style.display = "flex";
              if (panelB) panelB.style.display = "flex";
              pane.style.gridTemplateColumns = "1fr 1fr";
              isSimulatorActive = false;
            }
            pane.classList.add("active");
          } else {
            window.isWhiteboardExplicitlyClosed = true;
            pane.classList.remove("active");
            pane.style.display = "none";
            if (panelA) panelA.style.display = "none";
            if (panelB) panelB.style.display = "none";
            isSimulatorActive = false;

            // Cancel ongoing speech and typewriter animations
            if ("speechSynthesis" in window) {
              window.speechSynthesis.cancel();
            }
            speechInProgress = false;
            window.currentTutorSpeechText = "";
            if (fallbackTimer) {
              clearInterval(fallbackTimer);
              fallbackTimer = null;
            }

            // Forcefully resume main video playback with absolute structural playback override
            const lectureVideo = document.getElementById("lectureVideoPlayer");
            if (lectureVideo) {
              lectureVideo.muted = false;
              lectureVideo.paused = false;
              try {
                await lectureVideo.play();
                console.log("Playback release successful");
              } catch (err) {
                console.error("Playback fail error:", err);
              }

              const btn = document.getElementById("playControlBtn");
              if (btn) {
                btn.innerHTML =
                  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
              }
            }

            // Forcefully pass an absolute structural playback override command string directly over WebSocket port 8001
            if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
              wsConnection.send(
                JSON.stringify({
                  action: "PLAY_VIDEO_OVERRIDE",
                  command:
                    "lectureVideo.muted = false; lectureVideo.paused = false; await lectureVideo.play();",
                }),
              );
            }
          }
        }
        if (show) {
          isGraphLoopActive = true;
          if (graphAnimationFrameId) {
            cancelAnimationFrame(graphAnimationFrameId);
          }
          graphAnimationFrameId = requestAnimationFrame(animateCalculusGraph);
        } else {
          isGraphLoopActive = false;
          if (graphAnimationFrameId) {
            cancelAnimationFrame(graphAnimationFrameId);
            graphAnimationFrameId = null;
          }
          if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
          if (fallbackTimer) clearInterval(fallbackTimer);
          const statusLabel = document.getElementById("whiteboardStatus");
          if (statusLabel) statusLabel.innerText = "Inactive";
        }
      }
      // Global simulation states
      let dynamicSimActive = false;
      let dynamicSimParams = {};
      let dynamicSimExpr = "";
      let dynamicOscActive = false;
      let dynamicOscAngle = 0;
      let dynamicOscTime = 0;

      function renderDynamicA2UISimulation(payload) {
        const titleEl = document.getElementById("flutterA2UITitle");
        const mathEl = document.getElementById("dynamicMathExpr");
        const canvasEl = document.getElementById("dynamicSimulationCanvas");
        const slidersEl = document.getElementById("dynamicSlidersContainer");
        const debugEl = document.getElementById("flutterA2UIPayload");
        const statusEl = document.getElementById("dynamicStatus");

        dynamicSimActive = false;
        dynamicOscActive = false;
        dynamicSimParams = {};
        dynamicSimExpr = "";

        if (debugEl) {
          debugEl.innerText = JSON.stringify(payload, null, 2);
        }

        if (!payload) {
          if (titleEl) titleEl.innerText = "No simulation active";
          if (mathEl) mathEl.style.display = "none";
          if (slidersEl) slidersEl.innerHTML = "";
          if (statusEl) statusEl.innerText = "Idle";
          return;
        }

        const componentName = payload.component_name || "Dynamic Simulation";
        if (titleEl) titleEl.innerText = componentName;

        const widget = payload.widget || "FormulaDashboard";
        const properties = payload.properties || {};

        if (statusEl) statusEl.innerText = widget;

        if (widget === "FormulaDashboard") {
          if (mathEl && properties.math_representation) {
            mathEl.innerText = properties.math_representation;
            mathEl.style.display = "block";
          } else if (mathEl) {
            mathEl.style.display = "none";
          }

          dynamicSimExpr = properties.plot_expression || "";

          let slidersHtml = "";
          const slidersList = properties.sliders || [];
          slidersList.forEach((slider) => {
            dynamicSimParams[slider.key] = parseFloat(slider.value);

            slidersHtml += `
                        <div style="display:flex; flex-direction:column; gap:4px; width:100%;">
                            <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:#fff;">
                                <span>${slider.label} (${slider.key}):</span>
                                <span id="dynamicVal_${slider.key}" style="font-family:monospace; color:var(--primary);">${parseFloat(slider.value).toFixed(2)}</span>
                            </div>
                            <input type="range" class="range-slider" 
                                   min="${slider.min}" max="${slider.max}" step="${(slider.max - slider.min) / 100 || 0.05}" 
                                   value="${slider.value}" 
                                   oninput="updateDynamicSlider('${slider.key}', this.value)" 
                                   style="width:100%; pointer-events: auto !important;">
                        </div>
                    `;
          });
          if (slidersEl) slidersEl.innerHTML = slidersHtml;

          dynamicSimActive = true;
          drawDynamicSimulationGraph();
        } else if (
          widget === "ApplianceCanvas" ||
          widget === "DampedOscillatorSimulation"
        ) {
          if (mathEl) mathEl.style.display = "none";

          let dampingCoeff = parseFloat(
            properties.damping !== undefined
              ? properties.damping
              : properties.damping_coefficient !== undefined
                ? properties.damping_coefficient
                : 0.15,
          );
          dynamicSimParams["b"] = dampingCoeff;

          if (
            properties.damping_slider_active ||
            widget === "DampedOscillatorSimulation"
          ) {
            if (slidersEl) {
              slidersEl.innerHTML = `
                            <div style="display:flex; flex-direction:column; gap:4px; width:100%;">
                                <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:#fff;">
                                    <span>Damping Coefficient (b):</span>
                                    <span id="dynamicVal_b" style="font-family:monospace; color:var(--primary);">${dampingCoeff.toFixed(2)}</span>
                                </div>
                                <input type="range" class="range-slider" min="0.0" max="1.0" step="0.05" value="${dampingCoeff}" 
                                       oninput="updateDynamicSlider('b', this.value)" 
                                       style="width:100%; pointer-events: auto !important;">
                            </div>
                        `;
            }
          } else {
            if (slidersEl)
              slidersEl.innerHTML = `<div style="font-size:0.7rem; color:#888; font-style:italic; text-align:center;">Real-time Damped Wave Animation</div>`;
          }

          dynamicOscActive = true;
          startDynamicOscillatorAnimation();
        } else if (
          widget === "LogicWaferGrid" ||
          widget === "EpistemologyDiagram"
        ) {
          if (mathEl) mathEl.style.display = "none";
          if (slidersEl) {
            const concepts =
              properties.propositions ||
              (properties.central_concept
                ? [properties.central_concept]
                : ["Concept Network"]);
            let itemsHtml = `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">`;
            concepts.forEach((c) => {
              itemsHtml += `<span style="background:rgba(168,85,247,0.15); border:1px solid #a855f7; border-radius:4px; padding:3px 6px; font-size:0.65rem; color:#d8b4fe; font-family:monospace;">${c}</span>`;
            });
            itemsHtml += `</div>`;
            slidersEl.innerHTML = `
                        <div style="display:flex; flex-direction:column; gap:4px; width:100%;">
                            <span style="font-size:0.7rem; color:#aaa; font-weight:600;">Active Epistemic Logic Wafer:</span>
                            ${itemsHtml}
                        </div>
                    `;
          }

          drawDynamicLogicGrid();
        }
      }

      function updateDynamicSlider(key, value) {
        dynamicSimParams[key] = parseFloat(value);
        const valEl = document.getElementById(`dynamicVal_${key}`);
        if (valEl) valEl.innerText = parseFloat(value).toFixed(2);

        if (dynamicSimActive) {
          drawDynamicSimulationGraph();
        }
      }

      function drawDynamicSimulationGraph() {
        const canvas = document.getElementById("dynamicSimulationCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255,255,255,0.03)";
        for (let i = 20; i < canvas.width; i += 20) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let i = 20; i < canvas.height; i += 20) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(canvas.width, i);
          ctx.stroke();
        }

        if (!dynamicSimExpr) return;

        let evaluator = null;
        try {
          const keys = Object.keys(dynamicSimParams);
          let compiledExpr = dynamicSimExpr
            .replace(/\bpi\b/gi, "Math.PI")
            .replace(/\bsin\b/gi, "Math.sin")
            .replace(/\bcos\b/gi, "Math.cos")
            .replace(/\bsqrt\b/gi, "Math.sqrt")
            .replace(/\bpow\b/gi, "Math.pow");

          evaluator = new Function(
            "x",
            ...keys,
            `try { return (${compiledExpr}); } catch(e) { return 0; }`,
          );
        } catch (e) {
          console.warn("Dynamic formula compilation failed:", e);
          return;
        }

        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        const zoom = 40;
        let started = false;
        const vals = Object.values(dynamicSimParams);

        for (let px = 0; px < canvas.width; px++) {
          const x = (px - canvas.width / 2) / zoom;
          const y = evaluator(x, ...vals);

          if (typeof y === "number" && !isNaN(y) && isFinite(y)) {
            const py = canvas.height / 2 - y * zoom;
            if (!started) {
              ctx.moveTo(px, py);
              started = true;
            } else {
              ctx.lineTo(px, py);
            }
          }
        }
        ctx.stroke();
      }

      function startDynamicOscillatorAnimation() {
        const canvas = document.getElementById("dynamicSimulationCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        function animate() {
          if (!dynamicOscActive) return;

          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = canvas.parentElement.clientHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();

          ctx.strokeStyle = "#a855f7";
          ctx.lineWidth = 2.5;
          ctx.beginPath();

          const b = dynamicSimParams["b"] || 0.15;
          let started = false;

          for (let x = 0; x < canvas.width; x++) {
            const expDecay = Math.exp(-b * (x * 0.015));
            const y =
              canvas.height / 2 +
              Math.sin(x * 0.1 - dynamicOscTime) * 35 * expDecay;
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();

          const nodeX = 40;
          const nodeExpDecay = Math.exp(-b * (nodeX * 0.015));
          const nodeY =
            canvas.height / 2 +
            Math.sin(nodeX * 0.1 - dynamicOscTime) * 35 * nodeExpDecay;

          ctx.fillStyle = "#f43f5e";
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, 6, 0, 2 * Math.PI);
          ctx.fill();

          dynamicOscTime += 0.08;
          requestAnimationFrame(animate);
        }

        animate();
      }

      function drawDynamicLogicGrid() {
        const canvas = document.getElementById("dynamicSimulationCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(168,85,247,0.06)";
        ctx.lineWidth = 1;
        const step = 15;
        for (let x = 0; x < canvas.width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        const nodes = [
          {
            x: canvas.width * 0.25,
            y: canvas.height * 0.5,
            name: "Premise P",
            color: "#10b981",
          },
          {
            x: canvas.width * 0.5,
            y: canvas.height * 0.5,
            name: "Implication ->",
            color: "#a855f7",
          },
          {
            x: canvas.width * 0.75,
            y: canvas.height * 0.5,
            name: "Conclusion Q",
            color: "#00f0ff",
          },
        ];

        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(nodes[0].x, nodes[0].y);
        ctx.lineTo(nodes[1].x, nodes[1].y);
        ctx.lineTo(nodes[2].x, nodes[2].y);
        ctx.stroke();

        nodes.forEach((n) => {
          ctx.fillStyle = n.color;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 8, 0, 2 * Math.PI);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.font = "9px Geist, monospace";
          ctx.textAlign = "center";
          ctx.fillText(n.name, n.x, n.y - 14);
        });
      }

      // Floating RAG overlay widgets
      function triggerCanvasOverlay(data) {
        document.getElementById("canvasMarker").innerText =
          data.timestamp_marker || "00:00";
        document.getElementById("canvasSubject").innerText =
          (data.subject || "RAG Context") + " - Lecture Content";
        document.getElementById("canvasText").innerText =
          data.text_context || "No context matching found.";

        // Hydrate Flutter A2UI layout if present
        const flutterPanel = document.getElementById("flutterA2UISandbox");
        if (flutterPanel) {
          if (data.flutter_a2ui_payload) {
            renderDynamicA2UISimulation(data.flutter_a2ui_payload);
            flutterPanel.style.display = "flex";
            flutterPanel.classList.add("active");
          } else {
            renderDynamicA2UISimulation(null);
            flutterPanel.style.display = "none";
            flutterPanel.classList.remove("active");
          }
        }

        toggleRAGSimulation(true);

        // Append tutor answer in Chat feed tab
        appendChatMessage("AI TUTOR", data.text_context);

        const subject = (data.subject || "").toLowerCase();
        const textContext = (data.text_context || "").toLowerCase();

        const physPanel = document.getElementById("physicsSandbox");
        const philPanel = document.getElementById("philosophySandbox");
        const calcPanel = document.getElementById("calculusSandbox");

        const isCalculus =
          subject.includes("calculus") ||
          subject.includes("derivatives") ||
          textContext.includes("calculus") ||
          textContext.includes("derivatives");

        if (isCalculus) {
          oscAnimationActive = false;
          const oscCanvas = document.getElementById("oscillatorCanvas");
          if (oscCanvas) {
            const oscCtx = oscCanvas.getContext("2d");
            oscCtx.clearRect(0, 0, oscCanvas.width, oscCanvas.height);
          }

          physPanel.classList.remove("active");
          philPanel.classList.remove("active");
          if (calcPanel) calcPanel.classList.add("active");

          const tangentSlider = document.getElementById("tangentSlider");
          if (tangentSlider) {
            tangentPoint = parseFloat(tangentSlider.value);
          }
          drawCalculusGraph();
        } else if (subject.includes("physics")) {
          if (calcPanel) calcPanel.classList.remove("active");
          philPanel.classList.remove("active");
          physPanel.classList.add("active");
          startOscillatorAnimation();
        } else if (subject.includes("philosophy")) {
          physPanel.classList.remove("active");
          if (calcPanel) calcPanel.classList.remove("active");
          philPanel.classList.add("active");
        }
      }

      function toggleRAGSimulation(show) {
        const overlay = document.getElementById("canvasContainer");
        if (show) {
          overlay.classList.add("active");
          drawCalculusGraph();
        } else {
          overlay.classList.remove("active");
        }
      }

      // Physics sandboxes damped harmonic oscillator simulation
      let oscillatorAngle = 0;
      let dampingCoeff = 0.15;
      let oscAnimationActive = false;

      function startOscillatorAnimation() {
        if (oscAnimationActive) return;
        oscAnimationActive = true;

        const canvas = document.getElementById("oscillatorCanvas");
        const ctx = canvas.getContext("2d");
        let timeX = 0;

        function animate() {
          if (!oscAnimationActive) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw axes
          ctx.strokeStyle = "#222222";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();

          // Draw damped wave
          ctx.strokeStyle = "#a855f7";
          ctx.lineWidth = 2;
          ctx.beginPath();

          for (let x = 0; x < canvas.width; x++) {
            const expDecay = Math.exp(-dampingCoeff * (x * 0.015));
            const y =
              canvas.height / 2 + Math.sin(x * 0.1 - timeX) * 40 * expDecay;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          timeX += 0.1;
          requestAnimationFrame(animate);
        }
        animate();
      }

      function updateDamping(val) {
        dampingCoeff = parseFloat(val);
        document.getElementById("dampingValueText").innerText = val;
        const input = document.getElementById("dampingNumericVal");
        if (input) input.value = val;
      }

      // Calculus Tangent Point and graph module
      let tangentPoint = 1.0;
      let currentGraphFunction = "x*x*x - 3*x";

      function evaluateGraphFunction(x, expressionStr = currentGraphFunction) {
        try {
          // Sanitize and replace mathematical functions to JavaScript Math library calls
          let expr = expressionStr.trim();

          // Replace caret with double asterisk for exponentiation
          expr = expr.replace(/\^/g, "**");

          // Security check: Only allow letters, numbers, operators, parenthesises, commas, and whitespace
          if (
            /[^a-z0-9+\-*/().,\s]/i.test(expr.replace(/math\.[a-z]+/gi, ""))
          ) {
            return null;
          }

          // Replace common mathematical symbols with Math functions
          expr = expr
            .replace(/\bsin\b/gi, "Math.sin")
            .replace(/\bcos\b/gi, "Math.cos")
            .replace(/\btan\b/gi, "Math.tan")
            .replace(/\bsqrt\b/gi, "Math.sqrt")
            .replace(/\babs\b/gi, "Math.abs")
            .replace(/\bpow\b/gi, "Math.pow")
            .replace(/\bpi\b/gi, "Math.PI")
            .replace(/\be\b/gi, "Math.E")
            .replace(/\bln\b/gi, "Math.log")
            .replace(/\blog\b/gi, "Math.log10");

          // Evaluate the expression with 'x' mapped
          const evaluator = new Function(
            "x",
            `try { return (${expr}); } catch(e) { return null; }`,
          );
          const val = evaluator(x);
          return typeof val === "number" && !isNaN(val) && isFinite(val)
            ? val
            : null;
        } catch (e) {
          return null;
        }
      }

      function getSlopeAtPoint(x0, expressionStr = currentGraphFunction) {
        const h = 0.0001;
        const yPlus = evaluateGraphFunction(x0 + h, expressionStr);
        const yMinus = evaluateGraphFunction(x0 - h, expressionStr);
        if (yPlus !== null && yMinus !== null) {
          return (yPlus - yMinus) / (2 * h);
        }
        return 0.0;
      }

      function findXForY(targetY, expressionStr = currentGraphFunction) {
        let bestX = tangentPoint;
        let minDiff = Infinity;

        // Search range of slider: -2.5 to 2.5
        for (let x = -2.5; x <= 2.5; x += 0.01) {
          const y = evaluateGraphFunction(x, expressionStr);
          if (y !== null) {
            const diff = Math.abs(y - targetY);
            if (diff < minDiff) {
              minDiff = diff;
              bestX = x;
            }
          }
        }
        return bestX;
      }

      function updateTangentPoint(val) {
        tangentPoint = parseFloat(val);

        // Sync all value label texts
        document
          .querySelectorAll(".tangentValueTextClass, #tangentValueText")
          .forEach((el) => {
            el.innerText = tangentPoint.toFixed(2);
          });

        // Sync all numeric text inputs
        document
          .querySelectorAll(".tangentNumericValClass, #tangentNumericVal")
          .forEach((el) => {
            el.value = tangentPoint.toFixed(2);
          });

        // Sync all range slider inputs
        document
          .querySelectorAll(".tangentSliderClass, #tangentSlider")
          .forEach((el) => {
            el.value = val;
          });

        // Sync X coordinate inputs
        document.querySelectorAll(".graphInputXClass").forEach((el) => {
          if (document.activeElement !== el) {
            el.value = tangentPoint.toFixed(2);
          }
        });

        // Calculate and sync Y coordinate inputs
        const yVal = evaluateGraphFunction(tangentPoint);
        document.querySelectorAll(".graphInputYClass").forEach((el) => {
          if (document.activeElement !== el) {
            el.value = yVal !== null ? yVal.toFixed(2) : "N/A";
          }
        });

        drawCalculusGraph();
      }

      function parseNumericValue(valStr) {
        valStr = valStr.trim();
        if (!valStr) return null;

        if (valStr.includes("/")) {
          const parts = valStr.split("/");
          if (parts.length === 2) {
            const num = parseFloat(parts[0]);
            const den = parseFloat(parts[1]);
            if (!isNaN(num) && !isNaN(den) && den !== 0) {
              return num / den;
            }
          }
        }

        const num = parseFloat(valStr);
        return isNaN(num) ? null : num;
      }

      function drawCalculusGraph() {
        function drawOnCanvas(canvasId) {
          const canvas = document.getElementById(canvasId);
          if (!canvas) return;
          const ctx = canvas.getContext("2d");

          const parentWidth = canvas.parentElement.clientWidth || 400;
          const parentHeight = canvas.parentElement.clientHeight || 120;
          if (canvas.width !== parentWidth || canvas.height !== parentHeight) {
            canvas.width = parentWidth;
            canvas.height = parentHeight;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const zoom = parseFloat(canvas.getAttribute("data-zoom") || "1.0");
          const xMin = -3.0 / zoom,
            xMax = 3.0 / zoom;
          const yMin = -10.0 / zoom,
            yMax = 10.0 / zoom;

          function toScreenX(x) {
            return ((x - xMin) / (xMax - xMin)) * canvas.width;
          }
          function toScreenY(y) {
            return canvas.height - ((y - yMin) / (yMax - yMin)) * canvas.height;
          }

          // 1. Draw coordinate grid lines
          ctx.strokeStyle = "#18181b";
          ctx.lineWidth = 1;

          for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
            if (x === 0) continue;
            ctx.beginPath();
            ctx.moveTo(toScreenX(x), 0);
            ctx.lineTo(toScreenX(x), canvas.height);
            ctx.stroke();
          }
          for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += 2) {
            if (y === 0) continue;
            ctx.beginPath();
            ctx.moveTo(0, toScreenY(y));
            ctx.lineTo(canvas.width, toScreenY(y));
            ctx.stroke();
          }

          // 2. Draw major axes
          ctx.strokeStyle = "#4b5563";
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.moveTo(0, toScreenY(0));
          ctx.lineTo(canvas.width, toScreenY(0));
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(toScreenX(0), 0);
          ctx.lineTo(toScreenX(0), canvas.height);
          ctx.stroke();

          // Draw axes ticks and labels for all 4 quadrants
          ctx.fillStyle = "#888888";
          ctx.font = '9px "Geist", monospace';
          const yAxisScreenX = toScreenX(0);
          const xAxisScreenY = toScreenY(0);

          // X-axis ticks and labels
          let xStep = 1;
          const xRange = xMax - xMin;
          if (xRange > 10) xStep = 2;
          if (xRange > 20) xStep = 5;

          for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += xStep) {
            if (x === 0) continue;
            const sx = toScreenX(x);
            ctx.strokeStyle = "#4b5563";
            ctx.beginPath();
            ctx.moveTo(sx, xAxisScreenY - 3);
            ctx.lineTo(sx, xAxisScreenY + 3);
            ctx.stroke();

            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(x.toString(), sx, xAxisScreenY + 5);
          }

          // Y-axis ticks and labels
          let yStep = 2;
          const yRange = yMax - yMin;
          if (yRange > 20) yStep = 5;

          for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += yStep) {
            if (y === 0) continue;
            const sy = toScreenY(y);
            ctx.strokeStyle = "#4b5563";
            ctx.beginPath();
            ctx.moveTo(yAxisScreenX - 3, sy);
            ctx.lineTo(yAxisScreenX + 3, sy);
            ctx.stroke();

            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            let labelX = yAxisScreenX - 5;
            if (labelX < 10) {
              labelX = yAxisScreenX + 5;
              ctx.textAlign = "left";
            }
            ctx.fillText(y.toString(), labelX, sy);
          }

          // Axis labels (x, -x, y, -y)
          ctx.textAlign = "right";
          ctx.textBaseline = "bottom";
          ctx.fillText("x", canvas.width - 5, xAxisScreenY - 4);
          ctx.textAlign = "left";
          ctx.fillText("-x", 5, xAxisScreenY - 4);

          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText("y", yAxisScreenX + 5, 5);
          ctx.textBaseline = "bottom";
          ctx.fillText("-y", yAxisScreenX + 5, canvas.height - 5);

          // 3. Draw f(x) using custom evaluator
          function f(x) {
            const val = evaluateGraphFunction(x);
            return val !== null ? val : 0.0;
          }

          ctx.strokeStyle = "#00f0ff"; // neon cyan
          ctx.lineWidth = 2.5;
          ctx.beginPath();

          let first = true;
          for (let screenX = 0; screenX < canvas.width; screenX++) {
            const x = xMin + (screenX / canvas.width) * (xMax - xMin);
            const y = f(x);
            const screenY = toScreenY(y);

            if (first) {
              ctx.moveTo(screenX, screenY);
              first = false;
            } else {
              ctx.lineTo(screenX, screenY);
            }
          }
          ctx.stroke();

          // 4. Draw Tangent Line
          const x0 = tangentPoint;
          const y0 = f(x0);
          const m = getSlopeAtPoint(x0);

          function tangentY(x) {
            return m * (x - x0) + y0;
          }

          ctx.strokeStyle = "#a855f7"; // interactive purple tangent line
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(toScreenX(xMin), toScreenY(tangentY(xMin)));
          ctx.lineTo(toScreenX(xMax), toScreenY(tangentY(xMax)));
          ctx.stroke();
          ctx.setLineDash([]);

          // 5. Draw point marker
          ctx.fillStyle = "#a855f7"; // interactive purple point
          ctx.beginPath();
          ctx.arc(toScreenX(x0), toScreenY(y0), 5, 0, 2 * Math.PI);
          ctx.fill();

          // 6. Update readout metrics
          const metricPoint = document.getElementById("metricPointVal");
          const metricSlope = document.getElementById("metricSlopeVal");
          if (metricPoint)
            metricPoint.innerText = `(${x0.toFixed(2)}, ${y0.toFixed(2)})`;
          if (metricSlope) metricSlope.innerText = m.toFixed(2);

          // Update the new slope label text
          document.querySelectorAll(".graphSlopeTextClass").forEach((el) => {
            el.innerText = m.toFixed(2);
          });
        }

        drawOnCanvas("calculusCanvas");
        drawOnCanvas("calculusCanvasOld");
      }

      function changeMainGraphZoom(factor) {
        const canvas = document.getElementById("calculusCanvas");
        const canvasOld = document.getElementById("calculusCanvasOld");

        if (canvas) {
          let currentZoom = parseFloat(
            canvas.getAttribute("data-zoom") || "1.0",
          );
          if (factor === "reset") {
            currentZoom = 1.0;
          } else {
            currentZoom *= factor;
            currentZoom = Math.max(0.1, Math.min(10.0, currentZoom));
          }
          canvas.setAttribute("data-zoom", currentZoom.toString());
          if (canvasOld)
            canvasOld.setAttribute("data-zoom", currentZoom.toString());

          // Redraw both canvases
          drawOnCanvas("calculusCanvas");
          drawOnCanvas("calculusCanvasOld");
        }
      }

      function setupSimulationTwoWayBindings() {
        const dampingVal = document.getElementById("dampingNumericVal");
        const dampingSlider = document.getElementById("dampingSlider");
        if (dampingVal && dampingSlider) {
          dampingVal.value = dampingSlider.value;

          dampingVal.addEventListener("input", function (e) {
            const parsed = parseNumericValue(e.target.value);
            if (parsed !== null) {
              const clamped = Math.max(0.0, Math.min(1.0, parsed));
              dampingCoeff = clamped;
              dampingSlider.value = clamped;
              document.getElementById("dampingValueText").innerText =
                clamped.toFixed(2);
            }
          });

          dampingVal.addEventListener("blur", function (e) {
            const parsed = parseNumericValue(e.target.value);
            if (parsed !== null) {
              const clamped = Math.max(0.0, Math.min(1.0, parsed));
              e.target.value = clamped.toFixed(2);
            } else {
              e.target.value = dampingCoeff.toFixed(2);
            }
          });
        }

        // Multi-slider and numeric input synchronization setup
        const allTangentInputs = document.querySelectorAll(
          ".tangentNumericValClass, #tangentNumericVal",
        );
        allTangentInputs.forEach((input) => {
          input.addEventListener("input", function (e) {
            const parsed = parseNumericValue(e.target.value);
            if (parsed !== null) {
              const clamped = Math.max(-2.5, Math.min(2.5, parsed));
              updateTangentPoint(clamped);
            }
          });

          input.addEventListener("blur", function (e) {
            const parsed = parseNumericValue(e.target.value);
            if (parsed !== null) {
              const clamped = Math.max(-2.5, Math.min(2.5, parsed));
              e.target.value = clamped.toFixed(2);
            } else {
              e.target.value = tangentPoint.toFixed(2);
            }
          });
        });

        // Graph function expression input binding
        const allFunctionInputs = document.querySelectorAll(
          ".graphFunctionInputClass",
        );
        allFunctionInputs.forEach((input) => {
          input.addEventListener("input", function (e) {
            const expr = e.target.value;
            const testVal = evaluateGraphFunction(0, expr);
            const statusClass = document.querySelectorAll(
              ".graphStatusMessageClass",
            );
            if (testVal !== null) {
              currentGraphFunction = expr;
              statusClass.forEach((el) => {
                el.innerText = "Valid curve";
                el.style.color = "var(--outline)";
              });
              // Sync all other function inputs
              allFunctionInputs.forEach((other) => {
                if (other !== e.target) other.value = expr;
              });
              // Update tangent point to trigger graph update
              updateTangentPoint(tangentPoint);
            } else {
              statusClass.forEach((el) => {
                el.innerText = "Invalid expression";
                el.style.color = "#ef4444";
              });
            }
          });
        });

        // Graph X coordinate direct input binding
        const allGraphXInputs = document.querySelectorAll(".graphInputXClass");
        allGraphXInputs.forEach((input) => {
          input.addEventListener("input", function (e) {
            const parsed = parseNumericValue(e.target.value);
            if (parsed !== null) {
              const clamped = Math.max(-2.5, Math.min(2.5, parsed));
              updateTangentPoint(clamped);
              // Sync all other X inputs
              allGraphXInputs.forEach((other) => {
                if (other !== e.target) other.value = clamped.toFixed(2);
              });
            }
          });

          input.addEventListener("blur", function (e) {
            e.target.value = tangentPoint.toFixed(2);
          });
        });

        // Graph Y coordinate direct input binding
        const allGraphYInputs = document.querySelectorAll(".graphInputYClass");
        allGraphYInputs.forEach((input) => {
          input.addEventListener("input", function (e) {
            const parsed = parseNumericValue(e.target.value);
            if (parsed !== null) {
              // Search for corresponding X for this target Y
              const bestX = findXForY(parsed);
              updateTangentPoint(bestX);
              // Update the Y input value to show closest matched actual Y
              const actualY = evaluateGraphFunction(bestX);
              allGraphYInputs.forEach((other) => {
                if (other !== e.target)
                  other.value =
                    actualY !== null ? actualY.toFixed(2) : parsed.toFixed(2);
              });
            }
          });

          input.addEventListener("blur", function (e) {
            const yVal = evaluateGraphFunction(tangentPoint);
            e.target.value = yVal !== null ? yVal.toFixed(2) : "N/A";
          });
        });
      }

      // Socratic Dialogue refutation panel
      function handlePhilosophyRefute(event) {
        if (event.key === "Enter") {
          const input = document.getElementById("debateInput");
          const val = input.value.trim();
          if (!val) return;

          const box = document.getElementById("debateReplies");
          box.innerHTML += `<div style="color:var(--secondary); margin-bottom:4px;">&gt; ${val}</div>`;
          box.scrollTop = box.scrollHeight;
          input.value = "";

          // Simulate Socratic retort reply
          setTimeout(() => {
            box.innerHTML += `<div style="color:var(--primary); margin-bottom:4px;">Tutor: Are you certain of that definition? Let's check coordinates.</div>`;
            box.scrollTop = box.scrollHeight;
          }, 1000);
        }
      }

      // Synced PDF textbook side-panel drawer toggler (Transition to Split Screen Workspace)
      window.isWorkspaceActive = false;

      window.filterLibraryBooks = function (query) {
        const q = query.toLowerCase().trim();
        const groups = document.querySelectorAll(".subject-group");

        groups.forEach((group) => {
          const books = group.querySelectorAll(".book-item, .book-item-sub");
          let hasVisibleBook = false;

          books.forEach((book) => {
            const name = book
              .querySelector(".book-name")
              .innerText.toLowerCase();
            if (name.includes(q)) {
              book.style.display = "flex";
              hasVisibleBook = true;
            } else {
              book.style.display = "none";
            }
          });

          if (hasVisibleBook) {
            group.style.display = "block";
          } else {
            group.style.display = "none";
          }
        });
      };

      function toggleTextbook(forceSyncWithPlayingVideo = false) {
        const panel = document.getElementById("pdfViewerPanel");
        if (!panel) return;
        const isOpen = panel.classList.toggle("active");
        window.isTextbookDrawerOpen = isOpen;
        const video = document.getElementById("lectureVideoPlayer");

        if (isOpen) {
          // If opening via Book Icon or forceSync is requested, HARDEN the drawer PDF to match the active playing video!
          if (forceSyncWithPlayingVideo || window.activePlayingVideoPdfPath) {
            const frame = document.getElementById("pdfIframe");
            const titleLabel = document.getElementById("pdfTitleLabel");
            if (frame && window.activePlayingVideoPdfPath) {
              frame.src = window.activePlayingVideoPdfPath;
            }
            if (titleLabel && window.activePlayingVideoPdfTitle) {
              titleLabel.innerText = window.activePlayingVideoPdfTitle;
            }
          }

          // Pause main lecture video while reading textbook drawer
          if (video && !video.paused) {
            pauseVideoTimeline();
          }
        } else {
          // Resume / unpause video when closing textbook drawer
          window.isTextbookDrawerOpen = false;
          if (video && video.paused) {
            playVideoTimeline();
          }
        }
      }

      // Open Split Screen Study Workspace from Textbook Drawer
      function openSplitWorkspaceFromDrawer() {
        const panel = document.getElementById("pdfViewerPanel");
        if (panel) {
          panel.classList.remove("active");
        }
        window.isTextbookDrawerOpen = false;

        const workspacePane = document.getElementById("socraticWorkspacePane");
        const dashboardPane = document.getElementById("dashboardPane");
        const mainFrame = document.getElementById("pdfIframe");
        const wFrame = document.getElementById("workspacePdfIframe");
        const mainTitle = document.getElementById("pdfTitleLabel");
        const wTitle = document.getElementById("workspacePdfTitleLabel");

        if (!workspacePane || !dashboardPane) return;

        // Transition to split workspace view
        dashboardPane.classList.remove("active");
        workspacePane.classList.add("active");
        window.isWorkspaceActive = true;

        // Copy PDF src from drawer iframe to workspace iframe
        if (mainFrame && wFrame && mainFrame.src) {
          wFrame.src = mainFrame.src;
        }
        if (mainTitle && wTitle) {
          wTitle.innerText = mainTitle.innerText;
        }

        // Pause the main dashboard lecture video while studying
        pauseVideoTimeline();

        // Collapse right sidebar to maximize PDF space
        toggleRightSidebar("collapse");

        // Show toggle button only in split mode
        const toggleBtn = document.getElementById("sidebarToggleBtn");
        if (toggleBtn) toggleBtn.style.display = "flex";

        if (typeof window.triggerWorkspaceAvatarCheck === "function") {
          window.triggerWorkspaceAvatarCheck();
        }
        if (isScreenSharingActive) {
          showFloatingScreenShareAvatar(true);
        }

        showToastNotification(
          "Socratic Study Workspace",
          `${activeInstructorName} split-screen workspace active.`,
        );
        updateActiveViewState();
      }

      // Exit Split Screen Study Workspace back to Video dashboard
      function exitSplitWorkspace() {
        const workspacePane = document.getElementById("socraticWorkspacePane");
        const dashboardPane = document.getElementById("dashboardPane");
        if (workspacePane && dashboardPane) {
          workspacePane.classList.remove("active");
          dashboardPane.classList.add("active");
          window.isWorkspaceActive = false;
          window.isTextbookDrawerOpen = false;

          // Clear active workspace whiteboard history and content
          window.workspaceWhiteboardHistory = [];
          const whiteboardTextEl = document.getElementById(
            "workspaceWhiteboardText",
          );
          if (whiteboardTextEl) {
            whiteboardTextEl.innerHTML = "";
          }

          updateActiveViewState();

          // Clear active book metadata
          fetch("/api/active_book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdf_path: "", pdf_name: "" }),
          }).catch((err) => console.error("Failed to clear active book:", err));

          // Expand right sidebar to standard dashboard layout
          toggleRightSidebar("expand");

          // Hide toggle button
          const toggleBtn = document.getElementById("sidebarToggleBtn");
          if (toggleBtn) toggleBtn.style.display = "none";

          showToastNotification(
            "Returned to Lecture",
            "Main video dashboard active.",
          );
          if (isScreenSharingActive) {
            showFloatingScreenShareAvatar(true);
          }
        }
      }

      // Toggle Right Sidebar collapse/expand with drawer handle
      function toggleRightSidebar(forceState) {
        const sidebar = document.querySelector(".interaction-sidebar");
        const btn = document.getElementById("sidebarToggleBtn");
        if (!sidebar) return;

        if (forceState === "collapse") {
          sidebar.classList.add("collapsed");
          if (btn) btn.classList.add("collapsed");
        } else if (forceState === "expand") {
          sidebar.classList.remove("collapsed");
          if (btn) btn.classList.remove("collapsed");
          // Scroll tutor transcripts to bottom when expanded
          const container = document.getElementById("tutorTranscriptContainer");
          if (container) {
            setTimeout(() => {
              container.scrollTop = container.scrollHeight;
            }, 100);
          }
        } else {
          sidebar.classList.toggle("collapsed");
          if (btn) btn.classList.toggle("collapsed");
          if (!sidebar.classList.contains("collapsed")) {
            const container = document.getElementById(
              "tutorTranscriptContainer",
            );
            if (container) {
              setTimeout(() => {
                container.scrollTop = container.scrollHeight;
              }, 100);
            }
          }
        }

        window.dispatchEvent(new Event("resize"));
      }

      // Toggle Right Panel view: true = Whiteboard note, false = PDF Textbook
      function toggleWorkspaceWhiteboard(show) {
        const pdfView = document.getElementById("workspacePDFView");
        const whiteboardView = document.getElementById(
          "workspaceWhiteboardView",
        );

        if (pdfView && whiteboardView) {
          if (show) {
            whiteboardView.style.display = "flex";
          } else {
            whiteboardView.style.display = "none";
          }
          updateActiveViewState();
        }
      }

      let whiteboardTypewriterTimeout = null;
      window.workspaceWhiteboardHistory = [];

      function renderWorkspaceWhiteboardHistory(
        activeTutorMessageText = null,
        activeTutorMessageTime = "",
      ) {
        const whiteboardTextEl = document.getElementById(
          "workspaceWhiteboardText",
        );
        if (!whiteboardTextEl) return;

        let html = "";

        // Render historical messages in beautiful cards
        window.workspaceWhiteboardHistory.forEach((msg) => {
          if (msg.role === "user") {
            html += `
                        <div class="chat-msg-user" style="margin-bottom: 16px; display: flex; justify-content: flex-end; width: 100%;">
                            <div class="user-content-col" style="max-width: 80%;">
                                <div class="user-card-container" style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.2); padding: 12px; border-radius: 12px;">
                                    <div class="user-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.72rem; color: rgba(255,255,255,0.5);">
                                        <span class="user-header-label" style="font-weight: bold; color: var(--primary);">${getActiveStudentName()}</span>
                                        <span class="chat-message-time" style="margin-left: 8px;">${msg.time}</span>
                                    </div>
                                    <div class="user-body-text" style="color: #e4e4e7; font-size: 0.84rem;">${renderMathSymbolsInHtml(msg.text)}</div>
                                </div>
                            </div>
                            <div class="user-avatar-col" style="margin-left: 10px; display: flex; align-items: flex-start; justify-content: center;">
                                <div class="user-avatar-badge" style="background: var(--primary); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff;">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    `;
          } else {
            html += `
                        <div class="chat-msg-tutor" style="margin-bottom: 16px; display: flex; width: 100%;">
                            <div class="tutor-avatar-col" style="margin-right: 10px; display: flex; align-items: flex-start; justify-content: center;">
                                <div class="tutor-avatar-badge" style="width: 32px; height: 32px; border-radius: 50%; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100" style="width: 100%; height: 100%; object-fit: cover;" alt="Teacher Portrait">
                                </div>
                            </div>
                            <div class="tutor-content-col" style="max-width: 80%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 12px;">
                                <div class="tutor-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.72rem; color: rgba(255,255,255,0.5);">
                                    <span class="tutor-header-label" style="font-weight: bold; color: var(--primary);">${getActiveInstructor()}</span>
                                    <span class="chat-message-time" style="margin-left: 8px;">${msg.time}</span>
                                </div>
                                <div class="tutor-body-text" style="color: #e4e4e7; font-size: 0.84rem;">${renderMathSymbolsInHtml(msg.text)}</div>
                            </div>
                        </div>
                    `;
          }
        });

        // Append active typewriter message card if tutor is writing
        if (activeTutorMessageText !== null) {
          html += `
                    <div class="chat-msg-tutor" style="margin-bottom: 16px; display: flex; width: 100%;">
                        <div class="tutor-avatar-col" style="margin-right: 10px; display: flex; align-items: flex-start; justify-content: center;">
                            <div class="tutor-avatar-badge" style="width: 32px; height: 32px; border-radius: 50%; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100" style="width: 100%; height: 100%; object-fit: cover;" alt="Teacher Portrait">
                            </div>
                        </div>
                        <div class="tutor-content-col" style="max-width: 80%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 12px;">
                            <div class="tutor-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.72rem; color: rgba(255,255,255,0.5);">
                                <span class="tutor-header-label" style="font-weight: bold; color: var(--primary);">${getActiveInstructor()}</span>
                                <span class="chat-message-time" style="margin-left: 8px;">${activeTutorMessageTime}</span>
                            </div>
                            <div class="tutor-body-text" id="typewriterTargetText" style="color: #e4e4e7; font-size: 0.84rem; line-height: 1.6;"></div>
                        </div>
                    </div>
                `;
        }

        whiteboardTextEl.innerHTML = html;
        setTimeout(() => {
          whiteboardTextEl.scrollTop = whiteboardTextEl.scrollHeight;
        }, 50);
      }

      function writeUserToWorkspaceWhiteboard(text) {
        const timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        window.workspaceWhiteboardHistory.push({
          role: "user",
          text: text,
          time: timeStr,
        });
        renderWorkspaceWhiteboardHistory(null);
      }

      function writeToWorkspaceWhiteboard(text) {
        // Check if the text contains academic concepts like definitions, axioms, theorems, formulas, or LaTeX math blocks
        const lowerText = text.toLowerCase();
        const hasKeyword =
          lowerText.includes("definition") ||
          lowerText.includes("définition") ||
          lowerText.includes("axiom") ||
          lowerText.includes("axiome") ||
          lowerText.includes("theorem") ||
          lowerText.includes("théorème") ||
          lowerText.includes("formula") ||
          lowerText.includes("formule") ||
          lowerText.includes("$$") ||
          lowerText.includes("\\[") ||
          lowerText.includes("\\(") ||
          lowerText.includes("note:") ||
          lowerText.includes("important");

        if (hasKeyword) {
          toggleWorkspaceWhiteboard(true);
        }

        // Clear current typewriter timer if running
        if (whiteboardTypewriterTimeout) {
          clearTimeout(whiteboardTypewriterTimeout);
        }

        const timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Render older history plus a placeholder for the active typewriter message
        renderWorkspaceWhiteboardHistory("", timeStr);

        const whiteboardTextEl = document.getElementById(
          "typewriterTargetText",
        );
        if (!whiteboardTextEl) return;

        let i = 0;
        const statusIndicator = document.getElementById("tutorStatusIndicator");
        const glowRing = document.getElementById("avatarGlowRing");

        if (statusIndicator) statusIndicator.innerText = "Writing note...";
        if (glowRing) {
          glowRing.style.opacity = "1";
          glowRing.style.transform = "translate(-50%, -50%) scale(1.08)";
        }

        startAvatarVoiceWave();

        function typeChar() {
          if (i < text.length) {
            whiteboardTextEl.innerHTML = renderMathSymbolsInHtml(
              text.substring(0, i + 1),
            );
            i++;
            whiteboardTypewriterTimeout = setTimeout(typeChar, 25);
            const container = document.getElementById(
              "workspaceWhiteboardText",
            );
            if (container) container.scrollTop = container.scrollHeight;
          } else {
            if (statusIndicator)
              statusIndicator.innerText = `${activeInstructorName} is online`;
            if (glowRing) {
              glowRing.style.opacity = "0";
              glowRing.style.transform = "translate(-50%, -50%) scale(1.0)";
            }
            stopAvatarVoiceWave();

            // Push completed message to the history array
            window.workspaceWhiteboardHistory.push({
              role: "assistant",
              text: text,
              time: timeStr,
            });

            // Re-render completely statically
            renderWorkspaceWhiteboardHistory(null);
            updateActiveViewState();
          }
        }
        typeChar();
      }

      let isAvatarSpeaking = false;
      let avatarWaveAngle = 0;
      let avatarWaveAnimFrame = null;

      function startAvatarVoiceWave() {
        isAvatarSpeaking = true;
        const canvas = document.getElementById("avatarVoiceCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        // Adjust resolution
        canvas.width = canvas.offsetWidth || 300;
        canvas.height = canvas.offsetHeight || 40;

        function draw() {
          if (!isAvatarSpeaking) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Glowing primary wave
          ctx.strokeStyle = "rgba(168, 85, 247, 0.8)";
          ctx.shadowColor = "rgba(168, 85, 247, 0.5)";
          ctx.shadowBlur = 6;
          ctx.lineWidth = 2.5;
          ctx.beginPath();

          for (let x = 0; x < canvas.width; x++) {
            const y =
              canvas.height / 2 +
              Math.sin(x * 0.04 + avatarWaveAngle) * 8 +
              Math.cos(x * 0.08 - avatarWaveAngle * 0.7) * 4;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Secondary background wave
          ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
          ctx.shadowBlur = 0;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let x = 0; x < canvas.width; x++) {
            const y =
              canvas.height / 2 +
              Math.sin(x * 0.03 - avatarWaveAngle * 1.2) * 6 +
              Math.sin(x * 0.07 + avatarWaveAngle * 0.5) * 3;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          avatarWaveAngle += 0.12;
          avatarWaveAnimFrame = requestAnimationFrame(draw);
        }
        draw();
      }

      function stopAvatarVoiceWave() {
        isAvatarSpeaking = false;
        if (avatarWaveAnimFrame) {
          cancelAnimationFrame(avatarWaveAnimFrame);
          avatarWaveAnimFrame = null;
        }
        const canvas = document.getElementById("avatarVoiceCanvas");
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw a flat baseline
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
      }

      // Test compatibility functions
      function togglePdfReader() {
        toggleTextbook();
      }
      function syncPdfViewer(videoId) {
        loadTextbookPDF(videoId);
      }

      function completePDFReading() {
        const video = document.getElementById("lectureVideoPlayer");
        if (video) {
          video.pause();
          maxTimeWatched =
            video.duration && !isNaN(video.duration) && video.duration > 0
              ? video.duration
              : 999999;
        } else {
          maxTimeWatched = 999999;
        }

        // Close the PDF drawer
        const panel = document.getElementById("pdfViewerPanel");
        if (panel && panel.classList.contains("active")) {
          panel.classList.remove("active");
        }

        // Show toast notification
        showToastNotification(
          "PDF Lesson Completed",
          "You finished reading. Automatically routing to Evaluation.",
        );

        // Automatically route student to evaluation tab
        const evalBtn =
          document.getElementById("evaluationTabBtn") ||
          document.querySelector('[onclick*="evaluation"]');
        if (evalBtn) {
          switchSidebarTab("evaluation", evalBtn);
        }
      }

      // Populate the library content dynamically from SQLite lesson metadata
      async function populateDynamicLibrary() {
        try {
          const response = await fetch("/api/lessons");
          const data = await response.json();
          const lessons = data.lessons || [];

          const libraryContent = document.getElementById("libraryContent");
          if (!libraryContent) return;

          // Get active interests
          const selectedInterestsList = window.ACTIVE_DATABASE_INTERESTS
            ? window.ACTIVE_DATABASE_INTERESTS.split(",").map((s) => s.trim())
            : [selectedGoalTrack];

          // Map paths to interest tracks
          const getTrackFromPath = (path) => {
            const p = path.toLowerCase();
            if (p.includes("/k12/")) return "12th Grade";
            if (p.includes("/professional_certificates/")) return "5th Grade";
            if (p.includes("/college_level/")) return "College";
            if (p.includes("/independent_learner/")) return "Random Topics";
            if (p.includes("/philosophy/") || p.includes("/stoic/"))
              return "Random Topics";
            if (p.includes("/physics/") || p.includes("/chemistry/"))
              return "College";
            return "Random Topics";
          };

          // Extract subject from path
          const getSubjectFromPath = (path) => {
            const p = (path || "").toLowerCase();
            if (p.includes("gracian") || p.includes("stoic") || p.includes("philosophy")) return "Philosophy";
            if (p.includes("chemistry")) return "Chemistry";
            if (p.includes("economics")) return "Economics";
            if (p.includes("physics")) return "Physics";
            if (p.includes("biology")) return "Biology";
            if (p.includes("math") || p.includes("calculus")) return "Mathematics";

            const cleanParts = path.split("/").filter((pt) => pt && !pt.toLowerCase().endsWith(".pdf"));
            if (cleanParts.length === 0) return "General";
            let subject = cleanParts[cleanParts.length - 1] || "General";
            if (subject === "uploads" || subject === "textbooks" || subject === "curriculum_staging") {
              subject = "General";
            }
            return subject
              .replace(/_|-/g, " ")
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");
          };

          const getIconForSubject = (subj) => {
            const s = subj.toLowerCase();
            if (s.includes("math") || s.includes("calc")) return "📐";
            if (s.includes("phys")) return "⚛️";
            if (s.includes("econ") || s.includes("finance")) return "📊";
            if (s.includes("phil") || s.includes("logic")) return "🏛️";
            if (s.includes("chem")) return "🧪";
            if (s.includes("relig")) return "🛐";
            if (s.includes("net") || s.includes("hard") || s.includes("system"))
              return "💻";
            return "📚";
          };

          // All available curriculum & imported lessons (deduplicated by PDF path)
          const seenPdfPaths = new Set();
          const userLessons = lessons.filter((l) => {
            if (!l || !l.pdf_file_path) return false;
            const normPath = l.pdf_file_path.toLowerCase().trim();
            if (seenPdfPaths.has(normPath)) return false;
            seenPdfPaths.add(normPath);
            return true;
          });

          // Group by subject
          const subjects = {};
          userLessons.forEach((l) => {
            const subj = getSubjectFromPath(l.pdf_file_path);
            if (!subjects[subj]) subjects[subj] = [];
            subjects[subj].push(l);
          });

          // Render HTML
          let html = "";
          for (const [subj, list] of Object.entries(subjects)) {
            const icon = getIconForSubject(subj);
            html += `
                        <div class="subject-group">
                            <div class="subject-title">${icon} ${subj}</div>
                            <div class="book-list">
                    `;
            list.forEach((l) => {
              const pdfPath = l.pdf_file_path;
              const fileName = pdfPath.split("/").pop().replace(".pdf", "");
              const displayName = fileName
                .replace(/_|-/g, " ")
                .split(" ")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
              const bookId = `book-${l.video_id}`;
              html += `
                                <div class="book-item" id="${bookId}" onclick="loadLibraryPDF('${pdfPath}', '${displayName}', '${bookId}')">
                                    <span class="book-icon">${icon}</span>
                                    <span class="book-name" title="${displayName}">${displayName}</span>
                                </div>
                        `;
            });
            html += `
                            </div>
                        </div>
                    `;
          }

          if (html === "") {
            html = `<div style="padding: 12px; color: #888; font-style: italic; font-size: 0.75rem; text-align: center;">No course materials matching your interests.</div>`;
          }

          libraryContent.innerHTML = html;
          initCustomBooks();
        } catch (e) {
          console.error("Error populating library:", e);
        }
      }

      // Toggle the Digital Library collapsible section
      function toggleLibrarySection() {
        const content = document.getElementById("libraryContent");
        const icon = document.getElementById("libraryToggleIcon");
        if (content && icon) {
          content.classList.toggle("collapsed");
          if (content.classList.contains("collapsed")) {
            icon.innerText = "▶";
          } else {
            icon.innerText = "▼";
          }
        }
      }

      // Load a PDF from the library list dynamically
      function loadLibraryPDF(filePath, fileName, bookItemId) {
        const frame = document.getElementById("pdfIframe");
        const titleLabel = document.getElementById("pdfTitleLabel");
        const pageInd = document.getElementById("pdfPageIndicator");
        if (frame && titleLabel && pageInd) {
          // If it is an audiobook (ends with mp3 or wav), load via /audio_viewer
          const isAudio =
            filePath.toLowerCase().endsWith(".mp3") ||
            filePath.toLowerCase().endsWith(".wav");
          if (isAudio) {
            frame.src = `/audio_viewer?src=${encodeURIComponent(filePath)}&title=${encodeURIComponent(fileName)}`;
          } else {
            frame.src = filePath;
          }

          const locale = window.ACTIVE_DATABASE_LOCALE || "en_US";
          if (locale === "en_US") {
            titleLabel.innerText = `Library: ${fileName}`;
            showToastNotification(
              "Library PDF Loaded",
              `Now studying: ${fileName}`,
            );
          } else {
            titleLabel.innerText = `Library: Translating...`;
            fetch(
              `/api/translate?text=${encodeURIComponent(fileName)}&locale=${encodeURIComponent(locale)}`,
            )
              .then((res) => res.json())
              .then((data) => {
                const cleanName = (data.translated_text || fileName).replace(
                  /^\[[^\]]+\]\s*/,
                  "",
                );
                titleLabel.innerText = `Library: ${cleanName}`;
                const strings =
                  UI_LOCALIZATIONS[locale] || UI_LOCALIZATIONS["en_US"];
                const loadedMsg = strings["pdf_loaded"] || "Library PDF Loaded";
                const studyMsg =
                  strings["studying_msg"] || "Now studying: {file}";
                showToastNotification(
                  loadedMsg,
                  studyMsg.replace("{file}", cleanName),
                );
              })
              .catch((err) => {
                console.error("PDF name translation failed:", err);
                titleLabel.innerText = `Library: ${fileName}`;
                showToastNotification(
                  "Library PDF Loaded",
                  `Now studying: ${fileName}`,
                );
              });
          }

          pageInd.innerText = `File: ${filePath.split("/").pop()} | Socratic Study Mode`;

          // Highlight active book item
          document
            .querySelectorAll(".book-item")
            .forEach((el) => el.classList.remove("active"));
          const activeItem = document.getElementById(bookItemId);
          if (activeItem) {
            activeItem.classList.add("active");
          }

          // Notify backend of the active book PDF
          fetch("/api/active_book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdf_path: filePath, pdf_name: fileName }),
          }).catch((err) =>
            console.error("Failed to update active book:", err),
          );
        }
      }

      // Initialize and load custom uploaded books
      async function initCustomBooks() {
        try {
          const res = await fetch("/api/custom_books");
          const books = await res.json();
          books.forEach(addCustomBookToUI);
        } catch (err) {
          console.error("Failed to load custom books:", err);
        }
      }

      // Helper to add custom book to library list
      function addCustomBookToUI(book) {
        // Find subject group
        const titles = Array.from(document.querySelectorAll(".subject-title"));
        let targetGroup = titles.find((t) =>
          t.innerText.toLowerCase().includes(book.subject.toLowerCase()),
        );
        let bookList;

        if (targetGroup) {
          bookList = targetGroup.nextElementSibling;
        } else {
          // Create new subject group
          const content = document.getElementById("libraryContent");
          const groupDiv = document.createElement("div");
          groupDiv.className = "subject-group";
          groupDiv.innerHTML = `
                    <div class="subject-title">📚 ${book.subject}</div>
                    <div class="book-list"></div>
                `;
          content.appendChild(groupDiv);
          bookList = groupDiv.querySelector(".book-list");
        }

        if (bookList) {
          // Check if already exists by element ID or matching file name
          if (document.getElementById(book.id)) return;
          const existingNames = Array.from(document.querySelectorAll(".book-name")).map(el => el.innerText.trim().toLowerCase());
          const cleanBookName = (book.name || "").trim().toLowerCase();
          if (existingNames.includes(cleanBookName) || existingNames.includes(cleanBookName.replace(".pdf", ""))) return;

          const item = document.createElement("div");
          item.className = "book-item";
          item.id = book.id;
          const icon = book.type === "pdf" ? "📖" : "🎧";
          item.innerHTML = `
                    <span class="book-icon">${icon}</span>
                    <span class="book-name" title="${book.name}">${book.name}</span>
                `;
          item.onclick = () => loadLibraryPDF(book.path, book.name, book.id);
          bookList.appendChild(item);
        }
      }

      // Handle file upload
      async function handleLibraryFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        let subject = document.getElementById("uploadSubjectSelect").value;
        if (subject === "Other") {
          const customVal = document
            .getElementById("uploadSubjectCustomInput")
            .value.trim();
          if (!customVal) {
            showToastNotification(
              "Subject Required",
              "Please specify a name for your custom subject.",
            );
            return;
          }
          subject = customVal;
        }
        const statusText = document.getElementById("uploadStatusText");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("subject", subject);

        if (statusText) {
          statusText.style.display = "block";
          statusText.innerText = "Uploading & processing text...";
        }

        try {
          const res = await fetch("/api/upload_book", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.success && data.book) {
            addCustomBookToUI(data.book);
            loadLibraryPDF(data.book.path, data.book.name, data.book.id);
            showToastNotification(
              "Book Imported",
              `${file.name} is now available in your Socratic study library!`,
            );
            if (statusText) statusText.style.display = "none";
          } else {
            throw new Error(data.error || "Upload failed");
          }
        } catch (err) {
          console.error("Book upload failed:", err);
          showToastNotification(
            "Upload Error",
            err.message || "Failed to process text content.",
          );
          if (statusText) {
            statusText.style.color = "#ef4444";
            statusText.innerText = "Upload failed: " + (err.message || "error");
          }
        }
      }

      // Load specific handwritten PDF directly into synced textbook panel
      function openHandwrittenPDF(filePath, title) {
        const panel = document.getElementById("pdfViewerPanel");
        const frame = document.getElementById("pdfIframe");
        if (panel && frame) {
          frame.src = filePath;
          document.getElementById("pdfTitleLabel").innerText =
            `Handwriting: ${title}`;
          document.getElementById("pdfPageIndicator").innerText =
            `File: ${filePath.split("/").pop()} | Archive Sync Active`;
          if (!panel.classList.contains("active")) {
            panel.classList.add("active");
          }
          showToastNotification(
            "Handwriting Archive Sync",
            `Loaded student workbook: ${title}`,
          );
        }
      }

      async function loadTextbookPDF(
        videoId,
        time = null,
        clickedItem = null,
        chapterTitle = "",
      ) {
        console.log("[LOAD_TEXTBOOK] loadTextbookPDF called with:", videoId, "time:", time);
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
        
        // Immediately log active video progress to localStorage the very first second it loads across any subject
        let currentSub = "Economics";
        if (videoId.includes("chemistry")) currentSub = "Chemistry";
        else if (videoId.includes("physics")) currentSub = "Physics";
        else if (videoId.includes("philosophy")) currentSub = "Philosophy";
        else if (videoId.includes("math")) currentSub = "Mathematics";

        localStorage.setItem("lastActiveVideoId", videoId);
        localStorage.setItem("lastActiveVideo_" + currentSub, videoId);
        if (videoId.includes("sanitaire") || videoId.includes("alimentaire")) {
          localStorage.setItem("maxUnlockedVideo_" + currentSub, videoId);
        }

        try {
          console.log("[LOAD_TEXTBOOK] Fetching /api/lesson?video_id=" + videoId);
          const res = await fetch(`/api/lesson?video_id=${videoId}`);
          console.log("[LOAD_TEXTBOOK] HTTP status:", res.status);
          const data = await res.json();
          console.log("[LOAD_TEXTBOOK] Parsed data video_file_path:", data ? data.video_file_path : null);
          if (data) {
            if (data.blocked) {
              showDailyCapOverlay(data.reason);
              return;
            }
            if (data.video_id) {
              let resolvedTrack = selectedGoalTrack;
              if (data.video_id === "vid_economics_01")
                resolvedTrack = "k12/12th_SM/Economics";
              else if (data.video_id === "vid_physics_01")
                resolvedTrack = "k12/12th_SM/physics";
              else if (data.video_id === "vid_chemistry_organic_chemistry")
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
                  "chatHistory_" + data.video_id,
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
              const vLower = (data.video_id || videoId || "").toLowerCase();
              if (vLower.includes("sanitaire")) {
                subEl.innerText = "LES PROBLÈMES SANITAIRES";
              } else if (vLower.includes("alimentaire")) {
                subEl.innerText = "LES PROBLÈMES ALIMENTAIRES";
              } else if (vLower.includes("demographique")) {
                subEl.innerText = "LES PROBLÈMES DÉMOGRAPHIQUES";
              } else if (activeTitle) {
                subEl.innerText = activeTitle.toUpperCase();
              } else {
                subEl.innerText = "CHAPTER 1: EXTRA-ECONOMIC CHARACTERISTICS";
              }
            }
            if (data.video_id) {
              activeVideoId = data.video_id;
              window.ACTIVE_DATABASE_VIDEO_ID = data.video_id;
              
              // Persist per-subject last active video ID so subject switching never loses video progress
              const vLower = data.video_id.toLowerCase();
              if (vLower.includes("economics") || vLower.includes("extraeconomiques") || vLower.includes("probl_mes") || vLower.includes("sanitaire") || vLower.includes("demographique") || vLower.includes("alimentaire")) {
                localStorage.setItem("lastActiveVideo_Economics", data.video_id);
              } else if (vLower.includes("chemistry") || vLower.includes("chimie")) {
                localStorage.setItem("lastActiveVideo_Chemistry", data.video_id);
              } else if (vLower.includes("philosophy")) {
                localStorage.setItem("lastActiveVideo_Philosophy", data.video_id);
              }
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

              // ONE-SHOT MASTER TAB & DATA SYNC ON VIDEO LOAD
              fetch('/save_active_session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active_video_id: data.video_id, active_pdf_path: data.pdf_url })
              }).catch(err => console.warn('[SESSION SYNC WARN]', err));

              renderVideoSummary(data.video_id);
              toggleQuizView(false);
              selectedAnswers = {};
              isAlternativeQuizActive = false;
              renderQuizQuestions();
              loadProfileProgress();

              // Sync activeCharacterIndex so manual arrow clicks shift from the current active instructor
              const charIdx = CHARACTERS.findIndex(
                (c) => c.name === data.instructor_name,
              );
              if (charIdx !== -1) {
                activeCharacterIndex = charIdx;
              }

              // Sync floating webcam video src, fallback avatar image, and label to match this instructor
              const webcamVideo = document.getElementById("tutorWebcamMock");
              if (webcamVideo && data.video_file_path) {
                const srcPathname = new URL(
                  webcamVideo.src || "http://localhost",
                  window.location.origin,
                ).pathname.toLowerCase();
                const targetPath = (data.video_file_path || "").replace(
                  /\\/g,
                  "/",
                );
                const targetPathname = ("/" + targetPath)
                  .replace(/\/+/g, "/")
                  .toLowerCase();
                if (srcPathname !== targetPathname) {
                  webcamVideo.src = encodeURI(data.video_file_path);
                  webcamVideo.load();
                }
              }
              const webcamAvatar = document.getElementById("tutorWebcamAvatar");
              if (webcamAvatar && data.instructor_avatar) {
                webcamAvatar.src = data.instructor_avatar;
              }
              const academicTeacherLabel = document.getElementById(
                "academicTeacherLabel",
              );
              if (academicTeacherLabel) {
                academicTeacherLabel.innerText =
                  data.instructor_name || "Academic Teacher";
              }
            }
            if (data.pdf_file_path) {
              const fullPdfSrc = `${data.pdf_file_path}#page=${data.start_page}`;
              const fullPdfTitle = `Textbook: ${data.pdf_file_path.split("/").pop()}`;

              window.activePlayingVideoPdfPath = fullPdfSrc;
              window.activePlayingVideoPdfTitle = fullPdfTitle;

              const frame = document.getElementById("pdfIframe");
              if (frame) {
                frame.src = fullPdfSrc;
              }
              const titleLabel = document.getElementById("pdfTitleLabel");
              if (titleLabel) {
                titleLabel.innerText = fullPdfTitle;
              }
              const pageInd = document.getElementById("pdfPageIndicator");
              if (pageInd) {
                pageInd.innerText = `Synced page: ${data.start_page} | Auto Sync Active`;
              }

              // Also sync the split study workspace iframe
              const wFrame = document.getElementById("workspacePdfIframe");
              if (wFrame) {
                wFrame.src = `${data.pdf_file_path}#page=${data.start_page}`;
              }
              const wTitleLabel = document.getElementById(
                "workspacePdfTitleLabel",
              );
              if (wTitleLabel) {
                wTitleLabel.innerText = `Textbook: ${data.pdf_file_path.split("/").pop()}`;
              }
            }
            if (data.video_file_path) {
              const video = document.getElementById("lectureVideoPlayer");
              if (video) {
                let srcPathname = "";
                try {
                  srcPathname = new URL(
                    video.src,
                    window.location.origin,
                  ).pathname.toLowerCase();
                } catch (e) {}

                let targetPathname = "";
                try {
                  const targetUrl = data.video_file_path.startsWith("http")
                    ? data.video_file_path
                    : window.location.origin + "/" + data.video_file_path;
                  targetPathname = new URL(targetUrl).pathname.toLowerCase();
                } catch (e) {}

                console.log("[SEEK_DEBUG] video.src:", video.src);
                console.log("[SEEK_DEBUG] srcPathname:", srcPathname);
                console.log("[SEEK_DEBUG] targetPathname:", targetPathname);
                console.log("[SEEK_DEBUG] targetTimeSecs:", targetTimeSecs);

                const dbSavedTime = parseFloat(data.last_position || 0);
                const dbSavedMaxTime = parseFloat(data.max_position || 0);
                const localSavedTime = parseFloat(
                  localStorage.getItem("video_time_" + data.video_id) || "0"
                );
                const localSavedMaxTime = parseFloat(
                  localStorage.getItem("video_max_time_" + data.video_id) || "0"
                );

                let defaultLessonStartTime = 0;
                const vidCheck = (data.video_id || videoId || "").toLowerCase();
                if (vidCheck.includes("sanitaire")) {
                  defaultLessonStartTime = 72; // 01:12 in lecture video where teacher starts Les Problèmes Sanitaires
                } else if (vidCheck.includes("alimentaire")) {
                  defaultLessonStartTime = 61; // 01:01 in lecture video where teacher starts Les Problèmes Alimentaires
                }

                const rawSavedTime = dbSavedTime > 0 ? dbSavedTime : localSavedTime;
                const savedTime = rawSavedTime > 0 ? rawSavedTime : defaultLessonStartTime;
                const savedMaxTime = dbSavedMaxTime > 0 ? dbSavedMaxTime : localSavedMaxTime;
                const effectiveRestoreTime = targetTimeSecs !== null ? targetTimeSecs : savedTime;

                // Ensure maxTimeWatched is initialized to saved position so anti-seeking check doesn't reset it to 0
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
                }

                let restoreDone = false;
                const performSeekRestore = () => {
                  if (restoreDone) return;
                  restoreDone = true;
                  try {
                    window.isProgrammaticSeek = true;
                    if (effectiveRestoreTime > 0.5) {
                      console.log("[SEEK_DEBUG] Restoring video position to:", effectiveRestoreTime);
                      if (effectiveRestoreTime > maxTimeWatched) {
                        maxTimeWatched = effectiveRestoreTime;
                      }
                      video.currentTime = effectiveRestoreTime;
                    }
                    video
                      .play()
                      .catch((e) => {
                        console.log(
                          "[PLAY_DEBUG] Autoplay prevented play:",
                          e,
                        );
                        const playBtn = document.getElementById("playControlBtn");
                        if (playBtn) {
                          playBtn.innerHTML =
                            '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
                        }
                      });
                  } catch (e) {
                    console.warn("[SEEK_DEBUG] Seek restore failed:", e);
                  }
                };

                if (video.readyState >= 1) {
                  performSeekRestore();
                } else {
                  video.addEventListener("loadedmetadata", performSeekRestore, { once: true });
                  video.addEventListener("canplay", performSeekRestore, { once: true });
                }
              }
            }
            if (data.timestamps_status === "generating") {
              const listContainer = document.getElementById(
                "timestampChaptersList",
              );
              if (listContainer) {
                listContainer.innerHTML = `
                                <div style="font-family: 'Geist', monospace; font-size: 0.72rem; color: var(--primary); padding: 12px; border: 1px dashed var(--primary); border-radius: 8px; text-align: center; background-color: rgba(168, 85, 247, 0.05); margin-top: 10px;">
                                    ⏳ Qwen 3.5 Omni is indexing the video chapters...
                                </div>
                            `;
              }
            } else if (data.timestamps && data.timestamps.length > 0) {
              let category = selectedGoalTrack;

              // Parse timestamps into activeVideoTranscripts
              const sourceTranscripts =
                data.dense_transcripts && data.dense_transcripts.length > 0
                  ? data.dense_transcripts
                  : data.timestamps;
              activeVideoTranscripts = sourceTranscripts.map((ts) => {
                const parts = ts.timestamp.split(":");
                let timeSecs = 0;
                if (parts.length === 3) {
                  timeSecs =
                    parseInt(parts[0]) * 3600 +
                    parseInt(parts[1]) * 60 +
                    parseInt(parts[2]);
                } else if (parts.length === 2) {
                  timeSecs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                }
                // Get MM:SS format for visual pill
                const mm = Math.floor(timeSecs / 60)
                  .toString()
                  .padStart(2, "0");
                const ss = Math.floor(timeSecs % 60)
                  .toString()
                  .padStart(2, "0");
                const marker = `${mm}:${ss}`;

                return {
                  time: timeSecs,
                  marker: marker,
                  text: ts.text || ts.description,
                  translatedText: ts.translated_text,
                };
              });

              CURRICULA[category] = data.timestamps.map((ts, idx) => {
                const parts = ts.timestamp.split(":");
                let timeSecs = 0;
                if (parts.length === 3) {
                  timeSecs =
                    parseInt(parts[0]) * 3600 +
                    parseInt(parts[1]) * 60 +
                    parseInt(parts[2]);
                } else if (parts.length === 2) {
                  timeSecs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                }
                const mm = Math.floor(timeSecs / 60)
                  .toString()
                  .padStart(2, "0");
                const ss = Math.floor(timeSecs % 60)
                  .toString()
                  .padStart(2, "0");
                const marker = `${mm}:${ss}`;
                return {
                  time: marker,
                  title: ts.title,
                  active: idx === 0,
                  video_id: data.video_id,
                  chapter_id: "qwen_chapter_" + idx,
                };
              });

              renderCurriculumTimestamps(category);
              updateActiveTimestampHighlight();
            } else {
              activeVideoTranscripts = [];
            }
            if (data.flashcards && data.flashcards.length > 0) {
              let category = selectedGoalTrack;
              FLASHCARDS_DECKS[category] = data.flashcards;
              renderFlashcardsDeck(category);
            }
            renderVideoSummary(data.video_id);
            renderQuizQuestions();
            renderKnowledgeCoreGrid();
          }
        } catch (e) {
          console.error("Failed loading lesson PDF and video metadata: ", e);
        }
      }

      // Profile metrics modal toggler
      function toggleProfileModal() {
        console.log("[DEBUG] toggleProfileModal() was triggered!");
        const modal = document.getElementById("profileDropdown");
        const backdrop = document.getElementById("profileModalBackdrop");
        console.log("[DEBUG] DOM elements:", { modal, backdrop });

        if (modal) {
          modal.classList.toggle("active");
          console.log(
            "[DEBUG] Modal active state:",
            modal.classList.contains("active"),
          );
        }
        if (backdrop) {
          backdrop.classList.toggle("active");
          console.log(
            "[DEBUG] Backdrop active state:",
            backdrop.classList.contains("active"),
          );
        }
        if (modal && modal.classList.contains("active")) {
          loadProfileProgress();
        }
      }

      function setProgressRing(percent) {
        const circle = document.getElementById("profileProgressRing");
        const label = document.getElementById("profilePercentLabel");
        if (circle) {
          const radius = circle.r.baseVal.value;
          const circumference = 2 * Math.PI * radius;
          circle.style.strokeDasharray = `${circumference} ${circumference}`;
          const offset = circumference - (percent / 100) * circumference;
          circle.style.strokeDashoffset = offset;
        }
        if (label) {
          label.innerText = `${percent}%`;
        }
      }

      function triggerHandwrittenScanSubmit() {
        const select = document.getElementById("docCamSelect");
        const imagePath = select.value;

        const activeVid = window.activeVideoId || "vid_physics_01";
        const activeCh = window.currentChapterId || "physics_pendulums";

        if (imagePath && imagePath.startsWith("device:")) {
          const canvas = document.getElementById("sentryDeskCanvas");
          if (!canvas) return;

          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

          showToastNotification(
            "Capturing Snapshot",
            "Analyzing work from desk camera...",
          );
          appendChatMessage("YOU", `[Desk Camera Snapshot Submitted]`);

          if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
            wsConnection.send(
              JSON.stringify({
                action: "SUBMIT_HANDWRITING_IMAGE",
                image_data: dataUrl,
                video_id: activeVid,
                chapter_id: activeCh,
                quiz_type: "video_level",
                timestamp: "01:15",
              }),
            );
          }
        } else {
          showToastNotification(
            "Submitting Scan",
            `OCR Analyzing handwritten work: ${imagePath}`,
          );
          appendChatMessage(
            "YOU",
            `Submitted handwritten scan page:`,
            imagePath,
          );

          if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
            wsConnection.send(
              JSON.stringify({
                action: "SUBMIT_HANDWRITING",
                image_path: imagePath,
                video_id: activeVid,
                chapter_id: activeCh,
                quiz_type: "video_level",
                timestamp: "01:15",
              }),
            );
          }
        }
      }

      function handleGradeResult(data) {
        showToastNotification(
          data.passed ? "Evaluation Passed" : "Evaluation Failed",
          data.message,
        );

        // Reload user progress stats from SQLite
        loadProfileProgress();

        // Append grade result directly inside chat feed
        const resultMsg = data.passed
          ? `✦ GRADE RESULT: ${data.score}% | PASSED ✓\nCongratulations, your derivation is dimensionally correct!`
          : `✦ GRADE RESULT: ${data.score}% | FAILED ✗\nSocratic Feedback Hint: ${data.socratic_correction_hint}`;

        appendChatMessage("AI TUTOR", resultMsg);

        // If failed, automatically spawn the Canvas overlay with the Socratic correction hint
        if (!data.passed && data.socratic_correction_hint) {
          const socraticData = {
            subject: "Physics",
            timestamp_marker: "08:45",
            text_context: `[EVALUATION LOCK: FAILED]\nSocratic Feedback Hint:\n${data.socratic_correction_hint}`,
            flutter_a2ui_payload: data.flutter_a2ui_payload,
          };
          triggerCanvasOverlay(socraticData);
        } else if (data.passed) {
          const passData = {
            subject: "Physics",
            timestamp_marker: "08:45",
            text_context: `[EVALUATION UNLOCKED: PASSED]\nCongratulations, your derivation is correct!`,
            flutter_a2ui_payload: data.flutter_a2ui_payload,
          };
          triggerCanvasOverlay(passData);
        }
      }

      // Collaboration Studio projects creation
      function createMeshProject() {
        const input = document.getElementById("projectNameInput");
        const title = input.value.trim();
        if (!title) return;

        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.send(
            JSON.stringify({
              action: "BROADCAST_PROJECT",
              project_title: title,
              sender: "student_01",
            }),
          );
          showToastNotification(
            "Project Broadcasted",
            `Broadcasted '${title}' over eSIM Mesh nodes.`,
          );
        }
        input.value = "";
      }

      function triggerBroadcastProject() {
        const input = document.getElementById("broadcastProjectTitle");
        if (!input) return;
        const title = input.value.trim();
        if (!title) return;

        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          const senderName =
            window.ACTIVE_DATABASE_USER ||
            getActiveStudentName() ||
            "student_01";
          wsConnection.send(
            JSON.stringify({
              action: "BROADCAST_PROJECT",
              project_title: title,
              sender: senderName,
            }),
          );
          showToastNotification(
            "Project Broadcasted",
            `Broadcasted '${title}' over eSIM Mesh nodes.`,
          );
          input.value = "";
        } else {
          showToastNotification(
            "Broadcast Error",
            "Server connection offline. Unable to broadcast project.",
          );
        }
      }

      function handleReceivedProject(title, sender) {
        showToastNotification(
          "Shared Project Received",
          `'${title}' was broadcasted by classmate ${sender}.`,
        );
        // Add message in chat feed
        appendChatMessage(
          "AI TUTOR",
          `Classmate ${sender} initialized a shared eSIM Mesh project: '${title}'.`,
        );
      }

      // Load metrics progress stats
      // Student Profile Avatar Picker & Camera Photo Capture Manager
      let avatarCamStream = null;
      let activeAvatarDataUrl = null;

      window.openAvatarPickerModal = function () {
        console.log("[AVATAR PICKER] Opening avatar picker modal...");
        const modal = document.getElementById("avatarPickerModal");
        const backdrop = document.getElementById("avatarPickerModalBackdrop");
        if (modal) {
          modal.style.display = "block";
          modal.classList.add("active");
        }
        if (backdrop) {
          backdrop.style.display = "block";
          backdrop.classList.add("active");
        }

        const currentSaved = localStorage.getItem("user_profile_avatar");
        const previewImg = document.getElementById("avatarPickerPreviewImg");
        if (previewImg && currentSaved) {
          previewImg.src = currentSaved;
          activeAvatarDataUrl = currentSaved;
        }
      };

      window.closeAvatarPickerModal = function () {
        stopAvatarCamera();
        const modal = document.getElementById("avatarPickerModal");
        const backdrop = document.getElementById("avatarPickerModalBackdrop");
        if (modal) {
          modal.style.display = "none";
          modal.classList.remove("active");
        }
        if (backdrop) {
          backdrop.style.display = "none";
          backdrop.classList.remove("active");
        }
      };

      async function startAvatarCamera() {
        const video = document.getElementById("avatarCamVideo");
        const previewImg = document.getElementById("avatarPickerPreviewImg");
        const captureBtn = document.getElementById("avatarCamCaptureBtn");
        const statusText = document.getElementById("avatarPickerStatusText");

        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            avatarCamStream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (video) {
              video.srcObject = avatarCamStream;
              video.style.display = "block";
            }
            if (previewImg) previewImg.style.display = "none";
            if (captureBtn) captureBtn.style.display = "block";
            if (statusText) statusText.innerText = "Position your face in the camera frame and click Capture.";
          } else {
            showToastNotification("Camera Unavailable", "MediaDevices API not supported on this browser.");
          }
        } catch (err) {
          console.warn("[AVATAR CAM ERROR]", err);
          showToastNotification("Camera Error", "Unable to access camera: " + err.message);
        }
      }

      function stopAvatarCamera() {
        if (avatarCamStream) {
          avatarCamStream.getTracks().forEach((track) => track.stop());
          avatarCamStream = null;
        }
        const video = document.getElementById("avatarCamVideo");
        const previewImg = document.getElementById("avatarPickerPreviewImg");
        const captureBtn = document.getElementById("avatarCamCaptureBtn");

        if (video) video.style.display = "none";
        if (previewImg) previewImg.style.display = "block";
        if (captureBtn) captureBtn.style.display = "none";
      }

      function captureAvatarSnapshot() {
        const video = document.getElementById("avatarCamVideo");
        const previewImg = document.getElementById("avatarPickerPreviewImg");
        const statusText = document.getElementById("avatarPickerStatusText");

        if (!video || !video.videoWidth) {
          showToastNotification("Camera Error", "Video feed not ready yet.");
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");

        // Draw video flipped horizontally for natural selfie view
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        activeAvatarDataUrl = canvas.toDataURL("image/jpeg", 0.85);

        if (previewImg) {
          previewImg.src = activeAvatarDataUrl;
          previewImg.style.display = "block";
        }

        stopAvatarCamera();
        if (statusText) statusText.innerText = "Photo captured! Click Save Photo to apply.";
      }

      function handleAvatarGalleryUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
          activeAvatarDataUrl = e.target.result;
          const previewImg = document.getElementById("avatarPickerPreviewImg");
          const statusText = document.getElementById("avatarPickerStatusText");
          if (previewImg) {
            previewImg.src = activeAvatarDataUrl;
            previewImg.style.display = "block";
          }
          stopAvatarCamera();
          if (statusText) statusText.innerText = "Gallery picture loaded! Click Save Photo to apply.";
        };
        reader.readAsDataURL(file);
      }

      function resetAvatarToDefault() {
        const defaultAvatar = "/static/professor_evans_avatar.png";
        activeAvatarDataUrl = defaultAvatar;
        const previewImg = document.getElementById("avatarPickerPreviewImg");
        if (previewImg) previewImg.src = defaultAvatar;
        stopAvatarCamera();
        saveAvatarSelection();
      }

      function saveAvatarSelection() {
        if (!activeAvatarDataUrl) {
          activeAvatarDataUrl = "/static/professor_evans_avatar.png";
        }

        localStorage.setItem("user_profile_avatar", activeAvatarDataUrl);
        updateUserProfileAvatar(activeAvatarDataUrl);

        // Save to SQLite database via backend API
        const studentId = window.ACTIVE_DATABASE_USER || getActiveStudentName() || "Alseny";
        fetch("/api/save_profile_avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_id: studentId, avatar_data: activeAvatarDataUrl }),
        }).catch((err) => console.warn("Failed to persist avatar to DB:", err));

        showToastNotification("Profile Updated", "Your profile picture has been updated!");
        closeAvatarPickerModal();
      }

      function updateUserProfileAvatar(avatarUrl) {
        if (!avatarUrl) return;
        document.querySelectorAll(".user-profile-avatar-img").forEach((img) => {
          img.src = avatarUrl;
        });
        const headerImg = document.querySelector(".profile-avatar img");
        if (headerImg) headerImg.src = avatarUrl;
        const tabAvatar = document.getElementById("tabProfileCardAvatarImg");
        if (tabAvatar) tabAvatar.src = avatarUrl;
        const modalAvatar = document.getElementById("modalUserAvatarImg");
        if (modalAvatar) modalAvatar.src = avatarUrl;
      }

      async function loadProfileProgress() {
        try {
          const response = await fetch("/api/stats");
          const data = await response.json();
          if (data.error) return;

          // Hydrate student profile image from API or localStorage
          const currentStudent = window.ACTIVE_DATABASE_USER || getActiveStudentName() || "Alseny";
          const userObj = (data.users || []).find((u) => u.user_id === currentStudent);
          if (userObj && userObj.profile_image) {
            localStorage.setItem("user_profile_avatar", userObj.profile_image);
            updateUserProfileAvatar(userObj.profile_image);
          } else {
            const savedAvatar = localStorage.getItem("user_profile_avatar");
            if (savedAvatar) {
              updateUserProfileAvatar(savedAvatar);
            }
          }

          // Dynamically populate library from database
          populateDynamicLibrary();

          window.dbStudentProgress = data.progress || [];
          if (typeof updateCourseCardsUI === "function") {
            updateCourseCardsUI();
          }

          const mastery = data.mastery || [];
          const completedCount = mastery.filter(
            (m) => m.mastery_achieved,
          ).length;
          const totalCount = mastery.length;
          window.totalPassedMcqsCount = completedCount * 3;
          if (typeof updateMoreQuestionsButton === "function") {
            updateMoreQuestionsButton();
          }

          // Render combined archives list (Handwriting scans + MCQ Quiz Evaluation results)
          const archivesContainer = document.getElementById(
            "handwritingArchivesContainer",
          );
          if (archivesContainer) {
            const hwScans = (data.handwriting_archives || []).map((a) => ({
              type: "handwriting",
              subject: a.subject || "Physics",
              fileLabel: `File: ${a.image_path}`,
              image_path: a.image_path,
              score: a.score,
              passed: a.passed,
            }));

            const mcqAttempts = (data.mastery || []).map((m) => {
              let subjName = "Economics";
              if (m.video_id === "vid_physics_01") subjName = "Physics";
              else if (m.video_id === "vid_chemistry_organic_chemistry") subjName = "Chemistry";
              else if (m.video_id === "vid_philosophy_01") subjName = "Philosophy";
              return {
                type: "mcq",
                subject: subjName,
                fileLabel: `MCQ Evaluation (${m.video_id})`,
                image_path: null,
                score: m.score,
                passed: m.mastery_achieved,
              };
            });

            const combined = [...hwScans, ...mcqAttempts];

            if (combined.length === 0) {
              archivesContainer.innerHTML = `<div style="font-size:0.7rem; color:var(--outline); text-align:center; padding:10px;">No archived evaluation scans found.</div>`;
            } else {
              archivesContainer.innerHTML = "";
              combined.forEach((item) => {
                const card = document.createElement("div");
                card.className = "handwriting-archive-card";

                const leftSide = document.createElement("div");
                leftSide.style.display = "flex";
                leftSide.style.flexDirection = "column";
                leftSide.style.gap = "4px";

                const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
                const locStrings =
                  UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
                const getLocString = (key, fallback) =>
                  locStrings[key] !== undefined ? locStrings[key] : fallback;

                const subjectSpan = document.createElement("span");
                subjectSpan.style.fontWeight = "600";
                subjectSpan.style.color = "#ffffff";
                const transSubject = getLocString(
                  "subject_" + item.subject.toLowerCase().replace(" ", "_"),
                  item.subject,
                );
                subjectSpan.innerText = getLocString(
                  "track_format",
                  "{subject} Track",
                ).replace("{subject}", transSubject);

                const fileSpan = document.createElement("span");
                fileSpan.style.color = "var(--outline)";
                fileSpan.style.fontFamily = "'Geist', monospace";
                fileSpan.style.fontSize = "0.66rem";
                fileSpan.innerText = item.fileLabel;

                leftSide.appendChild(subjectSpan);
                leftSide.appendChild(fileSpan);

                const rightSide = document.createElement("div");
                rightSide.style.display = "flex";
                rightSide.style.alignItems = "center";
                rightSide.style.gap = "10px";

                const scoreSpan = document.createElement("span");
                scoreSpan.style.fontFamily = "'Geist', monospace";
                scoreSpan.style.fontWeight = "bold";
                scoreSpan.style.color = item.passed ? "#4ade80" : "#f87171";
                scoreSpan.innerText = `${item.score.toFixed(1)}%`;

                const badgeSpan = document.createElement("span");
                badgeSpan.style.background = item.passed
                  ? "rgba(74,222,128,0.1)"
                  : "rgba(248,113,113,0.1)";
                badgeSpan.style.color = item.passed ? "#4ade80" : "#f87171";
                badgeSpan.style.border = `1px solid ${item.passed ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`;
                badgeSpan.style.padding = "3px 8px";
                badgeSpan.style.borderRadius = "4px";
                badgeSpan.style.fontSize = "0.62rem";
                badgeSpan.style.fontWeight = "bold";
                badgeSpan.style.textTransform = "uppercase";
                badgeSpan.innerText = item.passed
                  ? getLocString("label_passed", "PASSED")
                  : getLocString("label_failed", "FAILED");

                rightSide.appendChild(scoreSpan);
                rightSide.appendChild(badgeSpan);

                card.appendChild(leftSide);
                card.appendChild(rightSide);

                if (item.image_path) {
                  card.addEventListener("click", () => {
                    openHandwritingLightbox(
                      item.image_path,
                      item.subject,
                      item.score,
                      item.passed,
                    );
                  });
                }

                archivesContainer.appendChild(card);
              });
            }
          }

          const milestonesVal = document.getElementById("profileMilestonesVal");
          if (milestonesVal) {
            milestonesVal.innerText = `${completedCount} of ${totalCount} milestones completed`;
          }

          // Update overall progress ring
          const totalPct =
            totalCount > 0
              ? Math.round((completedCount / totalCount) * 100)
              : 0;
          setProgressRing(totalPct);

          // Update range slider and label in the profile tab pane
          const profileSlider = document.getElementById("profileMasterySlider");
          const profileSliderText = document.getElementById(
            "profileSliderPercentText",
          );
          if (profileSlider) profileSlider.value = totalPct;
          if (profileSliderText) profileSliderText.innerText = `${totalPct}%`;

          // Get track from user context and render curriculum
          if (data.users && data.users.length > 0) {
            let lastUser = data.users.find(
              (u) => u.user_id === activeStudentName,
            );
            if (!lastUser) {
              lastUser = data.users[data.users.length - 1];
            }
            activeStudentName = lastUser.user_id || activeStudentName;

            // Sync student locale from database preference
            if (lastUser.locale) {
              window.ACTIVE_DATABASE_LOCALE = lastUser.locale;
              const localeSel = document.getElementById(
                "classroomLocaleSelect",
              );
              if (localeSel) {
                localeSel.value = lastUser.locale;
              }
              if (typeof translateClassroomUI === "function") {
                translateClassroomUI(lastUser.locale);
              }

              // Automatically adapt audio translation mode based on matching locale
              const teacherLocale =
                window.ACTIVE_DATABASE_INSTRUCTOR_LOCALE || "en_US";
              if (lastUser.locale === teacherLocale) {
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
            }

            document.querySelectorAll(".user-header-label").forEach((el) => {
              el.innerText = activeStudentName;
            });

            let bgContext =
              lastUser.background_context ||
              window.ACTIVE_DATABASE_TRACK ||
              "k12/12th_SM/Economics";
            let rawInterests = "";
            if (bgContext.includes("|")) {
              let parts = bgContext.split("|");
              if (parts.length > 2 && parts[2].startsWith("subjects:")) {
                rawInterests = parts[2].substring(9);
              } else {
                rawInterests = parts[0];
              }
              if (!selectedGoalTrack || selectedGoalTrack === "College") {
                selectedGoalTrack = parts[1];
              }
            } else {
              rawInterests = bgContext;
              if (!selectedGoalTrack || selectedGoalTrack === "College") {
                selectedGoalTrack = bgContext;
              }
            }
            if (selectedGoalTrack.startsWith("vid_")) {
              if (selectedGoalTrack === "vid_economics_01")
                selectedGoalTrack = "k12/12th_SM/Economics";
              else if (selectedGoalTrack === "vid_physics_01")
                selectedGoalTrack = "k12/12th_SM/physics";
              else if (selectedGoalTrack === "vid_chemistry_organic_chemistry")
                selectedGoalTrack = "k12/12th_SM/chemistry";
              else if (selectedGoalTrack === "vid_philosophy_01")
                selectedGoalTrack =
                  "independent_learner/philosophy/stoicism_and_ethics";
              else if (selectedGoalTrack === "vid_physics_02")
                selectedGoalTrack = "k12/1st_grade/mathematics";
            }
            window.ACTIVE_DATABASE_INTERESTS =
              migrateInterests(rawInterests).join(",");

            if (
              selectedGoalTrack === "k12/12th_grade/mathematics/calculus" ||
              selectedGoalTrack === "calculus" ||
              selectedGoalTrack === "12th Grade"
            ) {
              selectedGoalTrack = "k12/12th_SM/Economics";
            }
            const urlParams = new URLSearchParams(window.location.search);
            const layoutParam = urlParams.get("layout");
            if (layoutParam === "k12/12th_grade/mathematics/calculus") {
              selectedGoalTrack = "k12/12th_SM/Economics";
              // Clear the layout search parameter to prevent sticky overrides on refresh or stats reload
              try {
                urlParams.delete("layout");
                const newSearch = urlParams.toString();
                const newUrl =
                  window.location.pathname + (newSearch ? "?" + newSearch : "");
                window.history.replaceState({}, document.title, newUrl);
              } catch (historyErr) {
                console.warn(
                  "Could not replace history state (likely file:// protocol):",
                  historyErr,
                );
              }
            }

            const profileStudentId =
              document.getElementById("profileStudentId");
            if (profileStudentId) profileStudentId.innerText = lastUser.user_id;

            const studentNameText = document.getElementById(
              "profileStudentNameText",
            );
            const studentTrackText = document.getElementById(
              "profileStudentTrackText",
            );
            if (studentNameText) studentNameText.innerText = lastUser.user_id;

            let label = selectedGoalTrack.split("/").pop().replace(/_/g, " ");
            label = label
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");

            const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
            const locStrings =
              UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
            const getLocString = (key, fallback) =>
              locStrings[key] !== undefined ? locStrings[key] : fallback;
            const trackDisplayNameTrans = getLocString(
              "subject_" + label.toLowerCase().replace(/[\/\s]/g, "_"),
              label,
            );
            if (studentTrackText)
              studentTrackText.innerText = getLocString(
                "track_format",
                "{subject} Track",
              ).replace("{subject}", trackDisplayNameTrans);
          } else {
            if (window.ACTIVE_DATABASE_TRACK) {
              selectedGoalTrack = window.ACTIVE_DATABASE_TRACK;
            }
            if (selectedGoalTrack.startsWith("vid_")) {
              if (selectedGoalTrack === "vid_economics_01")
                selectedGoalTrack = "k12/12th_SM/Economics";
              else if (selectedGoalTrack === "vid_physics_01")
                selectedGoalTrack = "k12/12th_SM/physics";
              else if (selectedGoalTrack === "vid_chemistry_organic_chemistry")
                selectedGoalTrack = "k12/12th_SM/chemistry";
              else if (selectedGoalTrack === "vid_philosophy_01")
                selectedGoalTrack =
                  "independent_learner/philosophy/stoicism_and_ethics";
              else if (selectedGoalTrack === "vid_physics_02")
                selectedGoalTrack = "k12/1st_grade/mathematics";
            }
            if (
              window.ACTIVE_DATABASE_INTERESTS === undefined ||
              window.ACTIVE_DATABASE_INTERESTS === null
            ) {
              if (window.ACTIVE_DATABASE_TRACK) {
                window.ACTIVE_DATABASE_INTERESTS = window.ACTIVE_DATABASE_TRACK;
              } else {
                window.ACTIVE_DATABASE_INTERESTS = "k12/12th_SM/Economics";
              }
            }
            window.ACTIVE_DATABASE_INTERESTS = migrateInterests(
              window.ACTIVE_DATABASE_INTERESTS,
            ).join(",");
            const nameToUse = activeStudentName || "student_01";
            document.querySelectorAll(".user-header-label").forEach((el) => {
              el.innerText = nameToUse;
            });
            const studentNameText = document.getElementById(
              "profileStudentNameText",
            );
            const studentTrackText = document.getElementById(
              "profileStudentTrackText",
            );
            if (studentNameText) studentNameText.innerText = nameToUse;

            let label = selectedGoalTrack.split("/").pop().replace(/_/g, " ");
            label = label
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");

            const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
            const locStrings =
              UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
            const getLocString = (key, fallback) =>
              locStrings[key] !== undefined ? locStrings[key] : fallback;
            const trackDisplayNameTrans = getLocString(
              "subject_" + label.toLowerCase().replace(/[\/\s]/g, "_"),
              label,
            );
            if (studentTrackText)
              studentTrackText.innerText = getLocString(
                "track_format",
                "{subject} Track",
              ).replace("{subject}", trackDisplayNameTrans);
          }

          const oldTrack = window.currentTrack;
          window.currentTrack = selectedGoalTrack;
          const trackChanged = !!(oldTrack && oldTrack !== selectedGoalTrack);
          // Only initialize default video player source if track has changed post-boot or activeVideoId is not set
          if (!activeVideoId || (oldTrack && oldTrack !== selectedGoalTrack)) {
            let targetVideoId = selectedGoalTrack;
            if (
              selectedGoalTrack === "12th Grade" ||
              selectedGoalTrack === "calculus" ||
              selectedGoalTrack === "k12/12th_SM/Economics"
            ) {
            const localEcon = localStorage.getItem("lastActiveVideo_Economics");
            const serverVid = window.ACTIVE_DATABASE_VIDEO_ID;
            const savedEcon = (localEcon && localEcon.includes("sanitaire")) ? localEcon : (serverVid || localEcon || localStorage.getItem("lastActiveVideoId"));
            let resolvedEconVid = "vid_economics_extraeconomiques_02_les_probl_mes_sanitaires";
            if (savedEcon && savedEcon.includes("sanitaire")) {
              resolvedEconVid = "vid_economics_extraeconomiques_02_les_probl_mes_sanitaires";
            } else if (savedEcon && savedEcon.includes("alimentaire")) {
              resolvedEconVid = "vid_economics_extraeconomiques_03_probl_mes_alimentaires";
            } else if (savedEcon && savedEcon.includes("demographique")) {
              resolvedEconVid = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques";
            }
            targetVideoId = resolvedEconVid;
            activeVideoId = resolvedEconVid;
            window.ACTIVE_DATABASE_VIDEO_ID = resolvedEconVid;
            localStorage.setItem("lastActiveVideo_Economics", resolvedEconVid);
            activeChapterId = "economics_extra_growth";
            activeTimestamp = "00:00";
          } else if (
            selectedGoalTrack === "College" ||
            selectedGoalTrack === "k12/12th_SM/physics"
          ) {
            targetVideoId = "vid_physics_01";
            activeVideoId = "vid_physics_01";
            activeChapterId = "physics_pendulums";
            activeTimestamp = "01:15";
          } else if (
            selectedGoalTrack === "Chemistry" ||
            selectedGoalTrack === "k12/12th_SM/chemistry"
          ) {
            targetVideoId = "vid_chemistry_organic_chemistry_chemistry";
            activeVideoId = "vid_chemistry_organic_chemistry_chemistry";
            activeChapterId = "ch_chemistry_organic_chemistry";
            activeTimestamp = "00:00";
          } else if (
            selectedGoalTrack === "Random Topics" ||
            selectedGoalTrack === "Philosophy" ||
            selectedGoalTrack ===
              "independent_learner/philosophy/stoicism_and_ethics"
          ) {
            targetVideoId = "vid_philosophy_01";
            activeVideoId = "vid_philosophy_01";
            activeChapterId = "philosophy_stoicism";
            activeTimestamp = "01:15";
          } else if (
            selectedGoalTrack === "5th Grade" ||
            selectedGoalTrack === "Basic Science" ||
            selectedGoalTrack === "k12/1st_grade/mathematics"
          ) {
            targetVideoId = "vid_physics_02";
            activeVideoId = "vid_physics_02";
            activeChapterId = "physics_pendulums";
            activeTimestamp = "04:30";
          } else {
            // Dynamic path fallback
            targetVideoId = selectedGoalTrack;
            activeVideoId = selectedGoalTrack;
            activeChapterId = "dynamic_chapter";
            activeTimestamp = "00:00";
          }
          // Load active video, badge, PDF and profile card synchronously
          if (activeVideoId) {
            loadTextbookPDF(activeVideoId);
          }
          }

          // Update active video quiz status in Evaluation tab
          const activeAttempt = mastery.find(
            (m) =>
              m.video_id === activeVideoId && m.chapter_id === activeChapterId,
          );
          window.activeChapterMastered = activeAttempt
            ? !!activeAttempt.mastery_achieved
            : false;
          const quizStatusText = document.getElementById("quizStatusText");
          const quizAttemptDetails =
            document.getElementById("quizAttemptDetails");

          if (quizStatusText && quizAttemptDetails) {
            const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
            const locStrings =
              UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
            const getLocString = (key, fallback) =>
              locStrings[key] !== undefined ? locStrings[key] : fallback;

            if (activeAttempt) {
              const pctScore =
                activeAttempt.score !== undefined
                  ? activeAttempt.score.toFixed(1)
                  : "N/A";
              if (activeAttempt.mastery_achieved) {
                const statusStr = getLocString(
                  "quiz_status_mastery",
                  "Mastery Achieved ({score}%)",
                ).replace("{score}", pctScore);
                quizStatusText.innerHTML = `<span style="color: #10b981;">${statusStr}</span>`;
                quizAttemptDetails.innerText = getLocString(
                  "quiz_detail_mastery",
                  "Topic completed successfully. Timeline navigation unlocked.",
                );
                window.timelineLocked = false;
              } else {
                const statusStr = getLocString(
                  "quiz_status_locked",
                  "Action Required: Locked ({score}%)",
                ).replace("{score}", pctScore);
                quizStatusText.innerHTML = `<span style="color: #ef4444;">${statusStr}</span>`;
                quizAttemptDetails.innerHTML = `
                  <div>${getLocString("quiz_detail_locked", "Score falls below 85% requirement. Alternative question set active.")}</div>
                  <button onclick="redoCurrentQuiz()" style="margin-top: 14px; width: 100%; background: linear-gradient(135deg, #a855f7, #7e22ce); color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 0.85rem; box-shadow: 0 4px 14px rgba(168,85,247,0.35);">
                    🔁 RE-ESSAYER L'ÉVALUATION (REDO QUIZ)
                  </button>
                `;
                window.timelineLocked = true;
              }
            } else {
              quizStatusText.innerText = getLocString(
                "quiz_status_ready",
                "Ready to Begin",
              );
              quizAttemptDetails.innerText = getLocString(
                "quiz_detail_ready",
                "No attempts logged yet. 85.0% required to progress.",
              );
              window.timelineLocked = false;
            }
            if (typeof updateMoreQuestionsButton === "function") {
              updateMoreQuestionsButton();
            }
          }

          const chatFeedBox = document.getElementById("chatFeedBox");
          const tutorContainer = document.getElementById(
            "tutorTranscriptContainer",
          );

          if (trackChanged) {
            emittedTranscripts.clear();
            renderFlashcardsDeck(selectedGoalTrack);

            const savedChat = localStorage.getItem(
              "chatHistory_" + selectedGoalTrack,
            );

            if (chatFeedBox) {
              chatFeedBox.innerHTML = savedChat || "";
            }
            if (tutorContainer) {
              tutorContainer.innerHTML = "";
            }
          }
          renderCurriculumTimestamps(selectedGoalTrack, data.evaluations || []);
          renderKnowledgeCoreGrid();
          renderProfileInterests();
        } catch (e) {
          console.error("Failed loading stats metrics: ", e);
        }
      }

      // Lightbox Functions for Handwriting Scans
      function openHandwritingLightbox(imagePath, subject, score, passed) {
        console.log("[DEBUG] openHandwritingLightbox triggered:", {
          imagePath,
          subject,
          score,
          passed,
        });

        const lightbox = document.getElementById("handwritingLightbox");
        const backdrop = document.getElementById("lightboxBackdrop");
        const img = document.getElementById("lightboxImage");
        const title = document.getElementById("lightboxSubject");
        const scoreLabel = document.getElementById("lightboxScore");
        const filename = document.getElementById("lightboxFilename");
        const status = document.getElementById("lightboxStatus");

        if (!lightbox || !backdrop || !img) {
          console.error("[ERROR] Lightbox DOM elements not found!");
          return;
        }

        // Normalize path (append simulated_s3_bucket/ if needed)
        let src = imagePath;
        if (
          !src.startsWith("simulated_s3_bucket/") &&
          !src.startsWith("/simulated_s3_bucket/")
        ) {
          src = "simulated_s3_bucket/" + src;
        }

        img.src = src;

        const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
        const locStrings =
          UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
        const getLocString = (key, fallback) =>
          locStrings[key] !== undefined ? locStrings[key] : fallback;

        const transSubject = getLocString(
          "subject_" + subject.toLowerCase().replace(" ", "_"),
          subject,
        );
        const noteText = getLocString(
          "label_handwriting_note",
          "Handwriting Note",
        );

        let formattedTitle = `${transSubject} ${noteText}`;
        if (activeLoc === "fr_FR") {
          formattedTitle = `${noteText} de ${transSubject}`;
        } else if (activeLoc === "es_ES" || activeLoc === "pt_PT") {
          formattedTitle = `Nota manuscrita de ${transSubject}`;
        } else if (activeLoc === "zh_CN") {
          formattedTitle = `${transSubject} 手写笔记`;
        }

        title.innerText = formattedTitle;
        scoreLabel.innerText = `${score.toFixed(1)}%`;
        scoreLabel.style.color = passed ? "#4ade80" : "#f87171";
        filename.innerText = `${getLocString("label_file", "File:")} ${imagePath}`;

        status.innerText = passed
          ? getLocString("label_passed", "PASSED")
          : getLocString("label_failed", "FAILED");
        status.style.color = passed ? "#4ade80" : "#f87171";
        status.style.background = passed
          ? "rgba(74,222,128,0.1)"
          : "rgba(248,113,113,0.1)";
        status.style.border = `1px solid ${passed ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`;

        lightbox.classList.add("active");
        backdrop.classList.add("active");
      }

      function closeHandwritingLightbox() {
        console.log("[DEBUG] closeHandwritingLightbox triggered");
        const lightbox = document.getElementById("handwritingLightbox");
        const backdrop = document.getElementById("lightboxBackdrop");

        if (lightbox) lightbox.classList.remove("active");
        if (backdrop) backdrop.classList.remove("active");
      }

      // Dynamically Hydrated Knowledge Core Grid Switch Function
      function switchActiveTrack(trackName) {
        let wsTrack = trackName;
        if (trackName === "Economics" || trackName === "Calculus")
          wsTrack = "k12/12th_SM/Economics";
        else if (trackName === "Physics") wsTrack = "k12/12th_SM/physics";
        else if (trackName === "Chemistry") wsTrack = "k12/12th_SM/chemistry";
        else if (trackName === "Philosophy")
          wsTrack = "independent_learner/philosophy/stoicism_and_ethics";
        else if (trackName === "Basic Science")
          wsTrack = "k12/1st_grade/mathematics";

        // Immediately update selectedGoalTrack locally to guarantee instant UI responsiveness
        selectedGoalTrack = wsTrack;

        let targetVideoId = null;
        if (wsTrack === "k12/12th_SM/Economics")
          targetVideoId = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques";
        else if (wsTrack === "k12/12th_SM/physics")
          targetVideoId = "vid_physics_01";
        else if (wsTrack === "k12/12th_SM/chemistry")
          targetVideoId = "vid_chemistry_organic_chemistry_chemistry";
        else if (
          wsTrack === "independent_learner/philosophy/stoicism_and_ethics"
        )
          targetVideoId = "vid_philosophy_01";
        else if (wsTrack === "k12/1st_grade/mathematics")
          targetVideoId = "vid_physics_02";

        if (targetVideoId) {
          loadTextbookPDF(targetVideoId);
        }

        // Clear layout search parameter to prevent sticky overrides on refresh or stats reload
        if (window.location.search.includes("layout=")) {
          try {
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.delete("layout");
            const newSearch = urlParams.toString();
            const newUrl =
              window.location.pathname + (newSearch ? "?" + newSearch : "");
            window.history.replaceState({}, document.title, newUrl);
          } catch (historyErr) {
            console.warn(
              "Could not replace history state (likely file:// protocol):",
              historyErr,
            );
          }
        }

        // Map and update track display text instantly
        const studentTrackText = document.getElementById(
          "profileStudentTrackText",
        );
        let label = wsTrack.split("/").pop().replace(/_/g, " ");
        label = label
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

        const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
        const locStrings =
          UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
        const getLocString = (key, fallback) =>
          locStrings[key] !== undefined ? locStrings[key] : fallback;
        const trackDisplayNameTrans = getLocString(
          "subject_" + label.toLowerCase().replace(/[\/\s]/g, "_"),
          label,
        );
        if (studentTrackText)
          studentTrackText.innerText = getLocString(
            "track_format",
            "{subject} Track",
          ).replace("{subject}", trackDisplayNameTrans);

        // Instantly re-sort and re-render Knowledge Core Grid cards
        renderKnowledgeCoreGrid();

        // Build the serialized track including the current interests
        let interestsStr = window.ACTIVE_DATABASE_INTERESTS || wsTrack;
        let serializedTrack = `${interestsStr}|${wsTrack}`;

        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.send(
            JSON.stringify({
              action: "ONBOARDING_SUBMIT",
              name: activeStudentName || "student_01",
              track: serializedTrack,
              locale: window.ACTIVE_DATABASE_LOCALE || "en_US",
            }),
          );
          showToastNotification("Switching Track", `Loading ${label} track...`);
        } else {
          loadProfileProgress();
        }
      }

      // Render Redesigned Knowledge Core Grid
      
      function migrateInterests(interests) {
        if (!interests) return [];
        if (Array.isArray(interests)) return interests;
        if (typeof interests === "string") {
          return interests
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return [];
      }

      function getFullPathForInterest(subId) {
        if (!subId) return "";
        const pathMap = {
          "k12/12th_SM/Economics": "k12/12th_SM/Economics/Extraeconomics/Les problèmes démographiques",
          "k12/12th_SM/chemistry": "k12/12th_SM/chemistry/organic_chemistry/chem",
          "k12/12th_SM/physics": "k12/12th_SM/physics/mechanics/harmonic_oscillators",
          "independent_learner/philosophy/stoicism_and_ethics": "independent_learner/philosophy/stoicism_and_ethics/meditations"
        };
        return pathMap[subId] || subId;
      }


      function renderKnowledgeCoreGrid() {
        const grid = document.getElementById("knowledgeCoreGrid");
        if (!grid) return;
        grid.innerHTML = "";

        const subjectVideoMap = {
          "k12/12th_SM/Economics": (() => {
            const savedEcon = (localStorage.getItem("lastActiveVideo_Economics") || "").toLowerCase();
            const maxEcon = (localStorage.getItem("maxUnlockedVideo_Economics") || "").toLowerCase();
            const vId = (typeof activeVideoId !== "undefined" && activeVideoId ? activeVideoId : savedEcon).toLowerCase();

            const isSanitaireUnlocked = maxEcon.includes("sanitaire") || savedEcon.includes("sanitaire") || vId.includes("sanitaire");
            const isAlimentaireUnlocked = maxEcon.includes("alimentaire") || savedEcon.includes("alimentaire") || vId.includes("alimentaire");

            let activeTitle = "01_Les problèmes démographiques";
            let activeId = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques";

            // Dynamically match card title to the active video currently loaded in the player!
            if (vId.includes("alimentaire")) {
              activeTitle = "03_Problèmes alimentaires";
              activeId = "vid_economics_extraeconomiques_03_probl_mes_alimentaires";
            } else if (vId.includes("sanitaire")) {
              activeTitle = "02_Les problèmes sanitaires";
              activeId = "vid_economics_extraeconomiques_02_les_probl_mes_sanitaires";
            } else if (isAlimentaireUnlocked) {
              activeTitle = "03_Problèmes alimentaires";
              activeId = "vid_economics_extraeconomiques_03_probl_mes_alimentaires";
            } else if (isSanitaireUnlocked) {
              activeTitle = "02_Les problèmes sanitaires";
              activeId = "vid_economics_extraeconomiques_02_les_probl_mes_sanitaires";
            }

            return {
              id: activeId,
              title: activeTitle,
              grade: "A",
              time: (activeId.includes("sanitaire") || isSanitaireUnlocked) ? "12m / 20h" : "15m / 20h",
              isSanitaireUnlocked: isSanitaireUnlocked,
              isAlimentaireUnlocked: isAlimentaireUnlocked,
              isRevisingPast: (vId.includes("demographique") && isSanitaireUnlocked)
            };
          })(),
          "k12/12th_SM/chemistry": {
            id: "vid_chemistry_organic_chemistry_chemistry",
            title: "chem",
            grade: "A-",
            time: "15m / 15h",
          },
        };

        const activeLoc = window.ACTIVE_DATABASE_LOCALE || "fr_FR";
        const isFr = activeLoc.startsWith("fr");

        const selectedList = window.ACTIVE_DATABASE_INTERESTS
          ? window.ACTIVE_DATABASE_INTERESTS.split(",").map((s) => s.trim())
          : [selectedGoalTrack];

        const isCardCurrent = (trackKey) => {
          const itemData = subjectVideoMap[trackKey];
          if (itemData && itemData.id === activeVideoId) return true;
          if (trackKey === selectedGoalTrack) return true;
          return false;
        };

        // Sort so the currently active playing video is ALWAYS at the top!
        selectedList.sort((a, b) => {
          const aCurrent = isCardCurrent(a);
          const bCurrent = isCardCurrent(b);
          if (aCurrent && !bCurrent) return -1;
          if (!aCurrent && bCurrent) return 1;
          return 0;
        });

        const cardsContainer = document.createElement("div");
        cardsContainer.style.cssText = "display: flex; flex-direction: column; gap: 16px; margin-top: 10px;";

        selectedList.forEach((trackKey, index) => {
          const itemData = subjectVideoMap[trackKey] || {
            id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            title: "Lesson",
            grade: "B+",
            time: "10m / 10h",
          };

          // ONLY the top card (index === 0 and matching current active video) gets the ÉTUDIE ACTUELLEMENT badge!
          const isCurrent = (index === 0 && isCardCurrent(trackKey));

          const card = document.createElement("div");
          card.style.cssText = `position: relative; background: #141418; border: 1px solid ${isCurrent ? '#a855f7' : '#27272a'}; border-radius: 12px; padding: 18px; cursor: pointer; transition: all 0.2s ease; ${isCurrent ? 'box-shadow: 0 0 16px rgba(168,85,247,0.15);' : ''}`;

          const revisionBadgeHtml = itemData.isRevisingPast ? `
            <div style="font-size:0.68rem; font-weight:700; color:#c084fc; margin-bottom:6px;">📼 ${isFr ? "En révision : 01_Les problèmes démographiques" : "Revising: 01_Demographic problems"}</div>
          ` : "";

          const econPillsHtml = trackKey === "k12/12th_SM/Economics" ? `
            <div style="display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap;" onclick="event.stopPropagation();">
              <button type="button" onclick="loadTextbookPDF('vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques'); renderKnowledgeCoreGrid();" style="padding: 3px 9px; border-radius: 12px; font-size: 0.68rem; font-weight: 700; cursor: pointer; border: 1px solid ${activeVideoId.includes('demographique') ? '#a855f7' : '#27272a'}; background: ${activeVideoId.includes('demographique') ? 'rgba(168,85,247,0.2)' : '#18181b'}; color: ${activeVideoId.includes('demographique') ? '#ffffff' : '#a1a1aa'};">
                ✓ 01_Démographie
              </button>
              ${itemData.isSanitaireUnlocked ? `
                <button type="button" onclick="loadTextbookPDF('vid_economics_extraeconomiques_02_les_probl_mes_sanitaires'); renderKnowledgeCoreGrid();" style="padding: 3px 9px; border-radius: 12px; font-size: 0.68rem; font-weight: 700; cursor: pointer; border: 1px solid ${activeVideoId.includes('sanitaire') ? '#a855f7' : '#27272a'}; background: ${activeVideoId.includes('sanitaire') ? 'rgba(168,85,247,0.2)' : '#18181b'}; color: ${activeVideoId.includes('sanitaire') ? '#ffffff' : '#a1a1aa'};">
                  ${activeVideoId.includes('sanitaire') ? "▶ " : "✓ "}02_Sanitaires
                </button>
              ` : ''}
              ${itemData.isAlimentaireUnlocked ? `
                <button type="button" onclick="loadTextbookPDF('vid_economics_extraeconomiques_03_probl_mes_alimentaires'); renderKnowledgeCoreGrid();" style="padding: 3px 9px; border-radius: 12px; font-size: 0.68rem; font-weight: 700; cursor: pointer; border: 1px solid ${activeVideoId.includes('alimentaire') ? '#a855f7' : '#27272a'}; background: ${activeVideoId.includes('alimentaire') ? 'rgba(168,85,247,0.2)' : '#18181b'}; color: ${activeVideoId.includes('alimentaire') ? '#ffffff' : '#a1a1aa'};">
                  ${activeVideoId.includes('alimentaire') ? "▶ " : "✓ "}03_Alimentaires
                </button>
              ` : ''}
            </div>
          ` : "";

          card.innerHTML = `
            ${isCurrent ? `<div style="display:inline-block; background: #a855f7; color: #ffffff; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.08em; padding: 3px 10px; border-radius: 6px; margin-bottom: 12px; text-transform: uppercase;">${isFr ? "ÉTUDIE ACTUELLEMENT" : "CURRENTLY STUDYING"}</div>` : ""}
            ${revisionBadgeHtml}
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span style="font-weight:700; color:#ffffff; font-size:0.95rem;">${itemData.title}</span>
              <span style="background:rgba(168,85,247,0.2); color:#c084fc; padding:3px 10px; border-radius:6px; font-weight:700; font-size:0.75rem;">${itemData.grade}</span>
            </div>
            <div style="height:5px; background:#27272a; border-radius:3px; overflow:hidden; margin-bottom:14px;">
              <div style="width:25%; height:100%; background:#a855f7;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#a1a1aa;">
              <span>${itemData.time}</span>
              <span style="color:#c084fc; font-weight:700;">${isCurrent ? (isFr ? "EXPORTER EN PDF" : "EXPORT TO PDF") : (isFr ? "PASSAGE À LA LEÇON" : "SWITCH TO LESSON")}</span>
            </div>
            ${econPillsHtml}
          `;

          card.onclick = () => {
            selectedGoalTrack = trackKey;
            window.currentTrack = trackKey;
            loadTextbookPDF(itemData.id);
            renderKnowledgeCoreGrid();
          };

          cardsContainer.appendChild(card);
        });

        grid.appendChild(cardsContainer);
      }

      window.profileLevelsExpanded = window.profileLevelsExpanded || {
        k12: true,
        college_level: true,
        independent_learner: true,
        professional_certificates: true,
      };
      window.profileSubGroupsExpanded = window.profileSubGroupsExpanded || {
        k12_1st_grade: true,
        k12_12th_SE: true,
        k12_12th_SM: true,
        college_level_physics_undergrad: true,
        college_level_chemistry_undergrad: true,
        independent_learner_philosophy: true,
        professional_certificates_ai_engineering: true,
      };

      window.toggleProfileLevelCollapse = function (catKey) {
        if (typeof window.profileLevelsExpanded[catKey] === "undefined") {
          window.profileLevelsExpanded[catKey] = false;
        } else {
          window.profileLevelsExpanded[catKey] = !window.profileLevelsExpanded[catKey];
        }
        renderProfileInterests();
      };

      window.toggleProfileSubGroupCollapse = function (catKey, grpKey) {
        const key = catKey + "_" + grpKey;
        if (typeof window.profileSubGroupsExpanded[key] === "undefined") {
          window.profileSubGroupsExpanded[key] = true;
        } else {
          window.profileSubGroupsExpanded[key] = !window.profileSubGroupsExpanded[key];
        }
        renderProfileInterests();
      };

      function renderProfileInterests() {
        const container = document.getElementById("profileInterestsList");
        if (!container) return;

        if (window.profileLevelsExpanded === undefined) {
          window.profileLevelsExpanded = {
            k12: true,
            college_level: false,
            independent_learner: false,
            professional_certificates: false,
          };
        }
        if (window.profileSubGroupsExpanded === undefined) {
          window.profileSubGroupsExpanded = { k12_12th_SM: true };
        }

        let selectedSubjects = [];
        if (window.ACTIVE_DATABASE_INTERESTS) {
          selectedSubjects = migrateInterests(window.ACTIVE_DATABASE_INTERESTS);
        } else {
          selectedSubjects = ["k12/12th_SM/Economics"];
        }

        const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
        const locStrings =
          UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
        const getLocString = (key, fallback) =>
          locStrings[key] !== undefined ? locStrings[key] : fallback;

        const activeCategories = new Set();
        selectedSubjects.forEach((subId) => {
          const parts = subId.split("/");
          if (parts.length > 0) {
            activeCategories.add(parts[0]);
          }
        });
        const trackToCheck =
          window.ACTIVE_DATABASE_TRACK || window.currentTrack || "";
        if (trackToCheck) {
          const trackCat = trackToCheck.split("/")[0];
          if (CURRICULUM_STAGING_TREE[trackCat]) {
            activeCategories.add(trackCat);
          }
        }
        if (window.ACTIVE_DATABASE_VIDEO_ID) {
          const vidCat =
            window.ACTIVE_DATABASE_VIDEO_ID.startsWith("vid_economics") ||
            window.ACTIVE_DATABASE_VIDEO_ID.startsWith("vid_chemistry") ||
            window.ACTIVE_DATABASE_VIDEO_ID.startsWith("vid_physics")
              ? "k12"
              : "college_level";
          activeCategories.add(vidCat);
        }
        if (activeCategories.size === 0) {
          activeCategories.add("k12");
        }

        container.innerHTML = Object.keys(CURRICULUM_STAGING_TREE)
          .map((catKey) => {
            const cat = CURRICULUM_STAGING_TREE[catKey];
            const isCatExpanded = window.profileLevelsExpanded[catKey];

            const subGroupsHtml = Object.keys(cat.groups)
              .map((grpKey) => {
                const grp = cat.groups[grpKey];
                if (grp.subjects.length === 0) return ""; // Skip empty groups

                const isGrpExpanded =
                  !!window.profileSubGroupsExpanded[catKey + "_" + grpKey];

                const subjectsHtml = grp.subjects
                  .map((sub) => {
                    const isChecked = selectedSubjects.includes(sub.id);
                    const activeClass = isChecked ? "selected" : "";
                    const transLabel = getLocString(
                      "subject_" + sub.id.toLowerCase().replace(/[\/\s]/g, "_"),
                      sub.label,
                    );

                    return `
                            <div class="interest-toggle-card ${activeClass}" onclick="toggleProfileInterest('${sub.id}')" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: rgba(255, 255, 255, 0.02); border: 1px solid ${isChecked ? "#a855f7" : "var(--outline-variant)"}; border-radius: var(--radius-default); cursor: pointer; transition: all 0.2s ease; box-shadow: ${isChecked ? "0 0 8px rgba(168, 85, 247, 0.15)" : "none"}; font-family: 'Geist', sans-serif; margin-bottom: 8px;">
                                <div style="display: flex; flex-direction: column; gap: 2px;">
                                    <span style="font-size: 0.8rem; font-weight: 600; color: #ffffff;">${transLabel}</span>
                                    <span style="font-size: 0.65rem; color: var(--outline); font-family: 'Space Mono', monospace;">${getFullPathForInterest(sub.id)}</span>
                                </div>
                                <div class="interest-checkbox" style="width: 16px; height: 16px; border: 1px solid ${isChecked ? "#a855f7" : "var(--outline)"}; border-radius: 3px; display: flex; align-items: center; justify-content: center; background: ${isChecked ? "#a855f7" : "transparent"}; transition: all 0.2s;">
                                    ${isChecked ? '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#000" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ""}
                                </div>
                            </div>
                        `;
                  })
                  .join("");

                return `
                        <div class="profile-subgroup-section" style="margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: var(--radius-default); background: rgba(255, 255, 255, 0.005); overflow: hidden;">
                            <div class="profile-subgroup-header" onclick="toggleProfileSubGroupCollapse('${catKey}', '${grpKey}')" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(255, 255, 255, 0.02); cursor: pointer; user-select: none;">
                                <span style="font-size: 0.8rem; font-weight: 600; color: #ffffff; opacity: 0.95;">${getLocString(
                                  "group_" +
                                    grpKey
                                      .toLowerCase()
                                      .replace(/\s+/g, "_")
                                      .replace(/[\(\)]/g, ""),
                                  grp.label,
                                )}</span>
                                <span style="color: var(--outline); display: flex; align-items: center; transition: transform 0.2s; transform: ${isGrpExpanded ? "rotate(0deg)" : "rotate(-90deg)"};">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                </span>
                            </div>
                            <div class="profile-subgroup-content" style="display: ${isGrpExpanded ? "block" : "none"}; padding: 10px 12px 2px 12px;">
                                ${subjectsHtml}
                            </div>
                        </div>
                    `;
              })
              .join("");

            return `
                    <div class="profile-level-section" style="margin-bottom: 16px; border: 1px solid var(--outline-variant); border-radius: var(--radius-lg); background: rgba(255, 255, 255, 0.01); overflow: hidden;">
                        <div class="profile-level-header" onclick="toggleProfileLevelCollapse('${catKey}')" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(255, 255, 255, 0.03); cursor: pointer; border-bottom: ${isCatExpanded ? "1px solid var(--outline-variant)" : "none"}; transition: all 0.2s; user-select: none;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="color: var(--primary); display: flex; align-items: center;">${cat.icon}</span>
                                <span style="font-size: 0.85rem; font-weight: 600; color: #ffffff;">${getLocString("interest_" + catKey, cat.label)}</span>
                            </div>
                            <span style="color: var(--outline); display: flex; align-items: center; transition: transform 0.2s; transform: ${isCatExpanded ? "rotate(0deg)" : "rotate(-90deg)"};">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                            </span>
                        </div>
                        <div class="profile-level-content" style="display: ${isCatExpanded ? "block" : "none"}; padding: 14px 16px 2px 16px;">
                            ${subGroupsHtml}
                        </div>
                    </div>
                `;
          })
          .join("");
      }

      function toggleProfileInterest(subjectId) {
        let selectedSubjects = [];
        if (window.ACTIVE_DATABASE_INTERESTS) {
          selectedSubjects = migrateInterests(window.ACTIVE_DATABASE_INTERESTS);
        } else {
          selectedSubjects = ["k12/12th_SM/Economics"];
        }

        const index = selectedSubjects.indexOf(subjectId);
        if (index > -1) {
          if (selectedSubjects.length > 1) {
            selectedSubjects.splice(index, 1);
          } else {
            showToastNotification(
              "Selection Required",
              "You must keep at least one subject active.",
            );
            return;
          }
        } else {
          if (selectedSubjects.length >= 5) {
            showToastNotification(
              "Daily Limit Reached",
              "You can only select up to 5 active subjects per day.",
            );
            return;
          }
          selectedSubjects.push(subjectId);
        }

        const newInterestsStr = selectedSubjects.join(",");
        window.ACTIVE_DATABASE_INTERESTS = newInterestsStr;

        let currentActive = selectedGoalTrack;
        if (currentActive === "calculus" || currentActive === "12th Grade")
          currentActive = "k12/12th_SM/Economics";
        else if (
          currentActive === "Random Topics" ||
          currentActive === "Philosophy"
        )
          currentActive = "independent_learner/philosophy/stoicism_and_ethics";
        else if (currentActive === "5th Grade")
          currentActive = "k12/1st_grade/mathematics";

        if (!selectedSubjects.includes(currentActive)) {
          currentActive = selectedSubjects[0];
        }

        selectedGoalTrack = currentActive;

        // Map back for display mapping
        let wsTrack = currentActive;
        const serializedTrack = `${newInterestsStr}|${wsTrack}`;
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.send(
            JSON.stringify({
              action: "ONBOARDING_SUBMIT",
              name: activeStudentName || "student_01",
              track: serializedTrack,
              locale: window.ACTIVE_DATABASE_LOCALE || "en_US",
            }),
          );
          showToastNotification(
            "Interests Updated",
            "Your learning preferences have been updated.",
          );
        } else {
          loadProfileProgress();
        }

        renderProfileInterests();
        renderKnowledgeCoreGrid();
      }
      function mapTrackToGoal(track) {
        if (!track) return "College";
        let t = track.trim().toLowerCase();
        if (
          t === "calculus" ||
          t === "12th grade" ||
          t.includes("k12/12th_grade")
        )
          return "12th Grade";
        if (t === "college") return "College";
        if (t === "5th grade") return "5th Grade";
        if (t === "random topics" || t === "philosophy") return "Random Topics";
        if (t === "chemistry") return "College";
        return "College";
      }
      // Render curriculum timestamps lists
      function renderCurriculumTimestamps(track, evaluations = []) {
        const listContainer = document.getElementById("timestampChaptersList");
        if (!listContainer) return;
        listContainer.innerHTML = "";

        const activeLoc = window.ACTIVE_DATABASE_LOCALE || "fr_FR";
        const isFr = activeLoc.startsWith("fr");

        // Helper to check if a video is unlocked / passed with >= 85%
        const isVideoUnlockedAndPassed = (vidId, idx) => {
          if (idx === 0) return true; // First lesson in subject unlocked by default
          const isCurrentActive = (typeof activeVideoId !== "undefined" && activeVideoId === vidId);
          if (isCurrentActive) return true;
          const isSavedCompleted = (localStorage.getItem("completed_videos_" + vidId) === "true");
          const passedEval = (evaluations || []).find(e => e.video_id === vidId && (e.score >= 85 || e.passed));
          return isSavedCompleted || !!passedEval;
        };

        // Revision & Re-watch Library Selector Header
        const revisionHeader = document.createElement("div");
        revisionHeader.style.cssText = "margin-bottom: 16px; padding: 12px; background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.3); border-radius: 10px;";
        revisionHeader.innerHTML = `
          <div style="font-size: 0.72rem; font-weight: 800; color: #c084fc; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
            ${isFr ? "📼 BIBLIOTHÈQUE DE RÉVISION (COURS VALIDÉS ÉVALUÉS À 85%+)" : "📼 REVISION & RE-WATCH LIBRARY (PASSED 85%+)"}
          </div>
          <div style="font-size: 0.73rem; color: #a1a1aa; margin-bottom: 10px;">
            ${isFr ? "Leçons validées disponibles pour révision et préparation d'examens :" : "Completed & evaluated lessons unlocked for exam review:"}
          </div>
          <input type="text" id="revisionSearchInput" placeholder="${isFr ? '🔍 Rechercher une leçon de révision...' : '🔍 Search revision lessons...'}" style="width: 100%; box-sizing: border-box; background: #09090b; border: 1px solid #27272a; color: #ffffff; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; margin-bottom: 10px; outline: none;">
          <div id="revisionVideoPills" style="display: flex; flex-wrap: wrap; gap: 8px;"></div>
        `;
        listContainer.appendChild(revisionHeader);

        const pillsContainer = revisionHeader.querySelector("#revisionVideoPills");
        const searchInput = revisionHeader.querySelector("#revisionSearchInput");

        const allSubjectVideos = {
          "k12/12th_SM/Economics": [
            { id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques", title: isFr ? "01_Problèmes démographiques" : "01_Demographic Problems" },
            { id: "vid_economics_extraeconomiques_02_les_probl_mes_sanitaires", title: isFr ? "02_Problèmes sanitaires" : "02_Health Problems" },
            { id: "vid_economics_extraeconomiques_03_probl_mes_alimentaires", title: isFr ? "03_Problèmes alimentaires" : "03_Food Problems" }
          ],
          "k12/12th_SM/chemistry": [
            { id: "vid_chemistry_organic_chemistry_chemistry", title: isFr ? "Chimie Organique" : "Organic Chemistry" }
          ]
        };

        const activeTrackKey = (track === "k12/12th_SM/chemistry" || track === "Chemistry") ? "k12/12th_SM/chemistry" : "k12/12th_SM/Economics";
        const subjectVideos = allSubjectVideos[activeTrackKey] || allSubjectVideos["k12/12th_SM/Economics"];

        const renderPills = (filterQuery = "") => {
          if (!pillsContainer) return;
          pillsContainer.innerHTML = "";
          subjectVideos.forEach((vid, vIdx) => {
            if (filterQuery && !vid.title.toLowerCase().includes(filterQuery.toLowerCase())) return;

            const isUnlocked = isVideoUnlockedAndPassed(vid.id, vIdx);
            const isActiveVid = (typeof activeVideoId !== "undefined" && activeVideoId === vid.id);

            const pill = document.createElement("button");
            pill.type = "button";

            if (isUnlocked) {
              pill.style.cssText = `padding: 5px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; border: 1px solid ${isActiveVid ? '#a855f7' : 'rgba(255,255,255,0.15)'}; background: ${isActiveVid ? 'rgba(168,85,247,0.3)' : '#18181b'}; color: ${isActiveVid ? '#ffffff' : '#a1a1aa'};`;
              pill.innerHTML = `${isActiveVid ? "▶ " : "✓ "}${vid.title}`;
              pill.onclick = () => {
                if (typeof activeVideoId !== "undefined") activeVideoId = vid.id;
                localStorage.setItem("lastActiveVideo_Economics", vid.id);
                loadTextbookPDF(vid.id);
                renderCurriculumTimestamps(track, evaluations);
                renderKnowledgeCoreGrid();
              };
            } else {
              pill.style.cssText = `padding: 5px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; cursor: not-allowed; opacity: 0.45; border: 1px dashed rgba(255,255,255,0.1); background: #09090b; color: #71717a;`;
              pill.innerHTML = `🔒 ${vid.title}`;
              pill.title = isFr ? "Leçon verrouillée - Évaluation requis 85%+" : "Locked lesson - 85%+ Evaluation required";
            }
            pillsContainer.appendChild(pill);
          });
        };

        renderPills();
        if (searchInput) {
          searchInput.oninput = (e) => renderPills(e.target.value);
        }

        let curKey = track;
        if (
          track === "k12/12th_SM/Economics" ||
          track === "12th Grade" ||
          track === "calculus"
        )
          curKey = "calculus";
        else if (track === "k12/12th_SM/physics" || track === "College")
          curKey = "College";
        else if (track === "k12/12th_SM/chemistry" || track === "Chemistry")
          curKey = "Chemistry";
        else if (
          track === "independent_learner/philosophy/stoicism_and_ethics" ||
          track === "Random Topics" ||
          track === "Philosophy"
        )
          curKey = "Random Topics";
        else if (
          track === "k12/1st_grade/mathematics" ||
          track === "5th Grade" ||
          track === "Basic Science"
        )
          curKey = "5th Grade";

        let chapters = null;
        if (typeof activeVideoId !== "undefined" && activeVideoId && CURRICULA[activeVideoId]) {
          chapters = CURRICULA[activeVideoId];
        }
        if (!chapters) {
          chapters = CURRICULA[track] || CURRICULA[curKey] || CURRICULA["k12/12th_SM/Economics"] || CURRICULA["College"];
        }

        chapters.forEach((chap, idx) => {
          const item = document.createElement("button");
          item.type = "button";
          const lockClass = window.timelineLocked ? "timeline-locked-item" : "";
          item.className = `timestamp-item ${chap.active ? "active" : ""} ${lockClass}`;
          if (window.timelineLocked) {
            item.style.opacity = "0.5";
            item.style.cursor = "not-allowed";
          }
          if (chap.active) {
            activeTimestampItem = item;
          }

          let displayTitle = chap.title;
          const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
          const locStrings =
            UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
          const getLocString = (key, fallback) =>
            locStrings[key] !== undefined ? locStrings[key] : fallback;

          const prefixMatch = displayTitle.match(/^([^:]+):/);
          if (prefixMatch) {
            const prefix = prefixMatch[1].trim();
            const transPrefix = getLocString(
              "subject_" + prefix.toLowerCase().replace(/[\/\s]/g, "_"),
              prefix,
            );
            displayTitle = displayTitle.replace(
              prefix + ":",
              transPrefix + " :",
            );
          }

          const teacherAvatar =
            window.ACTIVE_DATABASE_INSTRUCTOR_AVATAR ||
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150";
          item.innerHTML = `
                    <img class="timestamp-item-avatar" src="${teacherAvatar}" alt="Instructor">
                    <span class="timestamp-title">${displayTitle}</span>
                    <span class="timestamp-pill">${chap.time}</span>
                `;

          item.onclick = () => {
            if (window.timelineLocked) {
              showToastNotification(
                "Timeline Locked",
                "Mastery Evaluation required to navigate.",
              );
              return;
            }
            if (chap.time) {
              const parts = chap.time.split(":");
              let secs = 0;
              if (parts.length === 3) {
                secs =
                  parseInt(parts[0]) * 3600 +
                  parseInt(parts[1]) * 60 +
                  parseInt(parts[2]);
              } else if (parts.length === 2) {
                secs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
              }
              if (secs > maxTimeWatched + 1.5) {
                showToastNotification(
                  "Seeking Restricted",
                  "You must watch the video sequentially.",
                );
                return;
              }
            }
            if (chap.video_id) activeVideoId = chap.video_id;
            if (chap.chapter_id) activeChapterId = chap.chapter_id;
            window.lastSeekTargetMarker = chap.time;
            loadTextbookPDF(chap.video_id, chap.time, item, chap.title);
            loadProfileProgress();
          };
          listContainer.appendChild(item);
        });
      }

      function updateActiveTimestampHighlight() {
        const video = document.getElementById("lectureVideoPlayer");
        if (!video) return;
        const currentTime = video.currentTime;

        let track = selectedGoalTrack;
        let curKey = track;
        if (
          track === "k12/12th_SM/Economics" ||
          track === "12th Grade" ||
          track === "calculus"
        )
          curKey = "calculus";
        else if (track === "k12/12th_SM/physics" || track === "College")
          curKey = "College";
        else if (track === "k12/12th_SM/chemistry" || track === "Chemistry")
          curKey = "Chemistry";
        else if (
          track === "independent_learner/philosophy/stoicism_and_ethics" ||
          track === "Random Topics" ||
          track === "Philosophy"
        )
          curKey = "Random Topics";
        else if (
          track === "k12/1st_grade/mathematics" ||
          track === "5th Grade" ||
          track === "Basic Science"
        )
          curKey = "5th Grade";

        let chapters = null;
        if (typeof activeVideoId !== "undefined" && activeVideoId && CURRICULA[activeVideoId]) {
          chapters = CURRICULA[activeVideoId];
        }
        if (!chapters) {
          chapters = CURRICULA[track] || CURRICULA[curKey] || CURRICULA["k12/12th_SM/Economics"] || CURRICULA["College"];
        }
        if (!chapters || chapters.length === 0) return;

        let activeIdx = 0;
        for (let i = 0; i < chapters.length; i++) {
          const chap = chapters[i];
          const parts = chap.time.split(":");
          let secs = 0;
          if (parts.length === 3) {
            secs =
              parseInt(parts[0]) * 3600 +
              parseInt(parts[1]) * 60 +
              parseInt(parts[2]);
          } else if (parts.length === 2) {
            secs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
          }
          if (currentTime >= secs) {
            activeIdx = i;
          }
        }

        const listContainer = document.getElementById("timestampChaptersList");
        if (listContainer) {
          const buttons =
            listContainer.getElementsByClassName("timestamp-item");
          for (let i = 0; i < buttons.length; i++) {
            if (i === activeIdx) {
              buttons[i].classList.add("active");
            } else {
              buttons[i].classList.remove("active");
            }
          }
        }
      }

      function seekVideoToTime(timeStr) {
        const video = document.getElementById("lectureVideoPlayer");
        const parts = timeStr.split(":");
        let secs = 0;
        if (parts.length === 3) {
          secs =
            parseInt(parts[0]) * 3600 +
            parseInt(parts[1]) * 60 +
            parseInt(parts[2]);
        } else if (parts.length === 2) {
          secs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        window.isProgrammaticSeek = true;
        window.lastSeekTargetMarker = timeStr;
        if (secs > maxTimeWatched) {
          maxTimeWatched = secs;
        }
        video.currentTime = secs;
        video.play();
      }

      // Notification toast popup
      function showToastNotification(header, body) {
        const container = document.body;
        const toast = document.createElement("div");
        toast.className = "mesh-toast";
        toast.innerHTML = `
                <div class="toast-header">${header}</div>
                <div class="toast-body">${body}</div>
            `;
        container.appendChild(toast);

        setTimeout(() => {
          toast.style.animation =
            "toastSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards";
          setTimeout(() => toast.remove(), 350);
        }, 3000);
      }

      // Active 3D Flashcards flipper
      function flipActiveFlashcard() {
        const card = document.getElementById("activeFlashcardContainer");
        if (!card) return;
        card.classList.toggle("flipped");

        const actionBtn = document.getElementById("flashcardActionBtn");
        if (actionBtn) {
          const locale = window.ACTIVE_DATABASE_LOCALE || "en_US";
          const strings = UI_LOCALIZATIONS[locale] || UI_LOCALIZATIONS["en_US"];
          if (card.classList.contains("flipped")) {
            actionBtn.innerHTML =
              "👁️ " + (strings["show_question"] || "Show Question");
          } else {
            actionBtn.innerHTML =
              "📝 " + (strings["show_answer"] || "Show Answer");
          }
        }
      }

      function loadFlashcard(question, answer, hint) {
        const container = document.getElementById("activeFlashcardContainer");
        if (!container) return;
        container.classList.remove("flipped");

        if (activeDeck) {
          const idx = activeDeck.findIndex((c) => c.front === question);
          if (idx !== -1) {
            currentFlashcardIndex = idx;
          }
        }
        setTimeout(() => {
          updateActiveFlashcard();
        }, 150);
      }

      const FLASHCARDS_DECKS = {
        "12th Grade": [
          {
            front:
              "What represents the instantaneous rate of change of a function geometrically?",
            back: "The derivative (slope of the tangent line)",
            hint: "Think about the slope of a line that touches the curve at exactly one point.",
          },
          {
            front:
              "How do we calculate the tangent line slope of f(x) = x^3 - 3x at a point x₀?",
            back: "Using the derivative: f'(x₀) = 3x₀² - 3",
            hint: "Take the derivative of x^3 and -3x, then evaluate it at x0.",
          },
          {
            front:
              "What is the limit of (f(x) - f(x₀)) / (x - x₀) as x approaches x₀?",
            back: "The definition of the derivative f'(x₀)",
            hint: "This is the difference quotient as the interval shrinks to zero.",
          },
          {
            front:
              "Proof that a function is differentiable at a point implies it is also what?",
            back: "Continuous at that point",
            hint: "If a function has a derivative somewhere, it cannot have holes or jumps there.",
          },
        ],
        "5th Grade": [
          {
            front: "What is the defining equation for simple harmonic motion?",
            back: "d²x/dt² = -ω²x",
            hint: "Acceleration is proportional and opposite to displacement.",
          },
          {
            front:
              "What happens to the amplitude of a damped oscillator over time?",
            back: "It decays exponentially: A(t) = A₀ e^(-b t / 2m)",
            hint: "It decreases following a curve governed by base e.",
          },
          {
            front:
              "What represents the restoring force of a mass-spring system?",
            back: "Hooke's Law: F = -kx",
            hint: "Force is directly proportional to stretch length.",
          },
        ],
        College: [
          {
            front:
              "What represents the restoring force of a pendulum for small angles?",
            back: "F ≈ -mgθ",
            hint: "For small values, sine of theta is approximately theta.",
          },
          {
            front: "What is the damping ratio for a critical damping case?",
            back: "ζ = 1",
            hint: "The boundary between oscillation and sluggish return.",
          },
        ],
        calculus: [
          {
            front:
              "What represents the instantaneous rate of change of a function geometrically?",
            back: "The derivative (slope of the tangent line)",
            hint: "Think about the slope of a line that touches the curve at exactly one point.",
          },
          {
            front:
              "How do we calculate the tangent line slope of f(x) = x^3 - 3x at a point x₀?",
            back: "Using the derivative: f'(x₀) = 3x₀² - 3",
            hint: "Take the derivative of x^3 and -3x, then evaluate it at x0.",
          },
          {
            front:
              "What is the limit of (f(x) - f(x₀)) / (x - x₀) as x approaches x₀?",
            back: "The definition of the derivative f'(x₀)",
            hint: "This is the difference quotient as the interval shrinks to zero.",
          },
          {
            front:
              "Proof that a function is differentiable at a point implies it is also what?",
            back: "Continuous at that point",
            hint: "If a function has a derivative somewhere, it cannot have holes or jumps there.",
          },
        ],
        Chemistry: [
          {
            front:
              "What is the primary chemical bond where electrons are shared?",
            back: "Covalent bond",
            hint: "Think about co-operative sharing of valence electrons.",
          },
          {
            front:
              "What is the pH level of a neutral aqueous solution at 25°C?",
            back: "7",
            hint: "It's the middle of the standard pH scale.",
          },
        ],
      };

      let activeDeck = [];
      let currentFlashcardIndex = 0;

      function renderFlashcardsDeck(track) {
        const container = document.getElementById("recentFlashcardsList");
        if (!container) return;
        container.innerHTML = "";

        const deck = FLASHCARDS_DECKS[track] || FLASHCARDS_DECKS["College"];
        activeDeck = deck;
        currentFlashcardIndex = 0;

        const titleElem = document.getElementById("flashcardDeckTitle");
        const countElem = document.getElementById("flashcardDeckCount");
        if (titleElem) {
          const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
          const locStrings =
            UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
          const getLocString = (key, fallback) =>
            locStrings[key] !== undefined ? locStrings[key] : fallback;

          const stackPrefix = getLocString("study_stack", "Study Stack: ");
          const trackNameTrans = getLocString(
            "subject_" + track.toLowerCase().replace(/[\/\s]/g, "_"),
            track,
          );

          titleElem.innerText = `${stackPrefix}${trackNameTrans}`;
        }
        if (countElem) {
          const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
          const locStrings =
            UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
          const getLocString = (key, fallback) =>
            locStrings[key] !== undefined ? locStrings[key] : fallback;
          const cardsText = getLocString(
            "cards_count",
            "{count} cards",
          ).replace("{count}", deck.length);
          countElem.innerText = `${currentFlashcardIndex + 1} / ${cardsText}`;
        }

        // Explicit programmatic click event listener for rotation toggle
        const activeCard = document.getElementById("activeFlashcardContainer");
        if (activeCard && !activeCard.dataset.hasListener) {
          activeCard.dataset.hasListener = "true";
          activeCard.addEventListener("click", function (e) {
            if (e.target.closest("button")) return;
            flipActiveFlashcard();
          });
        }

        updateActiveFlashcard();

        if (deck.length > 0) {
          const locale = window.ACTIVE_DATABASE_LOCALE || "en_US";
          deck.forEach((card, idx) => {
            const item = document.createElement("div");
            item.className = "recent-stack-item";

            const truncatedFront =
              card.front.length > 38
                ? card.front.substring(0, 38) + "..."
                : card.front;
            const truncatedBack =
              card.back.length > 38
                ? card.back.substring(0, 38) + "..."
                : card.back;

            item.innerHTML = `
                        <div>
                            <div class="recent-item-title" id="recent-front-${idx}">${truncatedFront}</div>
                            <div class="recent-item-desc" id="recent-back-${idx}">${truncatedBack}</div>
                        </div>
                        <span style="color:var(--outline); font-size:0.8rem;">&rarr;</span>
                    `;
            item.onclick = () => {
              currentFlashcardIndex = idx;
              loadFlashcard(card.front, card.back, card.hint);
            };
            container.appendChild(item);

            if (locale !== "en_US") {
              fetch(
                `/api/translate?text=${encodeURIComponent(card.front)}&locale=${encodeURIComponent(locale)}`,
              )
                .then((res) => res.json())
                .then((data) => {
                  const cleanFront = (
                    data.translated_text || card.front
                  ).replace(/^\[[^\]]+\]\s*/, "");
                  const truncFront =
                    cleanFront.length > 38
                      ? cleanFront.substring(0, 38) + "..."
                      : cleanFront;
                  const el = document.getElementById(`recent-front-${idx}`);
                  if (el) el.innerText = truncFront;
                });
              fetch(
                `/api/translate?text=${encodeURIComponent(card.back)}&locale=${encodeURIComponent(locale)}`,
              )
                .then((res) => res.json())
                .then((data) => {
                  const cleanBack = (data.translated_text || card.back).replace(
                    /^\[[^\]]+\]\s*/,
                    "",
                  );
                  const truncBack =
                    cleanBack.length > 38
                      ? cleanBack.substring(0, 38) + "..."
                      : cleanBack;
                  const el = document.getElementById(`recent-back-${idx}`);
                  if (el) el.innerText = truncBack;
                });
            }
          });
        }
      }

      function updateActiveFlashcard() {
        if (!activeDeck || activeDeck.length === 0) return;

        const card = document.getElementById("activeFlashcardContainer");
        if (card) card.classList.remove("flipped");

        const locale = window.ACTIVE_DATABASE_LOCALE || "en_US";
        const actionBtn = document.getElementById("flashcardActionBtn");
        const strings = UI_LOCALIZATIONS[locale] || UI_LOCALIZATIONS["en_US"];
        if (actionBtn)
          actionBtn.innerHTML =
            "📝 " + (strings["show_answer"] || "Show Answer");

        const questionText = document.getElementById("flashcardQuestionText");
        const answerText = document.getElementById("flashcardAnswerText");

        const rawFront = activeDeck[currentFlashcardIndex].front;
        const rawBack = activeDeck[currentFlashcardIndex].back;

        if (questionText) questionText.innerText = rawFront;
        if (answerText) answerText.innerText = rawBack;

        const indicator = document.getElementById("flashcardIndicator");
        if (indicator) {
          indicator.innerText = `${currentFlashcardIndex + 1} / ${activeDeck.length}`;
        }
        const countElem = document.getElementById("flashcardDeckCount");
        if (countElem) {
          const activeLoc = window.ACTIVE_DATABASE_LOCALE || "en_US";
          const locStrings =
            UI_LOCALIZATIONS[activeLoc] || UI_LOCALIZATIONS["en_US"];
          const getLocString = (key, fallback) =>
            locStrings[key] !== undefined ? locStrings[key] : fallback;
          const cardsText = getLocString(
            "cards_count",
            "{count} cards",
          ).replace("{count}", activeDeck.length);
          countElem.innerText = `${currentFlashcardIndex + 1} / ${cardsText}`;
        }
      }

      function navigateFlashcard(direction) {
        if (!activeDeck || activeDeck.length === 0) return;
        currentFlashcardIndex =
          (currentFlashcardIndex + direction + activeDeck.length) %
          activeDeck.length;
        updateActiveFlashcard();
      }

      function showActiveFlashcardHint() {
        if (!activeDeck || activeDeck.length === 0) return;
        const activeCard = activeDeck[currentFlashcardIndex];
        const hint =
          activeCard.hint ||
          "Try recalling the definition from the active reading section.";
        const locale = window.ACTIVE_DATABASE_LOCALE || "en_US";

        if (locale === "en_US") {
          showToastNotification("💡 Study Hint", hint);
        } else {
          fetch(
            `/api/translate?text=${encodeURIComponent(hint)}&locale=${encodeURIComponent(locale)}`,
          )
            .then((res) => res.json())
            .then((data) => {
              const cleanHint = (data.translated_text || hint).replace(
                /^\[[^\]]+\]\s*/,
                "",
              );
              const hintTitle =
                UI_LOCALIZATIONS[locale]?.["study_hint"] || "Study Hint";
              showToastNotification("💡 " + hintTitle, cleanHint);
            })
            .catch((err) => {
              console.error("Hint translation failed:", err);
              showToastNotification("💡 Study Hint", hint);
            });
        }
      }

      // 3D Canvas-based Vector Space scatter plot simulation
      let vectorSpacePoints = [
        { x: -50, y: 30, z: -20, label: "Neural Plasticity", color: "#a855f7" },
        { x: 30, y: -20, z: 40, label: "Synaptic Pruning", color: "#e9b3ff" },
        {
          x: 40,
          y: 20,
          z: -50,
          label: "Dopaminergic Pathways",
          color: "#aac7ff",
        },
      ];
      let vectorRotationY = 0;
      let vectorScale = 1.8;

      function init3DVectorCanvas() {
        const canvas = document.getElementById("vectorCanvas");
        const ctx = canvas.getContext("2d");

        // Handle resizing
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;

        function render() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw background grid lines in 3D projection
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;

          // Draw axis grid lines
          ctx.strokeStyle = "#161616";
          ctx.lineWidth = 1;
          for (let i = -100; i <= 100; i += 20) {
            // X-Z plane grid lines
            const p1 = project3D(i, 0, -100, cx, cy);
            const p2 = project3D(i, 0, 100, cx, cy);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            const p3 = project3D(-100, 0, i, cx, cy);
            const p4 = project3D(100, 0, i, cx, cy);
            ctx.beginPath();
            ctx.moveTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.stroke();
          }

          // Draw central axis vectors
          ctx.strokeStyle = "#2a2a2a";
          ctx.lineWidth = 2;
          const origin = project3D(0, 0, 0, cx, cy);

          const xAxis = project3D(120, 0, 0, cx, cy);
          ctx.beginPath();
          ctx.moveTo(origin.x, origin.y);
          ctx.lineTo(xAxis.x, xAxis.y);
          ctx.stroke();

          const yAxis = project3D(0, -120, 0, cx, cy);
          ctx.beginPath();
          ctx.moveTo(origin.x, origin.y);
          ctx.lineTo(yAxis.x, yAxis.y);
          ctx.stroke();

          const zAxis = project3D(0, 0, 120, cx, cy);
          ctx.beginPath();
          ctx.moveTo(origin.x, origin.y);
          ctx.lineTo(zAxis.x, zAxis.y);
          ctx.stroke();

          // Draw connection links between points
          let projPoints = vectorSpacePoints.map((pt) => {
            const rotated = rotatePointY(pt, vectorRotationY);
            return {
              proj: project3D(rotated.x, rotated.y, rotated.z, cx, cy),
              color: pt.color,
              label: pt.label,
            };
          });

          ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(projPoints[0].proj.x, projPoints[0].proj.y);
          ctx.lineTo(projPoints[1].proj.x, projPoints[1].proj.y);
          ctx.lineTo(projPoints[2].proj.x, projPoints[2].proj.y);
          ctx.closePath();
          ctx.stroke();

          // Render points and labels
          projPoints.forEach((pt) => {
            // Draw projection lines to grid plane (Y = 0)
            const groundProj = project3D(
              rotatePointY(
                vectorSpacePoints.find((p) => p.label === pt.label),
                vectorRotationY,
              ).x,
              0,
              rotatePointY(
                vectorSpacePoints.find((p) => p.label === pt.label),
                vectorRotationY,
              ).z,
              cx,
              cy,
            );
            ctx.strokeStyle = "rgba(194, 193, 255, 0.15)";
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(pt.proj.x, pt.proj.y);
            ctx.lineTo(groundProj.x, groundProj.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw node point
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.proj.x, pt.proj.y, 6, 0, Math.PI * 2);
            ctx.fill();

            // Outer node glow
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(pt.proj.x, pt.proj.y, 8, 0, Math.PI * 2);
            ctx.stroke();

            // Label tag text
            ctx.font = "600 10px 'Geist', monospace";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(pt.label, pt.proj.x + 12, pt.proj.y + 3);
          });

          vectorRotationY += 0.005; // Auto rotate slow
          requestAnimationFrame(render);
        }

        function rotatePointY(pt, angle) {
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          return {
            x: pt.x * cos - pt.z * sin,
            y: pt.y,
            z: pt.x * sin + pt.z * cos,
          };
        }

        function project3D(x, y, z, cx, cy) {
          // Standard perspective 3D mapping projection
          const fov = 200;
          const distance = 250;
          const scale = fov / (distance + z);
          return {
            x: cx + x * scale * vectorScale,
            y: cy + y * scale * vectorScale,
          };
        }

        // Drag mouse coordinates to rotate rotationY
        let isDragging = false;
        let startX = 0;
        canvas.addEventListener("mousedown", (e) => {
          isDragging = true;
          startX = e.clientX;
        });
        window.addEventListener("mouseup", () => (isDragging = false));
        canvas.addEventListener("mousemove", (e) => {
          if (isDragging) {
            const diffX = e.clientX - startX;
            vectorRotationY += diffX * 0.01;
            startX = e.clientX;
          }
        });

        render();
      }

      function recenterVectorSpace() {
        vectorRotationY = 0;
        showToastNotification(
          "Recenter",
          "3D vector coordinates projection reset.",
        );
      }

      // Biometric Security and Attentional Tracker handlers
      function handleLockDevice(reason) {
        const overlay = document.getElementById("lockScreenOverlay");
        if (overlay) {
          overlay.style.display = "flex";
        }
        // Pause video timeline automatically
        const video = document.getElementById("lectureVideoPlayer");
        const btn = document.getElementById("playControlBtn");
        if (video && !video.paused) {
          video.pause();
          if (btn)
            btn.innerHTML =
              '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        }
        if (!isDeviceLocked) {
          isDeviceLocked = true;
          showToastNotification(
            "SECURITY LOCKOUT",
            "Unauthorized biometric face token detected. Workspace frozen.",
          );
        }
      }

      function handleUnlockDevice() {
        const overlay = document.getElementById("lockScreenOverlay");
        if (overlay) {
          overlay.style.display = "none";
        }
        if (isDeviceLocked) {
          isDeviceLocked = false;
          showToastNotification(
            "SECURITY UNLOCKED",
            "Biometrics matched. Access restored.",
          );
        }
      }

      // Attentional tracking timeline handlers with visual stutter elimination
      function pauseVideoTimeline() {
        const video = document.getElementById("lectureVideoPlayer");
        const btn = document.getElementById("playControlBtn");
        if (video) {
          video.pause();
          if (btn)
            btn.innerHTML =
              '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
          if (!isVideoPausedBySentry) {
            isVideoPausedBySentry = true;
            // Triggered instantly when face count registers 0 on the sentry service
            showToastNotification(
              "ATTENTION PAUSED",
              "No face present. Timeline paused.",
            );
          }
        }
      }

      function playVideoTimeline() {
        if (
          window.isTextbookDrawerOpen ||
          window.isWorkspaceActive ||
          isConversationSessionActive ||
          isSimulatorActive ||
          speechInProgress ||
          ("speechSynthesis" in window && window.speechSynthesis.speaking)
        ) {
          console.log(
            "[SENTRY] Ignore play command: Textbook drawer, workspace, conversation session, speech synthesis, whiteboard typing, or simulator is active.",
          );
          return;
        }
        const video = document.getElementById("lectureVideoPlayer");
        const btn = document.getElementById("playControlBtn");
        if (video) {
          const currentLocale = window.ACTIVE_DATABASE_LOCALE || "en_US";
          const teacherLocale =
            window.ACTIVE_DATABASE_INSTRUCTOR_LOCALE || "en_US";
          if (
            currentLocale === "en_US" &&
            translationAudioMode === "translated"
          ) {
            video.muted = true;
            video.volume = 0;
          } else {
            video.muted = false;
            video.volume = 1.0;
          }
          video
            .play()
            .then(() => {
              if (btn)
                btn.innerHTML =
                  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
            })
            .catch((e) => {
              console.log("Play interrupted or blocked:", e);
              if (btn)
                btn.innerHTML =
                  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
            });
          if (isVideoPausedBySentry) {
            isVideoPausedBySentry = false;
            // Instantly resumes play when verified face registers 1 or more
            showToastNotification(
              "ATTENTION ACTIVE",
              "Verified owner detected. Timeline resumed.",
            );
          }
        }
      }

      // Initialize display console page
      window.addEventListener("DOMContentLoaded", () => {
        connectWebSocket();
        loadProfileProgress();
        initCustomBooks();

        // Mirror floating tutor webcam video circle with main player staged video track
        const mainVideo = document.getElementById("lectureVideoPlayer");
        const floatingVideo = document.getElementById("tutorWebcamMock");
        if (floatingVideo) {
          floatingVideo.volume = 0;
          floatingVideo.muted = true;
        }
        if (mainVideo && floatingVideo) {
          mainVideo.addEventListener("play", () => {
            if (
              isSimulatorActive ||
              speechInProgress ||
              ("speechSynthesis" in window && window.speechSynthesis.speaking)
            ) {
              mainVideo.pause();
              const btn = document.getElementById("playControlBtn");
              if (btn)
                btn.innerHTML =
                  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
              console.log(
                "[INTERLOCK] Forced pause: video play attempted while speech, typing, or simulator is active.",
              );
              return;
            }
            floatingVideo.volume = 0;
            floatingVideo.muted = true;
            floatingVideo
              .play()
              .catch((e) => console.warn("Auto-play blocked:", e));

            // Resume translated audio if playing in translation mode
            const currentLocale = window.ACTIVE_DATABASE_LOCALE || "en_US";
            const teacherLocale =
              window.ACTIVE_DATABASE_INSTRUCTOR_LOCALE || "en_US";
            if (
              activeLectureAudio &&
              activeLectureAudio.paused &&
              currentLocale === "en_US" &&
              translationAudioMode === "translated"
            ) {
              activeLectureAudio
                .play()
                .catch((err) =>
                  console.warn("Resuming translated audio failed:", err),
                );
            }
          });
          mainVideo.addEventListener("pause", () => {
            floatingVideo.pause();
            activeTranslationAudios.forEach((audio) => {
              if (audio) {
                try {
                  audio.pause();
                } catch (e) {}
              }
            });
          });
          mainVideo.addEventListener("loadedmetadata", () => {
            if (typeof updateTranslationAudioMode === "function") {
              updateTranslationAudioMode(translationAudioMode);
            }
          });
          mainVideo.addEventListener("seeking", () => {
            floatingVideo.currentTime = mainVideo.currentTime;

            // Stop and reset all active translation audios on seek
            stopAllTranslationAudios();

            // Programmatic seeks (Websocket sync, valid timestamp card click, etc.) bypass locks
            if (window.isProgrammaticSeek) {
              return;
            }

            if (window.timelineLocked) {
              mainVideo.currentTime = maxTimeWatched;
              showToastNotification(
                "Timeline Locked",
                "Mastery Evaluation required to navigate timeline.",
              );
              return;
            }
            if (mainVideo.currentTime > maxTimeWatched + 1.5) {
              mainVideo.currentTime = maxTimeWatched;
              showToastNotification(
                "Seeking Restricted",
                "You must watch the video sequentially.",
              );
            }
          });
          mainVideo.addEventListener("seeked", () => {
            floatingVideo.currentTime = mainVideo.currentTime;
            window.isProgrammaticSeek = false;
          });
          // Helper to save progress back to the server (assigned globally so loadTextbookPDF can always call it)
          window.saveVideoProgress = function saveVideoProgress(
            videoId,
            currentTime,
            maxTime,
          ) {
            const studentName =
              window.ACTIVE_DATABASE_USER ||
              getActiveStudentName() ||
              "student_01";
            fetch("/api/save_progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                student_id: studentName,
                video_id: videoId,
                current_time: currentTime,
                max_time: maxTime,
              }),
            }).catch((err) =>
              console.error(
                "[PROGRESS SAVE ERROR] Failed to save progress:",
                err,
              ),
            );
          };

          // Hook window unload events to save progress when closing the app
          window.addEventListener("beforeunload", () => {
            if (
              typeof activeVideoId !== "undefined" &&
              activeVideoId &&
              typeof mainVideo !== "undefined"
            ) {
              saveVideoProgress(
                activeVideoId,
                mainVideo.currentTime,
                maxTimeWatched,
              );
            }
          });
          window.addEventListener("pagehide", () => {
            if (
              typeof activeVideoId !== "undefined" &&
              activeVideoId &&
              typeof mainVideo !== "undefined"
            ) {
              saveVideoProgress(
                activeVideoId,
                mainVideo.currentTime,
                maxTimeWatched,
              );
            }
          });

          mainVideo.addEventListener("pause", () => {
            if (typeof activeVideoId !== "undefined" && activeVideoId) {
              saveVideoProgress(
                activeVideoId,
                mainVideo.currentTime,
                maxTimeWatched,
              );
            }
          });

          mainVideo.addEventListener("timeupdate", () => {
            if (window.isRestoringVideoProgress) {
              return;
            }
            if (
              Math.abs(floatingVideo.currentTime - mainVideo.currentTime) > 0.3
            ) {
              floatingVideo.currentTime = mainVideo.currentTime;
            }
            if (!window.timelineLocked) {
              if (mainVideo.currentTime > maxTimeWatched) {
                maxTimeWatched = mainVideo.currentTime;
              }
            }
            if (typeof activeVideoId !== "undefined" && activeVideoId) {
              localStorage.setItem(
                "video_time_" + activeVideoId,
                mainVideo.currentTime,
              );
              localStorage.setItem(
                "video_max_time_" + activeVideoId,
                maxTimeWatched,
              );

              // Throttled database progress sync (every 10 seconds)
              const now = Date.now();
              if (
                !window.lastProgressSaveTime ||
                now - window.lastProgressSaveTime > 10000
              ) {
                window.lastProgressSaveTime = now;
                saveVideoProgress(
                  activeVideoId,
                  mainVideo.currentTime,
                  maxTimeWatched,
                );
              }
            }
            if (typeof updateActiveTimestampHighlight === "function") {
              updateActiveTimestampHighlight();
            }
          });
          mainVideo.addEventListener("ended", () => {
            if (typeof activeVideoId !== "undefined" && activeVideoId) {
              localStorage.removeItem("video_time_" + activeVideoId);
              localStorage.removeItem("video_max_time_" + activeVideoId);
            }
            console.log(
              "[VIDEO ENDED] Automatically navigating to Evaluation Tab.",
            );
            const evalBtn =
              document.getElementById("evaluationTabBtn") ||
              document.querySelector('[onclick*="evaluation"]');
            if (evalBtn) {
              switchSidebarTab("evaluation", evalBtn);
            }
          });
        }

        // Start student cam tracker simulation loop
        const studentVideo = document.getElementById("studentCamMock");
        const workspaceStudentVideo = document.getElementById(
          "workspaceStudentCam",
        );
        if (
          studentVideo &&
          navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia
        ) {
          navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
              studentVideo.srcObject = stream;
              if (workspaceStudentVideo)
                workspaceStudentVideo.srcObject = stream;
              startRealFaceDetection(studentVideo);
            })
            .catch((err) => {
              console.warn(
                "[CAM] Local camera inaccessible. Running webcam simulator.",
              );
              window.USING_REAL_CAMERA_DETECTION = false;
              studentVideo.src = "static/videos/eng_master_class.mp4";
              if (workspaceStudentVideo) {
                workspaceStudentVideo.src =
                  "static/videos/eng_master_class.mp4";
              }
            });
        }

        // Start vector space canvas
        init3DVectorCanvas();

        // Setup two-way bindings for simulation sandboxes
        setupSimulationTwoWayBindings();

        // Set up initial active locale select value
        if (window.ACTIVE_DATABASE_LOCALE) {
          const localeSel = document.getElementById("classroomLocaleSelect");
          if (localeSel) {
            localeSel.value = window.ACTIVE_DATABASE_LOCALE;
          }
          if (typeof translateClassroomUI === "function") {
            translateClassroomUI(window.ACTIVE_DATABASE_LOCALE);
          }
        }

        // Apply initial audio mode and mute configuration
        if (typeof updateTranslationAudioMode === "function") {
          updateTranslationAudioMode(translationAudioMode);
        }

        // Fetch registered instructors to populate CHARACTERS array
        fetch("/api/instructors")
          .then((res) => res.json())
          .then((data) => {
            if (data && data.instructors && data.instructors.length > 0) {
              // Clear static characters
              CHARACTERS.length = 0;
              data.instructors.forEach((inst) => {
                CHARACTERS.push({
                  name: inst.full_name,
                  role:
                    inst.subjects_list +
                    " Specialist (" +
                    inst.experience_years +
                    " yrs exp)",
                  avatar: inst.profile_image,
                  experience: inst.experience_years + " years",
                  phone: inst.phone_number || "N/A",
                  bio:
                    inst.biography ||
                    getInstructorBio(inst.full_name, inst.subjects_list),
                });
              });
              activeCharacterIndex = 0;
              shiftCharacter(0);
            }
          })
          .catch((err) =>
            console.warn("Failed to load instructors from DB:", err),
          );
      });

      function showDailyCapOverlay(message) {
        const overlay = document.getElementById("subjectCapOverlay");
        const msgEl = document.getElementById("subjectCapMessage");
        if (overlay && msgEl) {
          msgEl.innerText = message;
          overlay.style.display = "flex";
          // Pause main video player if active
          const video = document.getElementById("lectureVideoPlayer");
          if (video) {
            video.pause();
          }
        }
      }

      function dismissSubjectCapOverlay() {
        const overlay = document.getElementById("subjectCapOverlay");
        if (overlay) {
          overlay.style.display = "none";
        }
      }

      async function startRealFaceDetection(video) {
        try {
          console.log(
            "[CAM] Initializing BlazeFace model for real face detection...",
          );
          blazefaceModel = await blazeface.load();
          console.log("[CAM] BlazeFace model loaded successfully.");
          window.USING_REAL_CAMERA_DETECTION = true;

          if (realCamDetectInterval) clearInterval(realCamDetectInterval);

          let consecutiveNoFaceCount = 0;
          let consecutiveFaceCount = 0;

          realCamDetectInterval = setInterval(async () => {
            if (video.ended || isDeviceLocked || window.isTextbookDrawerOpen || window.isWorkspaceActive) return;
            if (video.paused && !isVideoPausedBySentry) return;

            try {
              const predictions = await blazefaceModel.estimateFaces(
                video,
                false,
              );
              if (predictions.length > 0) {
                consecutiveFaceCount++;
                consecutiveNoFaceCount = 0;

                if (consecutiveFaceCount >= 2) {
                  if (isVideoPausedBySentry) {
                    console.log("[CAM] Real face detected. Resuming video.");
                    playVideoTimeline();
                  }
                }
              } else {
                consecutiveNoFaceCount++;
                consecutiveFaceCount = 0;

                if (window.ENABLE_SENTRY_AUTO_PAUSE && consecutiveNoFaceCount >= 15) {
                  if (!isVideoPausedBySentry) {
                    console.log("[CAM] No real face detected. Pausing video.");
                    isVideoPausedBySentry = true;
                    pauseVideoTimeline();
                  }
                }
              }
            } catch (err) {
              console.error("[CAM] Detection loop error:", err);
            }
          }, 100);
        } catch (err) {
          console.warn("[CAM] Failed to initialize BlazeFace detector:", err);
          window.USING_REAL_CAMERA_DETECTION = false;
        }
      }

      async function populateCameraSources() {
        const selectEl = document.getElementById("docCamSelect");
        if (!selectEl) return;

        try {
          if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.enumerateDevices
          ) {
            console.warn("[CAM] mediaDevices not supported.");
            return;
          }

          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((d) => d.kind === "videoinput");

          if (videoDevices.length > 0) {
            let exists = false;
            for (let opt of selectEl.options) {
              if (opt.value === "separator") {
                exists = true;
                break;
              }
            }
            if (!exists) {
              const sep = document.createElement("option");
              sep.value = "separator";
              sep.disabled = true;
              sep.innerText = "── REAL CAMERAS ──";
              selectEl.appendChild(sep);

              videoDevices.forEach((device, idx) => {
                const opt = document.createElement("option");
                opt.value = `device:${device.deviceId}`;
                opt.innerText = device.label || `Desk Camera Source ${idx + 1}`;
                selectEl.appendChild(opt);
              });
            }
          }
        } catch (e) {
          console.warn("[CAM] populateCameraSources error:", e);
        }
      }

      document.addEventListener("DOMContentLoaded", () => {
        const selectEl = document.getElementById("docCamSelect");
        if (selectEl) {
          selectEl.addEventListener("change", () => {
            if (sentryCanvasInterval) {
              startSentryDeskCamera();
            }
          });
        }
      });

      function initClassroomBoot() {
        if (window.__classroomBootDone) return;
        window.__classroomBootDone = true;

        // Strict Boot Visibility Reset
        const tutor = document.getElementById("tutor-pane");
        const chat = document.getElementById("chat-pane");
        const flashcards = document.getElementById("flashcards-pane");
        const timestamps = document.getElementById("timestamps-pane");
        const profile = document.getElementById("profile-pane");

        if (tutor) tutor.style.display = "block";
        if (chat) chat.style.display = "none";
        if (flashcards) flashcards.style.display = "none";
        if (timestamps) timestamps.style.display = "none";
        if (profile) profile.style.display = "none";

        // Reset and hide whiteboard/chalkboard overlay on boot
        const wbPane = document.getElementById("whiteboardSplitPane");
        if (wbPane) {
          wbPane.classList.remove("active");
          wbPane.style.display = "none";
        }
        const wbPanelA = document.getElementById("whiteboardPanelA");
        const wbPanelB = document.getElementById("whiteboardPanelB");
        if (wbPanelA) wbPanelA.style.display = "none";
        if (wbPanelB) wbPanelB.style.display = "none";
        window.isWhiteboardExplicitlyClosed = true;

        // Populate document camera source select options
        populateCameraSources();

        // Load active video's data, textbook, and preprocessed timestamps/flashcards
        (async function bootActiveSessionVideo() {
          console.log("[BOOT] bootActiveSessionVideo starting...");
          // 1. Check global last active video ID
          let savedLocalVid = localStorage.getItem("lastActiveVideoId");

          // 2. Check subject-specific video bookmarks across any subject if global is missing
          if (!savedLocalVid) {
            const activeSub = (selectedGoalTrack || window.currentTrack || "").toLowerCase();
            if (activeSub.includes("chemistry")) {
              savedLocalVid = localStorage.getItem("lastActiveVideo_Chemistry");
            } else if (activeSub.includes("physics")) {
              savedLocalVid = localStorage.getItem("lastActiveVideo_Physics");
            } else if (activeSub.includes("philosophy")) {
              savedLocalVid = localStorage.getItem("lastActiveVideo_Philosophy");
            } else if (activeSub.includes("math")) {
              savedLocalVid = localStorage.getItem("lastActiveVideo_Mathematics");
            } else {
              savedLocalVid = localStorage.getItem("lastActiveVideo_Economics");
            }
          }

          let serverVid = null;
          try {
            const sessionResp = await fetch('/get_active_session');
            if (sessionResp.ok) {
              const sessionData = await sessionResp.json();
              if (sessionData && sessionData.active_video_id) {
                serverVid = sessionData.active_video_id;
              }
            }
          } catch(e) {
            console.warn('[SESSION BOOT WARN]', e);
          }

          // Prioritize active database/server video session, then local subject bookmark
          let finalBootVid = window.ACTIVE_DATABASE_VIDEO_ID || serverVid || savedLocalVid || "vid_economics_extraeconomiques_02_les_probl_mes_sanitaires";
          console.log("[BOOT] finalBootVid determined:", finalBootVid);

          activeVideoId = finalBootVid;
          window.ACTIVE_DATABASE_VIDEO_ID = finalBootVid;

          console.log("[BOOT] Triggering loadTextbookPDF:", activeVideoId);
          loadTextbookPDF(activeVideoId);
        })();

        // Hydrate dynamic names initially
        const welcomeHeader = document.getElementById("tutorWelcomeHeader");
        if (welcomeHeader) welcomeHeader.innerText = activeInstructorName;
        document.querySelectorAll(".user-header-label").forEach((el) => {
          el.innerText = activeStudentName;
        });
        document.querySelectorAll(".tutor-header-label").forEach((el) => {
          el.innerText = activeInstructorName;
        });
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initClassroomBoot);
      } else {
        initClassroomBoot();
      }
      window.addEventListener("load", initClassroomBoot);
    