import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

target = '''          mainVideo.addEventListener("ended", () => {
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
        }'''

replacement = '''          mainVideo.addEventListener("ended", () => {
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
      } catch (err) {
        console.warn("[LOAD_LESSON] Failed to load lesson data:", err);
      }
    }'''

if target in txt:
    txt = txt.replace(target, replacement)
    open(html_path, 'w', encoding='utf-8').write(txt)
    print("Successfully added catch & closing brace for loadTextbookPDF!")
else:
    print("Could not find target!")
