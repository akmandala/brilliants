import streamlit as st
import cv2
import numpy as np
import mediapipe as mp
from PIL import Image, ImageDraw
import requests
import base64
import time
import io

REPLICATE_API_TOKEN = st.secrets["REPLICATE_API_TOKEN"]
BODY_TEMPLATE_PATH = "IMG_2979.jpeg"

st.set_page_config(page_title="AI Styling Assistant")

# Helper functions
def face_fits_oval(frame, mask):
    h, w, _ = frame.shape
    mp_face = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.6)
    result = mp_face.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    if result.detections:
        box = result.detections[0].location_data.relative_bounding_box
        x, y = int(box.xmin * w), int(box.ymin * h)
        fw, fh = int(box.width * w), int(box.height * h)
        face_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.rectangle(face_mask, (x, y), (x + fw, y + fh), 255, -1)
        intersection = cv2.bitwise_and(face_mask, mask)
        fit_ratio = np.count_nonzero(intersection) / np.count_nonzero(face_mask)
        return fit_ratio >= 0.9
    return False

def capture_and_validate_selfie():
    cap = cv2.VideoCapture(0)
    stframe = st.empty()
    success = False
    captured = None

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        h, w, _ = frame.shape
        oval_mask = np.zeros((h, w), dtype=np.uint8)
        center = (w // 2, h // 2)
        axes = (w // 4, h // 3)
        cv2.ellipse(oval_mask, center, axes, 0, 0, 360, 255, -1)
        overlay = frame.copy()
        overlay[oval_mask == 255] = cv2.addWeighted(overlay, 1.0, np.full_like(overlay, 255), 0.2, 0)[oval_mask == 255]
        valid = face_fits_oval(frame, oval_mask)
        text = "Face Valid - Press SPACE" if valid else "Center face in oval"
        cv2.putText(overlay, text, (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0) if valid else (0, 0, 255), 2)
        stframe.image(overlay, channels="BGR")
        key = cv2.waitKey(1)
        if key == 32 and valid:
            captured = frame.copy()
            success = True
            break
        elif key == 27:
            break

    cap.release()
    cv2.destroyAllWindows()
    return success, captured

def extract_head_and_composite(frame):
    h, w, _ = frame.shape
    rgb_img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_face_mesh = mp.solutions.face_mesh.FaceMesh(static_image_mode=True)
    result = mp_face_mesh.process(rgb_img)
    if not result.multi_face_landmarks:
        return None
    landmarks = result.multi_face_landmarks[0]
    coords = [(int(p.x * w), int(p.y * h)) for p in landmarks.landmark]
    xs = [x for (x, y) in coords[10:338]]
    ys = [y for (x, y) in coords[10:338]]
    x_min, x_max = min(xs), max(xs)
    y_min, y_max = min(ys), max(ys)
    pad_x = int((x_max - x_min) * 0.3)
    pad_y = int((y_max - y_min) * 0.5)
    x_min, x_max = max(0, x_min - pad_x), min(w, x_max + pad_x)
    y_min, y_max = max(0, y_min - pad_y), min(h, y_max + pad_y)
    crop = rgb_img[y_min:y_max, x_min:x_max]
    head_pil = Image.fromarray(crop).convert("RGBA")
    mask = Image.new("L", head_pil.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, head_pil.width, head_pil.height), fill=255)
    head_pil.putalpha(mask)
    head_pil = head_pil.resize((160, 180))
    body = Image.open(BODY_TEMPLATE_PATH).convert("RGBA")
    paste_x = body.width // 2 - head_pil.width // 2
    body.paste(head_pil, (paste_x, 40), head_pil)
    return body

def image_to_base64(img):
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def replicate_api(prompt, img_pil):
    image_b64 = image_to_base64(img_pil)
    # Convert to canny map
    img_cv = cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGBA2RGB)
    img_cv = cv2.resize(img_cv, (512, 512))
    canny = cv2.Canny(img_cv, 100, 200)
    canny_rgb = cv2.cvtColor(canny, cv2.COLOR_GRAY2RGB)
    _, buf = cv2.imencode(".png", canny_rgb)
    canny_b64 = base64.b64encode(buf).decode("utf-8")

    url = "https://api.replicate.com/v1/predictions"
    headers = {
        "Authorization": f"Token {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "version": "6e2cfa61cb9f4ecf8fcbbcdc5efb37d2d26d342ee6c1ebfa8e3be3dbdb59df82",
        "input": {
            "prompt": prompt,
            "image": f"data:image/png;base64,{image_b64}",
            "canny_image": f"data:image/png;base64,{canny_b64}",
            "num_inference_steps": 30,
            "guidance_scale": 7.5,
            "width": 512,
            "height": 512
        }
    }
    res = requests.post(url, json=payload, headers=headers).json()
    pred_id = res["id"]

    # Poll
    while True:
        r = requests.get(f"https://api.replicate.com/v1/predictions/{pred_id}", headers=headers).json()
        if r["status"] == "succeeded":
            return r["output"][0]
        elif r["status"] == "failed":
            return None
        time.sleep(2)

# ---------- Streamlit App ----------
st.title("AI Styling Assistant")
st.markdown("Capture your selfie, generate a styled preview using AI")

if st.button("Start Camera"):
    st.info("Press SPACE to capture when face fits oval.")
    success, selfie = capture_and_validate_selfie()
    if success:
        st.success("Selfie captured successfully!")
        composite = extract_head_and_composite(selfie)
        if composite:
            st.image(composite, caption="Composited Image")
            prompt = st.text_input("Style Prompt", value="A person wearing white hoodie and shorts, soft shadows, skin tone and lighting balanced")
            if st.button("Enhance with AI"):
                with st.spinner("Sending to Replicate..."):
                    url = replicate_api(prompt, composite)
                    if url:
                        st.image(url, caption="AI Enhanced Output")
                    else:
                        st.error("Generation failed.")
        else:
            st.error("Face landmarking failed.")
    else:
        st.error("Selfie capture failed or not valid.")
