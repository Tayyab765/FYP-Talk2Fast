import csv
import json
import re

def clean_job_title(title):
    # Remove "Average" and "Salary in Pakistan"
    cleaned = re.sub(r'(?i)average\s+', '', title)  # remove "Average"
    cleaned = re.sub(r'\s*salary\s+in\s+pakistan', '', cleaned, flags=re.I)  # remove "Salary in Pakistan"
    return cleaned.strip()

def csv_to_json(csv_file, json_file):
    data = []
    with open(csv_file, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Convert dict-like strings to real dicts
            for key in ['benefits', 'experience_levels', 'gender']:
                if row[key]:
                    try:
                        row[key] = eval(row[key])
                    except:
                        row[key] = {}
            
            # Clean job title
            row['job_title'] = clean_job_title(row['job_title'])
            data.append(row)
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

if __name__ == "__main__":
    # Change these filenames if needed
    csv_to_json("pakistan_job_salaries.csv", "pakistan_job_salaries.json")