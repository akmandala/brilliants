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

logo = Image.open("brilliants.png")
col1, col2 = st.columns([1, 8])
with col1:
    st.image(logo, width=90)
with col2:
    st.markdown("<h1 style='padding-top: 10px;'>Brilliants Boutique</h1>", unsafe_allow_html=True)
    
# --- Helper: Download Latest File from Render ---
def fetch_latest_image(prefix="brilliants_", timeout=60):
    start = time.time()
    while time.time() - start < timeout:
        try:
            res = requests.get(RENDER_UPLOADS_URL)
            if res.status_code == 200:
                files = sorted([f for f in res.json().get("files", []) if isinstance(f, str) and f.startswith(prefix) and f.endswith(".jpg")])
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
if "user_input" not in st.session_state:
    st.session_state.user_input = ""

st.markdown("Hello 👋 Welcome to **Brilliants.Boutique**! We offer white **shirts, shorts,** and **hoodies** with customizable heatpress prints.")

# 👉 Initial assistant message
if st.session_state.step == "ask_item" and not st.session_state.user_input:
    with st.chat_message("assistant"):
        st.markdown("Can I know what item you are interested in?")

input_value = st.chat_input("Type your request", key="chat_prompt")

if input_value:
    st.session_state.user_input = input_value
    st.rerun()

if st.session_state.user_input:
    with st.chat_message("user"):
        st.markdown(st.session_state.user_input)

    user_input = st.session_state.user_input

    # Step: Selecting items
    if st.session_state.step == "ask_item":
        items = []
        for word in ["shirt", "short", "hoody", "hoodie"]:
            if word in user_input.lower():
                items.append("hoody" if "hood" in word else word)
        if items:
            st.session_state.items = list(set(items))
            selected_items = st.session_state.get("items", [])
            with st.chat_message("assistant"):
                st.markdown(f"Great! You selected: **{', '.join(selected_items)}**.")
                st.markdown("Now, what size would you like? (XS, S, M, L, XL)")
            st.session_state.step = "ask_size"
        else:
            with st.chat_message("assistant"):
                st.markdown("❌ Sorry, I didn't catch any of the available items. Please mention 'shirt', 'short', or 'hoody'.")

    # Step: Selecting size
    elif st.session_state.step == "ask_size":
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
                st.markdown("📸 Waiting for image from camera...")

            st.info("⏳ Waiting for your uploaded image from the camera...")
            with st.spinner("Looking for your image..."):
                image_path, image_name = fetch_latest_image(timeout=120)
                if image_path:
                    st.session_state.pattern_image_url = f"{RENDER_FILE_BASE}/{image_name}"

                    # --- AI mockup generation inline ---
                    with st.chat_message("assistant"):
                        st.markdown("✨ Generating mockups...")

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

                    st.chat_message("assistant").markdown("Here are styles 1, 2, 3. Please type 1, 2, or 3.")

                else:
                    with st.chat_message("assistant"):
                        st.markdown("⚠️ No image received. Please retry or refresh.")
            st.session_state.step = "ask_mockup_choice"
        else:
            with st.chat_message("assistant"):
                st.markdown("❌ Please choose a valid size: XS, S, M, L, or XL.")

    # STEP 4: Select A/B/C
    elif st.session_state.step == "ask_mockup_choice":
        if user_input.upper() in ["1", "2", "3"]:
            idx = ["1", "2", "3"].index(user_input.upper())
            st.session_state.selected_mockup = idx

            # Clean up uploaded images from Render backend
            try:
                requests.delete("https://mathmandala-upload.onrender.com/delete-all")
            except Exception as e:
                st.warning(f"⚠️ Cleanup error: {e}")
            st.session_state.step = "ask_name"
            st.chat_message("assistant").markdown("Great choice! What's your name?")
        else:
            st.chat_message("assistant").markdown("Please type 1, 2, or 3 to choose a style.")

    # STEP 5: Ask Name
    elif st.session_state.step == "ask_name":
        st.session_state.name = user_input
        st.session_state.step = "ask_phone"
        st.chat_message("assistant").markdown("Thanks! Now please enter your WhatsApp number:")

    # STEP 6: Ask Phone
    elif st.session_state.step == "ask_phone":
        st.session_state.phone = user_input
        st.session_state.step = "done"
        st.chat_message("assistant").markdown(f"✅ Order received!\n\nWe'll contact you at {st.session_state.phone}.")
        st.balloons()

# Final Step
if st.session_state.step == "done":
    st.markdown("🎉 Thank you! We'll be in touch.")
    if st.button("🔁 Order again?"):
        for key in ["step", "items", "size", "selected_mockup", "pattern_image_url", "user_input", "name", "phone", "mockup_urls"]:
            st.session_state[key] = "" if isinstance(st.session_state.get(key), str) else []
        st.session_state.step = "ask_item"
        st.rerun()
