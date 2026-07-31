import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

target_block = '''              if (typeof updateActiveTimestampHighlight === "function") {
              updateActiveTimestampHighlight();
            }
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
      } catch (err) {
        console.warn("[LOAD_LESSON] Failed to load lesson data:", err);
      }
    }'''

replacement_block = '''              if (typeof updateActiveTimestampHighlight === "function") {
                updateActiveTimestampHighlight();
              }
            }
          }
        } catch (err) {
          console.warn("[LOAD_LESSON] Failed to load lesson data:", err);
        }
      }

      const mainVideo = document.getElementById("lectureVideoPlayer");
      if (mainVideo) {
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
      }'''

txt = txt.replace(target_block, replacement_block)
open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully fixed loadTextbookPDF function closing structure and ended listener!")
