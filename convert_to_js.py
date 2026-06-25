import json

with open('questions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Fix the first question
if "Тест саволлари ва тўғри жавоблари\n" in data[0]["question"]:
    data[0]["question"] = data[0]["question"].replace("Тест саволлари ва тўғри жавоблари\n", "")

js_content = "const questionsData = " + json.dumps(data, ensure_ascii=False, indent=2) + ";"

with open('questions.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
