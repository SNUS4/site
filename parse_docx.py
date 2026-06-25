import docx
import json
import re

doc = docx.Document('Итоговый_тест_по_методике_преподавания_математики (2).docx')
questions = []

map_cyr_lat = {'А': 'A', 'В': 'B', 'С': 'C', 'Д': 'D', 'Е': 'E'}

for para in doc.paragraphs:
    text = para.text.strip()
    if not text:
        continue
    
    if text.lower().startswith('ответ:'):
        # Find correct letter
        match = re.match(r'^Ответ:\s*([A-Za-zА-Яа-я])', text, re.IGNORECASE)
        if match and questions:
            correct_letter = match.group(1).upper()
            corr_l = map_cyr_lat.get(correct_letter, correct_letter)
            
            # The last question added should get its options updated
            last_q = questions[-1]
            for opt in last_q['options']:
                opt_letter_match = re.match(r'^([A-Za-zА-Яа-я])[\)\.]', opt['raw_text'])
                if opt_letter_match:
                    opt_letter = opt_letter_match.group(1).upper()
                    opt_l = map_cyr_lat.get(opt_letter, opt_letter)
                    
                    if opt_l == corr_l:
                        opt['isCorrect'] = True
                        
                # Clean text
                opt['text'] = re.sub(r'^([A-Za-zА-Яа-я])[\)\.]\s*', '', opt['raw_text']).strip()
                del opt['raw_text']
    else:
        # Question block
        lines = text.split('\n')
        q_lines = []
        opts = []
        for line in lines:
            line = line.strip()
            if not line: continue
            if re.match(r'^[A-Za-zА-Яа-я][\)\.]\s*', line):
                opts.append({"raw_text": line, "isCorrect": False})
            else:
                q_lines.append(line)
        
        if q_lines and opts:
            # Clean question text (remove numbering if present, like "1. ", etc)
            q_text = '\n'.join(q_lines)
            q_text = re.sub(r'^\d+[\.\)]\s*', '', q_text).strip()
            
            questions.append({
                "question": q_text,
                "options": opts
            })

with open('questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(questions)} questions.")
