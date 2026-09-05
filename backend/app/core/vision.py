import subprocess
import json
import sys
import os
import tempfile

def verify_face_from_base64(reference_b64: str, live_b64: str) -> tuple[bool, str]:
    if not reference_b64 or not live_b64:
        return False, "Missing reference or live photo"
        
    worker_path = os.path.join(os.path.dirname(__file__), "vision_worker.py")
    
    payload = json.dumps({
        "reference_b64": reference_b64,
        "live_b64": live_b64
    })
    
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f_in:
        f_in.write(payload)
        in_file = f_in.name
        
    out_file = in_file + ".out"
    
    try:
        # Run the worker process, pass filenames via args, close_fds=True prevents socket inheritance crashes
        process = subprocess.run(
            [sys.executable, worker_path, in_file, out_file],
            close_fds=True,
            timeout=45,
            capture_output=True,
            text=True
        )
        
        if not os.path.exists(out_file):
            return False, f"Worker process crashed entirely. Stderr: {process.stderr}"
            
        with open(out_file, 'r') as f_out:
            result_json = json.load(f_out)
            
        if result_json.get("success"):
            is_match = result_json.get("match", False)
            return is_match, "Success" if is_match else "Face does not match."
        else:
            return False, f"DeepFace Error: {result_json.get('error', 'Unknown Error')}"
            
    except subprocess.TimeoutExpired:
        return False, "Facial recognition timed out (took too long)."
    except Exception as e:
        return False, f"Worker Process Error: {str(e)}"
    finally:
        if os.path.exists(in_file):
            os.remove(in_file)
        if os.path.exists(out_file):
            os.remove(out_file)
