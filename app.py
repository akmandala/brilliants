import streamlit as st
import cv2
import numpy as np
from PIL import Image, ImageDraw
import requests
import base64
import time
import io

REPLICATE_API_TOKEN = st.secrets["REPLICATE_API_TOKEN"]
BODY_TEMPLATE_PATH = "IMG_2979.jpeg"

st.set_page_config(page_title="AI Styling Assistant")

# ---------- Face extraction & compositing ----------
def extract_head_and_composite(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    if len(faces) == 0:
        return None

    (x, y, w, h) = faces[0]

    # Padding
    pad_x = int(w * 0.3)
    pad_y = int(h * 0.4)
    x1, y1 = max(0, x - pad_x), max(0, y - pad_y)
    x2, y2 = min(frame.shape[1], x + w + pad_x), min(frame.shape[0], y + h + pad_y)

    crop = frame[y1:y2, x1:x2]
    head_pil = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)).convert("RGBA")

    # Oval mask
    mask = Image.new("L", head_pil.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, head_pil.width, head_pil.height), fill=255)
    head_pil.putalpha(mask)
    head_pil = head_pil.resize((160, 180))

    # Paste on body template
    body = Image.open(BODY_TEMPLATE_PATH).convert("RGBA")
    paste_x = body.width // 2 - head_pil.width // 2
    body.paste(head_pil, (paste_x, 0), head_pil)

    return body

# ---------- Replicate API ----------
def image_to_base64(img):
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def replicate_api(prompt, img_pil):
    image_b64 = image_to_base64(img_pil)

    url = "https://api.replicate.com/v1/predictions"
    headers = {
        "Authorization": f"Token {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "version": "8a9c128f4729bb4c7f35f6c9dc93d1770ebf2e2c6877ba44c38d49b98905eeb5",  # Realistic Vision v5.1
        "input": {
            "prompt": prompt,
            "image": f"data:image/png;base64,{image_b64}",
            "width": 512,
            "height": 512,
            "num_inference_steps": 30,
            "guidance_scale": 7.5,
            "strength": 0.75,
            "prompt_strength": 0.8
        }
    }

    res = requests.post(url, json=payload, headers=headers)

    if res.status_code != 201:
        st.error(f"Replicate API error: {res.status_code} - {res.text}")
        return None

    res_json = res.json()

    if "id" not in res_json:
        st.error(f"Replicate response missing ID: {res_json}")
        return None

    pred_id = res_json["id"]

    # Poll for result
    while True:
        poll = requests.get(f"https://api.replicate.com/v1/predictions/{pred_id}", headers=headers).json()
        if poll["status"] == "succeeded":
            return poll["output"][0]
        elif poll["status"] == "failed":
            st.error("AI generation failed.")
            return None
        time.sleep(2)

# ---------- Streamlit UI ----------
st.title("AI Styling Assistant")
st.markdown("Take a selfie and generate a styled mockup with AI enhancement")

uploaded_img = st.camera_input("Take your selfie")

if uploaded_img:
    selfie = Image.open(uploaded_img).convert("RGB")
    selfie_np = np.array(selfie)
    selfie_bgr = cv2.cvtColor(selfie_np, cv2.COLOR_RGB2BGR)

    composite = extract_head_and_composite(selfie_bgr)
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
        st.error("Could not detect a valid face in the selfie.")
