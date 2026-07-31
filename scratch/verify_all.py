import urllib.request
import urllib.parse
import json
import sqlite3

def run_tests():
    print("=== STARTING API AND INTEGRATION VERIFICATION ===")
    
    # Test 1: Verify /api/instructors returns the mock instructors
    print("\n[TEST 1] Querying /api/instructors GET endpoint...")
    try:
        response = urllib.request.urlopen("http://localhost:8000/api/instructors")
        data = json.loads(response.read().decode('utf-8'))
        instructors = data.get("instructors", [])
        print(f"Success! Found {len(instructors)} instructors:")
        for inst in instructors:
            print(f" - {inst['full_name']} ({inst['subjects_list']})")
        assert len(instructors) >= 3, "Expected at least 3 mock instructors"
    except Exception as e:
        print(f"FAILED: {e}")
        return False

    # Test 2: Verify /api/lesson for Calculus returns Professor Evans
    print("\n[TEST 2] Querying /api/lesson for Calculus (vid_calculus_01)...")
    try:
        response = urllib.request.urlopen("http://localhost:8000/api/lesson?video_id=vid_calculus_01")
        data = json.loads(response.read().decode('utf-8'))
        print("Response data:")
        print(json.dumps(data, indent=2))
        assert data.get("instructor_name") == "Professor Evans", "Expected Professor Evans"
        assert "Calculus Specialist" in data.get("instructor_role", ""), "Expected Calculus Specialist in role"
        print("Success! Mapped correctly.")
    except Exception as e:
        print(f"FAILED: {e}")
        return False

    # Test 3: Test registering a new instructor and linking to a lesson
    print("\n[TEST 3] Registering a new instructor via POST /api/instructors...")
    try:
        new_teacher = {
            "full_name": "Professor Smith",
            "phone_number": "+1-555-9999",
            "experience_years": 8,
            "subjects_list": "Physics",
            "profile_image": "static/images/teachers/prof_smith.jpg",
            "video_id": "vid_physics_01"
        }
        req_data = json.dumps(new_teacher).encode('utf-8')
        req = urllib.request.Request("http://localhost:8000/api/instructors", data=req_data, headers={'Content-Type': 'application/json'})
        response = urllib.request.urlopen(req)
        res_data = json.loads(response.read().decode('utf-8'))
        print("POST Response:", res_data)
        assert res_data.get("success") is True, "Failed to register teacher"
        
        # Now verify that querying vid_physics_01 returns Professor Smith
        response_opt = urllib.request.urlopen("http://localhost:8000/api/lesson?video_id=vid_physics_01")
        data_opt = json.loads(response_opt.read().decode('utf-8'))
        print("Query lesson response for vid_physics_01:")
        print(json.dumps(data_opt, indent=2))
        assert data_opt.get("instructor_name") == "Professor Smith", "Expected Professor Smith"
        print("Success! New instructor registered and linked successfully.")
    except Exception as e:
        print(f"FAILED: {e}")
        return False

    # Test 4: Clean up test instructor in DB
    print("\n[TEST 4] Cleaning up registered test instructor from DB...")
    try:
        conn = sqlite3.connect("vault.db")
        cursor = conn.cursor()
        cursor.execute("DELETE FROM instructors WHERE instructor_id = 'professor_smith'")
        cursor.execute("UPDATE lesson_metadata SET instructor_id = 'dr_harris' WHERE video_id = 'vid_physics_01'")
        conn.commit()
        conn.close()
        print("Success! Cleanup complete.")
    except Exception as e:
        print(f"FAILED: {e}")
        return False

    print("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY ===")
    return True

if __name__ == "__main__":
    run_tests()
