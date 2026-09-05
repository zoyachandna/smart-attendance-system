import sys
import json
import base64
import cv2
import numpy as np

def base64_to_cv2(b64_str: str):
    if "base64," in b64_str:
        b64_str = b64_str.split("base64,")[1]
    img_bytes = base64.b64decode(b64_str)
    nparr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
        
    in_file = sys.argv[1]
    out_file = sys.argv[2]
    
    try:
        with open(in_file, 'r') as f:
            data = json.load(f)
            
        ref_b64 = data.get("reference_b64")
        live_b64 = data.get("live_b64")
        
        if not ref_b64 or not live_b64:
            with open(out_file, 'w') as f:
                json.dump({"success": False, "error": "Missing images"}, f)
            sys.exit(1)
            
        img1 = base64_to_cv2(ref_b64)
        img2 = base64_to_cv2(live_b64)
        
        if img1 is None or img2 is None:
            with open(out_file, 'w') as f:
                json.dump({"success": False, "error": "Failed to decode images"}, f)
            sys.exit(1)
            
        from deepface import DeepFace
        
        result = DeepFace.verify(
            img1_path=img1,
            img2_path=img2,
            model_name="VGG-Face",
            detector_backend="skip",
            enforce_detection=False
        )
        
        is_match = result.get("verified", False)
        with open(out_file, 'w') as f:
            json.dump({"success": True, "match": is_match}, f)
            
        sys.exit(0)
    except Exception as e:
        with open(out_file, 'w') as f:
            json.dump({"success": False, "error": str(e)}, f)
        sys.exit(1)
