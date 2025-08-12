import os, strutils, re, strformat

if paramCount() < 1:
  echo "Usage: ", getAppFilename(), " <extension> [--gitignore]"
  quit(1)

let extInput = paramStr(1)
let targetExt = if extInput.startsWith("."): extInput else: "." & extInput

var useGitIgnore = false
if paramCount() > 1:
  for i in 2 .. paramCount():
    if paramStr(i) == "--gitignore":
      useGitIgnore = true

proc globToRegex(glob: string): Regex =
  var regexStr = "^"
  for ch in glob:
    case ch
    of '*':
      regexStr.add ".*"
    of '?':
      regexStr.add "."
    else:
      # escape any special regex characters:
      regexStr.add re.escapeRe($ch)
  regexStr.add "$"
  re(regexStr, flags={reStudy})

var ignorePatterns: seq[Regex] = @[]
if useGitIgnore:
  if fileExists(".gitignore"):
    for line in readFile(".gitignore").splitLines():
      let trimmed = line.strip()
      if trimmed.len == 0 or trimmed.startsWith("#"):
        continue
      ignorePatterns.add globToRegex(trimmed)

proc shouldIgnore(filePath: string, ignoreRegex: seq[Regex]): bool =
  let components = filePath.split(os.PathSep)
  for comp in components:
    for r in ignoreRegex:
      if match(comp, r):
        return true
  return false

for file in walkDirRec("."):
  if splitFile(file).ext == targetExt:
    if useGitIgnore and ignorePatterns.len > 0 and shouldIgnore(file, ignorePatterns):
      continue

    echo file & ":"
    var content = ""
    try:
      content = readFile(file)
    except OSError as e:
      echo "Error reading file: ", e.msg
    echo fmt("""```
{content}
```""")
