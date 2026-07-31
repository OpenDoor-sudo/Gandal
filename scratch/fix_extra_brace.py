import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

target = '''              if (typeof updateActiveTimestampHighlight === "function") {
                updateActiveTimestampHighlight();
              }
            }
          }
        } catch (err) {'''

replacement = '''              if (typeof updateActiveTimestampHighlight === "function") {
                updateActiveTimestampHighlight();
              }
            }
        } catch (err) {'''

txt = txt.replace(target, replacement)
open(html_path, 'w', encoding='utf-8').write(txt)
print("Removed extra brace!")
