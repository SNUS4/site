import docx
import json

doc = docx.Document('Итоговый_тест_по_методике_преподавания_математики (2).docx')
data = []
for i, para in enumerate(doc.paragraphs[:100]):
    runs_info = []
    for run in para.runs:
        rgb = str(run.font.color.rgb) if run.font.color and hasattr(run.font.color, 'rgb') else None
        runs_info.append({"text": run.text, "color": rgb})
    data.append({"para_idx": i, "text": para.text, "runs": runs_info})

with open('debug_docx2.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
