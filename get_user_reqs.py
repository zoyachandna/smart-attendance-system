import json

with open(r"C:\Users\USER\.gemini\antigravity\brain\4092aba7-5f9c-4afa-bdc0-0b08b8484dbe\.system_generated\logs\transcript_full.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        if '"type":"USER_INPUT"' in line:
            data = json.loads(line)
            if data.get("type") == "USER_INPUT":
                print(f"--- Step {data.get('step_index')} ---")
                print(data.get("content"))
