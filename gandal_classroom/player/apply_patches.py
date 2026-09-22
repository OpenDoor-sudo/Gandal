"""Patch a pinned OpenMAIC checkout so the player we run is English or French.

The checkout itself is cloned by run_player.sh and is not committed.
This script deletes the Chinese locales, keeps English and French, and
rewrites prompts and menus that would otherwise teach or display Chinese.
"""

import json
import os
import re
import sys

CJK = re.compile(r"[\u3400-\u9fff\uf900-\ufaff]")
PINNED_LOCALES = """export type LocaleEntry = {
  code: string;
  /** Native name shown in the language menu. */
  label: string;
  /** Short label shown on the toggle button. */
  shortLabel: string;
};

/**
 * Product languages. English is the default. French is selectable.
 * Chinese locales are not registered.
 */
export const supportedLocales = [
  { code: 'en-US', label: 'English', shortLabel: 'EN' },
  { code: 'fr-FR', label: 'Français', shortLabel: 'FR' },
] as const satisfies readonly LocaleEntry[];
"""

MENU = {
    "解锁": "Unlock",
    "剪切": "Cut",
    "复制": "Copy",
    "粘贴": "Paste",
    "水平居中": "Center horizontally",
    "水平垂直居中": "Center",
    "左对齐": "Align left",
    "右对齐": "Align right",
    "垂直居中": "Center vertically",
    "顶部对齐": "Align top",
    "底部对齐": "Align bottom",
    "置于顶层": "Bring to front",
    "上移一层": "Bring forward",
    "置于底层": "Send to back",
    "下移一层": "Send backward",
    "设置链接": "Link",
    "取消组合": "Ungroup",
    "组合": "Group",
    "全选": "Select all",
    "锁定": "Lock",
    "删除": "Delete",
    "启动": "Start",
    "重新开始": "Reset",
    "开始": "Start",
    "重试": "Retry",
    "确定": "OK",
    "取消": "Cancel",
    "智能体配置": "Agent settings",
}

LANGUAGE_RULE = (
    "Write every title, button, caption, and spoken line in English or French only. "
    "Never write Chinese characters. If the source is not English or French, "
    "translate the idea into the selected language.\n"
)


def _replace_menu(text: str) -> str:
    for src, dst in sorted(MENU.items(), key=lambda item: len(item[0]), reverse=True):
        text = text.replace(src, dst)
    return text


def _strip_cjk(text: str) -> str:
    return CJK.sub("", text)


def _rewrite_json_strings(path: str) -> None:
    data = json.loads(open(path, encoding="utf-8").read())

    def walk(value):
        if isinstance(value, dict):
            return {key: walk(item) for key, item in value.items()}
        if isinstance(value, list):
            return [walk(item) for item in value]
        if isinstance(value, str):
            return _strip_cjk(_replace_menu(value))
        return value

    cleaned = walk(data)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(cleaned, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def _rewrite_generation_fallbacks(root: str) -> None:
    """English fallback lines the generator speaks if a model reply is thin."""
    path = os.path.join(root, "packages", "@openmaic", "generation", "src", "scene-generator.ts")
    text = open(path, encoding="utf-8").read()
    replacements = (
        (
            "let assignedImagesText = '无可用图片，禁止插入任何 image 元素';",
            "let assignedImagesText = 'No images are available. Do not insert image elements.';",
        ),
        (".includes('禁止插入')", ".includes('Do not insert image elements')"),
        ("elements: '（根据要点自动生成）'", "elements: 'Generate elements from the key points.'"),
        ("title: 'PBL 项目介绍'", "title: 'Project'"),
        (
            "text: '现在让我们开始一个项目式学习活动，了解项目的驱动问题，并在项目工作区中逐步探索和实践。'",
            "text: 'Let us start the project and look at the driving question.'",
        ),
        ("title: '聚焦重点'", "title: 'Focus'"),
        ("title: '场景讲解'", "title: 'Explanation'"),
        ("title: '测验引导'", "title: 'Quiz'"),
        (
            "text: '现在让我们来做一个小测验，检验一下学习成果。'",
            "text: 'Let us try a short quiz.'",
        ),
        ("title: '交互引导'", "title: 'Explore'"),
        (
            "text: '现在让我们通过交互式可视化来探索这个概念。请尝试操作页面中的元素，观察变化。'",
            "text: 'Try the controls on the page and watch what changes.'",
        ),
    )
    for src, dst in replacements:
        text = text.replace(src, dst)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(text)


def _rewrite_text_file(path: str) -> None:
    text = open(path, encoding="utf-8", errors="ignore").read()
    updated = _strip_cjk(_replace_menu(text))
    if updated != text:
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(updated)


def _rewrite_locales(root: str) -> None:
    locales = os.path.join(root, "lib", "i18n", "locales.ts")
    with open(locales, "w", encoding="utf-8") as handle:
        handle.write(PINNED_LOCALES)
    types = os.path.join(root, "lib", "i18n", "types.ts")
    text = open(types, encoding="utf-8").read()
    text = text.replace("export const defaultLocale: Locale = 'zh-CN';", "export const defaultLocale: Locale = 'en-US';")
    with open(types, "w", encoding="utf-8") as handle:
        handle.write(text)
    for name in ("zh-CN.json", "zh-TW.json"):
        path = os.path.join(root, "lib", "i18n", "locales", name)
        if os.path.exists(path):
            os.remove(path)
    workbench_zh = os.path.join(root, "lib", "i18n", "workbench-locales", "zh-TW.json")
    if os.path.exists(workbench_zh):
        os.remove(workbench_zh)
    workbench = os.path.join(root, "lib", "i18n", "workbench.ts")
    wb = open(workbench, encoding="utf-8").read()
    wb = wb.replace(
        "import workbenchZhTW from './workbench-locales/zh-TW.json' with { type: 'json' };\n",
        "",
    )
    wb = wb.replace("  'zh-TW': workbenchZhTW,\n", "")
    wb = wb.replace(
        "locale.toLowerCase().startsWith('zh') ? workbenchZh : workbenchEn",
        "workbenchEn",
    )
    wb = wb.replace("createWorkbenchTranslator('zh-CN')", "createWorkbenchTranslator('en-US')")
    wb = _strip_cjk(_replace_menu(wb))
    with open(workbench, "w", encoding="utf-8") as handle:
        handle.write(wb)
    _rename_agent_labels(root)
    for name in ("en-US.json", "fr-FR.json"):
        _rewrite_json_strings(os.path.join(root, "lib", "i18n", "locales", name))


def _rewrite_prompts(root: str) -> None:
    outline = os.path.join(root, "packages", "@openmaic", "generation", "src", "outline-generator.ts")
    text = open(outline, encoding="utf-8").read()
    text = text.replace(
        "Teach in the language that matches the user requirement.",
        "Teach only in English or French. Use French when the learner writes in French; otherwise use English. Never write Chinese characters.",
    )
    with open(outline, "w", encoding="utf-8") as handle:
        handle.write(_strip_cjk(_replace_menu(text)))
    prompt_roots = [
        os.path.join(root, "packages", "@openmaic", "generation", "templates"),
        os.path.join(root, "packages", "@openmaic", "generation", "snippets"),
        os.path.join(root, "packages", "@openmaic", "generation", "prompts-pbl"),
        os.path.join(root, "lib", "pbl"),
    ]
    for folder in prompt_roots:
        for dirpath, _, files in os.walk(folder):
            for name in files:
                if name.endswith((".md", ".ts", ".tsx")):
                    path = os.path.join(dirpath, name)
                    original = open(path, encoding="utf-8", errors="ignore").read()
                    updated = _strip_cjk(_replace_menu(original))
                    if (
                        name == "system.md"
                        and "requirements-to-outlines" in path
                        and "Never write Chinese characters." not in updated
                    ):
                        updated = LANGUAGE_RULE + "\n" + updated
                    if updated != original:
                        with open(path, "w", encoding="utf-8") as handle:
                            handle.write(updated)


def _rewrite_ui_and_skills(root: str) -> None:
    roots = [
        os.path.join(root, "components"),
        os.path.join(root, "app"),
        os.path.join(root, "lib"),
        os.path.join(root, "configs"),
        os.path.join(root, "skills"),
        os.path.join(root, "packages", "@openmaic", "editor", "src"),
    ]
    for folder in roots:
        if not os.path.isdir(folder):
            continue
        for dirpath, _, files in os.walk(folder):
            rel = os.path.relpath(dirpath, root)
            _rewrite_ui_dir(root, dirpath, rel, files)


def _rewrite_ui_dir(root: str, dirpath: str, rel: str, files) -> None:
    for name in files:
            path = os.path.join(dirpath, name)
            if name == "SKILL.md" or name.endswith(".md") and "skills" in rel:
                text = open(path, encoding="utf-8", errors="ignore").read()
                cjk = len(CJK.findall(text))
                if cjk > 80:
                    title = name.replace(".md", "").replace("-", " ")
                    with open(path, "w", encoding="utf-8") as handle:
                        handle.write(
                            f"---\nname: {os.path.splitext(name)[0]}\n"
                            f"title: \"{title}\"\n"
                            "description: \"Teach this idea in English or French only.\"\n"
                            "---\n\n"
                            f"# {title}\n\n"
                            "Teach this idea in English or French. "
                            "Slides, quizzes, labs, and speech stay in the selected language. "
                            "Do not write Chinese characters.\n"
                        )
                    continue
            if name.endswith((".ts", ".tsx", ".js", ".mjs", ".md", ".json")):
                rel_file = os.path.relpath(path, root).replace("\\", "/")
                if rel_file in (
                    "lib/i18n/locales/en-US.json",
                    "lib/i18n/locales/fr-FR.json",
                    "lib/i18n/locales.ts",
                    "lib/i18n/types.ts",
                    "lib/i18n/workbench.ts",
                ):
                    continue
                _rewrite_text_file(path)


def _rename_agent_labels(root: str) -> None:
    for name in ("en-US.json", "fr-FR.json"):
        path = os.path.join(root, "lib", "i18n", "locales", name)
        data = json.loads(open(path, encoding="utf-8").read())
        settings = data.setdefault("settings", {})
        names = settings.setdefault("agentNames", {})
        names["default-1"] = "Gandho"
        descriptions = settings.setdefault("agentDescriptions", {})
        descriptions["default-1"] = "Gandho explains the lesson and points at the page."
        with open(path, "w", encoding="utf-8") as handle:
            json.dump(data, handle, ensure_ascii=False, indent=2)
            handle.write("\n")


def _rewrite_agents(root: str) -> None:
    path = os.path.join(root, "lib", "orchestration", "registry", "store.ts")
    text = open(path, encoding="utf-8").read()
    text = text.replace("name: 'AI teacher'", "name: 'Gandho'", 1)
    text = text.replace("avatar: '/avatars/teacher.png'", "avatar: '/avatars/gandho.svg'", 1)
    if "You are Gandho, the teacher of this classroom." not in text:
        text = text.replace(
            "You are the lead teacher of this classroom.",
            "You are Gandho, the teacher of this classroom. "
            "You explain the lesson and point at the page: spotlight a line, "
            "laser a formula, and move the laboratory controls.",
            1,
        )
    for src, dst in (
        ("name: 'AI助教'", "name: 'Assistant'"),
        ("name: '显眼包'", "name: 'Classmate'"),
        ("name: '好奇宝宝'", "name: 'Curious classmate'"),
        ("name: '笔记员'", "name: 'Note taker'"),
        ("name: '思考者'", "name: 'Thinker'"),
    ):
        text = text.replace(src, dst, 1)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(text)


def _enable_topic_autostart(root: str) -> None:
    path = os.path.join(root, "components", "edit", "PlaybackChromeRoot.tsx")
    text = open(path, encoding="utf-8").read()
    needle = """        // Auto-start if triggered by auto-play scene advance
        if (autoStartRef.current) {
          autoStartRef.current = false;"""
    replacement = """        // Auto-start after a generated topic, and when the lecture advances.
        const gandalPlay =
          typeof window !== 'undefined' && window.sessionStorage.getItem('gandalPlay') === '1';
        if (autoStartRef.current || gandalPlay) {
          autoStartRef.current = false;
          if (gandalPlay) {
            try { window.sessionStorage.removeItem('gandalPlay'); } catch { /* keep playing */ }
          }"""
    if needle in text:
        text = text.replace(needle, replacement, 1)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(text)


def _write_topic_page(root: str) -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    source = os.path.join(here, "topic_page.tsx")
    folder = os.path.join(root, "app", "gandal-topic")
    os.makedirs(folder, exist_ok=True)
    with open(source, encoding="utf-8") as handle:
        page = handle.read()
    with open(os.path.join(folder, "page.tsx"), "w", encoding="utf-8") as handle:
        handle.write(page)
    avatar_src = os.path.join(os.path.dirname(os.path.dirname(here)), "static", "gandho_avatar.svg")
    avatar_dir = os.path.join(root, "public", "avatars")
    os.makedirs(avatar_dir, exist_ok=True)
    if os.path.isfile(avatar_src):
        with open(avatar_src, "rb") as src, open(os.path.join(avatar_dir, "gandho.svg"), "wb") as dst:
            dst.write(src.read())
    readme = os.path.join(root, "README-zh.md")
    if os.path.exists(readme):
        os.remove(readme)


def apply(root: str) -> None:
    root = os.path.abspath(root)
    _rewrite_agents(root)
    _rewrite_locales(root)
    _rewrite_prompts(root)
    _rewrite_generation_fallbacks(root)
    _rewrite_ui_and_skills(root)
    _enable_topic_autostart(root)
    _write_topic_page(root)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: apply_patches.py CHECKOUT")
    apply(sys.argv[1])
