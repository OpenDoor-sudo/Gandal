import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update CURRICULA dictionary with authentic timestamps for Economics and Chemistry
old_curricula = """      const CURRICULA = {
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
        ],"""

new_curricula = """      const CURRICULA = {
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
        ],"""

txt = txt.replace(old_curricula, new_curricula)

# 2. Update renderCurriculumTimestamps resolution logic
old_render_timestamps = """        const chapters =
          CURRICULA[track] || CURRICULA[curKey] || CURRICULA["College"];"""

new_render_timestamps = """        let chapters = null;
        if (typeof activeVideoId !== "undefined" && activeVideoId && CURRICULA[activeVideoId]) {
          chapters = CURRICULA[activeVideoId];
        }
        if (!chapters) {
          chapters = CURRICULA[track] || CURRICULA[curKey] || CURRICULA["k12/12th_SM/Economics"] || CURRICULA["College"];
        }"""

txt = txt.replace(old_render_timestamps, new_render_timestamps)

# 3. Call renderCurriculumTimestamps in loadTextbookPDF whenever a video is loaded
old_load_sync = """              // Update Profile Card video title and course title dynamically
              const currentPlayingTitle = data.video_file_path ? data.video_file_path.split("/").pop() : (data.title || "Lesson");
              document.querySelectorAll("#currentlyStudyingTitle, #profileTrackName, #tabProfileTrackName, #modalProfileTrackName").forEach((el) => {
                if (el) el.innerText = currentPlayingTitle;
              });"""

new_load_sync = """              if (data.timestamps && data.timestamps.length > 0) {
                CURRICULA[data.video_id] = data.timestamps.map((ts, idx) => ({
                  time: ts.time,
                  title: ts.title,
                  active: idx === 0,
                  video_id: data.video_id,
                  chapter_id: ts.chapter_id || "ch_" + idx
                }));
                CURRICULA[selectedGoalTrack] = CURRICULA[data.video_id];
              }

              if (typeof renderCurriculumTimestamps === "function") {
                renderCurriculumTimestamps(selectedGoalTrack);
              }

              // Update Profile Card video title and course title dynamically
              const currentPlayingTitle = data.video_file_path ? data.video_file_path.split("/").pop() : (data.title || "Lesson");
              document.querySelectorAll("#currentlyStudyingTitle, #profileTrackName, #tabProfileTrackName, #modalProfileTrackName").forEach((el) => {
                if (el) el.innerText = currentPlayingTitle;
              });"""

txt = txt.replace(old_load_sync, new_load_sync)

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully updated HORODATAGES timestamps synchronization in index.html!")
