import streamlit as st
from PIL import Image

st.set_page_config(layout="centered", page_title="AI-Powered Brilliants Boutique")

# === Load Logo ===
logo = Image.open("brilliants.png")
col1, col2 = st.columns([1, 8])
with col1:
    st.image(logo, width=90)
with col2:
    st.markdown("<h1 style='padding-top: 10px;'>Brilliants Boutique</h1>", unsafe_allow_html=True)

# Step 1: Upload Customer Photo
st.header("1. Upload Your Photo")
user_photo = st.file_uploader("Upload a photo of yourself", type=["jpg", "jpeg", "png"])

# Step 2: Style Prompt
st.header("2. Enter Your Style Prompt")
style_prompt = st.text_area("Describe the look you want for your white t-shirt, shorts, and hoodie")

# Step 3: Upload Style Inspiration (Optional)
st.header("3. Upload Style Inspiration (Optional)")
styled_image = st.file_uploader("Upload an image of your desired style", type=["jpg", "jpeg", "png"])

# Step 4: Generate Mockup
if st.button("Generate Styling Mockup"):
    if user_photo and style_prompt:
        st.success("Here’s your AI-styled outfit preview")

        # Display uploaded photo
        st.subheader("Your Original Photo")
        st.image(Image.open(user_photo), use_container_width=True)

        # Display prompt
        st.subheader("Style Prompt")
        st.markdown(f"{style_prompt}")

        # Display styled reference (mockup)
        if styled_image:
            st.subheader("Style Inspiration")
            st.image(Image.open(styled_image), use_container_width=True)
        else:
            st.warning("No style image uploaded. Mock print design will be generated instead.")

        # Mock-up printable design output (placeholder)
        st.subheader("Simulated Heatpress Print Design")
        st.image("https://akmandala.github.io/mathmandala/mockup_withShirt.PNG")

        # Future Step: Composite user photo + styled outfit
        st.info("In a full system, you would now see yourself dressed in the styled look.")
    else:
        st.error("Please upload your photo and enter a style prompt.")
