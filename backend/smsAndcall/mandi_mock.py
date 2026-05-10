

# # def get_farmer_crop_data(phone):

# #     # ---------------------------------------------------
# #     # SAMPLE FARMER DATA
# #     # ---------------------------------------------------

# #     sample_data = {

# #         "crop": "ಟೊಮೇಟೊ",

# #         "pani_no": "PNI2026001",

# #         "location": "ತುಮಕೂರು",

# #         "price": "₹2450 ಪ್ರತಿ ಕ್ವಿಂಟಲ್",

# #         "language": "Kannada"
# #     }

# #     return sample_data







# def get_farmer_crop_data(phone):

#     # ---------------------------------------------------
#     # REMOVE COUNTRY CODE / EXTRA DIGITS
#     # ---------------------------------------------------
#     clean_phone = phone[-10:]

#     # ---------------------------------------------------
#     # FARMER DATABASE MOCK
#     # ---------------------------------------------------
#     farmers = {

#         # -----------------------------------------------
#         # FARMER 1
#         # -----------------------------------------------
#         "9019263545": {

#             "crop": "ಟೊಮೇಟೊ",

#             "pani_no": "PNI2026001",

#             "location": "ತುಮಕೂರು",

#             "price": "₹2450 ಪ್ರತಿ ಕ್ವಿಂಟಲ್",

#             "language": "Kannada"
#         },

#         # -----------------------------------------------
#         # FARMER 2
#         # -----------------------------------------------
#         "8217495270": {

#             "crop": "ಅಕ್ಕಿ",

#             "pani_no": "PNI2026002",

#             "location": "ಮಂಡ್ಯ",

#             "price": "₹3200 ಪ್ರತಿ ಕ್ವಿಂಟಲ್",

#             "language": "Kannada"
#         },

#         # -----------------------------------------------
#         # FARMER 3
#         # -----------------------------------------------
#         "7483507306": {

#             "crop": "ಮೆಕ್ಕೆಜೋಳ",

#             "pani_no": "PNI2026003",

#             "location": "ಹಾಸನ",

#             "price": "₹2100 ಪ್ರತಿ ಕ್ವಿಂಟಲ್",

#             "language": "Kannada"
#         }
#     }

#     # ---------------------------------------------------
#     # RETURN MATCHING FARMER
#     # ---------------------------------------------------
#     if clean_phone in farmers:

#         return farmers[clean_phone]

#     # ---------------------------------------------------
#     # DEFAULT FARMER DATA
#     # ---------------------------------------------------
#     return {

#         "crop": "ಟೊಮೇಟೊ",

#         "pani_no": "PNI9999999",

#         "location": "ಕರ್ನಾಟಕ",

#         "price": "₹2500 ಪ್ರತಿ ಕ್ವಿಂಟಲ್",

#         "language": "Kannada"
#     }




from mongo_config import crop_collection, scheme_collection

def get_farmer_crop_data(phone):

    # ------------------------------------------------
    # GET TOMATO PRICE
    # ------------------------------------------------
    crop = crop_collection.find_one({
        "crop": "Tomato"
    })

    # ------------------------------------------------
    # GET ACTIVE SCHEME
    # ------------------------------------------------
    scheme = scheme_collection.find_one({
        "active": True
    })

    # ------------------------------------------------
    # RETURN DATA
    # ------------------------------------------------
    return {

        "crop": crop["crop"],

        "location": crop["district"],

        "price": f'₹{crop["price_modal"]} per quintal',

        "scheme": scheme["name"],

        "scheme_url": scheme["apply_url"]
    }