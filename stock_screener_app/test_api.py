import requests

try:
    res = requests.post('https://new-financial.onrender.com/api/chat', json={"message": "hello", "language": "he"})
    print(res.text)
except Exception as e:
    print(e)
