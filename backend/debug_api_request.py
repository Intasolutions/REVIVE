
import requests
import json

def test_checkout_external():
    # 1. Get a stock item ID first
    try:
        r_stock = requests.get('http://127.0.0.1:8000/api/pharmacy/stock/?page_size=1')
        stocks = r_stock.json().get('results', [])
        if not stocks:
            print("No stock found to test.")
            return
        
        stock_item = stocks[0]
        print(f"Using Stock: {stock_item['name']} (ID: {stock_item['id']})")
        
        # 2. Prepare Payload
        payload = {
            "visit": None, # Test walk-in first, or fetch a visit if needed
            "items": [
                {
                    "med_stock": stock_item['id'],
                    "qty": 1,
                    "unit_price": float(stock_item['selling_price'])
                }
            ],
            "payment_status": "PENDING"
        }
        
        print("Sending Payload:")
        print(json.dumps(payload, indent=2))
        
        # 3. POST
        url = 'http://127.0.0.1:8000/api/pharmacy/sales/'
        headers = {'Content-Type': 'application/json'}
        response = requests.post(url, json=payload, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        try:
            print("Response Body:")
            print(json.dumps(response.json(), indent=2))
        except:
            print("Response Text (Not JSON):")
            print(response.text[:500])
            
    except Exception as e:
        print(f"Script Error: {e}")

if __name__ == "__main__":
    test_checkout_external()
