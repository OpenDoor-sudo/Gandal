# scratch/test_qwen_omni.py - Standalone verification script for Qwen 3.5 Omni integration
import os
import sys

# Ensure parent directory is in path to import client
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import qwen_omni_client

def test_environment():
    print("=== TEST 1: ENVIRONMENT & KEY CONFIGURATION ===")
    api_key = qwen_omni_client.get_dashscope_api_key()
    print(f"DashScope API Key: {'[SET]' if api_key and api_key != 'your_dashscope_api_key_here' else '[MISSING/DEFAULT]'}")
    
    fw_key = qwen_omni_client.get_fireworks_api_key()
    print(f"Fireworks API Key: {'[SET]' if fw_key and fw_key != 'your_fireworks_key_here' else '[MISSING/DEFAULT]'}")
    
    ffmpeg_ok = qwen_omni_client.is_ffmpeg_available()
    print(f"FFmpeg on Path: {ffmpeg_ok}")
    return api_key and api_key != 'your_dashscope_api_key_here', ffmpeg_ok

def test_audio_extraction():
    print("\n=== TEST 2: AUDIO EXTRACTION FROM MP4 ===")
    video_path = "curriculum_staging/12th_Grade/Economics/les_characteristiques_extraeconomiques.mp4"
    if not os.path.exists(video_path):
        print(f"Warning: Test video file '{video_path}' not found. Skipping extraction test.")
        return False
        
    output_mp3 = "scratch/temp_extract.mp3"
    if os.path.exists(output_mp3):
        os.remove(output_mp3)
        
    extracted = qwen_omni_client.extract_audio_from_video(video_path, output_mp3)
    if extracted and os.path.exists(output_mp3):
        size = os.path.getsize(output_mp3)
        print(f"Success! Audio extracted to {output_mp3} ({size} bytes).")
        return True
    else:
        print("Failed to extract audio track.")
        return False

def test_qwen_timestamps(has_key, has_ffmpeg):
    print("\n=== TEST 3: QWEN 3.5 OMNI TIMESTAMP GENERATION ===")
    video_path = "curriculum_staging/12th_Grade/Economics/les_characteristiques_extraeconomiques.mp4"
    if not os.path.exists(video_path):
        print("Skipping due to missing test video.")
        return
        
    print("Calling generate_video_timestamps...")
    timestamps = qwen_omni_client.generate_video_timestamps(video_path, "test_video_01")
    print(f"Result chapters ({len(timestamps)} total):")
    for ts in timestamps:
        print(f"  - [{ts['timestamp']}] {ts['title']} : {ts['description']}")

def test_socratic_tutoring(has_key):
    print("\n=== TEST 4: SOCRATIC TUTORING (BILINGUAL) ===")
    french_context = (
        "L'ONU et ses diverses organisations onusiennes agissent comme des porteurs de croissance "
        "en coordonnant les politiques de développement international. Toutefois, définir un moteur "
        "ou porteur de croissance durable exige de repenser nos indicateurs au-delà du simple PIB."
    )
    
    # Test 1: Ask in English about French context
    print("Scenario A: Student asks in English about French growth context...")
    question_eng = "What is the main critique of using only GDP (PIB) mentioned in the lecture?"
    ans_eng = qwen_omni_client.query_qwen_omni_tutoring(question_eng, french_context, "en_US", "vid_calculus_01")
    print(f"Qwen response (English):\n{ans_eng}\n")
    
    # Test 2: Ask in French, reply in French
    print("Scenario B: Student asks in French...")
    question_fr = "Pourquoi devons-nous changer notre façon de mesurer le PIB selon l'enseignant ?"
    ans_fr = qwen_omni_client.query_qwen_omni_tutoring(question_fr, french_context, "fr_FR", "vid_calculus_01")
    print(f"Qwen response (French):\n{ans_fr}\n")

def test_cosyvoice_synthesis(has_key):
    print("\n=== TEST 5: COSYVOICE SYNTHESIS ===")
    text = "Félicitations! Vous avez maîtrisé la formule d'oscillation du pendule."
    audio = qwen_omni_client.synthesize_cloned_voice(text, "fr_FR")
    if audio:
        output_file = "scratch/temp_voice.wav"
        with open(output_file, "wb") as f:
            f.write(audio)
        print(f"Success! Speech synthesized and saved to {output_file} ({len(audio)} bytes).")
    else:
        print("Voice synthesis skipped or failed.")

def test_qwen_flashcards(has_key, has_ffmpeg):
    print("\n=== TEST 6: QWEN 3.5 OMNI SOCRATIC FLASHCARD GENERATION ===")
    video_path = "curriculum_staging/12th_Grade/Economics/les_characteristiques_extraeconomiques.mp4"
    if not os.path.exists(video_path):
        print("Skipping due to missing test video.")
        return
        
    print("Calling generate_video_flashcards...")
    flashcards = qwen_omni_client.generate_video_flashcards(video_path, "vid_economics_01", "fr_FR")
    print(f"Result flashcards ({len(flashcards)} total):")
    for fc in flashcards:
        print(f"  - Q: {fc['front']}\n    A: {fc['back']}\n    Hint: {fc['hint']}")

if __name__ == "__main__":
    has_key, has_ffmpeg = test_environment()
    
    # Run tests
    test_audio_extraction()
    test_qwen_timestamps(has_key, has_ffmpeg)
    test_socratic_tutoring(has_key)
    test_cosyvoice_synthesis(has_key)
    test_qwen_flashcards(has_key, has_ffmpeg)
