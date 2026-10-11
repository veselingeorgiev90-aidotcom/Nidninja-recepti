import json
import os
import re
from pathlib import Path

path = Path("index.html")
html = path.read_text(encoding="utf-8")
start_marker = "const recipes="
end_marker = "];let idx=0"
start = html.find(start_marker)
if start < 0:
    raise SystemExit("Recipe array not found")
start += len(start_marker)
end = html.find(end_marker, start)
if end < 0:
    raise SystemExit("Recipe array ending not found")
recipes = json.loads(html[start:end + 1])
new = json.loads(os.environ["RECIPE_JSON"])
required = ("name", "ingredients", "steps", "mode", "temp", "time", "category")
for key in required:
    if key not in new or not new[key]:
        raise SystemExit(f"Missing required recipe field: {key}")
if not isinstance(new["ingredients"], list) or not all(isinstance(i, str) for i in new["ingredients"]):
    raise SystemExit("ingredients must be a list of strings")
if not isinstance(new["steps"], str):
    raise SystemExit("steps must be a string")
for key in ("name", "steps", "mode", "temp", "time", "category", "accessory", "note", "emoji", "image"):
    if key in new and (not isinstance(new[key], str) or not new[key].strip()):
        raise SystemExit(f"{key} must be a non-empty string")
if "image" in new:
    if not re.fullmatch(r"images/[a-zA-Z0-9_.-]+", new["image"]):
        raise SystemExit("image must be a local file in images/")
    if not Path(new["image"]).is_file():
        raise SystemExit("Upload the recipe image before preparing the recipe")
name = new["name"].strip().casefold()
if any(item.get("name", "").strip().casefold() == name for item in recipes):
    print("Recipe already exists; skipping")
else:
    allowed = ("name", "ingredients", "steps", "mode", "temp", "time", "category", "accessory", "note", "emoji", "image")
    new = {key: new[key] for key in allowed if key in new}
    recipes.append(new)
    updated = json.dumps(recipes, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
    path.write_text(html[:start] + updated + html[end + 1:], encoding="utf-8")
    print("Prepared:", new["name"])
