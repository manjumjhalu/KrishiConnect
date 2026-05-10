from twilio.rest import Client


# ------------------------------------------------
# TWILIO CONFIG
# ------------------------------------------------
ACCOUNT_SID = "AC6f9c37473d3ebf96254e289fe3a48b8a"

AUTH_TOKEN = "765b17ed64cc862a0992aaeb94601e98"

TWILIO_PHONE_NUMBER = "+17542893628"


# ------------------------------------------------
# SEND SMS FUNCTION
# ------------------------------------------------
def send_sms(to, message):

    try:

        # --------------------------------------------
        # CLEAN NUMBER
        # 09019263545 -> +919019263545
        # --------------------------------------------
        clean_number = "+91" + to[-10:]

        print("\n==============================")
        print("SENDING TWILIO SMS")
        print("==============================")
        print(f"TO: {clean_number}")
        print(f"MESSAGE: {message}")

        # --------------------------------------------
        # CREATE CLIENT
        # --------------------------------------------
        client = Client(
            ACCOUNT_SID,
            AUTH_TOKEN
        )

        # --------------------------------------------
        # SEND SMS
        # --------------------------------------------
        sms = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=clean_number
        )

        print("\n==============================")
        print("TWILIO SMS SENT SUCCESSFULLY")
        print("==============================")
        print(f"SID: {sms.sid}")

        return True

    except Exception as e:

        print("\n==============================")
        print("TWILIO SMS ERROR")
        print("==============================")
        print(str(e))

        return False