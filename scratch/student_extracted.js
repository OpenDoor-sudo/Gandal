
        let currentStudentId = null;
        let currentPodId = null;
        let authStudyMode = "solo"; // "solo", "group", "pod"
        let wsSocket = null;
        let isMicStreaming = false;
        let isMicLocked = false;
        let activeVideoId = "vid_physics_01";
        let activeChapterId = "physics_pendulums";
        let fullCurriculumCatalogTree = {};
        let isRemoteMediaControl = false;

        window.addEventListener('DOMContentLoaded', () => {
            const savedStudentId = localStorage.getItem('ventuno_student_id');
            const savedPodId = localStorage.getItem('ventuno_pod_id');
            if (savedStudentId) {
                currentStudentId = savedStudentId;
                currentPodId = savedPodId || null;
                document.getElementById('headerStudentId').innerText = currentStudentId;
                if (currentPodId) {
                    document.getElementById('headerPodBadge').style.display = 'inline-block';
                    document.getElementById('headerPodBadge').innerText = `Pod: ${currentPodId}`;
                }
                document.getElementById('authOverlay').style.display = 'none';
                loadCourseCatalogData();
                document.getElementById('catalogOverlay').style.display = 'flex';
            } else {
                document.getElementById('authOverlay').style.display = 'flex';
            }

            document.getElementById('loginBtn').addEventListener('click', () => {
                const val = document.getElementById('studentIdInput').value.trim();
                const podVal = document.getElementById('podCodeInput').value.trim();
                if (val) {
                    currentStudentId = val;
                    if (authStudyMode === 'pod') {
                        currentPodId = podVal || `POD-${Math.floor(1000 + Math.random() * 9000)}`;
                        localStorage.setItem('ventuno_pod_id', currentPodId);
                        document.getElementById('headerPodBadge').style.display = 'inline-block';
                        document.getElementById('headerPodBadge').innerText = `Pod: ${currentPodId}`;
                    }
                    localStorage.setItem('ventuno_student_id', currentStudentId);
                    document.getElementById('headerStudentId').innerText = currentStudentId;
                    document.getElementById('authOverlay').style.display = 'none';
                    loadCourseCatalogData();
                    document.getElementById('catalogOverlay').style.display = 'flex';
                }
            });

            initVideoSyncListeners();
        });

        let currentChapterVideoList = [];
        let currentVideoIndex = 0;
        let selectedLevel = "k12";
        let selectedGrade = "TSM";
        let selectedSubject = "Economics";
        let selectedChapter = "Extraeconomiques";

        function setAuthStudyMode(mode) {
            authStudyMode = mode;
            document.querySelectorAll('#modeSoloBtn, #modeGroupBtn, #modePodBtn').forEach(b => b.classList.remove('active'));
            if (mode === 'solo') {
                document.getElementById('modeSoloBtn').classList.add('active');
                document.getElementById('studentIdLabel').innerText = "Student ID / Name";
                document.getElementById('studentIdInput').placeholder = "e.g. STU-024 or Alex M.";
                document.getElementById('podInputsGroup').style.display = 'none';
            } else if (mode === 'group') {
                document.getElementById('modeGroupBtn').classList.add('active');
                document.getElementById('studentIdLabel').innerText = "Team Member Names (1-3 comma separated)";
                document.getElementById('studentIdInput').placeholder = "e.g. Alex M., Sarah K., John D.";
                document.getElementById('podInputsGroup').style.display = 'none';
            } else if (mode === 'pod') {
                document.getElementById('modePodBtn').classList.add('active');
                document.getElementById('studentIdLabel').innerText = "Your Student ID / Name";
                document.getElementById('studentIdInput').placeholder = "e.g. STU-024 or Alex M.";
                document.getElementById('podInputsGroup').style.display = 'block';
            }
        }

        function generateNewPodCode() {
            const rand = Math.floor(1000 + Math.random() * 9000);
            document.getElementById('podCodeInput').value = `POD-${rand}`;
        }

        function loadCourseCatalogData() {
            fetch('/api/curriculum')
                .then(res => res.json())
                .then(data => {
                    if (data && data.tree) {
                        fullCurriculumCatalogTree = data.tree;
                        populateCatalogLevels();
                    }
                })
                .catch(err => console.log("[CATALOG FETCH ERROR]", err));
        }

        function populateCatalogLevels() {
            const catLevel = document.getElementById('catLevelSelect');
            if (!catLevel) return;
            catLevel.innerHTML = '<option value="">-- Select Level --</option>';
            Object.keys(fullCurriculumCatalogTree).forEach(lvl => {
                let label = lvl.replace(/_/g, ' ').toUpperCase();
                if (lvl === 'k12') label = 'Éducation K-12';
                else if (lvl === 'college_level') label = 'College Level';
                else if (lvl === 'independent_learner') label = 'Independent Learner';
                else if (lvl === 'professional_certificates') label = 'Professional Certificates';
                catLevel.innerHTML += `<option value="${lvl}">${label}</option>`;
            });

            // Default auto-select k12
            if (fullCurriculumCatalogTree['k12']) {
                catLevel.value = 'k12';
                onCatLevelChanged();
            }
        }

        function onCatLevelChanged() {
            const lvl = document.getElementById('catLevelSelect').value;
            const gradeSelect = document.getElementById('catGradeSelect');
            const subjectSelect = document.getElementById('catSubjectSelect');
            const chapterSelect = document.getElementById('catChapterSelect');
            const videoSelect = document.getElementById('catVideoSelect');

            gradeSelect.innerHTML = '<option value="">-- Select Track --</option>';
            subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
            if (chapterSelect) chapterSelect.innerHTML = '<option value="">-- Select Chapter --</option>';
            videoSelect.innerHTML = '<option value="">-- Select Video --</option>';

            if (lvl && fullCurriculumCatalogTree[lvl]) {
                Object.keys(fullCurriculumCatalogTree[lvl]).forEach(grd => {
                    gradeSelect.innerHTML += `<option value="${grd}">${grd.replace(/_/g, ' ')}</option>`;
                });
                // Auto select TSM if available
                if (fullCurriculumCatalogTree[lvl]['TSM']) {
                    gradeSelect.value = 'TSM';
                    onCatGradeChanged();
                } else if (Object.keys(fullCurriculumCatalogTree[lvl]).length > 0) {
                    gradeSelect.value = Object.keys(fullCurriculumCatalogTree[lvl])[0];
                    onCatGradeChanged();
                }
            }
        }

        function onCatGradeChanged() {
            const lvl = document.getElementById('catLevelSelect').value;
            const grd = document.getElementById('catGradeSelect').value;
            const subjectSelect = document.getElementById('catSubjectSelect');
            const chapterSelect = document.getElementById('catChapterSelect');
            const videoSelect = document.getElementById('catVideoSelect');

            subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
            if (chapterSelect) chapterSelect.innerHTML = '<option value="">-- Select Chapter --</option>';
            videoSelect.innerHTML = '<option value="">-- Select Video --</option>';

            if (lvl && grd && fullCurriculumCatalogTree[lvl] && fullCurriculumCatalogTree[lvl][grd]) {
                Object.keys(fullCurriculumCatalogTree[lvl][grd]).forEach(subj => {
                    subjectSelect.innerHTML += `<option value="${subj}">${subj.replace(/_/g, ' ')}</option>`;
                });
                if (fullCurriculumCatalogTree[lvl][grd]['Economics']) {
                    subjectSelect.value = 'Economics';
                    onCatSubjectChanged();
                } else if (Object.keys(fullCurriculumCatalogTree[lvl][grd]).length > 0) {
                    subjectSelect.value = Object.keys(fullCurriculumCatalogTree[lvl][grd])[0];
                    onCatSubjectChanged();
                }
            }
        }

        function onCatSubjectChanged() {
            const lvl = document.getElementById('catLevelSelect').value;
            const grd = document.getElementById('catGradeSelect').value;
            const subj = document.getElementById('catSubjectSelect').value;
            const chapterSelect = document.getElementById('catChapterSelect');
            const videoSelect = document.getElementById('catVideoSelect');

            if (chapterSelect) chapterSelect.innerHTML = '<option value="">-- Select Chapter --</option>';
            videoSelect.innerHTML = '<option value="">-- Select Video --</option>';

            if (lvl && grd && subj && fullCurriculumCatalogTree[lvl] && fullCurriculumCatalogTree[lvl][grd] && fullCurriculumCatalogTree[lvl][grd][subj]) {
                const subObj = fullCurriculumCatalogTree[lvl][grd][subj];
                if (Array.isArray(subObj)) {
                    if (chapterSelect) chapterSelect.innerHTML = `<option value="Main Chapter">Main Chapter</option>`;
                    populateVideoOptions(subObj);
                } else if (typeof subObj === 'object') {
                    Object.keys(subObj).forEach(chap => {
                        if (chapterSelect) chapterSelect.innerHTML += `<option value="${chap}">${chap.replace(/_/g, ' ')}</option>`;
                    });
                    const firstChap = Object.keys(subObj)[0];
                    if (firstChap && chapterSelect) {
                        chapterSelect.value = firstChap;
                        onCatChapterChanged();
                    }
                }
            }
        }

        function onCatChapterChanged() {
            const lvl = document.getElementById('catLevelSelect').value;
            const grd = document.getElementById('catGradeSelect').value;
            const subj = document.getElementById('catSubjectSelect').value;
            const chap = document.getElementById('catChapterSelect') ? document.getElementById('catChapterSelect').value : null;

            if (lvl && grd && subj && fullCurriculumCatalogTree[lvl] && fullCurriculumCatalogTree[lvl][grd] && fullCurriculumCatalogTree[lvl][grd][subj]) {
                const subObj = fullCurriculumCatalogTree[lvl][grd][subj];
                let videoFiles = [];
                if (Array.isArray(subObj)) {
                    videoFiles = subObj;
                } else if (chap && subObj[chap]) {
                    videoFiles = subObj[chap];
                }
                populateVideoOptions(videoFiles);
            }
        }

        function populateVideoOptions(videoFiles) {
            const videoSelect = document.getElementById('catVideoSelect');
            videoSelect.innerHTML = '<option value="">-- Select Video --</option>';
            // Filter video files
            const vids = (videoFiles || []).filter(f => !f.endsWith('.pdf') && !f.endsWith('.mp3'));
            const finalFiles = vids.length > 0 ? vids : (videoFiles || []);
            
            if (finalFiles.length === 0) {
                videoSelect.innerHTML += `<option value="01_Lesson.mp4">01. Main Lesson</option>`;
            } else {
                finalFiles.forEach(f => {
                    let cleanName = f.replace(/\.[^/.]+$/, "").replace(/_/g, ' ');
                    videoSelect.innerHTML += `<option value="${f}">${cleanName}</option>`;
                });
                videoSelect.value = finalFiles[0];
            }
        }

        function openCatalogModal() {
            document.getElementById('catalogOverlay').style.display = 'flex';
        }

        function startSelectedLesson() {
            selectedLevel = document.getElementById('catLevelSelect').value || "k12";
            selectedGrade = document.getElementById('catGradeSelect').value || "TSM";
            selectedSubject = document.getElementById('catSubjectSelect').value || "Economics";
            selectedChapter = document.getElementById('catChapterSelect') ? (document.getElementById('catChapterSelect').value || "Extraeconomiques") : "Extraeconomiques";
            
            const selectedVidFile = document.getElementById('catVideoSelect').value || "01_Les problèmes démographiques.mp4";
            
            let chapterVideos = [];
            try {
                const subObj = fullCurriculumCatalogTree[selectedLevel][selectedGrade][selectedSubject];
                if (Array.isArray(subObj)) {
                    chapterVideos = subObj;
                } else if (subObj && subObj[selectedChapter]) {
                    chapterVideos = subObj[selectedChapter];
                }
            } catch (e) {}

            chapterVideos = (chapterVideos || []).filter(f => !f.endsWith('.pdf') && !f.endsWith('.mp3'));
            if (chapterVideos.length === 0) {
                chapterVideos = [selectedVidFile];
            }

            currentChapterVideoList = chapterVideos;
            currentVideoIndex = chapterVideos.indexOf(selectedVidFile);
            if (currentVideoIndex === -1) currentVideoIndex = 0;

            loadActiveVideo(selectedVidFile);
            renderUpcomingPlaylist(chapterVideos, currentVideoIndex);

            document.getElementById('catalogOverlay').style.display = 'none';
            initWebSocket();
        }

        function loadActiveVideo(vidFileName) {
            activeVideoId = `vid_${selectedSubject}_${vidFileName}`;
            const cleanTitle = vidFileName.replace(/\.[^/.]+$/, "").replace(/_/g, ' ');
            document.getElementById('activeLessonLabel').innerText = cleanTitle;
            document.getElementById('activeChapterBadge').innerText = `Chapter: ${selectedChapter.replace(/_/g, ' ')}`;
            document.getElementById('activeLessonSubtext').innerText = `${selectedSubject.replace(/_/g, ' ')} • Local Progressive Stream`;

            const vid = document.getElementById('studentVideoPlayer');
            if (vid) {
                let streamPath = `/curriculum_staging/${encodeURIComponent(selectedLevel)}/${encodeURIComponent(selectedGrade)}/${encodeURIComponent(selectedSubject)}`;
                if (selectedChapter && selectedChapter !== "Main Chapter") {
                    streamPath += `/${encodeURIComponent(selectedChapter)}`;
                }
                streamPath += `/${encodeURIComponent(vidFileName)}`;
                vid.src = streamPath;
                vid.load();
                vid.play().catch(e => console.log("[AUTOPLAY BLOCKED]", e));
            }

            loadIngestedMCQs(activeVideoId);
        }

        function renderUpcomingPlaylist(videoList, activeIdx) {
            const container = document.getElementById('upcomingVideosContainer');
            if (!container) return;
            container.innerHTML = '';

            const upcoming = videoList.slice(activeIdx + 1, activeIdx + 4);
            if (upcoming.length === 0) {
                container.innerHTML = `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 1.25rem; text-align: center; color: #94a3b8; font-size: 0.85rem;">
                        🎉 You are watching the final lesson of this unit! Pass the evaluation to complete mastery.
                    </div>
                `;
                return;
            }

            upcoming.forEach((vidFile, i) => {
                const lessonNum = activeIdx + 2 + i;
                const cleanTitle = vidFile.replace(/\.[^/.]+$/, "").replace(/_/g, ' ');
                
                const card = document.createElement('div');
                card.id = `upcoming-card-${i}`;
                card.style.cssText = `
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    transition: all 0.2s ease;
                    opacity: 0.75;
                `;

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.75rem; font-weight: 700; color: #60a5fa; background: rgba(59,130,246,0.15); padding: 2px 6px; border-radius: 4px;">LESSON ${lessonNum}</span>
                        <span id="lock-badge-${i}" style="font-size: 0.75rem; color: #f59e0b; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                            🔒 Locked
                        </span>
                    </div>
                    <div style="font-size: 0.88rem; font-weight: 600; color: #e2e8f0; line-height: 1.25; margin-top: 2px;">${cleanTitle}</div>
                    <div id="lock-sub-${i}" style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">Requires 85% mastery score on Lesson ${activeIdx + 1}</div>
                `;

                container.appendChild(card);
            });
        }

        function unlockNextLessonVideo() {
            if (currentChapterVideoList && currentVideoIndex + 1 < currentChapterVideoList.length) {
                const nextIdx = currentVideoIndex + 1;
                const nextVidFile = currentChapterVideoList[nextIdx];
                
                const lockBadge = document.getElementById('lock-badge-0');
                const lockSub = document.getElementById('lock-sub-0');
                const firstCard = document.getElementById('upcoming-card-0');
                
                if (lockBadge) {
                    lockBadge.innerHTML = '🔓 Unlocked!';
                    lockBadge.style.color = '#34d399';
                }
                if (lockSub) {
                    lockSub.innerHTML = 'Click to advance to this lesson now';
                    lockSub.style.color = '#34d399';
                }
                if (firstCard) {
                    firstCard.style.opacity = '1';
                    firstCard.style.borderColor = '#10b981';
                    firstCard.style.cursor = 'pointer';
                    firstCard.onclick = () => {
                        currentVideoIndex = nextIdx;
                        loadActiveVideo(nextVidFile);
                        renderUpcomingPlaylist(currentChapterVideoList, currentVideoIndex);
                        switchTab('tab1-mic');
                    };
                }
            }
        }

        function formatTime(seconds) {
            if (isNaN(seconds) || seconds === Infinity) return "00:00";
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        let maxWatchedTime = 0;

        function updateCustomVideoControls() {
            const vid = document.getElementById('studentVideoPlayer');
            if (!vid) return;
            
            // Track maximum watched timestamp to prevent skipping forward
            if (vid.currentTime > maxWatchedTime) {
                maxWatchedTime = vid.currentTime;
            }

            // Auto-unlock tabs as soon as video nears completion (within 3 seconds or >= 98%)
            if (vid.duration && (vid.currentTime >= vid.duration - 3 || (vid.duration > 10 && vid.currentTime >= vid.duration * 0.98))) {
                unlockClassroomTabs();
            }

            const curTime = document.getElementById('videoCurrentTimeDisplay');
            const durTime = document.getElementById('videoDurationDisplay');
            const slider = document.getElementById('videoTimelineSlider');
            const playIcon = document.getElementById('playIcon');
            const playText = document.getElementById('playText');
            const playBtn = document.getElementById('customPlayPauseBtn');

            if (curTime) curTime.innerText = formatTime(vid.currentTime);
            if (durTime && vid.duration) durTime.innerText = formatTime(vid.duration);

            if (slider && vid.duration && !slider.matches(':active')) {
                slider.value = (vid.currentTime / vid.duration) * 100;
            }

            if (vid.paused) {
                if (playIcon) playIcon.innerText = "▶️";
                if (playText) playText.innerText = "Play";
                if (playBtn) playBtn.style.background = "#10b981";
            } else {
                if (playIcon) playIcon.innerText = "⏸️";
                if (playText) playText.innerText = "Pause";
                if (playBtn) playBtn.style.background = "#2563eb";
            }
        }

        function unlockAndGoToEvaluation() {
            unlockClassroomTabs();
            switchTab('tab2-evaluation');
        }

        function toggleCustomPlayPause() {
            const vid = document.getElementById('studentVideoPlayer');
            if (!vid) return;
            if (vid.paused) {
                vid.play();
            } else {
                vid.pause();
            }
            updateCustomVideoControls();
        }

        function restartVideoPlayback() {
            const vid = document.getElementById('studentVideoPlayer');
            if (!vid) return;
            vid.currentTime = 0;
            vid.play();
            updateCustomVideoControls();
            if (wsSocket && wsSocket.readyState === WebSocket.OPEN && currentPodId) {
                wsSocket.send(JSON.stringify({
                    action: "POD_MEDIA_CONTROL",
                    command: "play",
                    current_time: 0,
                    pod_id: currentPodId,
                    sender: currentStudentId
                }));
            }
        }

        function onSeekSliderInput(val) {
            const vid = document.getElementById('studentVideoPlayer');
            if (!vid || !vid.duration) return;
            let targetTime = (val / 100) * vid.duration;
            if (targetTime > maxWatchedTime + 1) {
                targetTime = maxWatchedTime;
            }
            const curTime = document.getElementById('videoCurrentTimeDisplay');
            if (curTime) curTime.innerText = formatTime(targetTime);
        }

        function onSeekSliderChange(val) {
            const vid = document.getElementById('studentVideoPlayer');
            if (!vid || !vid.duration) return;
            let targetTime = (val / 100) * vid.duration;
            if (targetTime > maxWatchedTime + 1) {
                targetTime = maxWatchedTime;
                const slider = document.getElementById('videoTimelineSlider');
                if (slider) slider.value = (maxWatchedTime / vid.duration) * 100;
            }
            vid.currentTime = targetTime;
            updateCustomVideoControls();
            if (wsSocket && wsSocket.readyState === WebSocket.OPEN && currentPodId) {
                wsSocket.send(JSON.stringify({
                    action: "POD_MEDIA_CONTROL",
                    command: vid.paused ? "pause" : "play",
                    current_time: vid.currentTime,
                    pod_id: currentPodId,
                    sender: currentStudentId
                }));
            }
        }

        function toggleMuteVideo() {
            const vid = document.getElementById('studentVideoPlayer');
            if (!vid) return;
            vid.muted = !vid.muted;
            const muteBtn = document.getElementById('muteBtn');
            if (muteBtn) {
                muteBtn.innerText = vid.muted ? "🔇" : "🔊";
            }
        }

        function onVolumeChange(val) {
            const vid = document.getElementById('studentVideoPlayer');
            if (!vid) return;
            vid.volume = parseFloat(val);
            vid.muted = (vid.volume === 0);
            const muteBtn = document.getElementById('muteBtn');
            if (muteBtn) {
                muteBtn.innerText = vid.muted ? "🔇" : "🔊";
            }
        }

        function toggleFullscreenVideo() {
            const vid = document.getElementById('studentVideoPlayer');
            if (!vid) return;
            if (!document.fullscreenElement) {
                if (vid.requestFullscreen) vid.requestFullscreen();
                else if (vid.webkitRequestFullscreen) vid.webkitRequestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        }

        function initVideoSyncListeners() {
            const vid = document.getElementById('studentVideoPlayer');
            if (!vid) return;

            vid.addEventListener('timeupdate', updateCustomVideoControls);
            vid.addEventListener('loadedmetadata', () => {
                maxWatchedTime = 0;
                updateCustomVideoControls();
            });

            // Auto-unlock Tab 2 & Tab 3 when video ends
            vid.addEventListener('ended', () => {
                console.log("[LESSON COMPLETE] Video ended. Unlocking Tab 2 & Tab 3...");
                unlockClassroomTabs();
                switchTab('tab2-evaluation');
                
                const resBox = document.getElementById('quizResultBox');
                if (resBox) {
                    resBox.style.display = 'block';
                    resBox.className = 'quiz-result-box';
                    resBox.style.borderColor = '#10b981';
                    resBox.style.background = 'rgba(16,185,129,0.1)';
                    resBox.style.color = '#34d399';
                    resBox.innerHTML = '🎉 <strong>Lesson Complete!</strong> Tab 2 (Evaluation) and Tab 3 (Upload Work) are now unlocked. Please answer the evaluation questions below!';
                }

                if (wsSocket && wsSocket.readyState === WebSocket.OPEN && currentPodId) {
                    wsSocket.send(JSON.stringify({
                        action: "LESSON_COMPLETE",
                        video_id: activeVideoId,
                        pod_id: currentPodId,
                        student_id: currentStudentId
                    }));
                }
            });

            vid.addEventListener('play', () => {
                updateCustomVideoControls();
                if (isRemoteMediaControl) return;
                if (wsSocket && wsSocket.readyState === WebSocket.OPEN && currentPodId) {
                    wsSocket.send(JSON.stringify({
                        action: "POD_MEDIA_CONTROL",
                        command: "play",
                        current_time: vid.currentTime,
                        pod_id: currentPodId,
                        sender: currentStudentId
                    }));
                }
            });

            vid.addEventListener('pause', () => {
                updateCustomVideoControls();
                if (isRemoteMediaControl) return;
                if (wsSocket && wsSocket.readyState === WebSocket.OPEN && currentPodId) {
                    wsSocket.send(JSON.stringify({
                        action: "POD_MEDIA_CONTROL",
                        command: "pause",
                        current_time: vid.currentTime,
                        pod_id: currentPodId,
                        sender: currentStudentId
                    }));
                }
            });
        }

        function loadIngestedMCQs(videoId) {
            fetch(`/get_quiz_questions?video_id=${encodeURIComponent(videoId)}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.main && data.main.length > 0) {
                        renderIngestedQuiz(data.main);
                    } else {
                        // Generate topic-aligned default quiz for Economics/Science
                        let sampleQuiz = [];
                        if (videoId.toLowerCase().includes('demograph') || videoId.toLowerCase().includes('economic')) {
                            sampleQuiz = [
                                {
                                    id: 1,
                                    question: "Qu'est-ce que l'explosion démographique selon le cours ?",
                                    options: {
                                        "A": "Une augmentation accélérée et incontrôlée des effectifs de la population",
                                        "B": "Une baisse drastique du taux de natalité",
                                        "C": "Une stagnation de la population active",
                                        "D": "Une migration massive vers les zones rurales"
                                    }
                                },
                                {
                                    id: 2,
                                    question: "Quel est l'impact principal d'une forte croissance démographique sur les infrastructures de santé ?",
                                    options: {
                                        "A": "Une réduction du ratio praticiens/habitants et une saturation des centres de soins",
                                        "B": "Une diminution spontanée des maladies infectieuses",
                                        "C": "Une surabondance des équipements médicaux"
                                    }
                                },
                                {
                                    id: 3,
                                    question: "Comment l'équilibre alimentaire est-il affecté par la pression démographique ?",
                                    options: {
                                        "A": "La demande alimentaire dépasse les capacités de production locale",
                                        "B": "Les rendements agricoles doublent automatiquement sans intrants",
                                        "C": "Le taux de dépendance économique diminue à zéro"
                                    }
                                }
                            ];
                        } else {
                            sampleQuiz = [
                                {
                                    id: 1,
                                    question: "What principle governs the conservation of mechanical energy in harmonic motion?",
                                    options: {
                                        "A": "Kinetic energy exchanges with potential energy without net dissipative loss",
                                        "B": "Thermal expansion accelerates angular frequency",
                                        "C": "Centrifugal forces cancel out gravitational acceleration"
                                    }
                                },
                                {
                                    id: 2,
                                    question: "How does lengthening the pendulum arm impact its oscillatory period T?",
                                    options: {
                                        "A": "The period increases proportionally to the square root of length",
                                        "B": "The period drops to zero",
                                        "C": "The frequency doubles instantly"
                                    }
                                }
                            ];
                        }
                        renderIngestedQuiz(sampleQuiz);
                    }
                })
                .catch(err => console.log("[MCQ FETCH ERROR]", err));
        }

        function unlockClassroomTabs(quizData) {
            const tabBtn2 = document.getElementById('tabBtn2');
            const tabBtn3 = document.getElementById('tabBtn3');

            if (tabBtn2) {
                tabBtn2.classList.remove('disabled');
                tabBtn2.style.pointerEvents = 'auto';
                tabBtn2.style.opacity = '1';
                tabBtn2.innerHTML = '📝 Tab 2: Evaluation';
            }

            if (tabBtn3) {
                tabBtn3.classList.remove('disabled');
                tabBtn3.style.pointerEvents = 'auto';
                tabBtn3.style.opacity = '1';
                tabBtn3.innerHTML = '💬 Tab 3: Chat/Upload';
            }

            if (quizData && quizData.questions) {
                renderIngestedQuiz(quizData.questions);
            }
        }

        function switchTab(tabId) {
            const btnMap = {
                'tab1-mic': 'tabBtn1',
                'tab2-evaluation': 'tabBtn2',
                'tab3-chat': 'tabBtn3'
            };

            const targetBtn = document.getElementById(btnMap[tabId]);
            if (targetBtn && targetBtn.classList.contains('disabled')) {
                return;
            }

            document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

            document.getElementById(tabId).classList.add('active');
            targetBtn.classList.add('active');
        }

        function renderIngestedQuiz(questionsList) {
            const container = document.getElementById('quizQuestionsContainer');
            if (!questionsList || questionsList.length === 0) {
                container.innerHTML = `<div class="question-card">
                    <div class="question-text">1. What balances period in a simple pendulum?</div>
                    <div class="options-list">
                        <label class="option-label"><input type="radio" name="q1" value="A"> A) Gravity restoring force</label>
                        <label class="option-label"><input type="radio" name="q1" value="B"> B) Centrifugal expansion</label>
                        <label class="option-label"><input type="radio" name="q1" value="C"> C) Thermal damping</label>
                    </div>
                </div>`;
            } else {
                let html = '';
                questionsList.forEach((q, idx) => {
                    const qId = q.id || (idx + 1);
                    const qText = q.question;
                    const opts = q.options || {};
                    html += `<div class="question-card">
                        <div class="question-text">${idx + 1}. ${qText}</div>
                        <div class="options-list">`;
                    if (Array.isArray(opts)) {
                        opts.forEach((optText, oIdx) => {
                            const letter = String.fromCharCode(65 + oIdx);
                            html += `<label class="option-label">
                                <input type="radio" name="q${qId}" value="${letter}"> ${letter}) ${optText}
                            </label>`;
                        });
                    } else {
                        Object.keys(opts).forEach(letter => {
                            html += `<label class="option-label">
                                <input type="radio" name="q${qId}" value="${letter}"> ${letter}) ${opts[letter]}
                            </label>`;
                        });
                    }
                    html += `</div></div>`;
                });
                container.innerHTML = html;
            }
            document.getElementById('submitQuizBtn').style.display = 'block';
        }

        function submitEvaluation() {
            const answers = {};
            const cards = document.querySelectorAll('.question-card');
            cards.forEach(card => {
                const radios = card.querySelectorAll('input[type="radio"]');
                if (radios.length > 0) {
                    const name = radios[0].name;
                    const qId = name.replace('q', '');
                    const selected = card.querySelector(`input[name="${name}"]:checked`);
                    if (selected) {
                        answers[qId] = selected.value;
                    }
                }
            });

            if (wsSocket && wsSocket.readyState === WebSocket.OPEN) {
                wsSocket.send(JSON.stringify({
                    action: "SUBMIT_QUIZ",
                    student_id: currentStudentId,
                    video_id: activeVideoId,
                    chapter_id: activeChapterId,
                    answers: answers
                }));
            }
        }

        function displayQuizResult(data) {
            const resBox = document.getElementById('quizResultBox');
            resBox.style.display = 'block';
            if (data.passed || (data.score && data.score >= 85)) {
                resBox.className = 'quiz-result-box passed';
                resBox.innerHTML = `🎉 Score: ${data.score}% - Evaluation Passed! <br/><button onclick="unlockNextLessonVideo(); switchTab('tab1-mic');" style="margin-top: 8px; padding: 6px 14px; background: #059669; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">🚀 Advance to Next Lesson</button>`;
                unlockNextLessonVideo();
            } else {
                resBox.className = 'quiz-result-box failed';
                resBox.innerText = `⚠️ Score: ${data.score}% - Review derivation notes and resubmit work.`;
            }
        }

        let pendingBase64Image = null;
        function previewHandwritingImage(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    pendingBase64Image = e.target.result;
                    const img = document.getElementById('uploadPreview');
                    img.src = pendingBase64Image;
                    img.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        }

        function uploadHandwritingWork() {
            if (!pendingBase64Image) return;

            if (wsSocket && wsSocket.readyState === WebSocket.OPEN) {
                wsSocket.send(JSON.stringify({
                    action: "SUBMIT_HANDWRITING_IMAGE",
                    student_id: currentStudentId,
                    video_id: activeVideoId,
                    chapter_id: activeChapterId,
                    image_data: pendingBase64Image
                }));

                const feed = document.getElementById('chatFeed');
                feed.innerHTML += `<div class="chat-bubble student">Submitted handwritten derivation work for evaluation.</div>`;
                feed.scrollTop = feed.scrollHeight;
            }
        }
    