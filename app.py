import streamlit as st
from PIL import Image
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests

# --- Configuration ---
STORE_EMAIL = "hello@brilliants.boutique"
MOCKUP_IMAGE = "IMG_2979.jpeg"  # Your uploaded mockup

st.set_page_config(page_title="Brilliants Boutique Assistant")

# --- Chat Step State ---
if "step" not in st.session_state:
    st.session_state.step = "greeting"

st.title("🛍️ Brilliants.Boutique")

# --- Chat Greeting ---
if st.session_state.step == "greeting":
    with st.chat_message("assistant"):
        st.markdown("Hello 👋 Welcome to **Brilliants.Boutique**! We offer white shirts, shorts, and hoodies with customizable heatpress prints.")
        st.markdown("What can we help you with today?")
    st.session_state.step = "waiting_for_request"

# --- Chat Input ---
user_input = st.chat_input("Type your request")

if user_input:
    with st.chat_message("user"):
        st.markdown(user_input)

    # Step: User gives style request
    if st.session_state.step == "waiting_for_request":
        if "leopard" in user_input.lower() and "billiard" in user_input.lower():
            with st.chat_message("assistant"):
                st.markdown("Here’s a mockup of your request:")
                st.image(MOCKUP_IMAGE, caption="White shirt + shorts with leopard billiard print")
                st.markdown("What size would you like for this style?")
            st.session_state.step = "waiting_for_size"
        else:
            with st.chat_message("assistant"):
                st.markdown("Sorry, I can only process the leopard billiard print mockup in this demo.")

    elif st.session_state.step == "waiting_for_size":
        st.session_state.size = user_input.strip().upper()
        st.session_state.step = "ask_info"
        st.rerun()

# --- Collect Order Info ---
if st.session_state.step == "ask_info":
    with st.chat_message("assistant"):
        st.markdown(f"Great! You've selected **{st.session_state.size}**.")
        st.markdown("Please provide your contact details:")

    with st.form("order_form"):
        name = st.text_input("Your name")
        email = st.text_input("Your email")
        phone = st.text_input("WhatsApp number (e.g., +628123456789)")
        address = st.text_area("Shipping address")
        submitted = st.form_submit_button("Submit Order")

    if submitted:
        # -- Email to store --
        msg = MIMEMultipart()
        msg["From"] = st.secrets["EMAIL_USER"]
        msg["To"] = STORE_EMAIL
        msg["Subject"] = "New Order - Brilliants Boutique"

        body = f"""
        New Order:

        Name: {name}
        Email: {email}
        WhatsApp: {phone}
        Size: {st.session_state.size}
        Address: {address}

        Style: White shirt and shorts with leopard billiard print.
        """
        msg.attach(MIMEText(body, "plain"))

        try:
            server = smtplib.SMTP(st.secrets["EMAIL_HOST"], st.secrets["EMAIL_PORT"])
            server.starttls()
            server.login(st.secrets["EMAIL_USER"], st.secrets["EMAIL_PASSWORD"])
            server.sendmail(st.secrets["EMAIL_USER"], STORE_EMAIL, msg.as_string())
            server.quit()
            st.success("📧 Order sent to Brilliants.Boutique!")
        except Exception as e:
            st.error(f"Email failed: {e}")

        # -- WhatsApp via Twilio --
        try:
            send_whatsapp_message(phone, name)
            st.success("✅ WhatsApp confirmation sent!")
        except Exception as e:
            st.error(f"WhatsApp send failed: {e}")

        st.session_state.step = "done"

# --- Twilio Send WhatsApp ---
def send_whatsapp_message(to_number, customer_name):
    account_sid = st.secrets["TWILIO_ACCOUNT_SID"]
    auth_token = st.secrets["TWILIO_AUTH_TOKEN"]
    from_whatsapp = st.secrets["TWILIO_PHONE"]
    media_url = "https://github.com/akmandala/mathmandala/blob/main/mockup_withShirt.PNG"  # host your mockup image publicly

    msg = f"Hi {customer_name}, this is Brilliants.Boutique 💎\n\nHere’s your style preview 👇\nLet us know if you'd like any changes."

    requests.post(
        f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json",
        auth=(account_sid, auth_token),
        data={
            "From": from_whatsapp,
            "To": f"whatsapp:{to_number}",
            "Body": msg,
            "MediaUrl": media_url
        }
    )
