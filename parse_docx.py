import docx
import json
import re

doc = docx.Document('150_тестов_по_методике_преподавания_математики.docx')
questions = []

map_cyr_lat = {'А': 'A', 'В': 'B', 'С': 'C', 'Д': 'D', 'Е': 'E'}

current_question = []
current_options = []

for para in doc.paragraphs:
    text = para.text.strip()
    if not text:
        continue
    
    if text.lower().startswith('правильный ответ:') or text.lower().startswith('ответ:'):
        # Found the answer, process the current question and options
        match = re.search(r'(Правильный ответ|Ответ):\s*([A-Za-zА-Яа-я])', text, re.IGNORECASE)
        if match:
            correct_letter = match.group(2).upper()
            corr_l = map_cyr_lat.get(correct_letter, correct_letter)
            
            # Process options
            processed_options = []
            for opt_text in current_options:
                opt_letter_match = re.match(r'^([A-Za-zА-Яа-я])[\)\.]', opt_text)
                is_correct = False
                if opt_letter_match:
                    opt_letter = opt_letter_match.group(1).upper()
                    opt_l = map_cyr_lat.get(opt_letter, opt_letter)
                    if opt_l == corr_l:
                        is_correct = True
                
                clean_opt = re.sub(r'^([A-Za-zА-Яа-я])[\)\.]\s*', '', opt_text).strip()
                processed_options.append({
                    "text": clean_opt,
                    "isCorrect": is_correct
                })
            
            if current_question and processed_options:
                q_text = '\n'.join(current_question)
                q_text = re.sub(r'^\d+[\.\)]\s*', '', q_text).strip()
                
                questions.append({
                    "question": q_text,
                    "options": processed_options
                })
                
        # Reset state for next question
        current_question = []
        current_options = []
    elif re.match(r'^[A-Za-zА-Яа-я][\)\.]\s*', text):
        # It's an option
        current_options.append(text)
    else:
        # It's part of the question text
        # If it's a title like '150 тестов...' we can ignore it if it doesn't get processed
        current_question.append(text)

with open('questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(questions)} questions.")
