
from fastapi import FastAPI, Request
from mongo_config import (
    farmers_collection,
    scheme_collection
)
from twilio_sms import send_sms

app = FastAPI()


# ------------------------------------------------
# HOME ROUTE
# ------------------------------------------------
@app.get("/")
async def home():

    return {
        "message": "KrishiConnect Backend Running"
    }


# ------------------------------------------------
# FARMER DATA
# ------------------------------------------------
def get_farmer_crop_data(phone):

    clean_phone = phone[-10:]

    farmers = {

        # ------------------------------------------------
        # FARMER 1
        # ------------------------------------------------
        "9019263545": {

            "crop": "ಟೊಮೇಟೊ",

            "pani_no": "PNI2026001",

            "location_kn": "ರಾಮನಗರ",

            "price": "₹2840 ಪ್ರತಿ ಕ್ವಿಂಟಲ್",

            "language": "Kannada"
        },

        # ------------------------------------------------
        # FARMER 2
        # ------------------------------------------------
        "8217495270": {

            "crop": "ಅಕ್ಕಿ",

            "pani_no": "PNI2026002",

            "location_kn": "ಮಂಡ್ಯ",

            "price": "₹3200 ಪ್ರತಿ ಕ್ವಿಂಟಲ್",

            "language": "Kannada"
        },

        # ------------------------------------------------
        # FARMER 3
        # ------------------------------------------------
        "7483507306": {

            "crop": "ಮೆಕ್ಕೆಜೋಳ",

            "pani_no": "PNI2026003",

            "location_kn": "ಹಾಸನ",

            "price": "₹2100 ಪ್ರತಿ ಕ್ವಿಂಟಲ್",

            "language": "Kannada"
        },

        # ------------------------------------------------
        # FARMER 4
        # ------------------------------------------------
        "8123796771": {

            "crop": "ಮೆಕ್ಕೆಜೋಳ",

            "pani_no": "PNI2026004",

            "location_kn": "ಹಾಸನ",

            "price": "₹2100 ಪ್ರತಿ ಕ್ವಿಂಟಲ್",

            "language": "Kannada"
        }
    }

    # ------------------------------------------------
    # DEFAULT FARMER
    # ------------------------------------------------
    default_farmer = {

        "crop": "ಟೊಮೇಟೊ",

        "pani_no": "PNI9999999",

        "location_kn": "ಕರ್ನಾಟಕ",

        "price": "₹2500 ಪ್ರತಿ ಕ್ವಿಂಟಲ್",

        "language": "Kannada"
    }

    # ------------------------------------------------
    # GET FARMER
    # ------------------------------------------------
    farmer_data = farmers.get(
        clean_phone,
        default_farmer
    )

    # ------------------------------------------------
    # GET SCHEME
    # ------------------------------------------------
    scheme = scheme_collection.find_one({
        "active": True
    })

    # ------------------------------------------------
    # DEFAULT SCHEME
    # ------------------------------------------------
    if scheme is None:

        scheme = {

            "name": "PM Kisan",

            "apply_url": "https://pmkisan.gov.in"
        }

    # ------------------------------------------------
    # RETURN DATA
    # ------------------------------------------------
    return {

        "crop": farmer_data["crop"],

        "location_kn": farmer_data["location_kn"],

        "price": farmer_data["price"],

        "scheme": scheme["name"],
        
        "pani_no": farmer_data["pani_no"],
        
        "language": farmer_data["language"]
    }


# ------------------------------------------------
# MISSED CALL WEBHOOK
# ------------------------------------------------
@app.api_route("/missedcall", methods=["GET", "POST"])
async def missed_call(request: Request):

    print("\n==============================")
    print("WEBHOOK HIT SUCCESSFULLY")
    print("==============================")

    # ------------------------------------------------
    # GET REQUEST
    # ------------------------------------------------
    if request.method == "GET":

        params = request.query_params

        print("Incoming Query Params:")
        print(dict(params))

        caller = params.get("From")

    # ------------------------------------------------
    # POST REQUEST
    # ------------------------------------------------
    else:

        form = await request.form()

        print("Incoming Form Data:")
        print(dict(form))

        caller = form.get("From")

    # ------------------------------------------------
    # VALIDATE NUMBER
    # ------------------------------------------------
    if not caller:

        return {
            "status": "failed",
            "reason": "No caller number"
        }

    # ------------------------------------------------
    # CLEAN NUMBER
    # ------------------------------------------------
    caller = caller[-10:]

    print(f"\nCaller Number: {caller}")

    # ------------------------------------------------
    # GET FARMER DATA
    # ------------------------------------------------
    crop_data = get_farmer_crop_data(caller)

    # ------------------------------------------------
    # SHORT SMS FORMAT
    # ------------------------------------------------
    sms = f"""
KrishiConnect

Crop: {crop_data['crop']}
Price: {crop_data['price']}
Place: {crop_data['location_kn']}

Scheme:
{crop_data['scheme']}
"""

    print("\n==============================")
    print("SMS CONTENT")
    print("==============================")
    print(sms)

    # ------------------------------------------------
    # SAVE / UPDATE FARMER
    # ------------------------------------------------
    existing_farmer = farmers_collection.find_one({
        "phone": caller
    })

    if not existing_farmer:

        farmers_collection.insert_one({

            "phone": caller,

            "crop": crop_data["crop"],

            "location_kn": crop_data["location_kn"],

            "price": crop_data["price"],
            
            "pani_no": crop_data["pani_no"],
            
            "language": crop_data["language"]
        })

        print("\nNEW FARMER SAVED")

    else:

        farmers_collection.update_one(
            {"phone": caller},
            {
                "$set": {

                    "crop": crop_data["crop"],

                    "location_kn": crop_data["location_kn"],

                    "price": crop_data["price"],
                    
                    "pani_no": crop_data["pani_no"],
                    
                    "language": crop_data["language"]
                }
            }
        )

        print("\nFARMER UPDATED")

    # ------------------------------------------------
    # SEND SMS
    # ------------------------------------------------
    print("\n==============================")
    print("SENDING SMS...")
    print("==============================")

    sms_status = send_sms(caller, sms)

    if sms_status:

        print("\nSMS SENT SUCCESSFULLY")

    else:

        print("\nSMS FAILED")

    return {
        "status": "success"
    }