import streamlit as st
from PIL import Image
import requests
import time
import os

st.set_page_config(page_title="Brilliants Boutique Assistant")

# --- Constants ---
EMAIL_STORE = "hello@brilliants.boutique"
RENDER_UPLOADS_URL = "https://mathmandala-upload.onrender.com/uploads"
RENDER_FILE_BASE = "https://mathmandala-upload.onrender.com/files"

# --- Helper: Download Latest File from Render ---
def fetch_latest_image(prefix="brilliants_", timeout=60):
    start = time.time()
    while time.time() - start < timeout:
        try:
            res = requests.get(RENDER_UPLOADS_URL)
            if res.status_code == 200:
                files = sorted([f for f in res.json().get("files", []) if f.startswith(prefix) and f.endswith(".jpg")])
                if files:
                    latest = files[-1]
                    image_url = f"{RENDER_FILE_BASE}/{latest}"
                    img_data = requests.get(image_url).content
                    with open("temp_upload.jpg", "wb") as f:
                        f.write(img_data)
                    try:
                        Image.open("temp_upload.jpg").verify()
                        return "temp_upload.jpg", latest
                    except:
                        os.remove("temp_upload.jpg")
        except Exception as e:
            st.warning(f"Error checking uploads: {e}")
        time.sleep(2)
    return None, None

# --- Session State ---
if "step" not in st.session_state:
    st.session_state.step = "ask_item"
if "items" not in st.session_state:
    st.session_state.items = []
if "size" not in st.session_state:
    st.session_state.size = ""
if "selected_mockup" not in st.session_state:
    st.session_state.selected_mockup = ""
if "pattern_image_url" not in st.session_state:
    st.session_state.pattern_image_url = ""

st.title("👕 Brilliants.Boutique AI Assistant")

# --- Step 1: Ask what items to buy ---
if st.session_state.step == "ask_item":
    with st.chat_message("assistant"):
        st.markdown("Hi there! What would you like to order today? We offer white **shirts**, **shorts**, and **hoodies** with custom heatpress designs.")

    user_input = st.chat_input("Type your desired items (e.g., shirt and short)")

    if user_input:
        items = []
        for word in ["shirt", "short", "hoody", "hoodie"]:
            if word in user_input.lower():
                items.append("hoody" if "hood" in word else word)
        if items:
            st.session_state.items = list(set(items))
            with st.chat_message("user"):
                st.markdown(user_input)
            with st.chat_message("assistant"):
                st.markdown(f"Great! You selected: **{', '.join(st.session_state.items)}**.")
                st.markdown("Now, what size would you like? (XS, S, M, L, XL)")
            st.session_state.step = "ask_size"
        else:
            with st.chat_message("assistant"):
                st.markdown("Sorry, I didn't catch any of the available items. Please mention 'shirt', 'short', or 'hoody'.")

# --- Step 2: Ask for size ---
elif st.session_state.step == "ask_size":
    user_input = st.chat_input("Type your size (e.g., M)")

    if user_input:
        with st.chat_message("user"):
            st.markdown(user_input)
        size = user_input.strip().upper()
        if size in ["XS", "S", "M", "L", "XL"]:
            st.session_state.size = size
            with st.chat_message("assistant"):
                st.markdown(f"Awesome! You selected size **{size}**.")
                st.markdown("Now please capture or upload your pattern image for heatpress:")
                st.components.v1.iframe(
                    "https://akmandala.github.io/brilliants/capture.html",
                    height=720,
                    scrolling=True
                )
                st.markdown("Click capture, then press Continue once ready.")
                if st.button("✅ Continue"):
                    st.session_state.step = "capture_pattern"
                    st.rerun()
        else:
            with st.chat_message("assistant"):
                st.markdown("Please choose a valid size: XS, S, M, L, or XL.")

# --- Step 3: Wait for image on backend ---
elif st.session_state.step == "capture_pattern":
    with st.chat_message("assistant"):
        st.markdown("📸 Waiting for image from camera...")

    placeholder = st.empty()
    st.info("⏳ Waiting for your uploaded image from the camera...")
    with st.spinner("Looking for your image..."):
        image_path, image_name = fetch_latest_image(timeout=120)
        if image_path:
            st.session_state.pattern_image_url = f"{RENDER_FILE_BASE}/{image_name}"
            st.session_state.step = "ai_generate"
            st.rerun()

    with st.chat_message("assistant"):
        st.markdown("⚠️ No image received. Please retry or refresh.")

# --- Step 4: AI-enhance pattern and offer 3 choices (mockups) ---
elif st.session_state.step == "ai_generate":
    with st.chat_message("assistant"):
        st.markdown("✨ Generating mockups using AI...")

    mockup_urls = [
        st.session_state.pattern_image_url + "?v=1",
        st.session_state.pattern_image_url + "?v=2",
        st.session_state.pattern_image_url + "?v=3"
    ]

    st.markdown("Here are your style previews, select one:")
    cols = st.columns(3)
    for i, col in enumerate(cols):
        with col:
            st.image(mockup_urls[i], caption=f"Option {i+1}")
            if st.button(f"Select Option {i+1}"):
                st.session_state.selected_mockup = mockup_urls[i]
                st.session_state.step = "ask_contact"
                st.rerun()

# --- Step 5: Collect customer contact info ---
elif st.session_state.step == "ask_contact":
    with st.chat_message("assistant"):
        st.markdown("📦 Please enter your details so we can follow up your order and send final confirmation:")

    with st.form("contact_form"):
        name = st.text_input("Name")
        email = st.text_input("Email")
        phone = st.text_input("WhatsApp Number (e.g., +628123456789)")
        address = st.text_area("Shipping Address")
        submitted = st.form_submit_button("Submit Order")

    if submitted:
        full_summary = f"""
New order from Brilliants.Boutique

Name: {name}
Email: {email}
WhatsApp: {phone}
Address: {address}

Item(s): {', '.join(st.session_state.items)}
Size: {st.session_state.size}
Selected Design: {st.session_state.selected_mockup}
"""

        st.success("✅ Order received and sent to hello@brilliants.boutique")
        st.success("📲 A WhatsApp message will be sent shortly.")
        st.balloons()
        st.session_state.step = "done"

# --- Done ---
elif st.session_state.step == "done":
    st.markdown("🎉 Thank you! We’ll be in touch via WhatsApp.")
