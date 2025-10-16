import sys
import json

def forecast_guest(type="today"):
    return {"function": "forecast_guest", "type": type, "predicted": 42}

def forecast_check_ins(type="today"):
    return {"function": "forecast_check_ins", "type": type, "predicted_check_ins": 10}

# Map function names
methods = {
    "forecast_guest": forecast_guest,
    "forecast_check_ins": forecast_check_ins
}

if __name__ == "__main__":
    # 👇 This is where Python "receives" data from Express
    method_name = sys.argv[1] if len(sys.argv) > 1 else "forecast_guest"
    method_args = sys.argv[2:]  # optional additional arguments

    # Call the function dynamically
    if method_name in methods:
        result = methods[method_name](*method_args)
    else:
        result = {"error": f"Unknown method {method_name}"}

    # 👇 This is Python sending data back to Express (stdout)
    print(json.dumps(result))
